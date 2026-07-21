from fastapi import FastAPI

app = FastAPI(title="Acing IU Genesis API")


@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "genesis-api"}
