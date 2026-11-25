# Penyusun timeline video #2 (cara daftar). Waktu tiap bagian bisa diganti (mis. dipas ke voice-over)
# lewat file JSON berisi daftar durasi bagian dalam detik: python3 buat_v2.py [durasi.json]
import json, sys

FPS = 30
DURASI = [6.5, 3.2, 3.2, 5.0, 9.0, 3.0, 6.0, 6.0, 4.5]  # intro, langkah 1-4, kirim, tunggu ACC, diterima, penutup
if len(sys.argv) > 1:
    DURASI = json.load(open(sys.argv[1]))
AWAL = [sum(DURASI[:i]) for i in range(len(DURASI))]
f = lambda s: int(round(s * FPS))
L, S = [], []
n = [0]

def nid(p):
    n[0] += 1
    return f'{p}{n[0]}'

def waktu(b, a, z):
    """bagian b, pecahan a..z (0-1) -> (mulai, durasi) frame"""
    m = f(AWAL[b] + DURASI[b] * a)
    return m, max(1, f(AWAL[b] + DURASI[b] * z) - m)

def det(b, d):  # bagian b, detik ke-d dari awal bagian -> frame absolut
    return f(AWAL[b] + d)

def g(jenis, src, b, a, z, **k):
    m, d = waktu(b, a, z); L.append(dict(id=nid('g'), track='gambar', jenis=jenis, src=src, mulai=m, durasi=d, **k))

def e(jenis, b, a, z, props, **k):
    m, d = waktu(b, a, z); L.append(dict(id=nid('e'), track='elemen', jenis=jenis, mulai=m, durasi=d, props=props, **k))

def t(jenis, teks, b, a, z, **k):
    m, d = waktu(b, a, z); L.append(dict(id=nid('t'), track='teks', jenis=jenis, teks=teks, mulai=m, durasi=d, **k))

def sfx(nama, src, frame, dur, vol):
    S.append(dict(id=f's{len(S) + 1}', nama=nama, src=f'sfx/{src}.mp3', mulai=max(0, frame), durasi=dur, volume=vol))

ATAS, BAWAH = 330, 1330
bio = 'Kantor virtual buat cari jodoh, cari teman & curhat\nDaftar → di-ACC Direktur 👑'
prof = dict(akun='jodohonline.company', nama='PT Mencari Cinta Sejati 💘', bio=bio, tautan='jodohonline.company/daftar', postingan='2', pengikut=0, mengikuti='0', sensor=True)
TANYA = ['cara daftarnya gimana kak? 🙏', 'linknya mana min??', 'harus bayar gak sih? 😅', 'aku mau join tapi bingung 😭', 'ACC-nya lama gak?']

# 0 intro: komentar penonton
g('video', 'klip/drone.mp4', 0, 0, 1, gelap=0.35, kecepatan=0.8, nama='Drone kantor (redup)')
e('tanya', 0, 0, 0.64, dict(komentar='\n'.join(f'penonton{i + 1}|{x}' for i, x in enumerate(TANYA)), jeda=round(DURASI[0] * 0.6 / 5.6, 2), sensor=True), masuk='none', keluar='fade', nama='Komentar penonton')
t('judul', 'Cara daftar', 0, 0.64, 1, kecil='cuma 4 langkah', y=520)
t('sub', 'Banyak yang nanya di komen…', 0, 0, 0.32, y=BAWAH + 80)
t('sub', '*cara daftarnya gimana sih?*', 0, 0.32, 0.64, y=BAWAH + 80)
t('sub', 'Oke, cuma *empat langkah!*', 0, 0.64, 1)
for i in range(5):
    sfx(f'Pop komentar {i + 1}', 'pop', f(DURASI[0] * 0.6 / 5.6 * i), 15, 0.3)
sfx('Whoosh judul', 'whoosh', waktu(0, 0.64, 1)[0] - 3, 18, 0.3)

