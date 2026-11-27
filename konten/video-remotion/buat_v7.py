# Penyusun timeline video #7: perkenalan pegawai kantor jodohonline (gaya "character intro").
# Tiap tokoh: kartu perkenalan (gambar karakter + nama + jabatan + keterangan), lalu rekaman kegiatannya.
# Data pegawai & kegiatan dari kantor/karyawan.js (situs terbaru). Narasi gue/lu.
# Durasi tiap bagian bisa dipas ke voice-over lewat file JSON berisi 10 angka (detik):
#   python3 buat_v7.py [durasi.json]
import json, sys

FPS = 30
# 0 hook, 1 Mbak Ayu, 2 Pak Bambang, 3 Bu Wati & Mas Ujang, 4 Mas Raka, 5 cepat (Nadia, Dimas, Sari, Bayu),
# 6 Ruang Direktur (GUARD, Citra, Ujang), 7 Bang Ojol, 8 ngobrol → ada tamu, 9 penutup
DURASI = [4.6, 6.0, 4.4, 6.4, 4.4, 7.6, 7.0, 7.4, 6.0, 5.6]
if len(sys.argv) > 1:
    DURASI = json.load(open(sys.argv[1]))
assert len(DURASI) == 10
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

def kenal(b, a, z, nomor, nama, jabatan, ikon, info, warna, tokoh, tokoh2=''):
    e('kenal', b, a, z, dict(tokoh=f'foto/pegawai-{tokoh}.png', tokoh2=f'foto/pegawai-{tokoh2}.png' if tokoh2 else '', nama=nama, jabatan=jabatan, ikon=ikon,
                             info=info, warna=warna, nomor=nomor, judulAtas='KENALIN 👋'), masuk='geser-kiri', nama=f'Kartu {nama}')
    sfx('Whoosh ' + nama, 'whoosh', waktu(b, a, z)[0] - 2, 18, 0.3)
    sfx('Pop ' + nama, 'pop', waktu(b, a, z)[0] + 8, 15, 0.35)

ATAS, BAWAH = 130, 1330

# 0 hook
g('video', 'klip/drone.mp4', 0, 0, 1, gelap=0.35, kecepatan=0.85, nama='Kantor dari atas')
t('stiker', 'KENALAN YUK 👋', 0, 0.02, 1, warna='#ff4f7b', y=380)
t('sub', 'Lu pikir kantor jodoh isinya *cuma tamu?*', 0, 0, 0.42, y=BAWAH)
t('sub', 'Salah! Pegawainya juga *sibuk banget!*', 0, 0.42, 0.75, y=BAWAH)
t('sub', 'Yuk, *gue ajak liat!* 👀', 0, 0.75, 1, y=BAWAH)
sfx('Pop stiker', 'pop', det(0, 0.06), 15, 0.35)

# 1 Mbak Ayu
kenal(1, 0, 0.42, '01', 'Mbak Ayu', 'Resepsionis', '💁‍♀️', '👋 Nyambut tamu\n📞 Angkat telepon', '#ff4f7b', 'ayu')
klip('klip/p_ayu.mp4', 1, 0.42, 1, 4.2, trim=0.2, nama='Mbak Ayu angkat telepon')
t('sub', 'Kerjaannya nyambut tamu, *angkat telepon…*', 1, 0.42, 0.75, y=BAWAH)
t('sub', 'sama *pesen makan online,* hehe 🤭', 1, 0.75, 1, y=BAWAH)

# 2 Pak Bambang
kenal(2, 0, 0.45, '02', 'Pak Bambang', 'Satpam', '👮', '🚶 Patroli lobi\n🫡 Aman terkendali', '#1d3557', 'bambang')
klip('klip/p_bambang.mp4', 2, 0.45, 1, 4.8, trim=0.1, nama='Pak Bambang patroli')
t('sub', 'Patroli biar kantor *tetep aman!*', 2, 0.45, 1, y=BAWAH)

# 3 Bu Wati & Mas Ujang
kenal(3, 0, 0.4, '03', 'Bu Wati & Mas Ujang', 'OG & OB', '🧹', '🧽 Ngepel + papan awas licin\n🧹 Nyapu tiap sudut', '#2a9d8f', 'wati', 'ujang')
klip('klip/p_ob.mp4', 3, 0.4, 1, 4.8, trim=0.1, nama='Ngepel & nyapu')
t('sub', 'Satu *ngepel,* satu *nyapu.*', 3, 0.4, 0.65, y=BAWAH)
t('sub', 'Sampe ada *papan awas licin,* detail banget!', 3, 0.65, 1, y=BAWAH)

# 4 Mas Raka
kenal(4, 0, 0.45, '04', 'Mas Raka', 'Barista Kafe Jodoh', '☕', '☕ Antar kopi ke meja\n✨ Lap meja kafe', '#8a5a2b', 'raka')
klip('klip/p_raka.mp4', 4, 0.45, 1, 4.8, trim=0.1, nama='Mas Raka antar kopi')
t('sub', 'Sibuk *nganterin kopi* ke meja tamu ☕', 4, 0.45, 1, y=BAWAH)

# 5 potongan cepat: kartu + klip tiap tokoh
CEPAT = [('05', 'Kak Nadia', 'Konselor Taman Curhat', '🌷', '🤗 Nemenin yang curhat', '#7fb069', 'nadia', 'Ada *Kak Nadia* di Taman Curhat,'),
         ('06', 'Bang Dimas', 'Host Meja Nongkrong', '🤝', '🪑 "Sini gabung!"', '#e76f51', 'dimas', '*Bang Dimas* host meja nongkrong,'),
         ('07', 'Mbak Sari', 'Stylist Ruang Loker', '👗', '👕 Lipet baju baru', '#b5179e', 'sari', '*Mbak Sari* yang lagi lipet baju,'),
         ('08', 'Mas Bayu', 'Game Master', '🎮', '🎮 Main game mulu', '#3a0ca3', 'bayu', 'sampe *Mas Bayu* yang main game mulu 😆')]
