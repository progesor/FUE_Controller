# Backend API Contract

The Backend communicates with the Frontend via **Socket.IO**. This document details the events, payloads, and data structures used in this communication.

**Source:** `packages/shared-types/index.ts`

## 1. Data Structures

### DeviceStatus
The central state object representing the current status of the device.

```typescript
interface DeviceStatus {
    motor: MotorStatus;
    operatingMode: OperatingMode;
    oscillationSettings: OscillationSettings;
    pulseSettings: PulseSettings;
    vibrationSettings: VibrationSettings;
    continuousSettings: ContinuousSettings;
    recipeStatus?: RecipeStatus;
}
```

### MotorStatus
```typescript
interface MotorStatus {
    pwm: number;             // 0-255
    direction: 0 | 1;        // 0: CW, 1: CCW
    isActive: boolean;
}
```

### OperatingMode
Type: `'continuous' | 'oscillation' | 'pulse' | 'vibration'`

### Settings Interfaces
*   **OscillationSettings:** `{ angle: number; pwm?: number; }`
*   **PulseSettings:** `{ pulseDuration: number; pulseDelay: number; pwm?: number; }`
*   **VibrationSettings:** `{ intensity: number; frequency: number; }`
*   **ContinuousSettings:** `{ rampDuration: number; pwm?: number; }`

### Recipe & RecipeStep
```typescript
interface Recipe {
    id: string;
    name: string;
    steps: RecipeStep[];
}

interface RecipeStep {
    id: string;
    mode: OperatingMode;
    duration: number; // ms
    settings: Partial<AllModeSettings>;
}
```

## 2. Server -> Client Events

These events are emitted by the Backend to the Frontend.

| Event Name | Payload | Description |
| :--- | :--- | :--- |
| `device_status_update` | `DeviceStatus` | Sent whenever any part of the device state changes (motor, settings, mode). |
| `arduino_event` | `{ type: 'PEDAL' \| 'FTSW', state: 0 \| 1 }` | Triggered by hardware interrupts (Pedal press/release, Foot/Hand switch toggle). |
| `arduino_connected` | `void` | Sent when the Serial Port connection is successfully established. |
| `arduino_disconnected` | `void` | Sent when the Serial Port connection is lost. |
| `calibration_data_response` | `{ pwm: number; duration: number }` | Response to `get_calibration_data` request. |
| `recipe_status_update` | `RecipeStatus` | Sent periodically during recipe execution to update progress. |
| `recipe_list_update` | `Recipe[]` | Sent when a recipe is saved or deleted. |

## 3. Client -> Server Events

These events are sent by the Frontend to the Backend.

| Event Name | Payload | Description |
| :--- | :--- | :--- |
| `set_motor_pwm` | `number` (0-255) | Sets the target motor speed. |
| `set_motor_direction` | `0 \| 1` | Sets the motor direction. |
| `start_motor` | `void` | Starts the motor in the current mode. |
| `stop_motor` | `void` | Stops the motor immediately. |
| `start_oscillation` | `{ pwm, angle, rpm }` | Starts oscillation mode with specific parameters. |
| `set_operating_mode` | `OperatingMode` | Changes the active mode (stops motor if running). |
| `set_oscillation_settings` | `OscillationSettings` | Updates oscillation parameters. |
| `set_pulse_settings` | `PulseSettings` | Updates pulse mode parameters. |
| `set_vibration_settings` | `VibrationSettings` | Updates vibration mode parameters. |
| `set_continuous_settings` | `ContinuousSettings` | Updates continuous mode parameters (e.g., ramp). |
| `recipe_start` | `Recipe` | Starts executing the provided recipe. |
| `recipe_stop` | `void` | Stops the currently running recipe. |
| `recipe_save` | `Recipe` | Saves a new or updated recipe to persistence. |
| `recipe_delete` | `string` (Recipe ID) | Deletes a recipe. |
| `set_active_recipe` | `Recipe \| null` | Selects a recipe to be started by the foot pedal. |
| `send_raw_command` | `string` | Sends a raw text command to the Arduino (for debugging). |
| `get_calibration_data` | `{ rpm, angle }` | Requests calibration data for specific parameters. |
