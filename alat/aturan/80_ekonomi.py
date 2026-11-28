# Fitur: EXP, tugas, VIP/VVIP, pesanan, Diamond, barang & notifikasi
from _inti import *  # noqa: F401,F403


def pasang(r):
    r["exp"] = {".read": True, ".write": f"{A} && {DIR}", "$uid": {".write": f"{A} && auth.uid === $uid && {BEBAS}",
      ".validate": f"{DIR} || (newData.child('n').isNumber() && newData.child('t').val() === now && ((!data.exists() && newData.child('n').val() <= 60) || (data.exists() && newData.child('n').val() >= data.child('n').val() && newData.child('n').val() <= data.child('n').val() + 60 && now - data.child('t').val() >= 3000)))"}}
    r["tugas"] = {".read": f"{A} && {DIR}", ".write": f"{A} && {DIR}", "$uid": {".read": f"{A} && auth.uid === $uid", "$k": {".write": f"{A} && auth.uid === $uid && !data.exists() && {BEBAS}", ".validate": "newData.val() === true && $k.length <= 40"}}}
    r["expBeli"] = {".read": True, ".write": f"{A} && {DIR}", "$uid": {".validate": "newData.isNumber() && newData.val() >= 0"}}
    r["vip"] = {".read": True, ".write": f"{A} && {DIR}", "$uid": {
      ".write": f"{A} && auth.uid === $uid && {BEBAS} && newData.exists() && ((newData.child('tingkat').val() === 'vip' && {DM_BARU} === {DM_LAMA} - 300) || (newData.child('tingkat').val() === 'vvip' && {DM_BARU} === {DM_LAMA} - 650)) && newData.child('sampai').val() > now && (newData.child('sampai').val() <= now + {HARI30} || (data.exists() && newData.child('sampai').val() <= data.child('sampai').val() + {HARI30}))",
      ".validate": "newData.child('sampai').isNumber() && (!newData.child('tingkat').exists() || newData.child('tingkat').val().matches(/^(vip|vvip)$/))"}}
    r["pesanan"] = {**D(), "$id": {".read": f"{A} && data.child('uid').val() === auth.uid",
      ".write": f"{A} && !data.exists() && newData.child('uid').val() === auth.uid && {BEBAS}",
      ".validate": f"{DIR} || (newData.child('paket').isString() && newData.child('paket').val().length <= 20 && newData.child('jenis').val().matches(/^(diamond|paket|donasi|layar)$/) && newData.child('metode').val().matches(/^(qris|bca|bri|lain)$/) && newData.child('nominal').isNumber() && newData.child('nominal').val() >= 1000 && newData.child('nominal').val() <= 10000000 && newData.child('n').isString() && newData.child('n').val().length <= 30 && newData.child('t').val() === now)"}}
    r["diamond"] = {".read": f"{A} && {DIR}", ".write": f"{A} && {DIR}", "$uid": {".read": f"{A} && auth.uid === $uid",
      ".write": f"{A} && auth.uid === $uid && {BEBAS} && newData.isNumber() && newData.val() >= 0 && (newData.val() < data.val() || {HADIAH_STREAK})",
      ".validate": "newData.isNumber() && newData.val() >= 0"}}
    # MILIK: barang hanya tercatat jika di transaksi yang sama diamond terpotong persis sebesar harga katalog
    r["milik"] = {".read": True, ".write": f"{A} && {DIR}", "$uid": {"$item": {
      ".write": f"{A} && auth.uid === $uid && !data.exists() && {BEBAS} && ((root.child('katalog/' + $item + '/harga').exists() && newData.parent().parent().parent().child('diamond/' + $uid).val() === root.child('diamond/' + $uid).val() - root.child('katalog/' + $item + '/harga').val()) || ($item.beginsWith('gc') && newData.parent().parent().parent().child('amplop/' + $uid + '/t').val() === now) || ($item.beginsWith('ss') && root.child('seasonPremium/' + $uid).exists()))",
      ".validate": "newData.val() === true"}}}
    r["katalog"] = {".read": True, ".write": f"{A} && {DIR}", "$item": {".validate": "newData.child('harga').isNumber() && newData.child('harga').val() > 0"}}
    r["donatur"] = {".read": True, ".write": f"{A} && {DIR}"}
    # PAPAN DONASI (papan besar di lobi): ditulis server pembayaran / Direktur saat donasi lunas
    r["papanDonasi"] = {".read": True, ".write": f"{A} && {DIR}", "$id": {
      ".validate": "newData.child('n').isString() && newData.child('n').val().length <= 20 && newData.child('nominal').isNumber() && newData.child('m').isString() && newData.child('m').val().length <= 100 && newData.child('t').isNumber()"}}
    r["riwayat"] = D()
    r["notif"] = {".read": f"{A} && {DIR}", "$uid": {".read": f"{A} && auth.uid === $uid", "$id": {
      ".write": f"{A} && ((newData.exists() && {STAF}) || (!newData.exists() && (auth.uid === $uid || {DIR})))",
      ".validate": "newData.child('m').isString() && newData.child('m').val().length <= 200"}}}
