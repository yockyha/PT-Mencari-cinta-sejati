# Penyusun timeline video #8: recap Taman Cinta + Date Night semalam (27 Nov), lalu teaser
# GRAND OPENING Y.H.A Club nanti malam 20.00 WIB, penutup "mau dibangun apa lagi?".
# Waktu (detik) dipas ke jeda VO vo8.mp3 (silencedetect). Semua klip direkam dari situs terbaru
# (rekam-aplikasi-8.js + rekam ulang jadwal/hujan/raja/sd/tod/loker).
#   python3 buat_v8.py vo     → dengan VO
import json, sys

FPS = 30
TOTAL = 65.1
f = lambda s: int(round(s * FPS))
L, S = [], []
n = [0]

def nid(p):
    n[0] += 1
    return f'{p}{n[0]}'

def g(jenis, src, a, z, **k):
    L.append(dict(id=nid('g'), track='gambar', jenis=jenis, src=src, mulai=f(a), durasi=max(1, f(z) - f(a)), **k))

def e(jenis, a, z, props, **k):
    L.append(dict(id=nid('e'), track='elemen', jenis=jenis, mulai=f(a), durasi=max(1, f(z) - f(a)), props=props, **k))

def t(jenis, teks, a, z, **k):
    L.append(dict(id=nid('t'), track='teks', jenis=jenis, teks=teks, mulai=f(a), durasi=max(1, f(z) - f(a)), **k))

def sfx(nama, src, detik, dur, vol):
    S.append(dict(id=f's{len(S) + 1}', nama=nama, src=f'sfx/{src}.mp3', mulai=max(0, f(detik)), durasi=dur, volume=vol))

def klip(src, a, z, panjang, trim=0.0, **k):
    g('video', src, a, z, trim=trim, kecepatan=round(max(0.5, min(2.5, (panjang - trim) / (z - a))), 3), **k)

def chips(teks, a, z, y=1690):
    t('chips', teks, a, z, nyala='0', y=y, masuk='pop')
    sfx('Pop ' + teks, 'pop', a, 15, 0.3)

def stiker(teks, a, z, warna='#ff4f7b', y=330):
    t('stiker', teks, a, z, warna=warna, y=y)
    sfx('Pop ' + teks, 'pop', a + 0.03, 15, 0.35)

ATAS, BAWAH = 130, 1330

# ---- 0 HOOK (0–5.27): "Lu semalem ke mana?"
klip('klip/hujan.mp4', 0, 5.27, 4.5, nama='Hujan hati semalam')
stiker('POV: LU SKIP SEMALAM 💀', 0, 5.27, y=330)
chips('📹 REC · 27.11 · 20.00', 0, 5.27)
t('sub', 'Lu *semalem* ke mana?', 0, 1.2, y=BAWAH)
t('sub', 'Di jodohonline semalem *rame banget,* sumpah!', 1.2, 5.27, y=BAWAH)
sfx('Whoosh', 'whoosh', 5.15, 18, 0.3)

# ---- 1 TAMAN CINTA (5.27–16.85)
klip('klip/tc_drone.mp4', 5.27, 9.95, 5.0, nama='Taman Cinta malam (drone)')
stiker('RESMI DIBUKA 🎡', 5.27, 9.95, warna='#ffd23f')
chips('27.11 · 21.30 · 🎡 TAMAN CINTA', 5.27, 16.85)
t('sub', 'Pertama, *Taman Cinta* akhirnya resmi dibuka!', 5.27, 7.95, y=BAWAH)
t('sub', 'Ada *bianglala* buat naik berdua,', 7.95, 9.95, y=BAWAH)
klip('klip/tc_koin.mp4', 9.95, 13.85, 5.5, trim=0.4, nama='Lempar koin harapan')
t('sub', '*air mancur* buat lempar koin harapan,', 9.95, 13.85, y=ATAS)
sfx('Koin', 'pop', 12.6, 15, 0.35)
klip('klip/tc_bioskop.mp4', 13.85, 16.85, 4.5, nama='Bioskop + popcorn')
t('sub', 'sampe *bioskop* sama popcorn 🍿', 13.85, 14.6, y=BAWAH)
t('sub', 'Spot nge-date *paling cakep* di kantor!', 14.6, 16.85, y=BAWAH)
sfx('Whoosh DN', 'whoosh', 16.75, 18, 0.3)

