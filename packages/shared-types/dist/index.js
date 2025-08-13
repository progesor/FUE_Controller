"use strict";
// packages/shared-types/index.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArduinoCommands = void 0;
// Bu nesne, backend ve firmware arasındaki tüm komutları merkezileştirir.
exports.ArduinoCommands = {
    // Sistem Komutları
    SYS_PING: 'SYS.PING',
    SYS_INFO: 'SYS.INFO',
    SYS_RESET: 'SYS.RESET',
    // Cihaz (DEV) Komutları
    MOTOR_SET_PWM: 'DEV.MOTOR.SET_PWM',
    MOTOR_SET_DIR: 'DEV.MOTOR.SET_DIR',
    MOTOR_STOP: 'DEV.MOTOR.STOP',
    MOTOR_TIMED_RUN: 'DEV.MOTOR.EXEC_TIMED_RUN',
    MOTOR_BRAKE: 'DEV.MOTOR.BRAKE',
    BUZZER_BEEP: 'DEV.BUZZER.BEEP',
    // Genel PIN Komutları (gelecekteki kullanımlar için)
    PIN_SET_MODE: 'PIN.SET_MODE',
    PIN_GET_D: 'PIN.GET_D',
    PIN_SET_D: 'PIN.SET_D',
    PIN_GET_A: 'PIN.GET_A',
    PIN_SET_A: 'PIN.SET_A',
    // Yanıt Ön Ekleri
    ACK: 'ACK:',
    ERR: 'ERR:',
    EVT: 'EVT:',
    DATA: 'DATA:',
    DONE: 'DONE:',
    INFO: 'INFO:',
};
