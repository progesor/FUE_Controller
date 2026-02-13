# Roadmap and Improvements

This document outlines potential improvements, feature ideas, and known technical debt for the FUE Micromotor System.

## 1. High Priority (Safety & Stability)

- [ ] **Firmware Watchdog:** Implement a safety timeout in `FUE_Slave_v4_1.ino`. If no valid command is received within 500ms, the motor should automatically stop. This prevents runaway motor if the USB cable is disconnected or the backend crashes.
- [ ] **Unit Tests:** Add comprehensive unit tests for `calibrationService.ts` and `recipeService.ts` to ensure logic correctness without hardware.
- [ ] **Error Handling:** Improve backend error handling for Serial Port disconnects. Ensure the UI clearly shows "Reconnecting..." and disables controls.
- [ ] **Input Validation:** Enforce strict bounds checking in Firmware for `PWM` (0-255) and `Angle`.

## 2. Performance & Timing

- [ ] **Firmware-Based Oscillation:** Move the oscillation logic (CW -> Wait -> CCW -> Wait) from the Backend (Node.js `setInterval`) to the Firmware (Arduino `millis()` loop).
    - *Benefit:* Much tighter timing control, elimination of USB latency jitter, smoother operation at high speeds.
    - *Implementation:* Add a new command `DEV.MOTOR.START_OSC:PWM|ANGLE|RPM` that handles the loop internally.
- [ ] **Hardware Ramp:** Implement ramp-up/down logic in Firmware to offload the Backend.
    - *Benefit:* Smoother acceleration curves, reduced serial traffic.

## 3. Features

- [ ] **User Accounts:** Add basic authentication (Login) for Clinicians vs. Engineers.
- [ ] **Patient Database:** Integrate a lightweight local database (SQLite) to store procedure history (Date, Graft Count, Duration) linked to a patient ID.
- [ ] **Remote Updates:** Mechanism to update the Firmware and Backend software remotely (OTA).
- [ ] **Touch Calibration:** Add a calibration screen for the touchscreen interface.

## 4. Hardware Improvements

- [ ] **Dedicated PCB:** Move from breadboard/wires to a custom PCB for better reliability and noise immunity.
- [ ] **Isolators:** Use optocouplers for all inputs (Pedal, Switches) and the motor driver control lines to protect the Arduino/Pi from voltage spikes.
- [ ] **Encoder Feedback:** Add a rotary encoder to the motor for closed-loop speed control (True RPM instead of estimated/calibrated RPM).
