// packages/backend/src/config.ts

/**
 * Uygulamanın tüm ayarlarını içeren merkezi konfigürasyon nesnesi.
 */
const config = {
    /**
     * Sunucu ile ilgili ayarlar.
     */
    server: {
        port: 3000,
    },

    /**
     * Arduino ile haberleşme ve bağlantı ayarları.
     */
    arduino: {
        // Portu manuel olarak belirtmek için bu alanı kullanın (örn: 'COM16' veya '/dev/ttyAMA0').
        // Otomatik bulma için boş bırakın ('').
        port: '/dev/ttyAMA0',

        baudRate: 115200,
        reconnectTimeout: 1000, // ms cinsinden yeniden bağlanma deneme süresi
        pingInterval: 3000,     // ms cinsinden bağlantı kontrol sıklığı
        logPings: false,

        // Arduino kartını otomatik bulmak için kullanılacak anahtar kelimeler
        // Bu liste, farklı Arduino klonları için genişletilebilir.
        portIdentifiers: [
            'arduino',
            'usb2.0-serial',
        ],
    },

    /**
     * Socket.IO ile ilgili ayarlar.
     */
    socket: {
        cors: {
            // Geliştirme ortamında frontend'in (Vite) çalıştığı adrese izin ver
            origin: "http://localhost:5173",
            methods: ["GET", "POST"]
        }
    }
};

// config nesnesini projenin diğer kısımlarında kullanabilmek için export et
export default config;