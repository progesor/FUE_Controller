# Devlog — FUE Controller System

## About
Written by: Anıl Akman
Source: Full Git History

---

## Project Evolution Narrative

The FUE Controller System began with a clear foundational strategy: establishing a robust monorepo architecture to house the firmware, backend services, and frontend applications under a unified version control system. Early efforts focused on integrating the `FUE_Slave_v4_1` firmware and building a Node.js backend capable of reliable serial communication. This initial phase laid the groundwork for hardware abstraction, ensuring that the complex motor control logic could be managed effectively from a higher-level environment.

As the backend matured, the focus shifted to enabling real-time communication. The integration of Socket.IO marked a pivotal moment, transforming the system from a static command-response model to a dynamic, event-driven architecture. This allowed the frontend to reflect hardware state changes instantaneously, a critical requirement for medical device interfaces.

A key architectural decision during this period was the introduction of a `shared-types` package. By enforcing strict type safety across the stack, the team prevented data inconsistencies and runtime errors during development. This shared contract became the backbone of the communication between the Node.js server and the React client.

With the core communication pipeline established, the development entered a phase of intense feature implementation. The "Oscillation Mode" logic was a significant technical challenge, requiring precise timing and calibration. The backend took on the responsibility of translating abstract user intents (RPM, Angle) into concrete firmware commands (PWM, Duration), moving complex business logic away from the constrained microcontroller environment.

Simultaneously, the system's capability was expanded with the Recipe System. This feature enabled users to create, save, and execute complex motor operation sequences, turning the device from a simple tool into a programmable platform. The persistence layer was implemented using JSON storage, keeping the system lightweight yet powerful.

The frontend evolution paralleled these backend advancements. Starting with a functional but basic interface using Mantine UI, the user experience underwent a dramatic transformation. The introduction of the "Clinical Layout" brought a professional, medical-grade aesthetic with analog gauges and precise controls, designed specifically for the rigorous demands of a medical environment.

Pushing the boundaries further, the "Aura Layout" was introduced as a futuristic alternative. This interface utilized advanced SVG-based holographic visuals and complex animations, showcasing the system's flexibility and the power of the modern web stack. It demonstrated that the controller could be both functional and visually stunning.

In recent stages, the project has focused on refinement and stability. Critical performance bottlenecks, such as the "Ramping Mode" UI stutter, were addressed by decoupling hardware command loops from UI update intervals. This optimization ensured that high-frequency motor updates did not degrade the user interface responsiveness.

Finally, the codebase has seen significant refactoring to improve modularity, particularly in the layout management and state synchronization logic. Today, the system stands as a sophisticated, multi-layout application with a reliable backend and a polished, responsive user experience, ready for future expansion.

---

## Major Milestones

| Date | Title | Impact | Area + Type |
| :--- | :--- | :--- | :--- |
| 2025-07-29 | **Monorepo Initialization** | Established the project structure with workspaces for backend, frontend, and firmware. | `infra` `build` |
| 2025-07-29 | **Firmware Integration** | Incorporated `FUE_Slave_v4_1` Arduino sketch as the hardware foundation. | `firmware` `feat` |
| 2025-07-29 | **Socket.IO Bridge** | Enabled real-time, bidirectional communication between backend and frontend. | `backend` `feat` |
| 2025-07-29 | **Shared Types Strategy** | Created a single source of truth for data contracts, ensuring type safety. | `shared-types` `refactor` |
| 2025-07-29 | **Oscillation Logic** | Implemented complex motor control patterns (PWM/Angle to Duration) in the backend. | `backend` `feat` |
| 2025-07-29 | **Frontend Foundation** | Launched the initial React/Vite application with Mantine UI and Zustand store. | `frontend` `feat` |
| 2025-08-01 | **Ramping Performance Fix** | Decoupled UI updates from hardware command loops to eliminate interface lag. | `backend` `perf` |
| 2025-08-02 | **Recipe System** | Added capability to create, persist, and execute multi-step motor sequences. | `backend` `frontend` `feat` |
| 2025-08-06 | **Aura Layout** | Introduced a futuristic, high-fidelity UI with SVG-based holographic gauges. | `frontend` `feat` |
| 2025-08-08 | **Clinical Layout Polish** | Refined the medical interface with hybrid controls (slider/touch) and tissue charts. | `frontend` `ux` |
| 2025-08-09 | **Multi-Layout Architecture** | Finalized the system to support switching between Clinical, Aura, and Engineering views. | `frontend` `arch` |

---

## Detailed Chronological Devlog

[2025-07-29 11:49]
- [chore | infra] Initialize monorepo structure
  - Details: Set up npm workspaces for backend, frontend, and shared-types. Created root package.json and configuration files.
  - Components: `package.json`, `.gitignore`

