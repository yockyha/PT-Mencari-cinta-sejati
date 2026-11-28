// =====================================================================
//  Lapisan data generik dengan dua mesin:
//   - DBFirebase: Firebase Realtime Database (mode online, multiplayer)
//   - DBLokal: tiruan kecil Realtime Database di browser (mode lokal);
//     tab-tab di browser yang sama saling tersambung lewat BroadcastChannel.
//  Antarmuka: uid, mode, now(), set(), update(), push(), kunci(), get(), on(), hapusSaatPutus()
// =====================================================================
import { CFG, LS, emailDari } from './common.js?v=202611280641';

export const TS = { '.sv': 'timestamp' };
const FBV = '10.14.1';
const fbUrl = n => `https://www.gstatic.com/firebasejs/${FBV}/firebase-${n}.js`;

const bagi = p => String(p).split('/').filter(Boolean);
const salin = v => (v === undefined || v === null ? null : JSON.parse(JSON.stringify(v)));
function isiWaktu(v, now) {
  if (v && typeof v === 'object') {
    if (v['.sv'] === 'timestamp') return now;
    const o = {};
    for (const k in v) o[k] = isiWaktu(v[k], now);
    return o;
  }
  return v;
}
const tumpang = (a, b) => a === b || a.startsWith(b + '/') || b.startsWith(a + '/') || !a || !b;
let _urut = 0;
export function kunciBaru() {
  const t = Date.now().toString(36).padStart(9, '0');
  return t + (_urut++ % 1296).toString(36).padStart(2, '0') + Math.random().toString(36).slice(2, 7);
}

