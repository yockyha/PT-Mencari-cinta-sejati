# Pembuat database.rules.json. Jalankan: python3 alat/buat-aturan-firebase.py database.rules.json
import json, sys
A = "auth != null"
STAF = "root.child('peran/' + auth.uid).exists()"
DIR = "root.child('peran/' + auth.uid).val() === 'direktur'"
ANGGOTA = f"(root.child('anggota/' + auth.uid).exists() || {STAF})"
BEBAS = f"((!root.child('ban/' + auth.uid + '/sampai').exists() || root.child('ban/' + auth.uid + '/sampai').val() <= now) && (root.child('setelan/tutup').val() !== true || {STAF}) && {ANGGOTA})"
VIP = f"((root.child('vip/' + auth.uid + '/sampai').exists() && root.child('vip/' + auth.uid + '/sampai').val() > now) || {DIR})"
VVIP = "(root.child('vip/' + auth.uid + '/tingkat').val() === 'vvip' && root.child('vip/' + auth.uid + '/sampai').val() > now)"
VIP_AKTIF = "(root.child('vip/' + auth.uid + '/sampai').exists() && root.child('vip/' + auth.uid + '/sampai').val() > now)"
# stiker: f_ gratis, v_ VIP/VVIP, w_ VVIP; Direktur semua
ST_OK = f"(!newData.child('st').exists() || newData.child('st').val().matches(/^f_[a-z]+$/) || (newData.child('st').val().matches(/^v_[a-z]+$/) && {VIP_AKTIF}) || (newData.child('st').val().matches(/^w_[a-z]+$/) && {VVIP}) || {DIR})"
IKUT = "($room.beginsWith(auth.uid + '_') || $room.endsWith('_' + auth.uid))"
LAIN = "$room.replace(auth.uid, '').replace('_', '')"
D = lambda: {".read": f"{A} && {DIR}", ".write": f"{A} && {DIR}"}   # akses penuh Direktur di satu node
def pesan(n): return f"newData.child('uid').val() === auth.uid && newData.child('n').isString() && newData.child('n').val().length <= 30 && newData.child('m').isString() && newData.child('m').val().length > 0 && newData.child('m').val().length <= {n} && newData.child('t').val() === now"
def buatHapus(val, pemilik=False):
    return {".write": f"{A} && ((!data.exists() && {BEBAS}) || (!newData.exists() && {STAF}))", ".validate": val}

r = {".read": False, ".write": False}
r["online"] = {".read": True, ".write": f"{A} && {DIR}", "$uid": {
  ".write": f"{A} && ((auth.uid === $uid && (!newData.exists() || {BEBAS})) || (!newData.exists() && {STAF}))",
  ".validate": f"{STAF} || (newData.child('n').val() === root.child('anggota/' + $uid + '/n').val() && newData.child('x').isNumber() && newData.child('z').isNumber() && newData.child('t').val() === now)"}}
r["pendaftaran"] = {".read": f"{A} && {DIR}", ".write": f"{A} && {DIR}", "$uid": {
  ".read": f"{A} && auth.uid === $uid",
  ".write": f"{A} && auth.uid === $uid && !root.child('anggota/' + $uid).exists() && root.child('setelan/daftarTutup').val() !== true",
  ".validate": "!newData.exists() || " + f"{DIR} || " + "(newData.child('uid').val() === $uid && newData.child('status').val() === 'menunggu' && newData.child('n').isString() && newData.child('n').val().length >= 2 && newData.child('n').val().length <= 20 && newData.child('tj').val().matches(/^(jodoh|teman|curhat)$/) && newData.child('umur').isNumber() && newData.child('umur').val() >= 18 && newData.child('umur').val() <= 99 && newData.child('nl').isString() && newData.child('nl').val().length >= 3 && newData.child('nl').val().length <= 60 && newData.child('ig').isString() && newData.child('ig').val().matches(/^[a-z0-9._]{1,30}$/) && (!newData.child('tt').exists() || (newData.child('tt').isString() && newData.child('tt').val().matches(/^[a-z0-9._]{0,24}$/))) && newData.child('kota').isString() && newData.child('kota').val().length <= 40 && newData.child('b').isString() && newData.child('b').val().length <= 100 && newData.child('alasan').isString() && newData.child('alasan').val().length <= 200 && newData.child('t').val() === now)"}}