[2025-07-29 11:55]
- [feat | firmware] Add initial FUE Slave firmware
  - Details: Integrated `FUE_Slave_v4_1.ino` Arduino sketch.
  - Components: `packages/arduino_firmware/`

[2025-07-29 12:17]
- [feat | backend] Scaffold Node.js backend with TypeScript
  - Details: Setup Express server structure, TypeScript configuration, and basic serial port dependencies.
  - Components: `packages/backend/`

[2025-07-29 12:19]
- [feat | shared-types] Create shared type definitions
  - Details: Introduced `shared-types` package to centralize interfaces for Socket.IO events and data structures.
  - Components: `packages/shared-types/`

[2025-07-29 12:30]
- [feat | backend] Implement central configuration and serial logic
  - Details: Created `config.ts` for environment variables and improved serial port connection stability with auto-discovery.
  - Components: `packages/backend/src/config.ts`, `arduinoService.ts`

[2025-07-29 12:50]
- [feat | backend] Integrate Socket.IO for real-time events
  - Details: Established WebSocket server to broadcast hardware events (pedal, connection) to clients.
  - Components: `server.ts`, `arduinoService.ts`

[2025-07-29 13:00]
- [feat | frontend] Initialize React application
  - Details: Scaffolding for Vite + React + TypeScript frontend. Added Mantine UI and Zustand.
  - Components: `packages/frontend/`

[2025-07-29 13:07]
- [feat | frontend] Setup core frontend infrastructure
  - Details: Configured `MantineProvider`, created global `useControllerStore` with Zustand, and setup `socketService`.
  - Components: `App.tsx`, `socketService.ts`, `store/useControllerStore.ts`

[2025-07-29 13:14]
- [fix | frontend] Update Mantine Provider for v7 compatibility
  - Details: Removed deprecated props and fixed style imports to resolve TypeScript errors.
  - Components: `main.tsx`

[2025-07-29 13:44]
- [feat | frontend] Implement main layout structure
  - Details: Created the 3-column grid layout with placeholders for Control, Display, and Settings panels.
  - Components: `MainLayout.tsx`

[2025-07-29 13:52]
- [feat | frontend] Build Display Panel components
  - Details: Added visual indicators for RPM (calculated from PWM), graft count, and session duration.
  - Components: `DisplayPanel.tsx`

[2025-07-29 14:04]
- [feat | frontend] Create interactive Control Panel
  - Details: Implemented buttons for start/stop, direction toggle, and speed control linked to `socketService`.
  - Components: `ControlPanel.tsx`

[2025-07-29 14:15]
- [refactor | backend] Centralize state management
  - Details: Backend now acts as the single source of truth for device status, broadcasting updates to all clients.
  - Components: `arduinoService.ts`

[2025-07-29 14:46]
- [feat | frontend] Automate graft counting
  - Details: Frontend now listens for `EVT:PEDAL:0` to automatically increment graft count on pedal release.
  - Components: `socketService.ts`

[2025-07-29 16:30]
- [fix | core] Synchronize motor state across stack
  - Details: Fixed desync issues where backend wouldn't update its internal state after sending commands.
  - Components: `arduinoService.ts`

[2025-07-29 17:27]
- [feat | frontend] Add Oscillation Mode controls
  - Details: Added UI toggles for Continuous vs Oscillation modes and dynamic settings inputs.
  - Components: `ControlPanel.tsx`, `useControllerStore.ts`

[2025-07-29 19:20]
- [feat | backend] Implement Oscillation motor logic
  - Details: Added backend logic to convert Angle/PWM into timed `EXEC_TIMED_RUN` commands for the firmware.
  - Components: `arduinoService.ts`

[2025-07-29 19:30]
- [feat | backend] Integrate calibration service
  - Details: Moved calibration data (RPM vs PWM/Angle) to a dedicated `calibrationService` for accurate duration calculations.
  - Components: `calibrationService.ts`

[2025-08-01 16:23]
- [fix | backend] Fix ramping mode consistency
  - Details: Centralized ramp logic in `_performRamp` to handle both acceleration and deceleration correctly.
  - Components: `arduinoService.ts`

[2025-08-01 16:31]
- [fix | ui] Resolve slider jitter during ramping
  - Details: Decoupled slider `onChange` from immediate state updates to prevent "jumping" when backend sends ramp updates.
  - Components: `ControlPanel.tsx`

[2025-08-01 16:48]
- [fix | backend] optimize ramp update frequency
  - Details: Split ramp logic into two loops: high-frequency for hardware (10ms) and low-frequency for UI updates (50ms).
  - Components: `arduinoService.ts`

