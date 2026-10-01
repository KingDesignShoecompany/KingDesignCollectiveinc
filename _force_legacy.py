import subprocess, json, time, os

cwd = 'C:/Users/young/agents/'
token = subprocess.run(['gh', 'auth', 'token'], capture_output=True, text=True, cwd=cwd).stdout.strip()

# 1. Check current Pages config
r = subprocess.run(['curl', '-s',
    'https://api.github.com/repos/KingDesignShoecompany/KingDesignCollectiveinc/pages',
    '-H', f'Authorization: bearer {token}',
    '-H', 'Accept: application/vnd.github+json'],
    capture_output=True, text=True, cwd=cwd, timeout=30)
data = json.loads(r.stdout)
print("Current Pages config:")
print(f"  status: {data.get('status')}")
print(f"  build_type: {data.get('build_type')}")
print(f"  source: {data.get('source')}")
print(f"  html_url: {data.get('html_url')}")

# 2. Check what's actually committed to gh-pages on remote
r2 = subprocess.run(['curl', '-s',
    'https://api.github.com/repos/KingDesignShoecompany/KingDesignCollectiveinc/contents/?ref=gh-pages',
    '-H', f'Authorization: bearer {token}',
    '-H', 'Accept: application/vnd.github+json'],
    capture_output=True, text=True, cwd=cwd, timeout=30)
contents = json.loads(r2.stdout)
print("\nRemote gh-pages root files:")
for item in contents:
    name = item.get('name')
    type_ = item.get('type')
    size = item.get('size')
    print(f"  {name} ({type_}, {size} bytes)")

# 3. Force switch back to legacy
print("\n=== Switching to legacy build ===")
r3 = subprocess.run(['curl', '-s', '-X', 'PUT',
    'https://api.github.com/repos/KingDesignShoecompany/KingDesignCollectiveinc/pages',
    '-H', f'Authorization: bearer {token}',
    '-H', 'Accept: application/vnd.github+json',
    '-d', '{"source":{"branch":"gh-pages","path":"/"}, "build_type":"legacy"}'],
    capture_output=True, text=True, cwd=cwd, timeout=30)
print(f"PUT response: {r3.stdout[:200] if r3.stdout else 'empty'}")

# 4. Trigger a build
time.sleep(3)
r4 = subprocess.run(['curl', '-s', '-X', 'POST',
    'https://api.github.com/repos/KingDesignShoecompany/KingDesignCollectiveinc/pages/builds',
    '-H', f'Authorization: bearer {token}',
    '-H', 'Accept: application/vnd.github+json'],
    capture_output=True, text=True, cwd=cwd, timeout=30)
print(f"\nBuild trigger: {r4.stdout[:200]}")

# 5. Wait and check
for i in range(20):
    time.sleep(15)
    r5 = subprocess.run(['curl', '-s',
        'https://api.github.com/repos/KingDesignShoecompany/KingDesignCollectiveinc/pages',
        '-H', f'Authorization: bearer {token}',
        '-H', 'Accept: application/vnd.github+json'],
        capture_output=True, text=True, cwd=cwd, timeout=30)
    data5 = json.loads(r5.stdout)
    print(f"Check {i+1}: status={data5.get('status')} build_type={data5.get('build_type')}")
    
    if data5.get('status') == 'built':
        # Check live content
        r6 = subprocess.run(['curl', '-s', '-k', 'https://kingdesignshoecompany.github.io/KingDesignCollectiveinc/'],
            capture_output=True, text=True, cwd=cwd, timeout=30)
        if '<html lang="en">' in r6.stdout:
            print(f"  LIVE: Next.js HTML detected ({len(r6.stdout)} bytes)")
        elif 'Jekyll' in r6.stdout:
            print(f"  LIVE: Jekyll page ({len(r6.stdout)} bytes)")
        elif 'Site not found' in r6.stdout:
            print(f"  LIVE: Site not found ({len(r6.stdout)} bytes)")
        else:
            print(f"  LIVE: {len(r6.stdout)} bytes - {r6.stdout[:80]}")
        break
    elif data5.get('status') == 'errored':
        print("  BUILD ERRORED!")
        break

# Cleanup
for f in ['hermes-check-pages.py']:
    p = f'C:/Users/young/AppData/Local/Temp/{f}'
    if os.path.exists(p):
        os.remove(p)
