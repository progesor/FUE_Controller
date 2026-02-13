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
The application state is centralized in `packages/frontend/src/store/useControllerStore.ts`. It mirrors the `DeviceStatus` from the backend and adds UI-specific state.
- **Store:** `useControllerStore`
- **Actions:** `setMotorStatus`, `setOperatingMode`, `updateDeviceStatus`, etc.
- **Updates:** `updateDeviceStatus` is called on `device_status_update` events from the backend to sync the store.

### 2. Communication (Socket.IO)
The frontend connects to the backend via WebSocket using `packages/frontend/src/services/socketService.ts`.
- **Service:** `socketService.ts` handles the connection and emits/listens for events.
- **Initialization:** `listenToEvents()` is called once in `packages/frontend/src/App.tsx`.
- **Events:** Listens for `device_status_update`, `arduino_event`, `recipe_status_update`.
- **Optimistic Updates:** Some actions update the local store immediately for responsiveness, while the backend confirms the state later via broadcast.

### 3. Layouts
The app features three distinct layouts, switchable by the user via `packages/frontend/src/views/LayoutSelector.tsx`:
- **Aura Layout (`packages/frontend/src/views/AuraLayout.tsx`):** A futuristic, dark-mode interface with holographic gauges. Focused on visual feedback.
- **Clinical Layout (`packages/frontend/src/views/ClinicalLayout.tsx`):** A clean, professional interface for standard medical use.
- **Engineering Layout (`packages/frontend/src/views/EngineeringLayout.tsx`):** A dense interface with raw data, logs, and advanced settings for debugging and calibration.

### 4. Styling
- **Framework:** Mantine UI (v7).
- **CSS Modules:** Used for component-specific styling (e.g., `packages/frontend/src/views/AuraLayout.module.css`).

## Key Components and Data Flow

1.  **Root (`App.tsx`):** Initializes `socketService` and routes to the appropriate layout.
2.  **Layouts (`AuraLayout`, `ClinicalLayout`):** Subscribe to `useControllerStore` to display motor state (RPM, Angle) and dispatch actions (`setMotorStatus`) on user interaction.
    - Example: `AuraLayout` uses `HolographicGauge` to modify RPM.
3.  **Components (`HolographicGauge`, `RecipeDrawer`):** receive props or use store actions directly to update UI or trigger backend commands via `socketService`.

**Data Flow Example (User changes RPM):**
1.  User interacts with `HolographicGauge` in `AuraLayout`.
2.  `handleRpmChange` is called.
3.  Store is updated optimistically: `setMotorStatus({ pwm: newPwm })`.
4.  Command is sent to backend: `sendMotorPwm(newPwm)` via `socketService`.
5.  Backend processes command, updates hardware, and broadcasts new status.
6.  Frontend receives `device_status_update`, calling `updateDeviceStatus` in store to confirm state.

## Realtime Updates & Pedal Interactions

Realtime updates are critical for displaying motor speed and pedal state accurately.

### Socket Event Loop
- **Backend Source:** `packages/backend/src/services/socketService.ts` broadcasts `device_status_update` periodically or on change.
- **Frontend Listener:** `packages/frontend/src/services/socketService.ts` listens for `device_status_update`.
- **Store Update:** The listener calls `useControllerStore.getState().updateDeviceStatus(status)`.

### Pedal Interaction
- **Hardware Event:** Arduino sends a serial message `PEDAL:1` (pressed) or `PEDAL:0` (released).
- **Backend Processing:** Backend emits `arduino_event` via socket.
- **Frontend Handling:**
    - `socketService` listens for `arduino_event`.
    - If `type === 'PEDAL'` and `state === 0` (released), it calls `incrementGraftCount()` in the store.
    - If `type === 'FTSW'`, it toggles `ftswMode` (Hand/Foot) in the store.
    - Reference: `packages/frontend/src/services/socketService.ts` (lines ~90-105).

## Performance and UX Pitfalls

### 1. Excessive Re-renders
- **Issue:** Components often subscribe to the entire store state.
    - Example: `const { motor } = useControllerStore();` in `AuraLayout.tsx`.
    - **Effect:** Any update to `sessionTime` (ticking every second) or `consoleEntries` (logging) causes the entire layout to re-render, even if only `motor.pwm` is needed.
- **Improvement:** Use specific selectors.
    - `const motor = useControllerStore(state => state.motor);`
    - This ensures the component only re-renders when `motor` object changes.

### 2. Socket Message Overload (Jitter)
- **Issue:** Rapid updates from backend (e.g., during a ramp-up) might conflict with local state if the user is dragging a slider.
- **Mitigation:** `isIgnoringStatusUpdates` flag in `useControllerStore.ts`.
    - When a user interacts with a slider (startDragging), `startIgnoringStatusUpdates()` is called.
    - This temporarily blocks `device_status_update` from overwriting local state for ~400ms, preventing the slider from "jumping" back to the old value.
    - Reference: `packages/frontend/src/store/useControllerStore.ts` `startIgnoringStatusUpdates`.

### 3. Large Logs in Store
- **Issue:** `consoleEntries` array in store grows indefinitely.
- **Effect:** Large state object slows down Redux DevTools and potential selector performance.
- **Improvement:** Implement a limit (e.g., keep last 500 logs) in `addConsoleEntry`.

## Development

```bash
cd packages/frontend
npm run dev
# Runs on http://localhost:5173
```

## Configuration
- **Vite Config:** configured to proxy API requests or connect to specific backend ports.
- **Calibration:** `packages/frontend/src/config/calibration.ts` contains the UI-side validation for RPM/Angle steps (must match Backend!).
