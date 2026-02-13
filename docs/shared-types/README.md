# Shared Types

The `shared-types` package defines the contract between the Frontend (UI) and the Backend (Logic). This ensures that data structures passed over Socket.IO are type-safe and consistent.

## Purpose

This package exports TypeScript interfaces, types, and enums that are used by both the Frontend and Backend packages. By centralizing these definitions, we prevent bugs related to data structure mismatches (e.g., frontend expecting a number but backend sending a string).

## Key Definitions

### 1. Device Status
The `DeviceStatus` interface is the Single Source of Truth for the entire system state. The Backend maintains this state and broadcasts it to the Frontend whenever it changes.

```typescript
export interface DeviceStatus {
    motor: MotorStatus;             // PWM, Direction, Active state
    operatingMode: OperatingMode;   // 'continuous', 'oscillation', 'pulse', 'vibration'
    oscillationSettings: OscillationSettings;
    pulseSettings: PulseSettings;
    vibrationSettings: VibrationSettings;
    continuousSettings: ContinuousSettings;
    recipeStatus?: RecipeStatus;    // Optional: Only present if a recipe is running
}
```

### 2. Modes (`OperatingMode`)
Defines the valid operational modes of the device:
- `continuous`: Standard motor rotation.
- `oscillation`: Alternating CW/CCW movement based on Angle/RPM.
- `pulse`: Intermittent rotation (Run/Wait).
- `vibration`: High-frequency, short-duration movement.

### 3. Socket Events
The communication protocol is strictly typed using `ServerToClientEvents` and `ClientToServerEvents` interfaces. This allows IDEs to provide autocompletion for socket.emit() calls.

**Example Event:**
```typescript
interface ClientToServerEvents {
    'set_motor_pwm': (value: number) => void;
    // ...
}
```

### 4. Arduino Commands (`ArduinoCommands`)
A constant object mapping human-readable command names to their protocol string values (e.g., `MOTOR_SET_PWM` -> `DEV.MOTOR.SET_PWM`). This prevents magic strings in the code.

## Usage

In both Frontend and Backend:
```typescript
import { DeviceStatus, OperatingMode } from 'shared-types';
```

## Maintenance
When adding a new feature that involves data exchange:
1.  Update `packages/shared-types/index.ts` first.
2.  Run `npm run build` in `packages/shared-types` (if applicable, though usually just importing the TS file works in monorepo setups).
3.  Update Backend implementation.
4.  Update Frontend implementation.
