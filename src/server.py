"""Minimal FastAPI application that serves the NASA Sky Explorer Prototype website."""

from pathlib import Path

import requests

from fastapi import FastAPI, HTTPException, Response, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles

BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR / "CosmoView" / "dist" / "public"
WEB_DIR = BASE_DIR / "web"
INDEX_PATH = FRONTEND_DIR / "index.html"
ALADIN_PATH = WEB_DIR / "aladin.html"
FAVICON_SVG = (
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'>\n"
    "<rect width='32' height='32' rx='8' fill='#0f172a'/>\n"
    "<path fill='#facc15' d='M16 4l3.4 7 7.6.7-5.8 5.2 1.8 7.6-7-4.2-7 4.2 "
    "1.8-7.6-5.8-5.2 7.6-.7z'/>\n"
    "</svg>"
)

if not INDEX_PATH.exists():
    raise RuntimeError(
        "Frontend bundle not found. Run 'npm run build' in the CosmoView directory "
        "to generate dist/public before starting the API server."
    )

ASSETS_DIR = FRONTEND_DIR / "assets"
if not ASSETS_DIR.exists():
    raise RuntimeError(
        "Frontend assets directory missing. Ensure the CosmoView build succeeded "
        "and dist/public/assets is present."
    )

app = FastAPI(title="NASA Sky Explorer Prototype")
app.mount("/assets", StaticFiles(directory=ASSETS_DIR), name="frontend-assets")
app.mount("/static", StaticFiles(directory=BASE_DIR / "static"), name="legacy-static")


def _read_html(path: Path) -> str:
    if not path.exists():
        raise HTTPException(status_code=404, detail=f"{path.name} not found")
    return path.read_text(encoding="utf-8")


@app.get("/", response_class=HTMLResponse)
def read_index() -> str:
    """Return the contents of the bundled ``index.html`` file."""

    return _read_html(INDEX_PATH)


@app.get("/aladin", response_class=HTMLResponse)
@app.get("/aladin/", response_class=HTMLResponse)
def read_aladin() -> str:
    """Serve the Aladin viewer page."""

    return _read_html(ALADIN_PATH)


@app.get("/favicon.ico", include_in_schema=False)
def favicon() -> Response:
    """Return a small SVG favicon to satisfy browser requests."""

    return Response(content=FAVICON_SVG, media_type="image/svg+xml")


@app.get("/proxy/", include_in_schema=False)
def proxy(request: Request) -> Response:
    """Proxy requests to avoid CORS"""
    request = requests.get(request.query_params["q"])
    if request.status_code != 200:
        raise HTTPException(status_code=404, detail="Can't request url.")
    return Response(content=request.content, media_type="text/html")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "src.server:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
    )
