// =====================================================================
//  Lapisan data generik dengan dua mesin:
//   - DBFirebase: Firebase Realtime Database (mode online, multiplayer)
//   - DBLokal: tiruan kecil Realtime Database di browser (mode lokal);
//     tab-tab di browser yang sama saling tersambung lewat BroadcastChannel.
//  Antarmuka: uid, mode, now(), set(), update(), push(), get(), on(), hapusSaatPutus()
// =====================================================================
import { CFG, LS } from './common.js';

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
  constructor() {
    this.mode = 'lokal';
    // tiap tab = satu tamu, supaya interaksi antar-user bisa dicoba dengan dua tab
    let uid = null;
    try { uid = sessionStorage.getItem('ptmcs_uid'); } catch (e) {}
    if (!uid) { uid = 'u' + Math.random().toString(36).slice(2, 12); try { sessionStorage.setItem('ptmcs_uid', uid); } catch (e) {} }
    this.uid = uid;
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
  get(p) { return Promise.resolve(salin(this._ambil(p))); }
  on(p, cb, { limit } = {}) {
    const l = { p, cb, limit };
    this.pendengar.add(l);
    queueMicrotask(() => this._kirim(l));
    return () => this.pendengar.delete(l);
  }
  hapusSaatPutus(p) { this.putus.push(p); }
  // mode lokal tidak punya akun: Direktur demo pakai PIN dari config.js
  async masukDirektur(email, pin) {
    if (!CFG.pinDemo || String(pin) !== String(CFG.pinDemo)) throw new Error('PIN demo salah.');
    await this.set('peran/' + this.uid, 'direktur');
  }
  async keluarDirektur() { await this.set('peran/' + this.uid, null); }
}

// ---------------------------------------------------------------- FIREBASE
class DBFirebase {
  static async buat(cfg) {
    const [{ initializeApp }, A, D] = await Promise.all([import(fbUrl('app')), import(fbUrl('auth')), import(fbUrl('database'))]);
    const app = initializeApp(cfg);
    const auth = A.getAuth(app);
    let user = await new Promise(r => { const un = A.onAuthStateChanged(auth, u => { un(); r(u); }); });
    if (!user) user = (await A.signInAnonymously(auth)).user;
    const db = new DBFirebase();
    Object.assign(db, { A, D, auth, rdb: D.getDatabase(app), uid: user.uid, anon: user.isAnonymous, email: user.email || '', mode: 'online', offset: 0 });
    D.onValue(D.ref(db.rdb, '.info/serverTimeOffset'), s => { db.offset = s.val() || 0; });
    return db;
  }
  r(p) { return this.D.ref(this.rdb, p); }
  now() { return Date.now() + this.offset; }
  set(p, v) { return this.D.set(this.r(p), v).catch(e => { console.warn('set', p, e.message); throw e; }); }
  update(p, o) { return this.D.update(this.r(p), o).catch(e => { console.warn('update', p, e.message); throw e; }); }
  push(p, v) { const ref = this.D.push(this.r(p)); this.D.set(ref, v).catch(e => console.warn('push', p, e.message)); return ref.key; }
  async get(p) { return (await this.D.get(this.r(p))).val(); }
  on(p, cb, { limit } = {}) {
    const q = limit ? this.D.query(this.r(p), this.D.limitToLast(limit)) : this.r(p);
    return this.D.onValue(q, s => cb(s.val()), e => { console.warn('baca', p, e.message); cb(null); });
  }
  hapusSaatPutus(p) { this.D.onDisconnect(this.r(p)).remove(); }
  async masukDirektur(email, sandi) {
    await this.A.signInWithEmailAndPassword(this.auth, email, sandi);
    location.reload();
  }
  async keluarDirektur() { await this.A.signOut(this.auth); location.reload(); }
}

export async function bukaDB() {
  if (CFG.firebase && CFG.firebase.databaseURL) {
    try { return await DBFirebase.buat(CFG.firebase); }
    catch (e) { console.warn('Firebase gagal, pindah ke mode lokal:', e); }
  }
  return new DBLokal();
}