# 1 follow
e('profil', 1, 0, 1, dict(prof, ketukDetik=round(DURASI[1] * 0.45, 2)), masuk='geser-atas', nama='Profil IG: Ikuti')
t('chips', 'LANGKAH 1 · FOLLOW', 1, 0.05, 1, nyala='0', y=1190, masuk='pop')
t('sub', '*Satu.* Follow @jodohonline.company', 1, 0, 1, y=BAWAH)
sfx('Geser profil', 'geser', det(1, 0), 18, 0.8); sfx('Ketuk Ikuti', 'ketuk', det(1, DURASI[1] * 0.45) - 2, 12, 0.45); sfx('Notif mengikuti', 'notif', det(1, DURASI[1] * 0.45) + 2, 22, 0.3)

# 2 komen DAFTAR
K2 = round(min(1.0, DURASI[2] * 0.34), 2)
g('video', 'klip/drone.mp4', 2, 0, 1, trim=2.5, kecepatan=0.6, gelap=0.45, nama='Reels di balik komentar')
e('komentar', 2, 0, 1, dict(komentar='penonton1|DAFTAR|1m|2\npenonton2|DAFTAR 🙋‍♀️|2m|4\npenonton3|daftar kak!|4m|1\npenonton4|DAFTAR|6m|0', ketik='DAFTAR', ketikDetik=K2, akunSaya='kamu', sensor=True), masuk='geser-atas', nama='Komentar IG: DAFTAR')
t('chips', 'LANGKAH 2 · KOMEN', 2, 0.05, 1, nyala='0', y=200, masuk='pop')
t('sub', '*Dua.* Komen *"DAFTAR"*', 2, 0, 1, y=400)
sfx('Geser komentar', 'geser', det(2, 0), 18, 0.8); sfx('Ketik DAFTAR', 'ketik', det(2, K2), 24, 1.0)
sfx('Ketuk kirim', 'ketuk', det(2, K2 + 6 / 9 + 0.2), 12, 0.45); sfx('Pop komentar masuk', 'pop', det(2, K2 + 6 / 9 + 0.35), 15, 0.3)

# 3 link di bio
ket3 = round(min(1.0, DURASI[3] * 0.2), 2)
e('profil', 3, 0, 0.38, dict(prof, ketukDetik=ket3, target='tautan', sudahIkut=True), masuk='none', nama='Profil IG: ketuk link')
e('browser', 3, 0.38, 1, dict(alamat='jodohonline.company/daftar', halaman='foto/formulir.png'), nama='Browser: formulir')
t('chips', 'LANGKAH 3 · LINK DI BIO', 3, 0.05, 1, nyala='0', y=1190, masuk='pop')
t('sub', '*Tiga.* Buka link di bio:', 3, 0, 0.4, y=BAWAH)
t('sub', 'jodohonline.company*/daftar*', 3, 0.4, 1, y=BAWAH)
sfx('Ketuk link', 'ketuk', det(3, ket3) - 2, 12, 0.45); sfx('Ketik alamat', 'ketik', waktu(3, 0.38, 1)[0] + 1, 30, 1.0)

# 4 isi formulir (rekaman asli, diperlambat)
g('foto', 'foto/formulir.png', 4, 0, 0.21, zoom=1.04, nama='Formulir kosong')
kA, kB = 0.4, 0.85
g('video', 'klip/formulir.mp4', 4, 0.21, 0.59, trim=0, kecepatan=kA, nama='Pilih tujuan')
g('video', 'klip/formulir.mp4', 4, 0.59, 1, trim=1.7, kecepatan=kB, nama='Isi nama, umur, kota, IG')
t('chips', 'LANGKAH 4 · ISI FORMULIR', 4, 0.03, 1, nyala='0', y=1190, masuk='pop')
t('sub', '*Empat.* Isi formulirnya.', 4, 0, 0.21, y=BAWAH)
t('sub', 'Pilih tujuan: *jodoh, teman,* atau *curhat*', 4, 0.21, 0.59, y=BAWAH)
t('sub', 'Isi nama, umur, kota & *username IG*', 4, 0.59, 1, y=BAWAH)
sfx('Ketuk tujuan', 'ketuk', det(4, DURASI[4] * 0.21 + 0.17 / kA), 12, 0.4)
sfx('Ketik nama', 'ketik', det(4, DURASI[4] * 0.21 + 0.47 / kA), 40, 1.0)
sfx('Ketik IG', 'ketik', det(4, DURASI[4] * 0.59 + (4.0 - 1.7) / kB), 40, 1.0)

