# Penyusun timeline video #4 (versi 2, dirombak): belum sehari hampir 150 join → fitur-fitur BARU
# (speed dating, menfess, kecocokan, truth or dare, kerupuk, Amplop Cinta, Ruang Direktur, Taman Cinta).
# Data asli per 26 Nov 2026 14.45 WIB (Firebase /anggota): 149 tamu (105 jodoh, 35 teman, 9 curhat).
# Durasi tiap bagian bisa dipas ke voice-over lewat file JSON berisi 12 angka (detik):
#   python3 buat_v4.py [durasi.json]
import json, sys

FPS = 30
ANGGOTA = 149
# 0 hook angka, 1 antre ACC, 2 "ngapain aja?", 3 speed dating, 4 menfess, 5 kecocokan, 6 truth or dare + kerupuk,
# 7 Amplop Cinta, 8 Ruang Direktur, 9 Taman Cinta, 10 masih banyak lagi, 11 penutup
DURASI = [3.6, 2.6, 2.6, 6.0, 3.6, 3.0, 4.4, 3.6, 3.0, 4.6, 2.8, 4.8]
if len(sys.argv) > 1:
    DURASI = json.load(open(sys.argv[1]))
assert len(DURASI) == 12
AWAL = [sum(DURASI[:i]) for i in range(len(DURASI))]
f = lambda s: int(round(s * FPS))
L, S = [], []
n = [0]

def nid(p):
    n[0] += 1
    return f'{p}{n[0]}'

def waktu(b, a, z):
    m = f(AWAL[b] + DURASI[b] * a)
    return m, max(1, f(AWAL[b] + DURASI[b] * z) - m)

def det(b, d):
    return f(AWAL[b] + d)

def g(jenis, src, b, a, z, **k):
    m, d = waktu(b, a, z); L.append(dict(id=nid('g'), track='gambar', jenis=jenis, src=src, mulai=m, durasi=d, **k))

def e(jenis, b, a, z, props, **k):
    m, d = waktu(b, a, z); L.append(dict(id=nid('e'), track='elemen', jenis=jenis, mulai=m, durasi=d, props=props, **k))

def t(jenis, teks, b, a, z, **k):
    m, d = waktu(b, a, z); L.append(dict(id=nid('t'), track='teks', jenis=jenis, teks=teks, mulai=m, durasi=d, **k))

def sfx(nama, src, frame, dur, vol):
    S.append(dict(id=f's{len(S) + 1}', nama=nama, src=f'sfx/{src}.mp3', mulai=max(0, frame), durasi=dur, volume=vol))

def klip(src, b, a, z, panjang, trim=0.0, **k):
    """klip rekaman `panjang` detik (mulai `trim`) dipadatkan/diregangkan ke bagian b (a..z)"""
    dur = DURASI[b] * (z - a)
    g('video', src, b, a, z, trim=trim, kecepatan=round(max(0.5, min(2.5, panjang / dur)), 3), **k)

def chip(teks, b, a=0.02, z=1):
    t('chips', teks, b, a, z, nyala='0', y=290, masuk='pop')
    sfx('Pop ' + teks, 'pop', waktu(b, a, z)[0], 15, 0.3)

SUB = 1480  # di bawah kartu aplikasi, masih di area aman Reels

# 0 hook: angka berhitung
g('video', 'klip/drone.mp4', 0, 0, 1, gelap=0.45, kecepatan=0.9, nama='Drone kantor (redup)')
e('hitung', 0, 0, 1, dict(dari=0, ke=ANGGOTA, detik=round(DURASI[0] * 0.75, 2), atas='belum SEHARI 😳', label='orang join 💘', y=420), nama='Angka anggota')
t('sub', 'Gila… belum *sehari,*', 0, 0, 0.45, y=1330)
t('sub', 'yang join udah *hampir 150!*', 0, 0.45, 1, y=1330)
for i in range(8):
    sfx(f'Tik hitung {i + 1}', 'pop', f(0.15 + i * DURASI[0] * 0.75 / 8), 8, 0.18)
sfx('Ding angka', 'levelup', f(0.15 + DURASI[0] * 0.75), 33, 0.3)

