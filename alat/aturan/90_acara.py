# Fitur: Acara & skor game
from _inti import *  # noqa: F401,F403


def pasang(r):
    r["acara"] = {".read": True, ".write": f"{A} && {DIR}", "$id": {
      ".validate": "newData.child('judul').isString() && newData.child('judul').val().length <= 60 && newData.child('mulai').isNumber() && newData.child('durasi').isNumber() && newData.child('durasi').val() >= 5 && newData.child('durasi').val() <= 600 && newData.child('exp').isNumber() && newData.child('exp').val() >= 0 && newData.child('exp').val() <= 200"}}
    r["ikutAcara"] = {".read": True, ".write": f"{A} && {DIR}", "$id": {"$uid": {".write": f"{A} && auth.uid === $uid && root.child('acara/' + $id).exists() && {BEBAS}", ".validate": "newData.val() === true"}}}
    r["hadirAcara"] = {".read": True, ".write": f"{A} && {DIR}", "$id": {"$uid": {".write": f"{A} && auth.uid === $uid && !data.exists() && {BEBAS} && now >= root.child('acara/' + $id + '/mulai').val() && now <= root.child('acara/' + $id + '/mulai').val() + root.child('acara/' + $id + '/durasi').val() * 60000", ".validate": "newData.val() === now"}}}
    r["skor"] = {".read": True, ".write": f"{A} && {DIR}", "$hari": {"$uid": {".write": f"{A} && auth.uid === $uid && {BEBAS}",
      ".validate": "newData.child('s').isNumber() && newData.child('s').val() >= 0 && newData.child('s').val() <= 300 && newData.child('n').isString() && newData.child('n').val().length <= 20 && newData.child('t').val() === now && (!data.exists() || newData.child('s').val() > data.child('s').val())"}}}
