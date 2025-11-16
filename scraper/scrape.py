import json
from datetime import datetime
from pathlib import Path

import requests

OUTPUT_DIR = Path("data/raw")
OUTPUT_DIR.mkdir(exist_ok=True, parents=True)

GAMMA_API = "https://gamma-api.polymarket.com"
CLOB_API = "https://clob.polymarket.com"
DATA_API = "https://data-api.polymarket.com"


def get_all_markets():
    """Fetch all markets"""
    print("Fetching markets...")

    params = {
        "closed": False,
        "order": "createdAt",
        "ascending": False,
        "limit": 100,
        "liquidity_num_min": 500_000,
        "volume_num_min": 100_000,
    }

    response = requests.get(f"{GAMMA_API}/markets", params=params)
    response.raise_for_status()
    markets = response.json()

    print(f"Found {len(markets)} markets\n")

    return markets


def get_market(market_id: int):
    """Fetch a market by id"""
    print(f"Fetching market {market_id}...")

    response = requests.get(f"{GAMMA_API}/markets/{id}")
    response.raise_for_status()
    return response.json()


def get_market_details(market):
    """Get orderbook snapshot and trades for each token in the market"""
    print("Fetching market data...")

    orderbooks = []

    condition_id = market["conditionId"]
    token_ids = json.loads(market["clobTokenIds"])

    print("    Fetching orderbooks...")
    for token_id in token_ids:
        response = requests.get(f"{CLOB_API}/book", params={"token_id": token_id})
        response.raise_for_status()
        orderbook = response.json()
        orderbooks.append(orderbook)

    print(f"    Found {len(orderbooks)} orderbooks")
    print("    Fetching recent trades...")

    trades = []
    response = requests.get(
        f"{DATA_API}/trades",
        params={
            "market": condition_id,
            "limit": 100,
        },
    )
    response.raise_for_status()
    trades = response.json()
    print(f"    Found {len(trades)} trades")

    return {
        "market_info": market,
        "orderbooks": orderbooks,
        "trades": trades,
        "timestamp": datetime.now().isoformat(),
    }


def scrape_markets():
    markets = get_all_markets()

    for market in markets:
        data = get_market_details(market)
        out_file = OUTPUT_DIR / f"{market['conditionId']}.json"
        out_file.write_text(json.dumps(data, indent=2))

        print(f"    Saved → {out_file}\n")


if __name__ == "__main__":
    scrape_markets()
