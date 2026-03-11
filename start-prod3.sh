#!/bin/bash

# Gerekli ortam değişkenlerini ayarla
export DISPLAY=:0
export XAUTHORITY=/home/proge/.Xauthority

# Proje dizinine git
cd /home/proge/FUE_Controller || exit 1

echo "Sistem başlatılıyor..."

# 1. Ekran ayarlarını ve fare gizlemeyi HEMEN YAP
xset s noblank
xset s off
xset -dpms
killall unclutter 2>/dev/null
unclutter -idle 1 -root &

# 2. Şık, Akıllı ve Karanlık "Yükleniyor" sayfası oluştur
LOADING_PAGE="/tmp/fue_loading.html"
cat << 'EOF' > $LOADING_PAGE
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <style>
        /* Tamamen Koyu (Dark) Tema Ayarları */
        body { background-color: #121212; color: #e9ecef; display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; margin: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
        h1 { font-size: 4rem; color: #40c057; margin-bottom: 10px; }
        h2 { font-size: 2rem; color: #adb5bd; font-weight: normal; }
        .spinner { border: 8px solid #343a40; border-top: 8px solid #40c057; border-radius: 50%; width: 80px; height: 80px; animation: spin 1s linear infinite; margin-top: 40px;}
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        #status { margin-top: 20px; font-size: 1.2rem; color: #868e96; }
    </style>
</head>
<body>
    <h1>Ar-Ge Terminali</h1>
    <h2 id="main-text">Sistem Hazırlanıyor, Lütfen Bekleyin...</h2>
    <div class="spinner" id="spinner"></div>
    <div id="status">Sunucu başlatılıyor...</div>

    <script>
        let attempts = 0;
        const maxAttempts = 30; // 30 kere deneyecek (Yaklaşık 30 saniye)
        const targetUrl = 'http://localhost:3000';

        const checkServer = async () => {
            attempts++;
            document.getElementById('status').innerText = `Bağlantı aranıyor... (${attempts}/${maxAttempts})`;

            try {
                // Sunucuya sessizce ping at.
                // "no-cors" parametresi, yerel html dosyasından (file://) 3000 portuna (http://)
                // istek atarken Chrome'un güvenlik kurallarına takılmasını engeller.
                await fetch(targetUrl, { mode: 'no-cors' });

                // Eğer catch bloğuna düşmediyse sunucu ayağa kalkmıştır!
                document.getElementById('status').innerText = 'Bağlantı başarılı! Arayüz açılıyor...';

                // Kullanıcı geri tuşuna basamasın diye replace kullanıyoruz
                window.location.replace(targetUrl);
                return;
            } catch (error) {
                // Sunucu henüz yanıt vermiyorsa buraya düşer
                if (attempts >= maxAttempts) {
                    // Maksimum denemeye ulaşıldıysa animasyonu durdur ve hatayı göster
                    document.getElementById('spinner').style.display = 'none';
                    document.getElementById('main-text').innerText = 'Sistem Başlatılamadı!';
                    document.getElementById('main-text').style.color = '#fa5252';
                    document.getElementById('status').innerText = 'Lütfen cihazı yeniden başlatın (Port 3000 yanıt vermiyor).';
                    return;
                }
            }
            // Başarısız olursa 1 saniye bekle ve fonksiyonu tekrar çağır
            setTimeout(checkServer, 1000);
        };

        // Yarım saniye sonra dinlemeye başla
        setTimeout(checkServer, 500);
    </script>
</body>
</html>
EOF

# 3. Chromium'u HEMEN bu geçici sayfayla başlat
chromium-browser --kiosk --incognito --no-sandbox --force-device-scale-factor=1.75 "file://$LOADING_PAGE" &
CHROMIUM_PID=$!

# 4. Node.js Backend'i başlat
npm start-only &
NPM_START_PID=$!

# 5. Güvenli Kapatma ve Temizlik (Trap) Sistemi
cleanup() {
    echo "Sistem kapatılıyor..."
    kill $NPM_START_PID 2>/dev/null
    kill $CHROMIUM_PID 2>/dev/null
    killall unclutter 2>/dev/null
    rm -f $LOADING_PAGE
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# 6. Tarayıcı açık kaldığı sürece betiği canlı tut
wait $CHROMIUM_PID