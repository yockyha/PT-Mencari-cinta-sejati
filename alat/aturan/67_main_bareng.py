# Fitur: Main bareng (duel 1 lawan 1 & Kuis Kilat kelompok)
from _inti import *  # noqa: F401,F403


def pasang(r):
    # DUEL: hanya kedua pemain (dan Direktur) yang bisa membaca; lawan bergabung karena namanya ada di 'lawan'
    PEMAIN = "(data.child('p/' + auth.uid).exists() || data.child('lawan').val() === auth.uid)"
    r["duel"] = {"$id": {
      ".read": f"{A} && ({PEMAIN} || {DIR})",
      ".write": f"{A} && ((!data.exists() && newData.child('host').val() === auth.uid && newData.child('p/' + auth.uid).exists() && {BEBAS}) || (data.exists() && {PEMAIN} && {BEBAS}) || (!newData.exists() && {DIR}))",
      ".validate": "newData.child('j').val().matches(/^(xox|empat|suit)$/) && newData.child('host').isString() && newData.child('lawan').isString() && newData.child('t').isNumber() && (!newData.child('b').exists() || (newData.child('b').isString() && newData.child('b').val().length <= 42))"}}
    r["duelUndang"] = {"$uid": {".read": f"{A} && auth.uid === $uid", "$id": {
      ".write": f"{A} && ((newData.exists() && newData.child('dari').val() === auth.uid && {BEBAS}) || (!newData.exists() && (auth.uid === $uid || data.child('dari').val() === auth.uid)))",
      ".validate": "newData.child('n').isString() && newData.child('n').val().length <= 30 && newData.child('j').isString() && newData.child('t').val() === now"}}}
    # KUIS KILAT: kamar meja/kafe (m_<meja>) terbuka untuk tamu resmi; kamar grup (g_<id>) hanya anggota grup
    BOLEH = f"({ANGGOTA} && ($room.beginsWith('m_') || root.child('grup/' + $room.replace('g_', '') + '/anggota/' + auth.uid).exists()))"
    r["kilat"] = {"$room": {".read": f"{A} && {BOLEH}",
      ".write": f"{A} && {BEBAS} && {BOLEH} && (!data.exists() || data.child('host').val() === auth.uid || data.child('st').val() === 'selesai' || data.child('t').val() < now - 600000)",
      ".validate": "newData.child('host').isString() && newData.child('t').isNumber()"}}
    r["kilatIkut"] = {"$room": {".read": f"{A} && {BOLEH}", "$uid": {".write": f"{A} && auth.uid === $uid && {BEBAS} && {BOLEH}",
      ".validate": "newData.child('n').isString() && newData.child('n').val().length <= 30 && newData.child('t').val() === now"}}}
    r["kilatJawab"] = {"$room": {".read": f"{A} && {BOLEH}", ".write": f"{A} && !newData.exists() && root.child('kilat/' + $room + '/host').val() === auth.uid",
      "$ronde": {"$uid": {".write": f"{A} && auth.uid === $uid && !data.exists() && {BEBAS} && {BOLEH}",
        ".validate": "newData.child('j').isNumber() && newData.child('n').isString() && newData.child('n').val().length <= 30 && newData.child('t').val() === now"}}}}
