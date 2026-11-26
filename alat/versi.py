# Pasang nomor versi (?v=...) di semua import JavaScript situs, supaya browser
# selalu mengambil file terbaru setelah situs diperbarui (tidak terjebak cache lama).
# Jalankan setiap kali mengubah file .js:  python3 alat/versi.py
import pathlib, re, time

AKAR = pathlib.Path(__file__).resolve().parent.parent
FILE = [*AKAR.glob('*.html'), *AKAR.glob('kantor/*'), *AKAR.glob('dashboard/*'), *AKAR.glob('idcard/*'), *AKAR.glob('info/*'), *AKAR.glob('js/*.js')]
VERSI = time.strftime('%Y%m%d%H%M')
POLA = re.compile(r"""(from\s*|import\(\s*|src=)(['"])((?!https?:)[^'"?]+?\.js)(\?v=[^'"]*)?\2""")

ubah = 0
for f in FILE:
    if f.suffix not in ('.js', '.html') or not f.is_file():
        continue
    teks = f.read_text(encoding='utf-8')
    baru = POLA.sub(lambda m: f"{m.group(1)}{m.group(2)}{m.group(3)}?v={VERSI}{m.group(2)}", teks)
    if baru != teks:
        f.write_text(baru, encoding='utf-8'); ubah += 1
print(f'versi {VERSI} dipasang di {ubah} file')
