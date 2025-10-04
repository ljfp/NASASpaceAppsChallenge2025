"""Minimal FastAPI application that serves the NASA Sky Explorer Prototype website."""

from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse

BASE_DIR = Path(__file__).resolve().parent.parent
WEB_DIR = BASE_DIR / "web"
INDEX_PATH = WEB_DIR / "index.html"
ALADIN_PATH = WEB_DIR / "aladin.html"

app = FastAPI(title="NASA Sky Explorer Prototype")


def _read_html(path: Path) -> str:
    if not path.exists():
        raise HTTPException(status_code=404, detail=f"{path.name} not found")
    return path.read_text(encoding="utf-8")


@app.get("/", response_class=HTMLResponse)
def read_index() -> str:
    """Return the contents of the bundled ``index.html`` file."""

    return _read_html(INDEX_PATH)


@app.get("/aladin", response_class=HTMLResponse)
def read_aladin() -> str:
    """Serve the Aladin viewer page."""

    return _read_html(ALADIN_PATH)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "src.server:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
    )
