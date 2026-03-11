#!/bin/bash

# Gerekli ortam değişkenlerini ayarla
export DISPLAY=:0
export XAUTHORITY=/home/proge/.Xauthority

# Proje dizinine git
cd /home/proge/FUE_Controller || exit 1

echo "Üretim sunucusu başlatılıyor..."

# Projeyi derle ve tek sunucuyu başlat (arka planda)
npm start-only &
NPM_START_PID=$!

# TRAP SİSTEMİ: Betik herhangi bir sebeple durdurulursa (CTRL+C, kill, vs.) temizlik yap
cleanup() {
    echo "Sistem kapatılıyor. Arka plan işlemleri durduruluyor..."
    kill $NPM_START_PID 2>/dev/null
    killall unclutter 2>/dev/null
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# Backend sunucusunun 3000 portunu dinlemeye başlamasını bekle (Maksimum 30 saniye)
echo "Backend (3000) sunucusunun başlaması bekleniyor..."
TIMEOUT=30
ELAPSED=0

while ! ss -tln | grep -q ':3000'; do
    sleep 1
    ELAPSED=$((ELAPSED + 1))

    # Sunucu 30 saniye içinde ayağa kalkmazsa betiği durdur
    if [ "$ELAPSED" -ge "$TIMEOUT" ]; then
        echo "HATA: Backend sunucusu $TIMEOUT saniye içinde başlatılamadı!"
        exit 1
    fi

    # Node süreci çöktü mü diye kontrol et
    if ! kill -0 $NPM_START_PID 2>/dev/null; then
        echo "HATA: Node.js sunucusu başlatılırken çöktü!"
        exit 1
    fi
done

echo "Backend sunucusu hazır ($ELAPSED saniyede açıldı)!"

# Ekran ayarlarını yap ve fareyi gizle
xset s noblank
xset s off
xset -dpms
killall unclutter 2>/dev/null # Varsa eski unclutter'ı temizle
unclutter -idle 1 -root &

# Backend hazır olduğu an tarayıcıyı kiosk modunda başlat
chromium-browser --kiosk --incognito --no-sandbox --force-device-scale-factor=1.75 http://localhost:3000

# Tarayıcı kapatıldığında trap tetiklenecek ve sunucu temiz bir şekilde durdurulacaktır.