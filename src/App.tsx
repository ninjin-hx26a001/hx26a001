import React, { useState, useEffect } from 'react';
import { PlayerStats, GardenPlot, CarrotType, EqItem, CARROT_TEMPLATES, SEED_TEMPLATES } from './types';
import GameHeader from './components/GameHeader';
import FarmTab from './components/FarmTab';
import ForgeTab from './components/ForgeTab';
import BattleTab from './components/BattleTab';
import { Sprout, Trophy, Sliders, Volume2, ShieldAlert, BookOpen, Sparkles, RefreshCcw, Swords } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const LOCAL_STORAGE_STATS_KEY = 'carrot_rpg_player_stats_v1';
const LOCAL_STORAGE_PLOTS_KEY = 'carrot_rpg_plots_v1';

const DEFAULT_STATS: PlayerStats = {
  level: 1,
  exp: 0,
  maxExp: 100,
  hp: 80,
  maxHp: 80,
  gold: 50, // Start with 50 gold to buy seeds
  inventory: {
    normal: 3,
    spicy: 0,
    frost: 0,
    golden: 0,
    rabbit: 0,
  },
  seeds: {
    normal: 6, // Start with initial seeds
    spicy: 1,
    frost: 0,
    golden: 0,
    rabbit: 0,
  },
  weaponId: 'weapon_0',
  armorId: 'armor_0',
  highStage: 0,
};

const DEFAULT_PLOTS: GardenPlot[] = Array.from({ length: 6 }, (_, idx) => ({
  id: idx,
  seedId: null,
  plantedAt: null,
  duration: 0,
  isWatered: false,
  wateredAt: null,
}));

