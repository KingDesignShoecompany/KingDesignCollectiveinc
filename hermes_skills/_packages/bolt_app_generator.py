#!/usr/bin/env python3
"""
Bolt App Generator for KingDesignCollectiveINC Corporation subsidiaries.
Uses the Bolt.diy API (http://localhost:5173) to generate web applications
for each of the 7 subsidiaries, then saves files to the
corporate_runtime/documents directory.

Sends shorter, focused prompts per file to stay within Ollama's
processing time limits.
"""
import json
import re
import subprocess
import sys
import os
import time
import urllib.parse
from pathlib import Path

BOLT_API_URL = "http://localhost:5173/api/chat"
CORPORATE_RUNTIME = "/c/Users/young/agents/corporate_runtime/documents"
BOLT_COOKIE = 'apiKeys={};providers={"Ollama":{"apiKeys":{},"baseURL":"http://host.docker.internal:11435"}};selectedModel=gemma3:1b;selectedProvider=Ollama'


SUBSIDIARIES = {
    "shoe_brand": {
        "name": "King Design Collective",
        "output_dir": "shoe_brand/webapp",
        "files": {
            "index.html": "Create a homepage for King Design Collective sneaker brand. Hero with 'King Design Collective' title and 'Cinematic Street-King' tagline. Featured products section showing 8 SKUs: Dendroaspispolyles, Mota mary, Opustošeni nepažlj, Queen_s Ace, Ravenoustum satori, SASSY SOL, Unique Sin, Voda Šetač. CTA buttons 'CLAIM YOUR PAIR'. Modern premium design.",
            "products.html": "Create a product listing page for King Design Collective. Product grid with filter buttons for categories: Athletic Street, The Hybrid, Occasional Formal. Search bar. Each card shows product image placeholder, SKU name, price range, and 'CLAIM YOUR PAIR' button. Responsive grid layout.",
            "product.html": "Create a single product page for King Design Collective. Large image gallery, product title (SKU), category badge, price, size selector dropdown (5-14), stock indicator, material composition, description, and 'CLAIM YOUR PAIR' CTA. Sticky add-to-cart bar.",
            "style.css": "Create premium CSS for King Design Collective shoe brand. Variables for dark mode, premium fonts, grid layouts, card designs with shadow effects, button gradients, responsive breakpoints, smooth scroll animations. Color palette: deep charcoal, gold accents, white/off-white.",
            "app.js": "Create JavaScript for King Design Collective store. Search filtering by SKU name, category filter buttons, size selector logic, cart add functionality with localStorage, responsive mobile menu toggle, smooth scroll animations.",
        },
    },
    "travel_index": {
        "name": "The Vagary Index",
        "output_dir": "travel_index/webapp",
        "files": {
            "index.html": "Create a travel dashboard homepage for The Vagary Index. Hero with 'The Vagary Index' title and world map background. Search bar by country. Regional cards showing East Asia (6 countries), MENA (55 countries), SEA-ANZ, South Asia, Europe, Americas. Featured destinations carousel. TikTok feed integration.",
            "countries.html": "Create a country listing page for The Vagary Index. 250 countries organized by 6 regions in a filterable grid. Search/filter by region and country name. Each card shows: ISO code, country name, region badge, completion status, and TikTok content count. Sort options.",
            "country.html": "Create a country detail page for The Vagary Index. Sections: History & Culture overview, Entry Requirements (visa, passport, health, customs), Climate Maps (thermal BIO1/BIO5/BIO6 images), Currency converter with regional exchange rates, Top 10 Attractions list, TikTok video gallery. Tabbed interface.",
            "style.css": "Create travel-themed CSS for The Vagary Index. World map color palette (deep blues, teals, earth tones). Responsive grid, card elevation, map-inspired styling, dark/light mode toggle, tab navigation, smooth transitions. Clean, professional travel brand aesthetic.",
            "app.js": "Create JS for The Vagary Index. Country search with autosuggest, region filter, currency conversion calculator, TikTok video embed loader, thermal map tooltip, interactive region selector, data pagination.",
        },
    },
    "game_design": {
        "name": "Aura Champions",
        "output_dir": "game_design/webapp",
        "files": {
            "index.html": "Create a landing page for Aura Champions AR card battler. Hero with animated AR card reveal, 'Aura Champions' title, subtitle 'Converge. Battle. Dominate.' Key features: NFC card scanning, AR battlefield, Trinity VFX, Convergence events. Download buttons iOS/Android/UE5. Cyberpunk neon aesthetic.",
            "cards.html": "Create a card database page for Aura Champions. Searchable grid of AR creature cards. Filter by rarity: Common, Rare, Epic, Legendary, Convergence. Each card shows: name, HP, attack, element type, NFC status, rarity badge. Card art placeholder with hover 3D flip effect. Sort by power/element.",
            "card-detail.html": "Create a card detail page for Aura Champions. Large AR card preview with 3D rotation. Stats panel: name, rarity, element, HP, attack, defense, abilities list. NFC write-token status indicator. 'Scan Card' button with animation. Related cards carousel.",
            "events.html": "Create an events page for Aura Champions. Convergence milestone tracker: #50, #75, #100 stones. Active events calendar with dates and rewards. Trinity activation status. Tournament brackets. Server status indicators.",
            "style.css": "Create cyberpunk CSS for Aura Champions. Dark theme with neon purple/cyan/gold accents. Card battle UI with holographic effects, glow animations, grid layouts, button pulses, data panels. AR-inspired interface elements. Responsive with mobile scaling.",
            "app.js": "Create JS for Aura Champions. Card filtering/search, NFC scan simulation, AR preview toggle, event countdown timers, tourney bracket display, rarity filter logic, stat sorting.",
        },
    },
    "kids_channel": {
        "name": "Seven Minute Story Sessions",
        "output_dir": "kids_channel/webapp",
        "files": {
            "index.html": "Create a calming landing page for Seven Minute Story Sessions bedtime channel. Starry night animated background. 'Seven Minute Story Sessions' title. Featured stories carousel with play buttons. Age group selectors: 2-4, 4-6, 6-8 years. Soft pastel color palette. Latest episode prominent.",
            "stories.html": "Create a story library page for Seven Minute Story Sessions. Stories organized by theme tabs: Animals, Adventure, Fantasy, Learning. Each story card shows: title, 7-min duration, TTS voice icon, upload date, YouTube view count, thumbnail. Search and filter. Child-safe design.",
            "story.html": "Create a story playback page for Seven Minute Story Sessions. Embedded audio player with play/pause/volume. Story text display with line-by-line highlighting synced to narration. Ambient sound toggle (rain, ocean, fireplace). Text size controls. Night mode button. Sleep timer (5-15 min).",
            "create.html": "Create a story creation form for Seven Minute Story Sessions. Form fields: theme dropdown, main character inputs, moral lesson, target age, TTS voice selector, ambient sound choices. Character counter for 7-minute estimate. Preview button. Production pipeline visualization.",
            "style.css": "Create soft CSS for Seven Minute Story Sessions. Pastel palette: lavender, soft blue, warm yellow, gentle pink. Rounded corners, large readable text, gentle fade-in animations, accessibility ARIA labels, button scaling on hover. Sleep-friendly reduced motion option.",
            "app.js": "Create JS for Seven Minute Story Sessions. Audio player controls with time display, sleep timer countdown, text-highlight sync engine, ambient sound mixer volume controls, fullscreen toggle, text size adjuster, story filtering by theme.",
        },
    },
    "innovation_hub": {
        "name": "Augmented Reality Vocational School",
        "output_dir": "innovation_hub/webapp",
        "files": {
            "index.html": "Create a dashboard for Augmented Reality Vocational School. Header 'Innovation Hub'. Tech stack visualization (Ollama 11434, Bolt.diy 5173, Hermes Agent). Active patent filings counter. R&D project status cards. IP portfolio summary with 7 subsidiaries. Sovereign stack badges. Security/no-cloud guarantees.",
            "patents.html": "Create a patent portal for Augmented Reality Vocational School. Filing form: title, abstract, claims (numbered), drawings upload, jurisdiction. Status tracking table: ID, title, status, filed date. IP family tree viewer. Search/filter by subsidiary and status (Submitted, Review, Granted).",
            "whitepapers.html": "Create a white paper management page for Augmented Reality Vocational School. List of technical papers with title, author, date, citations, status. Template selector for new papers. Cross-subsidiary collaboration projects list. Download/export buttons. Draft version history.",
            "tech-stack.html": "Create a sovereign tech stack documentation page for Augmented Reality Vocational School. Infrastructure diagram: Ollama on 11434, Bolt.diy on 5173, Hermes Agent, local-only. Security model explanation. Data flow diagrams. No-cloud guarantee badges. Docker container list (boltdiy, ollama, proxy, api, web).",
            "style.css": "Create professional tech CSS for Augmented Reality Vocational School. Dark theme with green terminal/code accents. Monospace fonts for code blocks. Grid dashboard layout. Data tables with alternating rows. Badge/status indicators. Circuit board subtle background pattern.",
            "app.js": "Create JS for Augmented Reality Vocational School. Patent form validation, tech stack interactive diagram with hover info, white paper template selector, IP portfolio filter by subsidiary, status badge color coding, data visualization for filing metrics.",
        },
    },
    "ewaste_recycling": {
        "name": "e-Waste Reclamation Division",
        "output_dir": "ewaste_recycling/webapp",
        "files": {
            "index.html": "Create a dashboard for EOL Recycling Company. Header 'e-Waste Reclamation Division'. Metrics cards: 1000kg input, gold recovery 100g, copper 150000g, palladium 50g. Gross values: gold $8820, copper $1488, palladium $2119, total $12427. Asset payload for crypto treasury. Logistics map.",
            "materials.html": "Create a materials recovery page for EOL Recycling Company. Metal recovery table: gold (0.1g/kg, $2500/oz, 100g recovered, $8820), copper (150g/kg, $4.50/lb, 150000g, $1488), palladium (0.05g/kg, $1200/oz, 50g, $2119). Spot price inputs with auto-calc. Recovery rate charts. Asset-value export for treasury.",
            "logistics.html": "Create a logistics management page for EOL Recycling Company. Collection point map with markers. Route optimization display. Batch processing schedule timeline. Truck assignment panel. Compliance checklist. E-waste weight input and material output projection.",
            "reports.html": "Create a reports page for EOL Recycling Company. Asset-value payload reports for crypto treasury integration. Reclamation certificate generator with digital signature. Environmental impact metrics (CO2 saved, landfill diverted). Regulatory compliance documentation. Export to PDF/CSV.",
            "style.css": "Create industrial CSS for EOL Recycling Company. Steel gray and safety orange palette. Bold data tables with metric units. Card-based layout with shadow depth. Hazard stripe accents. Dark mode with amber highlights. Responsive metric display. Clean technical charts.",
            "app.js": "Create JS for EOL Recycling Company. Metal price auto-calculator, recovery yield estimator, logistics route display, report generator with export, compliance checklist tracker, asset-value payload formatter for treasury.",
        },
    },
    "quantum_wearables": {
        "name": "Quantum Wearables Division",
        "output_dir": "quantum_wearables/webapp",
        "files": {
            "index.html": "Create a dashboard for Quantum Wearables Division. Header with sci-fi aesthetic. Thermal model status card. Biometric sensor readings (ECG, PPG, temp, IMU). Cold fission core metrics. Safety constraint monitors. Wearable device fleet overview. Dark theme with blue/cyan holographics.",
            "thermal.html": "Create a thermal model page for Quantum Wearables. Equations display: Q = m*c*DeltaT, P_radiated = epsilon*sigma*A*(T^4 - T_ambient^4). Real-time thermal simulation controls (mass, specific heat, temp delta). Constraint visualization: max skin 43C, peak 50C <5min, no active coolant >0.5W, passive only. Material selection guide.",
            "sensors.html": "Create a biometric sensor page for Quantum Wearables. Sensor manifest table: ECG, PPG, thermistor, 6-axis IMU. Columns: type, sampling rate, accuracy, data sync status, calibration date. Real-time readout display. Calibration history log. Data export for health records.",
            "safety.html": "Create safety constraints page for Quantum Wearables. Biomedical limits: isolation >10M-Ohm, leakage <100uA. Radiation shielding requirements (cold fission). Emergency shutdown procedures flowchart. Compliance certificates list. Safety violation alert system.",
            "style.css": "Create high-tech CSS for Quantum Wearables. Dark theme with blue/cyan holographic UI. Precision gauge designs with circular meters. Data visualization panels. Clean technical typography. Neon border accents. Smooth data refresh animations. Responsive sensor grid.",
            "app.js": "Create JS for Quantum Wearables. Thermal model calculator (Q=m*c*dT), sensor data real-time display with websocket simulation, safety limit violation alerts, wearable pairing simulation, emergency shutdown trigger, data export for health records.",
        },
    },
}


