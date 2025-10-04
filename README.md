# NASA FITS Explorer

A FastAPI-powered prototype that serves an interactive Aladin Lite interface for visualising NASA (and allied) FITS imagery. Users can upload local FITS files, paste remote URLs, or launch curated samples spanning multiple missions.

## Quickstart

1. Create a virtual environment and install the dependencies:

   ```bash
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```

2. Launch the development server:

   ```bash
   uvicorn src.server:app --reload
   ```

3. Open <http://127.0.0.1:8000/> in your browser and click **“Launch the viewer.”** The FITS explorer lives at <http://127.0.0.1:8000/aladin>.

### Working with FITS datasets

- **Local files:** Use the “Open local FITS file” control. Files never leave the browser; they stream directly into Aladin Lite.
- **Remote URLs:** Paste a direct link to a FITS file (for example, from NASA’s FITS sample archive or a mission mirror). The viewer requests the data client-side, so the remote server must allow cross-origin (`CORS`) downloads.
- **Curated samples:** Try the Hubble, GALEX, or WISE presets to demonstrate different wavelengths and resolutions. Each sample automatically recentres and applies a mission-appropriate colour map.

The HUD panel displays the currently loaded source and field of view. Loading very large FITS mosaics may take several seconds depending on bandwidth.

## Linting

Install Ruff into your virtual environment and run it against the project source to keep the
codebase clean:

```bash
pip install ruff
ruff check .
```

## Project structure

```
NASASpaceAppsChallenge2025/
├── requirements.txt      # FastAPI and Uvicorn dependencies
├── src/
│   ├── __init__.py
│   └── server.py         # FastAPI application serving the HTML page
├── web/
│   ├── index.html        # Landing page served at the root route
│   └── aladin.html       # Secondary page under /aladin
├── deploy/
│   └── remote_deploy.sh  # Remote helper script invoked by the CI workflow
└── .github/
    └── workflows/
        └── deploy.yml    # Continuous deployment pipeline for EC2
```

Feel free to extend the UI with annotations, multi-layer comparisons, or temporal sliders to address the broader Space Apps challenge goals.

## Continuous deployment to EC2

Every push to `main` triggers the GitHub Actions workflow in `.github/workflows/deploy.yml`. The
pipeline performs the following steps:

1. Checks out the latest code.
2. Copies the repository to your EC2 instance via `rsync` (preserving any existing `.venv` or
   `logs` folders).
3. Runs `deploy/remote_deploy.sh` on the instance to create/refresh a virtual environment, install
   dependencies, and restart the application via `systemd` when available. If a systemd service is
   not present, it falls back to launching Uvicorn in the background with `nohup`.

### Required GitHub secrets

Create the following secrets at **Settings → Secrets and variables → Actions**:

- `EC2_HOST` – Public DNS name or IP address of the instance.
- `EC2_USER` – SSH user (for example, `ubuntu`).
- `EC2_SSH_KEY` – Private SSH key allowed to log in as `EC2_USER`.

### Optional overrides

You can customise the deployment without editing the workflow by providing additional (optional)
secrets:

- `EC2_APP_DIR` – Absolute path where the repo should live (defaults to `/home/ubuntu/nasa-sky-explorer`).
- `EC2_PYTHON_BIN` – Python interpreter used to build the virtual environment (defaults to
  `/usr/bin/python3`).
- `EC2_SERVICE_NAME` – Name of the `systemd` service to restart (defaults to `nasaspaceapps`).
- `EC2_UVICORN_PORT` – Port exposed by Uvicorn when no `systemd` unit is available (defaults to
  `8000`).

Ensure the EC2 machine has `git`, `rsync`, `python3`, and `pip` installed. If you prefer a managed
service, create a `systemd` unit named after `EC2_SERVICE_NAME` that executes
`/home/ubuntu/nasa-sky-explorer/.venv/bin/uvicorn src.server:app --host 0.0.0.0 --port 8000`
and the workflow will restart it after each deployment.
