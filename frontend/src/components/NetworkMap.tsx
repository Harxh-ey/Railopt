import React, { useState, useEffect } from 'react';
import {
  MapPin, AlertTriangle, Wrench, Train, Clock, ShieldCheck, X,
  Layers, Zap, Radio, Info
} from 'lucide-react';
import { api } from '../services/api';
import { Station, Section } from '../types';

interface NetworkMapProps {
  onInspectBlock: (blockId: string) => void;
}

export const NetworkMap: React.FC<NetworkMapProps> = ({ onInspectBlock }) => {
  const [stations, setStations] = useState<Station[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    api.getNetworkTopology()
      .then((res) => {
        setStations(res.stations);
        setSections(res.sections);
        // Default select SEC01
        const sec01 = res.sections.find((s) => s.section_id === 'SEC01');
        if (sec01) setSelectedSection(sec01);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load network topology', err);
        setLoading(false);
      });
  }, []);

  // Map station ID to station object
  const stationMap: Record<string, Station> = {};
  stations.forEach((s) => {
    stationMap[s.station_id] = s;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Train className="w-5 h-5 text-teal-400" />
            <span>Northern Railway Division — Network Topology & Section Status</span>
          </h2>
          <p className="text-xs text-slate-400">
            Interactive schematic view: 12 Stations • 20 Sections • Live maintenance blocks & high-risk corridors
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-medium">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
            <span className="text-slate-300">Normal</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-teal-500"></span>
            <span className="text-slate-300">Block Planned</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500"></span>
            <span className="text-slate-300">High Risk Asset</span>
          </span>
        </div>
      </div>

      {/* Main Container: SVG Map + Slide-out Section Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SVG Network Map (2 cols on large) */}
        <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-xl p-4 relative overflow-hidden shadow-2xl flex flex-col items-center justify-center min-h-[520px]">
          {loading ? (
            <div className="text-slate-400 text-sm">Loading railway network graph...</div>
          ) : (
            <svg
              viewBox="80 80 840 450"
              className="w-full h-auto max-h-[500px] select-none"
            >
              {/* Background subtle grid */}
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect x="80" y="80" width="840" height="450" fill="url(#grid)" opacity="0.4" />

              {/* Sections (Lines) */}
              {sections.map((sec) => {
                const s1 = stationMap[sec.source_station];
                const s2 = stationMap[sec.destination_station];
                if (!s1 || !s2) return null;

                const isSelected = selectedSection?.section_id === sec.section_id;
                const isSEC01 = sec.section_id === 'SEC01';

                let strokeColor = '#10b981'; // Emerald normal
                if (sec.status === 'HIGH_RISK') strokeColor = '#f43f5e'; // Rose
                else if (sec.status === 'MAINTENANCE_PLANNED') strokeColor = '#06b6d4'; // Cyan

                const midX = (s1.x_coord + s2.x_coord) / 2;
                const midY = (s1.y_coord + s2.y_coord) / 2;

                return (
                  <g
                    key={sec.section_id}
                    onClick={() => setSelectedSection(sec)}
                    className="cursor-pointer group"
                  >
                    {/* Glow outline when selected */}
                    {isSelected && (
                      <line
                        x1={s1.x_coord}
                        y1={s1.y_coord}
                        x2={s2.x_coord}
                        y2={s2.y_coord}
                        stroke="#2dd4bf"
                        strokeWidth="10"
                        strokeOpacity="0.4"
                        strokeLinecap="round"
                      />
                    )}

                    {/* Section Track Line */}
                    <line
                      x1={s1.x_coord}
                      y1={s1.y_coord}
                      x2={s2.x_coord}
                      y2={s2.y_coord}
                      stroke={strokeColor}
                      strokeWidth={isSelected ? '5' : sec.track_count >= 2 ? '3.5' : '2'}
                      strokeDasharray={sec.electrified ? 'none' : '6 3'}
                      strokeLinecap="round"
                      className="transition-all duration-300 group-hover:stroke-teal-300"
                    />

                    {/* Section Label Badge */}
                    <g transform={`translate(${midX}, ${midY})`}>
                      <rect
                        x="-20"
                        y="-9"
                        width="40"
                        height="18"
                        rx="4"
                        fill={isSelected ? '#0f766e' : '#0f172a'}
                        stroke={isSelected ? '#2dd4bf' : strokeColor}
                        strokeWidth="1.2"
                      />
                      <text
                        x="0"
                        y="3"
                        fill={isSelected ? '#ffffff' : '#94a3b8'}
                        fontSize="9"
                        fontWeight="bold"
                        textAnchor="middle"
                        fontFamily="monospace"
                      >
                        {sec.section_id}
                      </text>
                    </g>
                  </g>
                );
              })}

              {/* Stations (Nodes) */}
              {stations.map((stn) => {
                const isJunction = stn.code === 'EKJ';
                return (
                  <g key={stn.station_id} transform={`translate(${stn.x_coord}, ${stn.y_coord})`}>
                    {/* Pulse ring for major junction */}
                    {isJunction && (
                      <circle r="15" fill="#0ea5e9" fillOpacity="0.2" className="animate-ping" />
                    )}

                    {/* Outer circle */}
                    <circle
                      r={isJunction ? '10' : '7'}
                      fill="#0f172a"
                      stroke={isJunction ? '#38bdf8' : '#e2e8f0'}
                      strokeWidth={isJunction ? '2.5' : '1.5'}
                    />
                    {/* Inner core */}
                    <circle
                      r={isJunction ? '5' : '3.5'}
                      fill={isJunction ? '#38bdf8' : '#ffffff'}
                    />

                    {/* Station Name Label */}
                    <text
                      x="0"
                      y={isJunction ? '-16' : '18'}
                      fill="#f8fafc"
                      fontSize="10"
                      fontWeight="bold"
                      textAnchor="middle"
                      className="drop-shadow-md"
                    >
                      {stn.name}
                    </text>
                    <text
                      x="0"
                      y={isJunction ? '-6' : '27'}
                      fill="#64748b"
                      fontSize="8"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      {stn.code}
                    </text>
                  </g>
                );
              })}
            </svg>
          )}

          <div className="absolute bottom-3 left-3 bg-slate-900/90 border border-slate-800 px-3 py-1 rounded text-[11px] text-slate-400 font-mono">
            Click any section line to inspect asset risk and active blocks
          </div>
        </div>

        {/* Section Inspector Drawer (1 col on large) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between shadow-xl">
          {selectedSection ? (
            <div className="space-y-4">
              {/* Header */}
              <div className="border-b border-slate-800 pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono text-sm font-bold text-teal-300">{selectedSection.section_id}</span>
                    <h3 className="text-base font-bold text-white mt-0.5">
                      {selectedSection.source_station} ↔ {selectedSection.destination_station}
                    </h3>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    selectedSection.status === 'HIGH_RISK'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : selectedSection.status === 'MAINTENANCE_PLANNED'
                      ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}>
                    {selectedSection.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-3 text-center text-xs font-mono">
                  <div className="bg-slate-950 p-2 rounded border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">LENGTH</span>
                    <span className="text-white font-bold">{selectedSection.length_km} km</span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">TRACKS</span>
                    <span className="text-white font-bold">{selectedSection.track_count} Line</span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">TRACTION</span>
                    <span className="text-teal-300 font-bold">{selectedSection.electrified ? '25kV OHE' : 'Diesel'}</span>
                  </div>
                </div>
              </div>

              {/* Summary Counts */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">ASSETS</span>
                  <span className="text-white font-bold font-mono">{selectedSection.assets_count || 0}</span>
                </div>
                <div className="p-2 rounded bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">PENDING JOBS</span>
                  <span className="text-amber-400 font-bold font-mono">{selectedSection.pending_jobs_count || 0}</span>
                </div>
                <div className="p-2 rounded bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">TRAIN DENSITY</span>
                  <span className="text-teal-300 font-bold font-mono">{selectedSection.train_density || 0} /day</span>
                </div>
              </div>

              {/* Active Blocks on this section */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-teal-400" />
                  <span>Scheduled Maintenance Blocks</span>
                </h4>

                {selectedSection.blocks && selectedSection.blocks.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedSection.blocks.map((b) => (
                      <div
                        key={b.block_id}
                        onClick={() => onInspectBlock(b.block_id)}
                        className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 hover:border-teal-500/50 cursor-pointer transition"
                      >
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-mono font-bold text-teal-300">{b.block_id}</span>
                          <span className="text-slate-400 font-mono">{b.date}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs mt-1">
                          <span className="text-slate-300">{b.start_time} — {b.end_time} ({b.duration_minutes}m)</span>
                          <span className="text-[10px] bg-teal-500/20 text-teal-300 px-1.5 py-0.2 rounded">
                            {b.jobs.length} jobs
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 italic p-3 bg-slate-950 rounded border border-slate-800 text-center">
                    No blocks active on this section during current horizon.
                  </div>
                )}
              </div>

              {/* Pending Jobs List */}
              {selectedSection.jobs && selectedSection.jobs.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-blue-400" />
                    <span>Pending Jobs ({selectedSection.jobs.length})</span>
                  </h4>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {selectedSection.jobs.slice(0, 4).map((j) => (
                      <div key={j.job_id} className="text-xs bg-slate-950/80 p-2 rounded border border-slate-800">
                        <div className="flex justify-between font-mono text-[11px]">
                          <span className="text-slate-300 font-bold">{j.job_id}</span>
                          <span className="text-teal-400">Score: {j.priority_score}</span>
                        </div>
                        <p className="text-slate-400 text-[11px] truncate mt-0.5">{j.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-20 text-center text-slate-500 text-xs">
              Select a section on the network map to view operational and maintenance status.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
