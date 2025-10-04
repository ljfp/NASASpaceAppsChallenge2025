# NASA Sky Data Prototype

Prototype utilities for building an ESASky-like explorer backed exclusively by public NASA archives. The initial focus is on downloading survey cutouts and generating quick-look imagery from NASA's **SkyView** service, which federates data from multiple missions (DSS, GALEX, WISE, 2MASS, Fermi, ROSAT, etc.).

## 🚀 Goals

- Help you discover NASA-managed astronomical data that can power a visual explorer.
- Provide a reproducible script that fetches science-ready survey tiles and converts them into PNG previews.
- Document next steps for evolving the prototype into a richer web or desktop application.

## 📡 Key NASA Data Sources

| Archive | What you get | Programmatic access |
| --- | --- | --- |
| [NASA SkyView](https://skyview.gsfc.nasa.gov/current/cgi/titlepage.pl) | On-the-fly projection of surveys (optical, IR, UV, X-ray, gamma) | HTTP service + [`astroquery.skyview`](https://astroquery.readthedocs.io/en/latest/skyview/skyview.html) |
| [Mikulski Archive for Space Telescopes (MAST)](https://archive.stsci.edu/) | HST, JWST, Kepler/K2, TESS, GALEX, etc. | [`astroquery.mast`](https://astroquery.readthedocs.io/en/latest/mast/mast.html) APIs |
| [High Energy Astrophysics Science Archive Research Center (HEASARC)](https://heasarc.gsfc.nasa.gov/docs/archive.html) | Chandra, XMM-Newton, Swift, Fermi, ROSAT, etc. | [`astroquery.heasarc`](https://astroquery.readthedocs.io/en/latest/heasarc/heasarc.html), TAP |
| [Planetary Data System (PDS)](https://pds.nasa.gov/) | Planetary mission data (images, spectra, telemetry) | [PDS Imaging Node APIs](https://pds-imaging.jpl.nasa.gov/help/), [PDS Search](https://pds.nasa.gov/services/search/) |
| [NASA/IPAC Infrared Science Archive (IRSA)](https://irsa.ipac.caltech.edu/frontpage/) | WISE/NEOWISE, Spitzer, 2MASS, Planck, etc. | [`astroquery.irsa`](https://astroquery.readthedocs.io/en/latest/irsa/irsa.html), VO TAP |
| [NASA Open Data Portal](https://data.nasa.gov/) | Curated datasets across NASA centers | REST API + CSV/JSON exports |

> Some APIs (e.g. MAST, NASA Open APIs) require a free API key or authentication token. The SkyView service used in this prototype is fully open and anonymous.

## 🧭 Prototype walkthrough

### 1. Create an isolated environment

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 2. Fetch a survey cutout and generate a PNG

The CLI accepts either a resolvable object name or explicit coordinates. A DSS2 Red cutout of the Whirlpool Galaxy at 0.4° scale can be generated with:

```bash
python -m src.skyview_downloader --target "M51" --survey "DSS2 Red" --width 0.4 --pixels 800
```

To target custom celestial coordinates in decimal degrees:

```bash
python -m src.skyview_downloader --ra 201.3651 --dec -43.0191 --survey "WISE 3.4" --width 1.0 --pixels 1024
```

Outputs are written to `outputs/`:

- `<target>-<survey>.fits` — the raw FITS cutout.
- `<target>-<survey>.png` — contrast-stretched preview (Astropy WCS axes, grayscale colormap).

### 3. Spin up the interactive globe prototype

Launch the FastAPI service, which proxies NASA's SkyView service and serves the front-end assets:

```bash
uvicorn src.server:app --reload
```

Then open <http://127.0.0.1:8000/app> in your browser. Rotate the sphere with your mouse or trackpad, use the zoom buttons to adjust the field of view, and switch between surveys (DSS, WISE, GALEX, Fermi). Every interaction requests a fresh cutout from NASA SkyView, so you're always looking at live archival imagery.

> The backend stores PNG tiles in `outputs/` to avoid re-downloading frequently requested fields.

### 4. Inspect available surveys

NASA maintains the full survey catalogue at <https://skyview.gsfc.nasa.gov/current/cgi/survey.pl>. Any entry in the "Survey" column is compatible with the `--survey` option.
