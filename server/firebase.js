// Akses Firebase Realtime Database dari server (Cloudflare Pages Functions)
// memakai REST + Database Secret (hak admin, melewati aturan keamanan).
// Rahasia diambil dari variabel lingkungan Cloudflare, tidak pernah ke browser.

export function buatDb(env) {
  const URL = String(env.FIREBASE_DB_URL || '').replace(/\/+$/, '');
  const SECRET = env.FIREBASE_DB_SECRET;
  if (!URL || !SECRET) throw new Error('FIREBASE_DB_URL / FIREBASE_DB_SECRET belum diatur di Cloudflare');
  const alamat = p => `${URL}/${String(p).replace(/^\/+/, '')}.json?auth=${encodeURIComponent(SECRET)}`;
  const kirim = async (p, opsi = {}) => {
    const r = await fetch(alamat(p), opsi);
    if (!r.ok && r.status !== 412) throw new Error(`Firebase ${opsi.method || 'GET'} ${p}: ${r.status} ${await r.text()}`);
    return r;
  };
  const json = b => ({ body: JSON.stringify(b), headers: { 'content-type': 'application/json' } });
  const db = {
    async get(p) { return (await kirim(p)).json(); },
    async set(p, v) { await kirim(p, { method: 'PUT', ...json(v) }); },
    async update(p, v) { await kirim(p, { method: 'PATCH', ...json(v) }); },
    async push(p, v) { return (await (await kirim(p, { method: 'POST', ...json(v) })).json()).name; },
    async hapus(p) { await kirim(p, { method: 'DELETE' }); },
    // Ubah nilai secara atomik (aman bila dua permintaan datang bersamaan).
    // fn(lama) mengembalikan nilai baru, atau undefined untuk batal.
    async atomik(p, fn) {
      for (let i = 0; i < 8; i++) {
        const r = await kirim(p, { headers: { 'X-Firebase-ETag': 'true' } });
        const etag = r.headers.get('ETag'), lama = await r.json();
        const baru = fn(lama);
        if (baru === undefined) return { ok: false, lama };
        const w = await fetch(alamat(p), { method: 'PUT', headers: { 'content-type': 'application/json', 'if-match': etag }, body: JSON.stringify(baru) });
        if (w.ok) return { ok: true, lama, baru };
        if (w.status !== 412) throw new Error(`Firebase atomik ${p}: ${w.status} ${await w.text()}`);
      }
      throw new Error('Firebase atomik: terlalu banyak tabrakan di ' + p);
    },
  };
  return db;
}

// Pastikan ID token Firebase dari browser asli, kembalikan uid pemiliknya.
export async function uidDariToken(env, idToken) {
  if (!idToken) return null;
  const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(env.FIREBASE_API_KEY || '')}`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ idToken }),
  });
  if (!r.ok) return null;
  const d = await r.json();
  return (d.users && d.users[0] && d.users[0].localId) || null;
}

export const TS = { '.sv': 'timestamp' };
