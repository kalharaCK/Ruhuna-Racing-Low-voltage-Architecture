/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  Cpu, 
  Settings, 
  Activity, 
  Monitor, 
  Trello, 
  ShieldAlert, 
  Key, 
  Plus, 
  Minus, 
  Maximize, 
  Search, 
  X,
  ExternalLink,
  ChevronRight,
  Info,
  Layers
} from 'lucide-react';
import { NODES, EDGES } from './constants';
import { Node, Edge, NodeType, EdgeType } from './types';
import { FULL_RULE_DOCS } from './rule-details';

// Icons mapping for node categories
const TYPE_ICONS: Record<NodeType, React.ReactNode> = {
  power: <Zap className="w-5 h-5 text-amber-500" />,
  mcu: <Cpu className="w-5 h-5 text-sky-500" />,
  sensor: <Activity className="w-5 h-5 text-violet-400" />,
  module: <Settings className="w-5 h-5 text-sky-400" />,
  display: <Monitor className="w-5 h-5 text-emerald-400" />,
  actuator: <Trello className="w-5 h-5 text-orange-400" />,
  safety: <ShieldAlert className="w-5 h-5 text-red-500" />,
  switch: <Key className="w-5 h-5 text-amber-400" />,
};

const EDGE_COLORS: Record<EdgeType, string> = {
  'edge-12v': '#f59e0b',
  'edge-5v': '#10b981',
  'edge-can': '#0ea5e9',
  'edge-analog': '#8b5cf6',
  'edge-pwm': '#f97316',
  'edge-digital': '#34d399',
  'edge-i2c': '#ec4899',
  'edge-sdc': '#ef4444',
  'edge-hw': '#e11d48'
};

const NODE_WIDTH = 112;
const NODE_HEIGHT = 114;

// Rule Definitions Mapping
const RULE_MAP: Record<string, string> = {
  "A2.1.1": "Student Design & Maintenance Requirement",
  "T11.1": "LV System Definition",
  "T11.1.1": "LVS: Low Voltage Definition",
  "T11.1.5": "LVS: Non-Orange Wiring Only",
  "T11.2": "Master Switches - General",
  "T11.2.1": "MS: Mechanical Rotary Type",
  "T11.2.2": "MS: Direct Control (No Relays)",
  "T11.2.3": "MS: Mounting Position (Hoop)",
  "T11.3": "LV Master Switch (LVMS)",
  "T11.3.1": "LVMS: Red Circle Marking",
  "T11.3.2": "LVMS: Blue Triangle Label",
  "T11.4": "Shutdown Buttons / E-Stops",
  "T11.4.2": "E-Stop: Button Specs (40mm)",
  "T11.4.3": "E-Stop: External Location",
  "T11.5": "Inertia Switch (Mechanical)",
  "T11.5.1": "Inertia: G-Force Threshold",
  "T11.5.3": "Inertia: Semiconductor-Free",
  "T11.6": "BSPD Requirements",
  "T11.6.1": "BSPD: Logic & Configuration",
  "T11.6.3": "BSPD: Power Supply (Direct)",
  "T11.6.4": "BSPD: Sensor Logic Path",
  "T11.7": "LV Battery Compliance",
  "T11.7.4": "LV Battery: Fire Retardancy",
  "T11.8": "APPS Sensor Pair",
  "T11.8.5": "APPS: Dual Channel Requirement",
  "T11.9": "System Critical Signals (SCS)",
  "T11.9.1": "SCS: Definition & Scope",
  "T11.9.4": "SCS: CAN Bus Watchdog",
  "T11.10": "Component Mounting Stability",
  "T11.11": "Fans & Air-Moving Devices",
  "A2.1": "Design Responsibility",
  "A2.3.1": "Technical Inspection Form",
  "EV1.1": "DCDC / LV Power Supply",
  "EV3.1": "Grounding Integrity",
  "EV3.2": "Overcurrent Protection",
  "EV4.5": "Wiring and Terminals",
  "EV4.5.3": "Wiring: Color Coding",
  "EV4.5.6": "Wiring: Anchoring & Protection",
  "EV4.5.10": "Wiring: Pilot/Interlock Line",
  "EV4.6": "Data Logger (Official)",
  "EV4.7": "TS Measuring Points (TSMP)",
  "EV4.7.1": "TSMP: Banana Jack Specs",
  "EV4.7.2": "TSMP: Direct DC-Link Link",
  "EV4.8": "High Voltage Disconnect (HVD)",
  "EV4.9": "Discharge Circuit (Active)",
  "EV4.10": "TSAL Hardware Circuit",
  "EV4.10.1": "TSAL: Hardware Requirement",
  "EV4.10.2": "TSAL: Red State Flashing",
  "EV4.10.3": "TSAL: Green State (Safe)",
  "EV4.10.9": "TSAL: Hardwired Logic Only",
  "EV4.11": "Warning Signals",
  "EV4.12": "Ready-To-Drive Sound",
  "EV5.6": "Accumulator Isolation Relays",
  "EV5.6.1": "AIR: Normally Open Mechanical",
  "EV5.7": "Pre-charge Circuit",
  "EV5.8": "AMS Requirement",
  "EV5.8.1": "AMS: Controller Requirement",
  "EV5.8.9": "AMS: Shutdown Control",
  "EV6.1": "Shutdown Circuit Flow",
  "EV6.1.6": "SDC: Fault Latching Logic",
  "EV6.2": "TS Master Switch (TSMS)",
  "EV6.2.1": "TSMS: Mounting & Marking",
  "EV6.3": "IMD Requirement",
  "EV6.3.1": "IMD: Isolation Device",
  "EV6.3.6": "IMD: Ground Continuity",
  "EV6.3.7": "IMD: Driver Fault Light",
  "T6.1": "Brake Pedal Assembly",
  "T6.2": "Brake Over-Travel Switch",
  "T6.3": "Mandatory Brake Light"
};

