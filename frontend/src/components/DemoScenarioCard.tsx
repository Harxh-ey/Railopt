import React from 'react';
import { ArrowRight, CheckCircle2, AlertTriangle, Layers, Clock, Zap, Wrench, Radio } from 'lucide-react';

interface DemoScenarioCardProps {
  onInspectBlock?: (blockId: string) => void;
}

export const DemoScenarioCard: React.FC<DemoScenarioCardProps> = ({ onInspectBlock }) => {
  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950/40 border border-teal-500/30 rounded-xl p-5 shadow-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-teal-500/20 text-teal-300 text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border border-teal-500/40">
              Critical Demonstration Scenario
            </span>
            <span className="text-xs text-slate-400 font-mono">Section: SEC01 (Anandpur — Bharat Nagar)</span>
          </div>
          <h3 className="text-lg font-bold text-white mt-1">
            Multi-Department Maintenance Block Coordination
          </h3>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-400 block">Available COA Window</span>
          <span className="font-mono text-sm text-teal-300 font-bold bg-slate-800/80 px-2.5 py-1 rounded border border-slate-700">
            01:00 — 04:00 (180 mins)
          </span>
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* WITHOUT COORDINATION (Baseline) */}
        <div className="bg-slate-950/80 rounded-lg p-4 border border-rose-900/40">
          <div className="flex items-center justify-between mb-3">
            <span className="text-rose-400 font-bold text-xs flex items-center gap-1.5 uppercase tracking-wide">
              <AlertTriangle className="w-3.5 h-3.5" />
              Without Coordination (Legacy Silos)
            </span>
            <span className="text-[11px] font-mono text-rose-300 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/50">
              3 Separate Blocks • 270m Downtime
            </span>
          </div>

          <div className="space-y-2.5">
            <div className="bg-slate-900/90 p-2.5 rounded border border-slate-800">
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-slate-300 flex items-center gap-1">
                  <Wrench className="w-3.5 h-3.5 text-blue-400" />
                  Engineering: Track Geometry Correction
                </span>
                <span className="text-slate-400 font-mono">120 mins</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                <div className="bg-blue-500 h-full w-[66%]"></div>
              </div>
              <span className="text-[11px] text-slate-500 block mt-1">Requires separate traffic block on Day 1</span>
            </div>

            <div className="bg-slate-900/90 p-2.5 rounded border border-slate-800">
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-slate-300 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Traction: OHE Wire Inspection & Tensioning
                </span>
                <span className="text-slate-400 font-mono">90 mins</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                <div className="bg-amber-500 h-full w-[50%]"></div>
              </div>
              <span className="text-[11px] text-slate-500 block mt-1">Requires separate power block on Day 2</span>
            </div>

            <div className="bg-slate-900/90 p-2.5 rounded border border-slate-800">
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-slate-300 flex items-center gap-1">
                  <Radio className="w-3.5 h-3.5 text-emerald-400" />
                  S&T: Signal Cable Insulation & Relays
                </span>
                <span className="text-slate-400 font-mono">60 mins</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                <div className="bg-emerald-500 h-full w-[33%]"></div>
              </div>
              <span className="text-[11px] text-slate-500 block mt-1">Requires separate line occupation on Day 3</span>
            </div>
          </div>

          <p className="text-xs text-rose-300/80 mt-3 pt-2 border-t border-rose-900/30 italic">
            Consequence: 3 train traffic stoppages, 270 total minutes of corridor downtime, high control-room disruption.
          </p>
        </div>

        {/* WITH RAILOPT (Coordinated) */}
        <div className="bg-slate-950/80 rounded-lg p-4 border border-teal-500/40 relative">
          <div className="flex items-center justify-between mb-3">
            <span className="text-teal-300 font-bold text-xs flex items-center gap-1.5 uppercase tracking-wide">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
              With RailOpt (Constraint-Aware Coordinated)
            </span>
            <span className="text-[11px] font-mono text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
              1 Unified Block (BLK_01) • 180m Window
            </span>
          </div>

          {/* Concurrent Timeline Visualization */}
          <div className="bg-slate-900/90 rounded-lg p-3 border border-slate-800">
            <div className="flex justify-between text-[11px] text-slate-400 font-mono mb-2 border-b border-slate-800 pb-1">
              <span>01:00 (Start)</span>
              <span>02:00</span>
              <span>03:00</span>
              <span>04:00 (End)</span>
            </div>

            <div className="space-y-2.5">
              {/* Engineering */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-blue-300 font-medium flex items-center gap-1">
                    <Wrench className="w-3 h-3" /> Engineering: Track Tamping
                  </span>
                  <span className="text-slate-400 text-[11px] font-mono">01:00 - 03:00 (120m)</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-3.5 overflow-hidden p-0.5">
                  <div className="bg-gradient-to-r from-blue-600 to-blue-400 h-full w-[66.6%] rounded-full shadow"></div>
                </div>
              </div>

              {/* Traction */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-amber-300 font-medium flex items-center gap-1">
                    <Zap className="w-3 h-3" /> Traction: OHE Wire Inspection
                  </span>
                  <span className="text-slate-400 text-[11px] font-mono">01:00 - 02:30 (90m)</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-3.5 overflow-hidden p-0.5">
                  <div className="bg-gradient-to-r from-amber-600 to-amber-400 h-full w-[50%] rounded-full shadow"></div>
                </div>
              </div>

              {/* S&T */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-emerald-300 font-medium flex items-center gap-1">
                    <Radio className="w-3 h-3" /> S&T: Signal Cable Testing
                  </span>
                  <span className="text-slate-400 text-[11px] font-mono">01:00 - 02:00 (60m)</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-3.5 overflow-hidden p-0.5">
                  <div className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-full w-[33.3%] rounded-full shadow"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between pt-2 border-t border-teal-500/20">
            <div className="text-xs text-teal-200">
              <strong>Savings:</strong> 90 minutes track downtime saved • 2 train disruptions prevented
            </div>
            {onInspectBlock && (
              <button
                onClick={() => onInspectBlock('BLK_01')}
                className="text-xs text-teal-400 hover:text-teal-300 font-semibold underline flex items-center gap-1"
              >
                Why this block? <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
