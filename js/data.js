// Static game data: skills, unit lengths, rarities and drop tables.
// Item name conventions in the lists below:
//   "Name*"     -> wearable outfit piece (can go in the Outfit slot)
//   "Name (pet)" -> pet (one-time drop, can go in the Pet slot)
//   anything else -> collection item (no direct boost)

export const RARITIES = [
  { id: 'common',    name: 'Common',    chance: 0.20,   color: '#b8b8b0', sell: 5 },
  { id: 'uncommon',  name: 'Uncommon',  chance: 0.125,  color: '#5fbf5a', sell: 15 },
  { id: 'rare',      name: 'Rare',      chance: 0.08,   color: '#4a90e2', sell: 50 },
  { id: 'epic',      name: 'Epic',      chance: 0.04,   color: '#a35ae0', sell: 150 },
  { id: 'legendary', name: 'Legendary', chance: 0.02,   color: '#f0a020', sell: 500 },
  { id: 'mythic',    name: 'Mythic',    chance: 0.01,   color: '#e8435a', sell: 2000 },
  { id: 'divine',    name: 'Divine',    chance: 0.0025, color: '#fff1a8', sell: 10000 },
];
export const RARITY = Object.fromEntries(RARITIES.map((r, i) => [r.id, { ...r, index: i }]));

// Rarity index >= this is affected by luck (Rare and above).
export const LUCK_MIN_RARITY = RARITY.rare.index;

export const OUTFIT_XP_BOOST = {
  common: 0.01, uncommon: 0.02, rare: 0.04, epic: 0.07, legendary: 0.10, mythic: 0.15, divine: 0.20,
};

export const PET_BOOST = {
  common:    { xp: 0.03 },
  uncommon:  { xp: 0.05, coins: 0.10 },
  rare:      { xp: 0.08, luck: 0.05 },
  epic:      { xp: 0.12, luck: 0.10 },
  legendary: { xp: 0.18, luck: 0.15, bonusRollChance: 0.10 },
  mythic:    { xp: 0.24, luck: 0.20, bonusRollChance: 0.25 }, // no mythic pets in v1 lists, kept for completeness
  divine:    { xp: 0.30, luck: 0.25, bonusRollChance: 1 },
};

export const XP_PER_UNIT = 100;
export const COINS_PER_UNIT = 10;
export const COLLECTION_COMPLETE_XP_BOOST = 0.05;
export const BADGE_COUNT = 100;
// Most items of a single rarity that can drop from one roll (one unit).
export const MAX_PER_RARITY_PER_ROLL = 2;