[2025-08-01 17:07]
- [refactor | types] Centralize OperatingMode definition
  - Details: Removed duplicate type definitions in frontend, now importing strictly from `shared-types`.
  - Components: `shared-types/index.ts`, `useControllerStore.ts`

[2025-08-01 17:16]
- [feat | frontend] Enhance Developer Console logs
  - Details: Upgraded `LogSummary` to a detailed mini-dashboard showing PWM, Direction, and Mode specific data.
  - Components: `LogSummary.tsx`

[2025-08-02 09:16]
- [feat | backend] Implement Recipe System backend
  - Details: Added `recipeService` to handle creation, persistence (JSON), and execution of multi-step recipes.
  - Components: `recipeService.ts`, `server.ts`

[2025-08-06 18:11]
- [feat | aura] Introduce Aura Layout interface
  - Details: Implemented a new futuristic UI with `StatusOrb`, `HolographicGauge`, and `DynamicBackground`.
  - Components: `packages/frontend/src/components/aura/`

[2025-08-06 21:29]
- [feat | aura] Add animations to Status Orb
  - Details: Added breathing, pulsing, and glitch effects to the central status indicator.
  - Components: `StatusOrb.tsx`

[2025-08-06 21:43]
- [feat | aura] Add visual feedback to Holographic Gauge
  - Details: Gauges now glow/pulse when active or interacting.
  - Components: `HolographicGauge.tsx`

[2025-08-06 22:12]
- [fix | aura] Stabilize Control Arc button positions
  - Details: Fixed positioning logic for buttons on the circular control arc during scaling/resizing.
  - Components: `ControlArc.tsx`

[2025-08-06 22:40]
- [feat | aura] Enhance Recipe Drawer
  - Details: Added search functionality and improved touch interactions for the recipe list.
  - Components: `RecipeDrawer.tsx`

[2025-08-07 09:43]
- [fix | aura] Minor visual adjustments
  - Details: Tweaked spacing and alignment in Aura layout components.
  - Components: `AuraLayout.tsx`

[2025-08-08 15:04]
- [feat | clinical] Add fine-tune buttons to Gauges
  - Details: Added +/- buttons to Clinical gauges for precise single-step adjustments.
  - Components: `Gauge.tsx`

[2025-08-08 16:32]
- [feat | clinical] Implement hybrid gauge controls
  - Details: Integrated `rc-slider` for smooth touch control alongside drag and button inputs.
  - Components: `Gauge.tsx`, `ClinicalLayout.tsx`

[2025-08-08 16:43]
- [feat | clinical] Improve Preset Buttons design
  - Details: Added icons and increased touch targets for mode selection buttons.
  - Components: `PresetButtons.tsx`

[2025-08-08 22:00]
- [fix | clinical] Adjust layout alignment and gauge styling
  - Details: Refined CSS for Clinical layout to ensure proper component spacing and alignment.
  - Components: `ClinicalLayout.module.css`

[2025-08-08 23:07]
- [feat | ui] Add neon animations to Logo
  - Details: Implemented advanced CSS animations (glow, pulse) for the Ertip logo.
  - Components: `ertip-logo.svg`, `ClinicalLayout.module.css`

[2025-08-09 00:10]
- [feat | clinical] Add Tissue Hardness Chart
  - Details: Implemented a dense bar chart visualization for tissue hardness data.
  - Components: `TissueHardnessChart.tsx`

[2025-08-09 00:22]
- [refactor | frontend] Improve Active Mode Display logic
  - Details: Refactored how the active mode is rendered to prevent potential race conditions in display updates.
  - Components: `ActiveModeDisplay.tsx`

[2025-08-09 00:53]
- [feat | frontend] Add Layout Selector and Preference Memory
  - Details: Introduced a selection screen to switch between Aura, Clinical, and Engineering layouts. Added logic to remember the user's last chosen interface.
  - Components: `App.tsx`, `LayoutSelector.tsx`

[2025-08-09 12:43]
- [refactor | backend] Major Service Restructuring
  - Details: Consolidated backend services and updated configuration management to support scalable architecture.
  - Components: `packages/backend/src/`

[2025-08-11 15:47]
- [fix | frontend] Patch Socket Service
  - Details: Minor fix to socket event handling logic to ensure connection stability.
  - Components: `socketService.ts`

[2025-08-11 18:21]
- [chore | infra] Update dependencies and lockfiles
  - Details: Updated package locks and backend service configurations to resolve version conflicts.
  - Components: `package-lock.json`, `arduinoService.ts`

