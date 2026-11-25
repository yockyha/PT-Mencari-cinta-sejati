// POST /api/turn  →  daftar server ICE (STUN + TURN) untuk telepon suara antar-tamu.
// Body: { idToken }  (hanya pengguna yang login Firebase yang dilayani)
// TURN memakai Cloudflare Realtime: isi variabel TURN_KEY_ID & TURN_KEY_API_TOKEN
// di Cloudflare Pages → Settings → Variables and Secrets. Tanpa itu, hanya STUN.
import { uidDariToken } from '../../server/firebase.js';

const STUN = [{ urls: ['stun:stun.cloudflare.com:3478', 'stun:stun.l.google.com:19302'] }];
// apiKey Firebase bersifat publik (sama dengan config.js); dipakai bila FIREBASE_API_KEY belum diisi
const KUNCI_PUBLIK = 'AIzaSyDRzE1RCfgW5jObialv6uKEBvxBaHxCQtI';
const balas = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

export async function onRequestPost({ request, env }) {
  const b = await request.json().catch(() => ({}));
  const uid = await uidDariToken({ ...env, FIREBASE_API_KEY: env.FIREBASE_API_KEY || KUNCI_PUBLIK }, b.idToken).catch(() => null);
  if (!uid) return balas({ error: 'Sesi tidak sah.' }, 401);
  if (!env.TURN_KEY_ID || !env.TURN_KEY_API_TOKEN) return balas({ iceServers: STUN, turn: false });
  try {
    const r = await fetch(`https://rtc.live.cloudflare.com/v1/turn/keys/${encodeURIComponent(env.TURN_KEY_ID)}/credentials/generate-ice-servers`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.TURN_KEY_API_TOKEN}`, 'content-type': 'application/json' },
      body: JSON.stringify({ ttl: 7200 }),
    });
    if (!r.ok) throw new Error('TURN ' + r.status);
    const j = await r.json();
    const ice = Array.isArray(j.iceServers) ? j.iceServers : j.iceServers ? [j.iceServers] : [];
    return balas({ iceServers: [...STUN, ...ice], turn: ice.length > 0 });
  } catch (e) {
    console.error('turn', e);
    return balas({ iceServers: STUN, turn: false });
  }
}
