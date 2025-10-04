"""Utilities for downloading and visualising NASA SkyView survey cutouts.

This module provides a thin wrapper around the `astroquery.skyview` client so we
can request public survey data that NASA curates (for example DSS, IRAS,
GALEX, WISE, etc.) and export the result as a high-quality PNG preview along
with the raw FITS file.

Example
-------
```
python -m skyview_downloader --target "M51" --survey "DSS2 Red"
```
"""
from __future__ import annotations

import argparse
import logging
import math
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Optional, Tuple, cast
from time import perf_counter

from astroquery.skyview import SkyView
from astropy.io import fits
from astropy.visualization import ImageNormalize, AsinhStretch, ZScaleInterval
from astropy.wcs import WCS
import matplotlib.pyplot as plt
from matplotlib.colors import Normalize


logger = logging.getLogger(__name__)


@dataclass
class SkyViewProduct:
    """Container returned by :func:`fetch_survey_image` describing generated files."""

    fits_path: Path
    png_path: Path
    target: str
    survey: str
    width_deg: float
    height_deg: float
    pixels: int


def _normalise_position(target: Optional[str], ra: Optional[float], dec: Optional[float]) -> str:
    if target:
        return target
    if ra is None or dec is None:
        raise ValueError("Provide either --target or both --ra and --dec")
    return f"{ra} {dec}"


def _safe_slug(value: str) -> str:
    value = value.strip().lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    value = re.sub(r"-+", "-", value)
    return value.strip("-") or "skyview"


def fetch_survey_image(
    *,
    target: Optional[str] = None,
    ra: Optional[float] = None,
    dec: Optional[float] = None,
    survey: str = "DSS2 Red",
    width_deg: float = 0.5,
    height_deg: Optional[float] = None,
    pixels: int = 600,
    projection: str = "Tan",
    output_dir: Path | str = Path("outputs"),
    overwrite: bool = True,
) -> SkyViewProduct:
    """Download a cutout from the NASA SkyView service and render a PNG preview.

    Parameters
    ----------
    target : str, optional
        Named target resolvable by SIMBAD/NED (e.g. "M51", "NGC 1300").
    ra, dec : float, optional
        Right ascension and declination in decimal degrees. Use when a named
        target is not available.
    survey : str, default "DSS2 Red"
        Survey identifier supported by SkyView ("DSS2 Red", "WISE 3.4", etc.).
    width_deg : float, default 0.5
        Width of the requested image in degrees.
    height_deg : float, optional
        Height of the requested image in degrees. Falls back to width when not
        provided.
    pixels : int, default 600
        Output image resolution in pixels (square).
    projection : str, default "Tan"
        Projection name understood by SkyView (Tan, Car, Ait, Hammer, etc.).
    output_dir : Path or str, default "outputs"
        Directory where FITS and PNG artefacts are saved.
    overwrite : bool, default True
        Whether to overwrite files if they already exist.

    Returns
    -------
    SkyViewProduct
        Paths to the generated FITS and PNG files and metadata of the request.
    """

    pos = _normalise_position(target, ra, dec)
    height_deg = width_deg if height_deg is None else height_deg
    if pixels <= 0:
        raise ValueError("pixels must be positive")
    if width_deg <= 0 or height_deg <= 0:
        raise ValueError("width/height must be positive")

    start = perf_counter()
    logger.info(
        "Requesting SkyView survey '%s' at %s (%.3f° × %.3f°, %s px, projection=%s)",
        survey,
        pos,
        width_deg,
        height_deg,
        pixels,
        projection,
    )

    images = SkyView.get_images(
        position="Alpha Carinae", # Works only when using a string
        survey=[survey],
        coordinates="J2000",
        width=f"{width_deg} deg",
        height=f"{height_deg} deg",
        pixels=pixels,
        projection=projection,
    )
    if not images:
        raise RuntimeError(f"SkyView returned no images for {pos} in {survey}")

    logger.info(images[0][0])
    hdu = cast(fits.PrimaryHDU, images[0][0])
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    target_slug = _safe_slug(pos)
    survey_slug = _safe_slug(survey)
    fits_path = output_dir / f"{target_slug}-{survey_slug}.fits"
    png_path = output_dir / f"{target_slug}-{survey_slug}.png"

    hdu.writeto(fits_path, overwrite=overwrite)

    data = hdu.data
    if data is None:
        raise RuntimeError("Downloaded FITS file does not contain image data")

    wcs = WCS(hdu.header)
    interval = ZScaleInterval()
    norm = cast(
        Normalize,
        ImageNormalize(
            data,
            interval=interval,
            stretch=AsinhStretch(),  # type: ignore[arg-type]
        ),
    )

    fig = plt.figure(figsize=(6, 6))
    ax = plt.subplot(projection=wcs)
    im = ax.imshow(data, norm=norm, cmap="gray")
    ax.set_xlabel("Right Ascension (J2000)")
    ax.set_ylabel("Declination (J2000)")
    ax.set_title(f"{survey} — {pos}")
    plt.colorbar(im, ax=ax, fraction=0.046, pad=0.04, label="Arbitrary units")

    for spine in ax.spines.values():
        spine.set_edgecolor("white")

    ax.grid(color="white", ls=":", alpha=0.3)
    fig.tight_layout()
    fig.savefig(png_path, dpi=200, facecolor="green")
    plt.close(fig)

    elapsed = perf_counter() - start
    logger.info("SkyView request finished in %.2fs — FITS: %s | PNG: %s", elapsed, fits_path, png_path)

    return SkyViewProduct(
        fits_path=fits_path,
        png_path=png_path,
        target=pos,
        survey=survey,
        width_deg=width_deg,
        height_deg=height_deg,
        pixels=pixels,
    )


