import asyncio
from contextlib import asynccontextmanager

from core.polymarket import client
from fastapi import FastAPI
from strategies.market_maker import MarketMaker, MarketMakerConfig

MARKET_MAKER_CONFIG = MarketMakerConfig(
    market_id=559690,
    market_address="0xcb111226a8271fed0c71bb5ec1bd67b2a4fd72f1eb08466e2180b9efa99d3f32",
    token_id="87769991026114894163580777793845523168226980076553814689875238288185044414090",
    update_interval=10,
)

GEMINI_MARKET_CONFIG = MarketMakerConfig(
    market_id=667232,
    market_address="0xba1d8294981a89bc42520fe65c234684a64a6643fea82de99cac50b869f286e3",
    token_id="27118005682285918993655007097581489752967238777541949407788676156434813461406",
    update_interval=10,
)

TIMES_MARKET_CONFIG = MarketMakerConfig(
    market_id=555826,
    market_address="0x850c1624dc9d8ca9850195df05293ff85273e6b92e89a9551cd0a57c2f72aceb",
    token_id="97738289848450488297763027547275619371606557963137023790940218654157116963791",
    update_interval=10,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    maker = await MarketMaker.create(TIMES_MARKET_CONFIG)

    trading_task = asyncio.create_task(maker.run())

    yield

    trading_task.cancel()


app = FastAPI(lifespan=lifespan)