[2025-08-13 09:03]
- [feat | infra] Add Linux Kiosk Support
  - Details: Added startup scripts (`start-kiosk.sh`) and config tweaks for deploying on Linux/Raspberry Pi environments.
  - Components: `start-kiosk.sh`, `vite.config.ts`

[2025-08-13 10:16]
- [build | infra] Add Production Startup Scripts
  - Details: Added `start-prod.sh` and `start-dev.sh` to streamline deployment. Built shared-types for production.
  - Components: `start-prod.sh`, `shared-types`

[2025-08-13 10:37]
- [refactor | frontend] Reorganize Project Structure
  - Details: Moved engineering components to a dedicated folder. Renamed `MainLayout` to `EngineeringLayout` and established clear view boundaries.
  - Components: `src/views/`, `src/components/engineering/`

[2025-08-13 13:20]
- [refactor | frontend] Convert Aura CSS to Rem
  - Details: Refactored Aura layout styles to use `rem` units instead of `px` for better scalability across screen sizes.
  - Components: `src/components/aura/`

[2025-08-13 16:06]
- [fix | frontend] Minor Gauge Fix
  - Details: Small adjustment to gauge component rendering for better visual consistency.
  - Components: `Gauge.tsx`

[2026-01-09 09:00]
- [docs | backend] Add Serial Protocol Documentation
  - Details: Added comprehensive documentation for the serial communication protocol.
  - Components: `docs/SERIAL_PROTOCOL.md`

[2026-02-13 09:36]
- [docs | project] Add Documentation Pack
  - Details: Added detailed documentation for FUE_Slave_v4_1 firmware, frontend architecture, and backend deep-dives.
  - Components: `docs/`

[2026-02-13 13:08]
- [docs | shared-types] Expand Shared Types Docs
  - Details: Finalized documentation for shared types and versioning strategy.
  - Components: `docs/shared-types/`

---

## Coverage
Coverage: 148/148 commits analyzed (100% coverage including branches).

---

## Architecture & Technical Signals

### Module Boundaries
The repository maintains strict boundaries between its three core packages:
- **`arduino_firmware`**: Acts purely as an actuator. It receives raw commands (PWM, Duration) and executes them without knowledge of "RPM" or "Clinical Modes".
- **`backend`**: The brain of the operation. It encapsulates all business logic, calibration data, and state management. It translates high-level intents (e.g., "Oscillation at 30 degrees") into low-level serial commands.
- **`frontend`**: A "dumb" view layer. It reflects the state broadcasted by the backend and captures user intent. It does not calculate motor parameters directly.

### Shared Types Design
The `shared-types` package is critical to the system's reliability. By defining interfaces like `DeviceStatus`, `Recipe`, and `SocketEvents` in a central location, we ensure that the backend and frontend are always speaking the same language. This eliminates a common class of bugs where the API contract drifts over time.

### Event-Driven Flow
The system relies heavily on Socket.IO.
1. **User Action**: Frontend emits an event (e.g., `SET_RPM`).
2. **Backend Processing**: Backend validates the request, updates its internal state, and sends a Serial command to the Arduino.
3. **State Broadcast**: Backend emits a `device_status_update` event with the new full state.
4. **UI Update**: Frontend receives the new state and updates the Zustand store, causing a re-render.
This unidirectional data flow (with the Backend as the source of truth) simplifies state synchronization significantly.

---

## Future Opportunities

### Quick Wins
- **[frontend | P1]** **Add Error Boundary**: Implement a React Error Boundary to gracefully handle UI crashes, especially in the complex Aura layout.
- **[backend | P1]** **Structured Logging**: Replace `console.log` with a structured logger (e.g., Winston) for better observability in production.
- **[docs | P2]** **API Reference**: Auto-generate API documentation from the `shared-types` definitions.

### Medium Refactors
- **[frontend | P1]** **Extract Layout Logic**: Move the layout switching and common initialization logic into a dedicated `LayoutContext` or hook to reduce duplication in `App.tsx`.
- **[backend | P2]** **Unit Tests for Recipe Service**: Add comprehensive unit tests for the `recipeService` to ensure complex sequences are executed correctly.
- **[frontend | P2]** **Component Library Extraction**: Extract common UI components (Buttons, Panels) into a separate internal package to share between Aura and Clinical layouts more cleanly.

### Long Term
- **[infra | P0]** **CI/CD Pipeline**: Implement a GitHub Actions pipeline to run build checks, linting, and tests on every PR.
- **[test | P1]** **E2E Testing**: Add Playwright tests to verify the full flow from Frontend UI -> Backend Mock -> Frontend Update.
- **[firmware | P2]** **OTA Updates**: Explore mechanisms to update the Arduino firmware remotely via the Raspberry Pi backend.
