import React, { useState, useEffect, useRef } from 'react';
import { PlayerStats, DUNGEON_STAGES, CARROT_TEMPLATES, SEED_TEMPLATES, CarrotType, Enemy, BattleState } from '../types';
import { Shield, Skull, Award, Play, AlertTriangle, MessageSquare, ChevronRight, Swords, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface BattleTabProps {
  stats: PlayerStats;
  onBattleFinish: (victory: boolean, goldEarned: number, expEarned: number, nextStage: number, droppedSeed?: CarrotType | null) => void;
  onSyncHp: (currentHp: number) => void;
  onUseCarrotConsumable: (type: CarrotType) => void;
  onBattleStart?: () => void;
}

export default function BattleTab({ stats, onBattleFinish, onSyncHp, onUseCarrotConsumable, onBattleStart }: BattleTabProps) {
  const [selectedStage, setSelectedStage] = useState<number | null>(null);
  const [battle, setBattle] = useState<BattleState>({
    stage: 1,
    enemy: null,
    playerCurrentHp: stats.hp,
    enemyCurrentHp: 0,
    playerBuffs: { atkBoostRemaining: 0, defBoostRemaining: 0 },
    battleLog: [],
    isPlayerTurn: true,
    status: 'none',
    summonedRabbitAtk: 0,
  });

  const [activeCarrotMenu, setActiveCarrotMenu] = useState<boolean>(false);
  const [selectedCarrotForAction, setSelectedCarrotForAction] = useState<CarrotType | null>(null);
  const [combatAnimation, setCombatAnimation] = useState<'none' | 'player-hit' | 'enemy-hit' | 'throw' | 'heal'>('none');

  // どうぐメニュー開閉時に自動選択
  useEffect(() => {
    if (activeCarrotMenu) {
      const currentCount = selectedCarrotForAction ? (stats.inventory[selectedCarrotForAction] || 0) : 0;
      if (currentCount <= 0) {
        const firstAvailable = (['normal', 'spicy', 'frost', 'golden', 'rabbit'] as CarrotType[]).find(
          (type) => (stats.inventory[type] || 0) > 0
        );
        setSelectedCarrotForAction(firstAvailable || null);
      }
    } else {
      setSelectedCarrotForAction(null);
    }
  }, [activeCarrotMenu, stats.inventory, selectedCarrotForAction]);
  const [floatingDamage, setFloatingDamage] = useState<{ id: number; text: string; isEnemy: boolean } | null>(null);
  const [thrownCarrotIcon, setThrownCarrotIcon] = useState<string | null>(null);

  const logEndRef = useRef<HTMLDivElement>(null);

  // ログを最下部に自動スクロール
  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [battle.battleLog]);

  // モンスター襲来・ダンジョン開始処理
  const handleStartStage = (stageNum: number) => {
    onBattleStart?.();
    const stageInfo = DUNGEON_STAGES.find((s) => s.stage === stageNum);
    if (!stageInfo) return;

    const newEnemy: Enemy = {
      name: stageInfo.enemyName,
      jpName: stageInfo.jpName,
      hp: stageInfo.baseHp,
      maxHp: stageInfo.baseHp,
      atk: stageInfo.baseAtk,
      def: stageInfo.baseDef,
      rewardExp: stageInfo.rewardExp,
      rewardGold: stageInfo.rewardGold,
      iconType: stageInfo.enemySprite,
    };

    setSelectedStage(stageNum);
    setBattle({
      stage: stageNum,
      enemy: newEnemy,
      playerCurrentHp: stats.hp,
      enemyCurrentHp: newEnemy.hp,
      playerBuffs: { atkBoostRemaining: 0, defBoostRemaining: 0 },
      battleLog: [
        `⚔️ 「${stageInfo.jpName}」へ のりこんだ！`,
        `👾 「${newEnemy.jpName}」が あらわれた！`,
      ],
      isPlayerTurn: true,
      status: 'fighting',
      summonedRabbitAtk: 0,
    });
  };

  // ダメージ表示ポップアップ
  const showDamageText = (text: string, isEnemy: boolean) => {
    const id = Date.now();
    setFloatingDamage({ id, text, isEnemy });
    setTimeout(() => {
      setFloatingDamage(null);
    }, 1200);
  };

  // 勇者の基本攻撃力を計算（武器補正、攻撃力上昇バフを考慮）
  const getPlayerAtkValue = () => {
    const baseAtk = 15 + stats.level * 3;
    const currentWeaponIdx = WEAPON_UPGRADES_FIND();
    const weaponAtk = currentWeaponIdx !== -1 ? WEAPON_UPGRADES_VAL(currentWeaponIdx) : 0;
    
    let total = baseAtk + weaponAtk;
    if (battle.playerBuffs.atkBoostRemaining > 0) {
      total = Math.floor(total * 1.5);
    }
    return total;
  };

  const WEAPON_UPGRADES_FIND = () => {
    const upgrades = ['weapon_0', 'weapon_1', 'weapon_2', 'weapon_3'];
    return upgrades.indexOf(stats.weaponId);
  };

  const WEAPON_UPGRADES_VAL = (idx: number) => {
    const values = [0, 8, 22, 65];
    return values[idx] || 0;
  };

  // 勇者の基本防御力を計算（防具補正、防御バフを考慮）
  const getPlayerDefValue = () => {
    const upgrades = ['armor_0', 'armor_1', 'armor_2', 'armor_3'];
    const armorIdx = upgrades.indexOf(stats.armorId);
    const armorDef = armorIdx !== -1 ? [0, 5, 15, 40][armorIdx] : 0;
    
    let total = armorDef;
    if (battle.playerBuffs.defBoostRemaining > 0) {
      total += 15; // 防御行動
    }
    return total;
  };

  // ダメージ算出
  const calculateDamage = (attackerAtk: number, defenderDef: number) => {
    const raw = attackerAtk - Math.floor(defenderDef / 2);
    return Math.max(5, raw + Math.floor(Math.random() * 5) - 2);
  };

  // たたかうを選択（斬撃）
  const handleActionAttack = () => {
    if (!battle.enemy || !battle.isPlayerTurn || battle.status !== 'fighting') return;

    setCombatAnimation('player-hit');
    const attackVal = getPlayerAtkValue();
    const dmg = calculateDamage(attackVal, battle.enemy.def);
    const updatedEnemyHp = Math.max(0, battle.enemyCurrentHp - dmg);

    // お助けウサ美ちゃんの追加ダメージ
    let rabbitDmg = 0;
    if (battle.summonedRabbitAtk > 0) {
      rabbitDmg = battle.summonedRabbitAtk * 15;
    }

    const finalEnemyHp = Math.max(0, updatedEnemyHp - rabbitDmg);

    showDamageText(`-${dmg + rabbitDmg} HP`, true);

    const logList = [
      ...battle.battleLog,
      `⚔️ うさぎの こうげき！ 「${battle.enemy.jpName}」に ${dmg} の ダメージ！`,
    ];

    if (rabbitDmg > 0) {
      logList.push(`🐰 ウサ美ちゃんの キックが さく裂！ ${rabbitDmg} の ダメージを あたえた！`);
    }

    const nextTurnState = finalEnemyHp <= 0 ? 'victory' : 'fighting';

    setBattle((prev) => ({
      ...prev,
      enemyCurrentHp: finalEnemyHp,
      battleLog: logList,
      isPlayerTurn: nextTurnState === 'victory' ? true : false,
      status: nextTurnState,
    }));

    setTimeout(() => {
      setCombatAnimation('none');
      if (nextTurnState === 'victory') {
        triggerVictory();
      } else {
        triggerEnemyTurn();
      }
    }, 850);
  };

  // 【バグ修正済み】にんじんを使う（なげる、または食べる）
  const handleUseCarrot = (type: CarrotType, action: 'throw' | 'eat') => {
    if (!battle.enemy || !battle.isPlayerTurn || battle.status !== 'fighting') return;
    
    // 親の最新インベントリ(stats)で個数をチェック
    const currentCount = stats.inventory[type] || 0;
    if (currentCount <= 0) return;

    // 即座に親コンポーネントのにんじん減少をトリガー（レイスコンディションのない関数型アップデートを呼ぶ）
    onUseCarrotConsumable(type);
    setActiveCarrotMenu(false);

    const carrot = CARROT_TEMPLATES[type];

    if (action === 'throw') {
      setThrownCarrotIcon(carrot.icon);
      setCombatAnimation('throw');

      setTimeout(() => {
        setThrownCarrotIcon(null);
        setCombatAnimation('enemy-hit');

        let calculatedDmg = carrot.throwDamage;
        let isFreezed = false;
        let summonedRabbitCount = 0;

        if (type === 'frost') {
          isFreezed = true;
        } else if (type === 'rabbit') {
          summonedRabbitCount = 1;
        }

        const finalEnemyHp = Math.max(0, battle.enemyCurrentHp - calculatedDmg);
        showDamageText(`-${calculatedDmg} HP`, true);

        const logs = [
          ...battle.battleLog,
          `🥕 うさぎは 「${carrot.jpName}」を なげつけた！ 「${calculatedDmg}」の ダメージ！`,
        ];

        if (isFreezed) {
          logs.push(`❄️ 「${battle.enemy?.jpName}」の からだが 凍りついて うごけない！`);
        }
        if (summonedRabbitCount > 0) {
          logs.push(`🐰 お助けウサ美ちゃんが さんせんした！`);
        }

        const nextTurnState = finalEnemyHp <= 0 ? 'victory' : 'fighting';

        setBattle((prev) => ({
          ...prev,
          enemyCurrentHp: finalEnemyHp,
          summonedRabbitAtk: prev.summonedRabbitAtk + summonedRabbitCount,
          battleLog: logs,
          // 凍結バフの場合はプレイヤーがもう一度行動できる！
          isPlayerTurn: isFreezed ? true : nextTurnState === 'victory' ? true : false,
          status: nextTurnState,
        }));

        setTimeout(() => {
          setCombatAnimation('none');
          if (nextTurnState === 'victory') {
            triggerVictory();
          } else {
            if (!isFreezed) {
              triggerEnemyTurn();
            }
          }
        }, 600);

      }, 800);

    } else if (action === 'eat') {
      setCombatAnimation('heal');
      const healAmt = carrot.eatHeal;
      const updatedHp = Math.min(stats.maxHp, battle.playerCurrentHp + healAmt);
      
      // 親に新しいHPを通知
      onSyncHp(updatedHp);

      showDamageText(`+${healAmt} HP`, false);

      const logs = [
        ...battle.battleLog,
        `😋 うさぎは 「${carrot.jpName}」を かじった！ キズが ${healAmt} 回復した！`,
      ];

      let nextAtkBoost = battle.playerBuffs.atkBoostRemaining;
      if (carrot.eatBuff?.stat === 'atk') {
        nextAtkBoost = carrot.eatBuff.duration;
        logs.push(`🔥 ちからが みなぎる！ こうげきりょくが 1.5倍に あがった！`);
      }

      setBattle((prev) => ({
        ...prev,
        playerCurrentHp: updatedHp,
        playerBuffs: { ...prev.playerBuffs, atkBoostRemaining: nextAtkBoost },
        battleLog: logs,
        isPlayerTurn: false,
      }));

      setTimeout(() => {
        setCombatAnimation('none');
        triggerEnemyTurn();
      }, 800);
    }
  };

  // 防御する
  const handleActionGuard = () => {
    if (!battle.enemy || !battle.isPlayerTurn || battle.status !== 'fighting') return;

    setCombatAnimation('heal');
    const healAmt = 15;
    const updatedHp = Math.min(stats.maxHp, battle.playerCurrentHp + healAmt);
    onSyncHp(updatedHp);

    showDamageText(`+15 HP`, false);

    setBattle((prev) => ({
      ...prev,
      playerCurrentHp: updatedHp,
      playerBuffs: {
        ...prev.playerBuffs,
        defBoostRemaining: 1,
      },
      battleLog: [
        ...prev.battleLog,
        `🛡️ うさぎは からだを がっちり まもっている！ HPが 15 回復した！`,
      ],
      isPlayerTurn: false,
    }));

    setTimeout(() => {
      setCombatAnimation('none');
      triggerEnemyTurn();
    }, 800);
  };

  // 敵（野菜モンスター）の攻撃ターン
  const triggerEnemyTurn = () => {
    setTimeout(() => {
      setBattle((prev) => {
        if (!prev.enemy || prev.status !== 'fighting') return prev;

        const nextAtkBuff = Math.max(0, prev.playerBuffs.atkBoostRemaining - 1);
        const nextDefBuff = Math.max(0, prev.playerBuffs.defBoostRemaining - 1);

        setCombatAnimation('enemy-hit');

        const playerDef = getPlayerDefValue();
        const baseAtkDmg = calculateDamage(prev.enemy.atk, playerDef);
        const finalHp = Math.max(0, prev.playerCurrentHp - baseAtkDmg);
        onSyncHp(finalHp);

        showDamageText(`-${baseAtkDmg} HP`, false);

        const nextLogs = [
          ...prev.battleLog,
          `💀 「${prev.enemy.jpName}」の こうげき！ うさぎは ${baseAtkDmg} の ダメージを うけた！`,
        ];

        const nextStatus = finalHp <= 0 ? 'defeat' : 'fighting';

        return {
          ...prev,
          playerCurrentHp: finalHp,
          playerBuffs: { atkBoostRemaining: nextAtkBuff, defBoostRemaining: nextDefBuff },
          battleLog: nextLogs,
          isPlayerTurn: nextStatus === 'defeat' ? false : true,
          status: nextStatus,
        };
      });

      setTimeout(() => {
        setCombatAnimation('none');
        setBattle((prev) => {
          if (prev.status === 'defeat') {
            triggerDefeat();
          }
          return prev;
        });
      }, 700);

    }, 800);
  };

  // 勝利の美酒
  const triggerVictory = () => {
    if (!battle.enemy) return;
    const gold = battle.enemy.rewardGold;
    const exp = battle.enemy.rewardExp;
    
    // 敵を倒した時にランダムでタネが落ちるようにする
    let droppedSeed: CarrotType | null = null;
    const dropChance = 0.75; // ドロップ率を 75% に微増して入手しやすく変更
    if (Math.random() < dropChance) {
      // 厳密な重み付き抽選（合計100）
      // 普通 (45%) > 激辛 (25%) > 氷結 (15%) > ウサ美 (10%) > 黄金 (5%)
      const seedWeights: { type: CarrotType; weight: number }[] = [
        { type: 'normal', weight: 45 },
        { type: 'spicy', weight: 25 },
        { type: 'frost', weight: 15 },
        { type: 'rabbit', weight: 10 },
        { type: 'golden', weight: 5 },
      ];

      const totalWeight = seedWeights.reduce((sum, w) => sum + w.weight, 0);
      let randResult = Math.random() * totalWeight;
      
      for (const sw of seedWeights) {
        if (randResult < sw.weight) {
          droppedSeed = sw.type;
          break;
        }
        randResult -= sw.weight;
      }
      console.log(`[Battle Reward Debug] droppedSeed: ${droppedSeed}, roll total: ${totalWeight}`);
    }

    const logList = [
      ...battle.battleLog,
      `🎉 「${battle.enemy?.jpName}」を やっつけた！`,
      `💰 おたから： ${gold} ゴールドを てにいれた！`,
      `✨ けいけんち： ${exp} ポイントを たくわえた！`,
    ];

    if (droppedSeed) {
      const seedName = SEED_TEMPLATES[droppedSeed].jpName;
      logList.push(`🎁 ドロップ！「${seedName}」を てにいれた！`);
    }

    setBattle((prev) => ({
      ...prev,
      battleLog: logList,
    }));

    setTimeout(() => {
      onBattleFinish(true, gold, exp, battle.stage, droppedSeed);
      setSelectedStage(null);
    }, 2800);
  };

  // 無念、敗北した
  const triggerDefeat = () => {
    setBattle((prev) => ({
      ...prev,
      battleLog: [
        ...prev.battleLog,
        `😭 うさぎは ちからつきて しまった...`,
        `🏡 のうえんの おうちに はこばれ、ゆっくり 療養した。`,
      ],
    }));

    setTimeout(() => {
      onBattleFinish(false, 0, 0, battle.stage);
      setSelectedStage(null);
    }, 2800);
  };

  if (selectedStage === null) {
    return (
      <div className="bg-black text-white font-mono p-5 md:p-6 border-4 border-double border-white shadow-2xl relative overflow-hidden uppercase tracking-wider text-xs md:text-sm">
        <div className="flex items-center gap-3 mb-6 border-b-2 border-white pb-3">
          <span className="text-xl text-yellow-400">⚔️</span>
          <h2 className="text-sm md:text-base font-bold tracking-widest text-white">
            ▶ だんじょんを えらんでください
          </h2>
        </div>

        <p className="text-xs md:text-sm text-zinc-400 mb-6 leading-relaxed border border-white p-3 bg-zinc-950 font-bold">
          にんじん帝国に 盾突く 野菜軍団が はびこっています。
          のうえんで そだてた 美味しいにんじんを「どうぐ」としてつかい、
          ステージボスを 退治しましょう！
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DUNGEON_STAGES.map((stg) => {
            const isUnlocked = stg.stage === 1 || stats.highStage >= stg.stage - 1;

            return (
              <div 
                key={stg.stage}
                className={`p-4 border-2 flex flex-col justify-between items-start gap-3 transition-colors ${
                  isUnlocked 
                    ? 'bg-black border-white hover:border-yellow-400 hover:bg-zinc-900/40' 
                    : 'border-zinc-800 bg-zinc-950 opacity-40'
                }`}
              >
                <div className="w-full">
                  <div className="flex items-center justify-between gap-2 border-b border-zinc-800 pb-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-white text-black font-extrabold px-1.5 py-0.5">
                        STAGE {stg.stage}
                      </span>
                      <h3 className="font-bold text-xs sm:text-sm text-white truncate">{stg.jpName}</h3>
                    </div>
                    {!isUnlocked && <span className="text-[10px] text-red-500 font-bold">🔒 LOCKED</span>}
                  </div>
                  <p className="text-[11px] text-zinc-500 font-bold leading-normal mb-3 min-h-[30px]">{stg.description}</p>
                  
                  <div className="flex flex-wrap gap-x-2.5 gap-y-1 text-[10px] md:text-xs text-zinc-400 font-mono border-t border-dashed border-zinc-850 pt-2">
                    <span className="text-yellow-400">👾 {stg.enemyName}</span>
                    <span className="text-red-500">❤️ HP:{stg.baseHp}</span>
                    <span className="text-yellow-500">💰 {stg.rewardGold}G</span>
                    <span className="text-green-400">✨ {stg.rewardExp}xp</span>
                  </div>
                </div>

                <div className="w-full pt-1">
                  {isUnlocked ? (
                    <button
                      onClick={() => handleStartStage(stg.stage)}
                      className="group relative w-full py-1.5 bg-zinc-950 border border-white hover:border-yellow-400 hover:text-yellow-400 text-xs font-bold uppercase transition flex items-center justify-center cursor-pointer"
                    >
                      しゅつげき する ⚔️
                    </button>
                  ) : (
                    <div className="w-full text-center py-1.5 bg-zinc-950 text-zinc-600 text-[10px] border border-zinc-900">
                      🔒 前ステージクリアで解放
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const currentStageInfo = DUNGEON_STAGES.find((s) => s.stage === battle.stage);
  const playerHpPercent = (battle.playerCurrentHp / stats.maxHp) * 100;
  const playerHpColorClass = playerHpPercent <= 25 ? 'bg-red-600' : playerHpPercent <= 50 ? 'bg-yellow-500' : 'bg-green-500';
  const playerHpTextClass = playerHpPercent <= 25 ? 'text-red-500 font-bold animate-pulse' : playerHpPercent <= 50 ? 'text-yellow-400 font-bold' : 'text-green-400 font-bold';

  return (
    <div className="bg-black text-white font-mono p-4 border-4 border-double border-white shadow-2xl relative overflow-hidden select-none flex flex-col gap-4 min-h-[550px] justify-between uppercase tracking-widest text-xs md:text-sm">
      
      {/* なげるにんじんで飛ぶアニメーション */}
      <AnimatePresence>
        {thrownCarrotIcon && (
          <motion.div
            initial={{ left: '25%', bottom: '25%', scale: 0.5, rotate: 0 }}
            animate={{ left: '50%', top: '35%', scale: 2, rotate: 720 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="absolute text-5xl z-50 pointer-events-none drop-shadow-[0_0_15px_rgba(234,179,8,0.7)]"
          >
            {thrownCarrotIcon}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ドラクエ伝統の上部3分割ステータス枠 (スクロール時も確認できるように sticky top-0化) */}
      <div className="sticky top-0 z-30 bg-black pt-1 pb-2 shadow-[0_4px_10px_rgba(0,0,0,0.9)] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs md:text-sm border-b border-zinc-900 sm:border-b-0 -mx-4 px-4 sm:mx-0 sm:px-0">
        {/* プレイヤー：ゆうしゃ */}
        <div className="border-2 border-white bg-zinc-950 p-2.5 relative">
          <div className="absolute top-1 right-2 text-[10px] text-zinc-645">STATUS</div>
          <div className="text-yellow-400 font-bold mb-1 border-b border-zinc-800 pb-1.5 flex justify-between">
            <span>👤 うさぎ</span>
            <span>Lv {stats.level}</span>
          </div>
          <div className="space-y-1.5 mt-1 text-xs md:text-sm leading-relaxed">
            <div className="flex justify-between items-center">
              <span>H P</span>
              <span className={playerHpTextClass}>{battle.playerCurrentHp} / {stats.maxHp}</span>
            </div>
            <div className="w-full bg-zinc-950 h-2 border border-zinc-800 p-0.5 overflow-hidden">
              <div 
                className={`${playerHpColorClass} h-full transition-all duration-300`}
                style={{ width: `${Math.min(100, Math.max(0, playerHpPercent))}%` }}
              />
            </div>
            {battle.playerBuffs.atkBoostRemaining > 0 && (
              <span className="text-red-400 text-xs mt-1 block font-bold">🔥 バイキルト中(攻撃1.5倍)</span>
            )}
          </div>
        </div>

        {/* 召喚したお助け仲間（ウサ美ちゃん） */}
        {battle.summonedRabbitAtk > 0 ? (
          <div className="border-2 border-white bg-zinc-950 p-2.5 relative animate-pulse">
            <div className="absolute top-1 right-2 text-[10px] text-pink-500 font-bold">MONSTER</div>
            <div className="text-pink-400 font-bold mb-1 border-b border-zinc-800 pb-1.5 font-bold">
              🐰 なかま：ウサ美ちゃん
            </div>
            <div className="text-xs space-y-1 mt-1 font-bold leading-normal">
              <div className="flex justify-between">
                <span>なかまの数 :</span>
                <span>{battle.summonedRabbitAtk} 匹</span>
              </div>
              <p className="text-zinc-500 text-[10px] mt-1">毎ターン追加で強力キックをお見舞い！</p>
            </div>
          </div>
        ) : (
          <div className="hidden sm:flex border-2 border-dashed border-zinc-900 bg-zinc-950 p-2.5 text-zinc-700 flex-col items-center justify-center text-xs tracking-widest">
            <span>なかまは まだ いない</span>
          </div>
        )}

        {/* 敵モンスター：野菜帝国軍 */}
        <div className="border-2 border-white bg-zinc-950 p-2.5 relative">
          <div className="absolute top-1 right-2 text-[10px] text-zinc-650">TARGET</div>
          <div className="text-red-400 font-bold mb-1 border-b border-zinc-800 pb-1.5 truncate">
            👾 {battle.enemy?.jpName}
          </div>
          <div className="space-y-1.5 mt-1 text-xs md:text-sm leading-relaxed">
            <div className="flex justify-between items-center">
              <span>H P</span>
              <span>{battle.enemyCurrentHp} / {battle.enemy?.maxHp}</span>
            </div>
            <div className="w-full bg-zinc-950 h-2 border border-zinc-800 p-0.5 overflow-hidden">
              <div 
                className="bg-red-500 h-full transition-all duration-300"
                style={{ width: `${(battle.enemyCurrentHp / (battle.enemy?.maxHp || 1)) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* フロントビューモンスター表示枠 (DQ1〜DQ5の伝統的な黒背景、モバイル向けに高さを調整できるようにコンパクト化) */}
      <div className="flex-1 bg-zinc-950 border-2 border-white my-1 flex flex-col justify-center items-center relative min-h-[140px] sm:min-h-[180px] md:min-h-[220px] p-2">
        {/* レトロ風走査線オーバーレイ */}
        <div className="absolute inset-0 bg-scanlines opacity-5 pointer-events-none" />

        {/* 浮かび上がる数字エフェクト */}
        <AnimatePresence>
          {floatingDamage && (
            <motion.div
              key={floatingDamage.id}
              initial={{ opacity: 1, y: 20, scale: 0.8 }}
              animate={{ opacity: 0, y: -50, scale: 1.6 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.9 }}
              className={`absolute font-black text-4xl drop-shadow-[0_2px_8px_rgba(255,255,255,0.4)] z-40 tracking-wider ${
                floatingDamage.isEnemy ? 'text-red-500' : 'text-green-500'
              }`}
            >
              {floatingDamage.text}
            </motion.div>
          )}
        </AnimatePresence>

        {/* モンスターメインアートワーク (サイズをレスポンシブに調整) */}
        <div className="flex flex-col items-center justify-center gap-2">
          <div 
            className={`text-6xl sm:text-7xl md:text-8xl select-none transition-all duration-200 ${
              combatAnimation === 'enemy-hit' 
                ? 'scale-125 duration-75 text-red-500 opacity-60 animate-shake' 
                : combatAnimation === 'player-hit'
                ? 'scale-90 duration-75 brightness-150'
                : 'hover:scale-105'
            }`}
          >
            {battle.enemy?.iconType}
          </div>
          
          <div className="bg-black py-0.5 px-3 border border-zinc-800 text-[10px] tracking-widest font-bold text-zinc-300">
            {battle.enemy?.jpName} あらわる！
          </div>
        </div>

        {/* 現ステージ情報 */}
        <div className="absolute bottom-2 left-2 text-[8px] text-zinc-605 font-mono tracking-widest">
          STAGE {battle.stage} - {currentStageInfo?.jpName}
        </div>
      </div>

      {/* スクロール不要でHPを瞬時に確認できる補助クイックステータスバー */}
      <div className="border-2 border-white bg-zinc-950 p-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-[10px] sm:text-[11px] font-bold select-none text-white shrink-0 shadow-lg">
        {/* ゆうしゃ側 */}
        <div className="flex items-center justify-between sm:justify-start gap-2 border-b sm:border-b-0 pb-1 sm:pb-0 border-zinc-800 border-dashed">
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-yellow-400">👤 うさぎ</span>
            <span className="text-zinc-500 text-[9px] font-normal">Lv.{stats.level}</span>
          </div>
          <div className="flex items-center gap-2 flex-grow max-w-[160px] sm:max-w-[200px]">
            <div className="flex-grow bg-black h-1.5 border border-zinc-800 p-0.5 overflow-hidden">
              <div 
                className={`${playerHpColorClass} h-full transition-all duration-300`}
                style={{ width: `${Math.min(100, Math.max(0, playerHpPercent))}%` }}
              />
            </div>
            <span className={`${playerHpTextClass} text-right shrink-0 min-w-[55px] font-bold`}>
              {battle.playerCurrentHp}/{stats.maxHp}
            </span>
          </div>
          {battle.playerBuffs.atkBoostRemaining > 0 && (
            <span className="text-[9px] text-red-400 bg-red-950 px-1 border border-red-800 shrink-0 font-bold">🔥バフ</span>
          )}
        </div>
        
        {/* てき側 */}
        <div className="flex items-center justify-between sm:justify-end gap-2">
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-red-400 truncate max-w-[100px]">👾 {battle.enemy?.jpName}</span>
          </div>
          <div className="flex items-center gap-1.5 flex-grow max-w-[160px] sm:max-w-[200px]">
            <div className="flex-grow bg-black h-1.5 border border-zinc-800 p-0.5 overflow-hidden">
              <div 
                className="bg-red-500 h-full transition-all duration-300"
                style={{ width: `${(battle.enemyCurrentHp / (battle.enemy?.maxHp || 1)) * 100}%` }}
              />
            </div>
            <span className="text-red-500 text-right shrink-0 min-w-[55px] font-bold">
              {battle.enemyCurrentHp}/{battle.enemy?.maxHp}
            </span>
          </div>
        </div>
      </div>

      {/* ボトムセクション：メッセージ枠かどうぐ袋選択画面（中2カラム、コマンド1カラム） */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-stretch min-h-[140px]">
        {activeCarrotMenu && battle.isPlayerTurn && battle.status === 'fighting' ? (
          <>
            {/* DQ風どうぐ袋：にんじんセレクト窓 (左2/3) */}
            <div className="md:col-span-2 border-2 border-white bg-black p-2.5 h-[140px] overflow-y-auto text-xs font-bold text-white relative scrollbar-thin flex flex-col">
              <div className="text-[10px] text-yellow-400 font-extrabold mb-1.5 pb-1 border-b border-dashed border-zinc-800 flex justify-between items-center tracking-widest shrink-0">
                <span>🎒 どうぐを えらんでください（にんじん）</span>
                <span className="text-zinc-500 font-normal">スクロール ↕</span>
              </div>
              
              <div className="flex-1 space-y-1 pr-0.5">
                {(['normal', 'spicy', 'frost', 'golden', 'rabbit'] as CarrotType[]).map((type) => {
                  const carrot = CARROT_TEMPLATES[type];
                  const count = stats.inventory[type] || 0;
                  const isSelected = selectedCarrotForAction === type;

                  return (
                    <div
                      key={type}
                      onClick={() => {
                        if (count > 0) {
                          setSelectedCarrotForAction(type);
                        }
                      }}
                      className={`group flex items-center justify-between p-1.5 border transition select-none ${
                        count > 0 
                          ? isSelected 
                            ? 'border-yellow-400 bg-zinc-900 text-yellow-400 font-extrabold cursor-pointer' 
                            : 'border-transparent hover:bg-zinc-950 hover:border-zinc-800 cursor-pointer text-stone-200'
                          : 'opacity-25 border-transparent cursor-not-allowed text-stone-600'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {/* 選択中のレトロ差し込みのカーソル */}
                        <span className={`text-[10px] w-3 text-center ${isSelected ? 'opacity-100 text-yellow-400' : 'opacity-0'}`}>▶</span>
                        <span className="text-lg shrink-0">{carrot.icon}</span>
                        <div className="text-left">
                          <span className="font-bold text-xs">{carrot.jpName}</span>
                          <p className="text-[9px] text-zinc-500 font-normal truncate max-w-[200px] md:max-w-xs mt-0.5">{carrot.description}</p>
                        </div>
                      </div>
                      <span className="font-bold text-[10px] px-1.5 py-0.5 bg-zinc-950 border border-zinc-800 shrink-0">
                        {count} 本
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* DQ風どうぐサブコマンド窓 (右1/3) */}
            <div className="border-2 border-white bg-black p-2 flex flex-col justify-between gap-1.5 font-bold h-[145px] md:h-auto">
              <div className="flex-1 flex flex-col justify-center gap-1">
                {selectedCarrotForAction ? (
                  <>
                    <div className="text-[10px] text-zinc-500 font-extrabold text-center border-b border-dashed border-zinc-850 pb-1 mb-1 truncate flex items-center justify-center gap-1">
                      <span>{CARROT_TEMPLATES[selectedCarrotForAction].icon}</span>
                      <span>{CARROT_TEMPLATES[selectedCarrotForAction].jpName}</span>
                    </div>
                    
                    {/* なげる */}
                    <button
                      onClick={() => handleUseCarrot(selectedCarrotForAction, 'throw')}
                      className="group relative py-1 text-left text-[11px] pl-6 pr-2 hover:text-yellow-400 transition cursor-pointer font-bold border border-transparent hover:border-zinc-700 bg-zinc-950"
                    >
                      <span className="absolute left-1.5 text-yellow-400">▶</span>
                      なげる (攻:{CARROT_TEMPLATES[selectedCarrotForAction].throwDamage})
                    </button>
                    
                    {/* たべる */}
                    <button
                      onClick={() => handleUseCarrot(selectedCarrotForAction, 'eat')}
                      className="group relative py-1 text-left text-[11px] pl-6 pr-2 hover:text-green-400 transition cursor-pointer font-bold border border-transparent hover:border-zinc-700 bg-zinc-950"
                    >
                      <span className="absolute left-1.5 text-green-400">▶</span>
                      たべる (+{CARROT_TEMPLATES[selectedCarrotForAction].eatHeal}回復)
                    </button>
                  </>
                ) : (
                  <div className="text-[10px] text-zinc-600 text-center py-2">
                    にんじんを<br />えらんでください
                  </div>
                )}
              </div>

              {/* もどる */}
              <button
                onClick={() => {
                  setActiveCarrotMenu(false);
                  setSelectedCarrotForAction(null);
                }}
                className="group relative py-1 pl-6 pr-1 text-left text-[11px] text-stone-300 hover:text-red-400 transition cursor-pointer border border-dashed border-zinc-900 hover:border-red-500 mt-1 bg-black shrink-0"
              >
                <span className="absolute left-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-red-500">▶</span>
                <span>◀ コマンドにもどる</span>
              </button>
            </div>
          </>
        ) : (
          <>
            {/* レトロメッセージログ (左2/3) */}
            <div className="md:col-span-2 border-2 border-white bg-black p-3 h-[130px] md:h-[140px] overflow-y-auto text-[11px] font-bold text-white tracking-widest leading-relaxed flex flex-col justify-start relative scrollbar-thin">
              <div className="space-y-1.5 text-left font-bold">
                {battle.battleLog.slice(-4).map((log, i) => (
                  <div key={i} className="animate-fadeIn flex items-start gap-1 p-0.5 border-b border-zinc-950">
                    <span className="text-zinc-600">▶</span>
                    <span>{log}</span>
                  </div>
                ))}
              </div>
              <div ref={logEndRef} />
              {battle.isPlayerTurn && battle.status === 'fighting' && (
                <span className="absolute bottom-1 right-2 animate-bounce text-yellow-400 text-xs">▼</span>
              )}
            </div>

            {/* DQ風戦闘コマンド窓 (右1/3) */}
            <div className="border-2 border-white bg-black p-2 flex flex-col justify-center gap-1 font-bold h-[140px] md:h-auto">
              {battle.status === 'fighting' ? (
                <div className="flex flex-col gap-1 w-full text-left">
                  {/* たたかう */}
                  <button
                    disabled={!battle.isPlayerTurn}
                    onClick={handleActionAttack}
                    className={`group relative py-1.5 pl-6 pr-2 text-left text-xs transition border border-zinc-950 hover:border-zinc-800 hover:bg-zinc-900 ${
                      battle.isPlayerTurn 
                        ? 'text-white hover:text-yellow-400 cursor-pointer font-bold' 
                        : 'text-zinc-700 cursor-not-allowed'
                    }`}
                  >
                    <span className="absolute left-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-yellow-400">▶</span>
                    <span>たたかう</span>
                  </button>

                  {/* にんじん (どうぐ) */}
                  <button
                    disabled={!battle.isPlayerTurn}
                    onClick={() => setActiveCarrotMenu(true)}
                    className={`group relative py-1.5 pl-6 pr-2 text-left text-xs transition border border-zinc-950 hover:border-zinc-800 hover:bg-zinc-900 ${
                      battle.isPlayerTurn 
                        ? 'text-white hover:text-yellow-400 cursor-pointer font-bold' 
                        : 'text-zinc-700 cursor-not-allowed'
                    }`}
                  >
                    <span className="absolute left-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-yellow-400">▶</span>
                    <span>にんじん (どうぐ)</span>
                  </button>

                  {/* ぼうぎょ */}
                  <button
                    disabled={!battle.isPlayerTurn}
                    onClick={handleActionGuard}
                    className={`group relative py-1.5 pl-6 pr-2 text-left text-xs transition border border-zinc-950 hover:border-zinc-800 hover:bg-zinc-900 ${
                      battle.isPlayerTurn 
                        ? 'text-white hover:text-yellow-400 cursor-pointer font-bold' 
                        : 'text-zinc-700 cursor-not-allowed'
                    }`}
                  >
                    <span className="absolute left-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-yellow-500">▶</span>
                    <span>ぼうぎょ (回復)</span>
                  </button>

                  {/* にげる */}
                  <button
                    onClick={() => {
                      if (confirm('たたかいを途中で やめて 畑へ もどりますか？')) {
                        setSelectedStage(null);
                      }
                    }}
                    className="group relative py-1.5 pl-6 pr-2 text-left text-xs text-stone-300 hover:text-red-400 hover:border-red-500 hover:bg-zinc-900 border border-zinc-950 transition cursor-pointer font-bold"
                  >
                    <span className="absolute left-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-red-500">▶</span>
                    <span>にげる (退避)</span>
                  </button>
                </div>
              ) : (
                <div className="text-center py-4 animate-pulse text-[10px] text-yellow-400 font-bold">
                  けっかを しょり中...
                </div>
              )}
            </div>
          </>
        )}
      </div>

    </div>
  );
}
