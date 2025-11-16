from asyncio import sleep
from dataclasses import dataclass
from typing import Optional

from py_clob_client.clob_types import (
    BalanceAllowanceParams,
    OpenOrderParams,
    OrderArgs,
    OrderType,
)
from py_clob_client.order_builder.constants import BUY, SELL

from core.polymarket import client, get_position


@dataclass
class MarketMakerConfig:
    market_address: str
    token_id: str
    update_interval: int
    target_position: float = 0.0  # Target inventory level
    max_position: float = 100.0  # Maximum position size
    position_skew_threshold: float = 0.3  # Trigger rebalancing at 30% of max
    base_spread_width: float = 0.05


class MarketMaker:
    def __init__(self, config: MarketMakerConfig):
        self.config = config
        self.position = None
        self.buy_order_id = None
        self.sell_order_id = None
        self.active_orders = []
        self.last_spread_width = None
        self.last_buy_size = None
        self.last_sell_size = None

    @classmethod
    async def create(cls, config: MarketMakerConfig):
        """Factory method to create and initialize MarketMaker"""
        instance = cls(config)
        await instance.update_state()
        return instance

    def get_position_skew(self) -> float:
        """Calculate how far current position deviates from target"""
        if self.position is None:
            return 0.0
        current_pos = get_position(self.config.market_address)
        return current_pos - self.config.target_position

    def needs_rebalancing(self) -> bool:
        """Determine if position needs rebalancing"""
        skew = abs(self.get_position_skew())
        threshold = self.config.max_position * self.config.position_skew_threshold
        return skew > threshold

    def spread_changed(self) -> bool:
        """Check if spread parameters have changed since last update"""
        spread_width = self.calculate_spread_width()
        buy_size, sell_size = self.calculate_order_sizes()

        if self.last_spread_width is None:
            return True

        # Check if any parameter has changed
        spread_changed = abs(spread_width - self.last_spread_width) > 0.0001
        buy_size_changed = abs(buy_size - self.last_buy_size) > 0.01
        sell_size_changed = abs(sell_size - self.last_sell_size) > 0.01

        return spread_changed or buy_size_changed or sell_size_changed

    def calculate_spread_width(self) -> float:
        """
        Calculate symmetric spread based on base width.
        """
        return self.config.base_spread_width

    def calculate_order_sizes(self) -> tuple[float, float]:
        """
        Calculate order sizes based on position.
        Reduce size on the side we're already exposed to.
        """
        base_size = 5.0
        skew = self.get_position_skew()
        skew_ratio = skew / self.config.max_position

        # If we're long (positive skew), reduce buy size and increase sell size
        buy_size_multiplier = max(0.2, 1 - skew_ratio)
        sell_size_multiplier = max(0.2, 1 + skew_ratio)

        buy_size = base_size * buy_size_multiplier
        sell_size = base_size * sell_size_multiplier

        return max(5, round(buy_size)), max(5, round(sell_size))

    async def cancel_all_orders(self):
        """Cancel all active orders"""
        try:
            client.cancel_market_orders(asset_id=self.config.token_id)
            self.buy_order_id = None
            self.sell_order_id = None
            self.active_orders = []
        except Exception as e:
            print(f"Error canceling orders: {e}")

    async def rebalance_position(self):
        """Execute rebalancing trade to move closer to target position"""
        skew = self.get_position_skew()

        if abs(skew) < 1:  # Don't rebalance for tiny positions
            return

        midpoint = await self.get_midpoint()

        # If we're long, place aggressive sell order
        # If we're short, place aggressive buy order
        if skew > 0:
            # We're long, need to sell
            rebalance_size = min(abs(skew), 10)  # Rebalance in chunks
            rebalance_price = midpoint - 0.01  # Aggressive pricing
            print(f"Rebalancing: Selling {rebalance_size} at {rebalance_price}")
            self.place_order(rebalance_price, rebalance_size, SELL)
        else:
            # We're short, need to buy
            rebalance_size = min(abs(skew), 10)
            rebalance_price = midpoint + 0.01
            print(f"Rebalancing: Buying {rebalance_size} at {rebalance_price}")
            self.place_order(rebalance_price, rebalance_size, BUY)

    async def update(self):
        """Main update loop"""
        await self.update_state()

        # Check if we need to rebalance
        if self.needs_rebalancing():
            print(f"Position skew detected: {self.get_position_skew():.2f}")
            await self.cancel_all_orders()
            await self.rebalance_position()
            await sleep(5)  # Wait for rebalance order to execute
            await self.update_state()
            # After rebalancing, force new orders
            self.last_spread_width = None

        # Only cancel and replace orders if spread parameters have changed
        if self.spread_changed():
            print("Spread parameters changed, updating orders")
            await self.cancel_all_orders()
            await self.place_market_making_orders()
        else:
            print("Spread unchanged, keeping existing orders")

    async def place_market_making_orders(self):
        """Place buy and sell orders with calculated spreads and sizes"""
        midpoint = await self.get_midpoint()
        spread_width = self.calculate_spread_width()
        buy_size, sell_size = self.calculate_order_sizes()

        buy_price = midpoint - spread_width
        sell_price = midpoint + spread_width

        print(
            f"Placing orders - Buy: {buy_size}@{buy_price:.4f}, Sell: {sell_size}@{sell_price:.4f}"
        )

        try:
            buy_order = self.place_order(buy_price, buy_size, BUY)
            sell_order = self.place_order(sell_price, sell_size, SELL)

            print(buy_order)
            print(sell_order)

            self.buy_order_id = buy_order["orderID"]  # pyright: ignore
            self.sell_order_id = sell_order["orderID"]  # pyright: ignore

            # Save current spread parameters
            self.last_spread_width = spread_width
            self.last_buy_size = buy_size
            self.last_sell_size = sell_size
        except Exception as e:
            print(f"Error placing orders: {e}")

    async def update_state(self):
        """Update current position and active orders"""
        self.position = get_position(self.config.market_address)
        self.active_orders = client.get_orders(
            params=OpenOrderParams(asset_id=self.config.token_id)
        )

    async def run(self):
        """Main loop"""
        while True:
            try:
                await self.update()
            except Exception as e:
                print(f"Error in update loop: {e}")
            await sleep(self.config.update_interval)

    async def get_midpoint(self) -> float:
        """Get current market midpoint"""
        return float(client.get_midpoint(self.config.token_id)["mid"])  # pyright: ignore

    async def get_spread(self):
        """Get current bid/ask spread (legacy method)"""
        midpoint = await self.get_midpoint()
        spread_width = self.calculate_spread_width()
        return (midpoint - spread_width, midpoint + spread_width)

    def place_order(self, price, size, side):
        """Place an order on the market"""
        order = OrderArgs(self.config.token_id, price=price, size=size, side=side)
        signed = client.create_order(order)
        return client.post_order(signed, OrderType.GTC)  # pyright: ignore

    async def test(self):
        """Test method for initial order placement"""
