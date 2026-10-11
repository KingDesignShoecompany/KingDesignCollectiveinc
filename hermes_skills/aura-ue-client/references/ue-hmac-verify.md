# Verify a hand-rolled UE HMAC-SHA256 against the backend

When you implement HMAC-SHA256 **inside UE C++** (e.g. because the engine
ships no `FSHA256` / `FHMAC`, only `FSHA1`), the build compiling is NOT
enough — a subtly-wrong SHA256 produces signatures the backend rejects on
every request. Prove correctness before declaring the client done.

## Technique

Re-implement the EXACT C++ algorithm in plain Python and compare its output
to Python's reference `hashlib` / `hmac` for several inputs. If they match,
the C++ is correct (C++ integer division makes the padding formula
`((Len+8)/64 + 1)*64` correct; Python's `/` is float division, so use `//`
in the replica — this is the one trap that makes a Python test "fail" while
the C++ is fine).

### Minimal RFC 6234 SHA-256 (mirror of the C++ `AuraHash::SHA256`)

```python
import struct
K = [0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
     0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
     0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
     0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
     0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
     0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
     0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
     0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2]
def ror(v,n): return ((v >> n) | (v << (32-n))) & 0xffffffff
def sha256(data: bytes) -> bytes:
    H = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19]
    L = len(data); total = ((L + 8)//64 + 1)*64          # NOTE: // not /
    buf = bytearray(total); buf[0:L] = data; buf[L] = 0x80
    bitlen = L*8
    for i in range(8): buf[total-1-i] = (bitlen >> (8*i)) & 0xff
    for off in range(0, total, 64):
        w = [0]*64
        for i in range(16):
            w[i] = (buf[off+i*4]<<24)|(buf[off+i*4+1]<<16)|(buf[off+i*4+2]<<8)|buf[off+i*4+3]
        for i in range(16,64):
            s0 = ror(w[i-15],7)^ror(w[i-15],18)^(w[i-15]>>3)
            s1 = ror(w[i-2],17)^ror(w[i-2],19)^(w[i-2]>>10)
            w[i] = (w[i-16]+s0+w[i-7]+s1) & 0xffffffff
        a,b,c,d,e,f,g,h = H
        for i in range(64):
            S1 = ror(e,6)^ror(e,11)^ror(e,25); ch = (e&f)^((~e)&g)
            t1 = (h+S1+ch+K[i]+w[i]) & 0xffffffff
            S0 = ror(a,2)^ror(a,13)^ror(a,22); maj = (a&b)^(a&c)^(b&c)
            t2 = (S0+maj) & 0xffffffff
            h=g;g=f;f=e;e=(d+t1)&0xffffffff;d=c;c=b;b=a;a=(t1+t2)&0xffffffff
        H = [(H[0]+a)&0xffffffff,(H[1]+b)&0xffffffff,(H[2]+c)&0xffffffff,(H[3]+d)&0xffffffff,
             (H[4]+e)&0xffffffff,(H[5]+f)&0xffffffff,(H[6]+g)&0xffffffff,(H[7]+h)&0xffffffff]
    return b''.join(struct.pack('>I', x) for x in H)

def hmac_sha256(data: bytes, secret: bytes) -> str:
    Bsz = 64
    key = bytearray(secret)
    if len(key) > Bsz: key = bytearray(sha256(bytes(key)))
    kpad = bytearray([0x36]*Bsz)
    for i in range(len(key)): kpad[i] ^= key[i]
    h1 = sha256(bytes(kpad) + data)
    opad = bytearray([0x5c]*Bsz)
    for i in range(len(key)): opad[i] ^= key[i]
    return sha256(bytes(opad) + h1).hex()
```

### Assert against the reference

```python
import hashlib, hmac as hmaclib, base64, json
for data, sec in [(b"", b""), (b"abc", b"k"), (b"hello", b"secret"),
                  (b"The quick brown fox jumps over the lazy dog", b"key")]:
    assert hmac_sha256(data, sec) == hmaclib.new(sec, data, hashlib.sha256).hexdigest()

# contract shape the client actually signs:
body = {"battleId":"b1","userId":"u1","action":"TAP","nonce":"n","stateVersion":1}
raw = base64.b64encode(json.dumps(body).encode()).decode()
signed = raw + "|" + str(1700000000)
print(hmac_sha256(signed.encode(), b"my-secret") ==
      hmaclib.new(b"my-secret", signed.encode(), hashlib.sha256).hexdigest())
```

## Why this matters

The backend verifies `HMAC-SHA256(base64(JSON)|timestamp, secret)`. A wrong
inner hash = every client request rejected (403/replay). This check runs in
seconds and needs no engine — do it the moment the C++ compiles, before any
runtime test. (Session 2026-08: caught that a float-division typo in a
Python *test replica* looked like a C++ bug; the C++ was fine because C++
integer division is correct. Lesson: in the replica use `//`, and if the C++
SHA256 is the canonical impl, trust its integer arithmetic.)