# ---- 2 DATE NIGHT (16.85–32.88)
klip('klip/jadwal.mp4', 16.85, 19.95, 4.0, trim=0.3, nama='Jadwal Date Night')
stiker('DATE NIGHT 💘', 16.85, 19.95)
t('sub', 'Terus lanjut *Date Night,*', 16.85, 18.1, y=BAWAH)
t('sub', 'dibuka langsung sama *Pak Direktur* 👑', 18.1, 19.95, y=BAWAH)
klip('klip/loker.mp4', 19.95, 22.6, 4.5, trim=0.3, nama='Dandan outfit kencan')
chips('👗 DANDAN KENCAN', 19.95, 22.6)
t('sub', 'Ada yang dandan pake *outfit kencan* terbaiknya,', 19.95, 22.6, y=ATAS)
klip('klip/sd.mp4', 22.6, 25.95, 7.5, trim=0.6, nama='Speed dating')
chips('☕ SPEED DATING', 22.6, 25.95)
t('sub', 'lanjut *speed dating…*', 22.6, 23.8, y=1500)
t('sub', 'saling kasih love = *langsung MATCH!* 💘', 23.8, 25.95, y=1500)
sfx('Match', 'match', 25.4, 30, 0.3)
klip('klip/tod.mp4', 25.95, 28.0, 4.0, trim=0.9, nama='Truth or dare')
chips('🎲 TRUTH OR DARE', 25.95, 28.0)
t('sub', 'Abis itu *truth or dare* berdua,', 25.95, 28.0, y=1500)
klip('klip/raja.mp4', 28.0, 32.88, 4.0, nama='Raja & Ratu Kencan')
stiker('RAJA & RATU KENCAN 👑', 28.0, 32.88, warna='#ffd23f')
t('sub', 'ditutup *penobatan Raja & Ratu Kencan!*', 28.0, 30.75, y=BAWAH)
t('sub', 'Asli, *salting berjamaah* 😳', 30.75, 32.88, y=BAWAH)
sfx('Level up', 'levelup', 28.2, 33, 0.3)

# ---- 3 "EITS… TAPI ITU BARU PEMANASAN" (32.88–35.38)
g('video', 'klip/cl_luar.mp4', 32.88, 35.38, gelap=0.82, kecepatan=0.6, nama='Gelap: transisi club')
stiker('EITS… ✋', 32.88, 33.6, warna='#ffffff', y=700)
t('judul', 'TAPI ITU BARU', 33.55, 35.38, kecil='PEMANASAN 🔥', warna='#ff2fb3', y=720)
sfx('Rem', 'rem', 32.9, 20, 0.45); sfx('Whoosh club', 'whoosh', 35.25, 18, 0.35)

# ---- 4 GRAND OPENING (35.38–41.28)
klip('klip/cl_luar.mp4', 35.38, 41.28, 5.0, nama='Y.H.A Club eksterior')
stiker('NANTI MALAM 20.00 WIB 🪩', 35.38, 41.28, warna='#ff2fb3')
chips('👑 GRAND OPENING · Y.H.A CLUB', 35.38, 41.28)
t('sub', 'Nanti malem *jam delapan,*', 35.38, 36.6, y=BAWAH)
t('sub', 'Pak Direktur bakal *resmiin Y.H.A Club!*', 36.6, 38.95, y=BAWAH)
t('sub', 'Klub malem *paling megah* di jodohonline.', 38.95, 41.28, y=BAWAH)