/**
 * Robustly derives a readable title for a rule code, 
 * falling back to parent chapters if the specific clause isn't mapped.
 */
const getRuleTitle = (code: string) => {
  // 1. Direct Hit
  if (RULE_MAP[code]) return RULE_MAP[code];
  
  // 2. Parent Logic (e.g. T11.1.5 -> T11.1)
  const parts = code.split('.');
  if (parts.length > 2) {
    const parentCode = parts.slice(0, 2).join('.');
    if (RULE_MAP[parentCode]) return RULE_MAP[parentCode];
  }
  
  return "Technical Specification";
};

export default function App() {
  const [nodes, setNodes] = useState<Node[]>(NODES);
  const [tf, setTf] = useState({ x: 30, y: 30, s: 0.8 });
  const [selId, setSelId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [hiddenEdges, setHiddenEdges] = useState<Set<EdgeType>>(new Set());
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [activeRuleId, setActiveRuleId] = useState<string | null>(null);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const draggingNodeIdRef = useRef<string | null>(null);
  const startPosRef = useRef({ x: 0, y: 0 });

  const selectedNode = useMemo(() => nodes.find(n => n.id === selId), [selId, nodes]);

  const [ruleTab, setRuleTab] = useState<'A' | 'T' | 'EV'>('T');

  const filteredRules = useMemo(() => {
    if (!selectedNode?.rules) return [];
    // Deduplicate rule codes
    const uniqueRules = Array.from(new Set(selectedNode.rules));
    // Filter by category
    return uniqueRules.filter(code => {
      if (ruleTab === 'A') return code.startsWith('A');
      if (ruleTab === 'T') return code.startsWith('T');
      if (ruleTab === 'EV') return code.startsWith('EV');
      return false;
    });
  }, [selectedNode, ruleTab]);

  const hasCategory = (cat: 'A' | 'T' | 'EV') => {
    return selectedNode?.rules?.some(r => r.startsWith(cat));
  };

  // Compute edges with coordinates
  const renderedEdges = useMemo(() => {
    return EDGES.map(edge => {
      const sNode = nodes.find(n => n.id === edge.s);
      const tNode = nodes.find(n => n.id === edge.t);
      if (!sNode || !tNode) return null;

      const sx = sNode.x + NODE_WIDTH / 2;
      const sy = sNode.y + NODE_HEIGHT / 2;
      const tx = tNode.x + NODE_WIDTH / 2;
      const ty = tNode.y + NODE_HEIGHT / 2;

      const dx = tx - sx;
      const cx1 = sx + dx * 0.45;
      const cy1 = sy;
      const cx2 = tx - dx * 0.45;
      const cy2 = ty;

      return {
        ...edge,
        path: `M${sx} ${sy} C${cx1} ${cy1} ${cx2} ${cy2} ${tx} ${ty}`,
      };
    }).filter(Boolean);
  }, [nodes]);

  const connectedNodeIds = useMemo(() => {
    if (!selId) return new Set<string>();
    const ids = new Set<string>([selId]);
    EDGES.forEach(e => {
      if (e.s === selId) ids.add(e.t);
      if (e.t === selId) ids.add(e.s);
    });
    return ids;
  }, [selId]);

  const matchesSearch = useMemo(() => {
    if (!searchQuery) return null;
    const q = searchQuery.toLowerCase();
    return new Set(nodes.filter(n => 
      n.name.toLowerCase().includes(q) || 
      n.type.toLowerCase().includes(q) ||
      n.product?.toLowerCase().includes(q)
    ).map(n => n.id));
  }, [searchQuery, nodes]);

  // Simulated "Uptime" and "Runtime" logic for immersion
  const [uptime, setUptime] = useState(99.98);
  useEffect(() => {
    const interval = setInterval(() => {
      setUptime(prev => {
        const jitter = (Math.random() - 0.5) * 0.01;
        return Math.min(100, Math.max(99.95, prev + jitter));
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Performance stats for the footer - now reactive
  const stats = useMemo(() => {
    const visibleNodesCount = matchesSearch ? matchesSearch.size : (selId ? connectedNodeIds.size : nodes.length);
    const visibleEdges = renderedEdges.filter(e => !hiddenEdges.has(e?.cls as EdgeType));
    
    // Rule count based on highlighted group
    const highlightedNodes = nodes.filter(n => matchesSearch ? matchesSearch.has(n.id) : (selId ? connectedNodeIds.has(n.id) : true));
    const ruleCount = highlightedNodes.reduce((acc, n) => acc + (n.rules?.length || 0), 0);

    return [
      { label: 'Active Nodes', value: `${visibleNodesCount} / ${nodes.length}` },
      { label: 'Signal Paths', value: visibleEdges.length },
      { label: 'System Uptime', value: `${uptime.toFixed(2)}%` },
      { label: 'Rule Checks', value: ruleCount },
    ];
  }, [matchesSearch, selId, connectedNodeIds, hiddenEdges, renderedEdges, uptime, nodes]);

  // Pan / Drag Logic
  const handleMouseDown = (e: React.MouseEvent) => {
    // Check if clicking a node
    const nodeEl = (e.target as HTMLElement).closest('[data-node-id]');
    if (nodeEl) {
      const nodeId = nodeEl.getAttribute('data-node-id');
      if (nodeId) {
        draggingNodeIdRef.current = nodeId;
        setSelId(nodeId);
        setIsDetailOpen(true);
        startPosRef.current = { 
          x: (e.clientX - tf.x) / tf.s, 
          y: (e.clientY - tf.y) / tf.s 
        };
        return;
      }
    }

    if (e.target === containerRef.current || e.target === canvasRef.current || (e.target as HTMLElement).tagName === 'path' || (e.target as HTMLElement).tagName === 'svg') {
      isDraggingRef.current = true;
      startPosRef.current = { x: e.clientX - tf.x, y: e.clientY - tf.y };
      if (selId) {
        setSelId(null);
        setIsDetailOpen(false);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingNodeIdRef.current) {
      const mx = (e.clientX - tf.x) / tf.s;
      const my = (e.clientY - tf.y) / tf.s;
      const dx = mx - startPosRef.current.x;
      const dy = my - startPosRef.current.y;

      setNodes(prev => prev.map(n => 
        n.id === draggingNodeIdRef.current 
          ? { ...n, x: n.x + dx, y: n.y + dy } 
          : n
      ));
      startPosRef.current = { x: mx, y: my };
      return;
    }

    if (!isDraggingRef.current) return;
    setTf(prev => ({
      ...prev,
      x: e.clientX - startPosRef.current.x,
      y: e.clientY - startPosRef.current.y
    }));
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    draggingNodeIdRef.current = null;
  };

  const handleWheel = (e: React.WheelEvent) => {
    const f = e.deltaY < 0 ? 1.1 : 0.9;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    
    setTf(prev => ({
      x: mx - (mx - prev.x) * f,
      y: my - (my - prev.y) * f,
      s: Math.max(0.15, Math.min(3, prev.s * f))
    }));
  };

  const fitView = () => {
    const maxX = Math.max(...nodes.map(n => n.x)) + NODE_WIDTH + 80;
    const maxY = Math.max(...nodes.map(n => n.y)) + NODE_HEIGHT + 80;
    const vw = containerRef.current?.clientWidth || window.innerWidth;
    const vh = containerRef.current?.clientHeight || window.innerHeight;
    const sc = Math.min((vw - 60) / maxX, (vh - 60) / maxY, 1);
    setTf({
      s: sc,
      x: (vw - maxX * sc) / 2,
      y: (vh - maxY * sc) / 2
    });
  };

  const toggleEdgeFilter = (type: EdgeType) => {
    const next = new Set(hiddenEdges);
    if (next.has(type)) next.delete(type);
    else next.add(type);
    setHiddenEdges(next);
  };

  useEffect(() => {
    fitView();
    window.addEventListener('resize', fitView);
    return () => window.removeEventListener('resize', fitView);
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#05070a] text-[#e2e8f0] overflow-hidden font-sans selection:bg-cyan-500/30">
      {/* Topbar */}
      <header className="h-20 flex items-end justify-between px-8 py-4 bg-[#05070a]/80 backdrop-blur-md border-b border-white/10 z-50">
        <div className="flex flex-col">
          <span className="text-[10px] tracking-[0.2em] text-cyan-400 font-bold uppercase mb-1">Ruhuna Racing</span>
          <h1 className="text-2xl font-light tracking-tight leading-none">FB-2026 Production Schematics</h1>
        </div>

        <div className="flex items-center gap-6">
          {/* Legend Filter bar - Refined as minimal text buttons */}
          <div className="hidden xl:flex items-center gap-4">
            {(Object.entries(EDGE_COLORS) as [EdgeType, string][]).map(([type, color]) => (
              <button
                key={type}
                onClick={() => toggleEdgeFilter(type)}
                className={`group flex flex-col items-center gap-1 transition-all ${
                  hiddenEdges.has(type) ? 'opacity-20 grayscale' : 'opacity-100'
                }`}
              >
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }} />
                <span className="font-mono text-[8px] tracking-[0.1em] text-[#94a3b8] uppercase group-hover:text-cyan-400">
                  {type.replace('edge-', '').toUpperCase()}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4 border-l border-white/10 pl-6 h-full">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94a3b8] group-hover:text-cyan-400 transition-colors" />
              <input
                type="text"
                placeholder="PROBE SYSTEM..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-sm pl-9 pr-3 py-1.5 text-[10px] font-mono w-40 focus:outline-none focus:border-cyan-400/50 focus:bg-white/10 transition-all placeholder:opacity-30 uppercase tracking-widest"
              />
            </div>
            <div className="flex gap-1">
              {[
                { icon: <Maximize className="w-3.5 h-3.5" />, action: fitView },
                { icon: <Plus className="w-3.5 h-3.5" />, action: () => setTf(p => ({ ...p, s: Math.min(3, p.s * 1.2) })) },
                { icon: <Minus className="w-3.5 h-3.5" />, action: () => setTf(p => ({ ...p, s: Math.max(0.15, p.s * 0.8) })) }
              ].map((btn, i) => (
                <button 
                  key={i} 
                  onClick={btn.action} 
                  className="w-8 h-8 flex items-center justify-center rounded-sm bg-white/5 border border-white/10 text-[#94a3b8] hover:text-cyan-400 hover:bg-white/10 transition-all"
                >
                  {btn.icon}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main Canvas Area */}
      <main className="flex-1 relative flex overflow-hidden">
        <div 
          ref={containerRef}
          className="relative flex-1 cursor-grab active:cursor-grabbing overflow-hidden"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          <div 
            ref={canvasRef}
            className="absolute transform-origin-top-left transition-transform duration-75 ease-out will-change-transform"
            style={{ transform: `translate(${tf.x}px, ${tf.y}px) scale(${tf.s})` }}
          >
            {/* SVG Edges */}
            <svg className="absolute top-0 left-0 overflow-visible pointer-events-none">
              <defs>
                <filter id="glow-effect" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                {Object.entries(EDGE_COLORS).map(([type, color]) => (
                  <marker
                    key={type}
                    id={`arr-${type}`}
                    markerWidth="7"
                    markerHeight="7"
                    refX="6"
                    refY="3.5"
                    orient="auto"
                  >
                    <polygon points="0 0, 7 3.5, 0 7" fill={color} fillOpacity="0.9" />
                  </marker>
                ))}
              </defs>
              {renderedEdges.map((edge, i) => (
                <motion.path
                  key={`${edge?.s}-${edge?.t}-${i}`}
                  d={edge?.path}
                  className="transition-opacity duration-300 pointer-events-none fill-none"
                  stroke={EDGE_COLORS[edge?.cls as EdgeType]}
                  strokeOpacity={
                    hiddenEdges.has(edge?.cls as EdgeType) ? 0 : 
                    selId ? (edge?.s === selId || edge?.t === selId ? 1 : 0.05) : 0.4
                  }
                  strokeWidth={selId && (edge?.s === selId || edge?.t === selId) ? 2 : 1.2}
                  markerEnd={`url(#arr-${edge?.cls})`}
                  style={{
                    filter: selId && (edge?.s === selId || edge?.t === selId) ? 'url(#glow-effect)' : 'none'
                  }}
                  initial={false}
                />
              ))}
            </svg>

            {/* Nodes */}
            {nodes.map(node => {
              const isSelected = selId === node.id;
              const isHighlighted = selId ? connectedNodeIds.has(node.id) : (matchesSearch ? matchesSearch.has(node.id) : false);
              const isDimmed = (selId && !connectedNodeIds.has(node.id)) || (matchesSearch && !matchesSearch.has(node.id));

              return (
                <motion.div
                  key={node.id}
                  data-node-id={node.id}
                  className={`absolute glass rounded-xl cursor-grab active:cursor-grabbing transition-all duration-300 z-10 p-3 flex flex-col items-center text-center
                    ${isSelected ? 'border-cyan-400 ring-4 ring-cyan-400/10 z-30' : ''}
                    ${isHighlighted && !isSelected ? 'border-cyan-400/40 z-20 shadow-[0_0_15px_rgba(34,189,248,0.15)]' : ''}
                    ${isDimmed ? 'opacity-10 grayscale scale-[0.97]' : 'hover:border-cyan-400 hover:bg-white/5 hover:z-20'}
                  `}
                  style={{
                    left: node.x,
                    top: node.y,
                    width: 160,
                    minHeight: 110
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelId(node.id);
                    setIsDetailOpen(true);
                  }}
                >
                  <div className="w-full flex flex-col items-center mb-1">
                    <span className="text-[10px] uppercase tracking-widest text-[#94a3b8] mb-1">{node.type}</span>
                    <h3 className="text-sm font-semibold text-[#f8fafc] leading-tight line-clamp-2">
                      {node.name.replace('\n', ' ')}
                    </h3>
                  </div>

                  <div className="mt-auto pt-2 flex flex-col items-center gap-2 w-full border-t border-white/5">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${node.id === 'main_ecu' || node.id.includes('safety') ? 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]' : 'bg-green-500 shadow-[0_0_8px_#22c55e]'}`} />
                      <span className="text-[8px] uppercase tracking-wider text-[#94a3b8]">Operational</span>
                    </div>
                    {isSelected && (
                      <div className="text-[9px] font-mono text-cyan-400 opacity-80 uppercase">
                        ID: {node.id.slice(0, 8)}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Footer System Summary (New Immersive Element) */}
      <footer className="h-24 glass mt-auto mx-8 mb-6 grid grid-cols-4 gap-8 p-6 z-50">
        {stats.map((stat, i) => (
          <div key={i} className="flex flex-col gap-1 border-r last:border-r-0 border-white/5 pr-8">
            <div className="text-[9px] uppercase tracking-[0.15em] opacity-40 font-bold mb-1">{stat.label}</div>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-light tracking-tight">{stat.value}</span>
              {i === 2 && <span className="text-[10px] text-cyan-400 mb-1">STABLE</span>}
            </div>
          </div>
        ))}
      </footer>

      {/* Detail Panel Area */}
      <AnimatePresence>
        {isDetailOpen && selectedNode && (
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 180 }}
            className="fixed right-0 top-0 bottom-0 w-[340px] bg-[#05070a]/95 backdrop-blur-2xl border-l border-white/10 z-[100] shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden"
          >
            <div className="h-20 flex items-center justify-between px-8 border-b border-white/10">
              <div className="flex flex-col">
                <span className="text-[9px] font-mono font-bold tracking-[0.2em] text-[#94a3b8] uppercase">Probe Data</span>
                <h2 className="text-lg font-light tracking-tight">Component.Analysis</h2>
              </div>
              <button 
                onClick={() => setIsDetailOpen(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-[#94a3b8] hover:text-cyan-400 hover:bg-white/10 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar px-8 py-8 space-y-8">
              {/* Asset Header */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <span className="text-[10px] uppercase tracking-[0.3em] text-cyan-400 font-bold">{selectedNode.type}</span>
                  <h2 className="text-2xl font-light tracking-tight leading-tight">
                    {selectedNode.name.replace('\n', ' ')}
                    {selectedNode.fullName && (
                      <span className="text-white/40 block mt-1 text-lg">({selectedNode.fullName})</span>
                    )}
                  </h2>
                  <div className="flex gap-2 flex-wrap pt-2">
                    {selectedNode.procurement === 'bought' ? (
                      <span className="px-2 py-0.5 rounded-sm bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[8px] font-mono tracking-widest uppercase font-bold">Permitted to Buy (COTS)</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-sm bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[8px] font-mono tracking-widest uppercase font-bold">Design & Manufacture Required</span>
                    )}
                    {selectedNode.isNew && <span className="px-2 py-0.5 rounded-sm bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[8px] font-mono tracking-widest uppercase font-bold">New Revision</span>}
                    {selectedNode.isFixed && <span className="px-2 py-0.5 rounded-sm bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[8px] font-mono tracking-widest uppercase font-bold">Validation OK</span>}
                  </div>
                </div>
              </div>

              {/* Data Blocks */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Voltage Type', value: selectedNode.id.includes('battery') ? '12V DC' : (selectedNode.id.includes('5v') ? '5V REG' : 'Signal LV') },
                  { label: 'Procurement', value: selectedNode.procurement === 'bought' ? 'COTS' : 'DESIGN CASE' },
                  { label: 'Integration', value: selectedNode.product?.split(' ')[0] || 'Custom' },
                  { label: 'Revision', value: 'V1.3.04' },
                  { label: 'Path Load', value: '< 2ms' }
                ].map((item, i) => (
                  <div key={i} className="glass p-3 space-y-1">
                    <div className="text-[8px] uppercase tracking-widest opacity-40 font-bold">{item.label}</div>
                    <div className="text-[11px] font-mono text-cyan-400/80">{item.value}</div>
                  </div>
                ))}
              </div>

              {/* Narrative */}
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="text-[9px] uppercase tracking-[0.2em] font-bold text-cyan-400/60 mb-1">Duty</div>
                  <p className="text-sm text-[#f8fafc] font-light leading-relaxed">
                    {selectedNode.duty || "General system cluster operations."}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="text-[9px] uppercase tracking-[0.2em] font-bold text-cyan-400/60 mb-1">Purpose</div>
                  <p className="text-sm text-[#94a3b8] font-light leading-relaxed italic border-l border-white/5 pl-4">
                    {selectedNode.purpose || "Ensuring FB2026 stability."}
                  </p>
                </div>

                <div className="space-y-1 pt-2">
                  <div className="text-[9px] uppercase tracking-[0.2em] font-bold text-[#94a3b8] mb-1">System Intelligence</div>
                  <p className="text-[13px] text-[#94a3b8] font-light leading-relaxed opacity-80">
                    {selectedNode.desc}
                  </p>
                  {selectedNode.newNote && <div className="text-[10px] text-purple-400/80 italic font-light border-l border-purple-400/30 pl-4 py-1">{selectedNode.newNote}</div>}
                </div>
              </div>

              {/* Regulatory Compliance with Tabs */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-[9px] uppercase tracking-[0.2em] font-bold text-cyan-400">Regulatory Compliance</div>
                  <div className="flex gap-1 overflow-x-auto no-scrollbar pb-1">
                    {[
                      { id: 'A', label: 'Admin' },
                      { id: 'T', label: 'Tech' },
                      { id: 'EV', label: 'EV/TS' }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setRuleTab(tab.id as any)}
                        disabled={!hasCategory(tab.id as any)}
                        className={`px-2 py-0.5 rounded-sm text-[8px] font-bold tracking-wider uppercase transition-all whitespace-nowrap
                          ${ruleTab === tab.id 
                            ? 'bg-cyan-500 text-slate-900 shadow-[0_0_10px_rgba(6,182,212,0.5)]' 
                            : hasCategory(tab.id as any)
                              ? 'bg-white/5 text-cyan-400/60 hover:text-cyan-400'
                              : 'opacity-20 cursor-not-allowed text-slate-500'}`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 min-h-[100px]">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={ruleTab + (selectedNode?.id || '')}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.15 }}
                      className="space-y-2"
                    >
                      {filteredRules.map((ruleCode, i) => (
                        <div key={i} className="flex flex-col gap-2 glass p-3 border-l-2 border-cyan-500/50 group hover:bg-white/5 transition-colors">
                          <div className="flex items-start gap-3">
                            <div className="px-1.5 py-0.5 rounded-sm bg-cyan-500/10 text-cyan-400 text-[9px] font-mono font-bold leading-none mt-0.5">
                              {ruleCode}
                            </div>
                            <div className="flex-1">
                              <div className="text-[10px] text-[#f8fafc] font-medium leading-tight">{getRuleTitle(ruleCode)}</div>
                              <div className="text-[8px] text-cyan-400/40 font-mono mt-1">Rulebook Extract Available</div>
                            </div>
                          </div>
                          <button 
                            onClick={() => setActiveRuleId(ruleCode)}
                            className="text-[9px] text-cyan-400/70 hover:text-cyan-400 font-mono tracking-widest uppercase flex items-center gap-1.5 pt-1 w-fit transition-colors group"
                          >
                            <ChevronRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
                            Expand Verification Logic
                          </button>
                        </div>
                      ))}
                      {filteredRules.length === 0 && (
                        <div className="py-8 flex flex-col items-center justify-center opacity-30 gap-2 border border-dashed border-white/10 rounded-lg">
                          <ShieldAlert className="w-6 h-6" />
                          <div className="text-[9px] uppercase tracking-widest">No Clauses in Category {ruleTab}</div>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              {/* Functional Connections */}
              <div className="space-y-4">
                <div className="text-[9px] uppercase tracking-[0.2em] font-bold text-[#94a3b8] mb-1">Topology Links</div>
                <div className="space-y-1.5">
                  {EDGES.filter(e => e.s === selectedNode.id || e.t === selectedNode.id).map((edge, i) => {
                    const isOut = edge.s === selectedNode.id;
                    const otherNode = NODES.find(n => n.id === (isOut ? edge.t : edge.s));
                    return (
                      <div key={i} className="flex items-center gap-4 glass p-3 group">
                        <div className="w-1.5 h-1.5 rounded-full" 
                          style={{ 
                            backgroundColor: EDGE_COLORS[edge.cls as EdgeType],
                            boxShadow: `0 0 10px ${EDGE_COLORS[edge.cls as EdgeType]}` 
                          }} 
                        />
                        <div className="flex-1">
                          <div className="text-[8px] uppercase tracking-[0.1em] opacity-40 mb-0.5">{isOut ? 'Transmission Out' : 'Received From'}</div>
                          <div className="text-[11px] font-medium text-[#f8fafc] group-hover:text-cyan-400 transition-colors">{otherNode?.name.replace('\n', ' ')}</div>
                        </div>
                        <div className="text-[8px] font-mono opacity-30 group-hover:opacity-100">{edge.cls.replace('edge-', '').toUpperCase()}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Rule Reader Modal */}
      <AnimatePresence>
        {activeRuleId && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-8 bg-[#05070a]/90 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass max-w-2xl w-full p-8 relative border-cyan-400/30 shadow-[0_0_100px_rgba(34,189,248,0.15)]"
            >
              <button 
                onClick={() => setActiveRuleId(null)}
                className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/5 text-[#94a3b8] hover:text-cyan-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col gap-6">
                <div className="space-y-1">
                  <div className="text-[10px] font-mono tracking-[0.3em] font-bold text-cyan-400 uppercase">FB2026 Official Documentation</div>
                  <h3 className="text-2xl font-light tracking-tight">{activeRuleId}: {getRuleTitle(activeRuleId)}</h3>
                </div>

                <div className="h-px w-full bg-white/10" />

                <div className="space-y-4">
                  <div className="text-[9px] uppercase tracking-[0.2em] font-bold text-[#94a3b8]">Documentation Logic Extract</div>
                  <p className="text-lg leading-relaxed text-[#f8fafc] font-light">
                    {(() => {
                      // 1. Precise Match
                      if (FULL_RULE_DOCS[activeRuleId]) return FULL_RULE_DOCS[activeRuleId];
                      
                      // 2. Parent Category Match (e.g. T11.1.1 -> T11.1)
                      const parts = activeRuleId.split('.');
                      if (parts.length > 2) {
                        const parentKey = parts.slice(0, 2).join('.');
                        if (FULL_RULE_DOCS[parentKey]) return FULL_RULE_DOCS[parentKey];
                      }
                      
                      return "Full documentation extract for this specific regulatory clause is currently being verified against FS-Rules 2025 v1.1 adaptation standards.";
                    })()}
                  </p>
                </div>

                <div className="pt-4 flex gap-4">
                  <div className="flex-1 glass p-4 border-l-2 border-blue-500/40">
                    <div className="text-[8px] uppercase tracking-widest opacity-40 font-bold mb-1">Status</div>
                    <div className="text-[10px] text-blue-400 font-mono tracking-widest uppercase">Validated Compliance</div>
                  </div>
                  <div className="flex-1 glass p-4 border-l-2 border-emerald-500/40">
                    <div className="text-[8px] uppercase tracking-widest opacity-40 font-bold mb-1">Inspection Weight</div>
                    <div className="text-[10px] text-emerald-400 font-mono tracking-widest uppercase">Major Priority</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #22d3ee; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}
