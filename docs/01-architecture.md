# Architecture

This document describes the high-level architecture of the FUE Hair Transplant Micromotor System.

## System Context (C4 Level 1)

The system consists of a User (Clinician or Engineer) interacting with a single-page web application (Frontend), which communicates with a Backend server. The Backend controls the Hardware (Arduino Micromotor Controller) via a serial connection.

```mermaid
C4Context
    title System Context Diagram for FUE Micromotor System

    Person(clinician, "Clinician", "Operates the device for hair transplant procedures.")
    Person(engineer, "Engineer", "Configures and calibrates the device.")

    System(fue_system, "FUE Controller System", "Controls the micromotor, manages recipes, and provides a UI.")

    System_Ext(motor_hardware, "Motor & Sensors", "The physical micromotor, pedal, and switches connected to the Arduino.")

    Rel(clinician, fue_system, "Uses", "Touchscreen / Web Browser")
    Rel(engineer, fue_system, "Configures", "Touchscreen / Web Browser")
    Rel(fue_system, motor_hardware, "Controls", "Electrical Signals")
```

## Container Diagram (C4 Level 2)

The system is deployed as a monorepo with three main containers: Frontend, Backend, and Firmware.

```mermaid
C4Container
    title Container Diagram

    Person(user, "User", "Clinician or Engineer")

    Container_Boundary(fue_system, "FUE Controller System") {
        Container(frontend, "Frontend App", "React, Vite, TypeScript", "Provides the UI for clinical operation and engineering configuration.")
        Container(backend, "Backend Server", "Node.js, Express, Socket.IO", "Manages state, recipes, calibration, and serial communication.")
        Container(firmware, "Arduino Firmware", "C++, Arduino", "Real-time motor control, sensor reading, and safety checks.")
        Container(shared_types, "Shared Types", "TypeScript", "Common type definitions for type safety between Frontend and Backend.")
    }

    System_Ext(hardware, "Hardware", "Motor Driver, Pedal, Switches")

    Rel(user, frontend, "Interacts with", "HTTPS/WSS")
    Rel(frontend, backend, "Socket.IO Events", "WebSocket (JSON)")
    Rel(backend, firmware, "Serial Commands", "UART (ASCII Protocol)")
    Rel(firmware, hardware, "GPIO / PWM", "Electrical Signals")

    UpdateRelStyle(frontend, backend, $textColor="blue", $lineColor="blue")
    UpdateRelStyle(backend, firmware, $textColor="red", $lineColor="red")
```

## Component Diagram (C4 Level 3) - Backend

The Backend is the central coordinator.

```mermaid
C4Component
    title Component Diagram - Backend Server

    Container(frontend, "Frontend App", "React")
    Container(firmware, "Arduino Firmware", "C++")

    Container_Boundary(backend, "Backend Server") {
        Component(server, "Server Entry Point", "server.ts", "Initializes Express and Socket.IO, routes events.")
        Component(arduino_service, "Arduino Service", "arduinoService.ts", "Handles Serial Port communication, command queueing, and state management.")
        Component(recipe_service, "Recipe Service", "recipeService.ts", "Manages active recipes and step execution logic.")
        Component(calibration_service, "Calibration Service", "calibrationService.ts", "Provides calibration data for motor speed/angle.")
        Component(persistence_service, "Recipe Persistence Service", "recipePersistenceService.ts", "Saves and loads recipes from disk (JSON).")
    }

    Rel(frontend, server, "Socket.IO Events")
    Rel(server, arduino_service, "Commands/Updates")
    Rel(server, recipe_service, "Recipe Management")
    Rel(server, calibration_service, "Get Calibration")
    Rel(server, persistence_service, "Load/Save")

    Rel(recipe_service, arduino_service, "Motor Commands (Start/Stop/PWM)")
    Rel(arduino_service, firmware, "Serial Protocol (Unicom v4.1)")
```

## Data Flow Summary

1.  **User Input:** The user selects a mode or recipe on the Frontend.
2.  **Socket Event:** The Frontend emits a Socket.IO event (e.g., `start_motor`, `recipe_start`) to the Backend.
3.  **Service Logic:** The `server.ts` routes the event to the appropriate service (e.g., `RecipeService` or `ArduinoService`).
4.  **Hardware Command:** The service generates a command string (e.g., `DEV.MOTOR.SET_PWM:150`) and sends it via `ArduinoService`.
5.  **Serial Transmission:** The `ArduinoService` writes the command to the Serial Port.
6.  **Firmware Action:** The Arduino receives the command, parses it, and updates the motor PWM or direction.
7.  **Feedback:** The Arduino sends an acknowledgement (`ACK`) or event (`EVT`) back to the Backend.
8.  **UI Update:** The Backend processes the response and emits a `device_status_update` event to the Frontend.
