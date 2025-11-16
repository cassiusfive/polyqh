import os

from dotenv import load_dotenv
from py_clob_client.client import ClobClient

load_dotenv()

HOST = "https://clob.polymarket.com"
CHAIN_ID = 137

PRIVATE_KEY = os.environ.get("POLYMARKET_PRIVATE_KEY")
PROXY_ADDRESS = os.environ.get("POLYMARKET_PROXY_ADDRESS")

if not PRIVATE_KEY or not PROXY_ADDRESS:
    raise ValueError(
        "Missing required environment variables. Please add to .env file:\n"
        "  POLYMARKET_PRIVATE_KEY=your_private_key_here\n"
        "  POLYMARKET_PROXY_ADDRESS=your_proxy_address_here"
    )


def _create_client() -> ClobClient:
    client = ClobClient(
        HOST,
        key=PRIVATE_KEY,
        chain_id=CHAIN_ID,
        signature_type=1,
        funder=PROXY_ADDRESS,
    )
    client.set_api_creds(client.create_or_derive_api_creds())
    return client


# shared singleton client instance
client = _create_client()
