# Fitur: Meja Nongkrong: obrolan, papan kegiatan & voting per meja
from _inti import *  # noqa: F401,F403


def pasang(r):
    r["mejaChat"] = {".read": True, ".write": f"{A} && {DIR}", "$meja": {"$id": {
      ".write": f"{A} && {MEJA_ID} && ((!data.exists() && {BEBAS}) || (!newData.exists() && {STAF}))", ".validate": pesan(160)}}}
    r["mejaPapan"] = {".read": True, ".write": f"{A} && {DIR}", "$meja": {"$id": {
      ".write": f"{A} && {MEJA_ID} && ((!data.exists() && {BEBAS}) || (data.exists() && !newData.exists() && (data.child('uid').val() === auth.uid || {STAF})))",
      ".validate": "data.exists() || (newData.child('uid').val() === auth.uid && newData.hasChildren(['n', 't']))",
      "uid": {".validate": "!data.exists() || data.val() === newData.val()"},
      "n": {".validate": "newData.isString() && newData.val().length <= 30 && (!data.exists() || data.val() === newData.val())"},
      "a": {".validate": "newData.isString() && newData.val().length <= 60 && (!data.exists() || data.val() === newData.val())"},
      "b": {".validate": "newData.isString() && newData.val().length <= 60 && (!data.exists() || data.val() === newData.val())"},
      "c": {".validate": "newData.isString() && newData.val().length <= 160 && (!data.exists() || data.val() === newData.val())"},
      "t": {".validate": "(!data.exists() && newData.val() === now) || data.val() === newData.val()"},
      "s": {"$uid": {".write": f"{A} && auth.uid === $uid && (!newData.exists() || {BEBAS})", ".validate": "newData.val() === true"}},
      "$lain": {".validate": False}}}}
    r["mejaVote"] = {".read": True, ".write": f"{A} && {DIR}", "$meja": {"$hari": {"$uid": {
      ".write": f"{A} && auth.uid === $uid && {MEJA_ID} && $hari.matches(/^[0-9]+$/) && $hari.length === 8 && {BEBAS}", ".validate": "newData.val() === 'a' || newData.val() === 'b'"}}}}
