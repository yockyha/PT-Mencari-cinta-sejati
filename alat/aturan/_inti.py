# =====================================================================
#  ATURAN FIREBASE: INTI ("main" / layout, ibarat @extends di Laravel)
#  Berisi potongan aturan yang dipakai bersama semua fitur:
#  siapa yang login, Direktur/staf, tamu resmi, VIP/VVIP, dll.
#  Jarang perlu diubah. Fitur baru cukup menambah file di folder ini
#  (lihat README.md di folder yang sama), tidak menyentuh file ini.
# =====================================================================
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
# MEJA NONGKRONG: obrolan, papan kegiatan & voting "Pilih Mana" per meja topik
MEJA_ID = "$meja.matches(/^(gaming|musik|drakor|olahraga|kuliner|buku|jalan|random|kafe|lounge)$/)"
TXT = lambda k, n: f"newData.child('{k}').isString() && newData.child('{k}').val().length <= {n}"
# level 7 = 800 EXP (EXP tugas + EXP dibeli)
EXP_T = "root.child('exp/' + auth.uid + '/n')"
EXP_B = "root.child('expBeli/' + auth.uid)"
LV7 = f"(({EXP_T}.exists() && {EXP_T}.val() >= 800) || ({EXP_B}.exists() && {EXP_B}.val() >= 800) || ({EXP_T}.exists() && {EXP_B}.exists() && {EXP_T}.val() + {EXP_B}.val() >= 800))"
# GRUP OBROLAN (membuat grup: VIP/VVIP, level 7+, atau Direktur): hanya anggota (dan Direktur) yang bisa membaca & menulis; bergabung harus lewat undangan
ANG = "root.child('grup/' + $gid + '/anggota/' + auth.uid).exists()"
PEM = "root.child('grup/' + $gid + '/pemilik').val() === auth.uid"
# FOTO PROFIL & DINDING FOTO (gambar JPEG base64 di database; ukuran dibatasi)
JPEG = "newData.child('d').val().beginsWith('data:image/jpeg;base64,')"
UNGGAH_OK = "(!root.child('galeriKu/' + auth.uid).exists() || root.child('galeriKu/' + auth.uid).val() < now - 60000) && newData.parent().parent().child('galeriKu/' + auth.uid).val() === now"
# AMPLOP CINTA: gratis tiap 20 jam (tg), selain itu Diamond terpotong 30 di transaksi yang sama
DM_B = "newData.parent().parent().child('diamond/' + $uid).val()"
DM_L = "root.child('diamond/' + $uid).val()"
# MENFESS: pesan anonim; pengirim hanya diketahui Direktur (menfessPengirim), 1 menfess / 10 menit
MF_OK = "(!root.child('menfessT/' + auth.uid).exists() || root.child('menfessT/' + auth.uid).val() < now - 600000) && newData.parent().parent().child('menfessT/' + auth.uid).val() === now && newData.parent().parent().child('menfessPengirim/' + $id).val() === auth.uid"
PENGIRIM = "root.child('menfessPengirim/' + $id).val() === auth.uid"
SD_PAS = f"root.child('speedDating/ronde/pasangan/' + auth.uid).val() === {LAIN}"
# TELEPON (WebRTC): pasangan yang saling match atau obrolan pribadi yang sudah diterima kedua pihak. sinyal = offer/answer/ICE, telepon/<penerima> = panggilan masuk
MATCH_LAIN = f"root.child('match/' + auth.uid + '/' + {LAIN}).exists()"
DM_OK = "root.child('dm/' + $room + '/ok').val() === true"
# VIP/VVIP: Direktur bebas; tamu boleh membeli sendiri bila di transaksi yang sama Diamond-nya terpotong persis sesuai harga (300 VIP / 650 VVIP), maksimal +30 hari
DM_BARU = "newData.parent().parent().child('diamond/' + $uid).val()"
DM_LAMA = "root.child('diamond/' + $uid).val()"
HARI30 = "2592060000"
# DIAMOND: saldo hanya bisa ditambah Direktur; pemilik hanya bisa mengurangi (saat membeli barang)
# hadiah streak: +20 Diamond hanya bila di transaksi yang sama streak naik ke kelipatan 7
ST_BARU = "newData.parent().parent().child('streak/' + $uid)"
HADIAH_STREAK = f"({ST_BARU}.child('t').val() === now && {ST_BARU}.child('n').val() % 7 === 0 && ((!data.exists() && newData.val() === 20) || (data.exists() && newData.val() === data.val() + 20)))"
