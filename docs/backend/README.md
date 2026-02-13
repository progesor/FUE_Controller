# Backend Service

The Backend is a Node.js application responsible for controlling the hardware, managing application state, and serving the frontend.

## Detailed Documentation

*   [**01. API Contract**](./01-api-contract.md): Complete list of Socket.IO events, payloads, and data structures.
*   [**02. Serial/UniCom Bridge**](./02-serial-bridge.md): Protocol details and bridge logic for Arduino communication.
*   [**03. Concurrency & Failure Handling**](./03-concurrency.md): Explanation of the event loop model and error recovery strategies.
*   [**04. Deployment**](./04-deployment.md): Instructions for production deployment (Systemd, etc.).

## Directory Structure

```
packages/backend/
├── src/
│   ├── services/
│   │   ├── arduinoService.ts       # Serial comms & motor logic
│   │   ├── calibrationService.ts   # RPM/Angle lookup tables
│   │   ├── recipeService.ts        # Recipe execution engine
│   │   └── recipePersistenceService.ts # JSON file I/O
│   ├── config.ts                   # Configuration
│   └── server.ts                   # Entry point (Express + Socket.IO)
├── recipes.json                    # Persisted recipes
└── package.json
```

## Key Components

### 1. Arduino Service (`arduinoService.ts`)
This is the core of the hardware control. It:
- Manages the Serial Port connection (auto-reconnects).
- Implements the "Smart Modes" (Oscillation, Pulse, Vibration) using `setInterval`.
- Handles software ramping (Soft Start).
- Maintains the Single Source of Truth (`deviceStatus`).

### 2. Calibration Service (`calibrationService.ts`)
Maps high-level user settings (RPM, Angle) to low-level hardware parameters (PWM, Duration).
- **RPM Calibration:** Converts target RPM to PWM (0-255).
- **Time Calibration:** Converts RPM + Angle to milliseconds for `EXEC_TIMED_RUN`.
- *Note:* The calibration tables are currently hardcoded based on lab measurements.

### 3. Recipe Service (`recipeService.ts`)
Executes multi-step procedures.
- Runs a state machine to advance through `RecipeStep`s.
- Handles timing and mode switching for each step.

### 4. API (Socket.IO)
The backend exposes a WebSocket API for the frontend.
- **Namespace:** `/` (Default)
- **Events:** Defined in `shared-types`.

## Running the Backend

### Development
```bash
cd packages/backend
npm run dev
# Runs with ts-node-dev on port 3000
```

### Production
```bash
npm run build
npm start
# Runs compiled JS from dist/
```

## Configuration
See `src/config.ts`.
- **Port:** 3000
- **Serial Port:** `/dev/ttyAMA0` (Hardcoded default, but attempts auto-discovery if fails).
- **Baud Rate:** 115200