const LISTS = {
  fitness: {
    name: 'Fitness', unit: 60, icon: '🏃', hue: 0,
    common: ['Sweatband*', 'Basic Trainers*', 'Gym Shorts*', 'Water Bottle', 'Cotton Tee*', 'Wristwatch', 'Running Cap*', 'Pigeon (pet)'],
    uncommon: ['Compression Leggings*', 'Track Jacket*', 'Fitness Tracker', 'Lightweight Racers*', 'Hydration Vest*', 'Squirrel (pet)'],
    rare: ['Marathon Medal', 'Carbon Plated Runners*', 'Trail Runner Outfit*', 'Fox (pet)'],
    epic: ['Olympian Tracksuit*', 'Greyhound (pet)'],
    legendary: ['Thunderstep Sandals*', 'Cheetah (pet)'],
    mythic: ['Phoenix Gear*'],
    divine: ['Pegasus (pet)'],
  },
  intelligence: {
    name: 'Intelligence', unit: 20, icon: '📚', hue: 220,
    common: ['Reading Glasses', 'Pencil Behind the Ear', 'Cardigan*', 'Bookmark', 'Notebook', 'Coffee Mug', 'Satchel', 'Bookworm (pet)'],
    uncommon: ['Tweed Blazer*', 'Fountain Pen', 'Library Card', 'Desk Lamp', 'Graduation Cap*', 'Hedgehog (pet)'],
    rare: ["Professor's Robes*", 'Monocle', 'Ancient Tome', 'Owl (pet)'],
    epic: ["Scholar's Gown*", 'Raven (pet)'],
    legendary: ['Crown of Wisdom*', 'Octopus (pet)'],
    mythic: ['Celestial Sage Robes*'],
    divine: ['Sphinx (pet)'],
  },
  cooking: {
    name: 'Cooking', unit: 30, icon: '🍳', hue: 25,
    common: ['Apron*', 'Oven Mitts', 'Wooden Spoon', 'Tea Towel', 'Bandana*', 'Spatula', 'Spice Pouch', 'Mouse (pet)'],
    uncommon: ["Chef's Whites*", 'Cast Iron Pan', "Chef's Knife", 'Clogs*', 'Rolling Pin', 'Kitchen Cat (pet)'],
    rare: ["Tall Chef's Hat*", 'Copper Pot Set', "Head Chef's Jacket*", 'Truffle Pig (pet)'],
    epic: ['Michelin Star Uniform*', 'Lobster (pet)'],
    legendary: ['Golden Ladle', 'Dragon Chilli (pet)'],
    mythic: ["Ember Chef's Coat*"],
    divine: ['Golden Goose (pet)'],
  },
  farming: {
    name: 'Farming', unit: 45, icon: '🌾', hue: 90,
    common: ['Straw Hat*', 'Gardening Gloves', 'Wellies*', 'Watering Can', 'Trowel', 'Seed Packet', 'Dungarees*', 'Snail (pet)'],
    uncommon: ['Wax Jacket*', 'Wheelbarrow', 'Pitchfork', 'Flat Cap*', 'Prize Pumpkin', 'Hen (pet)'],
    rare: ['Scarecrow', 'Golden Hoe', "Farmer's Overalls*", 'Sheepdog (pet)'],
    epic: ['Harvest Festival Outfit*', 'Highland Cow (pet)'],
    legendary: ['Giant Golden Marrow', 'Bumblebee Queen (pet)'],
    mythic: ['Verdant Druid Robes*'],
    divine: ['Golden Stag (pet)'],
  },
  foraging: {
    name: 'Foraging', unit: 60, icon: '🍄', hue: 130,
    common: ['Walking Stick', 'Woolly Beanie*', 'Hiking Socks*', 'Pocket Compass', 'Wicker Basket', 'Fleece*', 'Trail Map', 'Rabbit (pet)'],
    uncommon: ['Waterproof Jacket*', 'Hiking Boots*', 'Binoculars', 'Pocketknife', 'Rare Mushroom', 'Badger (pet)'],
    rare: ["Ranger's Hat*", 'Wild Truffle', "Explorer's Kit Outfit*", 'Red Squirrel (pet)'],
    epic: ["Woodsman's Cloak*", 'Wolf (pet)'],
    legendary: ['Ancient Acorn', 'Mini Treant (pet)'],
    mythic: ['Forest Spirit Garb*'],
    divine: ['Great Elk (pet)'],
  },
  crafting: {
    name: 'Crafting', unit: 45, icon: '🔨', hue: 35,
    common: ['Work Gloves', 'Tool Belt', 'Hammer', 'Measuring Tape', 'Safety Goggles', 'Pencil Stub', 'Canvas Apron*', 'Spider (pet)'],
    uncommon: ['Leather Apron*', 'Hand Saw', 'Chisel Set', 'Sewing Kit', 'Workshop Boots*', 'Beaver (pet)'],
    rare: ["Carpenter's Overalls*", 'Brass Toolbox', 'Masterwork Chair', 'Magpie (pet)'],
    epic: ["Artisan's Smock*", 'Clockwork Beetle (pet)'],
    legendary: ['Dwarven Anvil', 'Brass Automaton (pet)'],
    mythic: ["Forgemaster's Armour*"],
    divine: ['Golem (pet)'],
  },
  artistry: {
    name: 'Artistry', unit: 30, icon: '🎨', hue: 300,
    common: ['Beret*', 'Sketchbook', 'Paint-Stained Shirt*', 'Charcoal Stick', 'Paintbrush', 'Eraser', 'Scarf*', 'Chameleon (pet)'],
    uncommon: ["Artist's Smock*", 'Watercolour Set', 'Easel', 'Palette', 'Spray Can', 'Peacock (pet)'],
    rare: ['Gallery Outfit*', 'Golden Frame', 'Oil Painting Masterpiece', 'Flamingo (pet)'],
    epic: ['Renaissance Robes*', 'Hummingbird (pet)'],
    legendary: ['Prismatic Brush', 'Koi Spirit (pet)'],
    mythic: ['Chromatic Cloak*'],
    divine: ['Muse (pet)'],
  },
  music: {
    name: 'Music', unit: 30, icon: '🎸', hue: 270,
    common: ['Headphones', 'Guitar Pick', 'Band T-Shirt*', 'Tambourine', 'Sheet Music', 'Harmonica', 'Denim Jacket*', 'Cricket (pet)'],
    uncommon: ['Leather Jacket*', 'Acoustic Guitar', 'Microphone', 'Vinyl Record', 'Drumsticks', 'Songbird (pet)'],
    rare: ['Rockstar Outfit*', 'Golden Record', 'Violin', 'Parrot (pet)'],
    epic: ["Conductor's Tailcoat*", 'Whale (pet)'],
    legendary: ['Platinum Electric Guitar', 'Nightingale (pet)'],
    mythic: ["Siren's Stage Outfit*"],
    divine: ['Lyre of Apollo (pet)'],
  },
  mindfulness: {
    name: 'Mindfulness', unit: 15, icon: '🧘', hue: 175,
    common: ['Yoga Mat', 'Incense Stick', 'Comfy Joggers*', 'Scented Candle', 'Herbal Tea', 'Hair Tie', 'Hoodie*', 'Turtle (pet)'],
    uncommon: ['Linen Set*', 'Singing Bowl', 'Meditation Cushion', 'Prayer Beads', 'Bonsai Tree', 'Sloth (pet)'],
    rare: ["Monk's Robes*", 'Zen Garden', 'Crystal Set', 'Red Panda (pet)'],
    epic: ['Lotus Robes*', 'Snow Leopard (pet)'],
    legendary: ['Floating Lotus Throne', 'Spirit Fox (pet)'],
    mythic: ['Ascendant Robes*'],
    divine: ['Jade Dragon (pet)'],
  },
  charisma: {
    name: 'Charisma', unit: 60, icon: '🗣️', hue: 330,
    common: ['Sunglasses', 'Polo Shirt*', 'Cologne', 'Business Card', 'Chinos*', 'Friendship Bracelet', 'Phone Case', 'Puppy (pet)'],
    uncommon: ['Smart Blazer*', 'Gold Chain', 'Loafers*', 'VIP Wristband', 'Microphone Badge', 'Golden Retriever (pet)'],
    rare: ['Tailored Suit*', 'Signet Ring', 'Red Carpet Rope', 'Dolphin (pet)'],
    epic: ['Velvet Tuxedo*', 'Lion Cub (pet)'],
    legendary: ['Golden Crown*', 'Swan (pet)'],
    mythic: ['Silver-Tongued Regalia*'],
    divine: ['Unicorn (pet)'],
  },
  housekeeping: {
    name: 'Housekeeping', unit: 30, icon: '🧹', hue: 195,
    common: ['Rubber Gloves', 'Feather Duster', 'Slippers*', 'Sponge', 'Dressing Gown*', 'Laundry Basket', 'Headscarf*', 'Hamster (pet)'],
    uncommon: ["Housekeeper's Uniform*", 'Vintage Broom', 'Spray Bottle', 'Toolbox', 'Ironing Board', 'Tortoise (pet)'],
    rare: ["Butler's Suit*", 'Robot Vacuum', 'Silver Polishing Kit', 'Raccoon (pet)'],
    epic: ['Victorian Maid Outfit*', 'Persian Cat (pet)'],
    legendary: ['Golden Mop', 'House Brownie (pet)'],
    mythic: ['Pristine Regalia*'],
    divine: ['Kitsune (pet)'],
  },
  labour: {
    name: 'Labour', unit: 240, icon: '⚒️', hue: 45,
    common: ['Lanyard', 'Hi-Vis Vest*', 'Lunchbox', 'Thermos', 'Hard Hat*', 'Work Boots*', 'Clipboard', 'Office Plant (pet)'],
    uncommon: ['Steel Toe Boots*', 'Briefcase', 'Name Badge', 'Leather Watch', 'Coffee Machine', 'Pug (pet)'],
    rare: ["Foreman's Outfit*", 'Corner Office Key', 'Employee of the Month Plaque', 'Ox (pet)'],
    epic: ['Executive Suit*', 'Eagle (pet)'],
    legendary: ['Golden Briefcase', 'Bull (pet)'],
    mythic: ["Titan's Workwear*"],
    divine: ['Atlas (pet)'],
  },
};

