# FUE Hair Transplant Micromotor System - Documentation Overview

Welcome to the technical documentation for the FUE Hair Transplant Micromotor System. This repository contains the complete source code for the control system, including the embedded firmware, backend server, and frontend user interface.

## Repository Structure

The project follows a **monorepo** architecture, organized under the `packages/` directory:

| Directory | Package | Description |
| :--- | :--- | :--- |
| `packages/arduino_firmware/` | `FUE_Slave_v4_1` | C++ firmware for the Arduino microcontroller. Handles real-time motor control and sensor inputs. |
| `packages/backend/` | `backend` | Node.js (TypeScript) server. Manages serial communication, business logic, recipes, and serves the frontend. |
| `packages/frontend/` | `frontend` | React (Vite/TypeScript) single-page application. Provides the clinical and engineering user interfaces. |
| `packages/shared-types/` | `shared-types` | TypeScript definitions shared between Frontend and Backend to ensure type safety. |
| `docs/` | - | This documentation folder. |

## Quick Links

- **[Architecture](./01-architecture.md)**: High-level system design and component interaction.
- **[System Flows](./02-system-flows.md)**: Critical runtime sequences (Motor Control, Pedal, etc.).
- **[Protocol Specification](./03-protocol-unicom-v4_1.md)**: Detailed serial communication protocol (Unicom v4.1).
- **[Safety & Failure Modes](./04-safety-and-failure-modes.md)**: Safety mechanisms and error handling.
- **[Build & Deploy](./05-build-run-deploy.md)**: Instructions for development and production setup.
- **[Configuration](./06-config-and-env.md)**: Environment variables and configuration files.

## Key Technologies

- **Runtime:** Node.js (Backend), Browser (Frontend)
- **Languages:** TypeScript, C++ (Arduino)
- **Frameworks:** Express.js, Socket.IO, React, Vite
- **Communication:** Serial (UART) over USB, WebSocket (Socket.IO)
- **Hardware:** Raspberry Pi (Host), Arduino (Motor Controller)
