import React, { useState, useEffect } from 'react';
import { CarrotType, GardenPlot, PlayerStats, SEED_TEMPLATES, CARROT_TEMPLATES } from '../types';
import { Droplet, HelpCircle, ShoppingCart, Shovel, Sunrise, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FarmTabProps {
  stats: PlayerStats;
  plots: GardenPlot[];
  onPlant: (plotId: number, seedType: CarrotType) => void;
  onWater: (plotId: number) => void;
  onHarvest: (plotId: number) => void;
  onBuySeed: (seedType: CarrotType, cost: number, amount: number) => void;
}

export default function FarmTab({ stats, plots, onPlant, onWater, onHarvest, onBuySeed }: FarmTabProps) {
  const [selectedSeed, setSelectedSeed] = useState<CarrotType>('normal');
  const [plotProgresses, setPlotProgresses] = useState<Record<number, number>>({});
  const [harvestTips, setHarvestTips] = useState<{ id: number; text: string; x: number; y: number }[]>([]);

  // Update loop for growth percentage
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      const newProgresses: Record<number, number> = {};

      plots.forEach((plot) => {
        if (plot.seedId && plot.plantedAt) {
          const elapsed = now - plot.plantedAt;
          // Water bonus: if watered, speed is 2x faster (we treat watered duration as 2x factor)
          // To keep it simple, we check remaining time or multiply elapsed.
          // Let's assume watered cuts remaining time or doubles speed.
          const speedMultiplier = plot.isWatered ? 2 : 1;
          const nominalElapsed = elapsed * speedMultiplier;
          
          const progress = Math.min(100, (nominalElapsed / plot.duration) * 100);
          newProgresses[plot.id] = progress;
        } else {
          newProgresses[plot.id] = 0;
        }
      });

      setPlotProgresses(newProgresses);
    }, 200);

    return () => clearInterval(timer);
  }, [plots]);

  const handleHarvestClick = (plot: GardenPlot, e: React.MouseEvent) => {
    const progress = plotProgresses[plot.id] || 0;
    if (progress >= 100 && plot.seedId) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const newTip = {
        id: Date.now() + Math.random(),
        text: `+1 ${CARROT_TEMPLATES[plot.seedId].jpName}!`,
        x,
        y,
      };
      
      setHarvestTips((prev) => [...prev, newTip]);
      onHarvest(plot.id);

      // Clean tip after 1.5s
      setTimeout(() => {
        setHarvestTips((prev) => prev.filter((t) => t.id !== newTip.id));
      }, 1500);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-mono tracking-widest text-white text-xs md:text-sm">
      {/* 左カラム：タネのよろずや / たねの購入 (5 cols) */}
      <div className="lg:col-span-5 flex flex-col gap-6">
        {/* たねのよろずや */}
        <div className="border-4 border-double border-white p-4 bg-black flex flex-col h-full justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 border-b border-zinc-800 pb-3">
              <span className="text-yellow-400 font-bold text-xs md:text-sm">▶ タネのよろずや</span>
            </div>
            
            <p className="text-xs md:text-sm text-zinc-400 mb-4 leading-relaxed font-bold">
              はたけに まくための にんじんの たねを かうことが できます。
              にんじんにより、せいちょうスピードや せんとうでの こうかが ことなります。
            </p>

            <div className="flex flex-col gap-3">
              {(Object.keys(SEED_TEMPLATES) as CarrotType[]).map((type) => {
                const seed = SEED_TEMPLATES[type];
                const carrot = CARROT_TEMPLATES[type];
                const isAffordable = stats.gold >= seed.cost;
                const isSelected = selectedSeed === type;

                // 最大何個買えるか
                const maxAffordable = Math.floor(stats.gold / seed.cost);

                return (
                  <div 
                    key={type}
                    className={`flex flex-col p-3 border-2 transition ${
                      isSelected 
                        ? 'bg-zinc-900 border-yellow-400' 
                        : 'bg-zinc-950 border-zinc-800 hover:border-zinc-500'
                    }`}
                  >
                    {/* 上部：基本情報と通常購入 */}
                    <div className="flex items-center justify-between w-full">
                      <button 
                        onClick={() => setSelectedSeed(type)}
                        className="flex items-center gap-3 text-left flex-1 cursor-pointer min-w-0"
                      >
                        <div className="w-10 h-10 border border-zinc-700 bg-black flex items-center justify-center text-xl shrink-0">
                          {carrot.icon}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-xs sm:text-sm text-white flex items-center gap-1.5 leading-none">
                            {isSelected && <span className="text-yellow-400 text-xs">▶</span>}
                            {seed.jpName}
                            <span className="text-[10px] bg-zinc-900 border border-zinc-700 text-yellow-400 px-1.5 py-0.5 font-bold">
                              {seed.growthTime}s
                            </span>
                          </div>
                          <p className="text-xs text-zinc-500 mt-1.5 line-clamp-1">{seed.description}</p>
                        </div>
                      </button>

                      <div className="flex flex-col items-end gap-1 pl-2 shrink-0">
                        <span className="font-bold text-yellow-400 text-xs sm:text-sm">
                          {seed.cost} <span className="text-[10px] text-zinc-500 font-normal">G</span>
                        </span>
                        {!isSelected && (
                          <button
                            onClick={() => {
                              setSelectedSeed(type);
                              onBuySeed(type, seed.cost, 1);
                            }}
                            disabled={!isAffordable}
                            className={`text-[10px] sm:text-xs font-bold px-3 py-1 border transition cursor-pointer active:translate-y-0.5 ${
                              isAffordable 
                                ? 'bg-black border-white hover:bg-zinc-900 hover:text-yellow-400 text-white' 
                                : 'bg-zinc-950 text-zinc-600 border-zinc-900 cursor-not-allowed'
                            }`}
                          >
                            かう
                          </button>
                        )}
                      </div>
                    </div>

                    {/* 下部：選択中のときだけ表示される数量選択パネル */}
                    {isSelected && (
                      <div className="mt-3 pt-2.5 border-t border-dashed border-zinc-800 flex flex-col gap-1.5 animate-fadeIn">
                        <div className="text-[10px] sm:text-xs text-zinc-400 flex justify-between items-center font-bold">
                          <span>📦 まとめて かう:</span>
                          <span className="text-yellow-500">最大 {maxAffordable}こ 買えます</span>
                        </div>
                        <div className="grid grid-cols-4 gap-1.5">
                          {[1, 5, 10].map((qty) => {
                            const totalCost = seed.cost * qty;
                            const canAfford = stats.gold >= totalCost;
                            return (
                              <button
                                key={qty}
                                onClick={() => onBuySeed(type, seed.cost, qty)}
                                disabled={!canAfford}
                                className={`text-[10px] sm:text-xs font-bold py-1 border text-center transition cursor-pointer active:translate-y-0.5 ${
                                  canAfford 
                                    ? 'bg-black border-white hover:bg-zinc-800 hover:text-yellow-400 text-white' 
                                    : 'bg-zinc-950 text-zinc-700 border-zinc-900 cursor-not-allowed opacity-30'
                                }`}
                              >
                                {qty}こ
                              </button>
                            );
                          })}
                          <button
                            onClick={() => {
                              if (maxAffordable > 0) {
                                onBuySeed(type, seed.cost, maxAffordable);
                              }
                            }}
                            disabled={maxAffordable <= 0}
                            className={`text-[10px] sm:text-xs font-bold py-1 border text-center transition cursor-pointer active:translate-y-0.5 ${
                              maxAffordable > 0 
                                ? 'bg-black border-yellow-400 hover:bg-zinc-800 text-yellow-400' 
                                : 'bg-zinc-950 text-zinc-700 border-zinc-900 cursor-not-allowed opacity-30'
                            }`}
                          >
                            最大
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-dashed border-zinc-800">
            <div className="bg-zinc-950 p-2.5 border border-zinc-800 flex items-center gap-2">
              <span className="text-xl">🎒</span>
              <div>
                <div className="text-[11px] sm:text-xs text-zinc-400">しょじしている タネ :</div>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {(Object.keys(SEED_TEMPLATES) as CarrotType[]).map((type) => (
                    <span 
                      key={type} 
                      className="text-xs bg-black px-2 py-0.5 border border-zinc-700 font-bold text-white shadow-sm"
                    >
                      {CARROT_TEMPLATES[type].icon} {stats.seeds[type] || 0}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 右カラム：インラクティブはたけ (7 cols) */}
      <div className="lg:col-span-7 flex flex-col gap-6">
        <div className="border-4 border-double border-white p-4 bg-black flex-1">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 mb-4 border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-yellow-400 font-bold text-xs md:text-sm">▶ にんじんはたけ</span>
            </div>
            
            <div className="text-[10px] sm:text-xs text-cyan-400 font-bold border border-cyan-900 bg-cyan-950/40 px-2.5 py-1.5 flex items-center gap-1">
              💦 みずやりで せいちょうそくど 2ばい！
            </div>
          </div>

          {/* まくタネ選択エリア（はたけ内ショートカット） */}
          <div className="mb-4 border-2 border-dashed border-zinc-700 p-3 bg-zinc-950">
            <div className="text-xs font-bold text-yellow-400 mb-2 flex items-center gap-1.5">
              <span>🌱 植える タネを えらぶ:</span>
              <span className="text-[10px] text-zinc-500 font-normal">(クリックでまくタネを切り替え)</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {(Object.keys(SEED_TEMPLATES) as CarrotType[]).map((type) => {
                const isSelected = selectedSeed === type;
                const count = stats.seeds[type] || 0;
                const carrot = CARROT_TEMPLATES[type];
                return (
                  <button
                    key={type}
                    onClick={() => setSelectedSeed(type)}
                    className={`flex items-center justify-between p-2 border-2 text-[11px] font-bold transition cursor-pointer ${
                      isSelected
                        ? 'border-yellow-400 bg-zinc-900 text-white'
                        : 'border-zinc-800 bg-black text-zinc-400 hover:border-zinc-650'
                    }`}
                  >
                    <span className="flex items-center gap-1">
                      <span>{carrot.icon}</span>
                      <span className="truncate">{carrot.jpName.split('にんじん')[5] ? carrot.jpName : carrot.jpName.split('にんじん')[0]}</span>
                    </span>
                    <span className={`text-[10px] font-mono ml-1 ${count > 0 ? 'text-yellow-400' : 'text-zinc-600'}`}>
                      ({count})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <p className="text-xs md:text-sm text-zinc-400 mb-5 leading-relaxed font-bold">
            たねを 選択して はたけにまいてください。じゅうぶんに せいちょうすると 
            しゅうかく（戦闘時のどうぐ袋に追加）できます。
          </p>

          {/* はたけグリッド */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {plots.map((plot) => {
              const progress = plotProgresses[plot.id] || 0;
              const isGrown = progress >= 100;
              const carrot = plot.seedId ? CARROT_TEMPLATES[plot.seedId] : null;

              return (
                <div 
                  key={plot.id}
                  className={`relative p-3 border-2 text-center transition flex flex-col items-center justify-between min-h-[175px] select-none ${
                    plot.seedId 
                      ? isGrown 
                        ? 'border-yellow-400 bg-zinc-950/80 cursor-pointer'
                        : 'border-white bg-zinc-950'
                      : 'border-dashed border-zinc-800 hover:border-zinc-650 bg-black'
                  }`}
                  onClick={(e) => {
                    if (plot.seedId && isGrown) {
                      handleHarvestClick(plot, e);
                    }
                  }}
                >
                  {/* Floating Tips */}
                  <AnimatePresence>
                    {harvestTips.map((tip) => (
                      <motion.div
                        key={tip.id}
                        initial={{ opacity: 1, y: tip.y, x: tip.x }}
                        animate={{ opacity: 0, y: tip.y - 40 }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className="absolute text-yellow-400 font-bold text-xs z-30 pointer-events-none tracking-widest"
                      >
                        {tip.text}
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {/* 区画面積・なまえ表示 */}
                  <div className="w-full flex items-center justify-between text-[10px] md:text-xs text-zinc-500 font-bold">
                    <span>くかく #{plot.id + 1}</span>
                    {plot.seedId && (
                      <span className="text-yellow-400 border border-zinc-800 px-1 font-bold">
                        {carrot?.jpName.split('にんじん')[0]}
                      </span>
                    )}
                  </div>

                  {/* はたけビジュアル */}
                  <div className="my-3 relative flex items-center justify-center">
                    {!plot.seedId ? (
                      <div className="flex flex-col items-center">
                        <span className="text-2xl animate-pulse block">🕳️</span>
                        <span className="text-[10px] text-zinc-600 font-bold mt-1">あきち</span>
                      </div>
                    ) : (
                      <div className="relative">
                        {progress < 35 ? (
                          <div className="flex flex-col items-center">
                            <span className="text-2xl block text-green-500">🌱</span>
                            <span className="text-[10px] text-green-500 mt-1">めがでた</span>
                          </div>
                        ) : progress < 75 ? (
                          <div className="flex flex-col items-center">
                            <span className="text-2xl block text-green-400">🌿</span>
                            <span className="text-[10px] text-zinc-500 mt-1">せいちょう中</span>
                          </div>
                        ) : isGrown ? (
                          <div className="relative flex flex-col items-center animate-bounce">
                            <span className="text-3xl block drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]">{carrot?.icon}</span>
                            <span className="text-[10px] font-bold text-yellow-400 mt-1.5 border border-yellow-400 bg-black px-1">
                              しゅうかく可能!
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <span className="text-2xl block">🥕</span>
                            <span className="text-[10px] text-zinc-400 mt-1 font-bold">もうすぐ実る</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* コマンド/ツールエリア */}
                  <div className="w-full">
                    {plot.seedId ? (
                      <div>
                        {/* せいちょうプログレスバー */}
                        <div className="w-full bg-zinc-950 h-2 border border-zinc-800 overflow-hidden mb-2 p-0.5">
                          <div 
                            className={`h-full ${isGrown ? 'bg-yellow-400' : 'bg-green-500'}`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        
                        {/* コマンドボタン */}
                        <div className="flex gap-2">
                          {!isGrown && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onWater(plot.id);
                              }}
                              disabled={plot.isWatered}
                              className={`flex-1 text-[10px] md:text-xs py-1 border transition font-bold cursor-pointer ${
                                plot.isWatered 
                                  ? 'bg-zinc-950 text-cyan-500 border-zinc-800 cursor-default' 
                                  : 'bg-black hover:bg-zinc-900 text-cyan-400 border-cyan-400'
                              }`}
                            >
                              {plot.isWatered ? 'みずやりみず' : 'みずやり'}
                            </button>
                          )}
                          
                          {isGrown && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleHarvestClick(plot, e);
                              }}
                              className="flex-1 text-xs py-1 bg-black border border-yellow-400 text-yellow-400 font-bold shadow-sm flex items-center justify-center gap-1 cursor-pointer hover:bg-zinc-900"
                            >
                              🌾 しゅうかく
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* 種をまく */
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => {
                            if (stats.seeds[selectedSeed] > 0) {
                              onPlant(plot.id, selectedSeed);
                            }
                          }}
                          disabled={(stats.seeds[selectedSeed] || 0) <= 0}
                          className={`w-full py-1 text-xs font-bold border transition cursor-pointer ${
                            (stats.seeds[selectedSeed] || 0) > 0
                              ? 'bg-black text-white hover:bg-zinc-900 border-white hover:border-yellow-400'
                              : 'bg-zinc-950 text-zinc-600 border-zinc-900 cursor-not-allowed'
                          }`}
                        >
                          {(stats.seeds[selectedSeed] || 0) > 0 
                            ? `${CARROT_TEMPLATES[selectedSeed].icon} まく` 
                            : 'たねが ない'}
                        </button>
                        <p className="text-[10px] text-zinc-500 text-center font-bold">
                          せんたく: {SEED_TEMPLATES[selectedSeed].jpName.split('にんじん')[0]}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