r["anggota"] = {".read": True, ".write": f"{A} && {DIR}"}
r["tamu"] = {".read": True, ".indexOn": ["t"], ".write": f"{A} && {DIR}", "$uid": {
  ".write": f"{A} && ((auth.uid === $uid && {BEBAS}) || (!newData.exists() && {STAF}))",
  ".validate": f"{DIR} || (newData.child('uid').val() === $uid && newData.child('n').val() === root.child('anggota/' + $uid + '/n').val() && newData.child('tj').val().matches(/^(jodoh|teman|curhat)$/) && newData.child('t').isNumber())"}}
r["chat"] = {".read": True, ".write": f"{A} && {DIR}", "$id": buatHapus(pesan(120))}
r["papan"] = {".read": True, ".write": f"{A} && {DIR}", "$id": buatHapus(pesan(80))}
r["curhat"] = {".read": True, ".write": f"{A} && {DIR}", "$id": {
  **buatHapus("newData.child('m').isString() && newData.child('m').val().length > 0 && newData.child('m').val().length <= 300 && newData.child('t').isNumber()"),
  "m": {".validate": f"!data.exists() || data.val() === newData.val() || {DIR}"},
  "peluk": {"$uid": {".write": f"{A} && auth.uid === $uid && (!newData.exists() || {BEBAS})", ".validate": "newData.val() === true"}},
  "balas": {"$b": buatHapus(pesan(160))}}}
r["curhatPemilik"] = {".read": f"{A} && {STAF}", ".write": f"{A} && {DIR}", "$id": {".write": f"{A} && ((!data.exists() && newData.val() === auth.uid && {BEBAS}) || (!newData.exists() && {STAF}))"}}
for node, val in [("saran", "newData.child('dari').val() === auth.uid && newData.child('m').isString() && newData.child('m').val().length <= 300 && newData.child('t').val() === now"),
                  ("laporan", "newData.child('dari').val() === auth.uid && newData.child('target').isString() && newData.child('alasan').isString() && newData.child('alasan').val().length <= 120 && newData.child('t').val() === now")]:
    r[node] = {".read": f"{A} && {STAF}", ".write": f"{A} && {DIR}", "$id": {".write": f"{A} && ((!data.exists() && {BEBAS}) || (!newData.exists() && {STAF}))", ".validate": val}}
# MEJA NONGKRONG: obrolan, papan kegiatan & voting "Pilih Mana" per meja topik
MEJA_ID = "$meja.matches(/^(gaming|musik|drakor|olahraga|kuliner|buku|jalan|random|kafe|lounge)$/)"
r["mejaChat"] = {".read": True, ".write": f"{A} && {DIR}", "$meja": {"$id": {
  ".write": f"{A} && {MEJA_ID} && ((!data.exists() && {BEBAS}) || (!newData.exists() && {STAF}))", ".validate": pesan(160)}}}
TXT = lambda k, n: f"newData.child('{k}').isString() && newData.child('{k}').val().length <= {n}"
r["mejaPapan"] = {".read": True, ".write": f"{A} && {DIR}", "$meja": {"$id": {
  ".write": f"{A} && {MEJA_ID} && ((!data.exists() && {BEBAS}) || (data.exists() && !newData.exists() && (data.child('uid').val() === auth.uid || {STAF})))",
  ".validate": "data.exists() || (newData.child('uid').val() === auth.uid && newData.hasChildren(['n', 't']))",
  "uid": {".validate": "!data.exists() || data.val() === newData.val()"},
  "n": {".validate": "newData.isString() && newData.val().length <= 30 && (!data.exists() || data.val() === newData.val())"},
  "a": {".validate": "newData.isString() && newData.val().length <= 60 && (!data.exists() || data.val() === newData.val())"},
  "b": {".validate": "newData.isString() && newData.val().length <= 60 && (!data.exists() || data.val() === newData.val())"},
  "c": {".validate": "newData.isString() && newData.val().length <= 160 && (!data.exists() || data.val() === newData.val())"},
  "t": {".validate": "(!data.exists() && newData.val() === now) || data.val() === newData.val()"},
  "s": {"$uid": {".write": f"{A} && auth.uid === $uid && (!newData.exists() || {BEBAS})", ".validate": "newData.val() === true"}},
  "$lain": {".validate": False}}}}
