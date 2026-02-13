# Glossary

This document defines key terms and acronyms used in the FUE Micromotor System.

## A
*   **Arduino:** The microcontroller platform (Atmel AVR based) that directly controls the micromotor hardware.
*   **Aura Layout:** A futuristic, high-contrast user interface theme designed for visual impact.

## B
*   **Backend:** The Node.js server application responsible for business logic, serial communication, and serving the frontend.
*   **Baud Rate:** The speed of data transmission in bits per second (bps). The system uses 115200 bps.

## C
*   **Calibration:** The process of mapping user-friendly units (RPM, Angle) to low-level hardware control signals (PWM, Duration).
*   **Continuous Mode:** A motor operation mode where the motor spins in a single direction at a constant speed.
*   **CW (Clockwise):** Motor rotation direction. Typically associated with `DIR=0`.
*   **CCW (Counter-Clockwise):** Motor rotation direction. Typically associated with `DIR=1`.

## D
*   **Debounce:** A software technique used to filter out noise from mechanical switches (like the foot pedal) to prevent multiple false triggers from a single press.
*   **DeviceStatus:** The central data structure in the backend that represents the current state of the entire system (Motor, Mode, Recipe, etc.).

## F
*   **Firmware:** The low-level software running on the Arduino microcontroller (`FUE_Slave_v4_1.ino`).
*   **Frontend:** The React-based user interface running in the browser (Chromium Kiosk).
*   **FUE (Follicular Unit Extraction):** A hair transplant technique where individual hair follicles are extracted using a micromotor punch.

## G
*   **Graft:** A single follicular unit extracted during the procedure. The system tracks the "Graft Count".

## K
*   **Kiosk Mode:** A browser mode that runs the application full-screen without address bars or window controls, intended for dedicated appliances.

## M
*   **Monorepo:** A software development strategy where code for many projects (Backend, Frontend, Firmware) is stored in the same repository.

## O
*   **Oscillation Mode:** A motor operation mode where the motor rapidly alternates direction (CW <-> CCW) to facilitate punch extraction.
*   **Observability:** The ability to understand the internal state of the system based on its external outputs (logs, metrics).

## P
*   **Pedal:** A foot-operated switch used by the clinician to start and stop the motor hands-free.
*   **PWM (Pulse Width Modulation):** A method of controlling the average power delivered to the motor by rapidly switching the voltage on and off. Used for speed control (0-255).
*   **Pulse Mode:** A motor operation mode where the motor runs for a short duration, stops, and repeats.

## R
*   **Recipe:** A saved sequence of motor operations (Speed, Mode, Duration) that can be replayed.
*   **RPM (Revolutions Per Minute):** The rotational speed of the motor.

## S
*   **Serial Protocol (Unicom):** The custom ASCII-based communication protocol used between the Backend and Firmware.
*   **Socket.IO:** A library that enables real-time, bidirectional communication between the Frontend and Backend.

## V
*   **Vibration Mode:** A motor operation mode that uses high-frequency, short-duration movements to create a vibration effect.
