#!/bin/bash

# Gerekli ortam değişkenlerini ayarla
export DISPLAY=:0
export XAUTHORITY=/home/proge/.Xauthority

# Proje dizinine git
cd /home/proge/FUE_Controller

echo "Geliştirme sunucuları başlatılıyor..."
# Arka planda dev sunucularını başlat
npx concurrently "npm run dev --workspace=backend" "npm run dev --workspace=frontend" &

# concurrently'nin başlattığı işlemin PID'sini al
CONCURRENTLY_PID=$!

# Frontend sunucusunun 5173 portunu dinlemeye başlamasını bekle
echo "Frontend (5173) sunucusunun başlaması bekleniyor..."
while ! ss -tln | grep -q ':5173'; do
    sleep 1
done
echo "Frontend sunucusu hazır!"

# Ekran ayarlarını yap ve fareyi gizle
xset s noblank
xset s off
xset -dpms
unclutter -idle 1 -root &

# Frontend hazır olduğu an tarayıcıyı kiosk modunda başlat
chromium-browser --kiosk --incognito --no-sandbox http://localhost:5173

# Tarayıcı kapatıldığında, arka plandaki sunucuları da durdur
echo "Tarayıcı kapatıldı. Arka plan sunucuları durduruluyor..."
kill $CONCURRENTLY_PID