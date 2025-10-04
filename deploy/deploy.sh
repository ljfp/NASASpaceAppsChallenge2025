#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <source-dir> <install-dir> [python-bin]" >&2
  exit 1
fi

SOURCE_DIR="$1"
INSTALL_DIR="$2"
PYTHON_BIN="${3:-python3}"

APP_DIR="$INSTALL_DIR/app"
VENV_DIR="$INSTALL_DIR/venv"
OUTPUT_DIR="$APP_DIR/outputs"
LOG_DIR="/var/log"
SERVICE_FILE="/etc/systemd/system/nasa-skyview.service"

if [[ ! -d "$SOURCE_DIR" ]]; then
  echo "Source directory '$SOURCE_DIR' does not exist" >&2
  exit 1
fi

sudo mkdir -p "$INSTALL_DIR"
sudo chown -R "$USER":"$USER" "$INSTALL_DIR"

mkdir -p "$APP_DIR"
rm -rf "$APP_DIR/src" "$APP_DIR/web"
cp -r "$SOURCE_DIR/src" "$APP_DIR/"
cp -r "$SOURCE_DIR/web" "$APP_DIR/"
cp "$SOURCE_DIR/requirements.txt" "$APP_DIR/requirements.txt"

if [[ ! -d "$VENV_DIR" ]]; then
  "$PYTHON_BIN" -m venv "$VENV_DIR"
fi

"$VENV_DIR/bin/pip" install --upgrade pip
"$VENV_DIR/bin/pip" install -r "$APP_DIR/requirements.txt"

mkdir -p "$OUTPUT_DIR"

sudo touch "$LOG_DIR/nasa-skyview.log" "$LOG_DIR/nasa-skyview.err"
sudo chown "$USER":"$USER" "$LOG_DIR/nasa-skyview.log" "$LOG_DIR/nasa-skyview.err"

sudo tee "$SERVICE_FILE" >/dev/null <<EOF
[Unit]
Description=NASA SkyView Prototype
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
WorkingDirectory=$APP_DIR
Environment=PYTHONUNBUFFERED=1
Environment=UVICORN_PORT=80
ExecStartPre=/usr/bin/mkdir -p $OUTPUT_DIR
ExecStart=$VENV_DIR/bin/uvicorn src.server:app --host 0.0.0.0 --port \${UVICORN_PORT}
Restart=on-failure
RestartSec=5
StandardOutput=append:$LOG_DIR/nasa-skyview.log
StandardError=append:$LOG_DIR/nasa-skyview.err

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable nasa-skyview.service
sudo systemctl restart nasa-skyview.service || sudo systemctl start nasa-skyview.service

echo "Deployment complete. Service status:"
sudo systemctl --no-pager status nasa-skyview.service
