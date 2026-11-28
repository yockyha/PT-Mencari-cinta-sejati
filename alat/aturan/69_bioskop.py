# Fitur: 🎬 Bioskop Cinta (film, jadwal, tayangan) & 🎡 Bianglala (naik berdua, obrolan gondola, lampion, kembang api)
from _inti import *  # noqa: F401,F403

# kunci film katalog bawaan (harus sama dengan KATALOG di kantor/bioskop.js)
KATALOG_ID = "/^(bbb|agent|coffee|hero|charge|wingit|llama|spring|sintel|sprite)$/"
YT11 = "/^[A-Za-z0-9_-]{11}$/"


def pasang(r):
    F = "newData.child('f').val()"
    FILM_ADA = f"({F}.matches({KATALOG_ID}) || root.child('bioskop/film/' + {F}).exists())"
    r["bioskop"] = {
        ".read": True,
        # film tambahan dari YouTube: hanya Direktur
        "film": {"$f": {".write": f"{A} && {DIR}",
            ".validate": f"$f.matches(/^yt[a-z0-9]{{4,16}}$/) && newData.hasChildren(['v', 'j', 'd', 's']) && newData.child('v').val().matches({YT11}) && " + TXT('j', 60) + " && newData.child('d').isNumber() && newData.child('d').val() >= 30 && newData.child('d').val() <= 600 && newData.child('s').isNumber() && newData.child('s').val() >= 0"}},
        # jadwal penayangan: hanya Direktur
        "jadwal": {"$id": {".write": f"{A} && {DIR}",
            ".validate": f"newData.hasChildren(['f', 'mulai']) && {FILM_ADA} && newData.child('mulai').isNumber() && (!newData.child('n').exists() || " + TXT('n', 30) + ")"}},
        # tayangan sekarang: Direktur bebas; tamu boleh memutar film yang ada di daftar saat layar kosong (maks 5,5 menit)
        "tayang": {
            ".write": f"{A} && ({DIR} || (newData.exists() && {BEBAS} && (!data.exists() || data.child('akhir').val() < now)))",
            ".validate": f"newData.hasChildren(['f', 'mulai', 'akhir', 'uid', 'n']) && {FILM_ADA} && newData.child('uid').val() === auth.uid && " + TXT('n', 30)
                + " && newData.child('mulai').isNumber() && newData.child('akhir').isNumber() && newData.child('akhir').val() > newData.child('mulai').val()"
                + f" && ({DIR} || (newData.child('mulai').val() >= now - 15000 && newData.child('mulai').val() <= now + 5000 && newData.child('akhir').val() - newData.child('mulai').val() <= 330000))",
            **{k: {".validate": True} for k in ("f", "mulai", "akhir", "uid", "n")},
            "$lain": {".validate": False},
        },
    }

    # 🎡 BIANGLALA
    # ajakan naik berdua: ajakBL/<penerima>/<pengirim> {n, g, t}
    r["ajakBL"] = {"$uid": {".read": f"{A} && auth.uid === $uid", "$dari": {
        ".write": f"{A} && ((newData.exists() && auth.uid === $dari && $dari !== $uid && {BEBAS}) || (!newData.exists() && (auth.uid === $uid || auth.uid === $dari)))",
        ".validate": "newData.hasChildren(['n', 'g', 't']) && " + TXT('n', 30) + " && newData.child('g').isNumber() && newData.child('g').val() >= 0 && newData.child('g').val() <= 7 && newData.child('t').val() === now"}}}
    # obrolan berdua di dalam gondola (room = uidA_uidB, hanya berdua yang bisa membaca)
    r["gondolaObrol"] = {"$room": {".read": f"{A} && {IKUT}", "$id": {
        ".write": f"{A} && !data.exists() && {IKUT} && {BEBAS}", ".validate": pesan(120)}}}
    # lampion harapan: terlihat semua tamu, 1 lampion / menit
    LT = "root.child('lampionT/' + auth.uid)"
    r["lampion"] = {".read": True, "$id": {
        ".write": f"{A} && ((!data.exists() && {BEBAS} && (!{LT}.exists() || {LT}.val() < now - 60000) && newData.parent().parent().child('lampionT/' + auth.uid).val() === now) || (!newData.exists() && ({STAF} || data.child('uid').val() === auth.uid)))",
        ".validate": "newData.hasChildren(['uid', 'n', 't']) && newData.child('uid').val() === auth.uid && " + TXT('n', 30) + " && (!newData.child('m').exists() || " + TXT('m', 60) + ") && newData.child('t').val() === now"}}
    r["lampionT"] = {"$uid": {".read": f"{A} && auth.uid === $uid", ".write": f"{A} && auth.uid === $uid", ".validate": "newData.val() === now"}}
    # kembang api dari puncak bianglala: 1x / 2 menit per tamu, dilihat semua
    r["kembangApi"] = {".read": True, "$uid": {
        ".write": f"{A} && auth.uid === $uid && {BEBAS} && (!data.exists() || data.child('t').val() < now - 120000)",
        ".validate": "newData.hasChildren(['n', 't']) && " + TXT('n', 30) + " && newData.child('t').val() === now"}}
