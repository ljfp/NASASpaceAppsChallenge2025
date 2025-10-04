"""Minimal FastAPI application that serves a static HTML homepage for the NASA Sky Explorer Prototype."""

from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse

BASE_DIR = Path(__file__).resolve().parent.parent
WEB_DIR = BASE_DIR / "web"
INDEX_PATH = WEB_DIR / "index.html"

app = FastAPI(title="NASA Sky Explorer Prototype")


@app.get("/", response_class=HTMLResponse)
def read_index() -> str:
    """Return the contents of the bundled ``index.html`` file."""


@app.get("/aladin")
async def aladin() -> FileResponse:
    return FileResponse("web/aladin.html")


@app.get("/")
async def root() -> JSONResponse:
    return JSONResponse({"status": "ok", "message": "Visit /app for the prototype UI."})

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "src.server:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
    )