def _valid_angle(value: str) -> float:
    try:
        numeric = float(value)
    except ValueError as exc:
        raise argparse.ArgumentTypeError(str(exc)) from exc
    if not math.isfinite(numeric):
        raise argparse.ArgumentTypeError("angle must be finite")
    return numeric


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Fetch public NASA SkyView survey cutouts and generate previews.",
    )
    group = parser.add_mutually_exclusive_group(required=False)
    group.add_argument(
        "--target",
        type=str,
        help="Named target resolvable by SIMBAD/NED (e.g. 'M51', 'NGC 2023').",
    )
    group.add_argument("--ra", type=_valid_angle, help="Right ascension in decimal degrees.")
    parser.add_argument("--dec", type=_valid_angle, help="Declination in decimal degrees.")
    parser.add_argument(
        "--survey",
        default="DSS2 Red",
        help="SkyView survey to query (see https://skyview.gsfc.nasa.gov/current/cgi/survey.pl).",
    )
    parser.add_argument(
        "--width",
        type=_valid_angle,
        default=0.4,
        help="Width of the cutout in degrees (default: 0.4).",
    )
    parser.add_argument(
        "--height",
        type=_valid_angle,
        default=None,
        help="Height of the cutout in degrees (defaults to width).",
    )
    parser.add_argument(
        "--pixels",
        type=int,
        default=600,
        help="Number of pixels on a side for the cutout (default: 600).",
    )
    parser.add_argument(
        "--projection",
        default="Tan",
        help="Sky projection (Tan, Car, Ait, Hammer, etc.).",
    )
    parser.add_argument(
        "--output-dir",
        default="outputs",
        help="Directory to store the resulting FITS and PNG files.",
    )
    parser.add_argument(
        "--no-overwrite",
        action="store_true",
        help="Do not overwrite existing files.",
    )
    return parser


def main(argv: Optional[Tuple[str, ...]] = None) -> SkyViewProduct:
    parser = build_parser()
    args = parser.parse_args(argv)
    overwrite = not args.no_overwrite

    return fetch_survey_image(
        target=args.target,
        ra=args.ra,
        dec=args.dec,
        survey=args.survey,
        width_deg=args.width,
        height_deg=args.height,
        pixels=args.pixels,
        projection=args.projection,
        output_dir=args.output_dir,
        overwrite=overwrite,
    )


if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
    )
    product = main()
    print(f"FITS saved: {product.fits_path}")
    print(f"PNG saved:  {product.png_path}")
