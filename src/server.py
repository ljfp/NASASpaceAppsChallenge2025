"""Minimal FastAPI application that serves the NASA Sky Explorer Prototype website."""

from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse

BASE_DIR = Path(__file__).resolve().parent.parent
WEB_DIR = BASE_DIR / "web"
INDEX_PATH = WEB_DIR / "index.html"

app = FastAPI(title="NASA Sky Explorer Prototype")


@app.get("/", response_class=HTMLResponse)
def read_index() -> str:
    """Return the contents of the bundled ``index.html`` file."""

    if not INDEX_PATH.exists():
        raise HTTPException(status_code=404, detail="index.html not found")
    return INDEX_PATH.read_text(encoding="utf-8")



if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "src.server:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
    )
