# Concurrency Model & Failure Handling

The Backend utilizes the Node.js **single-threaded Event Loop** to handle concurrency. While CPU-intensive tasks could block the loop, this application is I/O-bound (Serial & Network), making the model highly efficient.

## 1. Event Loop Architecture

### Timer-Based Motor Control
The "Smart Modes" (Oscillation, Pulse, Vibration) rely on `setInterval` to create non-blocking, precise timing loops.

*   **Oscillation:** Toggles direction every `X` milliseconds (calculated from RPM & Angle).
*   **Pulse:** Runs motor for `pulseDuration`, then waits for `pulseDelay`.
*   **Vibration:** Rapidly switches direction based on `frequency` setting.
*   **Ramping (Soft Start):** Gradually increases PWM over `rampDuration` using `setInterval`.

**Crucial Logic:**
`internalStopMotor()` ensures all active intervals (`oscillationInterval`, `pulseInterval`, etc.) are cleared before starting a new mode. This prevents "interval pile-up" where multiple loops might try to control the motor simultaneously.

### Non-Blocking I/O
*   **Serial Port:** Reads and writes are asynchronous. The `parser.on('data')` handler processes incoming bytes as they arrive without blocking the main thread.
*   **Socket.IO:** Handlers like `socket.on('set_motor_pwm')` are executed only when an event is received.

## 2. Failure Handling strategies

### Serial Disconnection
The system is designed to be resilient to hardware disconnects (e.g., USB cable unplugged).

*   **Detection:** The `serialport` library emits a `close` or `error` event.
*   **Recovery:** `connectToArduino` function recursively calls itself via `setTimeout` (default 1000ms) until a connection is re-established.
*   **State:** `isArduinoConnected` flag is updated and broadcast to the Frontend (`arduino_disconnected` event).

### Race Condition Prevention
Since Node.js is single-threaded, we don't need mutexes for variable access. However, logical race conditions can occur if multiple sources (e.g., Pedal + UI Button) try to control the motor at the same time.

**Solution: Single Source of Truth (`deviceStatus`)**
1.  All commands update the central `deviceStatus` object first.
2.  The hardware is then commanded to match this state.
3.  The new state is broadcast to all clients.
This ensures that the UI always reflects the actual intention of the system, even if commands come from different sources rapidly.

### Error Logging
*   Unexpected errors in the serial port or calibration lookup are logged to `stderr`.
*   Critical errors (like missing calibration data) stop the motor safely (`stopMotor()`) to prevent undefined behavior.