def call_bolt_api(messages, max_steps=1, timeout=90):
    """Call the Bolt API and return the full SSE response."""
    payload = json.dumps({
        "messages": messages,
        "files": {},
        "contextOptimization": False,
        "chatMode": "build",
        "maxLLMSteps": max_steps
    })

    cmd = [
        'curl', '-s',
        BOLT_API_URL,
        '-X', 'POST',
        '-H', 'Content-Type: application/json',
        '-H', f'Cookie: {BOLT_COOKIE}',
        '-d', payload
    ]

    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        return result.stdout
    except subprocess.TimeoutExpired:
        print(f"  WARNING: API call timed out after {timeout}s")
        return ''


def parse_sse_response(raw):
    """Parse SSE response from Bolt API into text and tool calls."""
    full_text = ''
    tool_calls = []

    for line in raw.strip().split('\n'):
        line = line.strip()
        if not line:
            continue
        if line.startswith('0:'):
            text = line[2:].strip()
            try:
                text = json.loads(text)
            except:
                pass
            full_text += text
        elif line.startswith('8:'):
            try:
                tc = json.loads(line[2:])
                tool_calls.append(tc)
            except:
                pass
        elif line.startswith('d:'):
            try:
                d = json.loads(line[2:])
                if isinstance(d, dict) and d.get('type') == 'boltAction':
                    tool_calls.append(d)
            except:
                pass

    return full_text, tool_calls


