import json
from datetime import datetime
from pathlib import Path

import requests

OUTPUT_DIR = Path("data/raw")
OUTPUT_DIR.mkdir(exist_ok=True, parents=True)

GAMMA_API = "https://gamma-api.polymarket.com"
CLOB_API = "https://clob.polymarket.com"
DATA_API = "https://data-api.polymarket.com"


def scrape_all_markets():
    """Scrape orderbook data for markets (simplified for hackathon)"""
    print("Fetching markets from Gamma API...")

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

    print(f"Found {len(markets)} markets (liquidity > $5k, volume > $1k)")

    for m in markets:
        condition_id = m["conditionId"]
        question = m["question"]
        clob_token_ids = m.get("clobTokenIds", "")
        token_ids = json.loads(clob_token_ids) if clob_token_ids else []

        print(f"\nMarket: {question}")
        print(f"Condition ID: {condition_id}")

        scrape_market(condition_id, token_ids, m)


def scrape_market(condition_id: str, token_ids: list, market_info: dict):
    """Get orderbook snapshot and trades for each token in the market"""

    orderbooks = []

    for i, token_id in enumerate(token_ids):
        outcome = f"Outcome {i + 1}"

        print(f"  Fetching orderbook for {outcome}...")
        response = requests.get(f"{CLOB_API}/book", params={"token_id": token_id})
        response.raise_for_status()
        orderbook = response.json()
        orderbooks.append(orderbook)
        print("    ✓ Got orderbook")

    # Fetch recent trades for this market
    print(f"  Fetching recent trades...")
    trades = []
    try:
        response = requests.get(
            f"{DATA_API}/trades",
            params={
                "market": condition_id,
                "limit": 100,  # Get last 100 trades
            },
        )
        response.raise_for_status()
        trades = response.json()
        print(f"    ✓ Got {len(trades)} trades")
    except Exception as e:
        print(f"    ⚠ Could not fetch trades: {e}")

    out = {
        "market_info": market_info,
        "orderbooks": orderbooks,
        "trades": trades,
        "timestamp": datetime.utcnow().isoformat(),
    }

    out_file = OUTPUT_DIR / f"{condition_id}.json"
    out_file.write_text(json.dumps(out, indent=2))

    print(f"\n✓ Saved → {out_file}")


if __name__ == "__main__":
    scrape_all_markets()
