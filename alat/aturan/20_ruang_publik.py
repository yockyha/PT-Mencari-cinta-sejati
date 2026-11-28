# Fitur: Ruang publik: chat, papan rapat, papan curhat, saran & laporan
from _inti import *  # noqa: F401,F403


def pasang(r):
    r["chat"] = {".read": True, ".write": f"{A} && {DIR}", "$id": buatHapus(pesan(120) + " && " + ST_OK)}  # stiker VIP/VVIP hanya untuk pemiliknya
    r["papan"] = {".read": True, ".write": f"{A} && {DIR}", "$id": buatHapus(pesan(80))}
    r["curhat"] = {".read": True, ".write": f"{A} && {DIR}", "$id": {
      **buatHapus("newData.child('m').isString() && newData.child('m').val().length > 0 && newData.child('m').val().length <= 300 && newData.child('t').isNumber()"),
      "m": {".validate": f"!data.exists() || data.val() === newData.val() || {DIR}"},
      "peluk": {"$uid": {".write": f"{A} && auth.uid === $uid && (!newData.exists() || {BEBAS})", ".validate": "newData.val() === true"}},
      "balas": {"$b": buatHapus(pesan(160))}}}
    r["curhatPemilik"] = {".read": f"{A} && {STAF}", ".write": f"{A} && {DIR}", "$id": {".write": f"{A} && ((!data.exists() && newData.val() === auth.uid && {BEBAS}) || (!newData.exists() && {STAF}))"}}
    # saran: tamu menulis; Direktur boleh menandai diterima/dibalas (st, bls, bt)
    for node, val in [("saran", f"({DIR} && newData.child('m').isString() && (!newData.child('bls').exists() || (newData.child('bls').isString() && newData.child('bls').val().length <= 300))) || (newData.child('dari').val() === auth.uid && newData.child('m').isString() && newData.child('m').val().length <= 300 && newData.child('t').val() === now)"),
                      ("laporan", "newData.child('dari').val() === auth.uid && newData.child('target').isString() && newData.child('alasan').isString() && newData.child('alasan').val().length <= 120 && newData.child('t').val() === now")]:
        r[node] = {".read": f"{A} && {STAF}", ".write": f"{A} && {DIR}", "$id": {".write": f"{A} && ((!data.exists() && {BEBAS}) || (!newData.exists() && {STAF}) || {DIR})", ".validate": val}}
