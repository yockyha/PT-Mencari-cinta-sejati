# Penyusun timeline video #5: Date Night MALAM INI (Jumat 27 Nov 2026, 19.30–22.30 WIB).
# Jadwal & hadiah = data asli paket acara Direktur di Firebase /acara (6 sesi, total 230 EXP + Diamond Raja & Ratu).
# Durasi tiap bagian bisa dipas ke voice-over lewat file JSON berisi 11 angka (detik):
#   python3 buat_v5.py [durasi.json]
import json, sys

FPS = 30
# 0 hook, 1 kapan, 2 dandan kencan, 3 pembukaan, 4 speed dating, 5 truth or dare, 6 Taman Cinta,
# 7 Raja & Ratu, 8 total EXP, 9 template Story + tag, 10 penutup
DURASI = [3.6, 3.0, 5.6, 4.2, 4.6, 3.2, 6.0, 5.0, 3.4, 4.2, 4.8]
if len(sys.argv) > 1:
    DURASI = json.load(open(sys.argv[1]))
assert len(DURASI) == 11
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

def jam(teks, b, a=0.02, z=1, y=1690):
    t('chips', teks, b, a, z, nyala='0', y=y, masuk='pop')
    sfx('Pop ' + teks, 'pop', waktu(b, a, z)[0], 15, 0.3)

ATAS, BAWAH = 130, 1330

# 0 hook: Papan Informasi LED + stiker MALAM INI
klip('klip/papan.mp4', 0, 0, 1, 4.0, nama='Papan Informasi LED')
t('stiker', 'MALAM INI 💘', 0, 0.02, 1, warna='#ff4f7b', y=330)
t('sub', 'Malam ini ada acara *spesial*', 0, 0, 0.55, y=BAWAH)
t('sub', 'di kantor jodoh… *DATE NIGHT!*', 0, 0.55, 1, y=BAWAH)
sfx('Pop stiker', 'pop', det(0, 0.05), 15, 0.35); sfx('Whoosh', 'whoosh', det(0, DURASI[0] * 0.55) - 3, 18, 0.3)

# 1 kapan: jadwal acara di aplikasi
klip('klip/jadwal.mp4', 1, 0, 1, 3.6, trim=0.3, nama='Jadwal Date Night')
jam('🕢 JUMAT · 19.30 WIB', 1)
t('sub', 'Mulai jam *setengah delapan* malam!', 1, 0, 1, y=ATAS)

# 2 dandan kencan
g('foto', 'foto/karakter.png', 2, 0, 0.35, zoom=1.08, nama='Karakter')
klip('klip/loker.mp4', 2, 0.35, 1, 4.2, trim=0.3, nama='Ganti outfit kencan')
jam('19.30 · 👗 DANDAN KENCAN', 2)
t('sub', 'Mulai dari *dandan kencan.*', 2, 0, 0.35, y=BAWAH)
t('sub', 'Dress code: *merah, pink,* atau *formal!*', 2, 0.35, 0.72, y=600)
t('sub', 'Outfit terbaik *dipuji Direktur!* 👑', 2, 0.72, 1, y=600)

# 3 pembukaan: hujan hati + Direktur
klip('klip/hujan.mp4', 3, 0, 0.55, 3.6, trim=0.1, nama='Hujan hati di lobi')
g('video', 'klip/direktur.mp4', 3, 0.55, 1, nama='Direktur')
jam('20.00 · 🎉 PEMBUKAAN', 3)
t('sub', 'Jam delapan, *pembukaan* sama Direktur.', 3, 0, 0.55, y=BAWAH)
t('sub', 'Yang hadir langsung *dapet EXP!*', 3, 0.55, 1, y=BAWAH)
sfx('Hujan hati', 'match', det(3, 0.2), 30, 0.3)

# 4 speed dating
klip('klip/sd.mp4', 4, 0, 1, 6.9, trim=0.2, nama='Speed dating')
jam('20.15 · ☕ SPEED DATING', 4)
t('sub', '*Speed dating:* 3 menit per ronde.', 4, 0, 0.55, y=ATAS)
t('sub', 'Saling suka? *MATCH!* 💘', 4, 0.55, 1, y=ATAS)

# 5 truth or dare
klip('klip/tod.mp4', 5, 0, 1, 3.0, trim=0.9, nama='Truth or dare berdua')
jam('21.00 · 🎲 TRUTH OR DARE', 5)
t('sub', 'Udah match? Ajak main *truth or dare!*', 5, 0, 1, y=ATAS)