// ---------------------------------------------------------------- LOKAL
class DBLokal {
  constructor({ kantor = false } = {}) {
    this.mode = 'lokal';
    // Satu browser = satu orang (uid utama di localStorage), dipakai dashboard & kartu tamu.
    // Khusus halaman kantor: tab kantor KEDUA yang dibuka bersamaan dianggap tamu lain,
    // supaya interaksi antar-user bisa dicoba dengan dua tab.
    let utama = LS.get('uid_utama');
    if (!utama) { utama = 'u' + Math.random().toString(36).slice(2, 12); LS.set('uid_utama', utama); }
    let uid = utama;
    if (kantor) {
      let sesi = null;
      try { sesi = sessionStorage.getItem('ptmcs_uid'); } catch (e) {}
      const aktif = LS.get('kantorAktif');
      if (!sesi) sesi = aktif && aktif.uid === utama && Date.now() - aktif.t < 6000 ? 'u' + Math.random().toString(36).slice(2, 12) : utama;
      try { sessionStorage.setItem('ptmcs_uid', sesi); } catch (e) {}
      uid = sesi;
      if (uid === utama) { const detak = () => LS.set('kantorAktif', { uid, t: Date.now() }); detak(); setInterval(detak, 2000); addEventListener('pagehide', () => LS.set('kantorAktif', null)); }
    }
    this.uid = uid;
    this.utama = uid === utama;
    this.anon = true;
    this.root = LS.get('db', {}) || {};
    delete this.root.online;
    this.pendengar = new Set();
    this.kotor = new Set();
    this.putus = [];
    try {
      this.bc = new BroadcastChannel('ptmcs-db');
      this.bc.onmessage = e => {
        if (e.data && e.data.k === 'halo') { const saya = this._ambil('online/' + this.uid); if (saya) this.bc.postMessage({ k: 'set', p: 'online/' + this.uid, v: saya }); return; }
        this._terap(e.data);
      };
      this.bc.postMessage({ k: 'halo' });
    } catch (e) { this.bc = null; }
    addEventListener('pagehide', () => { for (const p of this.putus) this._op({ k: 'set', p, v: null }); });
    setInterval(() => this._bersihOnline(), 5000);
  }
  now() { return Date.now(); }
  _ambil(p) {
    let n = this.root;
    for (const k of bagi(p)) { if (n === null || typeof n !== 'object') return null; n = n[k]; }
    if (n && typeof n === 'object' && !Object.keys(n).length) return null;
    return n === undefined ? null : n;
  }
  _taruh(p, v) {
    const ks = bagi(p);
    if (!ks.length) { this.root = v || {}; return; }
    let n = this.root;
    for (let i = 0; i < ks.length - 1; i++) {
      if (typeof n[ks[i]] !== 'object' || n[ks[i]] === null) n[ks[i]] = {};
      n = n[ks[i]];
    }
    const k = ks[ks.length - 1];
    if (v === null || v === undefined) delete n[k]; else n[k] = v;
  }
  _op(op) { this._terap(op); try { this.bc && this.bc.postMessage(op); } catch (e) {} }
  _terap(op) {
    if (!op || !op.k) return;
    if (op.k === 'set') this._taruh(op.p, salin(op.v));
    else if (op.k === 'update') for (const k in op.v) this._taruh(op.p + '/' + k, salin(op.v[k]));
    const atas = bagi(op.p)[0];
    if (op.k === 'set' && ['chat', 'papan', 'curhat', 'laporan', 'saran'].includes(atas)) {
      const o = this.root[atas];
      if (o && typeof o === 'object') { const ks = Object.keys(o).sort(); ks.slice(0, Math.max(0, ks.length - 80)).forEach(k => delete o[k]); }
    }
    this._tandai(op.p);
    clearTimeout(this._simpanT);
    this._simpanT = setTimeout(() => { const r = { ...this.root }; delete r.online; LS.set('db', r); }, 300);
  }
  _tandai(p) {
    for (const l of this.pendengar) if (tumpang(bagi(l.p).join('/'), bagi(p).join('/'))) this.kotor.add(l);
    if (!this._antre) { this._antre = true; queueMicrotask(() => { this._antre = false; const ls = [...this.kotor]; this.kotor.clear(); ls.forEach(l => this._kirim(l)); }); }
  }
  _kirim(l) {
    if (!this.pendengar.has(l)) return;
    let v = salin(this._ambil(l.p));
    if (l.limit && v && typeof v === 'object') { const o = {}; Object.keys(v).sort().slice(-l.limit).forEach(k => { o[k] = v[k]; }); v = o; }
    try { l.cb(v); } catch (e) { console.error(e); }
  }
  _bersihOnline() {
    const o = this._ambil('online'); if (!o) return;
    for (const k in o) if (!o[k] || o[k].t < Date.now() - 20000) this._terap({ k: 'set', p: 'online/' + k, v: null });
  }
  set(p, v) { this._op({ k: 'set', p, v: isiWaktu(salin(v), Date.now()) }); return Promise.resolve(); }
  update(p, o) { this._op({ k: 'update', p, v: isiWaktu(salin(o), Date.now()) }); return Promise.resolve(); }
  push(p, v) { const k = kunciBaru(); this.set(p + '/' + k, v); return k; }
  kunci() { return kunciBaru(); }   // kunci baru berurutan seperti push(), untuk update multi-path
  get(p) { return Promise.resolve(salin(this._ambil(p))); }
  on(p, cb, { limit } = {}) {
    const l = { p, cb, limit };
    this.pendengar.add(l);
    queueMicrotask(() => this._kirim(l));
    return () => this.pendengar.delete(l);
  }
  hapusSaatPutus(p) { this.putus.push(p); }
  // Mode lokal tidak punya server akun: Direktur demo memakai username & sandi dari config.js
  async masuk(username, sandi) {
    const d = CFG.direkturDemo;
    if (!d || String(username).trim().toLowerCase() !== String(d.username).toLowerCase() || String(sandi) !== String(d.password)) throw new Error('salah');
    await this.set('peran/' + this.uid, 'direktur');
    if (!this._ambil('anggota/' + this.uid)) await this.set('anggota/' + this.uid, { n: 'Direktur', tj: 'teman', sejak: Date.now(), oleh: this.uid });
    LS.set('dashMasuk', true);
    return this.uid;
  }
  async keluar() { LS.set('dashMasuk', false); await this.set('peran/' + this.uid, null); }
  get masukDashboard() { return !!LS.get('dashMasuk', false) && this._ambil('peran/' + this.uid) === 'direktur'; }
}

