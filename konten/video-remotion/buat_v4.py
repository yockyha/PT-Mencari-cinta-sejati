# Penyusun timeline video #4 (baru sehari udah 100+ join — sebenernya bisa ngapain aja?).
# Data asli per 26 Nov 2026 (Firebase /anggota): 119 tamu, 86 jodoh, 26 teman, 7 curhat.
# Durasi tiap bagian bisa dipas ke voice-over lewat file JSON berisi 9 angka (detik):
#   python3 buat_v4.py [durasi.json]
import json, sys

FPS = 30
ANGGOTA, JODOH, TEMAN, CURHAT = 119, 86, 26, 7
# 0 hook angka, 1 data & antre ACC, 2 "bisa ngapain sih?", 3 karakter & nongkrong, 4 suka & match,
# 5 chat/pesan suara/telepon, 6 game & level & outfit, 7 masih banyak lagi, 8 penutup (tag temen + komen)
DURASI = [3.2, 4.6, 2.2, 4.6, 4.4, 4.0, 4.0, 2.6, 6.8]
if len(sys.argv) > 1:
    DURASI = json.load(open(sys.argv[1]))
assert len(DURASI) == 9
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

BAWAH = 1330

# 0 hook: angka anggota berhitung naik di atas kantor
g('video', 'klip/drone.mp4', 0, 0, 1, gelap=0.45, kecepatan=0.9, nama='Drone kantor (redup)')
e('hitung', 0, 0, 1, dict(dari=0, ke=ANGGOTA, detik=round(DURASI[0] * 0.72, 2), atas='baru buka SEHARI 😳', label='orang join 💘', y=420), nama='Angka anggota')
t('sub', 'Gila… baru buka *sehari,*', 0, 0, 0.55, y=BAWAH + 40)
t('sub', 'yang join udah *100 lebih!*', 0, 0.55, 1, y=BAWAH + 40)
for i in range(8):
    sfx(f'Tik hitung {i + 1}', 'pop', f(0.15 + i * DURASI[0] * 0.72 / 8), 8, 0.18)
sfx('Ding angka', 'levelup', f(0.15 + DURASI[0] * 0.72), 33, 0.3)

# 1 data asli: tujuan + antre ACC
g('video', 'klip/jalan.mp4', 1, 0, 0.42, gelap=0.25, kecepatan=0.9, nama='Tamu jalan-jalan')
g('video', 'klip/drone.mp4', 1, 0.42, 1, gelap=0.35, kecepatan=0.7, trim=1.5, nama='Kantor (antre ACC)')
t('chips', f'💘 {JODOH} CARI JODOH|🤝 {TEMAN} CARI TEMAN|💬 {CURHAT} CURHAT', 1, 0.02, 0.42, nyala='0', y=400, masuk='pop')
t('cap', 'ANTRE ACC ⏳', 1, 0.52, 1, warna='#ff4f7b', y=520, x=150, miring=-7)
t('sub', f'*{JODOH} orang* lagi nyari jodoh,', 1, 0, 0.42, y=BAWAH)
t('sub', 'dan masih *banyak yang antre* di-ACC Direktur!', 1, 0.42, 1, y=BAWAH)
sfx('Whoosh data', 'whoosh', det(1, 0) - 3, 18, 0.25); sfx('Cap antre', 'cap', waktu(1, 0.52, 1)[0], 18, 0.4)

# 2 pertanyaan
g('foto', 'foto/meja.png', 2, 0, 1, zoom=1.1, nama='Kantor dari atas')
t('judul', 'Emang bisa', 2, 0.02, 1, kecil='ngapain aja sih? 🤔', y=520)
sfx('Whoosh judul', 'whoosh', det(2, 0) - 3, 18, 0.3)

# 3 karakter & nongkrong
g('video', 'klip/loker.mp4', 3, 0, 0.3, trim=0.6, nama='Ruang Loker')
for i, (r, a, z) in enumerate([('r_kafe', 0.3, 0.59), ('r_meja', 0.59, 0.78), ('r_taman', 0.78, 1)]):
    g('video', f'klip/{r}.mp4', 3, a, z, nama=r)
    sfx(f'Whoosh ruang {i + 1}', 'whoosh', waktu(3, a, z)[0] - 3, 18, 0.2)
t('sub', 'Bikin *karakter* sendiri,', 3, 0, 0.3, y=620)
t('sub', 'nongkrong di *kafe,*', 3, 0.3, 0.59, y=BAWAH)
t('sub', '*meja nongkrong,*', 3, 0.59, 0.78, y=BAWAH)
t('sub', 'atau *taman curhat.*', 3, 0.78, 1, y=BAWAH)

# 4 suka diam-diam → match
g('video', 'klip/chat.mp4', 4, 0, 0.75, trim=1.5, kecepatan=0.6, nama='Ketemu orang')
g('video', 'klip/match.mp4', 4, 0.75, 1, trim=0.1, kecepatan=round(1.3 / (DURASI[4] * 0.25), 3), nama='Popup match')
t('stiker', 'DIEM-DIEM SUKA 🙈', 4, 0.02, 0.52, warna='#ff4f7b', y=420)
t('sub', 'Diem-diem *suka?* Kasih *hati.*', 4, 0, 0.52, y=BAWAH)
t('sub', 'Dia suka balik… *MATCH!* 💘', 4, 0.52, 1, y=BAWAH + 120)
sfx('Pop stiker', 'pop', det(4, 0.1), 15, 0.3); sfx('Match', 'match', waktu(4, 0.75, 1)[0] + 2, 30, 0.4)

