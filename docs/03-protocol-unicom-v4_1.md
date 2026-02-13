# UniCom v4.1 Protocol Specification

This document defines the serial communication protocol between the Backend (Host) and the Arduino Firmware (Slave).

## 1. Physical Layer

*   **Interface:** UART / USB Serial
*   **Baud Rate:** `115200` bps
*   **Data Bits:** 8
*   **Parity:** None
*   **Stop Bits:** 1
*   **Flow Control:** None
*   **Voltage:** 5V (Arduino standard)

## 2. Framing

The protocol is text-based (ASCII).

*   **Delimiter:** Newline (`\n`, ASCII 10).
*   **Command Format:** `GROUP.COMMAND:PARAM1|PARAM2`
*   **Response Format:** `TYPE:CONTENT`

## 3. Command Set (Host -> Slave)

| Command | Parameters | Description | Arduino Implementation |
| :--- | :--- | :--- | :--- |
| `SYS.PING` | None | Connection check. Expects `PONG`. | `processCommand` -> `SYS.PING` |
| `SYS.INFO` | None | Returns firmware name/version. | `processCommand` -> `SYS.INFO` |
| `SYS.RESET` | None | Software reset of the microcontroller. | `processCommand` -> `SYS.RESET` |
| `DEV.MOTOR.SET_PWM` | `PWM` (0-255) | Sets motor speed. | `processCommand` -> `DEV.MOTOR.SET_PWM` |
| `DEV.MOTOR.SET_DIR` | `DIR` (0: CW, 1: CCW) | Sets motor direction. | `processCommand` -> `DEV.MOTOR.SET_DIR` |
| `DEV.MOTOR.STOP` | None | Stops motor (PWM=0) and cancels timed runs. | `processCommand` -> `DEV.MOTOR.STOP` |
| `DEV.MOTOR.EXEC_TIMED_RUN` | `PWM`\|`DURATION` (ms) | Runs motor for specific duration. | `processCommand` -> `DEV.MOTOR.EXEC_TIMED_RUN` |
| `DEV.MOTOR.BRAKE` | None | Short-circuits motor coils for 25ms to brake. | `processCommand` -> `DEV.MOTOR.BRAKE` |
| `DEV.BUZZER.BEEP` | `DURATION`\|`FREQ` | Plays a tone. | `processCommand` -> `DEV.BUZZER.BEEP` |
| `PIN.SET_MODE` | `PIN`:`MODE` | Sets pin mode (0:IN, 1:OUT, 2:PULLUP). | `processCommand` -> `PIN.SET_MODE` |
| `PIN.SET_D` | `PIN`:`VAL` | Write digital value (0/1). | `processCommand` -> `PIN.SET_D` |
| `PIN.GET_D` | `PIN` | Read digital value. | `processCommand` -> `PIN.GET_D` |
| `PIN.SET_A` | `PIN`:`VAL` | Write analog (PWM) value. | `processCommand` -> `PIN.SET_A` |
| `PIN.GET_A` | `PIN` | Read analog value. | `processCommand` -> `PIN.GET_A` |

## 4. Responses & Events (Slave -> Host)

| Prefix | Format | Description |
| :--- | :--- | :--- |
| `ACK` | `ACK:COMMAND_NAME` | Command received and executed successfully. |
| `ERR` | `ERR:ERROR_CODE` | Command failed (e.g., `INVALID_CMD`). |
| `EVT` | `EVT:SOURCE:VALUE` | Asynchronous event (Pedal, Switch). |
| `DATA` | `DATA:TYPE:PIN:VALUE` | Response to GET commands. |
| `DONE` | `DONE:COMMAND_NAME` | Asynchronous task completion (e.g., Timed Run). |
| `INFO` | `INFO:NAME:VERSION` | Response to `SYS.INFO`. |
| `PONG` | `PONG` | Response to `SYS.PING`. |

### Event Types

| Event | Format | Trigger | Backend Handling |
| :--- | :--- | :--- | :--- |
| **Pedal** | `EVT:PEDAL:1` (Pressed)<br>`EVT:PEDAL:0` (Released) | Input pin state change (Debounced). | Triggers `startCurrentMode()` or `stopMotor()`. |
| **Foot Switch** | `EVT:FTSW:1` (Hand)<br>`EVT:FTSW:0` (Foot) | Switch state change (Debounced). | Emits `arduino_event` to UI. |

## 5. Timing & Latency

*   **Loop Cycle:** The Arduino main loop runs continuously without blocking delays (except 25ms for Brake/Debounce).
*   **Ping Interval:** Backend pings every 3000ms.
*   **Reconnect Timeout:** Backend attempts reconnect every 1000ms if lost.

## 6. Error Handling

*   **Invalid Command:** Arduino sends `ERR:INVALID_CMD`. Backend logs this.
*   **Connection Loss:** Backend detects serial port closure or error, emits `arduino_disconnected`, and retries.
