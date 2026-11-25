# Gambar QRIS

Taruh gambar QRIS kamu di folder ini, misalnya `pembayaran/qris.png`, lalu isi di `config.js`:

```js
pembayaran: {
  qris: 'pembayaran/qris.png',
  qrisNama: 'JODOHONLINE',   // nama merchant yang tertulis di QRIS
  ...
}
```

Cara mengunggah lewat GitHub: buka folder `pembayaran` di repo → **Add file → Upload files** → pilih gambar QRIS → **Commit changes**.

QRIS bisa didapat gratis dari aplikasi merchant bank (BRImo/QRIS BRI, BCA merchant) atau e-wallet bisnis (GoPay Merchant, DANA Bisnis, ShopeePay). Pakai **QRIS statis** (pembeli mengetik nominal sendiri), karena situs ini meminta pembeli membayar nominal unik.