// Which equipment slot a wearable goes in, from its name.
export const GEAR_SLOTS = ['head', 'body', 'feet', 'pet'];
export function slotFor(name) {
  const n = name.toLowerCase();
  if (/(sandals|trainers|runners|racers|boots|wellies|clogs|loafers|slippers|socks)$/.test(n)) return 'feet';
  if (/crown|(hat|cap|beret|beanie|bandana|headscarf|sweatband)$/.test(n)) return 'head';
  return 'body';
}
export const SLOT_LABEL = { head: 'Head', body: 'Body', feet: 'Feet', pet: 'Pet' };

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const SKILLS = Object.entries(LISTS).map(([id, def]) => ({
  id, name: def.name, unit: def.unit, icon: def.icon, hue: def.hue,
}));
export const SKILL = Object.fromEntries(SKILLS.map((s) => [s.id, s]));

export const ITEMS = [];
for (const [skillId, def] of Object.entries(LISTS)) {
  for (const r of RARITIES) {
    for (const raw of def[r.id]) {
      let name = raw;
      let type = 'collection';
      if (name.endsWith(' (pet)')) { type = 'pet'; name = name.slice(0, -6); }
      else if (name.endsWith('*')) { type = 'outfit'; name = name.slice(0, -1); }
      const slot = type === 'pet' ? 'pet' : type === 'outfit' ? slotFor(name) : null;
      ITEMS.push({ id: `${skillId}.${slug(name)}`, name, skill: skillId, rarity: r.id, type, slot });
    }
  }
}
export const ITEM = Object.fromEntries(ITEMS.map((i) => [i.id, i]));
export const ITEMS_BY_SKILL = Object.fromEntries(SKILLS.map((s) => [s.id, ITEMS.filter((i) => i.skill === s.id)]));
