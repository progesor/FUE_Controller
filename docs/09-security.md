# Security

This document addresses security considerations for the FUE Micromotor System.

## 1. Physical Access

The primary security model assumes the device is physically accessible only to authorized personnel (clinicians, engineers) in a secure environment.

### 1.1 Kiosk Mode
- The system runs in Kiosk mode on a Raspberry Pi (`start-prod.sh`), limiting user interaction to the designated UI.
- **Risk:** Physical access to USB ports allows connecting malicious devices or extracting logs/firmware.
- **Mitigation:**
    - Use a dedicated enclosure for the Raspberry Pi.
    - Disable unused USB ports (software or physical covers).

## 2. Network Security

### 2.1 Interface Exposure
- **Frontend:** Listens on port `5173` (Dev) or served via Backend (Prod).
- **Backend:** Listens on port `3000`.
- **Exposure:** Currently binds to `0.0.0.0` (all interfaces) in production.
- **Risk:** Anyone on the local network can access the control interface.
- **Mitigation:**
    - Isolate the device on a dedicated VLAN or use a firewall (`ufw`) to restrict access.
    - If remote access is not needed, bind to `127.0.0.1` (localhost only).

### 2.2 Communication Encryption
- **Frontend <-> Backend:** Uses standard HTTP/WebSocket.
    - **Risk:** Unencrypted traffic on local network.
    - **Mitigation:** If deployed on a shared network, enable HTTPS (TLS) on the backend using a reverse proxy (Nginx).

## 3. Input Validation

### 3.1 Serial Commands
- **Sanitization:** The firmware parses commands using `String` functions but does not strictly validate parameter ranges beyond basic checks.
- **Risk:** Sending `DEV.MOTOR.SET_PWM:999` might cause undefined behavior (though `toInt()` handles overflow somewhat safely).
- **Mitigation:**
    - Backend `arduinoService.ts` strictly validates inputs (e.g., `Math.max(0, Math.min(255, value))`) before sending.
    - Firmware should add explicit bounds checking.

### 3.2 Frontend Input
- **Type Safety:** TypeScript interfaces ensure that the frontend sends valid data structures (e.g., `set_motor_pwm` expects a number).
- **Validation:** Frontend components (sliders, inputs) restrict values to valid ranges defined in `calibration.ts`.

## 4. Data Privacy

- **Patient Data:** The system does *not* store patient PII (Personally Identifiable Information). It only stores procedure data (Graft Count, Time) locally in memory and recipes in `recipes.json`.
- **Recipes:** Stored in plain text JSON.
    - **Risk:** Recipes could be modified or deleted if file access is gained.
    - **Mitigation:** Restrict file permissions on `recipes.json` to the service user only.
