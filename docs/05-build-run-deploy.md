# Build, Run, and Deploy

This document details how to set up the development environment, build the project, and deploy it to the production hardware (Raspberry Pi).

## Prerequisites

1.  **Node.js:** v18 or later.
2.  **Arduino IDE / CLI:** For flashing the firmware.
3.  **Linux Environment:** (Recommended) The production scripts are written for Bash (Raspberry Pi OS).
4.  **Hardware:**
    *   Raspberry Pi (Host)
    *   Arduino Uno/Nano (Motor Controller)
    *   USB Cable (Type A to B or Mini-B)

## 1. Development Setup

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd FUE_Controller

# Install dependencies for all workspaces
npm install
```

### Running in Development Mode

This starts both the Backend (port 3000) and Frontend (port 5173) with hot-reloading.

```bash
./start-dev.sh
# OR manually:
npm run dev
```

*   **Frontend:** `http://localhost:5173`
*   **Backend:** `http://localhost:3000`

### Serial Port Permissions

On Linux/Mac, you may need permission to access the USB serial port.

```bash
sudo usermod -a -G dialout $USER
# Log out and back in for changes to take effect.
```

## 2. Building for Production

The build process compiles the TypeScript backend and bundles the React frontend.

```bash
npm run build
```

This performs:
1.  `tsc -b packages/backend`: Compiles backend TS to `packages/backend/dist/`.
2.  `vite build`: Bundles frontend to `packages/frontend/dist/`.

## 3. Production Deployment (Kiosk)

The production environment is designed to run on a Raspberry Pi in Kiosk mode.

### Production Script (`start-prod.sh`)

The `start-prod.sh` script handles the full startup sequence:
1.  Sets up X11 display environment variables.
2.  Starts the Backend (`npm start-only`).
3.  Waits for port 3000 to be active.
4.  Disables screen blanking and hides the mouse cursor (`unclutter`).
5.  Launches Chromium in Kiosk mode pointing to `http://localhost:3000`.

### Running Production

```bash
./start-prod.sh
```

## 4. Hardware Setup

### Arduino Flashing

See [Arduino Firmware Documentation](../arduino_firmware/README.md).

### Raspberry Pi Configuration

1.  **Serial Port:** The backend defaults to `/dev/ttyAMA0` (UART) or auto-discovers USB serial (`/dev/ttyUSB*` / `/dev/ttyACM*`).
2.  **Auto-Start:** To run on boot, add `start-prod.sh` to `.bashrc` or create a systemd service.

**Systemd Example (`/etc/systemd/system/fue-controller.service`):**

```ini
[Unit]
Description=FUE Controller Kiosk
After=network.target graphical.target

[Service]
User=proge
WorkingDirectory=/home/proge/FUE_Controller
ExecStart=/home/proge/FUE_Controller/start-prod.sh
Restart=always
Environment=DISPLAY=:0

[Install]
WantedBy=graphical.target
```
