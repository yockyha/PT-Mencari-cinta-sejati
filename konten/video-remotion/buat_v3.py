# Penyusun timeline video #3 (udah jadi tamu, terus ngapain?). Hook: DM penonton yang bingung.
# Durasi tiap bagian bisa dipas ke voice-over lewat file JSON berisi 11 angka (detik):
#   python3 buat_v3.py [durasi.json]
import json, sys

FPS = 30
# 0 kotak DM, 1 isi DM, 2 judul, 3 karakter, 4 jalan-jalan, 5 ngobrol, 6 match, 7 tugas & game, 8 acara, 9 toko, 10 penutup
DURASI = [2.6, 3.6, 2.3, 4.0, 5.0, 3.2, 5.5, 4.5, 3.5, 3.5, 6.0]
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

def chip(no, teks, b):
    t('chips', f'{no}/7 · {teks}', b, 0.03, 1, nyala='0', y=400, masuk='pop')

BAWAH = 1330
bio = 'Kantor virtual buat cari jodoh, cari teman & curhat\nDaftar → di-ACC Direktur 👑'
prof = dict(akun='jodohonline.company', nama='jodohonline.id 💘', bio=bio, tautan='jodohonline.company/daftar', postingan='3', pengikut=0, mengikuti='0', sensor=True)

# 0 kotak masuk DM: pertanyaan berdatangan
DM = ['kak udah di-ACC, terus ngapain? 😭', 'bingung mau ngapain di kantornya', 'min abis join bisa ngapain aja?', 'aku udh masuk tp bingung 🥲', 'cara dapet match gimana kak?']
jeda0 = round(DURASI[0] * 0.75 / len(DM), 2)
e('kotakdm', 0, 0, 1, dict(akun='jodohonline.company', pesan='\n'.join(f'penonton{i + 1}|{x}|{i + 1}m' for i, x in enumerate(DM)), jeda=jeda0, sensor=True), nama='Kotak masuk DM')
t('sub', 'Banyak banget yang *DM…*', 0, 0, 1, y=BAWAH + 120)
for i in range(len(DM)):
    sfx(f'Notif DM {i + 1}', 'notif', f(jeda0 * i), 18, 0.25)

# 1 isi DM
jeda1 = round(DURASI[1] * 0.8 / 4, 2)
e('dm', 1, 0, 1, dict(pengguna='penonton1', pesan='kiri|kak aku udah di-ACC 🥹\nkiri|terus abis join ngapain? 😭\nkiri|bingung mau ngapain di kantornya\nkanan|sini aku jelasin 👇', jeda=jeda1, sensor=True), masuk='geser-kiri', nama='Obrolan DM')
t('sub', '*"udah di-ACC… terus ngapain?"*', 1, 0, 1, y=430)
sfx('Geser DM', 'geser', det(1, 0), 18, 0.7)
for i in range(3):
    sfx(f'Pop DM {i + 1}', 'pop', det(1, jeda1 * i), 15, 0.3)
sfx('Kirim balasan', 'whoosh', det(1, jeda1 * 3) - 2, 18, 0.25)

# 2 judul
g('video', 'klip/drone.mp4', 2, 0, 1, gelap=0.45, kecepatan=0.8, nama='Drone kantor (redup)')
t('judul', 'Udah jadi tamu?', 2, 0.02, 1, kecil='ini 7 hal seru', y=560)
t('sub', 'Tenang, ini *7 hal* yang bisa kamu lakuin!', 2, 0, 1)
sfx('Whoosh judul', 'whoosh', det(2, 0) - 3, 18, 0.3)

# 3 karakter
g('foto', 'foto/karakter.png', 3, 0, 0.41, zoom=1.08, nama='Karakter')
g('video', 'klip/loker.mp4', 3, 0.41, 1, trim=0.3, nama='Ruang Loker')
chip(1, 'BIKIN KARAKTER', 3)
t('sub', '*Satu,* bikin karakter sendiri.', 3, 0, 0.41, y=BAWAH)
t('sub', 'Rambut, baju, aksesoris, *bebas!*', 3, 0.41, 1, y=620)
sfx('Pop 1', 'pop', det(3, 0), 15, 0.3); sfx('Ketuk outfit', 'ketuk', det(3, DURASI[3] * 0.35 + 0.6), 12, 0.4)

# 4 jalan-jalan & nongkrong
g('video', 'klip/jalan.mp4', 4, 0, 0.4, nama='Jalan-jalan')
for i, (r, a, z) in enumerate([('r_kafe', 0.4, 0.59), ('r_meja', 0.59, 0.76), ('r_taman', 0.76, 1)]):
    g('video', f'klip/{r}.mp4', 4, a, z, nama=r)
    sfx(f'Whoosh ruang {i + 1}', 'whoosh', waktu(4, a, z)[0] - 3, 18, 0.2)
chip(2, 'JALAN-JALAN', 4)
t('sub', '*Dua,* jalan-jalan keliling kantor.', 4, 0, 0.4, y=BAWAH)
t('sub', 'Nongkrong di *Kafe Jodoh,*', 4, 0.4, 0.59, y=BAWAH)
t('sub', '*Meja Nongkrong,*', 4, 0.59, 0.76, y=BAWAH)
t('sub', 'atau *Taman Curhat.*', 4, 0.76, 1, y=BAWAH)
sfx('Pop 2', 'pop', det(4, 0), 15, 0.3)

