import React from 'react';
import { PlayerStats, CARROT_TEMPLATES, CarrotType } from '../types';
import { Shield, Sparkles, Coins, HelpCircle } from 'lucide-react';

interface GameHeaderProps {
  stats: PlayerStats;
  onShowTutorial: () => void;
  onEatCarrot?: (type: CarrotType) => void;
  isBattleActive?: boolean;
}

export default function GameHeader({ stats, onShowTutorial, onEatCarrot, isBattleActive = false }: GameHeaderProps) {
  const totalCarrotsCollected = Object.values(stats.inventory).reduce((acc, curr) => acc + curr, 0);

  return (
    <header className="w-full bg-black text-white border-4 border-double border-white p-4 md:p-5 mb-6 relative overflow-hidden font-mono tracking-widest">
      
      {/* うさぎ勇者と全体ステータスの一覧 (DQ風ステータス・ウインドウ) */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 z-10 relative">
        
        {/* 左側：ゆうしゃステータス */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-zinc-900 border-2 border-white flex items-center justify-center text-3xl font-bold font-mono relative shrink-0">
            🐰
            <div className="absolute -bottom-2 -right-2 bg-black text-yellow-400 font-bold text-[9px] border border-white px-1.5 py-0.5">
              LV:{stats.level}
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-white tracking-widest">🎯 うさぎ</h1>
              <span className="text-[9px] border border-green-400 text-green-400 px-1.5 py-0.5 font-bold">
                キャロットマスター
              </span>
            </div>
            
            {/* けいけんちメーター */}
            <div className="mt-2.5 text-zinc-400 text-[10px] flex justify-between font-bold">
              <span className="text-yellow-400">▶ EXP / けいけんち</span>
              <span className="font-mono text-white">{stats.exp} / {stats.maxExp}</span>
            </div>
            <div className="w-full h-2.5 bg-zinc-950 border border-white mt-1 overflow-hidden p-0.5">
              <div 
                className="h-full bg-green-500 transition-all duration-500" 
                style={{ width: `${Math.min(100, (stats.exp / stats.maxExp) * 100)}%` }} 
              />
            </div>
          </div>
        </div>

        {/* 中央：ステータス詳細数値 (FC風にシンプルな白線セパレータで囲む) */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 flex-1 max-w-lg md:max-w-none">
          {/* 体力 (HP) */}
          <div className="border border-zinc-700 bg-zinc-950 p-2 text-xs">
            <div className="text-[9px] text-zinc-500 font-bold tracking-widest">H P</div>
            <div className="text-sm font-bold text-red-500 font-mono mt-0.5 flex justify-between">
              <span>{stats.hp}</span>
              <span className="text-zinc-500 text-[10px]">/ {stats.maxHp}</span>
            </div>
            <div className="w-full bg-zinc-900 h-1.5 border border-zinc-800 mt-1 overflow-hidden">
              <div 
                className={`h-full ${stats.hp <= stats.maxHp * 0.25 ? 'bg-red-600 animate-pulse' : 'bg-red-500'}`}
                style={{ width: `${Math.max(0, Math.min(100, (stats.hp / stats.maxHp) * 100))}%` }}
              />
            </div>
          </div>

          {/* ゴールド (G) */}
          <div className="border border-zinc-700 bg-zinc-950 p-2 text-xs">
            <div className="text-[9px] text-zinc-500 font-bold tracking-widest">G O L D</div>
            <div className="text-sm font-bold text-yellow-400 font-mono mt-0.5 flex justify-between items-baseline">
              <span>{stats.gold.toLocaleString()}</span>
              <span className="text-zinc-500 text-[9px]">G</span>
            </div>
          </div>

          {/* とうたつ度 (STAGE) */}
          <div className="col-span-2 lg:col-span-1 border border-zinc-700 bg-zinc-950 p-2 text-xs">
            <div className="text-[9px] text-zinc-500 font-bold tracking-widest">S T A G E</div>
            <div className="text-sm font-bold text-green-400 mt-0.5">
              ステージ {stats.highStage === 0 ? 1 : stats.highStage}
            </div>
          </div>
        </div>

        {/* 右側：どうぐ説明 & アクション */}
        <div className="flex md:flex-col items-stretch justify-between gap-2 shrink-0">
          <button 
            onClick={onShowTutorial}
            id="tutorial-btn"
            className="px-3 py-1.5 bg-black hover:bg-zinc-900 text-yellow-400 hover:text-white text-xs font-bold border border-white hover:border-yellow-400 transition duration-150 cursor-pointer active:translate-y-0.5"
          >
            ▶ あそびかた
          </button>
          
          <div className="text-[9px] text-zinc-500 border border-dashed border-zinc-800 p-1.5 text-center leading-normal">
            にんじんそうすう: <span className="text-white font-bold font-mono text-xs">{totalCarrotsCollected}</span> 本
          </div>
        </div>
      </div>

      {/* 下部：どうぐ袋 (にんじんインベントリをDQ風に表示) */}
      <div className="mt-4 pt-3 border-t border-dashed border-zinc-800 flex flex-wrap items-center gap-2 justify-center md:justify-start">
        <span className="text-[9px] text-zinc-500 font-bold tracking-widest mr-1">💼 どうぐぶくろ :</span>
        {(Object.keys(CARROT_TEMPLATES) as CarrotType[]).map((type) => {
          const carrot = CARROT_TEMPLATES[type];
          const count = stats.inventory[type] || 0;
          return (
            <div 
              key={type} 
              className={`flex items-center gap-1.5 px-2 py-1 bg-zinc-950 border transition ${
                count > 0 ? 'border-yellow-400 text-white' : 'border-zinc-900 opacity-30 text-stone-600'
              }`}
              title={`${carrot.jpName}: ${count}本 (食べるとHP+${carrot.eatHeal}回復)`}
            >
              <span className="text-sm shrink-0">{carrot.icon}</span>
              <span className="text-[10px] font-bold">{carrot.jpName.split('にんじん')[0]}</span>
              <span className="text-[9px] font-mono font-bold text-yellow-400 bg-black border border-zinc-800 px-1">
                {count}
              </span>
              {count > 0 && onEatCarrot && (
                <button
                  disabled={isBattleActive}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEatCarrot(type);
                  }}
                  className={`ml-1.5 text-[9px] px-1 font-extrabold transition shrink-0 ${
                    isBattleActive 
                      ? 'bg-zinc-850 text-zinc-600 cursor-not-allowed border border-zinc-800'
                      : 'bg-yellow-500 text-black hover:bg-white cursor-pointer border border-yellow-600 active:translate-y-0.5'
                  }`}
                  title={isBattleActive ? '戦闘中はバトル中のコマンドで使用できます' : `食べる：HP+${carrot.eatHeal}`}
                >
                  {isBattleActive ? '戦闘中' : 'たべる'}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </header>
  );
}
