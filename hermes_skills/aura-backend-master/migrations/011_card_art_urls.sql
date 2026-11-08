-- 011_card_art_urls.sql
-- Update card_registry with art_url paths for all 150 generated card art images.
-- Art generated via ComfyUI (SDXL) with element-themed prompts.
-- Frames composited with element-colored borders, rarity stars, and stat boxes.

-- Card 1: Monster #1
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/001.png'::text), true) WHERE card_id = 1;
-- Card 2: Monster #2
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/002.png'::text), true) WHERE card_id = 2;
-- Card 3: Monster #3
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/003.png'::text), true) WHERE card_id = 3;
-- Card 4: Monster #4
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/004.png'::text), true) WHERE card_id = 4;
-- Card 5: Monster #5
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/005.png'::text), true) WHERE card_id = 5;
-- Card 6: Monster #6
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/006.png'::text), true) WHERE card_id = 6;
-- Card 7: Monster #7
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/007.png'::text), true) WHERE card_id = 7;
-- Card 8: Monster #8
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/008.png'::text), true) WHERE card_id = 8;
-- Card 9: Monster #9
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/009.png'::text), true) WHERE card_id = 9;
-- Card 10: Monster #10
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/010.png'::text), true) WHERE card_id = 10;
-- Card 11: Monster #11
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/011.png'::text), true) WHERE card_id = 11;
-- Card 12: Monster #12
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/012.png'::text), true) WHERE card_id = 12;
-- Card 13: Monster #13
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/013.png'::text), true) WHERE card_id = 13;
-- Card 14: Monster #14
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/014.png'::text), true) WHERE card_id = 14;
-- Card 15: Monster #15
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/015.png'::text), true) WHERE card_id = 15;
-- Card 16: Monster #16
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/016.png'::text), true) WHERE card_id = 16;
-- Card 17: Monster #17
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/017.png'::text), true) WHERE card_id = 17;
-- Card 18: Monster #18
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/018.png'::text), true) WHERE card_id = 18;
-- Card 19: Monster #19
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/019.png'::text), true) WHERE card_id = 19;
-- Card 20: Monster #20
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/020.png'::text), true) WHERE card_id = 20;
-- Card 21: Monster #21
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/021.png'::text), true) WHERE card_id = 21;
-- Card 22: Monster #22
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/022.png'::text), true) WHERE card_id = 22;
-- Card 23: Monster #23
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/023.png'::text), true) WHERE card_id = 23;
-- Card 24: Monster #24
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/024.png'::text), true) WHERE card_id = 24;
-- Card 25: Monster #25
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/025.png'::text), true) WHERE card_id = 25;
-- Card 26: Monster #26
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/026.png'::text), true) WHERE card_id = 26;
-- Card 27: Monster #27
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/027.png'::text), true) WHERE card_id = 27;
-- Card 28: Monster #28
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/028.png'::text), true) WHERE card_id = 28;
-- Card 29: Monster #29
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/029.png'::text), true) WHERE card_id = 29;
-- Card 30: Monster #30
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/030.png'::text), true) WHERE card_id = 30;
-- Card 31: Monster #31
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/031.png'::text), true) WHERE card_id = 31;
-- Card 32: Monster #32
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/032.png'::text), true) WHERE card_id = 32;
-- Card 33: Monster #33
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/033.png'::text), true) WHERE card_id = 33;
-- Card 34: Monster #34
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/034.png'::text), true) WHERE card_id = 34;
-- Card 35: Monster #35
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/035.png'::text), true) WHERE card_id = 35;
-- Card 36: Monster #36
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/036.png'::text), true) WHERE card_id = 36;
-- Card 37: Monster #37
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/037.png'::text), true) WHERE card_id = 37;
-- Card 38: Monster #38
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/038.png'::text), true) WHERE card_id = 38;
-- Card 39: Monster #39
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/039.png'::text), true) WHERE card_id = 39;
-- Card 40: Monster #40
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/040.png'::text), true) WHERE card_id = 40;
-- Card 41: Monster #41
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/041.png'::text), true) WHERE card_id = 41;
-- Card 42: Monster #42
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/042.png'::text), true) WHERE card_id = 42;
-- Card 43: Monster #43
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/043.png'::text), true) WHERE card_id = 43;
-- Card 44: Monster #44
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/044.png'::text), true) WHERE card_id = 44;
-- Card 45: Monster #45
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/045.png'::text), true) WHERE card_id = 45;
-- Card 46: Monster #46
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/046.png'::text), true) WHERE card_id = 46;
-- Card 47: Monster #47
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/047.png'::text), true) WHERE card_id = 47;
-- Card 48: Monster #48
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/048.png'::text), true) WHERE card_id = 48;
-- Card 49: Monster #49
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/049.png'::text), true) WHERE card_id = 49;
-- Card 50: Monster #50
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/050.png'::text), true) WHERE card_id = 50;
-- Card 51: Monster #51
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/051.png'::text), true) WHERE card_id = 51;
-- Card 52: Monster #52
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/052.png'::text), true) WHERE card_id = 52;
-- Card 53: Monster #53
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/053.png'::text), true) WHERE card_id = 53;
-- Card 54: Monster #54
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/054.png'::text), true) WHERE card_id = 54;
-- Card 55: Monster #55
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/055.png'::text), true) WHERE card_id = 55;
-- Card 56: Monster #56
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/056.png'::text), true) WHERE card_id = 56;
-- Card 57: Monster #57
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/057.png'::text), true) WHERE card_id = 57;
-- Card 58: Monster #58
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/058.png'::text), true) WHERE card_id = 58;
-- Card 59: Monster #59
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/059.png'::text), true) WHERE card_id = 59;
-- Card 60: Monster #60
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/060.png'::text), true) WHERE card_id = 60;
-- Card 61: Monster #61
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/061.png'::text), true) WHERE card_id = 61;
-- Card 62: Monster #62
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/062.png'::text), true) WHERE card_id = 62;
-- Card 63: Monster #63
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/063.png'::text), true) WHERE card_id = 63;
-- Card 64: Monster #64
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/064.png'::text), true) WHERE card_id = 64;
-- Card 65: Monster #65
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/065.png'::text), true) WHERE card_id = 65;
-- Card 66: Monster #66
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/066.png'::text), true) WHERE card_id = 66;
-- Card 67: Monster #67
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/067.png'::text), true) WHERE card_id = 67;
-- Card 68: Monster #68
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/068.png'::text), true) WHERE card_id = 68;
-- Card 69: Monster #69
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/069.png'::text), true) WHERE card_id = 69;
-- Card 70: Monster #70
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/070.png'::text), true) WHERE card_id = 70;
-- Card 71: Monster #71
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/071.png'::text), true) WHERE card_id = 71;
-- Card 72: Monster #72
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/072.png'::text), true) WHERE card_id = 72;
-- Card 73: Monster #73
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/073.png'::text), true) WHERE card_id = 73;
-- Card 74: Monster #74
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/074.png'::text), true) WHERE card_id = 74;
-- Card 75: Monster #75
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/075.png'::text), true) WHERE card_id = 75;
-- Card 76: Monster #76
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/076.png'::text), true) WHERE card_id = 76;
-- Card 77: Monster #77
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/077.png'::text), true) WHERE card_id = 77;
-- Card 78: Monster #78
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/078.png'::text), true) WHERE card_id = 78;
-- Card 79: Monster #79
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/079.png'::text), true) WHERE card_id = 79;
-- Card 80: Monster #80
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/080.png'::text), true) WHERE card_id = 80;
-- Card 81: Monster #81
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/081.png'::text), true) WHERE card_id = 81;
-- Card 82: Monster #82
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/082.png'::text), true) WHERE card_id = 82;
-- Card 83: Monster #83
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/083.png'::text), true) WHERE card_id = 83;
-- Card 84: Monster #84
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/084.png'::text), true) WHERE card_id = 84;
-- Card 85: Monster #85
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/085.png'::text), true) WHERE card_id = 85;
-- Card 86: Monster #86
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/086.png'::text), true) WHERE card_id = 86;
-- Card 87: Monster #87
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/087.png'::text), true) WHERE card_id = 87;
-- Card 88: Monster #88
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/088.png'::text), true) WHERE card_id = 88;
-- Card 89: Monster #89
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/089.png'::text), true) WHERE card_id = 89;
-- Card 90: Monster #90
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/090.png'::text), true) WHERE card_id = 90;
-- Card 91: Monster #91
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/091.png'::text), true) WHERE card_id = 91;
-- Card 92: Monster #92
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/092.png'::text), true) WHERE card_id = 92;
-- Card 93: Monster #93
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/093.png'::text), true) WHERE card_id = 93;
-- Card 94: Monster #94
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/094.png'::text), true) WHERE card_id = 94;
-- Card 95: Monster #95
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/095.png'::text), true) WHERE card_id = 95;
-- Card 96: Monster #96
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/096.png'::text), true) WHERE card_id = 96;
-- Card 97: Monster #97
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/097.png'::text), true) WHERE card_id = 97;
-- Card 98: Monster #98
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/098.png'::text), true) WHERE card_id = 98;
-- Card 99: Monster #99
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/099.png'::text), true) WHERE card_id = 99;
-- Card 100: Monster #100
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/100.png'::text), true) WHERE card_id = 100;
-- Card 101: Gear #101
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/101.png'::text), true) WHERE card_id = 101;
-- Card 102: Gear #102
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/102.png'::text), true) WHERE card_id = 102;
-- Card 103: Gear #103
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/103.png'::text), true) WHERE card_id = 103;
-- Card 104: Gear #104
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/104.png'::text), true) WHERE card_id = 104;
-- Card 105: Gear #105
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/105.png'::text), true) WHERE card_id = 105;
-- Card 106: Gear #106
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/106.png'::text), true) WHERE card_id = 106;
-- Card 107: Gear #107
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/107.png'::text), true) WHERE card_id = 107;
-- Card 108: Gear #108
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/108.png'::text), true) WHERE card_id = 108;
-- Card 109: Gear #109
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/109.png'::text), true) WHERE card_id = 109;
-- Card 110: Gear #110
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/110.png'::text), true) WHERE card_id = 110;
-- Card 111: Gear #111
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/111.png'::text), true) WHERE card_id = 111;
-- Card 112: Gear #112
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/112.png'::text), true) WHERE card_id = 112;
-- Card 113: Gear #113
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/113.png'::text), true) WHERE card_id = 113;
-- Card 114: Gear #114
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/114.png'::text), true) WHERE card_id = 114;
-- Card 115: Gear #115
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/115.png'::text), true) WHERE card_id = 115;
-- Card 116: Gear #116
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/116.png'::text), true) WHERE card_id = 116;
-- Card 117: Gear #117
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/117.png'::text), true) WHERE card_id = 117;
-- Card 118: Gear #118
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/118.png'::text), true) WHERE card_id = 118;
-- Card 119: Gear #119
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/119.png'::text), true) WHERE card_id = 119;
-- Card 120: Gear #120
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/120.png'::text), true) WHERE card_id = 120;
-- Card 121: Gear #121
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/121.png'::text), true) WHERE card_id = 121;
-- Card 122: Gear #122
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/122.png'::text), true) WHERE card_id = 122;
-- Card 123: Gear #123
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/123.png'::text), true) WHERE card_id = 123;
-- Card 124: Gear #124
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/124.png'::text), true) WHERE card_id = 124;
-- Card 125: Gear #125
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/125.png'::text), true) WHERE card_id = 125;
-- Card 126: Gear #126
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/126.png'::text), true) WHERE card_id = 126;
-- Card 127: Gear #127
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/127.png'::text), true) WHERE card_id = 127;
-- Card 128: Gear #128
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/128.png'::text), true) WHERE card_id = 128;
-- Card 129: Gear #129
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/129.png'::text), true) WHERE card_id = 129;
-- Card 130: Gear #130
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/130.png'::text), true) WHERE card_id = 130;
-- Card 131: Gear #131
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/131.png'::text), true) WHERE card_id = 131;
-- Card 132: Gear #132
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/132.png'::text), true) WHERE card_id = 132;
-- Card 133: Gear #133
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/133.png'::text), true) WHERE card_id = 133;
-- Card 134: Gear #134
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/134.png'::text), true) WHERE card_id = 134;
-- Card 135: Gear #135
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/135.png'::text), true) WHERE card_id = 135;
-- Card 136: Gear #136
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/136.png'::text), true) WHERE card_id = 136;
-- Card 137: Gear #137
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/137.png'::text), true) WHERE card_id = 137;
-- Card 138: Gear #138
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/138.png'::text), true) WHERE card_id = 138;
-- Card 139: Gear #139
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/139.png'::text), true) WHERE card_id = 139;
-- Card 140: Gear #140
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/140.png'::text), true) WHERE card_id = 140;
-- Card 141: Gear #141
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/141.png'::text), true) WHERE card_id = 141;
-- Card 142: Gear #142
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/142.png'::text), true) WHERE card_id = 142;
-- Card 143: Gear #143
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/143.png'::text), true) WHERE card_id = 143;
-- Card 144: Gear #144
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/144.png'::text), true) WHERE card_id = 144;
-- Card 145: Gear #145
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/145.png'::text), true) WHERE card_id = 145;
-- Card 146: Gear #146
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/146.png'::text), true) WHERE card_id = 146;
-- Card 147: Gear #147
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/147.png'::text), true) WHERE card_id = 147;
-- Card 148: Gear #148
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/148.png'::text), true) WHERE card_id = 148;
-- Card 149: Gear #149
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/149.png'::text), true) WHERE card_id = 149;
-- Card 150: Gear #150
UPDATE card_registry SET immutable_data = jsonb_set(immutable_data, '{art_url}', to_jsonb('/aura-champions/art/150.png'::text), true) WHERE card_id = 150;