def extract_code(text):
    """Extract code from the model response, handling markdown code blocks."""
    # Try to find code block with language
    code_match = re.search(r'```(?:\w+)\n(.*)```', text, re.DOTALL)
    if code_match:
        return code_match.group(1).strip()

    # Try to find any code block
    code_match = re.search(r'```\n(.*)```', text, re.DOTALL)
    if code_match:
        return code_match.group(1).strip()

    # No code block, return raw text (stripped of leading conversational text)
    lines = text.strip().split('\n')
    # Find the first line that looks like code (HTML tag, CSS selector, etc.)
    code_lines = []
    in_code = False
    for line in lines:
        if line.startswith('<') or line.startswith('@') or line.startswith('.') or \
           line.startswith('#') or line.startswith('$') or line.startswith('function') or \
           line.startswith('const') or line.startswith('let') or line.startswith('var') or \
           line.startswith('export') or in_code:
            in_code = True
            code_lines.append(line)
    if code_lines:
        return '\n'.join(code_lines)

    # Return everything stripped
    return text.strip()


def generate_file(filename, prompt, timeout=90):
    """Generate a single file using the Bolt API."""
    print(f"  Generating {filename}...", end='', flush=True)

    messages = [
        {
            "id": f"bolt-gen-{int(time.time())}",
            "role": "user",
            "content": f"[Model: gemma3:1b]\n\n[Provider: Ollama]\n\n{prompt}\n\nRespond ONLY with the {filename.split('.')[-1]} code, no extra commentary. Wrap in ```{filename.split('.')[-1]}``` code block."
        }
    ]

    raw_response = call_bolt_api(messages, max_steps=1, timeout=timeout)

    if not raw_response:
        print(f" TIMEOUT/ERROR")
        return None

    text, _ = parse_sse_response(raw_response)
    code = extract_code(text)

    if code:
        print(f" OK ({len(code)} chars)")
        return code
    else:
        print(f" EMPTY")
        print(f"  Response: {text[:200]}...")
        return None


