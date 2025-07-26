// Gaming names inspired by iconic characters from video games
// Organized by categories for variety and easy maintenance

const GAMING_NAMES = {
    // Classic Arcade & Retro
    arcade: [
        'PacMan', 'MsPacMan', 'DonkeyKong', 'Mario', 'Luigi', 'PrincessPeach', 'Bowser', 'Yoshi',
        'Link', 'Zelda', 'Ganondorf', 'Samus', 'Kirby', 'Pikachu', 'Charizard', 'Blastoise',
        'Sonic', 'Tails', 'Knuckles', 'Shadow', 'DrRobotnik', 'MegaMan', 'Zero', 'ProtoMan'
    ],

    // Fighting Games
    fighting: [
        'Ryu', 'Ken', 'ChunLi', 'Guile', 'Blanka', 'Zangief', 'Dhalsim', 'E Honda',
        'Scorpion', 'SubZero', 'Raiden', 'LiuKang', 'JohnnyCage', 'SonyaBlade', 'Kitana', 'Mileena',
        'TerryBogard', 'KyoKusanagi', 'IoriYagami', 'MaiShiranui', 'KOF', 'Ralf', 'Clark', 'Leona'
    ],

    // RPG & Fantasy
    rpg: [
        'Cloud', 'Sephiroth', 'Tifa', 'Aerith', 'Barret', 'Vincent', 'Yuffie', 'Cid',
        'Squall', 'Rinoa', 'Zell', 'Selphie', 'Quistis', 'Irvine', 'Seifer', 'Ultimecia',
        'Tidus', 'Yuna', 'Wakka', 'Lulu', 'Kimahri', 'Rikku', 'Auron', 'Seymour',
        'Lightning', 'Snow', 'Vanille', 'Sazh', 'Hope', 'Fang', 'Serah', 'Noel'
    ],

    // FPS & Action
    fps: [
        'MasterChief', 'Cortana', 'Arbiter', 'Spartan', 'Noble6', 'Johnson', 'Keyes', 'Hood',
        'GordonFreeman', 'AlyxVance', 'Barney', 'GMan', 'Combine', 'Vortigaunt', 'Headcrab', 'Zombie',
        'DoomGuy', 'Daisy', 'Imp', 'Cacodemon', 'Baron', 'Cyberdemon', 'SpiderMastermind', 'IconOfSin'
    ],

    // Strategy & RTS
    strategy: [
        'Arthas', 'Jaina', 'Thrall', 'Sylvanas', 'Uther', 'Grom', 'Cairne', 'Voljin',
        'Kerrigan', 'Raynor', 'Zeratul', 'Tassadar', 'Artanis', 'Fenix', 'Aldaris', 'Raszagal',
        'Gandhi', 'Caesar', 'Napoleon', 'Alexander', 'Cleopatra', 'JoanOfArc', 'Montezuma', 'Ragnar'
    ],

    // Modern Gaming
    modern: [
        'Kratos', 'Atreus', 'Freya', 'Baldur', 'Thor', 'Odin', 'Mimir', 'Brok',
        'Aloy', 'Rost', 'Sylens', 'Helis', 'Avad', 'Erend', 'Varl', 'Zo',
        'Geralt', 'Ciri', 'Yennefer', 'Triss', 'Dandelion', 'Zoltan', 'Lambert', 'Eskel',
        'NathanDrake', 'Elena', 'Sully', 'Chloe', 'Nadine', 'Sam', 'Rafe', 'Nadine'
    ],

    // Indie & Unique
    indie: [
        'Cuphead', 'Mugman', 'KingDice', 'Devil', 'ElderKettle', 'Porkrind', 'Chalice', 'Baroness',
        'HollowKnight', 'Hornet', 'Quirrel', 'Zote', 'Grimm', 'Radiance', 'PaleKing', 'WhiteLady',
        'Ori', 'Sein', 'Kuro', 'Gumo', 'Naru', 'SpiritTree', 'Ginso', 'Forlorn'
    ],

    // Platform & Adventure
    platform: [
        'Crash', 'Coco', 'Cortex', 'Tiny', 'Dingodile', 'Ngin', 'RipperRoo', 'PapuPapu',
        'Spyro', 'Sparx', 'Hunter', 'Elora', 'Bianca', 'Moneybags', 'Sheila', 'SgtByrd',
        'Ratchet', 'Clank', 'Qwark', 'Nefarious', 'Talwyn', 'Cronk', 'Zephyr', 'Rivet'
    ],

    // Racing & Sports
    racing: [
        'MarioKart', 'LuigiKart', 'PeachKart', 'BowserKart', 'YoshiKart', 'ToadKart', 'WarioKart', 'WaluigiKart',
        'SonicRacing', 'TailsRacing', 'KnucklesRacing', 'AmyRacing', 'ShadowRacing', 'RougeRacing', 'BigRacing', 'CharmyRacing',
        'CrashRacing', 'CocoRacing', 'CortexRacing', 'TinyRacing', 'DingodileRacing', 'NginRacing', 'RipperRooRacing', 'PapuPapuRacing'
    ]
};

// Flatten all names into a single array
const ALL_GAMING_NAMES = Object.values(GAMING_NAMES).flat();

// Track used names to avoid duplicates
const usedNames = new Set<string>();

/**
 * Generate a random gaming name from the collection
 * @returns A unique gaming character name
 */
export function generateGamingName(): string {
    // Find an unused name
    let availableNames = ALL_GAMING_NAMES.filter(name => !usedNames.has(name));

    // If we've used all names, reset the used names set
    if (availableNames.length === 0) {
        usedNames.clear();
        availableNames = ALL_GAMING_NAMES;
        console.log('All gaming names used, resetting for reuse');
    }

    // Select a random name
    const randomIndex = Math.floor(Math.random() * availableNames.length);
    const selectedName = availableNames[randomIndex];

    // Mark as used
    usedNames.add(selectedName);

    return selectedName;
}

/**
 * Get a list of all available gaming names (for debugging/testing)
 */
export function getAllGamingNames(): string[] {
    return [...ALL_GAMING_NAMES];
}

/**
 * Get the count of total available names
 */
export function getTotalNameCount(): number {
    return ALL_GAMING_NAMES.length;
}

/**
 * Get the count of currently used names
 */
export function getUsedNameCount(): number {
    return usedNames.size;
}

/**
 * Reset the used names tracking (useful for testing)
 */
export function resetUsedNames(): void {
    usedNames.clear();
} 