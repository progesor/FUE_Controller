# Frontend Application

The Frontend is a React application built with Vite, TypeScript, and Mantine UI. It provides the user interface for clinicians and engineers to control the FUE Micromotor.

## Directory Structure

```
packages/frontend/
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── aura/           # Components for Aura Layout
│   │   ├── clinical/       # Components for Clinical Layout
│   │   ├── engineering/    # Components for Engineering Layout
│   │   └── common/         # Shared components
│   ├── layouts/            # Main screen layouts
│   ├── store/              # State management (Zustand)
│   ├── services/           # Socket.IO client
│   ├── views/              # Page views (Aura, Clinical, Engineering)
│   ├── App.tsx             # Root component
│   └── main.tsx            # Entry point
├── vite.config.ts          # Vite configuration
└── package.json
```

## Architecture

### 1. State Management (Zustand)
The application state is centralized in `useControllerStore.ts`. It mirrors the `DeviceStatus` from the backend and adds UI-specific state.
- **Store:** `useControllerStore`
- **Actions:** `setMotorStatus`, `setOperatingMode`, `updateDeviceStatus`, etc.

### 2. Communication (Socket.IO)
The frontend connects to the backend via WebSocket.
- **Service:** `socketService.ts`
- **Events:** Listens for `device_status_update`, `arduino_event`, etc.
- **Optimistic Updates:** Some actions update the local store immediately for responsiveness, while the backend confirms the state later via broadcast.

### 3. Layouts
The app features three distinct layouts, switchable by the user:
- **Aura Layout:** A futuristic, dark-mode interface with holographic gauges. Focused on visual feedback.
- **Clinical Layout:** A clean, professional interface for standard medical use.
- **Engineering Layout:** A dense interface with raw data, logs, and advanced settings for debugging and calibration.

### 4. Styling
- **Framework:** Mantine UI (v7).
- **CSS Modules:** Used for component-specific styling (e.g., `AuraLayout.module.css`).

## Key Components

- **HolographicGauge:** A custom SVG-based gauge for RPM and Angle display (Aura).
- **RecipeDrawer:** A side panel for selecting and running recipes.
- **DevConsolePanel:** A log viewer in the Engineering layout for inspecting serial commands and socket events.

## Development

```bash
cd packages/frontend
npm run dev
# Runs on http://localhost:5173
```

## Configuration
- **Vite Config:** configured to proxy API requests or connect to specific backend ports.
- **Calibration:** `config/calibration.ts` contains the UI-side validation for RPM/Angle steps (must match Backend!).