# 6 Taman Cinta buka perdana
klip('klip/taman5.mp4', 6, 0, 1, 5.0, nama='Taman Cinta dibuka')
t('stiker', 'BUKA PERDANA 🎡', 6, 0.02, 1, warna='#ffd23f', y=330)
jam('21.30 · 🎡 TAMAN CINTA', 6)
t('sub', 'Terus… *Taman Cinta* resmi dibuka!', 6, 0, 0.4, y=BAWAH)
t('sub', 'Naik *bianglala* berdua,', 6, 0.4, 0.65, y=BAWAH)
t('sub', 'lempar *koin harapan,* nonton di *bioskop!*', 6, 0.65, 1, y=BAWAH)
sfx('Whoosh taman', 'whoosh', det(6, 0) - 3, 18, 0.3)

# 7 Raja & Ratu Kencan
klip('klip/raja.mp4', 7, 0, 1, 4.0, nama='Kembang api penobatan')
t('stiker', 'RAJA & RATU KENCAN 👑', 7, 0.02, 1, warna='#ff4f7b', y=330)
jam('22.00 · 💠 HADIAH DIAMOND', 7)
t('sub', 'Penutupnya, penobatan *Raja & Ratu Kencan.*', 7, 0, 0.5, y=BAWAH)
t('sub', 'Pasangan terpilih dapet *Diamond!* 💠', 7, 0.5, 1, y=BAWAH)
sfx('Level up', 'levelup', det(7, 0.15), 33, 0.3)

# 8 total EXP
g('video', 'klip/drone.mp4', 8, 0, 1, gelap=0.45, kecepatan=0.8, nama='Drone (redup)')
e('hitung', 8, 0, 1, dict(dari=0, ke=230, detik=round(DURASI[8] * 0.6, 2), atas='total semalam 🔥', label='EXP', y=440), nama='Total EXP')
t('sub', 'Total bisa dapet *230 EXP* semalam!', 8, 0, 1, y=BAWAH)
for i in range(6):
    sfx(f'Tik {i + 1}', 'pop', det(8, 0.15 + i * DURASI[8] * 0.6 / 6), 8, 0.18)

# 9 template Story + tag akun
for i in range(4):
    g('foto', f'foto/story-{i + 1}.png', 9, i / 4, (i + 1) / 4, zoom=1.04, nama=f'Template Story {i + 1}')
    sfx(f'Whip {i + 1}', 'whoosh', waktu(9, i / 4, 1)[0] - 1, 10, 0.18)
t('sub', 'Posting momenmu pakai *template ini,*', 9, 0, 0.5, y=ATAS)
t('sub', 'terus *tag kita!* 📸', 9, 0.5, 1, y=ATAS)

# 10 penutup: daftar
bio = 'Kantor virtual buat cari jodoh, cari teman & curhat\nDaftar → di-ACC Direktur 👑'
prof = dict(akun='jodohonline.company', nama='jodohonline.company 💘', bio=bio, tautan='jodohonline.company/daftar', postingan='5', pengikut=0, mengikuti='0', sensor=True)
e('profil', 10, 0, 1, dict(prof, ketukDetik=round(DURASI[10] * 0.3, 2)), masuk='geser-atas', nama='Profil IG: penutup')
t('sub', 'Belum jadi tamu? *Daftar sekarang!*', 10, 0, 0.55, y=BAWAH)
t('sub', 'Sampai ketemu di *Date Night!* 💘', 10, 0.55, 1, y=BAWAH)
sfx('Geser profil', 'geser', det(10, 0), 18, 0.8); sfx('Ketuk Ikuti', 'ketuk', det(10, DURASI[10] * 0.3) - 2, 12, 0.45); sfx('Notif', 'notif', det(10, DURASI[10] * 0.3) + 2, 25, 0.3)

t('akun', '@jodohonline.company', 0, 0, 1, masuk='none', y=150, x=130)
L[-1]['durasi'] = f(AWAL[1]) - L[-1]['mulai']

total = f(sum(DURASI))
vo = dict(src='vo5.mp3', volume=1) if len(sys.argv) > 1 else None
T = dict(versi=1, fps=FPS, lebar=1080, tinggi=1920, durasi=total, vo=vo, lapis=L, sfx=S)
json.dump(T, open('src/data/timeline-v5.json', 'w'), ensure_ascii=False, indent=1)
print(len(L), 'lapis', len(S), 'sfx', round(sum(DURASI), 2), 'detik')