# 1 antre ACC
g('video', 'klip/drone.mp4', 1, 0, 1, gelap=0.35, kecepatan=0.7, trim=1.5, nama='Kantor (antre ACC)')
t('cap', 'ANTRE ACC ⏳', 1, 0.05, 1, warna='#ff4f7b', y=620, x=150, miring=-7)
t('sub', 'Dan masih *banyak yang antre* di-ACC Direktur!', 1, 0, 1, y=1330)
sfx('Cap antre', 'cap', waktu(1, 0.05, 1)[0], 18, 0.4)

# 2 pertanyaan
g('foto', 'foto/meja.png', 2, 0, 1, zoom=1.1, nama='Kantor dari atas')
t('judul', 'Emang di dalem', 2, 0.02, 1, kecil='ngapain aja? 🤔', y=520)
t('sub', 'Nih, yang *baru-baru!* 👇', 2, 0.45, 1, y=1330)
sfx('Whoosh judul', 'whoosh', det(2, 0) - 3, 18, 0.3)

# 3 speed dating
klip('klip/sd.mp4', 3, 0, 1, 7.3, trim=0.2, nama='Speed dating')
chip('💘 SPEED DATING', 3)
t('sub', 'Ikut *speed dating:* dipasangin acak,', 3, 0, 0.4, y=SUB)
t('sub', 'ngobrol *3 menit,*', 3, 0.4, 0.7, y=SUB)
t('sub', 'terus pilih… *lanjut* atau *skip?*', 3, 0.7, 1, y=SUB)
sfx('Timer habis', 'notif', det(3, DURASI[3] * 0.78), 30, 0.25)

# 4 menfess
klip('klip/menfess.mp4', 4, 0, 1, 5.6, trim=0.3, nama='Menfess')
chip('📮 MENFESS', 4)
t('sub', 'Naksir tapi malu? Kirim *menfess,* tanpa nama 🤫', 4, 0, 1, y=SUB)
sfx('Ketik menfess', 'ketik', det(4, DURASI[4] * 0.35), 40, 0.8)

# 5 kecocokan
g('foto', 'foto/cocok.png', 5, 0, 1, zoom=1.18, nama='Kecocokan zodiak & MBTI')
chip('🔮 CEK KECOCOKAN', 5)
t('sub', 'Cek kecocokan, dari *zodiak* sampai *MBTI!*', 5, 0, 1, y=SUB)

# 6 truth or dare + kerupuk
klip('klip/tod.mp4', 6, 0, 0.5, 2.6, trim=0.9, nama='Truth or dare')
klip('klip/kerupuk.mp4', 6, 0.5, 1, 3.6, trim=0.6, nama='Lomba kerupuk')
chip('🍾 TRUTH OR DARE', 6, 0.02, 0.5)
chip('🍘 LOMBA KERUPUK', 6, 0.5, 1)
t('sub', 'Main *truth or dare* bareng,', 6, 0, 0.5, y=SUB)
t('sub', 'sampai *lomba makan kerupuk!*', 6, 0.5, 1, y=SUB)

# 7 Amplop Cinta
klip('klip/amplop.mp4', 7, 0, 1, 4.2, trim=0.3, nama='Amplop Cinta')
chip('🎁 AMPLOP CINTA', 7)
t('sub', 'Buka *Amplop Cinta,*', 7, 0, 0.45, y=SUB)
t('sub', 'siapa tau dapet *hadiah langka!* ✨', 7, 0.45, 1, y=SUB)
sfx('Hadiah', 'levelup', det(7, DURASI[7] * 0.5), 33, 0.3)

# 8 Ruang Direktur
klip('klip/ketuk.mp4', 8, 0, 1, 3.6, trim=0.4, nama='Ketuk pintu Direktur')
chip('🚪 RUANG DIREKTUR', 8)
t('sub', 'Berani *ketuk pintu* ruang Direktur? 👀', 8, 0, 1, y=SUB)
sfx('Tok tok', 'ketuk', det(8, DURASI[8] * 0.7), 12, 0.5); sfx('Tok tok 2', 'ketuk', det(8, DURASI[8] * 0.7 + 0.18), 12, 0.5)