r["mejaVote"] = {".read": True, ".write": f"{A} && {DIR}", "$meja": {"$hari": {"$uid": {
  ".write": f"{A} && auth.uid === $uid && {MEJA_ID} && $hari.matches(/^[0-9]+$/) && $hari.length === 8 && {BEBAS}", ".validate": "newData.val() === 'a' || newData.val() === 'b'"}}}}
# DIREKTUR: efek untuk semua orang (hanya Direktur) & sapaan tamu ke Direktur (satu per tamu, paling cepat 5 menit sekali)
r["efek"] = {".read": True, ".write": f"{A} && {DIR}",
  ".validate": "newData.child('jenis').val().matches(/^(hati|kembangapi|bunga|kumpul)$/) && newData.child('n').isString() && newData.child('n').val().length <= 30 && newData.child('t').val() === now && (!newData.child('lok').exists() || (newData.child('lok').isString() && newData.child('lok').val().length <= 20))"}
r["sapaDir"] = {".read": f"{A} && {DIR}", ".write": f"{A} && {DIR}", "$uid": {
  ".read": f"{A} && auth.uid === $uid",
  ".write": f"{A} && auth.uid === $uid && newData.exists() && {BEBAS} && (!data.exists() || data.child('t').val() < now - 300000 || {VVIP})",
  ".validate": "newData.child('n').isString() && newData.child('n').val().length <= 30 && newData.child('j').val().matches(/^(halo|hormat|bunga|kopi|makasih|semangat)$/) && newData.child('t').isNumber() && (newData.child('t').val() === now || " + DIR + ")"}}
# PRIVASI INSTAGRAM: ig ada di profilPribadi; terbuka untuk pemilik, Direktur, VVIP, semua bila publik, atau yang sudah diizinkan
r["privasi"] = {".read": True, "$uid": {".write": f"{A} && auth.uid === $uid && {BEBAS}", ".validate": "newData.child('ig').val().matches(/^(publik|sembunyi)$/) && newData.child('t').val() === now"}}
r["profilPribadi"] = {".read": f"{A} && {DIR}", "$uid": {
  ".read": f"{A} && (auth.uid === $uid || {DIR} || {VVIP} || root.child('izinIg/' + $uid + '/' + auth.uid).exists())",
  ".write": f"{A} && auth.uid === $uid && {BEBAS}", ".validate": "newData.child('ig').isString() && newData.child('ig').val().length <= 31 && (!newData.child('tt').exists() || (newData.child('tt').isString() && newData.child('tt').val().length <= 24)) && (!newData.child('nl').exists() || (newData.child('nl').isString() && newData.child('nl').val().length <= 60)) && newData.child('t').val() === now"}}
r["izinIgMinta"] = {"$pemilik": {".read": f"{A} && (auth.uid === $pemilik || {DIR})", "$peminta": {
  ".write": f"{A} && ((auth.uid === $peminta && newData.exists() && {BEBAS}) || (auth.uid === $pemilik && !newData.exists()))",
  ".validate": "newData.child('n').isString() && newData.child('n').val().length <= 30 && newData.child('t').val() === now"}}}
r["izinIg"] = {"$pemilik": {".read": f"{A} && (auth.uid === $pemilik || {DIR})", "$peminta": {
  ".read": f"{A} && auth.uid === $peminta",
  ".write": f"{A} && auth.uid === $pemilik", ".validate": "newData.val() === true"}}}
