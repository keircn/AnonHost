(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.AnonCrypto = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var MAGIC = 'AHEN1';
  var HEADER_SIZE = 38;
  var DEFAULT_CHUNK = 1048576;
  var MIN_CHUNK = 65536;
  var MAX_CHUNK = 16777216;
  var PBKDF2_ITER = 100000;
  var TAG_SIZE = 16;

  function te() { return new TextEncoder(); }

  function base64urlEncode(b) {
    var s = '', i = 0;
    for (; i < b.length; i++) s += String.fromCharCode(b[i]);
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function base64urlDecode(s) {
    s = s.replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    var t = atob(s), b = new Uint8Array(t.length), i = 0;
    for (; i < t.length; i++) b[i] = t.charCodeAt(i);
    return b;
  }

  function isRawKeyFragment(frag) {
    if (!frag || frag.length !== 43) return false;
    for (var i = 0; i < frag.length; i++) {
      var c = frag.charCodeAt(i);
      var ok = (c >= 65 && c <= 90) || (c >= 97 && c <= 122) ||
        (c >= 48 && c <= 57) || c === 45 || c === 95;
      if (!ok) return false;
    }
    return true;
  }

  function concat(parts, total) {
    var out = new Uint8Array(total), off = 0, i = 0;
    for (; i < parts.length; i++) { out.set(parts[i], off); off += parts[i].length; }
    return out;
  }

  function chunkNonce(base, counter) {
    var n = new Uint8Array(base);
    var view = new DataView(n.buffer, n.byteOffset, n.byteLength);
    var lo = view.getBigUint64(4, false);
    view.setBigUint64(4, lo ^ BigInt(counter), false);
    return n;
  }

  function subtle() {
    var c = (typeof crypto !== 'undefined') ? crypto : null;
    var s = c && (c.subtle || (c.webcrypto && c.webcrypto.subtle));
    if (!s) throw new Error('WebCrypto not available (needs HTTPS or localhost)');
    return s;
  }

  function importRawKey(raw) {
    return subtle().importKey('raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
  }

  function derivePasswordKey(password, salt) {
    var s = subtle();
    return s.importKey('raw', te().encode(password), { name: 'PBKDF2' }, false, ['deriveBits'])
      .then(function (base) {
        return s.deriveBits({ name: 'PBKDF2', salt: salt, iterations: PBKDF2_ITER, hash: 'SHA-256' }, base, 256);
      })
      .then(function (bits) { return importRawKey(new Uint8Array(bits)); });
  }

  function storedSize(plainSize, chunkSize) {
    chunkSize = chunkSize || DEFAULT_CHUNK;
    if (plainSize === 0) return HEADER_SIZE;
    var chunks = Math.ceil(plainSize / chunkSize);
    return HEADER_SIZE + plainSize + chunks * (4 + TAG_SIZE);
  }

  function encryptV2(source, opts) {
    opts = opts || {};
    var chunkSize = opts.chunkSize || DEFAULT_CHUNK;
    var onProgress = opts.onProgress || function () {};
    var s = subtle();
    var plainSize = source.size;
    var keyPromise = s.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
    var iv = (typeof crypto.getRandomValues === 'function')
      ? crypto.getRandomValues(new Uint8Array(12))
      : null;
    if (!iv) throw new Error('secure RNG not available');
    var salt = crypto.getRandomValues(new Uint8Array(16));
    return keyPromise.then(function (key) {
      return s.exportKey('raw', key).then(function (raw) {
        var header = new Uint8Array(HEADER_SIZE);
        for (var i = 0; i < 5; i++) header[i] = MAGIC.charCodeAt(i);
        header[5] = 0;
        header.set(salt, 6);
        header.set(iv, 22);
        new DataView(header.buffer).setUint32(34, chunkSize, false);
        var parts = [header];
        var counter = 0, offset = 0;
        function step() {
          if (offset >= plainSize) {
            var blob = new Blob(parts, { type: 'application/octet-stream' });
            return {
              blob: blob,
              parts: parts,
              key: base64urlEncode(new Uint8Array(raw)),
              plainSize: plainSize,
              storedSize: blob.size,
              chunkSize: chunkSize
            };
          }
          var end = Math.min(offset + chunkSize, plainSize);
          var slice = source.slice(offset, end);
          var idx = counter;
          return slice.arrayBuffer().then(function (ab) {
            return s.encrypt({ name: 'AES-GCM', iv: chunkNonce(iv, idx) }, key, ab);
          }).then(function (ct) {
            var ctBytes = new Uint8Array(ct);
            var lenPrefix = new Uint8Array(4);
            new DataView(lenPrefix.buffer).setUint32(0, ctBytes.length, false);
            parts.push(lenPrefix, ctBytes);
            counter++;
            offset = end;
            onProgress(offset, plainSize);
            return step();
          });
        }
        onProgress(0, plainSize);
        return step();
      });
    });
  }

  function ByteQueue(iter) {
    this.iter = iter;
    this.parts = [];
    this.buffered = 0;
    this.eof = false;
  }
  ByteQueue.prototype.fill = function (n) {
    var self = this;
    function next() {
      if (self.buffered >= n || self.eof) return Promise.resolve(self.buffered >= n);
      return self.iter.next().then(function (r) {
        if (r.done) { self.eof = true; return self.buffered >= n; }
        if (r.value && r.value.length) {
          self.parts.push(r.value);
          self.buffered += r.value.length;
        }
        return next();
      });
    }
    return next();
  };
  ByteQueue.prototype.take = function (n) {
    var out = new Uint8Array(n), off = 0;
    while (off < n) {
      var p = this.parts[0];
      var want = n - off;
      if (p.length <= want) {
        out.set(p, off);
        off += p.length;
        this.parts.shift();
      } else {
        out.set(p.subarray(0, want), off);
        this.parts[0] = p.subarray(want);
        off = n;
      }
    }
    this.buffered -= n;
    return out;
  };

  function u32be(b, off) {
    return (b[off] * 16777216) + (b[off + 1] << 16) + (b[off + 2] << 8) + b[off + 3];
  }

  function authErr(msg) {
    var e = new Error(msg || 'decryption failed: wrong key or corrupted data');
    e.code = 'AUTH';
    return e;
  }

  function decryptStream(chunks, fragment, progressCb) {
    progressCb = progressCb || function () {};
    var s = subtle();
    var q = new ByteQueue(chunks[Symbol.asyncIterator]());
    function fail(e) { return Promise.reject(e); }

    return q.fill(5).then(function (ok) {
      if (!ok) return fail(new Error('empty file'));
      return q.fill(HEADER_SIZE).then(function () { return null; });
    }).then(function () {
      var probe = q.take(5);
      var isV2 = probe[0] === 65 && probe[1] === 72 && probe[2] === 69 &&
        probe[3] === 78 && probe[4] === 49;
      q.parts.unshift(probe);
      q.buffered += 5;
      if (isV2) return decryptV2(q, fragment, s, progressCb);
      return decryptV1(q, fragment, s, progressCb);
    });
  }

  function decryptV1(q, fragment, s, progressCb) {
    var rawKey;
    if (isRawKeyFragment(fragment)) {
      try { rawKey = base64urlDecode(fragment); }
      catch (e) { return Promise.reject(authErr()); }
      if (rawKey.length !== 32) return Promise.reject(authErr());
      return importRawKey(rawKey).then(function (k) { return finishV1(q, s, k); });
    }
    if (!fragment) return Promise.reject(new Error('missing decryption key'));
    progressCb('key', 0, 1);
    return s.digest('SHA-256', te().encode(fragment)).then(function (h) {
      return importRawKey(new Uint8Array(h));
    }).then(function (k) { return finishV1(q, s, k); });
  }

  function finishV1(q, s, key) {
    function drain(acc, total) {
      return q.iter.next().then(function (r) {
        if (r.done) return { parts: acc, total: total };
        if (r.value && r.value.length) { acc.push(r.value); total += r.value.length; }
        return drain(acc, total);
      });
    }
    var all = q.parts.splice(0);
    var have = q.buffered;
    q.buffered = 0;
    return drain(all, have).then(function (res) {
      var data = concat(res.parts, res.total);
      if (data.length < 12 + TAG_SIZE + 1) throw new Error('file too short');
      var iv = data.slice(0, 12), ct = data.slice(12);
      return s.decrypt({ name: 'AES-GCM', iv: iv }, key, ct).then(function (pt) {
        return { blobParts: [new Uint8Array(pt)], plainSize: pt.byteLength, version: 1, chunks: 1 };
      }, function () { throw authErr(); });
    });
  }

  function decryptV2(q, fragment, s, progressCb) {
    return q.fill(HEADER_SIZE).then(function (ok) {
      if (!ok) throw new Error('truncated header');
      var head = q.take(HEADER_SIZE);
      var flags = head[5];
      if (flags & ~1) throw new Error('unsupported envelope flags');
      var passwordMode = (flags & 1) !== 0;
      var salt = head.slice(6, 22);
      var baseNonce = head.slice(22, 34);
      var chunkSize = u32be(head, 34);
      if (chunkSize < MIN_CHUNK || chunkSize > MAX_CHUNK) throw new Error('invalid chunk size');
      progressCb('key', 0, 1);
      var keyP;
      if (!passwordMode) {
        if (!isRawKeyFragment(fragment)) {
          if (!fragment) throw new Error('missing decryption key');
          throw authErr('this file needs its 43-character key from the original URL');
        }
        var raw;
        try { raw = base64urlDecode(fragment); }
        catch (e) { throw authErr(); }
        if (raw.length !== 32) throw authErr();
        keyP = importRawKey(raw);
      } else {
        if (!fragment) throw new Error('missing decryption key');
        keyP = derivePasswordKey(fragment, salt);
      }
      return keyP.then(function (key) {
        var parts = [], plainSize = 0, counter = 0;
        function frame() {
          return q.fill(4).then(function (ok4) {
            if (!ok4) {
              if (q.eof && q.buffered === 0 && counter > 0) {
                return { blobParts: parts, plainSize: plainSize, version: 2, chunks: counter };
              }
              throw new Error(counter === 0 ? 'truncated file' : 'truncated file at chunk ' + counter);
            }
            var lb = q.take(4);
            var flen = u32be(lb, 0);
            if (flen < TAG_SIZE + 1 || flen > chunkSize + TAG_SIZE) {
              throw new Error('corrupt frame at chunk ' + counter);
            }
            return q.fill(flen).then(function (okf) {
              if (!okf) throw new Error('truncated file at chunk ' + counter);
              var ct = q.take(flen);
              var idx = counter;
              return s.decrypt({ name: 'AES-GCM', iv: chunkNonce(baseNonce, idx) }, key, ct).then(function (pt) {
                var pu = new Uint8Array(pt);
                parts.push(pu);
                plainSize += pu.length;
                counter++;
                progressCb('chunk', counter, -1);
                return frame();
              }, function () { throw authErr('wrong key or corrupted data at chunk ' + idx); });
            });
          });
        }
        return frame();
      });
    });
  }

  function decryptBytes(data, fragment, progressCb) {
    function* gen() { yield data; }
    var iter = gen()[Symbol.iterator]();
    var asyncIter = {};
    asyncIter[Symbol.asyncIterator] = function () {
      return {
        next: function () {
          var r = iter.next();
          return Promise.resolve(r.done ? { done: true } : { value: r.value, done: false });
        }
      };
    };
    return decryptStream(asyncIter, fragment, progressCb);
  }

  function responseChunks(response, onDownload) {
    var reader = response.body && response.body.getReader ? response.body.getReader() : null;
    if (!reader) {
      return {
        total: -1,
        iter: (function () {
          var done = false;
          var asyncIter = {};
          asyncIter[Symbol.asyncIterator] = function () {
            return {
              next: function () {
                if (done) return Promise.resolve({ done: true });
                done = true;
                return response.arrayBuffer().then(function (ab) {
                  var u = new Uint8Array(ab);
                  onDownload(u.length, u.length);
                  return { value: u, done: false };
                });
              }
            };
          };
          return asyncIter;
        })()
      };
    }
    var total = -1;
    var lenHeader = response.headers.get('Content-Length');
    if (lenHeader) { var t = parseInt(lenHeader, 10); if (t >= 0) total = t; }
    var loaded = 0;
    var asyncIter = {};
    asyncIter[Symbol.asyncIterator] = function () {
      return {
        next: function () {
          return reader.read().then(function (r) {
            if (!r.done && r.value) {
              loaded += r.value.length;
              onDownload(loaded, total);
            }
            return r;
          });
        }
      };
    };
    return { total: total, iter: asyncIter };
  }

  return {
    MAGIC: MAGIC,
    HEADER_SIZE: HEADER_SIZE,
    DEFAULT_CHUNK: DEFAULT_CHUNK,
    PBKDF2_ITER: PBKDF2_ITER,
    base64urlEncode: base64urlEncode,
    base64urlDecode: base64urlDecode,
    isRawKeyFragment: isRawKeyFragment,
    storedSize: storedSize,
    encryptV2: encryptV2,
    decryptStream: decryptStream,
    decryptBytes: decryptBytes,
    responseChunks: responseChunks
  };
});
