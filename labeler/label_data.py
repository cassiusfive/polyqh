"""
Label scraped market data with spread prices and extract features for ML.
"""

import json
from pathlib import Path
from typing import Dict, List

import numpy as np
import pandas as pd

from labeler.spread_calculator import (
    calculate_optimal_spread_width,
    calculate_spread_metrics,
)


def extract_orderbook_features(orderbook: Dict) -> Dict:
    """Extract features from orderbook for ML training."""
    bids = orderbook.get("bids", [])
    asks = orderbook.get("asks", [])

    if not bids or not asks:
        return {}

    # best bid/ask
    best_bid = max(float(b["price"]) for b in bids)
    best_ask = min(float(a["price"]) for a in asks)

    # get sizes for best prices
    best_bid_size = next(float(b["size"]) for b in bids if float(b["price"]) == best_bid)
    best_ask_size = next(float(a["size"]) for a in asks if float(a["price"]) == best_ask)

    # spread
    spread = best_ask - best_bid
    spread_pct = (spread / best_bid * 100) if best_bid > 0 else 0

    # imbalance
    imbalance = (best_bid_size - best_ask_size) / (best_bid_size + best_ask_size)

    # depth (top 5 levels)
    depth = 5
    bid_depth = sum(float(b["size"]) for b in bids[:depth])
    ask_depth = sum(float(a["size"]) for a in asks[:depth])

    return {
        "best_bid": best_bid,
        "best_ask": best_ask,
        "best_bid_size": best_bid_size,
        "best_ask_size": best_ask_size,
        "spread": spread,
        "spread_pct": spread_pct,
        "imbalance": imbalance,
        "bid_depth_5": bid_depth,
        "ask_depth_5": ask_depth,
        "total_depth_5": bid_depth + ask_depth,
    }


def extract_trade_features(trades: List[Dict]) -> Dict:
    """Extract features from recent trades."""
    if not trades:
        return {
            "recent_trades_count": 0,
            "recent_volume": 0,
            "recent_avg_price": 0,
            "price_volatility": 0,
            "buy_sell_ratio": 0,
        }

    volumes = [float(t.get("size", 0)) for t in trades]
    prices = [float(t.get("price", 0)) for t in trades]

    total_volume = sum(volumes)
    avg_price = (
        sum(p * v for p, v in zip(prices, volumes)) / total_volume if total_volume > 0 else 0
    )

    price_volatility = float(np.std(prices)) if len(prices) > 1 else 0

    # buy/sell ratio
    buy_volume = sum(v for t, v in zip(trades, volumes) if t.get("side") == "BUY")
    sell_volume = sum(v for t, v in zip(trades, volumes) if t.get("side") == "SELL")
    buy_sell_ratio = buy_volume / sell_volume if sell_volume > 0 else 1.0

    return {
        "recent_trades_count": len(trades),
        "recent_volume": total_volume,
        "recent_avg_price": avg_price,
        "price_volatility": price_volatility,
        "buy_sell_ratio": buy_sell_ratio,
    }


def label_market_data(data_file: Path, spread_method: str = "micro_price") -> Dict:
    """Process a market data file and add spread price labels."""

    with open(data_file, "r") as f:
        data = json.load(f)

    market_info = data.get("market_info", {})
    orderbooks = data.get("orderbooks", [])
    trades = data.get("trades", [])
    timestamp = data.get("timestamp", "")

    # get first orderbook (or iterate through all for time series)
    orderbook = orderbooks[0] if orderbooks else {}

    # calculate label (optimal spread WIDTH for market making)
    optimal_spread = calculate_optimal_spread_width(orderbook)

    if optimal_spread is None:
        return {}

    # extract features
    features = {
        "market_id": market_info.get("id", ""),
        "question": market_info.get("question", ""),
        "liquidity": market_info.get("liquidityClob", 0),
        "timestamp": timestamp,
        **extract_orderbook_features(orderbook),
        **extract_trade_features(trades),
        "optimal_spread_width": optimal_spread,
    }

    # add spread price metrics for reference
    spread_metrics = calculate_spread_metrics(orderbook)
    features.update({f"metric_{k}": v for k, v in spread_metrics.items()})

    return features


def label_all_data(
    data_dir: Path = Path("data/raw"),
    output_file: Path = Path("data/labeled_dataset.csv"),
    spread_method: str = "micro_price",
):
    """Process all scraped data files and create labeled dataset."""

    data_files = list(data_dir.glob("*.json"))

    if not data_files:
        print(f"No data files found in {data_dir}")
        return

    labeled_data = []
    for data_file in data_files:
        features = label_market_data(data_file, spread_method)

        if features:
            labeled_data.append(features)

    if not labeled_data:
        print("No data was successfully labeled")
        return

    df = pd.DataFrame(labeled_data)

    df = df.dropna(subset=["optimal_spread_width"])

    df.to_csv(output_file, index=False)
    print(f"Saved {len(df)} labeled samples to {output_file}")

    return df


if __name__ == "__main__":
    label_all_data()
