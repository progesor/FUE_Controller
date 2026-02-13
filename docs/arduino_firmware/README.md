# Arduino Firmware: FUE_Slave_v4_1

This directory contains the C++ source code for the Arduino microcontroller used in the FUE Hair Transplant Micromotor system.

## Overview

The firmware implements the **Unicom v4.1 Protocol** to receive commands from the backend (Raspberry Pi / Node.js) and control the connected hardware (Motor, Pedal, Switches). It is designed to be **non-blocking** (except for brief brake/debounce delays) to ensure responsive motor control and sensor reading.

## Technical Deep Dive

For a detailed analysis of the firmware internals, including state machines, timing constraints, and calibration workflow, please refer to the [Firmware Deep Dive](./deep_dive.md) document.

## Pinout Configuration

The pin mapping is defined in `FUE_Slave_v4_1.ino`:

| Pin | Type | Function | Description |
| :--- | :--- | :--- | :--- |
| `D6` | PWM (Output) | `MOTOR_PWM_PIN` | Motor Speed (L298N Enable Pin) |
| `D7` | Digital (Output) | `MOTOR_DIR1_PIN` | Motor Direction 1 (L298N Input 1) |
| `D8` | Digital (Output) | `MOTOR_DIR2_PIN` | Motor Direction 2 (L298N Input 2) |
| `D2` | Digital (Output) | `BUZZER_PIN` | Buzzer for audible feedback |
| `D9` | Digital (Input_Pullup) | `PEDAL_PIN` | Foot Pedal (Active Low) |
| `D12` | Digital (Input_Pullup) | `FTSW_PIN` | Hand/Foot Mode Switch (Active Low) |

## Key Features

- **Non-Blocking Architecture:** Uses `millis()` for timing, allowing the `loop()` to run continuously.
- **Debounced Inputs:** Pedal and Switch inputs are debounced (25ms delay) to prevent false triggering.
- **Safety Features:**
    - Pins are initialized to safe states in `setup()`.
    - `DEV.MOTOR.STOP` command immediately sets PWM to 0.
    - Brake function (`DEV.MOTOR.BRAKE`) locks the motor briefly.
- **Event Reporting:** Changes in input pin states are immediately reported to the backend via `EVT:` messages.

## Build and Upload

The firmware is a standard Arduino sketch (`.ino`). It can be compiled and uploaded using the Arduino IDE or `arduino-cli`.

### Requirements
- Arduino IDE (1.8.x or 2.x) or `arduino-cli`
- Target Board: Arduino Uno / Nano (ATmega328P) or compatible.

### Upload Instructions (CLI)
1.  Connect the Arduino via USB.
2.  Run:
    ```bash
    arduino-cli compile --fqbn arduino:avr:uno packages/arduino_firmware/FUE_Slave_v4_1
    arduino-cli upload -p /dev/ttyACM0 --fqbn arduino:avr:uno packages/arduino_firmware/FUE_Slave_v4_1
    ```
    *(Adjust port `/dev/ttyACM0` and FQBN as needed)*