# level 7 = 800 EXP (EXP tugas + EXP dibeli)
EXP_T = "root.child('exp/' + auth.uid + '/n')"
EXP_B = "root.child('expBeli/' + auth.uid)"
LV7 = f"(({EXP_T}.exists() && {EXP_T}.val() >= 800) || ({EXP_B}.exists() && {EXP_B}.val() >= 800) || ({EXP_T}.exists() && {EXP_B}.exists() && {EXP_T}.val() + {EXP_B}.val() >= 800))"
# GRUP OBROLAN (membuat grup: VIP/VVIP, level 7+, atau Direktur): hanya anggota (dan Direktur) yang bisa membaca & menulis; bergabung harus lewat undangan
ANG = "root.child('grup/' + $gid + '/anggota/' + auth.uid).exists()"
PEM = "root.child('grup/' + $gid + '/pemilik').val() === auth.uid"
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
# FOTO PROFIL & DINDING FOTO (gambar JPEG base64 di database; ukuran dibatasi)
JPEG = "newData.child('d').val().beginsWith('data:image/jpeg;base64,')"
r["fotoProfil"] = {".read": A, "$uid": {
  ".write": f"{A} && ((auth.uid === $uid && (!newData.exists() || {BEBAS})) || (!newData.exists() && {STAF}))",
  ".validate": "newData.child('d').isString() && newData.child('d').val().length <= 40000 && " + JPEG + " && newData.child('t').val() === now"}}
UNGGAH_OK = "(!root.child('galeriKu/' + auth.uid).exists() || root.child('galeriKu/' + auth.uid).val() < now - 60000) && newData.parent().parent().child('galeriKu/' + auth.uid).val() === now"
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
# STREAK HARIAN: lanjut bila 12–54 jam sejak check-in terakhir, selain itu mulai dari 1
r["streak"] = {".read": True, "$uid": {".write": f"{A} && auth.uid === $uid && {BEBAS}",
  ".validate": "newData.child('t').val() === now && newData.child('n').isNumber() && ((!data.exists() && newData.child('n').val() === 1) || (data.exists() && now - data.child('t').val() >= 43200000 && ((now - data.child('t').val() < 194400000 && newData.child('n').val() === data.child('n').val() + 1) || (now - data.child('t').val() >= 194400000 && newData.child('n').val() === 1))))"}}
# AMPLOP CINTA: gratis tiap 20 jam (tg), selain itu Diamond terpotong 30 di transaksi yang sama
DM_B = "newData.parent().parent().child('diamond/' + $uid).val()"
DM_L = "root.child('diamond/' + $uid).val()"
r["amplop"] = {"$uid": {".read": f"{A} && (auth.uid === $uid || {DIR})", ".write": f"{A} && auth.uid === $uid && {BEBAS}",
  ".validate": f"newData.child('t').val() === now && newData.child('n').isNumber() && ((newData.child('tg').val() === now && (!data.exists() || !data.child('tg').exists() || now - data.child('tg').val() >= 72000000)) || ((data.exists() && newData.child('tg').val() === data.child('tg').val() || (!data.exists() && newData.child('tg').val() === 0)) && {DM_B} === {DM_L} - 30))"}}
# MENFESS: pesan anonim; pengirim hanya diketahui Direktur (menfessPengirim), 1 menfess / 10 menit
MF_OK = "(!root.child('menfessT/' + auth.uid).exists() || root.child('menfessT/' + auth.uid).val() < now - 600000) && newData.parent().parent().child('menfessT/' + auth.uid).val() === now && newData.parent().parent().child('menfessPengirim/' + $id).val() === auth.uid"
PENGIRIM = "root.child('menfessPengirim/' + $id).val() === auth.uid"
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
SD_PAS = f"root.child('speedDating/ronde/pasangan/' + auth.uid).val() === {LAIN}"
r["sdChat"] = {".read": f"{A} && {DIR}", "$room": {".read": f"{A} && {IKUT} && {SD_PAS}", "$id": {".write": f"{A} && {IKUT} && {SD_PAS} && !data.exists() && {BEBAS}", ".validate": pesan(200)}}}
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
# TELEPON (WebRTC): pasangan yang saling match atau obrolan pribadi yang sudah diterima kedua pihak. sinyal = offer/answer/ICE, telepon/<penerima> = panggilan masuk
MATCH_LAIN = f"root.child('match/' + auth.uid + '/' + {LAIN}).exists()"
DM_OK = "root.child('dm/' + $room + '/ok').val() === true"
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
r["peran"] = {".read": True, "$uid": {".write": f"{A} && {DIR} && $uid !== auth.uid", ".validate": "newData.val() === 'staf' || newData.val() === 'direktur'"}}
r["ban"] = {".read": f"{A} && {STAF}", "$uid": {".read": f"{A} && auth.uid === $uid",
  ".write": f"{A} && {STAF} && $uid !== auth.uid && root.child('peran/' + $uid).val() !== 'direktur' && ({DIR} || !root.child('peran/' + $uid).exists())",
  ".validate": "newData.child('sampai').isNumber() && newData.child('alasan').isString() && newData.child('alasan').val().length <= 100"}}
