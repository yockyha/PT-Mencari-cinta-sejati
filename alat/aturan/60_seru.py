# Fitur: Streak, Amplop Cinta, Menfess & Speed Dating
from _inti import *  # noqa: F401,F403


def pasang(r):
    # STREAK HARIAN: lanjut bila 12–54 jam sejak check-in terakhir, selain itu mulai dari 1
    r["streak"] = {".read": True, "$uid": {".write": f"{A} && auth.uid === $uid && {BEBAS}",
      ".validate": "newData.child('t').val() === now && newData.child('n').isNumber() && ((!data.exists() && newData.child('n').val() === 1) || (data.exists() && now - data.child('t').val() >= 43200000 && ((now - data.child('t').val() < 194400000 && newData.child('n').val() === data.child('n').val() + 1) || (now - data.child('t').val() >= 194400000 && newData.child('n').val() === 1))))"}}
    r["amplop"] = {"$uid": {".read": f"{A} && (auth.uid === $uid || {DIR})", ".write": f"{A} && auth.uid === $uid && {BEBAS}",
      ".validate": f"newData.child('t').val() === now && newData.child('n').isNumber() && ((newData.child('tg').val() === now && (!data.exists() || !data.child('tg').exists() || now - data.child('tg').val() >= 72000000)) || ((data.exists() && newData.child('tg').val() === data.child('tg').val() || (!data.exists() && newData.child('tg').val() === 0)) && {DM_B} === {DM_L} - 30))"}}
    r["menfess"] = {".read": A, ".indexOn": ["t"], "$id": {
      ".write": f"{A} && ((!data.exists() && {BEBAS} && {MF_OK}) || (data.exists() && !newData.exists() && ({PENGIRIM} || {STAF})))",
      ".validate": "data.exists() || newData.hasChildren(['m', 't'])",
      "m": {".validate": "newData.isString() && newData.val().length >= 1 && newData.val().length <= 280 && (!data.exists() || data.val() === newData.val())"},
      "ke": {".validate": "newData.isString() && (!data.exists() || data.val() === newData.val())"},
      "keN": {".validate": "newData.isString() && newData.val().length <= 30 && (!data.exists() || data.val() === newData.val())"},
      "t": {".validate": "(!data.exists() && newData.val() === now) || data.val() === newData.val()"},
      "n": {".write": f"{A} && {PENGIRIM} && newData.exists()", ".validate": "newData.isString() && newData.val().length <= 30 && newData.val() === root.child('anggota/' + auth.uid + '/n').val()"},
      "s": {"$u": {".write": f"{A} && auth.uid === $u && (!newData.exists() || {BEBAS})", ".validate": "newData.val() === true"}},
      "$lain": {".validate": False}}}
    r["menfessPengirim"] = {".read": f"{A} && {DIR}", "$id": {".write": f"{A} && ((!data.exists() && newData.val() === auth.uid) || (!newData.exists() && (data.val() === auth.uid || {STAF})))", ".validate": "newData.isString()"}}
    r["menfessT"] = {"$uid": {".read": f"{A} && auth.uid === $uid", ".write": f"{A} && auth.uid === $uid", ".validate": "newData.val() === now"}}
    r["menfessKu"] = {"$ke": {".read": f"{A} && auth.uid === $ke", "$id": {".write": f"{A} && ((newData.exists() && newData.parent().parent().parent().child('menfessPengirim/' + $id).val() === auth.uid) || (!newData.exists() && (auth.uid === $ke || root.child('menfessPengirim/' + $id).val() === auth.uid || {STAF})))", ".validate": "newData.child('t').val() === now"}}}
    # SPEED DATING: ronde diatur Direktur; antrean khusus tamu Cari Jodoh; obrolan hanya pasangan ronde ini
    r["speedDating"] = {".read": A, ".write": f"{A} && {DIR}"}
    r["sdAntre"] = {".read": A, "$uid": {".write": f"{A} && auth.uid === $uid && (!newData.exists() || ({BEBAS} && root.child('anggota/' + auth.uid + '/tj').val() === 'jodoh'))", ".validate": "newData.child('n').isString() && newData.child('n').val().length <= 30 && newData.child('t').val() === now"}}
    r["sdChat"] = {".read": f"{A} && {DIR}", "$room": {".read": f"{A} && {IKUT} && {SD_PAS}", "$id": {".write": f"{A} && {IKUT} && {SD_PAS} && !data.exists() && {BEBAS}", ".validate": pesan(200)}}}
