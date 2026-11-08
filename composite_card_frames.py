#!/usr/bin/env python3
"""
Aura Champions Card Frame Compositor
Composites generated art onto card frames with element-colored borders, 
rarity stars, and stat boxes.
"""
import json
import os
from PIL import Image, ImageDraw, ImageFont, ImageOps

# Paths
OUTPUT_DIR = r"C:\Users\young\agents\aura_champions_card_art"
ART_RAW_DIR = os.path.join(OUTPUT_DIR, "art_raw")
FRAME_DIR = os.path.join(OUTPUT_DIR, "card_frames")
COMFY_OUTPUT_DIR = r"C:\Users\young\AppData\Local\Comfy-Desktop\ComfyUI-Installs\Dom Ter\ComfyUI\output"
PROMPTS_FILE = os.path.join(OUTPUT_DIR, "prompts.json")
RESULTS_FILE = os.path.join(OUTPUT_DIR, "generation_results.json")
CARDS_JSON = os.path.join(OUTPUT_DIR, "cards.json")

# Element info
ELEMENTS = {
    0: {"name": "Solar", "color": "#FFD700", "hex": (255, 215, 0)},
    1: {"name": "Lunar", "color": "#C0C0C0", "hex": (192, 192, 192)},
    2: {"name": "Void", "color": "#8A2BE2", "hex": (138, 43, 226)},
    3: {"name": "Stellar", "color": "#4169E1", "hex": (65, 105, 225)},
    4: {"name": "Terra", "color": "#228B22", "hex": (34, 139, 34)},
}

RARITY_STARS = {1: 1, 2: 2, 3: 3, 4: 4, 5: 5}
RARITY_RARITY_NAMES = {1: "Common", 2: "Uncommon", 3: "Rare", 4: "Epic", 5: "Legendary"}

# Card dimensions
CARD_WIDTH = 768
CARD_HEIGHT = 1024
BORDER_WIDTH = 20


def find_art_image(card_num):
    """Find the generated art image for a card by number."""
    # ComfyUI saves as aura_card_art_000XX_.png
    padded = f"{card_num:05d}"
    path = os.path.join(COMFY_OUTPUT_DIR, f"aura_card_art_{padded}_.png")
    if os.path.exists(path):
        return path
    # Try alternate naming
    path = os.path.join(COMFY_OUTPUT_DIR, f"aura_card_art_{card_num:05d}.png")
    if os.path.exists(path):
        return path
    return None


