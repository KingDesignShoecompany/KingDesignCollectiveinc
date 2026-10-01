import subprocess, os, hashlib, zlib, re

cwd = 'C:/Users/young/agents/'

env = os.environ.copy()
env.update({
    'GIT_AUTHOR_NAME': 'KingDesign Shoe Company',
    'GIT_AUTHOR_EMAIL': 'king@kingdesigncompany.com',
    'GIT_AUTHOR_DATE': '2026-10-01T12:40:00+0000',
    'GIT_COMMITTER_NAME': 'KingDesign Shoe Company',
    'GIT_COMMITTER_EMAIL': 'king@kingdesigncompany.com',
    'GIT_COMMITTER_DATE': '2026-10-01T12:40:00+0000',
})

def write_blob(data):
    header = b'blob ' + str(len(data)).encode() + b'\x00'
    full = header + data
    sha = hashlib.sha1(full).hexdigest()
    obj_dir = os.path.join(cwd, '.git', 'objects', sha[:2])
    obj_path = os.path.join(obj_dir, sha[2:])
    os.makedirs(obj_dir, exist_ok=True)
    if not os.path.exists(obj_path):
        with open(obj_path, 'wb') as f:
            f.write(zlib.compress(full))
    return sha

def read_blob(sha):
    r = subprocess.run(['git', 'cat-file', '-p', sha], capture_output=True, cwd=cwd)
    return r.stdout

# Load gh-pages
lock = os.path.join(cwd, '.git', 'index.lock')
if os.path.exists(lock):
    os.remove(lock)
idx_path = os.path.join(cwd, '.git', 'index')
if os.path.exists(idx_path):
    os.remove(idx_path)

subprocess.run(['git', 'config', 'core.autocrlf', 'false'], capture_output=True, text=True, cwd=cwd)
subprocess.run(['git', 'read-tree', 'gh-pages'], capture_output=True, text=True, cwd=cwd, timeout=120)

# Fix all HTML files: remove the /KingDesignCollectiveinc/ prefix from href/src attributes
# GitHub Pages serves from /KingDesignCollectiveinc/ subdirectory, so /_next/ resolves correctly
for html_file in ['index.html', '404.html', '404/index.html']:
    r_h = subprocess.run(['git', 'ls-files', '-s', html_file], capture_output=True, text=True, cwd=cwd)
    if not r_h.stdout.strip():
        continue
    
    parts = r_h.stdout.strip().split('\t')
    meta = parts[0].split(' ')
    blob_sha = meta[1]
    
    old_data = read_blob(blob_sha)
    new_data = old_data
    
    # Remove prefix from href/src attributes in HTML
    # Pattern: href="/KingDesignCollectiveinc/_next/ -> href="/_next/
    new_data = new_data.replace(b'href="/KingDesignCollectiveinc/_next/', b'href="/_next/')
    new_data = new_data.replace(b'src="/KingDesignCollectiveinc/_next/', b'src="/_next/')
    
    # Remove prefix from RSC payload href references
    # Pattern in RSC data: \"href\":\"/KingDesignCollectiveinc/_next/...\" -> \"href\":\"/_next/...\"
    new_data = new_data.replace(b'\\\\"/KingDesignCollectiveinc/_next/', b'\\\\"/_next/')
    
    # Set assetPrefix back to empty (GitHub Pages handles subdirectory automatically)
    # Current: assetPrefix\\":\\"/KingDesignCollectiveINC\\"
    # Target:  assetPrefix\\":\\""
    old_prefix = b'assetPrefix' + bytes([0x5c, 0x22, 0x3a, 0x5c, 0x22]) + b'/KingDesignCollectiveINC' + bytes([0x5c, 0x22])
    new_prefix = b'assetPrefix' + bytes([0x5c, 0x22, 0x3a, 0x5c, 0x22, 0x5c, 0x22])  # assetPrefix\":\"\"
    
    print(f"{html_file}: old_prefix found: {old_prefix in new_data}")
    new_data = new_data.replace(old_prefix, new_prefix)
    print(f"{html_file}: new_prefix in result: {new_prefix in new_data}")
    
    # Verify
    idx = new_data.find(b'assetPrefix')
    if idx >= 0:
        print(f"  assetPrefix context: {new_data[idx:idx+40]}")
    
    # Check no double prefix
    if b'/KingDesignCollectiveinc/KingDesignCollectiveinc/' in new_data:
        print(f"  WARNING: Double prefix still exists!")
    else:
        print(f"  No double prefix - GOOD")
    
    # Check _next refs
    next_refs = re.findall(rb'(href|src)="/_next/static/([^"]+)"', new_data)
    print(f"  _next refs: {len(next_refs)}")
    
    if old_data != new_data:
        new_blob = write_blob(new_data)
        subprocess.run(['git', 'update-index', '--cacheinfo', f'100644,{new_blob},{html_file}'],
            capture_output=True, text=True, cwd=cwd, env=env)
        print(f"  Updated {html_file}")

# Write tree
r5 = subprocess.run(['git', 'write-tree'], capture_output=True, text=True, cwd=cwd, env=env, timeout=120)
new_tree = r5.stdout.strip()
print(f"\nNew tree: {new_tree}")

# Create commit
msg_file = os.path.join(cwd, '_m.txt')
with open(msg_file, 'w') as f:
    f.write("fix: Remove assetPrefix from HTML href/src - GitHub Pages handles subdirectory automatically")

parent = subprocess.run(['git', 'log', '-1', '--format=%H', 'origin/gh-pages'],
    capture_output=True, text=True, cwd=cwd).stdout.strip()

commit = subprocess.run(['git', 'commit-tree', new_tree, '-p', parent, '-F', msg_file],
    capture_output=True, text=True, cwd=cwd, env=env).stdout.strip()
print(f"New commit: {commit}")

with open(os.path.join(cwd, '.git', 'refs', 'heads', 'gh-pages'), 'w') as f:
    f.write(commit + '\n')

# Push
token = subprocess.run(['gh', 'auth', 'token'], capture_output=True, text=True, cwd=cwd).stdout.strip()
remote_url = f'https://x-access-token:{token}@github.com/KingDesignShoecompany/KingDesignCollectiveinc.git'
r_push = subprocess.run(['git', 'push', remote_url, f'{commit}:gh-pages', '--force'],
    capture_output=True, text=True, cwd=cwd, timeout=600)
print(f"Push: {r_push.returncode}")

os.remove(msg_file)
