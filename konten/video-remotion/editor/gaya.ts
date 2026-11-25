// Tampilan editor: gelap ala aplikasi edit video, aksen pink jodohonline.
export const CSS = `
.je-root{position:fixed;inset:0;z-index:1000;background:#141015;color:#f3e9ee;font:600 13px/1.4 Nunito,system-ui,sans-serif;padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px);--je-pink:#ff4f7b;--je-panel:#1e171c;--je-garis:#3a2c34;--je-redup:#b9a3ad;--je-kuning:#ffd23f}
.je-root *{box-sizing:border-box}
.je-muat{display:grid;place-items:center;height:100%;font-size:16px}
.je-app{display:grid;grid-template-rows:auto minmax(0,1fr) auto;height:100%}
.je-atas{display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:8px 12px;border-bottom:1px solid var(--je-garis);background:var(--je-panel)}
.je-judul{font:400 18px "Lilita One",Nunito,sans-serif;letter-spacing:.3px;max-width:30ch;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.je-status{color:var(--je-redup);font-size:12px}
.je-sela{flex:1}
.je-btn{border:1px solid var(--je-garis);background:#2a2027;color:#f3e9ee;border-radius:8px;padding:6px 12px;font:800 13px Nunito,sans-serif;cursor:pointer}
.je-btn:hover{border-color:#6b5160}
.je-btn:disabled{opacity:.5;cursor:not-allowed}
.je-btn:focus-visible,.je-root input:focus-visible,.je-root select:focus-visible,.je-root textarea:focus-visible,.je-klip:focus-visible{outline:2px solid var(--je-kuning);outline-offset:1px}
.je-utama{background:var(--je-pink);border-color:var(--je-pink);color:#fff}
.je-bahaya{color:#ff8f8f}
.je-penuh{width:100%}
.je-tengah{display:grid;grid-template-columns:250px minmax(0,1fr) 300px;min-height:0}
.je-pustaka,.je-inspektur{background:var(--je-panel);overflow:auto;padding:10px;min-width:0}
.je-pustaka{border-right:1px solid var(--je-garis)}
.je-inspektur{border-left:1px solid var(--je-garis);display:flex;flex-direction:column;gap:10px}
.je-inspektur h3{margin:0;font:400 17px "Lilita One",Nunito,sans-serif}
.je-tab{display:grid;grid-template-columns:repeat(4,1fr);gap:4px;margin-bottom:6px}
.je-tab button{background:transparent;border:0;border-bottom:2px solid transparent;color:var(--je-redup);font:800 12px Nunito,sans-serif;padding:6px 0;cursor:pointer}
.je-tab button[aria-selected="true"]{color:#fff;border-color:var(--je-pink)}
.je-petunjuk{color:var(--je-redup);font-size:12px;margin:4px 0}
.je-daftar{display:grid;gap:6px}
.je-daftar h4{margin:8px 0 0;font-size:11px;text-transform:uppercase;letter-spacing:.8px;color:var(--je-redup)}
.je-media{display:grid;grid-template-columns:44px 1fr;gap:8px;align-items:center;text-align:left;background:#2a2027;border:1px solid var(--je-garis);border-radius:8px;padding:4px;color:inherit;cursor:pointer;font:700 12px Nunito,sans-serif}
.je-media video,.je-media img{width:44px;height:64px;object-fit:cover;border-radius:5px;background:#000}
.je-media small{display:block;color:var(--je-redup)}
.je-preset{display:flex;gap:8px;align-items:center;width:100%;text-align:left;background:#2a2027;border:1px solid var(--je-garis);border-radius:8px;padding:8px 10px;color:inherit;cursor:pointer;font:800 13px Nunito,sans-serif}
.je-preset i{font-style:normal;display:grid;place-items:center;width:24px;height:24px;border-radius:6px;background:#3a2c34;flex:none}
.je-sfx{display:flex;gap:6px}
.je-dengar{flex:none;width:34px;border:1px solid var(--je-garis);background:#2a2027;color:#fff;border-radius:8px;cursor:pointer}
.je-pratinjau{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:10px;min-width:0;min-height:0;background:#0d0a0c}
.je-layar{position:relative;width:min(100%,calc((100vh - 390px) * 9 / 16));min-width:200px;border-radius:14px;overflow:hidden;box-shadow:0 0 0 1px var(--je-garis)}
.je-zona{position:absolute;border:1px dashed rgba(255,210,63,.35);pointer-events:none;border-radius:6px}
.je-pegangan{position:absolute;left:4%;right:4%;border:2px solid var(--je-kuning);border-radius:8px;cursor:ns-resize;touch-action:none;background:rgba(255,210,63,.08)}
.je-pegangan span{position:absolute;right:4px;top:-20px;background:var(--je-kuning);color:#2a1420;font:800 11px Nunito,sans-serif;padding:1px 6px;border-radius:5px}
.je-kontrol{display:flex;gap:8px;align-items:center}
.je-main{font-size:16px;width:44px}
.je-waktu{font:600 12px "JetBrains Mono",ui-monospace,monospace;font-variant-numeric:tabular-nums;color:var(--je-redup)}
.je-f{display:grid;gap:3px}
.je-f span{font-size:11px;text-transform:uppercase;letter-spacing:.6px;color:var(--je-redup)}
.je-f em{font-style:normal;color:#fff;text-transform:none;letter-spacing:0}
.je-root input:not([type=range]):not([type=checkbox]):not([type=color]),.je-root select,.je-root textarea{width:100%;background:#120e11;border:1px solid var(--je-garis);border-radius:7px;color:#fff;padding:6px 8px;font:600 13px Nunito,sans-serif}
.je-root input[type=range]{width:100%;accent-color:var(--je-pink)}
.je-root input[type=color]{width:100%;height:30px;background:transparent;border:1px solid var(--je-garis);border-radius:7px}
.je-dua{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.je-baris{display:flex;flex-wrap:wrap;gap:6px}
.je-cek{display:flex;gap:8px;align-items:center}
.je-pintas{margin:0;padding-left:16px;color:var(--je-redup);display:grid;gap:4px}
.je-root kbd{font:600 11px "JetBrains Mono",monospace;background:#2a2027;border:1px solid var(--je-garis);border-radius:4px;padding:0 4px;color:#fff}
.je-garis{border-top:1px solid var(--je-garis);background:var(--je-panel);height:290px;display:grid;grid-template-rows:auto minmax(0,1fr)}
.je-garisAtas{display:flex;justify-content:space-between;align-items:center;padding:4px 10px;color:var(--je-redup);font-size:12px}
.je-zoom{display:flex;gap:6px;align-items:center}
.je-zoom input{width:120px}
.je-gulir{display:flex;overflow:auto;min-height:0}
.je-label{position:sticky;left:0;z-index:3;flex:none;width:112px;background:var(--je-panel);border-right:1px solid var(--je-garis)}
.je-penggaris-l{height:24px;border-bottom:1px solid var(--je-garis)}
.je-namaTrack{padding:6px 8px;font-size:12px;color:var(--je-redup);border-bottom:1px solid #2a2027}
.je-isi{position:relative;flex:none}
.je-penggaris{position:sticky;top:0;z-index:2;height:24px;border-bottom:1px solid var(--je-garis);background:var(--je-panel);cursor:pointer;touch-action:none}
.je-penggaris span{position:absolute;top:4px;font:500 10px "JetBrains Mono",monospace;color:var(--je-redup);padding-left:3px;border-left:1px solid #4a3a43;height:16px}
.je-track{position:relative;border-bottom:1px solid #2a2027}
.je-klip{position:absolute;height:26px;border-radius:6px;display:flex;align-items:center;overflow:hidden;cursor:grab;touch-action:none;border:1px solid rgba(255,255,255,.12);font-size:11px;font-weight:800;color:#fff;user-select:none}
.je-klip span{padding:0 10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;pointer-events:none}
.je-k-teks{background:#7a3f8f}.je-j-sub{background:#5b4a9e}.je-j-cap{background:#9e3b4b}.je-j-judul{background:#a0762a}.je-j-akun{background:#46424a}.je-j-chips{background:#2f7a74}.je-j-stiker{background:#b2386a}
.je-k-elemen{background:#2b6ea6}.je-k-gambar{background:#3d6b3a}.je-k-sfx{background:#8a5a1f}.je-k-vo{background:#4a2d3b;cursor:pointer}
.je-aktif{outline:2px solid var(--je-kuning);z-index:1}
.je-h{position:absolute;top:0;bottom:0;width:8px;cursor:ew-resize;background:rgba(255,255,255,.18)}
.je-hk{left:0}.je-hn{right:0}
.je-kepala{position:absolute;top:0;bottom:0;width:2px;background:var(--je-pink);pointer-events:none;z-index:2}
.je-kepala::before{content:"";position:absolute;top:0;left:-5px;border:6px solid transparent;border-top-color:var(--je-pink)}
.je-akhir{position:absolute;top:24px;bottom:0;width:0;border-left:2px dashed #6b5160;pointer-events:none}
.je-modal{position:absolute;inset:0;background:rgba(0,0,0,.6);display:grid;place-items:center;z-index:5;padding:16px}
.je-kotak{background:var(--je-panel);border:1px solid var(--je-garis);border-radius:14px;padding:18px;width:min(420px,100%);display:grid;gap:10px}
.je-kotak p{margin:0}.je-kotak small{color:var(--je-redup)}
.je-bar{height:10px;border-radius:99px;background:#2a2027;overflow:hidden}
.je-bar i{display:block;height:100%;background:var(--je-pink);transition:width .2s}
@media (max-width:900px){
  .je-root{overflow:auto}
  .je-app{height:auto;min-height:100%;grid-template-rows:auto auto auto}
  .je-tengah{grid-template-columns:1fr}
  .je-pratinjau{order:1}.je-inspektur{order:2;border-left:0;border-top:1px solid var(--je-garis)}.je-pustaka{order:3;border-right:0;border-top:1px solid var(--je-garis);max-height:360px}
  .je-layar{width:min(100%,300px)}
  .je-garis{height:260px}
}
@media (prefers-reduced-motion:reduce){.je-bar i{transition:none}}
`;
