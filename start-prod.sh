#!/bin/bash

# Gerekli ortam değişkenlerini ayarla
export DISPLAY=:0
export XAUTHORITY=/home/proge/.Xauthority

# Proje dizinine git
cd /home/proge/FUE_Controller

echo "Üretim sunucusu başlatılıyor..."
# Projeyi derle ve tek sunucuyu başlat (arka planda)
npm start &

# npm start işleminin PID'sini al
NPM_START_PID=$!

# Backend sunucusunun 3000 portunu dinlemeye başlamasını bekle
echo "Backend (3000) sunucusunun başlaması bekleniyor..."
while ! ss -tln | grep -q ':3000'; do
    sleep 1
done
echo "Backend sunucusu hazır!"

# Ekran ayarlarını yap ve fareyi gizle
xset s noblank
xset s off
xset -dpms
unclutter -idle 1 -root &

# Backend hazır olduğu an tarayıcıyı kiosk modunda başlat
# Dikkat: Port 3000 olarak değiştirildi
chromium-browser --kiosk --incognito --no-sandbox http://localhost:3000

# Tarayıcı kapatıldığında, arka plandaki sunucuyu da durdur
echo "Tarayıcı kapatıldı. Arka plan sunucusu durduruluyor..."
kill $NPM_START_PID