from fastapi import FastAPI

app = FastAPI()


@app.get("/")
async def root():
    return {"message": "Hello World"}


@app.get("/orders")
async def orders():
    return {"message": "deez orders"}