# 9 Taman Cinta (teaser)
g('video', 'klip/taman.mp4', 9, 0, 1, kecepatan=round(4.4 / DURASI[9], 3), nama='Taman Cinta (proyek)')
t('stiker', 'SEGERA BUKA 🎡', 9, 0.02, 1, warna='#ff4f7b', y=300)
t('sub', 'Dan bentar lagi… *Taman Cinta* buka!', 9, 0, 0.5, y=1330)
t('sub', 'Ada *bianglala, bioskop,* sampai *boba!*', 9, 0.5, 1, y=1330)
sfx('Whoosh taman', 'whoosh', det(9, 0) - 3, 18, 0.3)

# 10 masih banyak lagi: potongan cepat
POT = [('foto', 'foto/kamar.png'), ('foto', 'foto/kuis.png'), ('video', 'klip/r_lounge.mp4'), ('foto', 'foto/season.png')]
for i, (j, src) in enumerate(POT):
    a, z = i / len(POT), (i + 1) / len(POT)
    if j == 'foto':
        g('foto', src, 10, a, z, zoom=1.12, nama='Cepat ' + src)
    else:
        g('video', src, 10, a, z, nama='Cepat ' + src)
    sfx(f'Whip {i + 1}', 'whoosh', waktu(10, a, z)[0] - 1, 10, 0.18)
t('judul', 'Itu baru', 10, 0.02, 1, kecil='SEBAGIAN! 🤯', y=560)
t('sub', 'masih *banyak lagi!*', 10, 0.3, 1, y=1330)

# 11 penutup: tag temen jomblo + komen mau dibahas apa
D8 = DURASI[11]
g('video', 'klip/drone.mp4', 11, 0, 1, gelap=0.45, kecepatan=0.6, trim=0.5, nama='Latar penutup')
e('komentar', 11, 0, 1, dict(komentar='penonton1|@temen ini jomblo dari lahir 😭|1m|12\npenonton2|@bestie udah 5 taun sendiri, gas|2m|8\npenonton3|bahas speed dating dong min!|3m|5\npenonton4|@sepupu nih biar ga galau mulu|4m|3', ketik='@temenku_jomblo sini 😭', ketikDetik=round(D8 * 0.08, 2), akunSaya='kamu', sensor=True), masuk='geser-atas', nama='Komentar: tag temen')
t('stiker', 'JOMBLO ALERT 🚨', 11, 0.02, 0.53, warna='#ff4f7b', y=240)
t('sub', '*Tag temen* kalian yang', 11, 0, 0.25, y=470)
t('sub', 'udah *kelamaan jomblo!* 😭', 11, 0.25, 0.53, y=470)
t('stiker', 'KOMEN YUK 👇', 11, 0.53, 1, warna='#ffd23f', y=240)
t('sub', 'Terus komen, mau kita', 11, 0.53, 0.8, y=470)
t('sub', 'bahas *apa lagi?*', 11, 0.8, 1, y=470)
sfx('Geser komentar', 'geser', det(11, 0), 18, 0.8); sfx('Pop stiker', 'pop', det(11, 0.1), 15, 0.35)
kirim = D8 * 0.08 + len('@temenku_jomblo sini 😭') / 9
sfx('Ketik tag', 'ketik', det(11, D8 * 0.08), 40, 1.0); sfx('Ketuk kirim', 'ketuk', det(11, kirim + 0.2), 12, 0.45); sfx('Pop terkirim', 'pop', det(11, kirim + 0.35), 15, 0.3)
sfx('Pop stiker 2', 'pop', waktu(11, 0.53, 1)[0], 15, 0.35)

t('akun', '@jodohonline.id', 0, 0, 1, masuk='none', y=150, x=130)
L[-1]['durasi'] = f(AWAL[3]) - L[-1]['mulai']  # label akun hanya di bagian pembuka (bagian aplikasi sudah ramai)

total = f(sum(DURASI))
vo = dict(src='vo4.mp3', volume=1) if len(sys.argv) > 1 else None
T = dict(versi=1, fps=FPS, lebar=1080, tinggi=1920, durasi=total, vo=vo, lapis=L, sfx=S)
json.dump(T, open('src/data/timeline-v4.json', 'w'), ensure_ascii=False, indent=1)
print(len(L), 'lapis', len(S), 'sfx', round(sum(DURASI), 2), 'detik')