def generate_subsidiary_app(subsidiary_key, subsidiary_data):
    """Generate web app for a single subsidiary."""
    print(f"\n{'='*60}")
    print(f"Generating web app: {subsidiary_data['name']}")
    print(f"{'='*60}")

    output_dir = Path(CORPORATE_RUNTIME) / subsidiary_data['output_dir']
    output_dir.mkdir(parents=True, exist_ok=True)

    saved_files = []
    for filename, prompt in subsidiary_data['files'].items():
        code = generate_file(filename, prompt)
        if code:
            file_path = output_dir / filename
            file_path.write_text(code, encoding='utf-8')
            saved_files.append(str(file_path))
        else:
            # Fallback: create a minimal version ourselves
            print(f"  Creating fallback for {filename}...", end='', flush=True)
            fallback = create_fallback(filename, subsidiary_key)
            file_path = output_dir / filename
            file_path.write_text(fallback, encoding='utf-8')
            saved_files.append(str(file_path))
            print(" OK (fallback)")

    return saved_files


def create_fallback(filename, subsidiary_key):
    """Create a minimal fallback file if the API fails."""
    if filename.endswith('.html'):
        return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{SUBSIDIARIES[subsidiary_key]['name']} - {filename.replace('.html','').title()}</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <header>
        <h1>{SUBSIDIARIES[subsidiary_key]['name']}</h1>
        <nav><a href="index.html">Home</a></nav>
    </header>
    <main>
        <h2>{filename.replace('.html','').title()} Page</h2>
        <p>Page for {SUBSIDIARIES[subsidiary_key]['name']}.</p>
    </main>
    <script src="app.js"></script>
