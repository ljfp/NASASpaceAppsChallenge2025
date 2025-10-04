# NASA Sky Explorer Prototype

A barebones FastAPI project that serves the landing page for the NASA Sky Explorer Prototype

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

3. Open <http://127.0.0.1:8000/> in your browser to view the page titled **“Minimal FastAPI App.”**

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
└── web/
    └── index.html        # Static HTML served at the root route
└── deploy/
   └── deploy.sh         # Helper script to install and run the service via systemd
```

Feel free to build on this foundation for richer APIs or interfaces.

## Deployment script

The `deploy/deploy.sh` script provisions the application on a Linux host using `systemd`. It:

- Syncs the repository into `/opt/nasa-sky-app/app` (configurable with `APP_ROOT`).
- Ensures `/opt/nasa-sky-app` exists with the proper ownership, then syncs code and creates a
   virtual environment for dependencies.
- Generates a `systemd` unit that runs Uvicorn on port `80` by default.
- Enables and restarts the service.

Run it directly on the target server after cloning or syncing the repository:

```bash
chmod +x deploy/deploy.sh
APP_ROOT=/opt/nasa-sky-app SERVICE_NAME=nasa-sky-app ./deploy/deploy.sh
```

Override `SERVICE_USER`, `SERVICE_GROUP`, `PORT`, or `PYTHON_BIN` to fit your environment. When the
port is below `1024` (the default `80`), the generated unit grants
`CAP_NET_BIND_SERVICE` so the application can bind to the port without running as root.

### GitHub Actions deployment

A workflow at `.github/workflows/deploy.yml` uses the repository secrets `EC2_HOST`, `EC2_USER`,
and `EC2_SSH_KEY` to sync the codebase to an Ubuntu 24.04 EC2 instance and execute the deployment
script remotely. It runs on every push to `main` (and can be triggered manually). Optional
repository variable `DEPLOY_PORT` lets you override the port without editing the workflow.
