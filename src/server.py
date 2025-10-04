"""FastAPI service that proxies NASA SkyView tiles and serves the prototype UI."""
from __future__ import annotations

import asyncio
import logging
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, Response
from fastapi.staticfiles import StaticFiles

from .skyview_downloader import fetch_survey_image

BASE_DIR = Path(__file__).resolve().parent.parent
WEB_DIR = BASE_DIR / "web"
OUTPUT_DIR = BASE_DIR / "outputs"
FAVICON_PATH = WEB_DIR / "favicon.ico"

logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

app = FastAPI(title="NASA SkyView Prototype", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if WEB_DIR.exists():
    app.mount("/app", StaticFiles(directory=WEB_DIR, html=True), name="app")


@app.get("/favicon.ico", include_in_schema=False)
async def favicon() -> Response:
    if FAVICON_PATH.exists():
        return FileResponse(FAVICON_PATH)
    return Response(status_code=204)


@app.get("/")
async def root() -> JSONResponse:
    return JSONResponse({"status": "ok", "message": "Visit /app for the prototype UI."})


@app.get("/tile")
async def get_tile(
    target: Optional[str] = Query(None, description="Named target resolvable by SIMBAD/NED"),
    ra: Optional[float] = Query(None, description="Right ascension in decimal degrees"),
    dec: Optional[float] = Query(None, description="Declination in decimal degrees"),
    width: float = Query(60.0, gt=0.0, description="Width of the requested cutout in degrees"),
    height: Optional[float] = Query(None, description="Height of the cutout in degrees"),
    pixels: int = Query(1024, gt=32, le=8192, description="Output resolution of the cutout"),
    survey: str = Query("DSS2 Red", description="SkyView survey name"),
    projection: str = Query("Car", description="Projection identifier (Car, Tan, Ait, etc.)"),
    overwrite: bool = Query(True, description="Overwrite cached files on disk"),
) -> FileResponse:
    """Return a PNG tile generated via NASA SkyView.

    The heavy lifting is performed by :func:`fetch_survey_image`, which writes to disk and
    gives us a PNG we can stream back to the browser.
    """

    if not target and (ra is None or dec is None):
        raise HTTPException(status_code=422, detail="Provide either target or (ra, dec)")

    loop = asyncio.get_event_loop()

    logger.info(
        "Requesting tile — survey=%s target=%s ra=%.5f dec=%.5f width=%.2f height=%s pixels=%d",
        survey,
        target or "(RA/Dec)",
        ra if ra is not None else float("nan"),
        dec if dec is not None else float("nan"),
        width,
        f"{height:.2f}" if height is not None else "auto",
        pixels,
    )

    try:
        product = await loop.run_in_executor(
            None,
            lambda: fetch_survey_image(
                target=target,
                ra=ra,
                dec=dec,
                survey=survey,
                width_deg=width,
                height_deg=height,
                pixels=pixels,
                projection=projection,
                output_dir=OUTPUT_DIR,
                overwrite=overwrite,
            ),
        )
    except Exception as exc:  # pragma: no cover - best effort surface to caller
        logger.exception("SkyView tile request failed")
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    logger.info("Tile ready — %s", product.png_path)
    return FileResponse(product.png_path, media_type="image/png")


if __name__ == "__main__":
    import uvicorn

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
    )

    uvicorn.run(
        "src.server:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
    )
