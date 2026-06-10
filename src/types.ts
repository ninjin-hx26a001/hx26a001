export type CarrotType = 'normal' | 'spicy' | 'frost' | 'golden' | 'rabbit';

export interface CarrotItem {
  id: CarrotType;
  name: string;
  jpName: string;
  description: string;
  color: string;
  throwEffect: string;
  throwDamage: number;
  eatHeal: number;
  eatBuff?: {
    stat: 'atk' | 'def' | 'maxHp';
    value: number;
    duration: number;
  };
  sellPrice: number;
  icon: string;
}

export interface CarrotSeed {
  id: CarrotType;
  name: string;
  jpName: string;
  description: string;
  cost: number;
  growthTime: number; // in seconds
  color: string;
}

export interface GardenPlot {
  id: number;
  seedId: CarrotType | null;
  plantedAt: number | null; // epoch ms
  duration: number; // milliseconds total
  isWatered: boolean;
  wateredAt: number | null;
}

export interface PlayerStats {
  level: number;
  exp: number;
  maxExp: number;
  hp: number;
  maxHp: number;
  gold: number;
  inventory: Record<CarrotType, number>;
  seeds: Record<CarrotType, number>;
  weaponId: string;
  armorId: string;
  highStage: number; // Highest cleared stage
}

export interface EqItem {
  id: string;
  name: string;
  jpName: string;
  type: 'weapon' | 'armor';
  costCarrots: number;
  costGold: number;
  statBonus: number; // ATK for weapon, DEF for armor
  description: string;
}

export interface Enemy {
  name: string;
  jpName: string;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  rewardExp: number;
  rewardGold: number;
  spriteUrl?: string; // Standard HTML/div shape or lucide icon is fine
  iconType: string; // broccoli, potato, etc.
}

export interface BattleState {
  stage: number;
  enemy: Enemy | null;
  playerCurrentHp: number;
  enemyCurrentHp: number;
  playerBuffs: {
    atkBoostRemaining: number;
    defBoostRemaining: number;
  };
  battleLog: string[];
  isPlayerTurn: boolean;
  status: 'victory' | 'defeat' | 'fighting' | 'none';
  summonedRabbitAtk: number; // Sum of active bunnies
}

export const CARROT_TEMPLATES: Record<CarrotType, CarrotItem> = {
  normal: {
    id: 'normal',
    name: 'Normal Carrot',
    jpName: '普通のにんじん',
    description: 'みずみずしくて美味しい基本のにんじん。HPを回復するか、敵にぶつけて攻撃できる。',
    color: 'bg-orange-500 text-white border-orange-600',
    throwEffect: '通常ダメージを与える。',
    throwDamage: 18,
    eatHeal: 30,
    sellPrice: 5,
    icon: '🥕',
  },
  spicy: {
    id: 'spicy',
    name: 'Spicy Carrot',
    jpName: '激辛トウガラシにんじん',
    description: 'マグマの味がする赤いにんじん。食べると3ターンの間攻撃力が1.5倍になる！',
    color: 'bg-red-600 text-white border-red-700',
    throwEffect: '敵を炎上させ、大ダメージを与える。',
    throwDamage: 40,
    eatHeal: 10,
    eatBuff: { stat: 'atk', value: 1.5, duration: 3 },
    sellPrice: 15,
    icon: '🔥',
  },
  frost: {
    id: 'frost',
    name: 'Frost Carrot',
    jpName: 'カチコチ氷結にんじん',
    description: '絶対零度で凍りついた青いにんじん。投げつけると敵を1ターン凍結（行動不能）させる。',
    color: 'bg-cyan-500 text-white border-cyan-600',
    throwEffect: '敵の動きを止め、小ダメージを与える。',
    throwDamage: 10,
    eatHeal: 15,
    sellPrice: 20,
    icon: '❄️',
  },
  golden: {
    id: 'golden',
    name: 'Golden Carrot',
    jpName: '黄金のヴィクトリアにんじん',
    description: '太陽の祝福を浴びた幻のにんじん。食べるとHPが全回復し、投げると超絶クリティカル！高値で売れる。',
    color: 'bg-amber-400 text-amber-950 border-amber-500 font-bold',
    throwEffect: '超必殺・一撃必殺級のダメージを与える。',
    throwDamage: 120,
    eatHeal: 999,
    sellPrice: 100,
    icon: '👑',
  },
  rabbit: {
    id: 'rabbit',
    name: 'Rabbit Carrot',
    jpName: '召喚ウサ美ちゃんにんじん',
    description: 'ウサギが大好きなハーブが香るにんじん。戦闘中に投げると、ウサ美ちゃんが助っ人で駆けつける！',
    color: 'bg-pink-400 text-white border-pink-500',
    throwEffect: '「お助けウサちゃん」を召喚し、毎ターン15ダメージを追加する。',
    throwDamage: 0,
    eatHeal: 20,
    sellPrice: 25,
    icon: '🐰',
  },
};

