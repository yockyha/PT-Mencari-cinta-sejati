#!/usr/bin/env sh
# Server offline PT Mencari Cinta Sejati untuk Mac / Linux (butuh python3).
# Jalankan: sh jalankan-offline.sh   lalu buka http://localhost:8080/
cd "$(dirname "$0")" || exit 1
PORT="${1:-8080}"
URL="http://localhost:$PORT/"
echo ""
echo "  PT Mencari Cinta Sejati - MODE OFFLINE"
echo "  Beranda   : $URL"
echo "  Kantor 3D : ${URL}kantor/"
echo "  Dashboard : ${URL}dashboard/   (username: direktur, sandi: cintasejati)"
echo "  Tekan Ctrl+C untuk berhenti."
echo ""
( sleep 1; (command -v open >/dev/null && open "$URL") || (command -v xdg-open >/dev/null && xdg-open "$URL") ) >/dev/null 2>&1 &
exec python3 -m http.server "$PORT" --bind 127.0.0.1
