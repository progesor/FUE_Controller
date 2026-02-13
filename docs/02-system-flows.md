# System Flows

This document details the critical runtime sequences of the FUE Micromotor System.

## 1. Manual Motor Control (Continuous Mode)

The user manually starts the motor via the UI or Pedal in Continuous Mode.

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant ArduinoService
    participant Firmware
    participant Motor

    User->>Frontend: Press "Start" Button
    Frontend->>Backend: emit('start_motor')
    Backend->>ArduinoService: startCurrentMode() -> startContinuousMode()
    ArduinoService->>Firmware: Send "DEV.MOTOR.SET_DIR:0"
    ArduinoService->>Firmware: Send "DEV.MOTOR.SET_PWM:0"

    loop Ramp Up (Soft Start)
        ArduinoService->>Firmware: Send "DEV.MOTOR.SET_PWM:..." (Incrementing)
        Firmware->>Motor: PWM Signal Update
        ArduinoService->>Frontend: emit('device_status_update')
    end

    ArduinoService->>Firmware: Send "DEV.MOTOR.SET_PWM:Target"
    Firmware->>Motor: Final Speed
```

## 2. Pedal Interaction

The user controls the motor using the foot pedal.

```mermaid
sequenceDiagram
    participant Pedal
    participant Firmware
    participant Backend
    participant ArduinoService
    participant Frontend

    Pedal->>Firmware: Press (Low Signal)
    Note over Firmware: Debounce (25ms)
    Firmware->>Backend: Send "EVT:PEDAL:1"

    Backend->>ArduinoService: handleData() -> EVT:PEDAL:1 detected
    ArduinoService->>ArduinoService: startCurrentMode()

    par Start Motor
        ArduinoService->>Firmware: Send Motor Commands
    and Notify UI
        ArduinoService->>Frontend: emit('arduino_event', { type: 'PEDAL', state: 1 })
    end

    Pedal->>Firmware: Release (High Signal)
    Note over Firmware: Debounce (25ms)
    Firmware->>Backend: Send "EVT:PEDAL:0"

    Backend->>ArduinoService: handleData() -> EVT:PEDAL:0 detected
    ArduinoService->>ArduinoService: stopMotor()
    ArduinoService->>Firmware: Send "DEV.MOTOR.STOP"
    Firmware->>Motor: Stop
```

## 3. Oscillation Mode Execution

The motor oscillates back and forth (CW/CCW) based on backend timing.

```mermaid
sequenceDiagram
    participant Backend
    participant Firmware
    participant Motor

    Backend->>Backend: startOscillation()

    loop Oscillation Loop (setInterval)
        Backend->>Firmware: Send "DEV.MOTOR.SET_DIR:0" (CW)
        Backend->>Firmware: Send "DEV.MOTOR.EXEC_TIMED_RUN:PWM|Time"
        Firmware->>Motor: Run CW for Time ms

        Note over Backend: Wait (Time + Buffer)

        Backend->>Firmware: Send "DEV.MOTOR.SET_DIR:1" (CCW)
        Backend->>Firmware: Send "DEV.MOTOR.EXEC_TIMED_RUN:PWM|Time"
        Firmware->>Motor: Run CCW for Time ms
    end
```

## 4. Recipe Execution

The system executes a predefined sequence of steps.

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant RecipeService
    participant ArduinoService
    participant Firmware

    User->>Frontend: Select Recipe & Press Start
    Frontend->>Backend: emit('recipe_start', recipe)

    Backend->>RecipeService: startRecipe(recipe)

    loop For Each Step
        RecipeService->>ArduinoService: executeStep(step)
        ArduinoService->>Firmware: Configure & Start Motor (Mode specific)

        RecipeService->>Frontend: emit('recipe_status_update')

        Note over RecipeService: Wait Step Duration

        alt Last Step?
            RecipeService->>RecipeService: stopRecipe()
            RecipeService->>ArduinoService: stopMotorFromRecipe()
            ArduinoService->>Firmware: Stop
        else More Steps
            RecipeService->>RecipeService: playNextStep()
        end
    end
```

## 5. Connection Recovery

Handling USB disconnection and reconnection.

```mermaid
sequenceDiagram
    participant Firmware
    participant Backend
    participant Frontend

    Note over Backend: Connected

    Firmware--xBackend: Connection Lost (USB Unplugged)

    Backend->>Backend: Serial Port 'close'/'error' event
    Backend->>Frontend: emit('arduino_disconnected')

    loop Reconnect Strategy (Every 1s)
        Backend->>Backend: connectToArduino()
        Backend->>Backend: listSerialPorts()
        alt Port Found
            Backend->>Firmware: Open Port
            Firmware-->>Backend: Connection Success
            Backend->>Frontend: emit('arduino_connected')
        else Not Found
            Note over Backend: Wait 1s
        end
    end
```
