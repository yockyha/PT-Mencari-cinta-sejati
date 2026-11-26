# Fitur: Kamar, Season Pass, Pasangan Minggu Ini & Kisah Sukses
from _inti import *  # noqa: F401,F403


def pasang(r):
    # KOMUNITAS: kamar, season pass, pasangan minggu ini, kisah sukses
    r["kamar"] = {".read": A, "$uid": {".write": f"{A} && auth.uid === $uid && {BEBAS}", ".validate": "newData.child('wp').isNumber() && newData.child('lt').isNumber() && newData.child('t').val() === now"}}
    r["seasonKlaim"] = {"$uid": {".read": f"{A} && (auth.uid === $uid || {DIR})", "$ms": {"$k": {".write": f"{A} && auth.uid === $uid && !data.exists() && {BEBAS} && $k.matches(/^[bp][0-9]+$/) && ($k.beginsWith('b') || root.child('seasonPremium/' + auth.uid + '/' + $ms).exists())", ".validate": "newData.val() === true"}}}}
    r["seasonPremium"] = {"$uid": {".read": f"{A} && (auth.uid === $uid || {DIR})", ".write": f"{A} && {DIR}", "$ms": {".write": f"{A} && auth.uid === $uid && !data.exists() && {BEBAS} && newData.parent().parent().parent().child('diamond/' + $uid).val() === root.child('diamond/' + $uid).val() - 100", ".validate": "newData.val() === now"}}}
    r["pasanganSetuju"] = {".read": f"{A} && {DIR}", "$room": {".read": f"{A} && {IKUT}", "$u": {".write": f"{A} && auth.uid === $u && {IKUT} && root.child('match/' + auth.uid + '/' + {LAIN}).exists()", ".validate": "newData.val() === true"}}}
    r["pasanganMinggu"] = {".read": True, ".write": f"{A} && {DIR}"}
    r["kisah"] = {".read": A, ".write": f"{A} && {DIR}", "$id": {
      ".write": f"{A} && !data.exists() && newData.child('a').val() === auth.uid && root.child('match/' + auth.uid + '/' + newData.child('b').val()).exists() && {BEBAS}",
      ".validate": "newData.child('cerita').isString() && newData.child('cerita').val().length <= 300 && newData.child('na').isString() && newData.child('nb').isString() && (newData.child('ok').val() === false || " + DIR + ") && newData.child('t').isNumber()"}}