for i, (no, nama, jab, ik, info, w, id_, sub) in enumerate(CEPAT):
    a, z = i / 4, (i + 1) / 4
    kenal(5, a, a + 0.6 * (z - a), no, nama, jab, ik, info, w, id_)
    klip(f'klip/p_{id_}.mp4', 5, a + 0.6 * (z - a), z, 1.6, trim=0.5, nama=f'{nama} beraksi')
    t('sub', sub, 5, a, z, y=BAWAH + 300)

# 6 Ruang Direktur: GUARD, Mbak Citra, (Mas Ujang antar kopi)
kenal(6, 0, 0.33, '09', 'GUARD', 'Pengawal Direktur', '🕶️', '🚪 Jaga pintu 24 jam', '#111111', 'guard1', 'guard2')
kenal(6, 0.33, 0.55, '10', 'Mbak Citra', 'Sekretaris Direktur', '👩‍💼', '📁 Antar berkas tamu baru', '#6d597a', 'citra')
klip('klip/p_direktur.mp4', 6, 0.55, 1, 2.5, trim=0.1, nama='Pintu Ruang Direktur')
t('sub', 'Ruang Direktur dijaga *dua GUARD 24 jam!*', 6, 0, 0.33, y=BAWAH + 300)
t('sub', '*Mbak Citra* bolak-balik nganterin berkas,', 6, 0.33, 0.7, y=BAWAH + 300)
t('sub', '*Mas Ujang* nganterin kopi buat Direktur ☕', 6, 0.7, 1, y=BAWAH)

# 7 Bang Ojol
kenal(7, 0, 0.32, '11', 'Bang Ojol', 'Kurir Makanan', '🛵', '📦 Antar pesanan ke lobi\n⭐ "Jangan lupa bintang 5!"', '#0f6b31', 'ojol')
klip('klip/p_ojol.mp4', 7, 0.32, 1, 8.8, trim=0.1, nama='Bang Ojol antar pesanan')
t('stiker', 'PALING DITUNGGU 🛵', 7, 0.0, 0.32, warna='#ffd23f', y=60)
t('sub', 'Tiap ada pegawai *pesen makan,*', 7, 0.32, 0.65, y=BAWAH)
t('sub', 'dia dateng bawa pesanan. *Bintang lima!* ⭐', 7, 0.65, 1, y=BAWAH)
sfx('Klakson', 'notif', det(7, DURASI[7] * 0.35), 20, 0.3)

# 8 ngobrol → ada tamu
klip('klip/p_ngobrol.mp4', 8, 0, 1, 8.8, trim=0.1, nama='Ngobrol, lalu ada tamu')
t('sub', 'Kalau lagi sepi, mereka *ngobrol bareng.*', 8, 0, 0.6, y=BAWAH)
t('stiker', 'ADA TAMU! 🏃', 8, 0.62, 1, warna='#ff4f7b', y=380)
t('sub', 'Tapi begitu ada tamu… *langsung balik ke pos!*', 8, 0.62, 1, y=BAWAH)
sfx('Kaget', 'pop', det(8, DURASI[8] * 0.62), 15, 0.4)

# 9 penutup: favorit lu siapa? + daftar
D9 = DURASI[9]
g('video', 'klip/drone.mp4', 9, 0, 1, gelap=0.45, kecepatan=0.6, trim=0.5, nama='Latar penutup')
e('komentar', 9, 0, 1, dict(komentar='penonton1|Bu Wati paling rajin sumpah 😭|1m|18\npenonton2|tim Bang Ojol 🛵⭐⭐⭐⭐⭐|2m|12\npenonton3|GUARD-nya serem tapi keren|3m|7\npenonton4|Mas Bayu kerja apa main 😂|4m|5',
                           ketik='fav gue Bang Ojol sih 🛵', ketikDetik=round(D9 * 0.08, 2), akunSaya='lu', sensor=True), masuk='geser-atas', nama='Komentar: favorit')
t('stiker', 'FAVORIT LU SIAPA? 👇', 9, 0.02, 0.55, warna='#ff4f7b', y=240)
t('sub', 'Jadi, *pegawai mana* favorit lu?', 9, 0, 0.55, y=470)
t('stiker', 'DAFTAR DI LINK BIO 💘', 9, 0.55, 1, warna='#ffd23f', y=240)
t('sub', 'Pengen ketemu langsung? *Daftar* di link bio!', 9, 0.55, 1, y=470)
kirim = D9 * 0.08 + len('fav gue Bang Ojol sih 🛵') / 9
sfx('Geser komentar', 'geser', det(9, 0), 18, 0.8); sfx('Ketik', 'ketik', det(9, D9 * 0.08), 40, 1.0); sfx('Ketuk kirim', 'ketuk', det(9, kirim + 0.2), 12, 0.45)
sfx('Pop stiker 2', 'pop', waktu(9, 0.55, 1)[0], 15, 0.35)

t('akun', '@jodohonline.company', 0, 0, 1, masuk='none', y=150, x=130)

total = f(sum(DURASI))
vo = dict(src='vo7.mp3', volume=1) if len(sys.argv) > 1 else None
T = dict(versi=1, fps=FPS, lebar=1080, tinggi=1920, durasi=total, vo=vo, lapis=L, sfx=S)
json.dump(T, open('src/data/timeline-v7.json', 'w'), ensure_ascii=False, indent=1)
print(len(L), 'lapis', len(S), 'sfx', round(sum(DURASI), 2), 'detik')
