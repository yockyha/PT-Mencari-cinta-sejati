# =====================================================================
#  Penyusun database.rules.json (aturan keamanan Firebase Realtime Database)
#
#  Firebase hanya menerima SATU file aturan utuh, jadi aturan ditulis
#  terpisah lalu digabung di sini (mirip @extends / @include di Laravel):
#    alat/aturan/_inti.py      potongan aturan bersama ("main", jarang diubah)
#    alat/aturan/NN_fitur.py   satu file per fitur, masing-masing punya pasang(r)
#  File fitur dibaca berurutan sesuai nomor di depan namanya.
#
#  Jalankan:  python3 alat/buat-aturan-firebase.py database.rules.json
#  Setelah di-merge ke main, GitHub Actions memasang aturannya ke Firebase
#  secara otomatis (.github/workflows/aturan-firebase.yml).
# =====================================================================
import importlib.util, json, pathlib, sys

FOLDER = pathlib.Path(__file__).resolve().parent / 'aturan'
sys.path.insert(0, str(FOLDER))


class Aturan(dict):
    """dict yang menolak node ganda, supaya dua fitur tidak saling menimpa tanpa sengaja"""
    def __init__(self):
        super().__init__({".read": False, ".write": False})
        self.asal = {}
        self.fitur = '(dasar)'

    def __setitem__(self, k, v):
        if k in self.asal:
            raise SystemExit(f'Node "{k}" didefinisikan dua kali: di {self.asal[k]} dan {self.fitur}')
        self.asal[k] = self.fitur
        super().__setitem__(k, v)


def susun():
    r = Aturan()
    for f in sorted(FOLDER.glob('[0-9]*.py')):
        spec = importlib.util.spec_from_file_location(f.stem, f)
        m = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(m)
        r.fitur = f.name
        m.pasang(r)
    return r


if __name__ == '__main__':
    tujuan = sys.argv[1] if len(sys.argv) > 1 else 'database.rules.json'
    r = susun()
    teks = json.dumps({"rules": dict(r)}, indent=2, ensure_ascii=False) + '\n'
    if '--cek' in sys.argv:  # dipakai GitHub Actions: pastikan file yang di-commit sudah terbaru
        lama = pathlib.Path(tujuan).read_text(encoding='utf-8')
        if json.loads(lama) != json.loads(teks):
            raise SystemExit(f'{tujuan} belum diperbarui. Jalankan: python3 alat/buat-aturan-firebase.py {tujuan}')
        print('cocok:', len(r) - 2, 'node')
    else:
        pathlib.Path(tujuan).write_text(teks, encoding='utf-8')
        print(len(r) - 2, 'node dari', len(set(r.asal.values())), 'file fitur')
