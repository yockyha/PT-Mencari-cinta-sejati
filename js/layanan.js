// =====================================================================
//  Layanan kantor di atas lapisan data: tamu, chat, papan, curhat,
//  ajakan ngobrol, obrolan pribadi, suka & match, laporan, dan
//  alat Direktur/Staf. Struktur data ini sama dengan database.rules.json.
// =====================================================================
import { TS } from './db.js?v=202611251457';
import { CFG, bersih, sensor, rupiah } from './common.js?v=202611251457';

export function buatLayanan(db) {
  const uid = db.uid;
  const ruang = (a, b) => [a, b].sort().join('_');
  const lawan = r => r.split('_').find(u => u !== uid);

  const L = {
    db, uid, mode: db.mode, ruang, lawan,

    // ---- kehadiran
    hadir(p) { return db.set('online/' + uid, { ...p, t: TS }).catch(() => {}); },
    pergi() { return db.set('online/' + uid, null).catch(() => {}); },

    // ---- buku tamu
    async daftarTamu(d) {
      const lama = await db.get('tamu/' + uid).catch(() => null);
      return db.set('tamu/' + uid, { uid, n: d.n, ig: d.ig || '', tj: d.tj, t: (lama && lama.t) || TS }).catch(() => {});
    },

    // ---- pendaftaran & keanggotaan
    daftarAkses(d) { return db.set('pendaftaran/' + uid, { ...d, uid, status: 'menunggu', t: TS }); },
    batalDaftar() { return db.set('pendaftaran/' + uid, null); },
    async terimaPendaftar(target, d, peran = 'tamu') {
      const upd = {
        [`anggota/${target}`]: { n: d.n, tj: d.tj, sejak: TS, oleh: uid },
        [`tamu/${target}`]: { uid: target, n: d.n, ig: d.ig || '', tj: d.tj, t: TS },
        [`pendaftaran/${target}`]: null,
      };
      if (peran === 'staf') upd[`peran/${target}`] = 'staf';
      await db.update('', upd);
      return L.kirimNotif(target, peran === 'staf'
        ? `Selamat ${d.n}! Pendaftaranmu diterima dan kamu diangkat menjadi Staf 🛡`
        : `Selamat ${d.n}! Pendaftaranmu diterima. Kamu resmi menjadi tamu. Selamat bersenang-senang 💖`);
    },
    tolakPendaftar(target, alasan) { return db.update('pendaftaran/' + target, { status: 'ditolak', alasanTolak: bersih(alasan, 160) }); },
    cabutAnggota(target) { return db.update('', { [`anggota/${target}`]: null, [`peran/${target}`]: null, [`online/${target}`]: null }); },
    ubahAnggota(target, o) { return db.update('', { [`anggota/${target}/n`]: o.n, [`anggota/${target}/tj`]: o.tj, [`tamu/${target}/n`]: o.n, [`tamu/${target}/tj`]: o.tj }); },
    setExpBeli(target, n) { return db.set('expBeli/' + target, Math.max(0, n | 0)); },
    catatRiwayat(d) { return db.push('riwayat', { ...d, oleh: uid, t: TS }); },

    // ---- ruang publik
    chat(n, m) { return db.push('chat', { uid, n, m: sensor(bersih(m, 120)), t: TS }); },
    papan(n, m) { return db.push('papan', { uid, n, m: sensor(bersih(m, 80)), t: TS }); },
    curhat(m) {
      const k = db.push('curhat', { m: sensor(bersih(m, 300)), t: TS });
      db.set('curhatPemilik/' + k, uid).catch(() => {});
      return k;
    },
    peluk(id, nyala) { return db.set(`curhat/${id}/peluk/${uid}`, nyala ? true : null).catch(() => {}); },
    balasCurhat(id, n, m) { return db.push(`curhat/${id}/balas`, { uid, n, m: sensor(bersih(m, 160)), t: TS }); },
    saran(n, m) { return db.push('saran', { dari: uid, n, m: sensor(bersih(m, 300)), t: TS }); },
    lapor(target, nTarget, alasan) { return db.push('laporan', { dari: uid, target, n: bersih(nTarget, 30), alasan: bersih(alasan, 120), t: TS }); },

    // ---- ajakan ngobrol & obrolan pribadi
    undang(ke, nSaya) { return db.set(`undangan/${ke}/${uid}`, { n: nSaya, t: TS }); },
    tolak(dari) { return db.set(`undangan/${uid}/${dari}`, null).catch(() => {}); },
    async terima(dari, nSaya, nDia) {
      const r = ruang(uid, dari);
      await db.set(`dm/${r}/ok`, true);
      await db.set(`dmku/${uid}/${r}`, { n: nDia, u: dari, t: TS, baru: false });
      await db.set(`dmku/${dari}/${r}`, { n: nSaya, u: uid, t: TS, baru: true });
      await db.set(`undangan/${uid}/${dari}`, null);
      return r;
    },
    kirimDm(r, n, m) {
      const teks = sensor(bersih(m, 300));
      db.push(`dm/${r}/pesan`, { uid, n, m: teks, t: TS });
      db.update(`dmku/${uid}/${r}`, { t: TS, baru: false }).catch(() => {});
      db.update(`dmku/${lawan(r)}/${r}`, { t: TS, baru: true }).catch(() => {});
    },
    bacaDm(r) { return db.update(`dmku/${uid}/${r}`, { baru: false }).catch(() => {}); },
    tutupDm(r) { return db.set(`dmku/${uid}/${r}`, null).catch(() => {}); },

    // ---- suka & match
    async suka(target, nSaya, nDia) {
      const jml = (await db.get('jumlahSuka/' + target).catch(() => 0)) || 0;
      await db.update('', { [`suka/${target}/${uid}`]: TS, [`jumlahSuka/${target}`]: jml + 1 });
      const balik = await db.get(`suka/${uid}/${target}`).catch(() => null);
      if (!balik) return false;
      await db.set(`match/${uid}/${target}`, { n: nDia, t: TS });
      await db.set(`match/${target}/${uid}`, { n: nSaya, t: TS });
      const r = ruang(uid, target);
      await db.set(`dm/${r}/ok`, true);
      await db.set(`dmku/${uid}/${r}`, { n: nDia, u: target, t: TS, baru: false });
      await db.set(`dmku/${target}/${r}`, { n: nSaya, u: uid, t: TS, baru: true });
      return true;
    },
    async batalSuka(target) {
      const jml = (await db.get('jumlahSuka/' + target).catch(() => 0)) || 0;
      return db.update('', { [`suka/${target}/${uid}`]: null, [`jumlahSuka/${target}`]: Math.max(0, jml - 1) }).catch(() => {});
    },

    // ---- alat Staf & Direktur (dijaga aturan server)
    usir(target, menit, alasan, n) {
      return db.set('ban/' + target, { sampai: db.now() + menit * 60000, alasan: bersih(alasan, 100), n: bersih(n, 30), oleh: uid, t: TS })
        .then(() => db.set('online/' + target, null).catch(() => {}));
    },
    ampuni(target) { return db.set('ban/' + target, null); },
    hapus(path) { return db.set(path, null); },
    setPeran(target, peran) { return db.set('peran/' + target, peran || null); },
    umumkan(m) { return db.set('pengumuman', { m: bersih(m, 200), t: TS, oleh: uid }); },
    setelan(o) { return db.update('setelan', o); },
    simpanMading(list) { return db.set('mading', list); },

    // ---- EXP & tugas (EXP dari tugas dicatat sendiri, dibatasi aturan server)
    async tambahExp(jumlah, kunciTugas) {
      const lama = (await db.get('exp/' + uid).catch(() => null)) || { n: 0 };
      const upd = { [`exp/${uid}`]: { n: (lama.n || 0) + Math.min(60, Math.max(0, jumlah | 0)), t: TS } };
      if (kunciTugas) upd[`tugas/${uid}/${kunciTugas}`] = true;
      return db.update('', upd);
    },
    skor(hari, n, s) { return db.set(`skor/${hari}/${uid}`, { n, s, t: TS }); },

    // ---- acara
    ikutAcara(id, ya) { return db.set(`ikutAcara/${id}/${uid}`, ya ? true : null); },
    hadirAcara(id) { return db.set(`hadirAcara/${id}/${uid}`, TS); },
    buatAcara(a) { return db.push('acara', { ...a, oleh: uid, t: TS }); },

    // ---- toko & notifikasi
    // d: { paket, jenis: 'diamond'|'paket'|'donasi', metode: 'qris'|'bca'|'bri'|'lain', nominal, kode, n, pesan?, tampil? }
    pesan(d) { return db.push('pesanan', { ...d, uid, t: TS }); },

    // ---- Diamond: beli barang (diamond terpotong & barang tercatat dalam satu transaksi)
    async beliBarang(id, harga) {
      const saldo = (await db.get('diamond/' + uid).catch(() => 0)) || 0;
      if (saldo < harga) return { ok: false, alasan: 'kurang', saldo };
      await db.update('', { [`diamond/${uid}`]: saldo - harga, [`milik/${uid}/${id}`]: true });
      return { ok: true, saldo: saldo - harga };
    },
    async beriDiamond(target, n) {
      const lama = (await db.get('diamond/' + target).catch(() => 0)) || 0;
      return db.set('diamond/' + target, Math.max(0, lama + n));
    },
    setDiamond(target, n) { return db.set('diamond/' + target, Math.max(0, n | 0)); },
    beriBarang(target, id) { return db.set(`milik/${target}/${id}`, true); },
    async catatDonatur(target, n, nominal, tampil) {
      const lama = (await db.get('donatur/' + target).catch(() => null)) || {};
      return db.set('donatur/' + target, { n: bersih(n, 20), total: (lama.total || 0) + nominal, kali: (lama.kali || 0) + 1, tampil: tampil !== false, t: TS });
    },
    // ---- proses pesanan (dipakai Dashboard & panel di kantor)
    cariPaket(v) {
      if (v.jenis === 'donasi') return { id: 'donasi', nama: 'Donasi', harga: v.nominal };
      if (v.jenis === 'diamond') return ((CFG.diamond && CFG.diamond.paket) || []).find(p => p.id === v.paket) || null;
      return ((CFG.toko && CFG.toko.paket) || []).find(p => p.id === v.paket) || null;
    },
    async setujuiPesanan(id, v) {
      const p = L.cariPaket(v);
      if (!p) throw new Error('Paket ' + v.paket + ' tidak ada di config.js');
      let pesan;
      if (v.jenis === 'diamond') { await L.beriDiamond(v.uid, p.diamond); pesan = `💠 ${p.diamond} Diamond sudah masuk ke akunmu. Selamat belanja di Lemari Diamond!`; }
      else if (v.jenis === 'donasi') { await L.catatDonatur(v.uid, v.n, v.nominal, v.tampil); pesan = `Terima kasih atas donasi ${rupiah(v.nominal)}! 💖 Dukunganmu sangat berarti untuk kantor.`; }
      else {
        if (p.exp) await L.beriExp(v.uid, p.exp);
        if (p.vipHari) await L.beriVip(v.uid, p.vipHari);
        pesan = `Pembelian ${p.nama} disetujui. Terima kasih sudah mendukung ${CFG.namaPT}! 💖`;
      }
      await L.catatRiwayat({ uid: v.uid, n: v.n, paket: v.paket, jenis: v.jenis || 'paket', nama: v.nama || p.nama, harga: v.nominal || p.harga, metode: v.metode || '', kode: v.kode || '' });
      await L.kirimNotif(v.uid, pesan);
      await L.hapus('pesanan/' + id);
    },
    async tolakPesanan(id, v, alasan) {
      await L.kirimNotif(v.uid, alasan || `Pembayaran ${rupiah(v.nominal || 0)} untuk ${v.nama || v.paket} belum kami temukan. Pastikan nominalnya persis, lalu hubungi Direktur.`);
      await L.hapus('pesanan/' + id);
    },
    terbitkanKatalog(daftar) { return db.set('katalog', Object.fromEntries(daftar.map(x => [x.id, { nama: x.nama, harga: x.harga }]))); },
    async beriExp(target, jumlah) {
      const lama = (await db.get('expBeli/' + target).catch(() => 0)) || 0;
      return db.set('expBeli/' + target, lama + jumlah);
    },
    async beriVip(target, hari) {
      const lama = (await db.get('vip/' + target).catch(() => null)) || {};
      const dari = Math.max(db.now(), lama.sampai || 0);
      return db.set('vip/' + target, { sampai: dari + hari * 86400e3 });
    },
    kirimNotif(target, m) { return db.push(`notif/${target}`, { m: bersih(m, 200), t: TS }); },
    hapusNotif(id) { return db.set(`notif/${uid}/${id}`, null).catch(() => {}); },
  };
  return L;
}
