# Fitur: Fitur Direktur: efek untuk semua & sapaan tamu
from _inti import *  # noqa: F401,F403


def pasang(r):
    # DIREKTUR: efek untuk semua orang (hanya Direktur) & sapaan tamu ke Direktur (satu per tamu, paling cepat 5 menit sekali)
    r["efek"] = {".read": True, ".write": f"{A} && {DIR}",
      ".validate": "newData.child('jenis').val().matches(/^(hati|kembangapi|bunga|kumpul)$/) && newData.child('n').isString() && newData.child('n').val().length <= 30 && newData.child('t').val() === now && (!newData.child('lok').exists() || (newData.child('lok').isString() && newData.child('lok').val().length <= 20))"}
    r["sapaDir"] = {".read": f"{A} && {DIR}", ".write": f"{A} && {DIR}", "$uid": {
      ".read": f"{A} && auth.uid === $uid",
      ".write": f"{A} && auth.uid === $uid && newData.exists() && {BEBAS} && (!data.exists() || data.child('t').val() < now - 300000 || {VVIP})",
      ".validate": "newData.child('n').isString() && newData.child('n').val().length <= 30 && newData.child('j').val().matches(/^(halo|hormat|bunga|kopi|makasih|semangat)$/) && newData.child('t').isNumber() && (newData.child('t').val() === now || " + DIR + ")"}}
