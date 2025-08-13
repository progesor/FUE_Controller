#!/bin/bash

export DISPLAY=:0
export XAUTHORITY=/home/proge/.Xauthority
cd /home/proge/FUE_Controller

# Arka planda dev sunucularını başlat
npx concurrently "npm run dev --workspace=backend" "npm run dev --workspace=frontend" &

# Frontend sunucusunun 5173 portunu dinlemeye başlamasını bekle
echo "Frontend sunucusunun 5173 portunda başlaması bekleniyor..."
while ! ss -tln | grep -q ':5173'; do
    sleep 1
done
echo "Frontend sunucusu hazır!"

# Ekran ayarlarını yap ve fareyi gizle
xset s noblank
xset s off
xset -dpms
unclutter -idle 1 -root &

# Frontend hazır olduğu an tarayıcıyı başlat
chromium-browser --kiosk --incognito --no-sandbox http://localhost:5173