// ---------------------------------------------------------------- FIREBASE
class DBFirebase {
  // akun: '' = sesi tamu (aplikasi Firebase bawaan), 'direktur' = sesi Direktur terpisah,
  // supaya login Direktur tidak menimpa akun tamu di browser yang sama.
  // paksaTamu: kalau sesi bawaan ternyata akun email (login Direktur versi lama), ganti dengan tamu anonim.
  static async buat(cfg, { anonim = true, akun = '', paksaTamu = false } = {}) {
    const [{ initializeApp }, A, D] = await Promise.all([import(fbUrl('app')), import(fbUrl('auth')), import(fbUrl('database'))]);
    const app = akun ? initializeApp(cfg, akun) : initializeApp(cfg);
    const auth = A.getAuth(app);
    let user = await new Promise(r => { const un = A.onAuthStateChanged(auth, u => { un(); r(u); }); });
    if (user && paksaTamu && !user.isAnonymous) { await A.signOut(auth); user = null; }
    if (!user && anonim) user = (await A.signInAnonymously(auth)).user;
    const db = new DBFirebase();
    Object.assign(db, { A, D, auth, rdb: D.getDatabase(app), uid: user ? user.uid : null, anon: user ? user.isAnonymous : true, email: (user && user.email) || '', mode: 'online', offset: 0 });
    D.onValue(D.ref(db.rdb, '.info/serverTimeOffset'), s => { db.offset = s.val() || 0; });
    return db;
  }
  // Path kosong ('') = akar database. ref(db, '') ditolak Firebase, jadi pakai ref(db).
  r(p) { return p ? this.D.ref(this.rdb, p) : this.D.ref(this.rdb); }
  now() { return Date.now() + this.offset; }
  set(p, v) { return this.D.set(this.r(p), v).catch(e => { console.warn('set', p, e.message); throw e; }); }
  update(p, o) { return this.D.update(this.r(p), o).catch(e => { console.warn('update', p, e.message); throw e; }); }
  kunci(p) { return this.D.push(this.r(p)).key; }   // kunci push tanpa menulis (untuk update multi-path)
  push(p, v) { const ref = this.D.push(this.r(p)); this.D.set(ref, v).catch(e => console.warn('push', p, e.message)); return ref.key; }
  async get(p) { return (await this.D.get(this.r(p))).val(); }
  on(p, cb, { limit } = {}) {
    const q = limit ? this.D.query(this.r(p), this.D.limitToLast(limit)) : this.r(p);
    return this.D.onValue(q, s => cb(s.val()), e => { console.warn('baca', p, e.message); cb(null); });
  }
  hapusSaatPutus(p) { this.D.onDisconnect(this.r(p)).remove(); }
  async masuk(username, sandi) {
    const c = await this.A.signInWithEmailAndPassword(this.auth, emailDari(username), sandi);
    Object.assign(this, { uid: c.user.uid, anon: false, email: c.user.email || '' });
    return this.uid;
  }
  async keluar() { await this.A.signOut(this.auth); }
  // Token login (untuk server pembayaran otomatis memastikan siapa pembelinya)
  async idToken() { return this.auth.currentUser ? this.auth.currentUser.getIdToken() : ''; }
  get masukDashboard() { return !this.anon; }
}

// opsi.kantor: halaman kantor (tab kedua = tamu lain di mode lokal)
// opsi.anonim: masuk anonim otomatis bila belum login (false untuk dashboard)
export async function bukaDB(opsi = {}) {
  if (CFG.firebase && CFG.firebase.databaseURL) {
    try { return await DBFirebase.buat(CFG.firebase, opsi); }
    catch (e) { console.warn('Firebase gagal, pindah ke mode lokal:', e); }
  }
  return new DBLokal(opsi);
}
