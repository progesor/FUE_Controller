# Serial/UniCom Bridge

The Backend acts as a bridge between the high-level Socket.IO API and the low-level serial communication with the Arduino firmware. This bridging logic is encapsulated in `packages/backend/src/services/arduinoService.ts`.

## 1. Protocol Overview

The communication uses a custom ASCII-based protocol called **UniCom**.
*   **Format:** `GROUP.COMMAND:PARAM` (terminated by `\n`)
*   **Baud Rate:** 115200
*   **Port:** Defaults to `/dev/ttyAMA0`, but auto-scans for USB serial devices if not found.

## 2. Command Set

The following commands are defined in `packages/shared-types/index.ts` (`ArduinoCommands`) and sent by the backend:

### System Commands
*   `SYS.PING`: checks connection health (sent every 3s).
*   `SYS.INFO`: Requests firmware version and info.
*   `SYS.RESET`: Soft resets the microcontroller.

### Device (Motor) Commands
*   `DEV.MOTOR.SET_PWM:<0-255>`: Sets the PWM duty cycle.
*   `DEV.MOTOR.SET_DIR:<0|1>`: Sets direction (0: CW, 1: CCW).
*   `DEV.MOTOR.STOP`: Stops the motor immediately.
*   `DEV.MOTOR.EXEC_TIMED_RUN:<pwm>|<ms>`: Runs the motor at `pwm` speed for `ms` milliseconds. Used for precise oscillation steps.
*   `DEV.MOTOR.BRAKE`: Actively brakes the motor (short-circuit phases).
*   `DEV.BUZZER.BEEP`: Triggers the buzzer.

## 3. Incoming Data Handling

The backend listens for data on the serial port line-by-line.

### Event Format
Incoming lines starting with `EVT:` are treated as hardware events.

*   `EVT:PEDAL:<0|1>`
    *   **0:** Pedal released -> Stops motor (if running manually).
    *   **1:** Pedal pressed -> Starts motor or Recipe.
    *   **Mapped to:** `arduino_event` (Socket.IO)

*   `EVT:FTSW:<0|1>`
    *   **0:** Hand mode selected.
    *   **1:** Foot mode selected.
    *   **Mapped to:** `arduino_event` (Socket.IO)

### Other Responses
*   `ACK:`: Command acknowledgement.
*   `ERR:`: Error message from firmware.
*   `PONG`: Response to `SYS.PING`.

## 4. Bridge Logic (`arduinoService.ts`)

The service maintains the "Single Source of Truth" (`deviceStatus`) and synchronizes it with the hardware.

1.  **Queueing:** Commands are written directly to the serial port.
2.  **Auto-Reconnect:** If the port closes or errors, `connectToArduino` retries every 1 second until successful.
3.  **Parsing:** `ReadlineParser` splits the stream by `\n`, and `handleData` routes the message.
