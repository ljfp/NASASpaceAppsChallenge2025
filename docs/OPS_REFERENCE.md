# NASA Sky Explorer - Operations Quick Reference

## Service Management

```bash
# Check service status
sudo systemctl status nasaspaceapps.service

# Start the service
sudo systemctl start nasaspaceapps.service

# Stop the service
sudo systemctl stop nasaspaceapps.service

# Restart the service
sudo systemctl restart nasaspaceapps.service

# Enable auto-start on boot
sudo systemctl enable nasaspaceapps.service

# Disable auto-start
sudo systemctl disable nasaspaceapps.service

# View service logs (last 50 lines)
sudo journalctl -u nasaspaceapps.service -n 50 --no-pager

# Follow service logs in real-time
sudo journalctl -u nasaspaceapps.service -f
```

## Application Logs

```bash
# View application logs
sudo tail -f /opt/nasa-sky-explorer/logs/uvicorn.log

# View last 100 lines
sudo tail -100 /opt/nasa-sky-explorer/logs/uvicorn.log

# Search for errors
sudo grep -i error /opt/nasa-sky-explorer/logs/uvicorn.log
```

## Network & Connectivity

```bash
# Check if port 80 is listening
sudo ss -ltnp 'sport = :80'

# Check all listening ports
sudo ss -ltnp

# Test local connectivity
curl -I http://localhost/

# Test from outside (replace with your IP)
curl -I http://YOUR_EC2_IP/
```

## Application Directory

```bash
# Navigate to application
cd /opt/nasa-sky-explorer

# Check ownership
ls -la /opt/nasa-sky-explorer

# Check virtual environment
ls -la /opt/nasa-sky-explorer/.venv

# Check installed packages
sudo -u nasaapp /opt/nasa-sky-explorer/.venv/bin/pip list
```

## Process Management

```bash
# Check if application is running
ps aux | grep uvicorn

# Kill all uvicorn processes (emergency)
sudo pkill -f "uvicorn src.server:app"

# Check processes run by nasaapp user
ps aux | grep nasaapp
```

## Security & Permissions

```bash
# Verify Python capability for port 80
sudo getcap $(readlink -f /opt/nasa-sky-explorer/.venv/bin/python)
# Expected output: cap_net_bind_service=ep

# Check file permissions
sudo ls -la /opt/nasa-sky-explorer

# Fix ownership if needed
sudo chown -R nasaapp:nasaapp /opt/nasa-sky-explorer

# Fix permissions if needed
sudo chmod -R 755 /opt/nasa-sky-explorer
```

## Deployment

```bash
# Manual deployment (after git pull)
cd /opt/nasa-sky-explorer
sudo bash deploy/remote_deploy.sh

# Check deployment script
cat /opt/nasa-sky-explorer/deploy/remote_deploy.sh

# View GitHub Actions workflow
cat /opt/nasa-sky-explorer/.github/workflows/deploy.yml
```

## Troubleshooting

### Application won't start

```bash
# 1. Check logs
sudo journalctl -u nasaspaceapps.service -n 50 --no-pager
sudo tail -50 /opt/nasa-sky-explorer/logs/uvicorn.log

# 2. Check Python path
sudo -u nasaapp /opt/nasa-sky-explorer/.venv/bin/python --version

# 3. Check dependencies
sudo -u nasaapp /opt/nasa-sky-explorer/.venv/bin/pip check

# 4. Verify files exist
ls -la /opt/nasa-sky-explorer/src/server.py
```

### Port 80 access denied

```bash
# 1. Check capability
sudo getcap $(readlink -f /opt/nasa-sky-explorer/.venv/bin/python)

# 2. Re-apply capability
sudo setcap 'cap_net_bind_service=+ep' $(readlink -f /opt/nasa-sky-explorer/.venv/bin/python)

# 3. Restart service
sudo systemctl restart nasaspaceapps.service
```

