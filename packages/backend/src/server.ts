import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { connectToArduino } from './services/arduinoService';
import config from './config';
import { ClientToServerEvents, ServerToClientEvents } from '../../shared-types';

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

    // TODO: Buraya frontend'den gelen olayları dinleyecek olan kod eklenecek.
    // Örnek:
    // socket.on('set_motor_pwm', (value) => {
    //   console.log(`İstemciden set_motor_pwm isteği geldi: ${value}`);
    //   setMotorPwm(value);
    // });

    socket.on('disconnect', () => {
        console.log(`İstemcinin bağlantısı kesildi: ${socket.id}`);
    });
});


// Sunucuyu başlatma
httpServer.listen(PORT, () => {
    console.log(`Backend sunucusu http://localhost:${PORT} adresinde başlatıldı.`);

    // Arduino'ya bağlanmayı başlat
    connectToArduino();
});

// TODO: Arduino servisinden gelen olayları (handleData içinde) alıp
// io.emit(...) ile tüm istemcilere gönderecek olan bir mekanizma kurulacak.