</body>
</html>"""
    elif filename.endswith('.css'):
        return """/* KingDesignCollectiveINC Corporation Subsidiary Styles */
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: system-ui, sans-serif; line-height: 1.6; }
header { padding: 1rem 2rem; background: #1a1a2e; color: white; }
main { padding: 2rem; max-width: 1200px; margin: 0 auto; }
"""
    elif filename.endswith('.js'):
        return """// KingDesignCollectiveINC Corporation Subsidiary App JS
document.addEventListener('DOMContentLoaded', function() {
    console.log('App loaded');
});
"""
    return ""


def deploy_to_bolt():
    """Deploy all corporate_runtime webapp files to the Bolt.diy container."""
    import tarfile
    print("\n" + "="*60)
    print("Deploying to Bolt.diy container")
    print("="*60)

    tarball = r"C:\Users\young\KingDesignCollectiveINC_deploy.tar.gz"
    with tarfile.open(tarball, "w:gz") as tar:
        for subsidiary_key, data in SUBSIDIARIES.items():
            webapp_dir = os.path.join(CORPORATE_RUNTIME, subsidiary_key, "webapp")
            if os.path.isdir(webapp_dir):
                arcname = f"{subsidiary_key}/webapp"
                tar.add(webapp_dir, arcname=arcname)
                print(f"  Added: {subsidiary_key}/webapp")

        # Add the KingDesignCollectiveINC portal index
        index_path = os.path.join(CORPORATE_RUNTIME, "KingDesignCollectiveINC_apps_index.html")
        if os.path.isfile(index_path):
            tar.add(index_path, arcname="KingDesignCollectiveINC_apps_index.html")
            print("  Added: KingDesignCollectiveINC_apps_index.html")

        # Add KingDesignCollectiveINC UI shared design system
        manifest_path = os.path.join(CORPORATE_RUNTIME, "KingDesignCollectiveINC-ui.json")
        if os.path.isfile(manifest_path):
            tar.add(manifest_path, arcname="KingDesignCollectiveINC-ui.json")
            print("  Added: KingDesignCollectiveINC-ui.json")

        # Add KingDesignCollectiveINC-ui shared assets
        ui_css = os.path.join(CORPORATE_RUNTIME, "shoe_brand", "webapp", "styles", "KingDesignCollectiveINC-ui.css")
        ui_js = os.path.join(CORPORATE_RUNTIME, "shoe_brand", "webapp", "scripts", "KingDesignCollectiveINC-ui.js")
        if os.path.isfile(ui_css):
            tar.add(ui_css, arcname="KingDesignCollectiveINC-ui/KingDesignCollectiveINC-ui.css")
            print("  Added: KingDesignCollectiveINC-ui/KingDesignCollectiveINC-ui.css")
        if os.path.isfile(ui_js):
            tar.add(ui_js, arcname="KingDesignCollectiveINC-ui/KingDesignCollectiveINC-ui.js")
            print("  Added: KingDesignCollectiveINC-ui/KingDesignCollectiveINC-ui.js")

        # Add KingDesignCollectiveINC-portal shared assets
        portal_css = os.path.join(CORPORATE_RUNTIME, "KingDesignCollectiveINC-portal.css")
        portal_js = os.path.join(CORPORATE_RUNTIME, "KingDesignCollectiveINC-portal.js")
        if os.path.isfile(portal_css):
            tar.add(portal_css, arcname="KingDesignCollectiveINC-portal.css")
            print("  Added: KingDesignCollectiveINC-portal.css")
        if os.path.isfile(portal_js):
            tar.add(portal_js, arcname="KingDesignCollectiveINC-portal.js")
            print("  Added: KingDesignCollectiveINC-portal.js")

    # Copy tarball to container and extract
    subprocess.run(
        ["docker", "cp", tarball, "boltdiy-kingdesign:/tmp/KingDesignCollectiveINC_deploy.tar.gz"],
        capture_output=True, text=True
    )
    subprocess.run(
        ["docker", "exec", "boltdiy-kingdesign", "bash", "-c",
         "cd /home/project && rm -rf KingDesignCollective/* && mkdir -p KingDesignCollective && tar xzf /tmp/KingDesignCollectiveINC_deploy.tar.gz -C /home/project/KingDesignCollective"],
        capture_output=True, text=True
    )
    subprocess.run(
        ["docker", "exec", "boltdiy-kingdesign", "rm", "/tmp/KingDesignCollectiveINC_deploy.tar.gz"],
        capture_output=True, text=True
    )
    os.remove(tarball)

    # Verify
    result = subprocess.run(
        ["docker", "exec", "boltdiy-kingdesign", "find", "/home/project/KingDesignCollective", "-type", "f"],
        capture_output=True, text=True
    )
    file_count = len(result.stdout.strip().split('\n')) if result.stdout.strip() else 0
    print(f"\n  Deployed {file_count} files to Bolt container at /home/project/KingDesignCollective/")


def deploy_to_gh_pages():
    """Deploy all corporate_runtime webapp files to GitHub Pages (KingDesignCollectiveinc repo)."""
    import tarfile
    print("\n" + "="*60)
    print("Deploying to GitHub Pages")
    print("="*60)

    gh_repo = r"C:\Users\young\agents\KingDesignCollectiveinc"

    if not os.path.isdir(gh_repo):
        print("  ERROR: KingDesignCollectiveinc repo not found at", gh_repo)
        return False

    # Sync assets from corporate_runtime to GH Pages repo
    assets_dir = os.path.join(gh_repo, "assets")

    # Map subsidiary keys to assets directory names
    assets_map = {k: k.replace("_", "-") for k in SUBSIDIARIES.keys()}

    for subsidiary_key, assets_name in assets_map.items():
        src = os.path.join(CORPORATE_RUNTIME, subsidiary_key, "webapp")
        dst = os.path.join(assets_dir, assets_name)

        if os.path.isdir(src):
            if os.path.exists(dst):
                shutil.rmtree(dst)
            shutil.copytree(src, dst)
            file_count = sum(1 for _ in os.walk(dst) for f in _[2])
            print(f"  {assets_name}: {file_count} files")

    # Also copy the KingDesignCollectiveINC portal index if it exists
    portal_index = os.path.join(CORPORATE_RUNTIME, "KingDesignCollectiveINC_apps_index.html")
    if os.path.isfile(portal_index):
        shutil.copy2(portal_index, os.path.join(gh_repo, "KingDesignCollectiveINC_apps_index.html"))
        print("  KingDesignCollectiveINC_apps_index.html: copied")

    # Copy KingDesignCollectiveINC UI manifest
    manifest_path = os.path.join(CORPORATE_RUNTIME, "KingDesignCollectiveINC-ui.json")
    if os.path.isfile(manifest_path):
        shutil.copy2(manifest_path, os.path.join(assets_dir, "KingDesignCollectiveINC-ui.json"))
        print("  KingDesignCollectiveINC-ui.json: manifest copied")

    # Copy KingDesignCollectiveINC UI shared assets
    ui_css = os.path.join(CORPORATE_RUNTIME, "shoe_brand", "webapp", "styles", "KingDesignCollectiveINC-ui.css")
    if os.path.isfile(ui_css):
        shutil.copy2(ui_css, os.path.join(assets_dir, "KingDesignCollectiveINC-ui.css"))
    ui_js = os.path.join(CORPORATE_RUNTIME, "shoe_brand", "webapp", "scripts", "KingDesignCollectiveINC-ui.js")
    if os.path.isfile(ui_js):
        shutil.copy2(ui_js, os.path.join(assets_dir, "KingDesignCollectiveINC-ui.js"))

    # Copy KingDesignCollectiveINC-portal shared assets
    portal_css = os.path.join(CORPORATE_RUNTIME, "KingDesignCollectiveINC-portal.css")
    if os.path.isfile(portal_css):
        shutil.copy2(portal_css, os.path.join(assets_dir, "KingDesignCollectiveINC-portal.css"))
        print("  KingDesignCollectiveINC-portal.css: copied")
    portal_js = os.path.join(CORPORATE_RUNTIME, "KingDesignCollectiveINC-portal.js")
    if os.path.isfile(portal_js):
        shutil.copy2(portal_js, os.path.join(assets_dir, "KingDesignCollectiveINC-portal.js"))
        print("  KingDesignCollectiveINC-portal.js: copied")

    # Commit and push to both main and gh-pages
    subprocess.run(["git", "add", "-A"], cwd=gh_repo, capture_output=True, text=True)
    subprocess.run(
        ["git", "commit", "-m", "Deploy all 7 subsidiary webapps to GitHub Pages"],
        cwd=gh_repo, capture_output=True, text=True
    )
    subprocess.run(["git", "push", "origin", "main"], cwd=gh_repo, capture_output=True, text=True)

    # Also push to gh-pages branch
    subprocess.run(["git", "checkout", "gh-pages"], cwd=gh_repo, capture_output=True, text=True)
    subprocess.run(["git", "checkout", "main", "--", "assets/", "index.html", ".nojekyll", "KingDesignCollectiveINC-ui.json", "KingDesignCollectiveINC-portal.css", "KingDesignCollectiveINC-portal.js"],
                    cwd=gh_repo, capture_output=True, text=True)
    subprocess.run(["git", "add", "-A"], cwd=gh_repo, capture_output=True, text=True)
    subprocess.run(
        ["git", "commit", "-m", "Deploy all 7 subsidiary webapps to gh-pages"],
        cwd=gh_repo, capture_output=True, text=True
    )
    subprocess.run(["git", "push", "origin", "gh-pages"], cwd=gh_repo, capture_output=True, text=True)
    subprocess.run(["git", "checkout", "main"], cwd=gh_repo, capture_output=True, text=True)

    print("\n  Deployment complete!")


def main():
    target = sys.argv[1] if len(sys.argv) > 1 else None

    if target and target == "deploy-bolt":
        deploy_to_bolt()
        return

    if target and target == "deploy-gh":
        deploy_to_gh_pages()
        return

    if target and target == "deploy-all":
        deploy_to_bolt()
        deploy_to_gh_pages()
        return

    if target:
        if target not in SUBSIDIARIES:
            print(f"Error: '{target}' is not a valid subsidiary key.")
            print(f"Valid keys: {', '.join(SUBSIDIARIES.keys())}")
            print(f"Special commands: deploy-bolt, deploy-gh, deploy-all")
            sys.exit(1)
        saved = generate_subsidiary_app(target, SUBSIDIARIES[target])
        print(f"\n  Created {len(saved)} files:")
        for s in saved:
            print(f"    {s}")
    else:
        all_saved = {}
        for key, data in SUBSIDIARIES.items():
            saved = generate_subsidiary_app(key, data)
            all_saved[key] = saved

        print(f"\n{'='*60}")
        print("GENERATION SUMMARY")
        print(f"{'='*60}")
        total_files = 0
        for key, saved in all_saved.items():
            count = len(saved)
            total_files += count
            print(f"  {key}: {count} files")
        print(f"  Total: {total_files} files across {len(all_saved)} subsidiaries")


if __name__ == '__main__':
    main()
