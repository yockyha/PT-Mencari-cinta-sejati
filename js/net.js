// Lapisan jaringan: Firebase (online) atau BroadcastChannel + localStorage (lokal).
// Antarmuka keduanya sama, jadi kode kantor tidak peduli sedang mode apa.
import { CFG, LS, bersih, sensor } from './common.js';

const FBV = '10.14.1';
const fbUrl = n => `https://www.gstatic.com/firebasejs/${FBV}/firebase-${n}.js`;

function emitter() {
  const ls = {};
  return {
    on(e, f) { (ls[e] ||= []).push(f); },
    emit(e, ...a) { (ls[e] || []).forEach(f => { try { f(...a); } catch (x) { console.error(x); } }); },
  };
}

// ---------------------------------------------------------------- LOKAL
function netLokal() {
  const E = emitter();
  const uid = LS.get('uid_lokal') || ('l' + Math.random().toString(36).slice(2, 10));
  LS.set('uid_lokal', uid);
  let bc = null; try { bc = new BroadcastChannel('ptmcs'); } catch (e) {}
  const pemain = new Map();
  let saya = null;

  const kirim = m => { try { bc && bc.postMessage(m); } catch (e) {} };
  if (bc) bc.onmessage = ({ data: m }) => {
    if (!m || m.uid === uid) return;
    if (m.k === 'pos') { pemain.set(m.uid, { ...m.p, t: Date.now() }); E.emit('pemain', pemain); }
    else if (m.k === 'pergi') { pemain.delete(m.uid); E.emit('pemain', pemain); }
    else if (m.k === 'chat') E.emit('chat', m.c);
    else if (m.k === 'papan') E.emit('papan', LS.get('papan', []));
    else if (m.k === 'karyawan') E.emit('karyawan', LS.get('karyawan', []));
    else if (m.k === 'halo' && saya) kirim({ k: 'pos', uid, p: saya });
  };
  setInterval(() => {
    let ubah = false;
    for (const [k, p] of pemain) if (Date.now() - p.t > 6000) { pemain.delete(k); ubah = true; }
    if (ubah) E.emit('pemain', pemain);
    if (saya) kirim({ k: 'pos', uid, p: saya });
  }, 2000);
  addEventListener('pagehide', () => kirim({ k: 'pergi', uid }));

  return {
    mode: 'lokal', uid, on: E.on,
    async mulai() {
      kirim({ k: 'halo', uid });
      setTimeout(() => { E.emit('papan', LS.get('papan', [])); E.emit('karyawan', LS.get('karyawan', [])); E.emit('pemain', pemain); }, 0);
    },
    posisi(p) { saya = p; kirim({ k: 'pos', uid, p }); },
    chat(teks) {
      const c = { uid, n: saya?.n || 'Karyawan', m: sensor(bersih(teks, 120)), t: Date.now() };
      E.emit('chat', c); kirim({ k: 'chat', c });
    },
    papan(teks, n) {
      const l = LS.get('papan', []); l.push({ n, m: sensor(bersih(teks, 80)), t: Date.now() });
      LS.set('papan', l.slice(-10)); E.emit('papan', LS.get('papan', [])); kirim({ k: 'papan' });
    },
    daftar(d) {
      const l = LS.get('karyawan', []).filter(k => k.uid !== uid);
      const lama = LS.get('karyawan', []).find(k => k.uid === uid);
      l.push({ uid, n: d.n, ig: d.ig || '', d: d.d || '', t: lama ? lama.t : Date.now() });
      l.sort((a, b) => a.t - b.t);
      LS.set('karyawan', l.slice(-2000)); E.emit('karyawan', l); kirim({ k: 'karyawan' });
      return { ok: true };
    },
  };
}

// ---------------------------------------------------------------- FIREBASE
async function netFirebase(cfg, { kehadiran = true } = {}) {
  const [{ initializeApp }, A, D] = await Promise.all([import(fbUrl('app')), import(fbUrl('auth')), import(fbUrl('database'))]);
  const app = initializeApp(cfg);
  const auth = A.getAuth(app);
  const db = D.getDatabase(app);
  const user = auth.currentUser || (await A.signInAnonymously(auth)).user;
  const uid = user.uid;
  const E = emitter();
  const pemain = new Map();
  let offset = 0;
  D.onValue(D.ref(db, '.info/serverTimeOffset'), s => { offset = s.val() || 0; });
  const kini = () => Date.now() + offset;
  let saya = null, meRef = null;

  const net = {
    mode: 'online', uid, on: E.on,
    async mulai() {
      if (kehadiran) {
        meRef = D.ref(db, 'online/' + uid);
        D.onDisconnect(meRef).remove();
        const ol = D.ref(db, 'online');
        const up = s => { if (s.key === uid) return; const v = s.val(); if (v) { pemain.set(s.key, { ...v, t: Date.now() }); E.emit('pemain', pemain); } };
        D.onChildAdded(ol, up); D.onChildChanged(ol, up);
        D.onChildRemoved(ol, s => { pemain.delete(s.key); E.emit('pemain', pemain); });
        // detak jantung supaya tidak dianggap pergi
        setInterval(() => { if (saya) D.set(meRef, { ...saya, t: D.serverTimestamp() }).catch(() => {}); }, 15000);
        const cq = D.query(D.ref(db, 'chat'), D.orderByChild('t'), D.startAt(kini() - 10 * 60e3), D.limitToLast(30));
        D.onChildAdded(cq, s => E.emit('chat', s.val()));
      }
      D.onValue(D.query(D.ref(db, 'papan'), D.limitToLast(10)), s => {
        const l = []; s.forEach(c => { l.push(c.val()); }); E.emit('papan', l);
      });
      D.onValue(D.query(D.ref(db, 'karyawan'), D.orderByChild('t'), D.limitToLast(2000)), s => {
        const l = []; s.forEach(c => { l.push(c.val()); }); E.emit('karyawan', l);
      });
    },
    posisi(p) { saya = p; if (meRef) D.set(meRef, { ...p, t: D.serverTimestamp() }).catch(() => {}); },
    chat(teks) {
      D.push(D.ref(db, 'chat'), { uid, n: (saya?.n || 'Karyawan').slice(0, 30), m: sensor(bersih(teks, 120)), t: D.serverTimestamp() }).catch(() => {});
    },
    papan(teks, n) {
      D.push(D.ref(db, 'papan'), { uid, n: n.slice(0, 30), m: sensor(bersih(teks, 80)), t: D.serverTimestamp() }).catch(() => {});
    },
    async daftar(d) {
      const r = D.ref(db, 'karyawan/' + uid);
      try {
        const lama = (await D.get(r)).val();
        await D.set(r, { uid, n: d.n.slice(0, 20), ig: (d.ig || '').slice(0, 30), d: (d.d || '').slice(0, 40), t: lama?.t || D.serverTimestamp() });
        return { ok: true };
      } catch (e) { return { ok: false }; }
    },
  };
  return net;
}

export async function buatNet(opsi = {}) {
  if (CFG.firebase && CFG.firebase.databaseURL) {
    try { return await netFirebase(CFG.firebase, opsi); }
    catch (e) { console.warn('Firebase gagal, pindah ke mode lokal:', e); }
  }
  return netLokal();
}
