# Safety and Failure Modes

This document outlines the safety mechanisms, potential failure modes, and recovery strategies implemented in the FUE Micromotor System.

## 1. Safety Mechanisms

### 1.1 Firmware Level

- **Non-Blocking Execution:** The `FUE_Slave_v4_1.ino` firmware uses `millis()` for time tracking, ensuring the main loop never blocks. This allows the system to respond immediately to `STOP` commands even while executing a timed run.
- **Input Debouncing:** Both the Pedal and Mode Switch inputs have a 25ms software debounce to prevent false triggering from electrical noise.
- **Safe Startup State:** In `setup()`, the motor PWM is set to 0, and direction pins are set to a safe state (LOW).
- **Watchdog (TODO):** Currently, the firmware does *not* implement a communication watchdog. If serial communication is lost while the motor is running, it may continue running until power is cut or a new command is received. **Recommendation: Implement a 500ms watchdog timer in firmware to auto-stop motor if no heartbeat is received.**

### 1.2 Backend Level

- **Connection Monitoring:** The `ArduinoService` sends `SYS.PING` every 3000ms. If the serial port closes or errors out, the `arduino_disconnected` event is emitted immediately, and the UI reflects this state.
- **Graceful Shutdown:** On `SIGINT` or `SIGTERM`, the backend attempts to close the serial port cleanly (though `process.on('exit')` handling is minimal in current code).
- **Mode Transitions:** When switching modes (e.g., from Continuous to Oscillation), `internalStopMotor()` is called first to clear any existing intervals and stop the motor before starting the new mode.
- **PWM Limits:** `setMotorPwm` clamps values between 0 and 255.

### 1.3 Electrical / Hardware Level

- **Pull-up Resistors:** The Pedal and Switch inputs use `INPUT_PULLUP`, ensuring a defined HIGH state when disconnected or open. Active state is LOW (grounded).
- **L298N Isolation:** The motor driver provides some isolation between the high-current motor circuit and the Arduino logic (though optocouplers would be better for full isolation).

## 2. Failure Modes & Recovery

| Failure Mode | Detection | System Response | Recovery Action |
| :--- | :--- | :--- | :--- |
| **USB Disconnection** | Backend receives `close` or `error` event from SerialPort. | Emits `arduino_disconnected` to UI. Motor *may* continue running (Firmware limitation). | Backend automatically retries connection every 1000ms. User should reconnect cable. |
| **Backend Crash** | Process exits. | Serial connection closes. Motor *may* continue running. | System service (e.g., systemd) should restart backend. |
| **Frontend Disconnect** | Socket.IO `disconnect` event. | Backend logs disconnect. Motor continues running (intended behavior - UI shouldn't be critical for safety stop if Pedal is physical). | User refreshes page. State is re-synced on connect. |
| **Pedal Stuck (High)** | Firmware sees continuous LOW signal. | Motor runs continuously. | User must unplug pedal or use UI "Stop" button. |
| **Invalid Command** | Firmware sends `ERR:INVALID_CMD`. | Backend logs warning. | Ignored; System continues. |

## 3. Operational Limits

- **Max PWM:** 255 (100% Duty Cycle).
- **Min PWM:** 0 (Motor Stop).
- **Max Oscillation Frequency:** Limited by serial communication speed (115200 baud) and `setInterval` overhead (approx 10-20ms).
- **Protocol Buffer:** 64 bytes (Firmware `inputString.reserve(64)`). Commands longer than this may be truncated or cause buffer overflow issues (though standard commands are short).

## 4. Known Risks (Gap Analysis)

1.  **No Firmware Watchdog:** If the USB cable is pulled while the motor is spinning, the Arduino will keep the last PWM value. The motor will not stop until power is cut. **High Priority Fix.**
2.  **Latency:** Software-defined oscillation (Backend-driven) introduces latency due to USB/Serial round-trip time. At high speeds, this may cause irregular oscillation.
3.  **Buffer Overflow:** If the Backend sends commands faster than the Arduino can process them (flooding), the internal serial buffer (64 bytes) might overflow.
