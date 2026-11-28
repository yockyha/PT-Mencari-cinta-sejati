# Fitur: 🪩 Y.H.A Club — DJ musik YouTube (sinkron), request lagu, obrolan table biasa & VIP table
from _inti import *  # noqa: F401,F403

# DJ yang ditunjuk Direktur (club/dj/<uid> = true)
DJ = "root.child('club/dj/' + auth.uid).val() === true"
YT_ID = "newData.isString() && (newData.val() === '' || newData.val().matches(/^[A-Za-z0-9_-]{11}$/))"


def pasang(r):
    r["club"] = {
        ".read": True,
        # lagu yang sedang diputar untuk semua tamu di dalam club: hanya Direktur / DJ
        "lagu": {
            ".write": f"{A} && ({DIR} || {DJ})",
            ".validate": "!newData.exists() || (newData.hasChildren(['t', 'oleh']) && (newData.child('id').val() !== '' || newData.child('list').val() !== ''))",
            "id": {".validate": YT_ID},
            "list": {".validate": "newData.isString() && (newData.val() === '' || newData.val().matches(/^[A-Za-z0-9_-]{10,64}$/))"},
            "judul": {".validate": "newData.isString() && newData.val().length <= 100"},
            "n": {".validate": "newData.isString() && newData.val().length <= 30"},
            "ulang": {".validate": "newData.isBoolean()"},
            "oleh": {".validate": "newData.val() === auth.uid || newData.val() === data.val()"},
            "t": {".validate": "newData.val() === now || newData.val() === data.val()"},
            "$lain": {".validate": False},
        },
        # daftar DJ: hanya Direktur yang menunjuk / mencabut
        "dj": {"$uid": {".write": f"{A} && {DIR}", ".validate": "newData.val() === true"}},
        # request lagu dari tamu; dihapus oleh DJ / Direktur / pengirimnya
        "antre": {"$id": {
            ".write": f"{A} && ((!data.exists() && {BEBAS} && newData.child('uid').val() === auth.uid) || (!newData.exists() && ({DIR} || {DJ} || data.child('uid').val() === auth.uid)))",
            ".validate": "!newData.exists() || newData.hasChildren(['uid', 'n', 'id', 't'])",
            "uid": {".validate": "newData.val() === auth.uid"},
            "n": {".validate": "newData.isString() && newData.val().length <= 30"},
            "id": {".validate": "newData.isString() && newData.val().matches(/^[A-Za-z0-9_-]{11}$/)"},
            "c": {".validate": "newData.isString() && newData.val().length <= 60"},
            "t": {".validate": "newData.val() === now"},
            "$lain": {".validate": False},
        }},
    }
    # obrolan khusus tiap table (VIP table hanya VIP/VVIP)
    r["clubMeja"] = {".read": True, ".write": f"{A} && {DIR}", "$meja": {"$id": {
        ".write": f"{A} && $meja.matches(/^(t[1-4]|vip[12])$/) && ((!data.exists() && {BEBAS} && (!$meja.beginsWith('vip') || {VIP})) || (!newData.exists() && {STAF}))",
        ".validate": pesan(160)}}}
