# Observability and Debugging

This document outlines how to monitor, debug, and troubleshoot the FUE Micromotor System.

## 1. Logging

### 1.1 Backend Logs
The backend logs major events to `stdout`.

- **Format:** `[Server -> Device]: CMD` or `[Client -> Server]: EVENT`.
- **View (Dev):** Check the terminal where `npm run dev` is running.
- **View (Prod):** Check the systemd service logs:
    ```bash
    journalctl -u fue-controller -f
    ```

### 1.2 Frontend Logs
The frontend logs errors and connection status to the browser console.

- **DevTools:** `F12` -> Console tab.
- **Engineering Layout:** The **Dev Console Panel** (`packages/frontend/src/components/engineering/panels/DevConsolePanel.tsx`) displays a real-time feed of Socket.IO events and local logs.

## 2. Debugging Playbook

### 2.1 Hardware Connection Issues
**Symptom:** UI says "Arduino Disconnected".
**Steps:**
1.  Check physical USB connection.
2.  Check serial port permissions: `ls -l /dev/ttyAMA0`. User `proge` should be in `dialout` group.
3.  Check backend logs for "Arduino portu bulunamadı" or specific errors.
4.  Try different USB ports.

### 2.2 Motor Not Spinning
**Symptom:** UI shows "Running" but motor is stopped.
**Steps:**
1.  Check power supply to the motor driver (L298N).
2.  Check motor wiring.
3.  Verify `DEV.MOTOR.SET_PWM` is being sent in Backend logs.
4.  Check if `DEV.MOTOR.STOP` was accidentally sent (e.g., pedal released).

### 2.3 Erratic Movement (Oscillation)
**Symptom:** Motor stutters or moves randomly.
**Steps:**
1.  Check latency/CPU usage on Raspberry Pi (`htop`). High load can disrupt `setInterval` timing.
2.  Verify `calibrationService.ts` values. If time is too short for the motor to physically reverse, it may stall.
3.  Check for electrical noise on `MOTOR_DIR` pins.

## 3. Metrics (Proposed)

Currently, no metrics are exported. Adding a `/metrics` endpoint (Prometheus format) to the backend is recommended to track:
- **Uptime:** System run time.
- **Motor Usage:** Total run time (hours).
- **Graft Count:** Total grafts extracted.
- **Error Rate:** Number of serial errors / disconnects.
