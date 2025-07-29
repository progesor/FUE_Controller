import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import config from './config';
import { ClientToServerEvents, ServerToClientEvents } from '../../shared-types';
import {
    connectToArduino,
    initializeArduinoService,
    setMotorPwm,
    setMotorDirection,
    stopMotor,
    executeTimedRun, startMotor
} from './services/arduinoService';

// Sunucu kurulumu
const app = express();
const httpServer = createServer(app);

// Socket.IO sunucusunu tip-güvenli olarak oluşturma
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: config.socket.cors
});

const PORT = config.server.port;

// Temel bir HTTP endpoint'i (test için)
app.get('/', (req, res) => {
    res.send('FUE Controller Backend çalışıyor!');
});

// Socket.IO bağlantı mantığı
io.on('connection', (socket) => {
    console.log(`Bir istemci bağlandı: ${socket.id}`);

    // --- DEĞİŞİKLİK: Frontend'den gelen olayları dinliyoruz ---
    socket.on('set_motor_pwm', (value) => {
        console.log(`[Client -> Server]: set_motor_pwm isteği: ${value}`);
        setMotorPwm(value);
    });

    socket.on('set_motor_direction', (direction) => {
        console.log(`[Client -> Server]: set_motor_direction isteği: ${direction}`);
        setMotorDirection(direction);
    });

    socket.on('start_motor', () => {
        console.log(`[Client -> Server]: start_motor isteği`);
        startMotor();
    });

    socket.on('stop_motor', () => {
        console.log(`[Client -> Server]: stop_motor isteği`);
        stopMotor();
    });

    // Osilasyon için daha karmaşık bir olay (şimdilik iskeleti)
    socket.on('start_oscillation', (options) => {
        console.log(`[Client -> Server]: start_oscillation isteği:`, options);
        // Burada, options.pwm ve options.ms değerlerini kullanarak
        // executeTimedRun fonksiyonunu periyodik olarak çağıran bir mantık olacak.
    });


    socket.on('disconnect', () => {
        console.log(`İstemcinin bağlantısı kesildi: ${socket.id}`);
    });
});

// Sunucuyu başlatma
httpServer.listen(PORT, () => {
    console.log(`Backend sunucusu http://localhost:${PORT} adresinde başlatıldı.`);

    // --- DEĞİŞİKLİK: Servisi io nesnesi ile başlatıyoruz ---
    initializeArduinoService(io);

    // Arduino'ya bağlanmayı başlat
    connectToArduino();
});

// TODO: Arduino servisinden gelen olayları (handleData içinde) alıp
// io.emit(...) ile tüm istemcilere gönderecek olan bir mekanizma kurulacak.