# 5 ngobrol
g('video', 'klip/chat.mp4', 5, 0, 1, trim=0.2, kecepatan=round(3.4 / DURASI[5], 3), nama='Ngobrol di chat')
chip(3, 'NGOBROL', 5)
t('sub', '*Tiga,* kenalan & ngobrol sama tamu lain.', 5, 0, 1, y=BAWAH)
sfx('Pop 3', 'pop', det(5, 0), 15, 0.3); sfx('Ketik chat', 'ketik', det(5, 0.4), 40, 0.9)

# 6 match → pesan suara → telepon (rekaman baru)
pot = 0.76
kec6 = round(3.3 / (DURASI[6] * pot), 3)  # bagian klip (popup + obrolan) lalu foto layar telepon
g('video', 'klip/match.mp4', 6, 0, pot, trim=0.1, kecepatan=kec6, nama='Match & pesan suara')
g('foto', 'foto/telepon.png', 6, pot, 1, zoom=1.06, nama='Telepon')
chip(4, 'MATCH 💘', 6)
t('sub', '*Empat,* saling suka? *MATCH!*', 6, 0, 0.41, y=BAWAH)
t('sub', 'Kirim *pesan suara…*', 6, 0.41, pot, y=1560)
t('sub', 'sampai *telponan!* 📞', 6, pot, 1, y=BAWAH)
sfx('Match', 'match', det(6, 0.15), 30, 0.35); sfx('Ketuk mulai ngobrol', 'ketuk', det(6, 1.3 / kec6) - 2, 12, 0.4)
sfx('Ketuk telepon', 'ketuk', det(6, DURASI[6] * pot) - 3, 12, 0.45); sfx('Dering', 'notif', det(6, DURASI[6] * pot + 0.2), 25, 0.3)

# 7 tugas & game → naik level
g('foto', 'foto/tugas.png', 7, 0, 0.45, zoom=1.05, nama='Tugas')
g('video', 'klip/game.mp4', 7, 0.45, 0.72, trim=1.0, nama='Game Tangkap Hati')
g('foto', 'foto/levelup.png', 7, 0.72, 1, zoom=1.06, nama='Naik level')
chip(5, 'TUGAS & GAME', 7)
t('sub', '*Lima,* kerjain *tugas,*', 7, 0, 0.45, y=BAWAH)
t('sub', 'main *game,*', 7, 0.45, 0.72, y=BAWAH)
t('sub', 'biar *naik level!*', 7, 0.72, 1, y=BAWAH)
sfx('Pop 5', 'pop', det(7, 0), 15, 0.3); sfx('Level up', 'levelup', waktu(7, 0.72, 1)[0], 33, 0.3)

# 8 acara bareng Direktur
g('foto', 'foto/rapat.png', 8, 0, 0.55, zoom=1.06, nama='Papan acara')
g('video', 'klip/direktur.mp4', 8, 0.55, 1, nama='Direktur')
chip(6, 'ACARA', 8)
t('sub', '*Enam,* ikut acara seru', 8, 0, 0.55, y=BAWAH)
t('sub', 'bareng *Direktur!* 👑', 8, 0.55, 1, y=BAWAH)
sfx('Pop 6', 'pop', det(8, 0), 15, 0.3); sfx('Whoosh direktur', 'whoosh', waktu(8, 0.55, 1)[0] - 3, 18, 0.25)

# 9 toko
g('foto', 'foto/toko.png', 9, 0, 1, zoom=1.1, nama='Toko & Lemari Diamond')
chip(7, 'TOKO', 9)
t('sub', '*Tujuh,* belanja outfit *spesial*', 9, 0, 0.65, y=BAWAH)
t('sub', 'di *toko!* 💎', 9, 0.65, 1, y=BAWAH)
sfx('Pop 7', 'pop', det(9, 0), 15, 0.3)

# 10 penutup
e('profil', 10, 0, 1, dict(prof, ketukDetik=round(DURASI[10] * 0.3, 2)), masuk='geser-atas', nama='Profil IG: penutup')
t('sub', 'Belum jadi tamu?', 10, 0, 0.22, y=BAWAH)
t('sub', '*Follow,* komen *DAFTAR,*', 10, 0.22, 0.56, y=BAWAH)
t('sub', 'isi formulir di *link bio!*', 10, 0.56, 1, y=BAWAH)
sfx('Geser profil', 'geser', det(10, 0), 18, 0.8); sfx('Ketuk Ikuti', 'ketuk', det(10, DURASI[10] * 0.3) - 2, 12, 0.45); sfx('Notif mengikuti', 'notif', det(10, DURASI[10] * 0.3) + 2, 25, 0.3)

t('akun', '@jodohonline.id', 2, 0, 1, masuk='none', y=150, x=130)
# label akun tetap tampil dari judul sampai toko (penutup sudah menampilkan profil)
L[-1]['durasi'] = f(AWAL[10]) - L[-1]['mulai']

total = f(sum(DURASI))
vo = dict(src='vo3.mp3', volume=1) if len(sys.argv) > 1 else None
T = dict(versi=1, fps=FPS, lebar=1080, tinggi=1920, durasi=total, vo=vo, lapis=L, sfx=S)
json.dump(T, open('src/data/timeline-v3.json', 'w'), ensure_ascii=False, indent=1)
print(len(L), 'lapis', len(S), 'sfx', round(sum(DURASI), 2), 'detik')
