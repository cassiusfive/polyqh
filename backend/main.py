import asyncio
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from strategies.market_maker import MarketMaker, MarketMakerConfig


@asynccontextmanager
async def lifespan(app: FastAPI):
    maker = await MarketMaker.create(
        MarketMakerConfig(
            market_id=559690,
            market_address="0xcb111226a8271fed0c71bb5ec1bd67b2a4fd72f1eb08466e2180b9efa99d3f32",
            token_id="87769991026114894163580777793845523168226980076553814689875238288185044414090",
            update_interval=1,
        )
    )

    trading_task = asyncio.create_task(maker.run())

    yield

    trading_task.cancel()


app = FastAPI(lifespan=lifespan)


@app.get("/")
async def root():
    return {"message": "Hello World"}
