# Aturan Firebase (dipecah per fitur)

Firebase hanya menerima **satu** file aturan (`database.rules.json`). Supaya gampang dirawat,
aturannya ditulis terpisah di folder ini lalu digabung otomatis, mirip `@extends` / `@include` di Laravel:

| File | Isi |
|---|---|
| `_inti.py` | **"main"**: potongan aturan bersama (login, Direktur/staf, tamu resmi, VIP/VVIP, larangan, dll.). Jarang diubah. |
| `10_akses.py` … `90_acara.py` | Satu file per fitur. Masing-masing berisi `pasang(r)` yang menambahkan node milik fitur itu. |

`alat/buat-aturan-firebase.py` membaca `_inti.py`, lalu semua file fitur berurutan sesuai nomornya,
dan menulis `database.rules.json`. Kalau ada dua fitur yang memakai nama node yang sama, penyusunan
dihentikan dengan pesan error supaya tidak saling menimpa.

## Menambah fitur baru

1. Buat file baru, misalnya `alat/aturan/67_fitur_baru.py`:

   ```python
   # Fitur: penjelasan singkat
   from _inti import *  # noqa: F401,F403


   def pasang(r):
       r["fiturBaru"] = {".read": A, "$uid": {".write": f"{A} && auth.uid === $uid && {BEBAS}"}}
   ```

2. Jalankan `python3 alat/buat-aturan-firebase.py database.rules.json`
3. Commit & merge ke `main`. **GitHub Actions memasang aturan ke Firebase otomatis**
   (`.github/workflows/aturan-firebase.yml`), jadi tidak perlu salin–tempel lagi.

## Pemasangan otomatis (sekali atur)

GitHub → repo ini → **Settings → Secrets and variables → Actions → New repository secret**:

- Name: `FIREBASE_DB_SECRET`
- Secret: Firebase Console → ⚙️ Project settings → **Service accounts → Database secrets → Show**

Setelah itu setiap merge yang mengubah aturan langsung terpasang. Statusnya bisa dilihat di tab **Actions**.
Kalau Firebase menolak aturan (misalnya salah ketik), langkahnya gagal dan aturan lama tetap dipakai.
