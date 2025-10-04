#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-$(pwd)}"
PYTHON_BIN="${PYTHON_BIN:-/usr/bin/python3}"
SERVICE_NAME="${SERVICE_NAME:-nasaspaceapps}"
UVICORN_PORT="${UVICORN_PORT:-80}"
APP_USER="${APP_USER:-nasaapp}"

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

# Apply capability to allow binding to port 80 (if port < 1024)
if [ "${UVICORN_PORT}" -lt 1024 ]; then
  REAL_PYTHON=$(readlink -f "${APP_DIR}/.venv/bin/python")
  if [ -f "${REAL_PYTHON}" ]; then
    echo "Applying cap_net_bind_service to ${REAL_PYTHON}..."
    setcap 'cap_net_bind_service=+ep' "${REAL_PYTHON}" || echo "Warning: Failed to set capability"
  fi
fi

LOG_DIR="${APP_DIR}/logs"
mkdir -p "${LOG_DIR}"
chown "${APP_USER}:${APP_USER}" "${LOG_DIR}"
chmod 755 "${LOG_DIR}"

if command -v systemctl >/dev/null 2>&1; then
  systemctl daemon-reload || true
  if systemctl list-unit-files | grep -q "^${SERVICE_NAME}\.service"; then
    systemctl restart "${SERVICE_NAME}.service"
    exit 0
  fi
fi

echo "systemd unit ${SERVICE_NAME}.service not found or unavailable. Relaunching Uvicorn with nohup."

pkill -f "uvicorn src.server:app" || true
sudo -u "${APP_USER}" nohup "${APP_DIR}/.venv/bin/uvicorn" src.server:app --host 0.0.0.0 --port "${UVICORN_PORT}" \
  >"${LOG_DIR}/uvicorn.log" 2>&1 &
