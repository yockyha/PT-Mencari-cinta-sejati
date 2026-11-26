# Fitur: Ajakan ngobrol, obrolan pribadi, pesan suara, telepon, suka & match
from _inti import *  # noqa: F401,F403


def pasang(r):
    r["undangan"] = {"$ke": {".read": f"{A} && auth.uid === $ke", "$dari": {
      ".write": f"{A} && ((auth.uid === $dari && newData.exists() && {BEBAS}) || (auth.uid === $ke && !newData.exists()))",
      ".validate": "newData.child('n').isString() && newData.child('n').val().length <= 20 && newData.child('t').val() === now"}}}
    # OBROLAN PRIBADI: sengaja TIDAK bisa dibaca siapa pun selain dua orang di dalamnya (termasuk Direktur)
    r["dm"] = {"$room": {".read": f"{A} && {IKUT}",
      "ok": {".write": f"{A} && {IKUT} && newData.val() === true && (root.child('undangan/' + auth.uid + '/' + {LAIN}).exists() || root.child('match/' + auth.uid + '/' + {LAIN}).exists())"},
      "pesan": {"$id": {".write": f"{A} && {IKUT} && !data.exists() && root.child('dm/' + $room + '/ok').val() === true && {BEBAS}",
        ".validate": pesan(300) + " && (!newData.child('sv').exists() || (newData.child('sv/id').isString() && newData.child('sv/dur').isNumber() && newData.child('sv/dur').val() <= 31)) && " + ST_OK}}}}
    # PESAN SUARA: audio terpisah dari teks, hanya peserta obrolan; boleh dihapus peserta setelah 7 hari
    r["suaraDm"] = {"$room": {".read": f"{A} && {IKUT}", "$id": {
      ".write": f"{A} && {IKUT} && ((!data.exists() && newData.exists() && root.child('dm/' + $room + '/ok').val() === true && {BEBAS}) || (data.exists() && !newData.exists() && data.child('t').val() < now - 604800000))",
      ".validate": "newData.child('uid').val() === auth.uid && newData.child('d').isString() && newData.child('d').val().length <= 160000 && newData.child('tp').isString() && newData.child('tp').val().matches(/^audio\\/(webm|mp4|ogg|mpeg|aac|x-m4a)$/) && newData.child('t').val() === now"}}}
    r["sinyal"] = {"$room": {".read": f"{A} && {IKUT}", ".write": f"{A} && {IKUT} && (!newData.exists() || (({MATCH_LAIN} || {DM_OK}) && {BEBAS}))"}}
    r["telepon"] = {"$ke": {
      ".read": f"{A} && (auth.uid === $ke || data.child('dari').val() === auth.uid)",
      ".write": f"{A} && (auth.uid === $ke || (newData.exists() && newData.child('dari').val() === auth.uid && (root.child('match/' + auth.uid + '/' + $ke).exists() || root.child('dm/' + auth.uid + '_' + $ke + '/ok').val() === true || root.child('dm/' + $ke + '_' + auth.uid + '/ok').val() === true) && {BEBAS} && (!data.exists() || data.child('dari').val() === auth.uid || data.child('t').val() < now - 60000)) || (!newData.exists() && data.child('dari').val() === auth.uid))",
      ".validate": "newData.child('dari').isString() && newData.child('r').isString() && newData.child('n').isString() && newData.child('n').val().length <= 30 && newData.child('st').val().matches(/^(dering|angkat|tolak)$/) && newData.child('t').isNumber()"}}
    r["dmku"] = {"$uid": {".read": f"{A} && auth.uid === $uid", "$room": {
      ".write": f"{A} && {IKUT} && ($room.beginsWith($uid + '_') || $room.endsWith('_' + $uid))",
      ".validate": "newData.child('n').isString() && newData.child('u').isString()"}}}
    r["suka"] = {"$ke": {".read": f"{A} && auth.uid === $ke && {VIP}", "$dari": {
      ".read": f"{A} && auth.uid === $ke && root.child('suka/' + $dari + '/' + auth.uid).exists()",
      ".write": f"{A} && auth.uid === $dari && $dari !== $ke && (!newData.exists() || {BEBAS})", ".validate": "newData.val() === now"}}}
    r["jumlahSuka"] = {".read": True, "$uid": {
      ".write": f"{A} && auth.uid !== $uid && ((newData.parent().parent().child('suka/' + $uid + '/' + auth.uid).exists() && !root.child('suka/' + $uid + '/' + auth.uid).exists()) || (!newData.parent().parent().child('suka/' + $uid + '/' + auth.uid).exists() && root.child('suka/' + $uid + '/' + auth.uid).exists()))",
      ".validate": "newData.isNumber() && newData.val() >= 0 && ((!data.exists() && newData.val() <= 1) || (data.exists() && (newData.val() === data.val() + 1 || newData.val() === data.val() - 1)))"}}
    r["match"] = {"$a": {".read": f"{A} && auth.uid === $a", "$b": {
      ".write": f"{A} && (auth.uid === $a || auth.uid === $b) && root.child('suka/' + $a + '/' + $b).exists() && root.child('suka/' + $b + '/' + $a).exists()",
      ".validate": "newData.child('n').isString()"}}}