# 5 chat → pesan suara → telepon
g('video', 'klip/match.mp4', 5, 0, 0.7, trim=1.6, kecepatan=round(1.8 / (DURASI[5] * 0.7), 3), nama='Obrolan & pesan suara')
g('foto', 'foto/telepon.png', 5, 0.7, 1, zoom=1.06, nama='Telepon')
t('sub', 'Bisa *chat,* kirim *pesan suara,*', 5, 0, 0.7, y=1560)
t('sub', 'sampai *telponan!* 📞', 5, 0.7, 1, y=BAWAH)
sfx('Ketuk telepon', 'ketuk', det(5, DURASI[5] * 0.7) - 3, 12, 0.45); sfx('Dering', 'notif', det(5, DURASI[5] * 0.7 + 0.2), 25, 0.3)

# 6 game, level, outfit
g('video', 'klip/game.mp4', 6, 0, 0.3, trim=1.0, nama='Game Tangkap Hati')
g('foto', 'foto/levelup.png', 6, 0.3, 0.62, zoom=1.06, nama='Naik level')
g('video', 'klip/loker.mp4', 6, 0.62, 1, trim=2.8, nama='Outfit baru')
t('sub', 'Main *game,*', 6, 0, 0.3, y=BAWAH)
t('sub', '*naik level,*', 6, 0.3, 0.62, y=BAWAH)
t('sub', 'buka *outfit baru!*', 6, 0.62, 1, y=620)
sfx('Level up', 'levelup', waktu(6, 0.3, 0.62)[0], 33, 0.3)

# 7 masih banyak lagi: potongan cepat
POT = [('foto', 'foto/rapat.png'), ('video', 'klip/r_lounge.mp4'), ('foto', 'foto/toko.png'), ('foto', 'foto/airmancur.png'), ('video', 'klip/direktur.mp4')]
for i, (j, src) in enumerate(POT):
    a, z = i / len(POT), (i + 1) / len(POT)
    if j == 'foto':
        g('foto', src, 7, a, z, zoom=1.12, nama='Cepat ' + src)
    else:
        g('video', src, 7, a, z, nama='Cepat ' + src)
    sfx(f'Whip {i + 1}', 'whoosh', waktu(7, a, z)[0] - 1, 10, 0.18)
t('judul', 'Dan masih', 7, 0.02, 1, kecil='BANYAK LAGI! 🤯', y=560)

# 8 penutup: tag temen jomblo + komen mau dibahas apa
g('video', 'klip/drone.mp4', 8, 0, 1, gelap=0.45, kecepatan=0.6, trim=0.5, nama='Latar penutup')
e('komentar', 8, 0, 1, dict(komentar='penonton1|@temen ini jomblo dari lahir 😭|1m|12\npenonton2|@bestie udah 5 taun sendiri, gas daftar|2m|8\npenonton3|bahas Lounge VIP dong min!|3m|5\npenonton4|@sepupu nih biar ga galau mulu|4m|3', ketik='@temenku_jomblo sini 😭', ketikDetik=round(DURASI[8] * 0.1, 2), akunSaya='kamu', sensor=True), masuk='geser-atas', nama='Komentar: tag temen')
t('stiker', 'JOMBLO ALERT 🚨', 8, 0.02, 0.53, warna='#ff4f7b', y=240)
t('sub', '*Tag temen* kalian yang', 8, 0, 0.25, y=470)
t('sub', 'udah *kelamaan jomblo!* 😭', 8, 0.25, 0.53, y=470)
t('stiker', 'KOMEN YUK 👇', 8, 0.53, 1, warna='#ffd23f', y=240)
t('sub', 'Terus komen, mau kita', 8, 0.53, 0.8, y=470)
t('sub', 'bahas *apa lagi?*', 8, 0.8, 1, y=470)
sfx('Geser komentar', 'geser', det(8, 0), 18, 0.8); sfx('Sirene stiker', 'pop', det(8, 0.1), 15, 0.35)
kirim = DURASI[8] * 0.1 + len('@temenku_jomblo sini 😭') / 9
sfx('Ketik tag', 'ketik', det(8, DURASI[8] * 0.1), 40, 1.0); sfx('Ketuk kirim', 'ketuk', det(8, kirim + 0.2), 12, 0.45); sfx('Pop terkirim', 'pop', det(8, kirim + 0.35), 15, 0.3)
sfx('Pop stiker 2', 'pop', waktu(8, 0.53, 1)[0], 15, 0.35)

t('akun', '@jodohonline.id', 0, 0, 1, masuk='none', y=150, x=130)
L[-1]['durasi'] = f(AWAL[8]) - L[-1]['mulai']

total = f(sum(DURASI))
vo = dict(src='vo4.mp3', volume=1) if len(sys.argv) > 1 else None
T = dict(versi=1, fps=FPS, lebar=1080, tinggi=1920, durasi=total, vo=vo, lapis=L, sfx=S)
json.dump(T, open('src/data/timeline-v4.json', 'w'), ensure_ascii=False, indent=1)
print(len(L), 'lapis', len(S), 'sfx', round(sum(DURASI), 2), 'detik')
