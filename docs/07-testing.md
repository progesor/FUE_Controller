# Testing Strategy

This document outlines the current testing state and the recommended strategy for ensuring system reliability.

## 1. Current State (Manual Testing)

Testing is primarily performed manually using the **Engineering Panel** (`packages/frontend/src/views/EngineeringLayout.tsx`) and physical hardware.

### Manual Test Plan
1.  **Hardware Loop:**
    -   Connect Arduino via USB.
    -   Run Backend (`npm run dev --workspace=backend`).
    -   Open Frontend (`http://localhost:5173`).
    -   Check "Status: Connected".
2.  **Motor Function:**
    -   In Clinical View, set RPM to 1000.
    -   Press "Start" / "Stop". Verify motor spins.
    -   Press Pedal. Verify motor starts (Debounce working?).
3.  **Mode Switching:**
    -   Switch to Oscillation. Set Angle 180. Start.
    -   Verify alternating movement.
    -   Switch to Pulse. Verify intermittent movement.
4.  **Failure Recovery:**
    -   Unplug USB cable while running. UI should show "Disconnected".
    -   Plug back in. UI should show "Connected".

## 2. Automated Testing (Proposed)

Currently, the repository lacks automated unit and integration tests. The following strategy is recommended:

### 2.1 Unit Tests (Backend)
Focus on pure logic that doesn't require hardware.
- **Framework:** `Jest` or `Vitest`.
- **Target Files:**
    -   `packages/backend/src/services/calibrationService.ts`: Verify `getMsFromCalibration` returns correct values.
    -   `packages/backend/src/services/recipeService.ts`: Mock `ArduinoService` and test step transitions.

### 2.2 Integration Tests (Mock Serial)
Test the `ArduinoService` without physical hardware by mocking `serialport`.
- **Tool:** `mock-serialport` or custom mock class.
- **Scenario:**
    -   Simulate sending `DEV.MOTOR.SET_PWM:100`.
    -   Verify `port.write` receives the correct string.
    -   Simulate receiving `EVT:PEDAL:1`.
    -   Verify `socket.emit('arduino_event', ...)` is triggered.

### 2.3 Frontend Tests (Component)
Test UI components in isolation.
- **Tool:** `Vitest` + `React Testing Library`.
- **Target:**
    -   `HolographicGauge`: Verify rendering of RPM values.
    -   `RecipeDrawer`: Verify list rendering and selection.

## 3. Hardware-in-the-Loop (HITL)

For critical safety testing, a HITL setup is ideal but complex.
- **Setup:** A second Arduino running a "Simulator Sketch" connected to the Backend Arduino's pins.
- **Test:** The simulator measures the PWM output frequency and direction pin states to verify the control logic.
