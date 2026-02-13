# 1. Record Architecture Decisions

Date: 2024-05-22

## Status

Accepted

## Context

We need to build a robust control system for a FUE Hair Transplant Micromotor. The system requires:
1.  **Real-time control:** Low latency motor adjustments.
2.  **Rich User Interface:** Touchscreen interaction for clinicians and engineers.
3.  **Hardware Abstraction:** Decoupled frontend from hardware details.
4.  **Type Safety:** Preventing runtime errors due to mismatched data structures.

## Decision

We will use a **Monorepo** architecture with the following stack:

*   **Frontend:** React (Vite) with TypeScript.
*   **Backend:** Node.js (Express) with TypeScript.
*   **Communication (Frontend <-> Backend):** Socket.IO (WebSockets).
*   **Communication (Backend <-> Hardware):** Custom ASCII Serial Protocol over UART/USB.
*   **Shared Types:** A dedicated `shared-types` package to synchronize data models.

## Consequences

### Positive

*   **Type Safety:** Shared types ensure that the frontend and backend agree on data structures (e.g., `DeviceStatus`, `Recipe`), reducing integration bugs.
*   **Real-time Updates:** Socket.IO allows the backend to push motor status updates (PWM, direction, errors) to the frontend instantly without polling.
*   **Developer Experience:** Monorepo allows working on both frontend and backend simultaneously in a single editor context.
*   **Hardware Decoupling:** The backend handles the specific serial protocol details, allowing the frontend to remain agnostic of the underlying hardware communication.

### Negative

*   **Complexity:** Managing a monorepo requires careful dependency management (hoisting, workspaces).
*   **Latency:** Introducing a backend layer adds a small amount of latency compared to a direct-to-hardware approach, but this is acceptable given the UI requirements.
*   **Deployment:** Requires deploying both a Node.js server and serving the static frontend files.

## Alternatives Considered

*   **Direct Serial from Browser (Web Serial API):**
    *   *Pros:* Simpler architecture (no backend).
    *   *Cons:* Browser support limitations, security restrictions, difficulty in persisting complex state/recipes securely on the device, no centralized logging/telemetry.
*   **Python Backend (Flask/Django):**
    *   *Pros:* Good for data processing.
    *   *Cons:* Context switching between languages (TS for frontend, Python for backend). TypeScript offers better end-to-end type safety.
