// POST /api/turn  →  daftar server ICE (STUN + TURN) untuk telepon suara antar-tamu.
// Body: { idToken }  (hanya pengguna yang login Firebase yang dilayani)
// Penyedia TURN (pilih salah satu, isi di Cloudflare Pages → Settings → Variables and Secrets):
//  - Metered Open Relay (gratis 20 GB/bulan, tanpa kartu): METERED_APP (nama aplikasi, mis. "jodohonline")
//    dan METERED_API_KEY
//  - Cloudflare Realtime: TURN_KEY_ID dan TURN_KEY_API_TOKEN
// Tanpa keduanya, hanya STUN (umumnya lancar di WiFi).
import { uidDariToken } from '../../server/firebase.js';

const STUN = [{ urls: ['stun:stun.cloudflare.com:3478', 'stun:stun.l.google.com:19302'] }];
// apiKey Firebase bersifat publik (sama dengan config.js); dipakai bila FIREBASE_API_KEY belum diisi
const KUNCI_PUBLIK = 'AIzaSyDRzE1RCfgW5jObialv6uKEBvxBaHxCQtI';
const balas = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

async function dariMetered(env) {
  const app = String(env.METERED_APP).replace(/^https?:\/\//, '').replace(/\.metered\.live.*$/, '');
  const r = await fetch(`https://${encodeURIComponent(app)}.metered.live/api/v1/turn/credentials?apiKey=${encodeURIComponent(env.METERED_API_KEY)}`);
  if (!r.ok) throw new Error('Metered ' + r.status);
  const j = await r.json();
  return Array.isArray(j) ? j : j.iceServers || [];
}

async function dariCloudflare(env) {
  const r = await fetch(`https://rtc.live.cloudflare.com/v1/turn/keys/${encodeURIComponent(env.TURN_KEY_ID)}/credentials/generate-ice-servers`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.TURN_KEY_API_TOKEN}`, 'content-type': 'application/json' },
    body: JSON.stringify({ ttl: 7200 }),
  });
  if (!r.ok) throw new Error('Cloudflare TURN ' + r.status);
  const j = await r.json();
  return Array.isArray(j.iceServers) ? j.iceServers : j.iceServers ? [j.iceServers] : [];
}

export async function onRequestPost({ request, env }) {
  const b = await request.json().catch(() => ({}));
  const uid = await uidDariToken({ ...env, FIREBASE_API_KEY: env.FIREBASE_API_KEY || KUNCI_PUBLIK }, b.idToken).catch(() => null);
  if (!uid) return balas({ error: 'Sesi tidak sah.' }, 401);
  const penyedia = env.METERED_APP && env.METERED_API_KEY ? dariMetered : env.TURN_KEY_ID && env.TURN_KEY_API_TOKEN ? dariCloudflare : null;
  if (!penyedia) return balas({ iceServers: STUN, turn: false, alasan: 'Variabel TURN belum terbaca (METERED_APP / METERED_API_KEY). Cek nama variabel, lingkungan Production, lalu Retry deployment.' });
  try {
    const ice = (await penyedia(env)).filter(s => s && s.urls);
    return balas({ iceServers: [...STUN, ...ice], turn: ice.length > 0, ...(ice.length ? {} : { alasan: 'Penyedia TURN tidak mengirim server.' }) });
  } catch (e) {
    console.error('turn', e);
    return balas({ iceServers: STUN, turn: false, alasan: 'Penyedia TURN menolak: ' + String(e && e.message || e).slice(0, 80) });
  }
}
