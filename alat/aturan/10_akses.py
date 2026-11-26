# Fitur: Keanggotaan & akses: kehadiran online, pendaftaran, anggota, buku tamu, peran, larangan, setelan
from _inti import *  # noqa: F401,F403


def pasang(r):
    r["online"] = {".read": True, ".write": f"{A} && {DIR}", "$uid": {
      ".write": f"{A} && ((auth.uid === $uid && (!newData.exists() || {BEBAS})) || (!newData.exists() && {STAF}))",
      ".validate": f"{STAF} || (newData.child('n').val() === root.child('anggota/' + $uid + '/n').val() && newData.child('x').isNumber() && newData.child('z').isNumber() && newData.child('t').val() === now)"}}
    r["pendaftaran"] = {".read": f"{A} && {DIR}", ".write": f"{A} && {DIR}", "$uid": {
      ".read": f"{A} && auth.uid === $uid",
      ".write": f"{A} && auth.uid === $uid && !root.child('anggota/' + $uid).exists() && root.child('setelan/daftarTutup').val() !== true",
      ".validate": "!newData.exists() || " + f"{DIR} || " + "(newData.child('uid').val() === $uid && newData.child('status').val() === 'menunggu' && newData.child('n').isString() && newData.child('n').val().length >= 2 && newData.child('n').val().length <= 20 && newData.child('tj').val().matches(/^(jodoh|teman|curhat)$/) && newData.child('umur').isNumber() && newData.child('umur').val() >= 18 && newData.child('umur').val() <= 99 && newData.child('nl').isString() && newData.child('nl').val().length >= 3 && newData.child('nl').val().length <= 60 && newData.child('ig').isString() && newData.child('ig').val().matches(/^[a-z0-9._]{1,30}$/) && (!newData.child('tt').exists() || (newData.child('tt').isString() && newData.child('tt').val().matches(/^[a-z0-9._]{0,24}$/))) && newData.child('kota').isString() && newData.child('kota').val().length <= 40 && newData.child('b').isString() && newData.child('b').val().length <= 100 && newData.child('alasan').isString() && newData.child('alasan').val().length <= 200 && newData.child('t').val() === now)"}}
    r["anggota"] = {".read": True, ".write": f"{A} && {DIR}"}
    r["tamu"] = {".read": True, ".indexOn": ["t"], ".write": f"{A} && {DIR}", "$uid": {
      ".write": f"{A} && ((auth.uid === $uid && {BEBAS}) || (!newData.exists() && {STAF}))",
      ".validate": f"{DIR} || (newData.child('uid').val() === $uid && newData.child('n').val() === root.child('anggota/' + $uid + '/n').val() && newData.child('tj').val().matches(/^(jodoh|teman|curhat)$/) && newData.child('t').isNumber())"}}
    r["peran"] = {".read": True, "$uid": {".write": f"{A} && {DIR} && $uid !== auth.uid", ".validate": "newData.val() === 'staf' || newData.val() === 'direktur'"}}
    r["ban"] = {".read": f"{A} && {STAF}", "$uid": {".read": f"{A} && auth.uid === $uid",
      ".write": f"{A} && {STAF} && $uid !== auth.uid && root.child('peran/' + $uid).val() !== 'direktur' && ({DIR} || !root.child('peran/' + $uid).exists())",
      ".validate": "newData.child('sampai').isNumber() && newData.child('alasan').isString() && newData.child('alasan').val().length <= 100"}}
    for node in ["pengumuman", "setelan", "mading"]: r[node] = {".read": True, ".write": f"{A} && {DIR}"}
