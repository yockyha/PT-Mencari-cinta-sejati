# Fitur: pintu Ruang Direktur (tamu mengetuk, Direktur mengizinkan)
from _inti import *


def pasang(r):
    # ketukan: tamu menulis ketukannya sendiri (paling cepat 1 menit sekali); Direktur membaca & menghapus
    r["ketukDir"] = {".read": f"{A} && {DIR}", "$uid": {".read": f"{A} && auth.uid === $uid",
      ".write": f"{A} && ((auth.uid === $uid && {BEBAS} && (!newData.exists() || !data.exists() || data.child('t').val() < now - 60000)) || (!newData.exists() && {DIR}))",
      ".validate": "newData.child('n').isString() && newData.child('n').val().length <= 30 && newData.child('t').val() === now"}}
    # izin masuk: hanya Direktur yang memberi; tamu boleh membaca & menghapus izinnya sendiri
    r["izinDir"] = {".read": f"{A} && {DIR}", "$uid": {".read": f"{A} && auth.uid === $uid",
      ".write": f"{A} && ({DIR} || (auth.uid === $uid && !newData.exists()))",
      ".validate": "newData.child('sampai').isNumber() && (!newData.child('n').exists() || (newData.child('n').isString() && newData.child('n').val().length <= 30))"}}
