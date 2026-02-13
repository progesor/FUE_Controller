# FUE Hair Transplant Micromotor System

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
![Monorepo](https://img.shields.io/badge/Architecture-Monorepo-green)
![Status: Active](https://img.shields.io/badge/Status-Active-success)

A complete control system for a hair transplant micromotor device, featuring a React-based touchscreen interface, a Node.js backend, and Arduino firmware.

## 📖 Documentation

Detailed documentation is available in the [`docs/`](./docs) directory:

*   **[Overview](./docs/00-overview.md)**: Project structure and high-level description.
*   **[Architecture](./docs/01-architecture.md)**: System design, diagrams (C4), and components.
*   **[System Flows](./docs/02-system-flows.md)**: Critical runtime sequences (Motor, Pedal, Recipes).
*   **[Protocol Spec](./docs/03-protocol-unicom-v4_1.md)**: Full details of the Serial Communication Protocol.
*   **[Safety & Failure Modes](./docs/04-safety-and-failure-modes.md)**: Safety mechanisms and risk analysis.
*   **[Build & Deploy](./docs/05-build-run-deploy.md)**: Instructions for development and production setup.
*   **[Configuration](./docs/06-config-and-env.md)**: Environment variables and config files.
*   **[Testing](./docs/07-testing.md)**: Testing strategy and current status.
*   **[Observability](./docs/08-observability.md)**: Logging and debugging.
*   **[Security](./docs/09-security.md)**: Security considerations.
*   **[Roadmap](./docs/10-roadmap-ideas.md)**: Future improvements and known issues.
*   **[Glossary](./docs/glossary.md)**: Terms and definitions.

## 🚀 Quick Start (Development)

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/progesor/FUE_Controller.git
    cd FUE_Controller
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Start Development Servers:**
    ```bash
    # Starts Backend (3000) and Frontend (5173) concurrently
    ./start-dev.sh
    # OR manually:
    npm run dev
    ```

4.  **Access the UI:**
    Open [http://localhost:5173](http://localhost:5173) in your browser.

## 📂 Repository Structure

The project is organized as a monorepo under `packages/`:

*   **`packages/arduino_firmware`**: C++ Firmware for Arduino Uno/Nano.
*   **`packages/backend`**: Node.js/TypeScript server (Express + Socket.IO).
*   **`packages/frontend`**: React/Vite Single Page Application.
*   **`packages/shared-types`**: TypeScript definitions shared between Frontend and Backend.

## ⚠️ Important Notes

*   **Calibration:** The motor speed (RPM) is calibrated against PWM values in `packages/backend/src/services/calibrationService.ts`. If you change the motor or driver, you must recalibrate.
*   **Safety:** Always test with the motor disconnected or in a safe environment first. The firmware currently lacks a communication watchdog (See [Roadmap](./docs/10-roadmap-ideas.md)).

## License

ISC License. See `package.json` for details.
