// POST /api/bayar/notifikasi  ←  dipanggil Midtrans setiap status pembayaran berubah.
// Diamond/EXP/VIP/donasi masuk OTOMATIS saat lunas. Isi URL ini di
// Midtrans Dashboard → Settings → Payment → Notification URL.
import { buatDb } from '../../../server/firebase.js';
import { tandaSah, lunas, gagal } from '../../../server/midtrans.js';
import { klaim, lunasi, batalkan } from '../../../server/proses.js';

const ok = (pesan = 'ok') => new Response(pesan, { status: 200 });

export async function onRequestPost({ request, env }) {
  const n = await request.json().catch(() => null);
  if (!(await tandaSah(env, n))) return new Response('tanda tangan tidak sah', { status: 403 });
  try {
    const db = buatDb(env);
    const id = String(n.order_id);
    const v = await db.get('pesanan/' + id);
    if (!v) return ok('sudah diproses'); // sudah lunas/dibatalkan sebelumnya
    if (lunas(n)) {
      if (Math.round(parseFloat(n.gross_amount)) !== v.nominal) { console.error('nominal tidak cocok', id, n.gross_amount, v.nominal); return ok('nominal tidak cocok'); }
      const klaimed = await klaim(db, id);
      if (!klaimed) return ok('sedang/sudah diproses');
      await lunasi(db, id, klaimed, n.payment_type);
      return ok('lunas');
    }
    if (gagal(n) && v.status === 'menunggu') { await batalkan(db, id, v); return ok('dibatalkan'); }
    return ok('menunggu');
  } catch (e) {
    console.error('notifikasi', e);
    return new Response('gagal, coba lagi', { status: 500 }); // Midtrans akan mengirim ulang
  }
}
