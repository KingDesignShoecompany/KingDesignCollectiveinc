#!/usr/bin/env python3
# aura_opt2_sim.py - 3v3 battle simulation (SIMULATION, no live battle-engine service exists)
# Uses REAL card_registry data for the specified card IDs.
# Ruleset documented inline. Deterministic (seeded) so reproducible.
import json, random

random.seed(0x1234)

# --- Real card data pulled from card_registry (card_id -> record) ---
CARDS = {
    17: {"name":"Monster #17","type":"monster","hp":165,"atk":36,"def":40,"spd":24,"element":2,"rarity":3},
    34: {"name":"Monster #34","type":"monster","hp":150,"atk":42,"def":55,"spd":18,"element":4,"rarity":5},
    51: {"name":"Monster #51","type":"monster","hp":135,"atk":48,"def":34,"spd":12,"element":1,"rarity":2},
    68: {"name":"Monster #68","type":"monster","hp":120,"atk":54,"def":49,"spd":26,"element":3,"rarity":4},
    85: {"name":"Monster #85","type":"monster","hp":105,"atk":60,"def":28,"spd":20,"element":0,"rarity":1},
    102:{"name":"Gear #102","type":"equipment","element":2,"statBonuses":{"atk":4,"def":12,"spd":0}},
}
ELEMENTS = {0:"Null",1:"Solar",2:"Lunar",3:"Void",4:"Stellar"}
# Element affinity (simple rock-paper-scissors-ish): attacker element -> defender element -> mult
# Lunar(2) > Void(3) > Stellar(4) > Solar(1) > Null(0) > Lunar(2)
STRONG = {2:3, 3:4, 4:1, 1:0, 0:2}
def mult(ae, de):
    if ae == de: return 1.0
    if STRONG.get(ae) == de: return 1.25
    if STRONG.get(de) == ae: return 0.8
    return 1.0

def make_unit(cid, team):
    c = CARDS[cid]
    if c["type"] == "equipment":
        return {"cid":cid,"name":c["name"],"type":"equipment","element":c["element"],"bonus":c["statBonuses"],"team":team}
    return {"cid":cid,"name":c["name"],"type":"monster","hp":c["hp"],"maxhp":c["hp"],
            "atk":c["atk"],"def":c["def"],"spd":c["spd"],"element":c["element"],
            "rarity":c["rarity"],"team":team,"alive":True,"buffs":[],"debuffs":[]}

# Team A = {0x11,0x22,0x33} = 17,34,51 ; Team B = {0x44,0x55,0x66} = 68,85,102(equipment)
teamA = [make_unit(17,"A"), make_unit(34,"A"), make_unit(51,"A")]
teamB = [make_unit(68,"B"), make_unit(85,"B")]
gear = make_unit(102,"B")
# Equip gear#102 onto Team B's fastest monster (68) per standard equip rule
host = max(teamB, key=lambda u: u["spd"])
host["atk"] += gear["bonus"]["atk"]; host["def"] += gear["bonus"]["def"]; host["spd"] += gear["bonus"]["spd"]
host["equipped"] = gear["name"]
all_units = teamA + teamB

def eff_atk(u):
    b = 1.0
    for bf in u.get("buffs",[]):
        if bf["kind"]=="spectral": b += 0.12*bf["stacks"]
    return u["atk"]*b

def trinity_check(team_units):
    mons = [u for u in team_units if u["type"]=="monster" and u["alive"]]
    if len(mons) >= 3:
        elems = [u["element"] for u in mons]
        for e in set(elems):
            if elems.count(e) >= 3:
                return e
    return None

turn = 0
log = []
trinity_events = []
summary_actions = []
while True:
    turn += 1
    if turn > 30: break
    # turn order by speed desc
    order = sorted([u for u in all_units if u.get("alive")], key=lambda u:-u["spd"])
    # Trinity check at start of turn
    for team, units in (("A",teamA),("B",teamB)):
        e = trinity_check(units)
        if e is not None and not any(t["turn"]==turn and t["team"]==team for t in trinity_events):
            trinity_events.append({"turn":turn,"team":team,"element":ELEMENTS[e],"effect":"Astral Convergence (sim)","stacks":sum(1 for u in units if u["type"]=="monster" and u["element"]==e)})
            for u in units:
                if u["type"]=="monster":
                    u["buffs"].append({"kind":"spectral","stacks":3})
            log.append(f"[T{turn}] TRINITY: Team {team} Astral Convergence ({ELEMENTS[e]}) -> +36% spectral dmg 3 turns")
    for actor in order:
        if not actor.get("alive"): continue
        enemies = [u for u in all_units if u["team"]!=actor["team"] and u.get("alive")]
        if not enemies: break
        target = min(enemies, key=lambda u:u["hp"])
        base = eff_atk(actor)
        dmg = max(1, int((base - target["def"]) * mult(actor["element"], target["element"])))
        target["hp"] -= dmg
        act = {"turn":turn,"actor":actor["name"],"target":target["name"],
               "damage":dmg,"element":ELEMENTS[actor["element"]],
               "target_hp_after":max(0,target["hp"]),"target_element":ELEMENTS[target["element"]]}
        if actor["buffs"]: act["buffs"]=[f"spectral x{sum(b['stacks'] for b in actor['buffs'])}"]
        summary_actions.append(act)
        log.append(f"[T{turn}] {actor['name']}({ELEMENTS[actor['element']]}) -> {target['name']} for {dmg} dmg (hp {max(0,target['hp'])})")
        if target["hp"] <= 0:
            target["alive"]=False
            log.append(f"[T{turn}]   {target['name']} DEFEATED")
            # decay trinity buffs on death-team? keep simple
    a_alive = any(u.get("alive") for u in teamA)
    b_alive = any(u.get("alive") for u in teamB)
    if not a_alive or not b_alive:
        break

winner = "A" if any(u.get("alive") for u in teamA) else "B"
final_hp = {f"A_{u['name']}":max(0,u['hp']) for u in teamA}
final_hp.update({f"B_{u['name']}":max(0,u['hp']) for u in teamB})

print("=== OPTION 2: 3v3 SIMULATION (deterministic) ===")
print("Team A:", [f"{u['name']}({ELEMENTS[u['element']]},hp{u['hp']})" for u in teamA])
print("Team B:", [f"{u['name']}({ELEMENTS[u['element']]},hp{u['hp']})" for u in teamB], f"+ {gear['name']}(equipped by {host['name']})")
print()
print("Turn-by-turn:")
for l in log: print(" ", l)
print()
summary = {
    "winner": f"Team {winner}",
    "turns": turn,
    "final_hp": final_hp,
    "action_history": summary_actions,
    "trinity_activations": trinity_events,
    "note": "SIMULATION — no autonomous battle-engine service exists in the stack; ran deterministic ruleset on real card_registry stats."
}
print("=== SUMMARY OBJECT ===")
print(json.dumps(summary, indent=2))
