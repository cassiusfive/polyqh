import os

from py_clob_client.client import ClobClient


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
    return ClobClient(
        host,
        key=key,
        chain_id=chain_id,
        signature_type=1,
        funder=POLYMARKET_PROXY_ADDRESS,
    )


client = get_client()
