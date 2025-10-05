# NASA FITS Explorer

A FastAPI-powered prototype that serves an interactive Aladin Lite interface for visualising NASA (and allied) FITS imagery. Users can upload local FITS files, paste remote URLs, or launch curated samples spanning multiple missions.

## Quickstart

1. Build the CosmoView frontend (repeat whenever you change the React app):

   ```bash
   cd CosmoView
   npm install
   npm run build
   cd ..
   ```

2. Create a virtual environment and install the FastAPI dependencies:

   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```

3. Launch the development server:

   ```bash
   uvicorn src.server:app --reload
   ```

4. Open <http://127.0.0.1:8000/> in your browser. The CosmoView landing page now lives at the root route with an **“Explore the Universe”** button that jumps directly to the Aladin viewer at <http://127.0.0.1:8000/aladin>.

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
├── CosmoView/                          # React + Vite front-end project
│   ├── client/src/                     # UI components and pages
│   └── dist/public/                    # Production build served by FastAPI
├── requirements.txt                    # FastAPI and Uvicorn dependencies
├── src/
│   ├── __init__.py
│   └── server.py                       # FastAPI application that serves both front-ends
├── web/
│   ├── aladin.html                     # FITS explorer with Aladin Lite integration
│   └── styles.css                      # Styling for the viewer interface
├── deploy/
│   ├── remote_deploy.sh                # Remote deployment script (run on EC2)
│   └── nasaspaceapps.service.template  # SystemD service unit template
├── .github/
│   └── workflows/
│       └── deploy.yml                  # Continuous deployment pipeline for EC2
├── README.md                           # Main documentation
├── MIGRATION.md                        # Migration guide for existing deployments
├── DEPLOYMENT_CHANGES.md               # Detailed deployment architecture documentation
└── OPS_REFERENCE.md                    # Quick reference for operations team
```

Feel free to extend the UI with annotations, multi-layer comparisons, or temporal sliders to address the broader Space Apps challenge goals.

## Continuous deployment to EC2

Every push to `main` triggers the GitHub Actions workflow in `.github/workflows/deploy.yml`. The
pipeline performs the following steps:

1. Checks out the latest code.
2. Installs Node.js dependencies for the CosmoView frontend and builds the production bundle.
3. Copies the repository to `/opt/nasa-sky-explorer` on your EC2 instance via `rsync` (skipping
   local build artefacts such as `node_modules/`).
4. Creates a dedicated service user (`nasaapp`) if it doesn't exist.
5. Sets proper ownership and permissions for the application directory.
6. Installs Python dependencies in a virtual environment owned by the service user.
7. Installs CosmoView dependencies on the EC2 host and rebuilds the Vite bundle (or reuses the
   synced `CosmoView/dist/public` assets if the source directory is absent).
8. Applies necessary capabilities to bind to port 80 (if running on a privileged port).
9. Restarts the systemd service or launches Uvicorn as a background process.

> **Prerequisite:** Ensure Node.js (v20 or newer recommended) is available on the EC2 instance so
> the deployment script can run `npm install` and `npm run build` inside `CosmoView/`.

### Required GitHub secrets

Create the following secrets at **Settings → Secrets and variables → Actions**:

- `EC2_HOST` – Public DNS name or IP address of the instance.
- `EC2_USER` – SSH user with sudo privileges (for example, `ubuntu`).
- `EC2_SSH_KEY` – Private SSH key allowed to log in as `EC2_USER`.

### Optional overrides

You can customise the deployment without editing the workflow by providing additional (optional)
secrets:

- `EC2_APP_DIR` – Absolute path where the repo should live (defaults to `/opt/nasa-sky-explorer`).
- `EC2_PYTHON_BIN` – Python interpreter used to build the virtual environment (defaults to
  `/usr/bin/python3`).
- `EC2_SERVICE_NAME` – Name of the `systemd` service to restart (defaults to `nasaspaceapps`).
- `EC2_UVICORN_PORT` – Port exposed by Uvicorn (defaults to `80`).

### Setting up the systemd service

For production use, create a systemd service to manage the application lifecycle:

```bash
# On your EC2 instance:
sudo cp /opt/nasa-sky-explorer/deploy/nasaspaceapps.service.template /etc/systemd/system/nasaspaceapps.service
sudo systemctl daemon-reload
sudo systemctl enable nasaspaceapps.service
sudo systemctl start nasaspaceapps.service
```

The service runs as the `nasaapp` user and automatically restarts on failure. Logs are written to
`/opt/nasa-sky-explorer/logs/uvicorn.log`.

**Note:** The application directory `/opt/nasa-sky-explorer` is accessible to all sudo users, and the
service runs under a dedicated unprivileged user (`nasaapp`) for security.
