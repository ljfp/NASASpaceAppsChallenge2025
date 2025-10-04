#!/usr/bin/env bash

set -euo pipefail

APP_ROOT=${APP_ROOT:-/opt/nasa-sky-app}
APP_DIR="${APP_ROOT}/app"
VENV_DIR="${APP_ROOT}/venv"
SERVICE_NAME=${SERVICE_NAME:-nasa-sky-app}
PORT=${PORT:-80}
PYTHON_BIN=${PYTHON_BIN:-python3}
SUDO_BIN=${SUDO_BIN:-sudo}
export DEBIAN_FRONTEND=${DEBIAN_FRONTEND:-noninteractive}

SERVICE_USER=${SERVICE_USER:-$(whoami)}
SERVICE_GROUP=${SERVICE_GROUP:-$(id -gn)}

if [ "${PORT}" -lt 1024 ]; then
  echo "Deploying service on privileged port ${PORT}."
fi

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
REPO_ROOT=$(cd "${SCRIPT_DIR}/.." && pwd)

if command -v apt-get >/dev/null 2>&1; then
  if ! command -v rsync >/dev/null 2>&1; then
    echo "Installing rsync via apt-get"
    ${SUDO_BIN} apt-get update -y
    ${SUDO_BIN} apt-get install -y rsync
  fi

  if ! command -v "${PYTHON_BIN}" >/dev/null 2>&1; then
    echo "Installing Python via apt-get"
    ${SUDO_BIN} apt-get update -y
    ${SUDO_BIN} apt-get install -y python3 python3-venv python3-pip
  else
    if ! "${PYTHON_BIN}" -m venv --help >/dev/null 2>&1; then
      echo "Installing python3-venv via apt-get"
      ${SUDO_BIN} apt-get update -y
      ${SUDO_BIN} apt-get install -y python3-venv
    fi
    if ! command -v pip3 >/dev/null 2>&1; then
      echo "Installing python3-pip via apt-get"
      ${SUDO_BIN} apt-get update -y
      ${SUDO_BIN} apt-get install -y python3-pip
    fi
  fi
fi

if ! command -v rsync >/dev/null 2>&1; then
  echo "rsync is required but was not found in PATH" >&2
  exit 1
fi

if ! command -v "${PYTHON_BIN}" >/dev/null 2>&1; then
  echo "Python interpreter '${PYTHON_BIN}' not found" >&2
  exit 1
fi

mkdir -p "${APP_DIR}"
rsync -a --delete \
  --exclude ".git" \
  --exclude ".venv" \
  --exclude "__pycache__" \
  --exclude "*.pyc" \
  --exclude ".ruff_cache" \
  "${REPO_ROOT}/" "${APP_DIR}/"

"${PYTHON_BIN}" -m venv "${VENV_DIR}"
"${VENV_DIR}/bin/pip" install --upgrade pip
"${VENV_DIR}/bin/pip" install -r "${APP_DIR}/requirements.txt"

SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"

CAPABILITY_LINES=""
if [ "${PORT}" -lt 1024 ]; then
  CAPABILITY_LINES=$'AmbientCapabilities=CAP_NET_BIND_SERVICE\nCapabilityBoundingSet=CAP_NET_BIND_SERVICE'
fi

read -r -d '' SERVICE_UNIT <<EOF
[Unit]
Description=NASA Sky Explorer FastAPI Service
After=network.target

[Service]
User=${SERVICE_USER}
Group=${SERVICE_GROUP}
WorkingDirectory=${APP_DIR}
Environment="PATH=${VENV_DIR}/bin"
ExecStart=${VENV_DIR}/bin/uvicorn src.server:app --host 0.0.0.0 --port ${PORT}
Restart=on-failure
${CAPABILITY_LINES}

[Install]
WantedBy=multi-user.target
EOF

${SUDO_BIN} tee "${SERVICE_FILE}" >/dev/null <<<"${SERVICE_UNIT}"
${SUDO_BIN} systemctl daemon-reload
${SUDO_BIN} systemctl enable --now "${SERVICE_NAME}.service"
${SUDO_BIN} systemctl restart "${SERVICE_NAME}.service"

${SUDO_BIN} systemctl status "${SERVICE_NAME}.service" --no-pager
