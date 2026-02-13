# Backend Deployment

This document provides specific instructions for deploying the Backend on a Linux system (Raspberry Pi), ensuring it runs reliably in production.

**Reference:** `docs/05-build-run-deploy.md` contains the full system deployment guide.

## 1. Prerequisites

*   **OS:** Raspberry Pi OS (Debian-based)
*   **Runtime:** Node.js v18+
*   **Permissions:** User must be in the `dialout` group to access serial ports.
    ```bash
    sudo usermod -a -G dialout $USER
    ```

## 2. Production Script (`start-prod.sh`)

The repository includes a production startup script designed for Kiosk mode. While it launches both Backend and Frontend (via Chromium), the backend portion relies on:

```bash
# From package.json
npm run start
# executes: cross-env NODE_ENV=production node -r tsconfig-paths/register dist/server.js
```

Ensure you have built the project before running:
```bash
npm run build
```

## 3. Systemd Service

To ensure the Backend (and the full Kiosk system) starts automatically on boot and restarts on failure, use a systemd service.

**File:** `/etc/systemd/system/fue-controller.service`

```ini
[Unit]
Description=FUE Controller Kiosk
After=network.target graphical.target

[Service]
User=proge
WorkingDirectory=/home/proge/FUE_Controller
ExecStart=/home/proge/FUE_Controller/start-prod.sh
Restart=always
# Restart backend immediately if it crashes
RestartSec=1
Environment=DISPLAY=:0
# Ensure Node.js finds global modules if needed, though local node_modules is preferred
Environment=PATH=/usr/bin:/usr/local/bin

[Install]
WantedBy=graphical.target
```

### Enable & Start
```bash
sudo systemctl daemon-reload
sudo systemctl enable fue-controller.service
sudo systemctl start fue-controller.service
```

## 4. Docker (Optional)

Although the current deployment uses bare-metal Node.js for direct hardware access, the backend can be containerized.

**Note on Serial Access:** To access `/dev/ttyAMA0` or USB devices from a container, you must run with `--privileged` or map the device specifically.

```bash
docker run -d \
  --device=/dev/ttyAMA0:/dev/ttyAMA0 \
  -p 3000:3000 \
  fue-backend:latest
```