### Port 80 already in use

```bash
# 1. Find what's using port 80
sudo ss -ltnp 'sport = :80'

# 2. If it's an old process, kill it
sudo kill <PID>

# 3. Or change the port in GitHub secrets
# Set EC2_UVICORN_PORT to a different port (e.g., 8080)
```

### Permission errors

```bash
# 1. Check current ownership
ls -la /opt/nasa-sky-explorer

# 2. Fix ownership
sudo chown -R nasaapp:nasaapp /opt/nasa-sky-explorer

# 3. Fix permissions
sudo chmod -R 755 /opt/nasa-sky-explorer
sudo chmod -R 755 /opt/nasa-sky-explorer/logs

# 4. Restart
sudo systemctl restart nasaspaceapps.service
```

### Service user issues

```bash
# Check if nasaapp user exists
id nasaapp

# View user details
sudo cat /etc/passwd | grep nasaapp

# Manually create user if needed
sudo useradd --system --no-create-home --shell /usr/sbin/nologin nasaapp
```

## Health Checks

```bash
# Full health check script
echo "=== Service Status ==="
sudo systemctl status nasaspaceapps.service --no-pager

echo -e "\n=== Port Listener ==="
sudo ss -ltnp 'sport = :80'

echo -e "\n=== Process ==="
ps aux | grep "[u]vicorn src.server:app"

echo -e "\n=== Last 10 Log Lines ==="
sudo tail -10 /opt/nasa-sky-explorer/logs/uvicorn.log

echo -e "\n=== Python Capability ==="
sudo getcap $(readlink -f /opt/nasa-sky-explorer/.venv/bin/python)

echo -e "\n=== Disk Usage ==="
du -sh /opt/nasa-sky-explorer

echo -e "\n=== HTTP Test ==="
curl -I http://localhost/ 2>&1 | head -5
```

## Key File Locations

| Item | Location |
|------|----------|
| Application | `/opt/nasa-sky-explorer` |
| Virtual environment | `/opt/nasa-sky-explorer/.venv` |
| Application logs | `/opt/nasa-sky-explorer/logs/uvicorn.log` |
| SystemD service | `/etc/systemd/system/nasaspaceapps.service` |
| Deploy script | `/opt/nasa-sky-explorer/deploy/remote_deploy.sh` |
| Service template | `/opt/nasa-sky-explorer/deploy/nasaspaceapps.service.template` |

## Service User Details

- **Username:** `nasaapp`
- **Type:** System user (--system)
- **Home:** No home directory
- **Shell:** `/usr/sbin/nologin` (cannot login)
- **Purpose:** Run the NASA Sky Explorer application with minimal privileges

## Emergency Procedures

### Complete restart

```bash
sudo systemctl stop nasaspaceapps.service
sudo pkill -f "uvicorn src.server:app"
sleep 2
sudo systemctl start nasaspaceapps.service
sudo systemctl status nasaspaceapps.service
```

### Rollback to previous version

```bash
cd /opt/nasa-sky-explorer
sudo -u nasaapp git log --oneline -10  # Find previous commit
sudo -u nasaapp git checkout <previous-commit-hash>
sudo bash deploy/remote_deploy.sh
```

### Nuclear option (clean reinstall)

```bash
# Stop service
sudo systemctl stop nasaspaceapps.service

# Backup logs
sudo cp -r /opt/nasa-sky-explorer/logs /tmp/nasa-backup-$(date +%Y%m%d)

# Remove application
sudo rm -rf /opt/nasa-sky-explorer

# Trigger GitHub Actions deployment or manually:
# 1. Clone repository to /opt/nasa-sky-explorer
# 2. Run deploy script
# 3. Set up systemd service

# Restore logs if needed
sudo cp -r /tmp/nasa-backup-*/logs /opt/nasa-sky-explorer/
sudo chown -R nasaapp:nasaapp /opt/nasa-sky-explorer/logs
```
