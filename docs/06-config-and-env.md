# Configuration and Environment

The system is configured through environment variables, static configuration files, and `calibration` constants.

## 1. Environment Variables

The project uses minimal environment variables, mainly relying on `NODE_ENV` and `config.ts`.

| Variable | Description | Default | Location |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | Environment mode (`development` or `production`). | `development` | `package.json` scripts |
| `DISPLAY` | X11 Display server (For Kiosk). | `:0` | `start-prod.sh` |
| `XAUTHORITY` | X11 Authority file. | `/home/proge/.Xauthority` | `start-prod.sh` |

## 2. Backend Configuration (`packages/backend/src/config.ts`)

These settings control the server behavior and hardware connection.

| Setting | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `server.port` | number | `3000` | Port for Express/Socket.IO server. |
| `arduino.port` | string | `'/dev/ttyAMA0'` | Serial port path. If empty, auto-discovery is used. |
| `arduino.baudRate` | number | `115200` | Serial communication speed. Must match Firmware. |
| `arduino.reconnectTimeout` | number | `1000` | Retry interval (ms) if connection is lost. |
| `arduino.pingInterval` | number | `3000` | Heartbeat interval (ms). |
| `arduino.portIdentifiers` | string[] | `['arduino', 'usb2.0-serial']` | Keywords for auto-discovery. |
| `socket.cors.origin` | string | `"http://localhost:5173"` | Allowed frontend origin (CORS). |

## 3. Frontend Configuration

### Calibration (`packages/frontend/src/config/calibration.ts`)
Defines the valid RPM steps and their corresponding PWM values. **Critical:** This file mirrors the backend's `calibrationService.ts` logic but is used for UI rendering (Gauges).

| Setting | Type | Example | Description |
| :--- | :--- | :--- | :--- |
| `RPM_CALIBRATION_MARKS` | `{rpm, pwm}[]` | `[{rpm: 500, pwm: 8}, ...]` | Mapping of RPM to PWM. |
| `VALID_ANGLES` | `number[]` | `[180, 225, 270, ...]` | Allowed oscillation angles (degrees). |

### Vite Config (`vite.config.ts`)
| Setting | Value | Description |
| :--- | :--- | :--- |
| `server.host` | `true` | Allows external access (Listen on 0.0.0.0). |
| `server.allowedHosts` | `['raspberrypi.local']` | Allowed host headers. |

## 4. Hardware Constants

Located in `packages/backend/src/services/calibrationService.ts` (Backend) and `packages/frontend/src/config/calibration.ts` (Frontend).

**Warning:** If you update calibration data, you must update BOTH files to ensure the UI matches the actual motor behavior.
