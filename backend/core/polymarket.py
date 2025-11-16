import os

import requests
from dotenv import load_dotenv
from py_clob_client.client import ClobClient

load_dotenv()


def get_client():
    host: str = "https://clob.polymarket.com"
    key: str = os.environ[
        "POLYMARKET_PRIVATE_KEY"
    ]  # This is your Private Key. Export from https://reveal.magic.link/polymarket or from your Web3 Extension
    chain_id: int = 137  # No need to adjust this
    POLYMARKET_PROXY_ADDRESS: str = os.environ[
        "POLYMARKET_PROXY_ADDRESS"
    ]  # This is the address listed below your profile picture when using the Polymarket site.

    ### Initialization of a client using a Polymarket Proxy associated with an Email/Magic account. If you login with your email use this example.
    client = ClobClient(
        host,
        key=key,
        chain_id=chain_id,
        signature_type=1,
        funder=POLYMARKET_PROXY_ADDRESS,
    )

    client.set_api_creds(client.create_or_derive_api_creds())

    return client


def get_position(market_address):
    url = "https://data-api.polymarket.com/value"

    querystring = {
        "user": os.environ["POLYMARKET_PROXY_ADDRESS"],
        "market": market_address,
    }

    response = requests.get(url, params=querystring)

    return response.json()[0]["value"]


client = get_client()
