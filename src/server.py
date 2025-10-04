"""Minimal FastAPI application that serves the NASA Sky Explorer Prototype website."""

from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse

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


@app.get("/aladin")
async def aladin() -> FileResponse:
    """Serve the Aladin viewer page."""
    return FileResponse("web/aladin.html")

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "src.server:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
    )
