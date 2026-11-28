# Fitur: Foto profil & Dinding Foto
from _inti import *  # noqa: F401,F403


def pasang(r):
    r["fotoProfil"] = {".read": A, "$uid": {
      ".write": f"{A} && ((auth.uid === $uid && (!newData.exists() || {BEBAS})) || (!newData.exists() && {STAF}))",
      ".validate": "newData.child('d').isString() && newData.child('d').val().length <= 40000 && " + JPEG + " && newData.child('t').val() === now"}}
    r["galeri"] = {".read": A, ".indexOn": ["t"], "$id": {
      ".write": f"{A} && ((!data.exists() && newData.child('uid').val() === auth.uid && {BEBAS} && {UNGGAH_OK}) || (data.exists() && !newData.exists() && (data.child('uid').val() === auth.uid || {STAF})))",
      ".validate": "data.exists() || (newData.child('uid').val() === auth.uid && newData.hasChildren(['n', 'th', 't']))",
      "uid": {".validate": "!data.exists() || data.val() === newData.val()"},
      "n": {".validate": "newData.isString() && newData.val().length <= 30 && (!data.exists() || data.val() === newData.val())"},
      "c": {".validate": "newData.isString() && newData.val().length <= 100 && (!data.exists() || data.val() === newData.val())"},
      "th": {".validate": "newData.isString() && newData.val().length <= 30000 && newData.val().beginsWith('data:image/jpeg;base64,') && (!data.exists() || data.val() === newData.val())"},
      "t": {".validate": "(!data.exists() && newData.val() === now) || data.val() === newData.val()"},
      "s": {"$u": {".write": f"{A} && auth.uid === $u && (!newData.exists() || {BEBAS})", ".validate": "newData.val() === true"}},
      "$lain": {".validate": False}}}
    r["galeriData"] = {".read": A, "$id": {
      ".write": f"{A} && ((!data.exists() && newData.exists() && newData.parent().parent().child('galeri/' + $id + '/uid').val() === auth.uid && !root.child('galeri/' + $id).exists()) || (!newData.exists() && (root.child('galeri/' + $id + '/uid').val() === auth.uid || {STAF})))",
      ".validate": "newData.child('d').isString() && newData.child('d').val().length <= 220000 && " + JPEG}}
    r["galeriKu"] = {"$uid": {".read": f"{A} && auth.uid === $uid", ".write": f"{A} && auth.uid === $uid", ".validate": "newData.val() === now"}}
