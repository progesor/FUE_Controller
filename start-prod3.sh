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

# 2. Şık bir "Yükleniyor" sayfası oluştur (Geçici dizinde)
LOADING_PAGE="/tmp/fue_loading.html"
cat << 'EOF' > $LOADING_PAGE
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="refresh" content="2;url=http://localhost:3000">
    <style>
        body { background-color: #f8f9fa; color: #343a40; display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; margin: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
        h1 { font-size: 4rem; color: #2b8a3e; margin-bottom: 10px; }
        h2 { font-size: 2rem; color: #868e96; font-weight: normal; }
        .spinner { border: 8px solid #e9ecef; border-top: 8px solid #2b8a3e; border-radius: 50%; width: 80px; height: 80px; animation: spin 1s linear infinite; margin-top: 40px;}
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    </style>
</head>
<body>
    <h1>Ar-Ge Terminali</h1>
    <h2>Sistem Hazırlanıyor, Lütfen Bekleyin...</h2>
    <div class="spinner"></div>
</body>
</html>
EOF

# 3. Chromium'u HEMEN bu geçici sayfayla başlat (Arka planda)
# Bu sayede Chromium ve Node.js aynı anda açılmaya başlar, devasa zaman kazanırız.
chromium-browser --kiosk --incognito --no-sandbox --force-device-scale-factor=1.75 "file://$LOADING_PAGE" &
CHROMIUM_PID=$!

# 4. Node.js Backend'i başlat (Arka planda)
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
# Herhangi bir kapatma sinyali gelirse cleanup fonksiyonunu çalıştır
trap cleanup SIGINT SIGTERM EXIT

# 6. Tarayıcı açık kaldığı sürece betiği canlı tut
wait $CHROMIUM_PID