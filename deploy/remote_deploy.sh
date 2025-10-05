#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-$(pwd)}"
PYTHON_BIN="${PYTHON_BIN:-/usr/bin/python3}"
SERVICE_NAME="${SERVICE_NAME:-nasaspaceapps}"
UVICORN_PORT="${UVICORN_PORT:-80}"
APP_USER="${APP_USER:-nasaapp}"
FRONTEND_DIR="${FRONTEND_DIR:-CosmoView}"
NPM_BIN="${NPM_BIN:-npm}"

cd "${APP_DIR}"

# Create dedicated service user if it doesn't exist
if ! id "${APP_USER}" >/dev/null 2>&1; then
  echo "Creating service user ${APP_USER}..."
  useradd --system --no-create-home --shell /usr/sbin/nologin "${APP_USER}"
fi

# Set ownership and permissions for app directory
chown -R "${APP_USER}:${APP_USER}" "${APP_DIR}"
chmod -R 755 "${APP_DIR}"

# Create and setup virtual environment as the service user
if [ ! -d ".venv" ]; then
  sudo -u "${APP_USER}" "${PYTHON_BIN}" -m venv .venv
fi

# Install dependencies as the service user
# shellcheck source=/dev/null
sudo -u "${APP_USER}" bash << 'EOSCRIPT'
source .venv/bin/activate
pip install --upgrade pip wheel
pip install -r requirements.txt
deactivate || true
EOSCRIPT

# Build the frontend bundle
FRONTEND_PATH="${APP_DIR}/${FRONTEND_DIR}"
FRONTEND_BUILD_DIR="${FRONTEND_PATH}/dist/public"

if [ -d "${FRONTEND_PATH}" ]; then
  if ! command -v "${NPM_BIN}" >/dev/null 2>&1; then
    echo "Error: npm command '${NPM_BIN}' not found. Install Node.js/npm or set NPM_BIN." >&2
    exit 1
  fi

  echo "Installing frontend dependencies with ${NPM_BIN}..."
  sudo -u "${APP_USER}" bash -c "cd '${FRONTEND_PATH}' && ${NPM_BIN} install"

  echo "Building frontend production bundle..."
  sudo -u "${APP_USER}" bash -c "cd '${FRONTEND_PATH}' && ${NPM_BIN} run build"

  if [ ! -d "${FRONTEND_BUILD_DIR}" ]; then
    echo "Error: Frontend build directory ${FRONTEND_BUILD_DIR} was not created." >&2
    exit 1
  fi

  chown -R "${APP_USER}:${APP_USER}" "${FRONTEND_PATH}"
else
  # If the source directory is missing, fall back to an already built bundle
  PREBUILT_DIST="${APP_DIR}/CosmoView/dist/public"
  if [ -d "${PREBUILT_DIST}" ]; then
    echo "Frontend source directory not found. Using existing assets at ${PREBUILT_DIST}."
    FRONTEND_BUILD_DIR="${PREBUILT_DIST}"
  else
    echo "Error: Frontend directory ${FRONTEND_PATH} not found and no prebuilt assets present." >&2
    echo "Ensure the CosmoView frontend is built before deployment or set FRONTEND_DIR." >&2
    exit 1
  fi
fi

# Apply capability for port binding if needed (for systemd < 229)
# Modern systemd (>= 229) uses AmbientCapabilities in the service file
if [ "${UVICORN_PORT}" -lt 1024 ]; then
  REAL_PYTHON=$(readlink -f "${APP_DIR}/.venv/bin/python")
  if [ -f "${REAL_PYTHON}" ]; then
    echo "Applying cap_net_bind_service to ${REAL_PYTHON}..."
    setcap 'cap_net_bind_service=+ep' "${REAL_PYTHON}" || echo "Warning: Failed to set capability (may not be needed with modern systemd)"
  fi
fi

LOG_DIR="${APP_DIR}/logs"
mkdir -p "${LOG_DIR}"
chown "${APP_USER}:${APP_USER}" "${LOG_DIR}"
chmod 755 "${LOG_DIR}"

# Always kill any existing uvicorn processes to avoid port conflicts
echo "Stopping any existing uvicorn processes..."
pkill -f "uvicorn src.server:app" || true
sleep 2

if command -v systemctl >/dev/null 2>&1; then
  systemctl daemon-reload || true
  if systemctl list-unit-files | grep -q "^${SERVICE_NAME}\.service"; then
    echo "Restarting systemd service ${SERVICE_NAME}.service..."
    systemctl restart "${SERVICE_NAME}.service"
    exit 0
  fi
fi

echo "systemd unit ${SERVICE_NAME}.service not found or unavailable. Relaunching Uvicorn with nohup."

sudo -u "${APP_USER}" nohup "${APP_DIR}/.venv/bin/uvicorn" src.server:app --host 0.0.0.0 --port "${UVICORN_PORT}" \
  >"${LOG_DIR}/uvicorn.log" 2>&1 &
