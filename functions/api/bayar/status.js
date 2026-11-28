// GET /api/bayar/status → apakah pembayaran otomatis (Midtrans) sudah siap dipakai.
// Dipakai browser untuk menampilkan tombol "⚡ Bayar otomatis" tanpa perlu mengubah config.js.
export async function onRequestGet({ env }) {
  const siap = !!(env.MIDTRANS_SERVER_KEY && env.FIREBASE_DB_SECRET && env.FIREBASE_DB_URL && env.FIREBASE_API_KEY);
  const kurang = ['MIDTRANS_SERVER_KEY', 'FIREBASE_DB_SECRET', 'FIREBASE_DB_URL', 'FIREBASE_API_KEY'].filter(k => !env[k]);
  return new Response(JSON.stringify({ aktif: siap, produksi: String(env.MIDTRANS_PRODUCTION || '').toLowerCase() === 'true', kurang }), {
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}
