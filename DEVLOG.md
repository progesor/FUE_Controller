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
| 2025-08-08 | **Clinical Layout Polish** | Refined the medical interface with hybrid controls (slider/touch) and tissue charts. | `frontend` `feat` |
| 2025-08-09 | **Multi-Layout Architecture** | Finalized the system to support switching between Clinical, Aura, and Engineering views. | `frontend` `refactor` |

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
- [fix | backend] Synchronize motor state across stack
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
- [fix | frontend] Resolve slider jitter during ramping
  - Details: Decoupled slider `onChange` from immediate state updates to prevent "jumping" when backend sends ramp updates.
  - Components: `ControlPanel.tsx`

[2025-08-01 16:48]
- [fix | backend] optimize ramp update frequency
  - Details: Split ramp logic into two loops: high-frequency for hardware (10ms) and low-frequency for UI updates (50ms).
  - Components: `arduinoService.ts`

[2025-08-01 17:07]
- [refactor | shared-types] Centralize OperatingMode definition
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
- [feat | frontend] Introduce Aura Layout interface
  - Details: Implemented a new futuristic UI with `StatusOrb`, `HolographicGauge`, and `DynamicBackground`.
  - Components: `packages/frontend/src/components/aura/`

[2025-08-06 21:29]
- [feat | frontend] Add animations to Status Orb
  - Details: Added breathing, pulsing, and glitch effects to the central status indicator.
  - Components: `StatusOrb.tsx`

[2025-08-06 21:43]
- [feat | frontend] Add visual feedback to Holographic Gauge
  - Details: Gauges now glow/pulse when active or interacting.
  - Components: `HolographicGauge.tsx`

[2025-08-06 22:12]
- [fix | frontend] Stabilize Control Arc button positions
  - Details: Fixed positioning logic for buttons on the circular control arc during scaling/resizing.
  - Components: `ControlArc.tsx`

[2025-08-06 22:40]
- [feat | frontend] Enhance Recipe Drawer
  - Details: Added search functionality and improved touch interactions for the recipe list.
  - Components: `RecipeDrawer.tsx`

[2025-08-07 09:43]
- [fix | frontend] Minor visual adjustments
  - Details: Tweaked spacing and alignment in Aura layout components.
  - Components: `AuraLayout.tsx`

[2025-08-08 15:04]
- [feat | frontend] Add fine-tune buttons to Gauges
  - Details: Added +/- buttons to Clinical gauges for precise single-step adjustments.
  - Components: `Gauge.tsx`

[2025-08-08 16:32]
- [feat | frontend] Implement hybrid gauge controls
  - Details: Integrated `rc-slider` for smooth touch control alongside drag and button inputs.
  - Components: `Gauge.tsx`, `ClinicalLayout.tsx`

[2025-08-08 16:43]
- [feat | frontend] Improve Preset Buttons design
  - Details: Added icons and increased touch targets for mode selection buttons.
  - Components: `PresetButtons.tsx`

[2025-08-08 22:00]
- [fix | frontend] Adjust layout alignment and gauge styling
  - Details: Refined CSS for Clinical layout to ensure proper component spacing and alignment.
  - Components: `ClinicalLayout.module.css`

[2025-08-08 23:07]
- [feat | frontend] Add neon animations to Logo
  - Details: Implemented advanced CSS animations (glow, pulse) for the Ertip logo.
  - Components: `ertip-logo.svg`, `ClinicalLayout.module.css`

[2025-08-09 00:10]
- [feat | frontend] Add Tissue Hardness Chart
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
Coverage: Appendix lists 148/148 commits across all refs (non-merge: 136, merges: 12).

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





