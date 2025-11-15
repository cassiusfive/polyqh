from dotenv import load_dotenv
from fastapi import FastAPI

from polymarket import client

load_dotenv()

app = FastAPI()

MARKET_SLUGS = [""]


@app.get("/")
async def root():
    return {"message": "Hello World"}


@app.get("/place_order")
async def orders():
    return {"message": "deez orders"}
