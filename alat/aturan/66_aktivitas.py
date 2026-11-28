# Fitur: Lomba, bunga, peluk & kuis kenal
from _inti import *  # noqa: F401,F403


def pasang(r):
    # AKTIVITAS: lomba (skor mingguan/harian, hanya naik), bunga (1×/hari per orang), peluk (persetujuan), kuis kenal (hanya pasangan match)
    r["lomba"] = {".read": A, "$jenis": {"$periode": {"$uid": {".write": f"{A} && auth.uid === $uid && $jenis.matches(/^(kuis|kerupuk)$/) && {BEBAS}",
      ".validate": "newData.child('s').isNumber() && newData.child('s').val() >= 0 && newData.child('s').val() <= 200 && newData.child('n').isString() && newData.child('n').val().length <= 20 && newData.child('t').val() === now && (!data.exists() || newData.child('s').val() > data.child('s').val())"}}}}
    r["bunga"] = {".read": A, "$ke": {"$dari": {".write": f"{A} && auth.uid === $dari && $dari !== $ke && {BEBAS} && (!data.exists() || data.val() < now - 72000000)", ".validate": "newData.val() === now"}}}
    r["aksiReq"] = {"$ke": {".read": f"{A} && auth.uid === $ke", "$dari": {".write": f"{A} && ((auth.uid === $dari && newData.exists() && {BEBAS}) || (!newData.exists() && (auth.uid === $ke || auth.uid === $dari)))", ".validate": "newData.child('j').val() === 'peluk' && newData.child('n').isString() && newData.child('t').val() === now"}}}
    r["aksiJawab"] = {"$dari": {".read": f"{A} && auth.uid === $dari", "$ke": {".write": f"{A} && ((auth.uid === $ke && newData.exists()) || (!newData.exists() && auth.uid === $dari))", ".validate": "newData.child('ok').isBoolean() && newData.child('t').val() === now"}}}
    r["kenal"] = {"$uid": {".read": f"{A} && (auth.uid === $uid || {DIR} || root.child('match/' + auth.uid + '/' + $uid).exists())", ".write": f"{A} && auth.uid === $uid && {BEBAS}", ".validate": "newData.child('j').exists() && newData.child('t').val() === now"}}