# 5 centang & kirim
kec5 = round(3.6 / DURASI[5], 3)
g('video', 'klip/formulir.mp4', 5, 0, 1, trim=5.8, kecepatan=kec5, nama='Centang & kirim')
t('sub', 'Centang syaratnya, lalu *kirim!*', 5, 0, 1, y=BAWAH)
for nama, s in [('Centang 1', 7.33), ('Centang 2', 7.53), ('Kirim', 7.87)]:
    sfx(nama, 'ketuk', det(5, (s - 5.8) / kec5) - 1, 12, 0.45)
sfx('Notif terkirim', 'notif', det(5, (7.95 - 5.8) / kec5), 22, 0.3)

# 6 tunggu di-ACC Direktur (rekaman Dashboard)
kec6 = round(4.5 / DURASI[6], 3)
klik6 = 1.5 / kec6
g('video', 'klip/dash_acc.mp4', 6, 0, 1, kecepatan=kec6, nama='Dashboard: ACC')
t('cap', 'DI-ACC ✓', 6, (klik6 + 0.1) / DURASI[6], 1, warna='#1f9d55', y=760, x=160)
t('sub', 'Tinggal tunggu *di-ACC Direktur.*', 6, 0, 0.48, y=BAWAH)
t('sub', 'Direktur cek: *udah follow & komen?*', 6, 0.48, 1, y=BAWAH)
sfx('Klik Terima', 'ketuk', det(6, klik6) - 2, 12, 0.5); sfx('Cap DI-ACC', 'cap', det(6, klik6 + 0.1), 18, 0.45)

# 7 resmi jadi tamu
g('video', 'klip/diterima.mp4', 7, 0, 0.55, nama='Resmi jadi tamu')
g('video', 'klip/chat.mp4', 7, 0.55, 0.78, trim=1.4, nama='Ngobrol')
g('video', 'klip/game.mp4', 7, 0.78, 1, trim=2.7, nama='Main game')
t('sub', 'Kalau udah di-ACC… *selamat!*', 7, 0, 0.32)
t('sub', 'Kamu *resmi jadi tamu!*', 7, 0.32, 0.55)
t('sub', 'Bisa *ngobrol, main game,* sampai *cari jodoh*', 7, 0.55, 1)
sfx('Level up resmi', 'levelup', det(7, 1.6), 33, 0.3); sfx('Whoosh ngobrol', 'whoosh', waktu(7, 0.55, 1)[0] - 3, 18, 0.25); sfx('Whoosh game', 'whoosh', waktu(7, 0.78, 1)[0] - 3, 18, 0.22)

# 8 penutup
e('profil', 8, 0, 1, dict(prof, ketukDetik=round(DURASI[8] * 0.3, 2)), masuk='geser-atas', nama='Profil IG: penutup')
t('sub', 'Gampang kan?', 8, 0, 0.23, y=BAWAH)
t('sub', '*Follow,* komen *DAFTAR,* daftar *sekarang!*', 8, 0.23, 1, y=BAWAH)
sfx('Geser profil penutup', 'geser', det(8, 0), 18, 0.8); sfx('Ketuk Ikuti penutup', 'ketuk', det(8, DURASI[8] * 0.3) - 2, 12, 0.45); sfx('Notif penutup', 'notif', det(8, DURASI[8] * 0.3) + 2, 25, 0.3)
t('akun', '@jodohonline.company', 0, 0, 1, masuk='none', y=150, x=130)

total = f(sum(DURASI))
T = dict(versi=1, fps=FPS, lebar=1080, tinggi=1920, durasi=total, vo=dict(src='vo2.mp3', volume=1), lapis=L, sfx=S)
json.dump(T, open('src/data/timeline-v2.json', 'w'), ensure_ascii=False, indent=1)
print(len(L), 'lapis', len(S), 'sfx', round(sum(DURASI), 2), 'detik')
