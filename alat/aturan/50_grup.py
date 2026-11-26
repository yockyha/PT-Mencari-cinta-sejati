# Fitur: Grup obrolan
from _inti import *  # noqa: F401,F403


def pasang(r):
    r["grup"] = {".read": f"{A} && {DIR}", ".write": f"{A} && {DIR}", "$gid": {
      ".read": f"{A} && ({ANG} || {DIR})",
      ".write": f"{A} && ((!data.exists() && newData.child('pemilik').val() === auth.uid && newData.child('anggota/' + auth.uid).exists() && {BEBAS} && ({VIP_AKTIF} || {LV7} || {DIR})) || (data.exists() && !newData.exists() && data.child('pemilik').val() === auth.uid))",
      ".validate": "newData.child('nama').isString() && newData.child('nama').val().length >= 1 && newData.child('nama').val().length <= 30 && newData.child('pemilik').isString() && newData.child('t').isNumber() && (!newData.child('ikon').exists() || (newData.child('ikon').isString() && newData.child('ikon').val().length <= 8))",
      "anggota": {"$u": {
        ".write": f"{A} && ((auth.uid === $u && newData.exists() && root.child('grupUndangan/' + auth.uid + '/' + $gid).exists() && {BEBAS}) || (!newData.exists() && (auth.uid === $u || {PEM})))",
        ".validate": "newData.isString() && newData.val().length <= 30"}}}}
    r["grupPesan"] = {".read": f"{A} && {DIR}", ".write": f"{A} && {DIR}", "$gid": {
      ".read": f"{A} && ({ANG} || {DIR})",
      ".write": f"{A} && !newData.exists() && {PEM}",
      "$id": {".write": f"{A} && ((!data.exists() && newData.exists() && {ANG} && {BEBAS}) || (!newData.exists() && {PEM}))",
        ".validate": pesan(300) + " && (!newData.child('sis').exists() || newData.child('sis').val() === true) && " + ST_OK}}}
    r["grupku"] = {"$uid": {".read": f"{A} && auth.uid === $uid", "$gid": {
      ".write": f"{A} && ((auth.uid === $uid && (!newData.exists() || newData.parent().parent().parent().child('grup/' + $gid + '/anggota/' + $uid).exists())) || ({ANG} && (!newData.exists() || root.child('grup/' + $gid + '/anggota/' + $uid).exists())) || {DIR})",
      ".validate": "newData.child('nama').isString() && newData.child('nama').val().length <= 30 && newData.child('t').isNumber()"}}}
    r["grupUndangan"] = {"$uid": {".read": f"{A} && auth.uid === $uid", "$gid": {
      ".write": f"{A} && ((newData.exists() && ({ANG} || {DIR}) && {BEBAS}) || (!newData.exists() && auth.uid === $uid))",
      ".validate": "newData.child('nama').isString() && newData.child('dari').isString() && newData.child('dari').val().length <= 30 && newData.child('t').val() === now"}}}
