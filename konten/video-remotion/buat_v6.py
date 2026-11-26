# Penyusun timeline video #6: sekarang Lv.7+ / VIP / VVIP bisa bikin GRUP (kayak grup WA). Narasi gaya Gen Z (gue/lu).
# Data fitur dari kantor/grup.js: Lv.7 = 2 grup × 10 anggota, VIP = 5 × 30, VVIP = 10 × 100; yang belum Lv.7 tetap bisa diundang.
# Durasi tiap bagian bisa dipas ke voice-over lewat file JSON berisi 9 angka (detik):
#   python3 buat_v6.py [durasi.json]
import json, sys

FPS = 30
# 0 hook POV grup membosankan, 1 twist fitur baru, 2 syarat, 3 bikin grup, 4 undang, 5 chat + stiker, 6 batas per tingkat,
# 7 belum Lv.7, 8 penutup
DURASI = [3.8, 4.6, 3.4, 5.4, 3.8, 5.0, 6.8, 4.4, 5.2]
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

def klip(src, b, a, z, panjang, trim=0.0, **k):
    dur = DURASI[b] * (z - a)
    g('video', src, b, a, z, trim=trim, kecepatan=round(max(0.5, min(2.5, panjang / dur)), 3), **k)

def label(teks, b, a=0.02, z=1, y=1690):
    t('chips', teks, b, a, z, nyala='0', y=y, masuk='pop')
    sfx('Pop ' + teks, 'pop', waktu(b, a, z)[0], 15, 0.3)

ATAS, BAWAH = 130, 1330

# 0 hook: POV grup chat lu isinya grup keluarga & kerja kelompok
GRUP = ['Keluarga Besar 🙏|Om Budi: Selamat pagi, semoga berkah…|2j', 'Kerja Kelompok PKN|siapa yang ngerjain bab 3??|5j',
        'Alumni SD 2010|📎 undangan_nikahan.pdf|1h', 'Grup RT 05|Iuran kebersihan bulan ini…|3h']
e('kotakdm', 0, 0, 1, dict(akun='Chat', pesan='\n'.join(GRUP), jeda=round(DURASI[0] * 0.5 / len(GRUP), 2), sensor=False), nama='Daftar grup membosankan')
t('sub', 'POV: grup chat lu isinya cuma', 0, 0, 0.5, y=BAWAH + 120)
t('sub', '*grup keluarga* sama *kerja kelompok…* 🫠', 0, 0.5, 1, y=BAWAH + 120)
for i in range(len(GRUP)):
    sfx(f'Notif {i + 1}', 'notif', f(DURASI[0] * 0.5 / len(GRUP) * i), 15, 0.2)

# 1 twist: fitur baru
g('video', 'klip/drone.mp4', 1, 0, 1, gelap=0.4, kecepatan=0.8, nama='Kantor jodoh')
t('stiker', 'NEW FEATURE 🔥', 1, 0.02, 1, warna='#ff4f7b', y=360)
t('sub', 'Sekarang lu bisa bikin *grup sendiri!*', 1, 0, 0.45, y=BAWAH)
t('sub', 'Kayak grup WA, tapi isinya *satu frekuensi* 🤝', 1, 0.45, 1, y=BAWAH)
sfx('Whoosh', 'whoosh', det(1, 0) - 3, 18, 0.3); sfx('Pop stiker', 'pop', det(1, 0.08), 15, 0.35)

# 2 syarat
g('video', 'klip/r_lounge.mp4', 2, 0, 1, gelap=0.35, kecepatan=round(1.5 / DURASI[2], 3), nama='Lounge VIP (redup)')
t('chips', '⭐ LV.7+|💎 VIP|👑 VVIP', 2, 0.05, 1, nyala='0,1,2', y=560, masuk='pop')
t('sub', 'Syaratnya: udah *Level 7,*', 2, 0, 0.5, y=BAWAH)
t('sub', 'atau lu *VIP / VVIP* 💅', 2, 0.5, 1, y=BAWAH)
sfx('Level up', 'levelup', det(2, 0.1), 33, 0.3)

# 3 bikin grup
klip('klip/gbuat.mp4', 3, 0, 1, 5.4, trim=0.4, nama='Bikin grup')
label('＋ BIKIN GRUP', 3)
t('sub', 'Tinggal bikin, kasih nama *sesuka lu.*', 3, 0, 0.45, y=ATAS)
t('sub', '*"Pejuang Jomblo"*, bebas, *no debat!*', 3, 0.45, 1, y=ATAS)
sfx('Ketik nama', 'ketik', det(3, 0.8), 40, 0.8)

# 4 undang
klip('klip/gundang.mp4', 4, 0, 1, 4.0, trim=0.4, nama='Terima undangan')
label('📨 UNDANG BESTIE', 4)
t('sub', 'Undang *bestie* lu, tinggal klik *gabung.*', 4, 0, 1, y=ATAS)
sfx('Ketuk gabung', 'ketuk', det(4, DURASI[4] * 0.45), 12, 0.45)

