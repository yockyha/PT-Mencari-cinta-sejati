// Midtrans Snap: membuat halaman bayar & memeriksa tanda tangan notifikasi.
const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');

export function produksi(env) { return String(env.MIDTRANS_PRODUCTION || '').toLowerCase() === 'true'; }

export async function buatTransaksi(env, { orderId, harga, nama, paket, pelanggan, kembaliKe }) {
  const url = produksi(env) ? 'https://app.midtrans.com/snap/v1/transactions' : 'https://app.sandbox.midtrans.com/snap/v1/transactions';
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json', authorization: 'Basic ' + btoa(env.MIDTRANS_SERVER_KEY + ':') },
    body: JSON.stringify({
      transaction_details: { order_id: orderId, gross_amount: harga },
      item_details: [{ id: paket, price: harga, quantity: 1, name: String(nama).slice(0, 50) }],
      customer_details: { first_name: String(pelanggan).slice(0, 30) },
      // tanpa enabled_payments: Midtrans menampilkan semua metode yang sudah aktif di akunmu (QRIS, VA, GoPay, dll.)
      expiry: { unit: 'minutes', duration: 60 },
      callbacks: { finish: kembaliKe },
    }),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || !d.redirect_url) throw new Error('Midtrans menolak: ' + r.status + ' ' + JSON.stringify(d.error_messages || d));
  return d; // { token, redirect_url }
}

// signature_key = SHA512(order_id + status_code + gross_amount + ServerKey)
export async function tandaSah(env, n) {
  if (!n || !n.signature_key || !env.MIDTRANS_SERVER_KEY) return false;
  const teks = String(n.order_id) + String(n.status_code) + String(n.gross_amount) + env.MIDTRANS_SERVER_KEY;
  const h = hex(await crypto.subtle.digest('SHA-512', new TextEncoder().encode(teks)));
  return h === String(n.signature_key).toLowerCase();
}

export function lunas(n) { return n.transaction_status === 'settlement' || (n.transaction_status === 'capture' && n.fraud_status === 'accept'); }
export function gagal(n) { return ['expire', 'cancel', 'deny', 'failure'].includes(n.transaction_status); }
