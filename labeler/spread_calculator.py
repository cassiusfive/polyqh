"""
Spread calculation utilities for labeling trading data.

Common spread metrics:
- Mid price: (best_bid + best_ask) / 2
- Volume-weighted mid price: weighted by size at best levels
- Micro-price: weighted by depth on both sides
"""

from typing import Dict, Optional


def calculate_mid_price(orderbook: Dict) -> Optional[float]:
    """Calculate simple mid-price from best bid and ask."""
    try:
        bids = orderbook.get("bids", [])
        asks = orderbook.get("asks", [])

        if not bids or not asks:
            return None

        best_bid = float(bids[0]["price"])
        best_ask = float(asks[0]["price"])

        return (best_bid + best_ask) / 2
    except (KeyError, IndexError, ValueError):
        return None


def calculate_volume_weighted_mid(orderbook: Dict, depth: int = 5) -> Optional[float]:
    """
    Calculate volume-weighted mid price using top N levels.

    Args:
        orderbook: Orderbook data with bids and asks
        depth: Number of levels to consider (default 5)
    """
    try:
        bids = orderbook.get("bids", [])[:depth]
        asks = orderbook.get("asks", [])[:depth]

        if not bids or not asks:
            return None

        # Calculate weighted bid
        bid_total_volume = sum(float(b["size"]) for b in bids)
        if bid_total_volume == 0:
            return None
        weighted_bid = sum(float(b["price"]) * float(b["size"]) for b in bids) / bid_total_volume

        # Calculate weighted ask
        ask_total_volume = sum(float(a["size"]) for a in asks)
        if ask_total_volume == 0:
            return None
        weighted_ask = sum(float(a["price"]) * float(a["size"]) for a in asks) / ask_total_volume

        return (weighted_bid + weighted_ask) / 2
    except (KeyError, ValueError):
        return None


def calculate_micro_price(orderbook: Dict) -> Optional[float]:
    """
    Calculate micro-price weighted by liquidity on both sides.

    Formula: (best_bid * ask_size + best_ask * bid_size) / (bid_size + ask_size)
    """
    try:
        bids = orderbook.get("bids", [])
        asks = orderbook.get("asks", [])

        if not bids or not asks:
            return None

        best_bid = float(bids[0]["price"])
        best_ask = float(asks[0]["price"])
        bid_size = float(bids[0]["size"])
        ask_size = float(asks[0]["size"])

        total_size = bid_size + ask_size
        if total_size == 0:
            return None

        return (best_bid * ask_size + best_ask * bid_size) / total_size
    except (KeyError, IndexError, ValueError):
        return None


def calculate_spread_metrics(orderbook: Dict) -> Dict[str, Optional[float]]:
    """Calculate all spread metrics for a given orderbook."""
    return {
        "mid_price": calculate_mid_price(orderbook),
        "volume_weighted_mid": calculate_volume_weighted_mid(orderbook),
        "micro_price": calculate_micro_price(orderbook),
    }


def get_best_spread_price(orderbook: Dict, method: str = "micro_price") -> Optional[float]:
    """
    Get the best spread price using specified method.

    Args:
        orderbook: Orderbook data
        method: One of 'mid_price', 'volume_weighted_mid', 'micro_price'

    Returns:
        Calculated spread price or None if calculation fails
    """
    methods = {
        "mid_price": calculate_mid_price,
        "volume_weighted_mid": calculate_volume_weighted_mid,
        "micro_price": calculate_micro_price,
    }

    calc_func = methods.get(method)
    if calc_func is None:
        raise ValueError(f"Unknown method: {method}. Choose from {list(methods.keys())}")

    return calc_func(orderbook)


def calculate_optimal_spread_width(orderbook: Dict, min_order_size: float = 5) -> Optional[float]:
    """
    Calculate the optimal spread WIDTH for market making.

    Simple simulation-based approach:
    - Tests different spread widths
    - Estimates fill probability based on orderbook competition
    - Returns the spread that maximizes expected profit

    Args:
        orderbook: Orderbook data with bids and asks
        min_order_size: Minimum order size for trades

    Returns:
        Optimal spread width (e.g., 0.02 = 2 cents) or None
    """
    midpoint = calculate_mid_price(orderbook)
    if not midpoint:
        return None

    best_spread = None
    best_score = -1

    # Test spread widths from 1% to 20%
    for spread_bps in range(100, 2000, 100):  # 1% to 20% in 1% increments
        spread = spread_bps / 10000  # Convert basis points to decimal

        # Where we'd place our quotes
        our_bid = midpoint - (spread / 2)
        our_ask = midpoint + (spread / 2)

        # Count competitors with better prices
        bids = orderbook.get("bids", [])
        asks = orderbook.get("asks", [])

        bid_competition = sum(1 for b in bids if float(b["price"]) > our_bid)
        ask_competition = sum(1 for a in asks if float(a["price"]) < our_ask)

        # Fill probability decreases with more competition
        # Simple heuristic: 100% at 0 competitors, 0% at 10+ competitors
        max_competitors = 10
        bid_fill_prob = max(0, min(1, 1 - (bid_competition / max_competitors)))
        ask_fill_prob = max(0, min(1, 1 - (ask_competition / max_competitors)))

        # Expected profit = spread * size * probability of both sides filling
        round_trip_prob = bid_fill_prob * ask_fill_prob
        expected_profit = spread * min_order_size * round_trip_prob

        # Score: balance profit and fill rate
        # Penalize very wide spreads even if profitable
        score = expected_profit * (1 / (1 + spread * 10))  # Decay for wide spreads

        if score > best_score:
            best_score = score
            best_spread = spread

    return best_spread