# 5 chat + stiker
klip('klip/gchat.mp4', 5, 0, 1, 6.2, trim=0.2, nama='Chat grup + stiker')
label('😂 STIKER KARAKTER', 5)
t('sub', 'Chat-an *rame-rame,*', 5, 0, 0.4, y=ATAS)
t('sub', 'spam *stiker* yang lucunya kebangetan!', 5, 0.4, 1, y=ATAS)
for k in (0.15, 0.3, 0.45):
    sfx('Pop chat', 'pop', det(5, DURASI[5] * k), 15, 0.3)

# 6 batas per tingkat
g('video', 'klip/drone.mp4', 6, 0, 1, gelap=0.5, kecepatan=0.6, trim=1.0, nama='Kantor (redup)')
for i, (teks, a) in enumerate([('⭐ LV.7 · 2 GRUP · 10 ORANG', 0.0), ('💎 VIP · 5 GRUP · 30 ORANG', 0.3), ('👑 VVIP · 10 GRUP · 100 ORANG', 0.58)]):
    t('chips', teks, 6, a + 0.02, 1, nyala='0', y=420 + i * 170, masuk='pop', ukuran=44)
    sfx(f'Pop batas {i + 1}', 'pop', waktu(6, a + 0.02, 1)[0], 15, 0.35)
t('sub', 'Level 7: *2 grup,* 10 orang.', 6, 0, 0.3, y=BAWAH)
t('sub', 'VIP: *5 grup,* 30 orang.', 6, 0.3, 0.58, y=BAWAH)
t('sub', 'VVIP? Sampe *100 orang!* Gila sih 🤯', 6, 0.58, 1, y=BAWAH)
sfx('Wow', 'levelup', waktu(6, 0.6, 1)[0], 33, 0.3)

# 7 belum Lv.7
g('foto', 'foto/tugas.png', 7, 0, 0.55, zoom=1.06, nama='Tugas harian')
g('foto', 'foto/levelup.png', 7, 0.55, 1, zoom=1.06, nama='Naik level')
t('sub', 'Belum Level 7? *Santai…*', 7, 0, 0.4, y=ATAS)
t('sub', 'tetep bisa *diundang,* sambil *grinding EXP!*', 7, 0.4, 1, y=ATAS)

# 8 penutup: tag bestie + komen nama grup paling absurd
D8 = DURASI[8]
g('video', 'klip/drone.mp4', 8, 0, 1, gelap=0.45, kecepatan=0.6, trim=0.5, nama='Latar penutup')
e('komentar', 8, 0, 1, dict(komentar='penonton1|grup "Korban PHP" 😭|1m|20\npenonton2|"Bangun Tidur Langsung Galau"|2m|11\npenonton3|@temen yuk bikin "Geng Rebahan"|3m|7\npenonton4|"Sobat Ambyar Garis Keras" 😆|4m|4', ketik='@bestie grup kita namanya apa? 😭', ketikDetik=round(D8 * 0.08, 2), akunSaya='lu', sensor=True), masuk='geser-atas', nama='Komentar: tag bestie')
t('stiker', 'TAG BESTIE LU 👇', 8, 0.02, 0.5, warna='#ff4f7b', y=240)
t('sub', 'Jadi… *circle lu* siapa aja nih?', 8, 0, 0.5, y=470)
t('stiker', 'KOMEN YUK 💬', 8, 0.5, 1, warna='#ffd23f', y=240)
t('sub', 'Komen *nama grup paling absurd!*', 8, 0.5, 1, y=470)
sfx('Geser komentar', 'geser', det(8, 0), 18, 0.8)
kirim = D8 * 0.08 + len('@bestie grup kita namanya apa? 😭') / 9
sfx('Ketik tag', 'ketik', det(8, D8 * 0.08), 40, 1.0); sfx('Ketuk kirim', 'ketuk', det(8, kirim + 0.2), 12, 0.45); sfx('Pop terkirim', 'pop', det(8, kirim + 0.35), 15, 0.3)
sfx('Pop stiker 2', 'pop', waktu(8, 0.5, 1)[0], 15, 0.35)

t('akun', '@jodohonline.company', 1, 0, 1, masuk='none', y=150, x=130)
L[-1]['durasi'] = f(AWAL[3]) - L[-1]['mulai']

total = f(sum(DURASI))
vo = dict(src='vo6.mp3', volume=1) if len(sys.argv) > 1 else None
T = dict(versi=1, fps=FPS, lebar=1080, tinggi=1920, durasi=total, vo=vo, lapis=L, sfx=S)
json.dump(T, open('src/data/timeline-v6.json', 'w'), ensure_ascii=False, indent=1)
print(len(L), 'lapis', len(S), 'sfx', round(sum(DURASI), 2), 'detik')