# ---- 5 FITUR CLUB (41.28–53.52)
klip('klip/cl_dance.mp4', 41.28, 42.7, 5.5, nama='Dance floor LED')
chips('💃 DANCE FLOOR LED', 41.28, 42.7)
klip('klip/cl_dj.mp4', 42.7, 45.25, 6.0, nama='DJ lagu YouTube')
chips('🎧 DJ · LAGU YOUTUBE', 42.7, 45.25)
t('sub', 'DJ muterin *lagu YouTube* buat semua orang,', 42.7, 45.25, y=1500)
klip('klip/cl_vip.mp4', 45.25, 46.45, 4.0, trim=1.0, nama='VIP table')
chips('💎 VIP TABLE', 45.25, 46.45)
klip('klip/cl_bar.mp4', 46.45, 48.0, 4.5, trim=1.0, nama='Mocktail bar')
chips('🍹 MOCKTAIL BAR', 46.45, 48.0)
t('sub', 'Ada *dance floor LED,*', 41.28, 42.7, y=BAWAH)
t('sub', 'VIP table, *mocktail bar…*', 45.25, 48.0, y=BAWAH)
klip('klip/cl_layar.mp4', 48.0, 50.7, 4.4, trim=0.2, nama='Tulis ucapan')
klip('klip/cl_layar.mp4', 50.7, 53.52, 8.0, trim=4.55, nama='Ucapan tayang di layar raksasa')
stiker('LAYAR UCAPAN 💌', 48.0, 53.52, warna='#ffd23f', y=1150)
t('sub', 'sampe *layar ucapan raksasa!*', 48.0, 49.1, y=1500)
t('sub', 'Kirim pesan buat *gebetan lu,*', 49.1, 51.0, y=1500)
t('sub', 'tampil *gede* di layar club. *Berani nggak?* 😏', 51.0, 53.52, y=1500)
for d in (41.3, 42.7, 45.25, 46.45, 48.0):
    sfx(f'Whip {d}', 'whoosh', d - 0.05, 10, 0.18)

# ---- 6 PENUTUP (53.52–65.07): mau dibangun apa lagi?
g('video', 'klip/cl_dance.mp4', 53.52, 65.1, gelap=0.5, kecepatan=0.5, nama='Latar penutup club')
ketik = 'bangun pantai plis biar bisa sunset date 🏖️'
e('komentar', 53.52, 62.1, dict(komentar='penonton1|MALL dong biar bisa nge-date sambil belanja 🛍️|1m|24\npenonton2|kampus jodoh wkwk 🎓|2m|17\npenonton3|stadion buat nobar bola ⚽|3m|9\npenonton4|kebun binatang 🦒 gemes|4m|6',
                         ketik=ketik, ketikDetik=2.6, akunSaya='lu', sensor=True), masuk='geser-atas', nama='Komentar: mau dibangun apa')
stiker('MAU DIBANGUN APA LAGI? 👇', 53.52, 62.1, y=240)
t('sub', 'Abis taman & club, *bangun apa lagi?*', 53.52, 58.95, y=470)
t('sub', '*Tulis di komentar,* siapa tau beneran dibangun!', 58.95, 62.1, y=470)
sfx('Geser komentar', 'geser', 53.55, 18, 0.8); sfx('Ketik', 'ketik', 56.1, 40, 1.0); sfx('Ketuk kirim', 'ketuk', 56.1 + len(ketik) / 9 + 0.2, 12, 0.45)
t('judul', 'SEE YOU 20.00', 62.1, 65.1, kecil='DI Y.H.A CLUB 🪩', warna='#ff2fb3', y=640)
t('sub', 'IG *@jodohonline.company* · TikTok *@jodohonline.id*', 62.1, 65.1, y=1330)
sfx('Pop akhir', 'levelup', 62.15, 30, 0.3)

t('akun', '@jodohonline.company', 0, 5.27, masuk='none', y=150, x=130)

vo = dict(src='vo8.mp3', volume=1) if len(sys.argv) > 1 else None
T = dict(versi=1, fps=FPS, lebar=1080, tinggi=1920, durasi=f(TOTAL), vo=vo, lapis=L, sfx=S)
json.dump(T, open('src/data/timeline-v8.json', 'w'), ensure_ascii=False, indent=1)
print(len(L), 'lapis', len(S), 'sfx', TOTAL, 'detik')
