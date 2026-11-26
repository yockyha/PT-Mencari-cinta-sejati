# Fitur: Data pribadi (nama lengkap, Instagram, TikTok) & izin melihatnya
from _inti import *  # noqa: F401,F403


def pasang(r):
    # PRIVASI INSTAGRAM: ig ada di profilPribadi; terbuka untuk pemilik, Direktur, VVIP, semua bila publik, atau yang sudah diizinkan
    r["privasi"] = {".read": True, "$uid": {".write": f"{A} && auth.uid === $uid && {BEBAS}", ".validate": "newData.child('ig').val().matches(/^(publik|sembunyi)$/) && newData.child('t').val() === now"}}
    r["profilPribadi"] = {".read": f"{A} && {DIR}", "$uid": {
      ".read": f"{A} && (auth.uid === $uid || {DIR} || {VVIP} || root.child('izinIg/' + $uid + '/' + auth.uid).exists())",
      ".write": f"{A} && auth.uid === $uid && {BEBAS}", ".validate": "newData.child('ig').isString() && newData.child('ig').val().length <= 31 && (!newData.child('tt').exists() || (newData.child('tt').isString() && newData.child('tt').val().length <= 24)) && (!newData.child('nl').exists() || (newData.child('nl').isString() && newData.child('nl').val().length <= 60)) && newData.child('t').val() === now"}}
    r["izinIgMinta"] = {"$pemilik": {".read": f"{A} && (auth.uid === $pemilik || {DIR})", "$peminta": {
      ".write": f"{A} && ((auth.uid === $peminta && newData.exists() && {BEBAS}) || (auth.uid === $pemilik && !newData.exists()))",
      ".validate": "newData.child('n').isString() && newData.child('n').val().length <= 30 && newData.child('t').val() === now"}}}
    r["izinIg"] = {"$pemilik": {".read": f"{A} && (auth.uid === $pemilik || {DIR})", "$peminta": {
      ".read": f"{A} && auth.uid === $peminta",
      ".write": f"{A} && auth.uid === $pemilik", ".validate": "newData.val() === true"}}}