-- Update art_url for Legendary (rarity 5) and Trinity event cards with 3D renders
-- Legendary monster cards: card_id % 5 == 4
-- Trinity event cards: 50, 75, 100
UPDATE card_registry
SET immutable_data = jsonb_set(
    immutable_data,
    '{art_url_3d}',
    to_jsonb(
        CASE card_id
            WHEN 4 THEN '/aura_champions_card_art/art_raw/legendary_3d_card_4.png'
            WHEN 9 THEN '/aura_champions_card_art/art_raw/legendary_3d_card_9.png'
            WHEN 14 THEN '/aura_champions_card_art/art_raw/legendary_3d_card_14.png'
            WHEN 19 THEN '/aura_champions_card_art/art_raw/legendary_3d_card_19.png'
            WHEN 24 THEN '/aura_champions_card_art/art_raw/legendary_3d_card_24.png'
            WHEN 29 THEN '/aura_champions_card_art/art_raw/legendary_3d_card_29.png'
            WHEN 34 THEN '/aura_champions_card_art/art_raw/legendary_3d_card_34.png'
            WHEN 39 THEN '/aura_champions_card_art/art_raw/legendary_3d_card_39.png'
            WHEN 44 THEN '/aura_champions_card_art/art_raw/legendary_3d_card_44.png'
            WHEN 49 THEN '/aura_champions_card_art/art_raw/legendary_3d_card_49.png'
            WHEN 50 THEN '/aura_champions_card_art/art_raw/trinity_card_50.png'
            WHEN 54 THEN '/aura_champions_card_art/art_raw/legendary_3d_card_54.png'
            WHEN 59 THEN '/aura_champions_card_art/art_raw/legendary_3d_card_59.png'
            WHEN 64 THEN '/aura_champions_card_art/art_raw/legendary_3d_card_64.png'
            WHEN 69 THEN '/aura_champions_card_art/art_raw/legendary_3d_card_69.png'
            WHEN 74 THEN '/aura_champions_card_art/art_raw/legendary_3d_card_74.png'
            WHEN 75 THEN '/aura_champions_card_art/art_raw/trinity_card_75.png'
            WHEN 79 THEN '/aura_champions_card_art/art_raw/legendary_3d_card_79.png'
            WHEN 84 THEN '/aura_champions_card_art/art_raw/legendary_3d_card_84.png'
            WHEN 89 THEN '/aura_champions_card_art/art_raw/legendary_3d_card_89.png'
            WHEN 94 THEN '/aura_champions_card_art/art_raw/legendary_3d_card_94.png'
            WHEN 99 THEN '/aura_champions_card_art/art_raw/legendary_3d_card_99.png'
            WHEN 100 THEN '/aura_champions_card_art/art_raw/trinity_card_100.png'
            WHEN 104 THEN '/aura_champions_card_art/art_raw/legendary_3d_card_104.png'
            WHEN 109 THEN '/aura_champions_card_art/art_raw/legendary_3d_card_109.png'
            WHEN 114 THEN '/aura_champions_card_art/art_raw/legendary_3d_card_114.png'
            WHEN 119 THEN '/aura_champions_card_art/art_raw/legendary_3d_card_119.png'
            WHEN 124 THEN '/aura_champions_card_art/art_raw/legendary_3d_card_124.png'
            WHEN 129 THEN '/aura_champions_card_art/art_raw/legendary_3d_card_129.png'
            WHEN 134 THEN '/aura_champions_card_art/art_raw/legendary_3d_card_134.png'
            WHEN 139 THEN '/aura_champions_card_art/art_raw/legendary_3d_card_139.png'
            WHEN 144 THEN '/aura_champions_card_art/art_raw/legendary_3d_card_144.png'
            WHEN 149 THEN '/aura_champions_card_art/art_raw/legendary_3d_card_149.png'
        ELSE immutable_data->>'art_url_3d'
        END
    )
)
WHERE card_id IN (4, 9, 14, 19, 24, 29, 34, 39, 44, 49, 50, 54, 59, 64, 69, 74, 75, 79, 84, 89, 94, 99, 100, 104, 109, 114, 119, 124, 129, 134, 139, 144, 149);
