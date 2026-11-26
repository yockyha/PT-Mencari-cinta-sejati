# Fitur: Papan Informasi (layar LED di halaman depan): semua bisa baca, hanya Direktur menulis
from _inti import *  # noqa: F401,F403


def pasang(r):
    r["papanInfo"] = {".read": True, ".write": f"{A} && {DIR}", "$id": {
      ".validate": "newData.child('j').isString() && newData.child('j').val().length >= 1 && newData.child('j').val().length <= 60"
                   " && (!newData.child('m').exists() || (newData.child('m').isString() && newData.child('m').val().length <= 400))"
                   " && (!newData.child('ik').exists() || (newData.child('ik').isString() && newData.child('ik').val().length <= 8))"
                   " && (!newData.child('w').exists() || newData.child('w').val().matches(/^(pink|emas|biru|hijau|ungu|merah)$/))"
                   " && (!newData.child('pin').exists() || newData.child('pin').isBoolean())"
                   " && newData.child('t').isNumber()"}}