export const SEED_TEMPLATES: Record<CarrotType, CarrotSeed> = {
  normal: { id: 'normal', name: 'Normal Seed', jpName: '普通のにんじんの種', description: 'どこでもよく育つ、にんじんの基本の種。', cost: 2, growthTime: 8, color: 'bg-orange-200 border-orange-400 text-orange-900' },
  spicy: { id: 'spicy', name: 'Spicy Seed', jpName: '激辛にんじんの種', description: '少し暑い気候を好む、辛口にんじんの種。', cost: 15, growthTime: 18, color: 'bg-red-200 border-red-400 text-red-900' },
  frost: { id: 'frost', name: 'Frost Seed', jpName: '氷結にんじんの種', description: '極寒に耐える寒冷仕様にんじんの種。', cost: 25, growthTime: 25, color: 'bg-cyan-200 border-cyan-400 text-cyan-900' },
  golden: { id: 'golden', name: 'Golden Seed', jpName: '黄金にんじんの種', description: '1万本に1本の奇跡。育つのに時間がかかる高貴な種。', cost: 80, growthTime: 60, color: 'bg-amber-200 border-amber-400 text-yellow-950' },
  rabbit: { id: 'rabbit', name: 'Rabbit Seed', jpName: 'ウサ美にんじんの種', description: 'フカフカした不思議な手触りの種。ウサギを引き寄せる。', cost: 40, growthTime: 35, color: 'bg-pink-200 border-pink-400 text-pink-900' },
};

export const WEAPON_UPGRADES: EqItem[] = [
  { id: 'weapon_0', name: 'Stick', jpName: '普通の木の棒', type: 'weapon', costCarrots: 0, costGold: 0, statBonus: 0, description: 'その辺に落ちていた棒切れ。心もとなさすぎる。' },
  { id: 'weapon_1', name: 'Carrot Dagger', jpName: 'にんじんダガー', type: 'weapon', costCarrots: 10, costGold: 10, statBonus: 8, description: 'にんじんの先端を鋭利に研ぎ澄ました暗殺用短剣。' },
  { id: 'weapon_2', name: 'Orange Saber', jpName: 'オレンジ・サーベル', type: 'weapon', costCarrots: 25, costGold: 100, statBonus: 22, description: '高密度のカロテンを結晶化させた、美麗で軽い長剣。' },
  { id: 'weapon_3', name: 'Excarrobur', jpName: '聖剣エクスキャリバー', type: 'weapon', costCarrots: 60, costGold: 450, statBonus: 65, description: '農林水産省お墨付き？伝説のウサギ神が遺した至高の聖にんじん剣。' },
];

export const ARMOR_UPGRADES: EqItem[] = [
  { id: 'armor_0', name: 'Ragged Clothes', jpName: 'ボロボロの服', type: 'armor', costCarrots: 0, costGold: 0, statBonus: 0, description: '最初から着ていた服。布切れ同等で防御力はまったくない。' },
  { id: 'armor_1', name: 'Carrot Apron', jpName: '特製にんじんエプロン', type: 'armor', costCarrots: 10, costGold: 10, statBonus: 5, description: '丈夫なにんじんの繊維で織られたエプロン。胸元をガード！' },
  { id: 'armor_2', name: 'Vibrant Shell', jpName: 'ビブラント・アーマー', type: 'armor', costCarrots: 25, costGold: 100, statBonus: 15, description: 'にんじんの頑丈な皮を幾重にも重ね合わせた軽量プレートアーマー。' },
  { id: 'armor_3', name: 'Carrot Aegis', jpName: '人参神聖鎧アージス', type: 'armor', costCarrots: 60, costGold: 450, statBonus: 40, description: '大地の偉大な魔力が込められた、黄金にんじん製の神聖な鎧。' },
];

export const DUNGEON_STAGES = [
  {
    stage: 1,
    name: 'Wild Broccoli Forest',
    jpName: '狂暴ブロッコリーの森',
    enemyName: '狂暴ブロッコリー',
    enemySprite: '🥦',
    baseHp: 80,
    baseAtk: 12,
    baseDef: 2,
    rewardExp: 35,
    rewardGold: 20,
    description: 'モコモコした髪の毛に力を溜めている獰猛なブロッコリーが潜む森。',
  },
  {
    stage: 2,
    name: 'Clayey Potato Cave',
    jpName: 'ねばねばポテトの泥洞窟',
    enemyName: 'ポテト・ゴーレム',
    enemySprite: '🥔',
    baseHp: 160,
    baseAtk: 22,
    baseDef: 12,
    rewardExp: 80,
    rewardGold: 50,
    description: '泥を固めて体を巨大化させた、頑強なじゃがいもの怪物。',
  },
  {
    stage: 3,
    name: 'Carrot Bandit Hideout',
    jpName: 'どろぼうウサギの砦',
    enemyName: 'ウサギの泥棒親分',
    enemySprite: '🐇',
    baseHp: 240,
    baseAtk: 38,
    baseDef: 18,
    rewardExp: 150,
    rewardGold: 90,
    description: 'あなたの美味しいにんじんを奪おうと狙っている凶悪（？）な泥棒ウサギ。',
  },
  {
    stage: 4,
    name: 'Sizzling Onion Volcanic Field',
    jpName: '玉ねぎマグマ噴出地帯',
    enemyName: '激辛オニオン・ベヒモス',
    enemySprite: '🧅',
    baseHp: 420,
    baseAtk: 58,
    baseDef: 30,
    rewardExp: 300,
    rewardGold: 180,
    description: '剥けば剥くほど涙が出るほど辛い高熱を放つ、玉ねぎの魔獣。',
  },
  {
    stage: 5,
    name: 'Imperial Vegetables Palace',
    jpName: 'ベジタブル皇帝の謁見室',
    enemyName: 'ラストエンペラー・キャベツ',
    enemySprite: '🥬',
    baseHp: 800,
    baseAtk: 95,
    baseDef: 50,
    rewardExp: 1000,
    rewardGold: 500,
    description: '野菜王国のすべての野菜たちを統治し、にんじんを排除しようとする冷徹な王。',
  },
];