## Audit Appendix — Commit Index
[2025-07-29 11:49] - [chore | infra] Monorepo yapısını ve npm workspace'leri kur
[2025-07-29 11:55] - [feat | firmware] UniCom v4.1 slave firmware'ini ekle ve test et
[2025-07-29 12:17] - [feat | backend] TypeScript ile Node.js proje iskeletini oluştur
[2025-07-29 12:19] - [feat | shared-types] Paylaşılan tipler için 'shared-types' paketini oluştur
[2025-07-29 12:30] - [feat | backend] Backend altyapısını yapılandır ve bağlantı mantığını iyileştir
[2025-07-29 12:50] - [feat | backend] Socket.IO ile Arduino servisi entegrasyonunu tamamla
[2025-07-29 13:00] - [feat | frontend] Vite+React+TS proje iskeletini oluştur ve kütüphaneleri ekle
[2025-07-29 13:04] - [chore | frontend] Projeyi başlangıç dosyalarından temizle
[2025-07-29 13:07] - [feat | backend] Temel altyapıyı kur (Mantine, Zustand, Socket.IO)
[2025-07-29 13:14] - [fix | frontend] Mantine Provider kurulumunu modern API'ye göre güncelle
[2025-07-29 13:44] - [feat | frontend] Ana yerleşim (layout) ve panel iskeletlerini oluştur
[2025-07-29 13:52] - [feat | frontend] Gösterge panelini (RPM, greft, süre) oluştur
[2025-07-29 14:04] - [feat | frontend] Etkileşimli Kontrol Panelini oluştur
[2025-07-29 14:15] - [refactor | backend] Durum yönetimini merkezileştir ve ping loglamasını yapılandır
[2025-07-29 14:17] - [fix | backend] Gelen PONG yanıtlarının loglanmasını gizle
[2025-07-29 14:42] - [fix | frontend] Seans yönetimi (sayaç/süre) mantığını düzelt ve merkezileştir
[2025-07-29 14:46] - [feat | frontend] Pedal bırakıldığında greft sayacını otomatik artır
[2025-07-29 16:27] - [fix | backend] Pedal olaylarının arayüze iletilmesini sağla
[2025-07-29 16:30] - [fix | backend] Motor ve arayüz durumu senkronizasyonunu düzelt
[2025-07-29 17:27] - [feat | frontend] Osilasyon modu için arayüz kontrollerini ekle
[2025-07-29 19:20] - [feat | backend] Osilasyon modu için temel mantığı ve kalibrasyonu ekle
[2025-07-29 19:22] - [feat | backend] Osilasyon modunu baştan sona entegre et
[2025-07-29 19:30] - [feat | backend] Gerçek kalibrasyon verilerini osilasyon mantığına entegre et
[2025-07-29 19:33] - [chore | frontend] Update ControlPanel UI
[2025-07-29 19:40] - [refactor | frontend] Kontrol panellerini kalibrasyona uygun Slider'larla güncelle
[2025-07-29 19:53] - [fix | frontend] Motor kontrolü ve sayaç senkronizasyonunu düzelt
[2025-07-30 10:24] - [feat | frontend] Durum çubuğunu (StatusBar) dinamik verilerle canlandır
[2025-07-30 10:33] - [feat | frontend] Durum çubuğuna Arduino bağlantı göstergesi ekle
[2025-07-30 10:40] - [feat | frontend] StatusBar'ı tam teşekküllü bir bilgi paneline dönüştür
[2025-07-30 11:19] - [fix | backend] Canlı mod değiştirme ve pedal senkronizasyon sorunlarını çöz
[2025-07-30 11:55] - [refactor | backend] Backend ve frontend arasında tam durum senkronizasyonu sağla
[2025-07-30 12:05] - [fix | backend] Kalibrasyon tutarlılığını sağlayarak canlı ayar değişikliğini düzelt
[2025-07-30 12:11] - [refactor | backend] Canlı ayar ve mod geçişi mantığını iyileştir
[2025-07-30 12:15] - [fix | backend] Modlar arası kesintisiz ve akıcı geçiş sağla
[2025-07-30 12:17] - [fix | frontend] Osilasyon açısı slider'ının takılma sorununu düzelt
[2025-07-30 12:24] - [fix | frontend] Açı slider'ının yapışma (snapping) mantığını düzelt
[2025-07-30 12:28] - [fix | backend] Canlı osilasyon açısı değişikliği sorununu düzelt
[2025-07-30 12:31] - [fix | shared-types] TypeScript uyuşmazlıklarını gider
[2025-07-30 13:46] - [chore | infra] Code cleanup
[2025-07-30 15:20] - [refactor | infra] Proje genelinde dokümantasyon ekle ve kod okunabilirliğini artır
[2025-07-30 15:22] - [refactor | frontend] Unutulan main.tsx dosyasını ekle ve dokümantasyonunu yap
[2025-07-30 15:33] - [feat | frontend] Kritik durumlar için bildirim sistemini entegre et
[2025-07-30 16:16] - [fix | frontend] İstemci bağlandığında anlık bağlantı durumunu senkronize et
[2025-07-30 17:09] - [refactor | backend] Başlangıç servislerinin birden çok kez çalışmasını engelle
[2025-07-31 09:11] - [fix | backend] Konsol kayıtları cihaz isimleri düzelt
[2025-07-31 09:56] - [feat | tooling] Geliştirici konsolu ve canlı olay takibi arayüzü ekle
[2025-07-31 10:30] - [feat | tooling] JSON verilerini göstermek için interaktif bir görüntüleyici ekle
[2025-07-31 11:46] - [feat | tooling] Loglar için özet ve detay arasında geçişli görünüm ekle
[2025-07-31 13:28] - [feat | tooling] Donanım testi için interaktif Ar-Ge paneli ekle
[2025-07-31 13:34] - [feat | tooling] Osilasyon testi ve kalibrasyonu için Ar-Ge araçları ekle
[2025-07-31 14:32] - [feat | frontend] Ar-Ge panelini ana arayüzden bir modal'a taşı
[2025-08-01 11:12] - [feat | tooling] Konsola filtreleme ve temizleme özellikleri ekle
[2025-08-01 11:23] - [fix | tooling] Canlı osilasyon testinde parametrelerin anlık güncellenmesini sağla
[2025-08-01 11:38] - [feat | tooling] Ar-Ge paneline kalibrasyon verilerini yüklemek için kısayollar ekle
[2025-08-01 12:22] - [feat | backend] Yeni klinik "Darbe (Pulse)" modunu ekle
[2025-08-01 12:42] - [fix | backend] Darbe modu ayarlarında state senkronizasyonu sorununu çöz
[2025-08-01 12:46] - [fix | backend] Darbe modunda hızı değiştirince oluşan hatalı mod geçişini düzelt
[2025-08-01 13:13] - [feat | backend] Darbe moduna keskin duruş için aktif frenleme özelliği ekle
[2025-08-01 14:17] - [feat | backend] Yeni klinik "Titreşim (Vibration)" modunu ekle
[2025-08-01 14:40] - [refactor | frontend] Titreşim yoğunluğunu PWM yerine yüzde olarak göster
[2025-08-01 16:05] - [feat | backend] Sürekli mod için "Rampa Modu" (yavaş başlatma) ekle
[2025-08-01 16:17] - [fix | backend] Motor çalışırken hız değiştirildiğinde rampa modunun tutarlı çalışmasını sağla
[2025-08-01 16:23] - [fix | backend] Rampa modunun tüm senaryolarda tutarlı çalışmasını sağla
[2025-08-01 16:31] - [fix | frontend] Slider zıplama sorununu çöz ve RPM gösterimini senkronize et
[2025-08-01 16:48] - [fix | backend] Rampa sırasında arayüzün takılmasını ve zıplamasını düzelt
[2025-08-01 17:03] - [fix | backend] Motor duruyorken mod değiştirince beklenmedik şekilde çalışmasını düzelt
[2025-08-01 17:07] - [refactor | shared-types] OperatingMode tipini merkezileştirerek tutarsızlığı gider
[2025-08-01 17:16] - [feat | tooling] LogSummary bileşenini detaylı bir bilgi paneline dönüştür
[2025-08-02 09:16] - [feat | tooling] Sürekli mod için rampa süresini LogSummary'e ekle
[2025-08-04 12:50] - [feat | backend] Reçete editörü ve çalıştırma motoru ekle
[2025-08-04 13:04] - [refactor | backend] Reçete editörünü Drawer'a taşıyarak UI'ı iyileştir
[2025-08-04 13:30] - [feat | backend] Reçete adımlarına özel hız (RPM) kontrolü ekle
[2025-08-04 14:08] - [feat | backend] Titreşim frekans aralığını ve hassasiyetini artır
[2025-08-04 14:46] - [refactor | frontend] Arayüzü sadeleştir ve geliştirici konsolunu Drawer'a taşı
[2025-08-04 14:50] - [refactor | tooling] Geliştirici konsolunu sabitlenebilir bir yan panele dönüştür
[2025-08-04 15:03] - [feat | frontend] Konsol açılışını ekran genişliğine duyarlı hale getir  Kullanıcı deneyimini i...
[2025-08-05 10:01] - [feat | backend] Modüler "Reçete Sistemi"ni ekle
[2025-08-05 11:15] - [feat | frontend] Klinik ve Mühendislik arayüzleri için altyapı kur
[2025-08-05 11:24] - [feat | frontend] Klinik arayüz için layout iskeletini ve statik varlıkları ekle
[2025-08-05 15:22] - [feat | frontend] Klinik arayüz için tam fonksiyonel Gauge, InfoPanel ve Clock bileşenlerini ge...
[2025-08-06 09:16] - [fix | frontend] Minor asset and layout tweaks
[2025-08-06 10:28] - [feat | backend] Tam fonksiyonel reçete kütüphanesi ve kritik hata düzeltmeleri
[2025-08-06 18:11] - [feat | frontend] Implement the new futuristic "AURA" clinical interface
[2025-08-06 21:29] - [feat | infra] add status orb animations
[2025-08-06 21:30] - [fix | infra] type dynamic background vars
[2025-08-06 21:40] - [chore | backend] Merge pull request #39 from progesor/codex/add-animations-and-styling-for-sta...
[2025-08-06 21:40] - [chore | backend] Merge pull request #40 from progesor/codex/implement-dynamic-background-anima...
[2025-08-06 21:40] - [chore | frontend] Update packages/frontend/src/components/aura/StatusOrb.module.css
[2025-08-06 21:42] - [feat | infra] improve control arc accessibility
[2025-08-06 21:43] - [feat | infra] add feedback to holographic gauge
[2025-08-06 21:50] - [chore | frontend] Merge pull request #41 from progesor/codex/enhance-accessibility-for-mod-buttons
[2025-08-06 21:50] - [chore | frontend] Update packages/frontend/src/components/aura/ControlArc.module.css
[2025-08-06 21:57] - [chore | infra] Update HolographicGauge.tsx
[2025-08-06 22:00] - [chore | backend] Merge pull request #42 from progesor/codex/add-audio-feedback-to-holographicg...
[2025-08-06 22:02] - [fix | infra] keep arc buttons centered on focus
[2025-08-06 22:12] - [feat | infra] keep arc button position on scale
[2025-08-06 22:25] - [chore | frontend] Merge branch 'main' into nn5qu4-codex/enhance-accessibility-for-mod-buttons
[2025-08-06 22:25] - [chore | frontend] Merge pull request #43 from progesor/nn5qu4-codex/enhance-accessibility-for-m...
[2025-08-06 22:31] - [chore | infra] Update ControlArc.tsx
[2025-08-06 22:40] - [feat | infra] enhance recipe drawer with search and actions
[2025-08-06 22:47] - [feat | infra] optimize recipe drawer for touch screens
[2025-08-06 22:50] - [chore | infra] Merge pull request #45 from progesor/codex/enhance-recipedrawer-styling-and-f...
[2025-08-07 09:43] - [fix | frontend] Minor visual adjustments
[2025-08-07 11:02] - [feat | frontend] Implement the futuristic "AURA" clinical interface
[2025-08-07 12:18] - [feat | frontend] Improve Recipe Drawer and StatusOrb interactions
[2025-08-08 10:59] - [feat | frontend] AURA arayüzü için "Snap-on-Release" etkileşim modeli eklendi
[2025-08-08 11:09] - [refactor | frontend] Yardımcı RPM fonksiyonları merkezileştirildi (DRY)
[2025-08-08 11:27] - [refactor | backend] Arduino komutları merkezileştirildi ve soyutlandı
[2025-08-08 12:41] - [feat | frontend] HolographicGauge bileşeni yay formuna dönüştürüldü ve etkileşimi iyileştirildi
[2025-08-08 13:00] - [feat | frontend] StatusOrb'a mod-spesifik animasyonlar ve SessionHUD eklendi
[2025-08-08 13:14] - [feat | frontend] SessionHUD yeniden tasarlandı ve StatusOrb animasyonları iyileştirildi
[2025-08-08 13:50] - [feat | frontend] ActiveModeDisplay eklendi ve arayüz yerleşimi son haline getirildi
[2025-08-08 14:29] - [fix | frontend] HolographicGauge hassas ayar butonları düzeltildi
[2025-08-08 14:57] - [feat | frontend] Arayüze interaktif mod değiştirme butonları eklendi
[2025-08-08 15:04] - [feat | frontend] Göstergelere hassas ayar butonları (+/-) eklendi
[2025-08-08 16:32] - [feat | frontend] Göstergelere hibrit kontrol (Slider, Dokunma, Buton) eklendi
[2025-08-08 16:43] - [feat | frontend] PresetButtons'a ikonlar eklendi ve tasarımı iyileştirildi
[2025-08-08 17:25] - [feat | frontend] Arayüz merkezine geçici karşılama mesajı eklendi
[2025-08-08 22:00] - [fix | frontend] Adjust layout alignment
[2025-08-08 23:07] - [feat | frontend] Add vibrant neon animations to Ertip Logo and improve overflow handling
[2025-08-09 00:10] - [feat | frontend] add TissueHardnessChart as dense bar graph + compact InfoPanel bar
[2025-08-09 00:22] - [fix | frontend] Speculative fix for ActiveModeDisplay race condition
[2025-08-09 00:53] - [feat | frontend] Arayüz seçim ekranı ve tercih hatırlama özelliği eklendi
[2025-08-09 12:43] - [refactor | backend] Major service restructuring and consolidation
[2025-08-11 15:42] - [chore | infra] Prepare for deployment
[2025-08-11 15:47] - [fix | frontend] Patch socket service connection logic
[2025-08-11 18:21] - [chore | infra] Update dependencies and lockfiles
[2025-08-11 18:55] - [fix | backend] Fix server startup logic
[2025-08-13 09:03] - [fix | infra] Add Linux kiosk support scripts
[2025-08-13 10:16] - [build | infra] Add production startup scripts and shared-types build
[2025-08-13 10:37] - [refactor | frontend] Reorganize project structure and cleanup assets
[2025-08-13 13:20] - [refactor | frontend] Convert Aura CSS to rem units
[2025-08-13 14:13] - [chore | infra] Update start-prod.sh script
[2025-08-13 14:16] - [chore | infra] Update configuration
[2025-08-13 14:22] - [chore | infra] Minor update to start-prod.sh
[2025-08-13 16:06] - [fix | frontend] Minor adjustment to Gauge component rendering
[2025-08-13 17:21] - [chore | frontend] Update HolographicGauge component
[2026-01-09 09:00] - [feat | docs] Add comprehensive serial communication protocol documentation
[2026-02-13 09:36] - [feat | docs] Add comprehensive documentation pack
[2026-02-13 09:51] - [feat | firmware] Add detailed technical documentation for FUE_Slave_v4_1 firmware
[2026-02-13 09:55] - [chore | frontend] Expand frontend documentation with architecture, data flow, and performance i...
[2026-02-13 09:55] - [docs | backend] Expand backend documentation with deep-dives
[2026-02-13 10:03] - [docs | infra] expand shared-types documentation with boundaries and versioning strategy
[2026-02-13 12:22] - [chore | docs] Merge pull request #52 from progesor/docs/serial-protocol-analysis-7084717200...
[2026-02-13 12:43] - [chore | docs] Merge pull request #53 from progesor/documentation-pack-9732509417044335274
[2026-02-13 13:08] - [chore | backend] Merge pull request #56 from progesor/expand-backend-docs-12057268327834432641
[2026-02-13 13:08] - [chore | docs] Merge pull request #57 from progesor/docs/expand-shared-types-865916684871305075
[2026-02-13 13:08] - [chore | frontend] Merge pull request #54 from progesor/docs/arduino-firmware-deep-dive-11896556...
[2026-02-13 13:08] - [chore | frontend] Merge pull request #55 from progesor/expand-frontend-docs-602135288591906724
