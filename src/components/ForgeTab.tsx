import React from 'react';
import { PlayerStats, WEAPON_UPGRADES, ARMOR_UPGRADES, EqItem, CARROT_TEMPLATES } from '../types';
import { Sword, Shield, Flame, Gem, Heart, UserPlus, ChevronsUp, RefreshCw } from 'lucide-react';

interface ForgeTabProps {
  stats: PlayerStats;
  onUpgradeStat: (statType: 'hp' | 'atk' | 'def', costCarrots: number, costGold: number) => void;
  onCraftEquipment: (item: EqItem) => void;
  onSellCarrots: (type: 'normal' | 'spicy' | 'frost' | 'golden' | 'rabbit') => void;
}

export default function ForgeTab({ stats, onUpgradeStat, onCraftEquipment, onSellCarrots }: ForgeTabProps) {
  // 現在装備している武器と防具のインデックスを取得
  const currentWeaponIdx = WEAPON_UPGRADES.findIndex(w => w.id === stats.weaponId);
  const currentArmorIdx = ARMOR_UPGRADES.findIndex(a => a.id === stats.armorId);

  const currentWeapon = WEAPON_UPGRADES[currentWeaponIdx] || WEAPON_UPGRADES[0];
  const currentArmor = ARMOR_UPGRADES[currentArmorIdx] || ARMOR_UPGRADES[0];

  const nextWeapon = currentWeaponIdx < WEAPON_UPGRADES.length - 1 ? WEAPON_UPGRADES[currentWeaponIdx + 1] : null;
  const nextArmor = currentArmorIdx < ARMOR_UPGRADES.length - 1 ? ARMOR_UPGRADES[currentArmorIdx + 1] : null;

  // 特訓（HP限界突破）コストの計算（勇者のレベルに応じて上昇）
  const trainingCostCarrots = Math.floor(5 + stats.level * 3);
  const trainingCostGold = Math.floor(10 + stats.level * 8);

  const canAffordTraining = stats.inventory.normal >= trainingCostCarrots && stats.gold >= trainingCostGold;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-black text-white font-mono select-none uppercase tracking-widest text-xs md:text-sm">
      
      {/* 勇者の特訓・能力磨き (5 cols) */}
      <div className="lg:col-span-5 flex flex-col gap-6">
        <div className="border-4 border-double border-white p-5 bg-black">
          <div className="flex items-center gap-2 mb-4 border-b-2 border-white pb-3">
            <span className="text-xl text-yellow-500">🏋️</span>
            <h2 className="text-sm font-bold text-white">▶ ぼうけんしゃの とっくん</h2>
          </div>

          <p className="text-xs text-zinc-400 mb-5 font-bold leading-relaxed border border-dashed border-zinc-800 p-2.5 bg-zinc-950">
            収穫した「つうじょう の にんじん」を むしゃむしゃ食べて 厳しい特訓を つむことで、最大HPを 永久に 増強できます。
          </p>

          {/* ステータス概要窓 */}
          <div className="border-2 border-white p-3.5 bg-zinc-950 mb-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-850 pb-2">
              <span className="text-xs text-zinc-500 font-extrabold">STATUS OVERVIEW</span>
              <span className="text-sm font-bold text-yellow-400">
                レベル {stats.level}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {/* HP */}
              <div className="border border-white p-2 flex flex-col items-center bg-black">
                <span className="text-[10px] md:text-xs text-red-400 font-bold">さいだいHP</span>
                <span className="text-sm md:text-base font-extrabold text-white mt-1">{stats.maxHp}</span>
              </div>
              {/* ATK */}
              <div className="border border-white p-2 flex flex-col items-center bg-black text-center">
                <span className="text-[10px] md:text-xs text-yellow-500 font-bold">ちから</span>
                <span className="text-xs md:text-sm font-extrabold text-white mt-1 leading-tight">
                  {15 + stats.level * 3 + currentWeapon.statBonus}
                  <span className="text-[10px] text-zinc-500 block font-normal mt-0.5 whitespace-nowrap">
                    (+{currentWeapon.statBonus})
                  </span>
                </span>
              </div>
              {/* DEF */}
              <div className="border border-white p-2 flex flex-col items-center bg-black text-center">
                <span className="text-[10px] md:text-xs text-green-400 font-bold">みのまもり</span>
                <span className="text-xs md:text-sm font-extrabold text-white mt-1 leading-tight">
                  {currentArmor.statBonus}
                  <span className="text-[10px] text-zinc-500 block font-normal mt-0.5 whitespace-nowrap">
                    (+{currentArmor.statBonus})
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* 特訓の実行コマンド */}
          <div className="p-4 border-2 border-dashed border-zinc-700 bg-black">
            <h3 className="text-xs md:text-sm font-bold text-yellow-400 mb-2.5 flex items-center gap-1.5">
              <span>💪 HPの げんかいてっぱつ とっくん</span>
            </h3>
            <p className="text-xs text-zinc-400 mb-4 leading-normal">
              普通にんじんとゴールドを消費し、最大HPを <span className="font-extrabold text-red-500 font-mono">+12</span> 引き上げます。
            </p>

            <div className="flex items-center justify-between gap-4 mb-4 bg-zinc-950 p-3 border border-white">
              <div className="text-xs">
                <div className="text-zinc-500 font-bold">ようきゅう コスト</div>
                <div className="flex flex-col gap-1.5 mt-1.5 font-mono font-bold">
                  <span className={stats.inventory.normal >= trainingCostCarrots ? 'text-orange-400' : 'text-red-500/80 p-0.5'}>
                    🥕 普通にんじん × {trainingCostCarrots} (所持:{stats.inventory.normal}本)
                  </span>
                  <span className={stats.gold >= trainingCostGold ? 'text-yellow-400' : 'text-red-500/80 p-0.5'}>
                    💰 必要ゴールド {trainingCostGold} G (所持:{stats.gold} G)
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onUpgradeStat('hp', trainingCostCarrots, trainingCostGold)}
              disabled={!canAffordTraining}
              className={`w-full py-2 bg-black border-2 text-xs md:text-sm font-bold text-center transition cursor-pointer active:translate-y-0.5 ${
                canAffordTraining 
                  ? 'border-white text-white hover:bg-zinc-900/60 hover:text-yellow-400 hover:border-yellow-400' 
                  : 'border-zinc-800 text-zinc-700 cursor-not-allowed'
              }`}
            >
              とっくんを 開始する (HP+12)
            </button>
          </div>
        </div>
      </div>

      {/* 武具の鍛造・にんじんショップ (7 cols) */}
      <div className="lg:col-span-7 flex flex-col gap-6">
        {/* 武具の鍛造セクション */}
        <div className="border-4 border-double border-white p-5 bg-black">
          <div className="flex items-center gap-2 mb-4 border-b-2 border-white pb-3">
            <span className="text-xl text-yellow-500">🔨</span>
            <h2 className="text-sm font-bold text-white">▶ ぶぐ の きたえ（にんじん鍛冶）</h2>
          </div>

          <p className="text-xs text-zinc-400 mb-5 font-bold leading-relaxed border border-dashed border-zinc-800 p-2.5 bg-zinc-950">
            大量のにんじんとゴールドを使用し、さらに強靭なにんじん武具を鍛え上げます。装備すると能力値が自動適用されます。
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 武器の鍛造 */}
            <div className="border-2 border-white p-4 flex flex-col justify-between bg-zinc-950">
              <div>
                <h3 className="text-xs md:text-sm font-bold text-white flex items-center gap-2 mb-3 border-b border-zinc-800 pb-1.5">
                  <span>⚔️ ぶき きたえ</span>
                </h3>

                <div className="border border-white p-2.5 bg-black mb-3 text-xs">
                  <div className="text-zinc-500 font-bold mb-1">現在の ぶき</div>
                  <div className="font-extrabold text-yellow-400">{currentWeapon.jpName}</div>
                  <div className="text-zinc-400 mt-1 pb-1">こうげき ボーナス: +{currentWeapon.statBonus}</div>
                </div>

                {nextWeapon ? (
                  <div className="space-y-3">
                    <div className="border-t border-dashed border-zinc-800 pt-3">
                      <div className="text-[10px] md:text-xs text-zinc-500 font-bold uppercase">つぎの 強化ぶき</div>
                      <div className="font-bold text-xs md:text-sm text-orange-400 mt-1">{nextWeapon.jpName}</div>
                      <p className="text-[11px] md:text-xs text-zinc-400 mt-1 leading-relaxed font-bold">{nextWeapon.description}</p>
                      <div className="text-xs font-bold text-yellow-400 mt-2">
                        こうげき力 : +{nextWeapon.statBonus}
                      </div>
                    </div>

                    <div className="border border-zinc-800 bg-black p-2 text-[10px] md:text-xs space-y-1.5 mt-2">
                      <div className="text-zinc-500 font-bold mb-1">ひつような 素材</div>
                      <div className="flex justify-between font-bold">
                        <span className={stats.inventory.normal >= nextWeapon.costCarrots ? 'text-white' : 'text-red-500'}>
                          🥕 普通にんじん × {nextWeapon.costCarrots} ({stats.inventory.normal}所持)
                        </span>
                      </div>
                      <div className="flex justify-between font-bold">
                        <span className={stats.gold >= nextWeapon.costGold ? 'text-white' : 'text-red-500'}>
                          💰 ゴールド {nextWeapon.costGold}G ({stats.gold}G所持)
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-4 border border-zinc-800 text-yellow-400 font-bold text-xs bg-black">
                     これ以上 きたえることは できない！ (武器MAX)
                  </div>
                )}
              </div>

              {nextWeapon && (
                <button
                  onClick={() => onCraftEquipment(nextWeapon)}
                  disabled={stats.inventory.normal < nextWeapon.costCarrots || stats.gold < nextWeapon.costGold}
                  className={`w-full py-1.5 border-2 text-xs font-bold mt-4 transition cursor-pointer active:translate-y-0.5 ${
                    stats.inventory.normal >= nextWeapon.costCarrots && stats.gold >= nextWeapon.costGold
                      ? 'border-white text-white hover:bg-zinc-900/60 hover:text-yellow-400 hover:border-yellow-400'
                      : 'border-zinc-900 text-zinc-700 cursor-not-allowed bg-zinc-900/30'
                  }`}
                >
                  鍛造 (きたえ) をおこなう
                </button>
              )}
            </div>

            {/* 防具の鍛造 */}
            <div className="border-2 border-white p-4 flex flex-col justify-between bg-zinc-950">
              <div>
                <h3 className="text-xs md:text-sm font-bold text-white flex items-center gap-2 mb-3 border-b border-zinc-800 pb-1.5">
                  <span>🛡️ よろい きたえ</span>
                </h3>

                <div className="border border-white p-2.5 bg-black mb-3 text-xs">
                  <div className="text-zinc-500 font-bold mb-1">現在の よろい</div>
                  <div className="font-extrabold text-yellow-400">{currentArmor.jpName}</div>
                  <div className="text-zinc-400 mt-1 pb-1">しゅび ボーナス: +{currentArmor.statBonus}</div>
                </div>

                {nextArmor ? (
                  <div className="space-y-3">
                    <div className="border-t border-dashed border-zinc-800 pt-3">
                      <div className="text-[10px] md:text-xs text-zinc-500 font-bold uppercase">つぎの 強化よろい</div>
                      <div className="font-bold text-xs md:text-sm text-green-400 mt-1">{nextArmor.jpName}</div>
                      <p className="text-[11px] md:text-xs text-zinc-400 mt-1 leading-relaxed font-bold">{nextArmor.description}</p>
                      <div className="text-xs font-bold text-yellow-400 mt-2">
                        みがまもり : +{nextArmor.statBonus}
                      </div>
                    </div>

                    <div className="border border-zinc-800 bg-black p-2 text-[10px] md:text-xs space-y-1.5 mt-2">
                      <div className="text-zinc-500 font-bold mb-1">ひつような 素材</div>
                      <div className="flex justify-between font-bold">
                        <span className={stats.inventory.normal >= nextArmor.costCarrots ? 'text-white' : 'text-red-500'}>
                          🥕 普通にんじん × {nextArmor.costCarrots} ({stats.inventory.normal}所持)
                        </span>
                      </div>
                      <div className="flex justify-between font-bold">
                        <span className={stats.gold >= nextArmor.costGold ? 'text-white' : 'text-red-500'}>
                          💰 ゴールド {nextArmor.costGold}G ({stats.gold}G所持)
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-4 border border-zinc-800 text-yellow-400 font-bold text-xs bg-black">
                     これ以上 きたえることは できない！ (防具MAX)
                  </div>
                )}
              </div>

              {nextArmor && (
                <button
                  onClick={() => onCraftEquipment(nextArmor)}
                  disabled={stats.inventory.normal < nextArmor.costCarrots || stats.gold < nextArmor.costGold}
                  className={`w-full py-1.5 border-2 text-xs font-bold mt-4 transition cursor-pointer active:translate-y-0.5 ${
                    stats.inventory.normal >= nextArmor.costCarrots && stats.gold >= nextArmor.costGold
                      ? 'border-white text-white hover:bg-zinc-900/60 hover:text-yellow-400 hover:border-yellow-400'
                      : 'border-zinc-900 text-zinc-700 cursor-not-allowed bg-zinc-900/30'
                  }`}
                >
                  鍛造 (きたえ) をおこなう
                </button>
              )}
            </div>
          </div>
        </div>

        {/* にんじんは出荷・売却 section */}
        <div className="border-4 border-double border-white p-5 bg-black">
          <div className="flex items-center gap-2 mb-3 border-b-2 border-white pb-3">
            <span className="text-xl text-yellow-400">💵</span>
            <h2 className="text-sm font-bold text-white">▶ にんじんに よる 商売 (市場出荷)</h2>
          </div>
          <p className="text-xs text-zinc-400 mb-4 font-bold leading-normal">
            のうえんで そだてあげた にんじんを 市場に 買い取ってもらい、ソイルコインゴールド（G）に換金します。ゴールドは武具の特訓・種の仕入れに 使用します。
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {(['normal', 'spicy', 'frost', 'golden', 'rabbit'] as const).map((type) => {
              const item = stats.inventory[type] || 0;
              const details = (CARROT_TEMPLATES as any)[type];

              return (
                <button
                  key={type}
                  onClick={() => onSellCarrots(type)}
                  disabled={item <= 0}
                  className={`p-2.5 border-2 flex flex-col items-center justify-between text-center transition active:translate-y-0.5 ${
                    item > 0 
                      ? 'bg-black border-white text-white hover:border-yellow-400 hover:bg-zinc-900 cursor-pointer' 
                      : 'border-zinc-900 text-zinc-700 cursor-not-allowed bg-zinc-950/20'
                  }`}
                >
                  <span className="text-3xl mb-1.5">{details.icon}</span>
                  <div className="text-[10px] md:text-xs font-bold truncate max-w-full text-white">{details.jpName.split('にんじん')[0]}</div>
                  <div className="text-xs md:text-sm font-mono font-bold text-yellow-400 mt-1">+{details.sellPrice}G</div>
                  <div className="text-[10px] border border-zinc-850 bg-zinc-950 text-zinc-400 font-bold px-1.5 py-0.5 mt-2">
                    {item}本 所持
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