def create_card_frame(card_data):
    """Create a card frame with element border, rarity stars, and stat box."""
    art_path = find_art_image(card_data["card_id"])
    if not art_path:
        return None
    
    art = Image.open(art_path).convert("RGB")
    # Resize art to fit within card (leaving room for borders)
    art_inner_w = CARD_WIDTH - 2 * BORDER_WIDTH - 40
    art_inner_h = CARD_HEIGHT - 2 * BORDER_WIDTH - 120  # Extra space for stat box at bottom
    art = art.resize((art_inner_w, art_inner_h), Image.LANCZOS)
    
    # Create card base
    elem_info = ELEMENTS.get(card_data["element"], ELEMENTS[0])
    elem_color = elem_info["hex"]
    
    card_img = Image.new("RGB", (CARD_WIDTH, CARD_HEIGHT), elem_color)
    draw = ImageDraw.Draw(card_img)
    
    # Inner background (slightly smaller rectangle for the card body)
    inner_color = (25, 25, 35, 255)
    card_img.paste(inner_color, (BORDER_WIDTH, BORDER_WIDTH, CARD_WIDTH - BORDER_WIDTH, CARD_HEIGHT - BORDER_WIDTH))
    
    # Paste art
    art_x = BORDER_WIDTH + 20
    art_y = BORDER_WIDTH + 20
    card_img.paste(art, (art_x, art_y))
    
    # Draw outer border (element color)
    for i in range(BORDER_WIDTH):
        outline_color = tuple(int(c * (1 - i / BORDER_WIDTH * 0.3)) for c in elem_color)
        draw.rectangle(
            [i, i, CARD_WIDTH - 1 - i, CARD_HEIGHT - 1 - i],
            outline=outline_color, width=1
        )
    
    # Rarity stars at top
    num_stars = RARITY_STARS.get(card_data["rarity"], 1)
    star_y = BORDER_WIDTH + 5
    star_spacing = 35
    star_x_start = (CARD_WIDTH - num_stars * star_spacing + star_spacing) // 2
    star_color = elem_color
    
    # Draw stars (use text or simple shapes)
    try:
        font_star = ImageFont.truetype("arial.ttf", 24)
    except:
        font_star = ImageFont.load_default()
    for i in range(num_stars):
        star_x = star_x_start + i * star_spacing
        draw.text((star_x, star_y), "*", fill=star_color, font=font_star)
    
    # Card name at top
    try:
        font_name = ImageFont.truetype("arial.ttf", 28)
    except:
        font_name = ImageFont.load_default()
    name_text = f"{card_data['name']}"
    draw.text((CARD_WIDTH // 2, BORDER_WIDTH + 35), name_text, fill=(255, 255, 255),
              font=font_name, anchor="mt")
    
    # Element icon
    elem_text = elem_info["name"][:3].upper()
    try:
        font_elem = ImageFont.truetype("arial.ttf", 20)
    except:
        font_elem = ImageFont.load_default()
    draw.text((CARD_WIDTH - BORDER_WIDTH - 40, BORDER_WIDTH + 5), elem_text,
              fill=elem_color, font=font_elem)
    
    # Stat box at bottom
    stat_box_h = 80
    stat_box_y = CARD_HEIGHT - BORDER_WIDTH - stat_box_h
    stat_box_color = (20, 20, 30, 220)
    card_img.paste(stat_box_color, (BORDER_WIDTH, stat_box_y, CARD_WIDTH - BORDER_WIDTH, CARD_HEIGHT - BORDER_WIDTH))
    
    try:
        font_stat = ImageFont.truetype("arial.ttf", 22)
        font_stat_small = ImageFont.truetype("arial.ttf", 18)
    except:
        font_stat = font_stat_small = ImageFont.load_default()
    
    # Draw stat labels
    rarity_name = RARITY_RARITY_NAMES.get(card_data["rarity"], "Unknown")
    draw.text((BORDER_WIDTH + 15, stat_box_y + 10), f"Rarity: {rarity_name}",
              fill=elem_color, font=font_stat)
    
    if card_data.get("is_equipment"):
        stats = card_data.get("stats", {})
        stat_text = f"Atk: {stats.get('atk', 0)}  Def: {stats.get('def', 0)}  Spd: {stats.get('spd', 0)}"
        draw.text((BORDER_WIDTH + 15, stat_box_y + 40), stat_text, fill=(200, 200, 200), font=font_stat_small)
    else:
        stats = card_data.get("stats", {})
        stat_text = f"HP: {stats.get('hp', 0)}  ATK: {stats.get('atk', 0)}  DEF: {stats.get('def', 0)}  SPD: {stats.get('spd', 0)}"
        draw.text((BORDER_WIDTH + 15, stat_box_y + 40), stat_text, fill=(200, 200, 200), font=font_stat_small)
    
    # Cost
    cost_text = f"COST: {card_data.get('cost', card_data['card_id'] % 10)}"
    draw.text((CARD_WIDTH - BORDER_WIDTH - 80, stat_box_y + 40), cost_text,
              fill=(255, 255, 255), font=font_stat_small)
    
    return card_img


def main():
    os.makedirs(FRAME_DIR, exist_ok=True)
    os.makedirs(ART_RAW_DIR, exist_ok=True)
    
    with open(PROMPTS_FILE, 'r') as f:
        cards = json.load(f)
    
    print(f"Loaded {len(cards)} cards")
    
    success = 0
    failed = 0
    
    for card in cards:
        framed = create_card_frame(card)
        if framed:
            output_path = os.path.join(FRAME_DIR, f"card_{card['card_id']:03d}.png")
            framed.save(output_path, "PNG")
            success += 1
            print(f"  Card {card['card_id']:03d}: {card['name']} - framed OK")
        else:
            failed += 1
            print(f"  Card {card['card_id']:03d}: {card['name']} - NO ART FOUND")
    
    print(f"\nSummary: {success} framed, {failed} failed out of {len(cards)}")
    
    # Save updated cards.json with art paths
    for card in cards:
        art_path = find_art_image(card["card_id"])
        card["art_path"] = art_path
        frame_path = os.path.join(FRAME_DIR, f"card_{card['card_id']:03d}.png")
        card["frame_path"] = frame_path if os.path.exists(frame_path) else None
    
    with open(CARDS_JSON, 'w') as f:
        json.dump(cards, f, indent=2)
    print(f"\nSaved card data to {CARDS_JSON}")


if __name__ == "__main__":
    main()
