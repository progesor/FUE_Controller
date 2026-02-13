# Shared Types

The `shared-types` package acts as the **contract** and **single source of truth** for data exchange between the Frontend (UI) and the Backend (Logic). It ensures type safety across the network boundary (Socket.IO) and guarantees that both ends agree on the data structures representing the device state.

## 1. Type Boundaries

This package defines the data structures that cross the process boundary between the Node.js backend and the Browser frontend.

*   **Included (The "Public API"):**
    *   **Domain Models:** Core entities like `DeviceStatus`, `Recipe`, `OperatingMode` that represent the state of the physical device.
    *   **Communication Protocol:** Request/Response payloads for Socket.IO events (`ClientToServerEvents`, `ServerToClientEvents`).
    *   **Hardware Constants:** `ArduinoCommands` mapping for consistent command string generation.

*   **Excluded (Internal Implementation Details):**
    *   **Internal Backend Types:** Database schemas, hardware driver details, serial port configuration, specific `SerialPort` types.
    *   **Internal Frontend Types:** React component props, UI-specific state (like `isRecipeDrawerOpen` which is local UI state, though `useControllerStore` mixes them, the shared type `DeviceStatus` only holds the hardware state).

**File References:**
*   [`packages/shared-types/index.ts`](../../packages/shared-types/index.ts): The definition file containing all shared interfaces.

## 2. Versioning Strategy

Since this project is a monorepo, we use a **Synchronized Versioning** strategy.

*   **Strategy:** "Sync-Version". The frontend and backend are developed, versioned, and deployed together as a single unit.
*   **Protocol:** Changes in `shared-types` are immediately consumed by both `backend` and `frontend`. There is no separate publishing step to an external registry (like npm) during development.
*   **Workflow for Breaking Changes:**
    1.  **Modify `shared-types`**: Change the interface (e.g., rename a property).
    2.  **Update Backend**: Fix compilation errors in `backend` immediately.
    3.  **Update Frontend**: Fix compilation errors in `frontend` immediately.
    4.  **Commit Atomically**: Commit all three changes together to ensure the build is always green.

## 3. Mapping to Backend API and Frontend State

The types in this package map directly to the state management systems of both applications, serving as the bridge.

### Backend Mapping
In the backend, `DeviceStatus` acts as the in-memory database of the hardware state.

*   **State Holder:** `arduinoService.ts` holds a `let deviceStatus: DeviceStatus` variable which is the Single Source of Truth for the hardware state.
*   **Socket API:** `server.ts` initializes the Socket.IO server using the generic types `ClientToServerEvents` and `ServerToClientEvents`. This enforces that every `socket.emit` and `socket.on` matches the defined signature at compile time.

**File References:**
*   [`packages/backend/src/services/arduinoService.ts`](../../packages/backend/src/services/arduinoService.ts):
    ```typescript
    let deviceStatus: DeviceStatus & { } = { ... };
    ```
*   [`packages/backend/src/server.ts`](../../packages/backend/src/server.ts):
    ```typescript
    const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, { ... });
    ```

### Frontend Mapping
In the frontend, `DeviceStatus` is extended by the Zustand store to create the full application state.

*   **State Holder:** `useControllerStore.ts` defines `ControllerState` which `extends DeviceStatus`. This means the frontend state *is* the device state, plus some UI-specific flags (like `connectionStatus`, `graftCount`).
*   **Synchronization:** The `updateDeviceStatus` action in the store takes a `DeviceStatus` object (received via socket) and merges it into the store, ensuring the UI reflects the backend's truth.

**File References:**
*   [`packages/frontend/src/store/useControllerStore.ts`](../../packages/frontend/src/store/useControllerStore.ts):
    ```typescript
    interface ControllerState extends DeviceStatus {
        connectionStatus: 'connected' | 'disconnected' | 'connecting';
        // ... other UI state
    }
    ```

## 4. How to Safely Evolve Types

To evolve types without breaking the application during development:

### Additive Changes (Safe)
Adding a new field is generally safe and backward compatible (within the scope of a single deploy).
1.  **Add Field:** Add optional field to `shared-types/index.ts`: `newField?: string`.
2.  **Update Backend:** Update `arduinoService.ts` to populate/use this field.
3.  **Update Frontend:** Update components to display/use this field.
4.  **Finalize:** Remove `?` if it becomes required after all usages are updated.

### Breaking Changes (Renaming/Removing)
Because of the monorepo structure, "breaking" changes are handled by refactoring all call sites immediately.

**Workflow for a Breaking Change (e.g., renaming `pwm` to `speed`):**
1.  **Refactor Type:** Rename `pwm` to `speed` in `packages/shared-types/index.ts`.
2.  **Fix Backend:** TypeScript compiler will error in `arduinoService.ts` (state definition) and `server.ts` (socket handlers). Fix these errors.
3.  **Fix Frontend:** TypeScript compiler will error in `useControllerStore.ts` (state definition) and components using `motor.pwm`. Fix these errors.
4.  **Verify:** Run `npm run build` in both packages to ensure no references were missed.

### Deprecation (If decoupling is needed later)
If the frontend and backend were in separate repos or deployed independently, we would use the "Expand and Contract" pattern:
1.  Add `speed` (optional).
2.  Populate both `pwm` and `speed` in backend.
3.  Switch frontend to use `speed`.
4.  Remove `pwm`.

Currently, direct refactoring is preferred due to the monorepo advantage.