export default function App() {
  const [stats, setStats] = useState<PlayerStats>(DEFAULT_STATS);
  const [plots, setPlots] = useState<GardenPlot[]>(DEFAULT_PLOTS);
  const [activeTab, setActiveTab] = useState<'farm' | 'battle' | 'forge'>('farm');
  const [showTutorial, setShowTutorial] = useState<boolean>(false);
  const [floatingAlert, setFloatingAlert] = useState<{ id: number; message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [isLoaded, setIsLoaded] = useState<boolean>(false); // セーブデータロード完了フラグ
  const [isBattleActive, setIsBattleActive] = useState<boolean>(false); // 戦闘中アクティブフラグ

  // 起動時にデータをローカルストレージからロード
  useEffect(() => {
    try {
      const savedStats = localStorage.getItem(LOCAL_STORAGE_STATS_KEY);
      const savedPlots = localStorage.getItem(LOCAL_STORAGE_PLOTS_KEY);

      if (savedStats) {
        setStats(JSON.parse(savedStats));
      } else {
        // 初回訪問時はチュートリアルを自動表示
        setShowTutorial(true);
      }

      if (savedPlots) {
        setPlots(JSON.parse(savedPlots));
      }
    } catch (e) {
      console.error('データのロードに失敗しました:', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // ステート変更時に自動セーブ（レイスコンディションによる上書きとにんじん減少バグを一挙に修正）
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(LOCAL_STORAGE_STATS_KEY, JSON.stringify(stats));
      localStorage.setItem(LOCAL_STORAGE_PLOTS_KEY, JSON.stringify(plots));
    } catch (e) {
      console.error('データの自動保存に失敗しました:', e);
    }
  }, [stats, plots, isLoaded]);

  // アラート喚起
  const triggerAlert = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = Date.now();
    setFloatingAlert({ id, message, type });
    setTimeout(() => {
      setFloatingAlert(null);
    }, 2800);
  };

  // にんじんを畑に植える
  const handlePlant = (plotId: number, seedType: CarrotType) => {
    if (stats.seeds[seedType] <= 0) return;

    const seedConfig = SEED_TEMPLATES[seedType];

    setPlots((prevPlots) =>
      prevPlots.map((p) => {
        if (p.id === plotId) {
          return {
            ...p,
            seedId: seedType,
            plantedAt: Date.now(),
            duration: seedConfig.growthTime * 1000,
            isWatered: false,
          };
        }
        return p;
      })
    );

    setStats((prev) => ({
      ...prev,
      seeds: {
        ...prev.seeds,
        [seedType]: Math.max(0, prev.seeds[seedType] - 1),
      },
    }));

    triggerAlert(`🌱 「${seedConfig.jpName}」の たねを うえました！`, 'success');
  };

  // 水をやる
  const handleWater = (plotId: number) => {
    setPlots((prevPlots) =>
      prevPlots.map((p) => {
        if (p.id === plotId) {
          return {
            ...p,
            isWatered: true,
            wateredAt: Date.now(),
          };
        }
        return p;
      })
    );

    triggerAlert('💦 お水を あげた！ せいちょうスピードが 2ばいに なった！', 'info');
  };

  // 収穫する
  const handleHarvest = (plotId: number) => {
    const plot = plots.find((p) => p.id === plotId);
    if (!plot || !plot.seedId) return;

    const seedType = plot.seedId;
    const carrotConfig = CARROT_TEMPLATES[seedType];

    setPlots((prevPlots) =>
      prevPlots.map((p) => {
        if (p.id === plotId) {
          return {
            ...p,
            seedId: null,
            plantedAt: null,
            duration: 0,
            isWatered: false,
            wateredAt: null,
          };
        }
        return p;
      })
    );

    setStats((prev) => ({
      ...prev,
      inventory: {
        ...prev.inventory,
        [seedType]: (prev.inventory[seedType] || 0) + 1,
      },
    }));

    triggerAlert(`🌾 「${carrotConfig.jpName}」を しゅうかくした！`, 'success');
  };

  // 一斉収穫する
  const handleHarvestAll = (grownPlotIds: number[]) => {
    if (grownPlotIds.length === 0) return;

    // どの種類のタネがいくつ収穫されたかをカウントする
    const harvestedCounts: Record<CarrotType, number> = {} as Record<CarrotType, number>;
    
    plots.forEach((p) => {
      if (grownPlotIds.includes(p.id) && p.seedId) {
        harvestedCounts[p.seedId] = (harvestedCounts[p.seedId] || 0) + 1;
      }
    });

    // plotsを更新
    setPlots((prevPlots) =>
      prevPlots.map((p) => {
        if (grownPlotIds.includes(p.id)) {
          return {
            ...p,
            seedId: null,
            plantedAt: null,
            duration: 0,
            isWatered: false,
            wateredAt: null,
          };
        }
        return p;
      })
    );

    // statsを更新
    setStats((prev) => {
      const nextInventory = { ...prev.inventory };
      (Object.keys(harvestedCounts) as CarrotType[]).forEach((type) => {
        nextInventory[type] = (nextInventory[type] || 0) + harvestedCounts[type];
      });
      return {
        ...prev,
        inventory: nextInventory,
      };
    });

    // 収穫物のテキストリストを作成
    const detailTexts = (Object.keys(harvestedCounts) as CarrotType[])
      .map((type) => `「${CARROT_TEMPLATES[type].jpName}」x${harvestedCounts[type]}`)
      .join('、');

    triggerAlert(`🌾 ${detailTexts} を いっせいしゅうかくした！`, 'success');
  };

  // タネを買う
  const handleBuySeed = (seedType: CarrotType, cost: number, amount: number = 1) => {
    const totalCost = cost * amount;
    if (stats.gold < totalCost) {
      triggerAlert('💡 ゴールドが たりないようだ！', 'error');
      return;
    }

    setStats((prev) => {
      if (prev.gold < totalCost) return prev;
      return {
        ...prev,
        gold: prev.gold - totalCost,
        seeds: {
          ...prev.seeds,
          [seedType]: (prev.seeds[seedType] || 0) + amount,
        },
      };
    });

    triggerAlert(`🛍️ 「${SEED_TEMPLATES[seedType].jpName}」の たねを ${amount}こ かった！`, 'info');
  };

  // 特訓トレーニング（レベルアップ＆HP限界突破）
  const handleUpgradeStat = (statType: 'hp' | 'atk' | 'def', costCarrots: number, costGold: number) => {
    if (stats.inventory.normal < costCarrots || stats.gold < costGold) {
      triggerAlert('💡 コストが たりないようだ！', 'error');
      return;
    }

    setStats((prev) => {
      if (prev.inventory.normal < costCarrots || prev.gold < costGold) return prev;
      
      const nextLevel = prev.level + 1;
      const nextMaxExp = Math.floor(100 + nextLevel * 50);

      return {
        ...prev,
        level: nextLevel,
        maxHp: prev.maxHp + 12,
        hp: prev.maxHp + 12, // 全回復
        gold: Math.max(0, prev.gold - costGold),
        inventory: {
          ...prev.inventory,
          normal: Math.max(0, prev.inventory.normal - costCarrots),
        },
      };
    });

    triggerAlert(`✨ とっくんかんりょう！ さいだいHPが +12 され、レベルが あがった！`, 'success');
  };

  // 武器や防具のクラフト鍛造
  const handleCraftEquipment = (item: EqItem) => {
    if (stats.inventory.normal < item.costCarrots || stats.gold < item.costGold) {
      triggerAlert('💡 おかね、または にんじんが たりないようだ！', 'error');
      return;
    }

    const isWeapon = item.type === 'weapon';

    setStats((prev) => {
      if (prev.inventory.normal < item.costCarrots || prev.gold < item.costGold) return prev;
      return {
        ...prev,
        gold: Math.max(0, prev.gold - item.costGold),
        inventory: {
          ...prev.inventory,
          normal: Math.max(0, prev.inventory.normal - item.costCarrots),
        },
        weaponId: isWeapon ? item.id : prev.weaponId,
        armorId: !isWeapon ? item.id : prev.armorId,
      };
    });

    triggerAlert(`🔨 「${item.jpName}」を つくった！ さっそく そうびした！`, 'success');
  };

  // にんじんを売る
  const handleSellCarrots = (type: 'normal' | 'spicy' | 'frost' | 'golden' | 'rabbit') => {
    const carrotCount = stats.inventory[type];
    if (carrotCount <= 0) return;

    const details = CARROT_TEMPLATES[type];
    const earnedGold = details.sellPrice;

    setStats((prev) => {
      if (prev.inventory[type] <= 0) return prev;
      return {
        ...prev,
        gold: prev.gold + earnedGold,
        inventory: {
          ...prev.inventory,
          [type]: prev.inventory[type] - 1,
        },
      };
    });

    triggerAlert(`💰 「${details.jpName}」を出荷して、+${earnedGold}G をてにいれた！`, 'success');
  };

  // 勇者のHPを保存・同期する
  const handleSyncHp = (currentHp: number) => {
    setStats((prev) => ({
      ...prev,
      hp: currentHp,
    }));
  };

  // 【最重要】戦闘でにんじんを消費する（レイスコンディションを完全に解消し確実に減るようにした関数）
  const handleUseCarrotConsumable = (type: CarrotType) => {
    setStats((prev) => {
      const currentCount = prev.inventory[type] || 0;
      const nextCount = Math.max(0, currentCount - 1);
      return {
        ...prev,
        inventory: {
          ...prev.inventory,
          [type]: nextCount,
        },
      };
    });
  };

  // キャンプ中（非戦闘時）ににんじんを食べてHPを回復する
  const handleEatCarrotOutsideBattle = (type: CarrotType) => {
    if (isBattleActive) {
      triggerAlert('💡 コマンド戦闘中は、たたかいの コマンドから にんじんをつかってください！', 'error');
      return;
    }

    const count = stats.inventory[type] || 0;
    if (count <= 0) {
      triggerAlert('💡 そのにんじんは もっていないようです！', 'error');
      return;
    }

    if (stats.hp >= stats.maxHp) {
      triggerAlert('💖 うさぎの HPは すでに まんたんだ！ これ以上 食べても 効果が なさそうだ！', 'info');
      return;
    }

    const carrotDetail = CARROT_TEMPLATES[type];
    const healAmount = carrotDetail.eatHeal;

    setStats((prev) => {
      const currentCount = prev.inventory[type] || 0;
      if (currentCount <= 0 || prev.hp >= prev.maxHp) return prev;
      
      const newHp = Math.min(prev.maxHp, prev.hp + healAmount);
      return {
        ...prev,
        hp: newHp,
        inventory: {
          ...prev.inventory,
          [type]: currentCount - 1,
        }
      };
    });

    triggerAlert(`😋 うさぎは「${carrotDetail.jpName}」を むしゃむしゃ たべた！ HPが ${healAmount} かいふくした！`, 'success');
  };

  // 戦闘終了
  const handleBattleFinish = (victory: boolean, goldEarned: number, expEarned: number, stage: number, droppedSeed?: CarrotType | null) => {
    setIsBattleActive(false);
    setStats((prev) => {
      let nextStage = prev.highStage;
      if (victory && stage > prev.highStage) {
        nextStage = stage;
      }

      let totalExp = prev.exp + expEarned;
      let lv = prev.level;
      let maxExp = prev.maxExp;
      let totalHp = prev.hp;
      let maxHp = prev.maxHp;

      if (victory) {
        if (totalExp >= maxExp) {
          totalExp -= maxExp;
          lv += 1;
          maxExp = Math.floor(100 + lv * 50);
          maxHp += 8;
          totalHp = maxHp; // 全回復
        }
      } else {
        totalHp = Math.floor(maxHp * 0.2); // 力尽きたら20%HPで復活
      }

      const nextSeeds = { ...prev.seeds };
      if (victory && droppedSeed) {
        nextSeeds[droppedSeed] = (nextSeeds[droppedSeed] || 0) + 1;
      }

      return {
        ...prev,
        highStage: nextStage,
        gold: prev.gold + goldEarned,
        exp: totalExp,
        level: lv,
        maxExp,
        hp: totalHp,
        maxHp,
        seeds: nextSeeds,
      };
    });

    if (victory) {
      const seedDropText = droppedSeed ? `\n🎁 さらに「${SEED_TEMPLATES[droppedSeed].jpName}」をてにいれた！` : '';
      if (stats.exp + expEarned >= stats.maxExp) {
        triggerAlert(`🎉 レベルアップ！ レベル ${stats.level + 1} になりました！さいだいHP+8！${seedDropText}`, 'success');
      } else {
        triggerAlert(`⚔️ 攻略に せいこうした！ ほうしゅうとして +${goldEarned}G / +${expEarned}EXP をえた！${seedDropText}`, 'success');
      }
    } else {
      triggerAlert('🤕 うさぎは たおれたが、にんじんスープを のんで いきかえった！', 'info');
    }
  };

  // ゲームの全初期化
  const handleResetData = () => {
    if (confirm('ぼうけんのしょを 消去して、最初から はじめますか？')) {
      localStorage.removeItem(LOCAL_STORAGE_STATS_KEY);
      localStorage.removeItem(LOCAL_STORAGE_PLOTS_KEY);
      setStats(DEFAULT_STATS);
      setPlots(DEFAULT_PLOTS);
      triggerAlert('🔄 ぼうけんのしょが 初期化されました。', 'info');
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 md:p-6 bg-black min-h-screen text-white font-mono selection:bg-yellow-400 selection:text-black">
      {/* ドラクエ風フローティングアラート */}
      <AnimatePresence>
        {floatingAlert && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`fixed top-8 left-1/2 transform -translate-x-1/2 z-50 px-6 py-4 border-4 border-double border-white text-white font-bold text-sm tracking-widest min-w-[320px] text-center shadow-[0_0_20px_rgba(255,255,255,0.25)] ${
              floatingAlert.type === 'success' 
                ? 'bg-zinc-950 text-yellow-400' 
                : floatingAlert.type === 'error'
                  ? 'bg-zinc-950 text-red-500'
                  : 'bg-zinc-950 text-green-400'
            }`}
          >
            <div>{floatingAlert.type === 'success' ? '✨' : floatingAlert.type === 'error' ? '💀' : '💬'}</div>
            <div className="mt-1 leading-relaxed">{floatingAlert.message}</div>
          </motion.div>
        )}
      </AnimatePresence>

      <div>
        {/* DQ風ヘッドステータス表示 */}
        <GameHeader 
          stats={stats} 
          onShowTutorial={() => setShowTutorial(true)} 
          onEatCarrot={handleEatCarrotOutsideBattle}
          isBattleActive={isBattleActive}
        />

        {/* コマンドウィンドウを模したタブ選択 */}
        <div className="max-w-xl mx-auto sm:mx-0 border-4 border-double border-white bg-black p-3 mb-6 relative">
          <div className="absolute top-[-10px] left-4 bg-black px-2 text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
            COMMAND / コマンド
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setActiveTab('farm')}
              className={`py-2 px-1 text-center font-bold text-xs sm:text-sm transition-colors duration-150 flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'farm' 
                  ? 'text-yellow-400 border border-yellow-400 bg-zinc-900' 
                  : 'text-stone-300 hover:text-white hover:bg-zinc-900/50'
              }`}
            >
              <span>{activeTab === 'farm' ? '▶' : '　'}</span>
              <span>にんじん農園</span>
            </button>
            
            <button
              onClick={() => setActiveTab('battle')}
              className={`py-2 px-1 text-center font-bold text-xs sm:text-sm transition-colors duration-150 flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'battle' 
                  ? 'text-yellow-400 border border-yellow-400 bg-zinc-900' 
                  : 'text-stone-300 hover:text-white hover:bg-zinc-900/50'
              }`}
            >
              <span>{activeTab === 'battle' ? '▶' : '　'}</span>
              <span>野菜攻略戦</span>
            </button>
            
            <button
              onClick={() => setActiveTab('forge')}
              className={`py-2 px-1 text-center font-bold text-xs sm:text-sm transition-colors duration-150 flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'forge' 
                  ? 'text-yellow-400 border border-yellow-400 bg-zinc-900' 
                  : 'text-stone-300 hover:text-white hover:bg-zinc-900/50'
              }`}
            >
              <span>{activeTab === 'forge' ? '▶' : '　'}</span>
              <span>特訓と鍛造</span>
            </button>
          </div>
        </div>

        {/* コミュニケーション / コンポーネント切り替え部 */}
        <main className="min-h-[480px]">
          {activeTab === 'farm' && (
            <FarmTab 
              stats={stats} 
              plots={plots} 
              onPlant={handlePlant}
              onWater={handleWater}
              onHarvest={handleHarvest}
              onHarvestAll={handleHarvestAll}
              onBuySeed={handleBuySeed}
            />
          )}

          {activeTab === 'battle' && (
            <BattleTab 
              stats={stats}
              onBattleFinish={handleBattleFinish}
              onSyncHp={handleSyncHp}
              onUseCarrotConsumable={handleUseCarrotConsumable}
              onBattleStart={() => setIsBattleActive(true)}
            />
          )}

          {activeTab === 'forge' && (
            <ForgeTab 
              stats={stats}
              onUpgradeStat={handleUpgradeStat}
              onCraftEquipment={handleCraftEquipment}
              onSellCarrots={handleSellCarrots}
            />
          )}
        </main>
      </div>

      {/* ドラクエ伝統のチュートリアルダイアログ */}
      <AnimatePresence>
        {showTutorial && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="border-4 border-double border-white bg-black max-w-xl w-full p-5 md:p-6 shadow-[0_0_30px_rgba(255,255,255,0.3)] relative text-white text-left"
            >
              <div className="flex items-center gap-2 mb-4 border-b border-zinc-700 pb-3">
                <span className="text-yellow-400 font-bold">▶ ぼうけんの しょ / 遊びかた</span>
              </div>

              <div className="space-y-4 text-xs font-bold leading-relaxed max-h-[380px] overflow-y-auto pr-1">
                <p>
                  にんじんクエストへようこそ！
                  このゲームは、にんじんを<strong>【植え・育て・収穫し】</strong>、その美味しいにんじんのちからで宿敵「野菜帝国」に立ち向かう、本格ドット風キャロットロールプレイングゲームです。
                </p>

                <div className="p-3 border border-white bg-zinc-950">
                  <h3 className="font-bold text-yellow-400 flex items-center gap-1 mb-1.5">
                    🌱 1. にんじんを そだてよう
                  </h3>
                  <p className="text-stone-300 leading-relaxed font-medium">
                    「にんじん農園」では、もっている「たね」をはたけに植えることができます。
                    「水やり」をすると、せいちょう速度が <strong>2ばい</strong> になります！
                    にんじんが実ったら、しゅうかくしましょう。戦闘の大事などうぐ（攻撃・回復）としてつかえます。
                  </p>
                </div>

                <div className="p-3 border border-white bg-zinc-950">
                  <h3 className="font-bold text-yellow-500 flex items-center gap-1 mb-1.5">
                    ⚔️ 2. 野菜の魔物と バトル
                  </h3>
                  <p className="text-stone-300 leading-relaxed font-medium">
                    「野菜攻略戦」から難易度別のステージへ出撃します。戦闘はターン制です。通常攻撃のほか、
                    <strong>【にんじんをどうぐとして つかう（投げる / 食べる）】</strong>ことで、強力な効果を発揮できます！
                    <br />
                    - <strong>普通にんじん</strong>：ノーマルダメージ / またはHPを大きく回復
                    <br />
                    - <strong>激辛にんじん</strong>：パワーが大幅アップ！ (攻撃力が1.5倍に)
                    <br />
                    - <strong>氷結にんじん</strong>：魔物を1ターン完全にフリーズ！
                    <br />
                    - <strong>ウサ美にんじん</strong>：お助けウサ美ちゃんを召喚！
                  </p>
                </div>

                <div className="p-3 border border-white bg-zinc-950 bg-opacity-65">
                  <h3 className="font-bold text-yellow-500 flex items-center gap-1 mb-1.5">
                    🔨 3. つよくなって ぶきをきたえよう
                  </h3>
                  <p className="text-stone-300 leading-relaxed font-medium">
                    にんじんは市場の「出荷・売却」により、ゴールド（G）にかえられます。
                    てのいれたゴールドで、つよい種をかったり、うさぎ勇者を「とっくん（最大HP増加）」でパワーアップさせたり、「にんじんのやり」などのそうびを鍛造（クラフト）して永久に強化できます。
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-zinc-700 flex justify-end">
                <button
                  onClick={() => setShowTutorial(false)}
                  className="px-6 py-2.5 bg-black hover:bg-zinc-900 border border-white hover:border-yellow-400 text-white hover:text-yellow-400 font-bold text-xs uppercase cursor-pointer"
                >
                  ぼうけんを はじめる ▶
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ドラクエ風フッター */}
      <footer className="mt-12 pt-4 border-t border-zinc-800 flex flex-col md:flex-row items-center justify-between text-[11px] text-stone-500 gap-4 font-bold">
        <div>
          <span>© 2026 にんじんクエストRPG. おおちのめぐみに かんしゃして いただきましょう。</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleResetData}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-950 hover:bg-red-950/40 text-stone-500 hover:text-red-400 transition border border-stone-800 hover:border-red-800 cursor-pointer shadow-sm text-[10px]"
          >
            ぼうけんのしょを 消す (初期化)
          </button>
        </div>
      </footer>
    </div>
  );
}