for node in ["pengumuman", "setelan", "mading"]: r[node] = {".read": True, ".write": f"{A} && {DIR}"}
r["exp"] = {".read": True, ".write": f"{A} && {DIR}", "$uid": {".write": f"{A} && auth.uid === $uid && {BEBAS}",
  ".validate": f"{DIR} || (newData.child('n').isNumber() && newData.child('t').val() === now && ((!data.exists() && newData.child('n').val() <= 60) || (data.exists() && newData.child('n').val() >= data.child('n').val() && newData.child('n').val() <= data.child('n').val() + 60 && now - data.child('t').val() >= 3000)))"}}
r["tugas"] = {".read": f"{A} && {DIR}", ".write": f"{A} && {DIR}", "$uid": {".read": f"{A} && auth.uid === $uid", "$k": {".write": f"{A} && auth.uid === $uid && !data.exists() && {BEBAS}", ".validate": "newData.val() === true && $k.length <= 40"}}}
r["expBeli"] = {".read": True, ".write": f"{A} && {DIR}", "$uid": {".validate": "newData.isNumber() && newData.val() >= 0"}}
# VIP/VVIP: Direktur bebas; tamu boleh membeli sendiri bila di transaksi yang sama Diamond-nya terpotong persis sesuai harga (300 VIP / 650 VVIP), maksimal +30 hari
DM_BARU = "newData.parent().parent().child('diamond/' + $uid).val()"
DM_LAMA = "root.child('diamond/' + $uid).val()"
HARI30 = "2592060000"
r["vip"] = {".read": True, ".write": f"{A} && {DIR}", "$uid": {
  ".write": f"{A} && auth.uid === $uid && {BEBAS} && newData.exists() && ((newData.child('tingkat').val() === 'vip' && {DM_BARU} === {DM_LAMA} - 300) || (newData.child('tingkat').val() === 'vvip' && {DM_BARU} === {DM_LAMA} - 650)) && newData.child('sampai').val() > now && (newData.child('sampai').val() <= now + {HARI30} || (data.exists() && newData.child('sampai').val() <= data.child('sampai').val() + {HARI30}))",
  ".validate": "newData.child('sampai').isNumber() && (!newData.child('tingkat').exists() || newData.child('tingkat').val().matches(/^(vip|vvip)$/))"}}
r["pesanan"] = {**D(), "$id": {".read": f"{A} && data.child('uid').val() === auth.uid",
  ".write": f"{A} && !data.exists() && newData.child('uid').val() === auth.uid && {BEBAS}",
  ".validate": f"{DIR} || (newData.child('paket').isString() && newData.child('paket').val().length <= 20 && newData.child('jenis').val().matches(/^(diamond|paket|donasi)$/) && newData.child('metode').val().matches(/^(qris|bca|bri|lain)$/) && newData.child('nominal').isNumber() && newData.child('nominal').val() >= 1000 && newData.child('nominal').val() <= 10000000 && newData.child('n').isString() && newData.child('n').val().length <= 30 && newData.child('t').val() === now)"}}
