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

    # 💌 LAYAR UCAPAN: Direktur bebas; VIP/VVIP gratis dengan kuota per 24 jam (clubLayarKuota
    # dinaikkan di transaksi yang sama). Tamu biasa membayar → ditulis server pembayaran/Direktur.
    KQ = "newData.parent().parent().child('clubLayarKuota/' + auth.uid)"
    KQ_L = "root.child('clubLayarKuota/' + auth.uid)"
    r["clubLayar"] = {".read": True, ".write": f"{A} && {DIR}", "$id": {
        ".write": f"{A} && ((!data.exists() && {BEBAS} && newData.child('uid').val() === auth.uid && ({DIR} || ({VIP_AKTIF} && ({KQ}.child('t0').val() === now || {KQ}.child('n').val() === {KQ_L}.child('n').val() + 1)))) || (!newData.exists() && {STAF}))",
        ".validate": "!newData.exists() || (newData.hasChildren(['uid', 'n', 'm', 'tema', 't']) && " + TXT('n', 20) + " && " + TXT('m', 120) + " && newData.child('m').val().length >= 1 && (!newData.child('ke').exists() || " + TXT('ke', 30) + ") && newData.child('tema').val().matches(/^(emas|pink|biru|ungu)$/) && (!newData.child('via').exists() || newData.child('via').val().matches(/^(dir|vip|vvip|bayar)$/)) && (!newData.child('h').exists() || " + TXT('h', 12) + ") && (newData.child('t').val() === now || " + DIR + "))"}}
    # kuota jendela 24 jam: {n, t0}; reset bila sudah lewat 24 jam sejak t0. VIP 2×, VVIP 5× (lihat paket.js → layar)
    r["clubLayarKuota"] = {".read": f"{A} && {DIR}", ".write": f"{A} && {DIR}", "$uid": {".read": f"{A} && auth.uid === $uid",
        ".write": f"{A} && auth.uid === $uid && {VIP_AKTIF}",
        ".validate": f"newData.child('n').isNumber() && newData.child('n').val() <= ({VVIP} ? 5 : 2) && ((newData.child('n').val() === 1 && newData.child('t0').val() === now && (!data.exists() || now - data.child('t0').val() >= 86400000)) || (data.exists() && now - data.child('t0').val() < 86400000 && newData.child('t0').val() === data.child('t0').val() && newData.child('n').val() === data.child('n').val() + 1))"}}