# DIAMOND: saldo hanya bisa ditambah Direktur; pemilik hanya bisa mengurangi (saat membeli barang)
# hadiah streak: +20 Diamond hanya bila di transaksi yang sama streak naik ke kelipatan 7
ST_BARU = "newData.parent().parent().child('streak/' + $uid)"
HADIAH_STREAK = f"({ST_BARU}.child('t').val() === now && {ST_BARU}.child('n').val() % 7 === 0 && ((!data.exists() && newData.val() === 20) || (data.exists() && newData.val() === data.val() + 20)))"
r["diamond"] = {".read": f"{A} && {DIR}", ".write": f"{A} && {DIR}", "$uid": {".read": f"{A} && auth.uid === $uid",
  ".write": f"{A} && auth.uid === $uid && {BEBAS} && newData.isNumber() && newData.val() >= 0 && (newData.val() < data.val() || {HADIAH_STREAK})",
  ".validate": "newData.isNumber() && newData.val() >= 0"}}
# MILIK: barang hanya tercatat jika di transaksi yang sama diamond terpotong persis sebesar harga katalog
r["milik"] = {".read": True, ".write": f"{A} && {DIR}", "$uid": {"$item": {
  ".write": f"{A} && auth.uid === $uid && !data.exists() && {BEBAS} && ((root.child('katalog/' + $item + '/harga').exists() && newData.parent().parent().parent().child('diamond/' + $uid).val() === root.child('diamond/' + $uid).val() - root.child('katalog/' + $item + '/harga').val()) || ($item.beginsWith('gc') && newData.parent().parent().parent().child('amplop/' + $uid + '/t').val() === now))",
  ".validate": "newData.val() === true"}}}
r["katalog"] = {".read": True, ".write": f"{A} && {DIR}", "$item": {".validate": "newData.child('harga').isNumber() && newData.child('harga').val() > 0"}}
r["donatur"] = {".read": True, ".write": f"{A} && {DIR}"}
r["riwayat"] = D()
r["notif"] = {".read": f"{A} && {DIR}", "$uid": {".read": f"{A} && auth.uid === $uid", "$id": {
  ".write": f"{A} && ((newData.exists() && {STAF}) || (!newData.exists() && (auth.uid === $uid || {DIR})))",
  ".validate": "newData.child('m').isString() && newData.child('m').val().length <= 200"}}}
r["acara"] = {".read": True, ".write": f"{A} && {DIR}", "$id": {
  ".validate": "newData.child('judul').isString() && newData.child('judul').val().length <= 60 && newData.child('mulai').isNumber() && newData.child('durasi').isNumber() && newData.child('durasi').val() >= 5 && newData.child('durasi').val() <= 600 && newData.child('exp').isNumber() && newData.child('exp').val() >= 0 && newData.child('exp').val() <= 200"}}
r["ikutAcara"] = {".read": True, ".write": f"{A} && {DIR}", "$id": {"$uid": {".write": f"{A} && auth.uid === $uid && root.child('acara/' + $id).exists() && {BEBAS}", ".validate": "newData.val() === true"}}}
r["hadirAcara"] = {".read": True, ".write": f"{A} && {DIR}", "$id": {"$uid": {".write": f"{A} && auth.uid === $uid && !data.exists() && {BEBAS} && now >= root.child('acara/' + $id + '/mulai').val() && now <= root.child('acara/' + $id + '/mulai').val() + root.child('acara/' + $id + '/durasi').val() * 60000", ".validate": "newData.val() === now"}}}
r["skor"] = {".read": True, ".write": f"{A} && {DIR}", "$hari": {"$uid": {".write": f"{A} && auth.uid === $uid && {BEBAS}",
  ".validate": "newData.child('s').isNumber() && newData.child('s').val() >= 0 && newData.child('s').val() <= 300 && newData.child('n').isString() && newData.child('n').val().length <= 20 && newData.child('t').val() === now && (!data.exists() || newData.child('s').val() > data.child('s').val())"}}}
json.dump({"rules": r}, open(sys.argv[1], 'w'), indent=2, ensure_ascii=False)
print(len(r), 'node')
