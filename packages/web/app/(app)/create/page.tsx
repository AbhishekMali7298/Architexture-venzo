'use client';

import { useState, useRef, useEffect } from 'react';
import { useEditorStore } from './store/editor-store';
import { BackgroundCanvas } from './components/background-canvas';
import type { PatternType, PatternCategory, EdgeStyle } from '@textura/shared';

// ======= Pattern catalog (matching Architextures) =======

const PATTERNS: { id: PatternType; name: string; category: string; svgPath: string }[] = [
  // Brick Bond
  { id: 'running_bond',   name: 'Running Bond',   category: 'Brick Bond', svgPath: 'M0,8h40M0,24h40M0,0h10v16H0M10,0h20v16M30,0h10v16 M0,16h20v16M20,16h20v16' },
  { id: 'stack_bond',     name: 'Stack Bond',     category: 'Brick Bond', svgPath: 'M0,0h40M0,16h40M0,32h40M0,0v32M10,0v32M20,0v32M30,0v32M40,0v32' },
  { id: 'flemish_bond',   name: 'Flemish Bond',   category: 'Brick Bond', svgPath: 'M0,0h12v10H0M12,0h20v10M32,0h8v10M0,10h8v10M8,10h20v10M28,10h12v10' },
  { id: 'english_bond',   name: 'English Bond',   category: 'Brick Bond', svgPath: 'M0,0h40M0,10h40M0,20h40M0,30h40M0,0v10M20,0v10M0,10v10M10,10v10M20,10v10M30,10v10' },
  { id: 'stretcher_bond', name: 'Stretcher Bond', category: 'Brick Bond', svgPath: 'M0,0h20v12H0zM20,0h20v12M0,12h10v12M10,12h20v12M30,12h10v12' },
  { id: 'soldier_course', name: 'Soldier Course', category: 'Brick Bond', svgPath: 'M0,0h8v40H0zM8,0h8v40M16,0h8v40M24,0h8v40M32,0h8v40' },
  { id: 'subway',         name: 'Subway Tile',    category: 'Brick Bond', svgPath: 'M0,0h20v10H0zM20,0h20v10M10,10h20v10M0,10h10v10M30,10h10v10' },
  // Paving
  { id: 'herringbone',    name: 'Herringbone',    category: 'Paving', svgPath: 'M0,20h20v20H0M20,0h20v20z' },
  { id: 'chevron',        name: 'Chevron',        category: 'Paving', svgPath: 'M0,20 L20,0 L20,10 L0,30z M20,0 L40,20 L40,30 L20,10z' },
  { id: 'basketweave',    name: 'Basketweave',    category: 'Paving', svgPath: 'M0,0h20v8H0M0,8h8v20M8,28h20v8M28,8h8v20' },
  { id: 'hexagonal',      name: 'Hexagonal',      category: 'Paving', svgPath: 'M20,2 L36,12 L36,28 L20,38 L4,28 L4,12z' },
  { id: 'pinwheel',       name: 'Pinwheel',       category: 'Paving', svgPath: 'M0,0h20v20H0M20,0h8v8M20,8h20v20M28,0h12v8' },
  { id: 'ashlar',         name: 'Ashlar',         category: 'Paving', svgPath: 'M0,0h25v14H0M25,0h15v14M0,14h15v14M15,14h25v14' },
  { id: 'cobblestone',    name: 'Cobblestone',    category: 'Paving', svgPath: 'M5,5 Q20,2 35,5 Q38,20 35,35 Q20,38 5,35 Q2,20 5,5z' },
  { id: 'crazy_paving',   name: 'Crazy Paving',   category: 'Paving', svgPath: 'M0,15 L18,0 L40,8 L32,28 L15,40 L0,25z M18,0 L40,8 M0,15 L15,40' },
  // Parquetry
  { id: 'parquet_straight', name: 'Parquet Straight', category: 'Parquetry', svgPath: 'M0,0h15v15H0M15,0h15v15M0,15h15v15M15,15h15v15' },
  { id: 'parquet_diagonal', name: 'Parquet Diagonal', category: 'Parquetry', svgPath: 'M20,0 L40,20 L20,40 L0,20z M10,0 L30,20 M0,10 L20,30' },
  { id: 'versailles',     name: 'Versailles',     category: 'Parquetry', svgPath: 'M10,10h20v20H10M0,0h10v10M30,0h10v10M0,30h10v10M30,30h10v10' },
  { id: 'windmill',       name: 'Windmill',       category: 'Parquetry', svgPath: 'M0,0h15v15H0M15,0h25v15M0,15h25v15M25,15h15v25M0,30h25v10M15,15h10v15' },
];

// ======= Material catalog =======

const MATERIALS: { id: string; name: string; category: string; color: string }[] = [
  // Stone
  { id: 'granite',        name: 'Granite',        category: 'Stone',  color: '#a0a0a0' },
  { id: 'limestone',      name: 'Limestone',      category: 'Stone',  color: '#c8c0b0' },
  { id: 'travertine',     name: 'Travertine',     category: 'Stone',  color: '#d4c8a0' },
  { id: 'white_marble',   name: 'White Marble',   category: 'Stone',  color: '#e8e8e8' },
  { id: 'flagstone',      name: 'Flagstone',      category: 'Stone',  color: '#909080' },
  { id: 'slate',          name: 'Slate',          category: 'Stone',  color: '#606870' },
  { id: 'sandstone',      name: 'Sandstone',      category: 'Stone',  color: '#d4b896' },
  { id: 'basalt',         name: 'Basalt',         category: 'Stone',  color: '#505050' },
  // Brick
  { id: 'red_brick',      name: 'Red Brick',      category: 'Brick',  color: '#b06048' },
  { id: 'yellow_brick',   name: 'Yellow Brick',   category: 'Brick',  color: '#d4b870' },
  { id: 'concrete_block', name: 'Concrete Block', category: 'Brick',  color: '#909090' },
  // Wood
  { id: 'oak',            name: 'Oak',            category: 'Wood',   color: '#c09060' },
  { id: 'walnut',         name: 'Walnut',         category: 'Wood',   color: '#704830' },
  { id: 'pine',           name: 'Pine',           category: 'Wood',   color: '#d4b070' },
  // Tile
  { id: 'white_ceramic',  name: 'White Ceramic',  category: 'Tile',   color: '#f0f0f0' },
  { id: 'terracotta',     name: 'Terracotta',     category: 'Tile',   color: '#c87848' },
  { id: 'cement',         name: 'Cement Tile',    category: 'Tile',   color: '#b0b0b0' },
];

// ======= SVG pattern thumbnail =======

function PatternThumb({ path, size = 80 }: { path: string; size?: number }) {
  return (
    <svg
      viewBox="0 0 40 40"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      style={{ color: '#333' }}
    >
      <path d={path} />
    </svg>
  );
}

// ======= Material swatch thumbnail =======
function MaterialThumb({ color, size = 80 }: { color: string; size?: number }) {
  // Create a realistic stone look with CSS
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: color,
        background: `
          radial-gradient(ellipse at 30% 30%, ${lighten(color, 20)}cc, transparent 60%),
          radial-gradient(ellipse at 70% 70%, ${darken(color, 15)}cc, transparent 50%),
          ${color}
        `,
        border: '2px solid #e0e0e0',
        flexShrink: 0,
      }}
    />
  );
}

function lighten(hex: string, amount: number): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, ((n >> 16) & 255) + amount);
  const g = Math.min(255, ((n >> 8) & 255) + amount);
  const b = Math.min(255, (n & 255) + amount);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
function darken(hex: string, amount: number): string {
  return lighten(hex, -amount);
}

// ======= Pattern Modal =======

function PatternModal({ onClose, onSelect, currentPattern }: {
  onClose: () => void;
  onSelect: (id: PatternType, cat: string) => void;
  currentPattern: PatternType;
}) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const categories = ['All', ...Array.from(new Set(PATTERNS.map(p => p.category)))];
  const filtered = PATTERNS.filter(p =>
    (category === 'All' || p.category === category) &&
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Choose Pattern</h2>
          <div className="modal-search-row">
            <select className="modal-select" value={category} onChange={e => setCategory(e.target.value)}>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <div className="search-wrap">
              <input
                className="search-input"
                placeholder="Search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                autoFocus
              />
              <span className="search-icon">🔍</span>
            </div>
            <button className="close-btn" onClick={onClose}>✕</button>
          </div>
        </div>
        <div className="modal-grid">
          {filtered.map(pat => (
            <button
              key={pat.id}
              className={`modal-item ${currentPattern === pat.id ? 'active' : ''}`}
              onClick={() => { onSelect(pat.id as PatternType, pat.category); onClose(); }}
            >
              <div className="thumb-wrap">
                <PatternThumb path={pat.svgPath} size={70} />
              </div>
              <span className="item-name">{pat.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ======= Material Modal =======

function MaterialModal({ onClose, onSelect, currentMaterial }: {
  onClose: () => void;
  onSelect: (id: string, color: string, name: string) => void;
  currentMaterial: string;
}) {
  const [search, setSearch] = useState('');
  const categories = Array.from(new Set(MATERIALS.map(m => m.category)));
  const filtered = (cat: string) =>
    MATERIALS.filter(m => m.category === cat && m.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Choose Material</h2>
          <div className="modal-search-row" style={{ justifyContent: 'flex-end' }}>
            <div className="search-wrap">
              <input
                className="search-input"
                placeholder="Search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                autoFocus
              />
              <span className="search-icon">🔍</span>
            </div>
            <button className="close-btn" onClick={onClose}>✕</button>
          </div>
        </div>
        <div className="modal-scroll">
          {/* Special options */}
          <div className="modal-grid" style={{ marginBottom: 8 }}>
            <button className="modal-item" onClick={() => { onSelect('solid', '#ffffff', 'Solid Fill'); onClose(); }}>
              <div className="thumb-wrap special">
                <svg viewBox="0 0 40 40" width="50" height="50" fill="none" stroke="#999" strokeWidth="1.5">
                  <circle cx="20" cy="20" r="16" />
                  <path d="M14,20 Q20,12 26,20 Q20,28 14,20z" fill="#ccc" stroke="none" />
                </svg>
              </div>
              <span className="item-name">Solid Fill (Tint)</span>
            </button>
            <button className="modal-item">
              <div className="thumb-wrap special">
                <svg viewBox="0 0 40 40" width="50" height="50" fill="none" stroke="#999" strokeWidth="1.5">
                  <circle cx="20" cy="20" r="16" />
                  <path d="M20,13v14M13,20h14" />
                </svg>
              </div>
              <span className="item-name">Upload</span>
            </button>
            <button className="modal-item">
              <div className="thumb-wrap special">
                <svg viewBox="0 0 40 40" width="50" height="50" fill="none" stroke="#999" strokeWidth="1.5">
                  <circle cx="20" cy="20" r="16" />
                  <text x="20" y="25" textAnchor="middle" fontSize="14" fill="#999" stroke="none">?</text>
                </svg>
              </div>
              <span className="item-name">Request material</span>
            </button>
          </div>

          {categories.map(cat => (
            <div key={cat}>
              <div className="category-label">▾ {cat.toUpperCase()}</div>
              <div className="modal-grid">
                {filtered(cat).map(mat => (
                  <button
                    key={mat.id}
                    className={`modal-item ${currentMaterial === mat.id ? 'active' : ''}`}
                    onClick={() => { onSelect(mat.id, mat.color, mat.name); onClose(); }}
                  >
                    <div className="thumb-wrap">
                      <MaterialThumb color={mat.color} size={70} />
                    </div>
                    <span className="item-name">{mat.name}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ======= Edge Settings popup =======

function EdgeSettingsPopup({ style, onStyleChange, onClose }: {
  style: EdgeStyle;
  onStyleChange: (s: EdgeStyle) => void;
  onClose: () => void;
}) {
  return (
    <div className="edge-popup">
      <div className="edge-popup-header">
        <span>Edge settings</span>
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>
      <label className="field-label">STYLE</label>
      <select className="field-select" value={style} onChange={e => onStyleChange(e.target.value as EdgeStyle)}>
        <option value="none">None</option>
        <option value="fine">Fine</option>
        <option value="handmade">Handmade</option>
        <option value="rough">Rough</option>
        <option value="uneven">Uneven</option>
      </select>
      <label className="field-label" style={{ marginTop: 14 }}>SCALE</label>
      <input type="range" className="field-slider" defaultValue={50} min={0} max={100} />
    </div>
  );
}

// ======= Main Page =======

export default function CreatePage() {
  // Store state
  const config = useEditorStore((s) => s.config);
  const activeTab = useEditorStore((s) => s.activeTab);
  const setActiveTab = useEditorStore((s) => s.setActiveTab);
  const setPatternType = useEditorStore((s) => s.setPatternType);
  const setPatternRows = useEditorStore((s) => s.setPatternRows);
  const setPatternColumns = useEditorStore((s) => s.setPatternColumns);
  const setMaterialColor = useEditorStore((s) => s.setMaterialColor);
  const setMaterialWidth = useEditorStore((s) => s.setMaterialWidth);
  const setMaterialHeight = useEditorStore((s) => s.setMaterialHeight);
  const setEdgeStyle = useEditorStore((s) => s.setEdgeStyle);
  const setToneVariation = useEditorStore((s) => s.setToneVariation);
  const setJointHorizontalSize = useEditorStore((s) => s.setJointHorizontalSize);
  const setJointVerticalSize = useEditorStore((s) => s.setJointVerticalSize);
  const setLinkedDimensions = useEditorStore((s) => s.setLinkedDimensions);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const undoLen = useEditorStore((s) => s.undoStack.length);
  const redoLen = useEditorStore((s) => s.redoStack.length);

  const mat = config.materials[0]!;
  const currentPatternInfo = PATTERNS.find(p => p.id === config.pattern.type) ?? PATTERNS[0]!;
  const currentMaterialName = mat.source.type === 'solid' ? 'Solid Color' : 'Granite';

  // Modal state
  const [showPatternModal, setShowPatternModal] = useState(false);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [showEdgeSettings, setShowEdgeSettings] = useState(false);

  // Tint state
  const [tintValue, setTintValue] = useState('#FFFFFF');

  const TABS = [
    { id: 'texture' as const, label: 'TEXTURE' },
    { id: 'bump' as const, label: 'BUMP' },
    { id: 'hatch' as const, label: 'HATCH' },
  ];

  const PBR_BTNS = [
    { label: '↯', title: 'Displacement' },
    { label: 'B', title: 'Bump' },
    { label: 'R', title: 'Roughness' },
    { label: '∿', title: 'Normal' },
  ];

  return (
    <>
      {/* Full page background canvas */}
      <BackgroundCanvas />

      {/* Floating control panel */}
      <div className="panel">
        {/* Panel header */}
        <div className="panel-header">
          <div className="panel-logo">
            <svg width="28" height="28" viewBox="0 0 28 28">
              <rect width="28" height="28" rx="4" fill="#111" />
              <text x="4" y="20" fill="white" fontSize="11" fontWeight="700" fontFamily="system-ui">AR</text>
              <text x="4" y="28" fill="white" fontSize="11" fontWeight="700" fontFamily="system-ui">TX</text>
            </svg>
          </div>
          <div className="panel-header-actions">
            <button className="hdr-btn" title="Settings">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </button>
            <button className="hdr-btn" title="Menu">···</button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="tab-bar">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`tab-btn ${activeTab === t.id ? 'active' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </button>
          ))}
          <button className="tab-btn tab-more">▾</button>
        </div>

        <div className="panel-body">

          {/* Pattern section */}
          <div className="section">
            <div className="section-header-row">
              <span className="section-label">Pattern</span>
              <button className="icon-action" title="Duplicate">⧉</button>
            </div>
            <div className="field-row">
              <button className="name-btn" onClick={() => setShowPatternModal(true)}>
                <span className="name-text">{currentPatternInfo.name}</span>
                <PatternThumb path={currentPatternInfo.svgPath} size={28} />
              </button>
              <button className="icon-action refresh-btn" title="Randomise">↺</button>
            </div>

            <div className="two-col">
              <div className="field-group">
                <label className="field-label">ROWS</label>
                <div className="number-field">
                  <input
                    type="number"
                    className="num-input"
                    value={config.pattern.rows}
                    min={1} max={50}
                    onChange={e => setPatternRows(parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>
              <div className="field-group">
                <label className="field-label">COLUMNS</label>
                <div className="number-field">
                  <input
                    type="number"
                    className="num-input"
                    value={config.pattern.columns}
                    min={1} max={50}
                    onChange={e => setPatternColumns(parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>
            </div>
            <div className="dimensions-hint">
              {config.pattern.rows * (mat.height + config.joints.horizontalSize)} × {config.pattern.columns * (mat.width + config.joints.verticalSize)} WW
            </div>
          </div>

          {/* Material section */}
          <div className="section">
            <div className="section-header-row">
              <span className="section-label">Material</span>
              <button className="icon-action" title="Duplicate">⧉</button>
            </div>
            <div className="field-row">
              <button className="name-btn" onClick={() => setShowMaterialModal(true)}>
                <span className="name-text">{currentMaterialName}</span>
                <MaterialThumb
                  color={mat.source.type === 'solid' ? mat.source.color : '#a0a0a0'}
                  size={28}
                />
              </button>
              <button className="icon-action refresh-btn" title="Randomise">↺</button>
            </div>

            <div className="two-col">
              <div className="field-group">
                <label className="field-label">WIDTH</label>
                <div className="number-field with-unit">
                  <input
                    type="number"
                    className="num-input"
                    value={mat.width}
                    min={1}
                    onChange={e => setMaterialWidth(parseInt(e.target.value) || 1)}
                  />
                  <span className="unit">mm</span>
                </div>
              </div>
              <div className="field-group">
                <label className="field-label">HEIGHT</label>
                <div className="number-field with-unit">
                  <input
                    type="number"
                    className="num-input"
                    value={mat.height}
                    min={1}
                    onChange={e => setMaterialHeight(parseInt(e.target.value) || 1)}
                  />
                  <span className="unit">mm</span>
                </div>
              </div>
            </div>

            {/* Adjustments */}
            <div className="field-group">
              <label className="field-label">ADJUSTMENTS</label>
              <div className="field-row">
                <button className="adj-btn">Levels, Hue, Tint</button>
                <button className="icon-action">≡</button>
              </div>
            </div>

            {/* Tint */}
            <div className="field-group">
              <label className="field-label">TINT</label>
              <div className="tint-row">
                <input
                  type="text"
                  className="tint-input"
                  value={tintValue}
                  onChange={e => setTintValue(e.target.value)}
                />
                <button className="eyedropper-btn" title="Pick tint">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L3 14.67V21h6.33l10.06-10.06a5.5 5.5 0 0 0 0-7.78z"/>
                    <line x1="16" y1="8" x2="2" y2="22"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Edges row */}
            <div className="edges-row">
              <div className="field-group" style={{ flex: 1 }}>
                <label className="field-label">EDGES</label>
                <button
                  className="adj-btn"
                  onClick={() => setShowEdgeSettings(!showEdgeSettings)}
                >
                  {mat.edges.style.charAt(0).toUpperCase() + mat.edges.style.slice(1) || 'None'}
                </button>
              </div>
              <div className="field-group profile-finish">
                <label className="field-label">PROFILE</label>
                <button className="icon-sq-btn">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M2,12 Q12,2 22,12 Q12,22 2,12z"/>
                  </svg>
                </button>
              </div>
              <div className="field-group profile-finish">
                <label className="field-label">FINISH</label>
                <button className="icon-sq-btn">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="3" y1="8" x2="21" y2="8"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="16" x2="21" y2="16"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Edge settings popup */}
            {showEdgeSettings && (
              <EdgeSettingsPopup
                style={mat.edges.style}
                onStyleChange={(s) => { setEdgeStyle(s); }}
                onClose={() => setShowEdgeSettings(false)}
              />
            )}

            {/* Tone variation */}
            <div className="field-group">
              <label className="field-label">TONE VARIATION</label>
              <input
                type="range"
                className="field-slider"
                value={mat.toneVariation}
                min={0} max={100}
                onChange={e => setToneVariation(parseInt(e.target.value))}
              />
            </div>

            {/* PBR options */}
            <div className="field-group">
              <label className="field-label">PBR OPTIONS</label>
              <div className="pbr-row">
                {PBR_BTNS.map((b) => (
                  <button key={b.title} className="pbr-btn" title={b.title}>{b.label}</button>
                ))}
              </div>
            </div>

            {/* Add another material */}
            <button className="add-mat-btn">
              <span className="add-icon-wrap">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <line x1="12" y1="8" x2="12" y2="16"/>
                  <line x1="8" y1="12" x2="16" y2="12"/>
                </svg>
              </span>
              Add Another Material
            </button>
          </div>

          {/* Save button */}
          <div className="panel-footer">
            <button className="save-btn">SAVE</button>
            <p className="footer-copy">©2026 Architextures | Terms of Use</p>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showPatternModal && (
        <PatternModal
          currentPattern={config.pattern.type}
          onClose={() => setShowPatternModal(false)}
          onSelect={(id, cat) => setPatternType(id, cat as any)}
        />
      )}
      {showMaterialModal && (
        <MaterialModal
          currentMaterial="granite"
          onClose={() => setShowMaterialModal(false)}
          onSelect={(id, color, name) => setMaterialColor(color)}
        />
      )}

      {/* ===== STYLES ===== */}
      <style jsx global>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; overflow: hidden; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Inter', system-ui, sans-serif; }

        /* ===== Modals (global so they work outside component scope) ===== */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.35);
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 16px;
          z-index: 99999;
        }
        .modal-card {
          background: white;
          border-radius: 14px;
          width: 700px;
          max-width: calc(100vw - 32px);
          max-height: calc(100vh - 120px);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 8px 40px rgba(0,0,0,0.22);
          margin-top: 60px;
        }
        .modal-header {
          padding: 18px 20px 14px;
          border-bottom: 1px solid #f0f0f0;
          flex-shrink: 0;
        }
        .modal-title {
          font-size: 17px;
          font-weight: 600;
          color: #111;
          margin-bottom: 12px;
        }
        .modal-search-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .modal-select {
          padding: 8px 12px;
          border: 1px solid #e8e8e8;
          border-radius: 8px;
          background: white;
          font-size: 14px;
          cursor: pointer;
          outline: none;
          color: #333;
        }
        .search-wrap {
          flex: 1;
          position: relative;
          max-width: 200px;
        }
        .search-input {
          width: 100%;
          padding: 8px 28px 8px 10px;
          border: 1px solid #e8e8e8;
          border-radius: 8px;
          font-size: 14px;
          outline: none;
          color: #333;
          background: #f9f9f9;
        }
        .search-icon {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 13px;
          color: #aaa;
        }
        .modal-grid {
          display: flex;
          flex-wrap: wrap;
          padding: 16px 20px;
          gap: 8px;
        }
        .modal-scroll {
          overflow-y: auto;
          flex: 1;
        }
        .category-label {
          padding: 8px 20px 4px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 1px;
          color: #888;
          text-transform: uppercase;
        }
        .modal-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          background: none;
          border: 2px solid transparent;
          border-radius: 12px;
          cursor: pointer;
          padding: 10px 8px 8px;
          width: 110px;
          transition: border-color 0.15s, background 0.15s;
        }
        .modal-item:hover { background: #f7f7f7; border-color: #e0e0e0; }
        .modal-item.active { border-color: #111; background: #f5f5f5; }
        .thumb-wrap {
          width: 80px; height: 80px;
          border: 1.5px solid #e8e8e8;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
          overflow: hidden;
          flex-shrink: 0;
        }
        .thumb-wrap.special { border-style: dashed; border-color: #ccc; background: #fafafa; }
        .item-name {
          font-size: 11px;
          color: #555;
          text-align: center;
          line-height: 1.3;
          max-width: 90px;
        }
        .close-btn {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 14px;
          color: #666;
          padding: 2px 6px;
        }
      `}</style>
      <style jsx>{`
        /* ===== Panel ===== */
        .panel {
          position: fixed;
          top: 16px;
          left: 16px;
          z-index: 100;
          width: 272px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.14), 0 1px 4px rgba(0,0,0,0.1);
          display: flex;
          flex-direction: column;
          max-height: calc(100vh - 32px);
          overflow: hidden;
        }

        /* Header */
        .panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 14px 10px;
          border-bottom: 1px solid #f0f0f0;
          flex-shrink: 0;
        }
        .panel-logo { display: flex; align-items: center; }
        .panel-header-actions { display: flex; gap: 6px; }
        .hdr-btn {
          width: 30px; height: 30px;
          border: 1px solid #e8e8e8;
          border-radius: 6px;
          background: white;
          color: #555;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px;
          transition: background 0.1s;
        }
        .hdr-btn:hover { background: #f5f5f5; }

        /* Tabs */
        .tab-bar {
          display: flex;
          border-bottom: 1px solid #f0f0f0;
          flex-shrink: 0;
          padding: 0 8px;
        }
        .tab-btn {
          flex: 1;
          padding: 9px 4px;
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          margin-bottom: -1px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.5px;
          color: #999;
          cursor: pointer;
          transition: color 0.15s;
          white-space: nowrap;
        }
        .tab-btn.active {
          color: #111;
          border-bottom-color: #111;
        }
        .tab-btn:hover:not(.active) { color: #555; }
        .tab-more { flex: none; width: 28px; padding: 9px 4px; }

        /* Body */
        .panel-body {
          overflow-y: auto;
          overflow-x: hidden;
          flex: 1;
          scrollbar-width: thin;
          scrollbar-color: #e0e0e0 transparent;
        }

        /* Sections */
        .section {
          padding: 12px 14px;
          border-bottom: 1px solid #f0f0f0;
          position: relative;
        }
        .section-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .section-label {
          font-size: 13px;
          font-weight: 600;
          color: #111;
        }

        /* Name button (pattern / material) */
        .field-row { display: flex; align-items: center; gap: 8px; }
        .name-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 7px 10px;
          background: #f7f7f7;
          border: 1px solid #e8e8e8;
          border-radius: 8px;
          cursor: pointer;
          gap: 8px;
          text-align: left;
          transition: border-color 0.15s;
        }
        .name-btn:hover { border-color: #ccc; }
        .name-text { font-size: 14px; color: #111; font-weight: 500; flex: 1; }

        /* Action icon buttons */
        .icon-action {
          width: 30px; height: 30px;
          border: 1px solid #e8e8e8;
          border-radius: 6px;
          background: white;
          color: #555;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          flex-shrink: 0;
          transition: background 0.1s;
        }
        .icon-action:hover { background: #f5f5f5; }
        .refresh-btn { font-size: 18px; }

        /* Two-column layout */
        .two-col { display: flex; gap: 8px; margin-top: 10px; }
        .field-group { flex: 1; }
        .field-label {
          display: block;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.8px;
          color: #aaa;
          margin-bottom: 4px;
          text-transform: uppercase;
        }
        .number-field {
          display: flex;
          align-items: center;
          border: 1px solid #e8e8e8;
          border-radius: 7px;
          background: white;
          overflow: hidden;
        }
        .num-input {
          flex: 1;
          border: none;
          outline: none;
          padding: 7px 8px;
          font-size: 14px;
          color: #111;
          background: transparent;
          text-align: right;
          width: 0;
          min-width: 0;
        }
        .unit {
          padding: 0 8px;
          font-size: 11px;
          color: #aaa;
          border-left: 1px solid #f0f0f0;
          background: #f9f9f9;
          height: 100%;
          display: flex;
          align-items: center;
        }
        .dimensions-hint {
          font-size: 10px;
          color: #aaa;
          margin-top: 5px;
          text-align: right;
        }

        /* Adjustments / adj button */
        .adj-btn {
          flex: 1;
          width: 100%;
          padding: 7px 10px;
          background: #f7f7f7;
          border: 1px solid #e8e8e8;
          border-radius: 8px;
          font-size: 13px;
          color: #333;
          cursor: pointer;
          text-align: left;
          transition: border-color 0.15s;
        }
        .adj-btn:hover { border-color: #ccc; }

        /* Tint row */
        .tint-row {
          display: flex;
          align-items: center;
          border: 1px solid #e8e8e8;
          border-radius: 8px;
          overflow: hidden;
          background: white;
        }
        .tint-input {
          flex: 1;
          border: none;
          outline: none;
          padding: 7px 10px;
          font-size: 14px;
          color: #111;
          font-family: monospace;
          background: transparent;
        }
        .eyedropper-btn {
          padding: 7px 10px;
          border: none;
          border-left: 1px solid #f0f0f0;
          background: #f9f9f9;
          color: #666;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Edges row */
        .edges-row { display: flex; gap: 8px; align-items: flex-end; margin-top: 10px; }
        .profile-finish { flex: none; width: 48px; }
        .icon-sq-btn {
          width: 34px; height: 34px;
          border: 1px solid #e8e8e8;
          border-radius: 6px;
          background: #f7f7f7;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #555;
          transition: background 0.1s;
        }
        .icon-sq-btn:hover { background: #eee; }

        /* Sliders */
        .field-slider {
          width: 100%;
          accent-color: #333;
          cursor: pointer;
          margin-top: 4px;
        }

        /* PBR */
        .pbr-row { display: flex; gap: 6px; }
        .pbr-btn {
          flex: 1;
          padding: 8px 4px;
          border: 1px solid #e8e8e8;
          border-radius: 7px;
          background: white;
          color: #444;
          font-size: 15px;
          cursor: pointer;
          font-weight: 600;
          transition: background 0.1s, border-color 0.1s;
        }
        .pbr-btn:hover { background: #f5f5f5; border-color: #ccc; }

        /* Add material */
        .add-mat-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          background: none;
          border: none;
          padding: 6px 2px;
          color: #888;
          font-size: 13px;
          cursor: pointer;
          transition: color 0.15s;
        }
        .add-mat-btn:hover { color: #333; }
        .add-icon-wrap {
          width: 22px; height: 22px;
          border: 1px solid #ccc;
          border-radius: 5px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #888;
          flex-shrink: 0;
        }

        /* Footer */
        .panel-footer { padding: 12px 14px; }
        .save-btn {
          width: 100%;
          padding: 13px;
          background: white;
          border: 1.5px solid #222;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 1.5px;
          cursor: pointer;
          color: #111;
          transition: background 0.15s;
        }
        .save-btn:hover { background: #111; color: white; }
        .footer-copy {
          text-align: center;
          font-size: 10px;
          color: #bbb;
          margin-top: 8px;
        }

        /* ===== Edge Settings Popup ===== */
        .edge-popup {
          position: absolute;
          top: 50%;
          left: calc(100% + 12px);
          transform: translateY(-50%);
          width: 220px;
          background: white;
          border-radius: 10px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.18);
          padding: 14px;
          z-index: 200;
        }
        .edge-popup-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 14px;
          font-size: 14px;
          font-weight: 600;
          color: #111;
        }
        .close-btn {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 14px;
          color: #666;
          padding: 2px 6px;
        }
        .field-select {
          width: 100%;
          padding: 8px 10px;
          border: 1px solid #e8e8e8;
          border-radius: 7px;
          background: #f7f7f7;
          font-size: 14px;
          color: #111;
          cursor: pointer;
          outline: none;
        }

        /* ===== Modals ===== */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.35);
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 16px;
          z-index: 1000;
        }
        .modal-card {
          background: white;
          border-radius: 14px;
          width: 700px;
          max-width: 100%;
          max-height: calc(100vh - 32px);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 8px 40px rgba(0,0,0,0.22);
          margin-top: 60px;
        }
        .modal-header {
          padding: 18px 20px 14px;
          border-bottom: 1px solid #f0f0f0;
          flex-shrink: 0;
        }
        .modal-title {
          font-size: 17px;
          font-weight: 600;
          color: #111;
          margin-bottom: 12px;
        }
        .modal-search-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .modal-select {
          padding: 8px 12px;
          border: 1px solid #e8e8e8;
          border-radius: 8px;
          background: white;
          font-size: 14px;
          cursor: pointer;
          outline: none;
          color: #333;
        }
        .search-wrap {
          flex: 1;
          position: relative;
          max-width: 200px;
        }
        .search-input {
          width: 100%;
          padding: 8px 28px 8px 10px;
          border: 1px solid #e8e8e8;
          border-radius: 8px;
          font-size: 14px;
          outline: none;
          color: #333;
          background: #f9f9f9;
        }
        .search-icon {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 13px;
          color: #aaa;
        }
        .modal-grid {
          display: flex;
          flex-wrap: wrap;
          padding: 16px 20px;
          gap: 8px;
        }
        .modal-scroll {
          overflow-y: auto;
          flex: 1;
        }
        .category-label {
          padding: 8px 20px 4px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 1px;
          color: #888;
          text-transform: uppercase;
        }
        .modal-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          background: none;
          border: 2px solid transparent;
          border-radius: 12px;
          cursor: pointer;
          padding: 10px 8px 8px;
          width: 110px;
          transition: border-color 0.15s, background 0.15s;
        }
        .modal-item:hover { background: #f7f7f7; border-color: #e0e0e0; }
        .modal-item.active { border-color: #111; background: #f5f5f5; }
        .thumb-wrap {
          width: 80px; height: 80px;
          border: 1.5px solid #e8e8e8;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
          overflow: hidden;
          flex-shrink: 0;
        }
        .thumb-wrap.special { border-style: dashed; border-color: #ccc; background: #fafafa; }
        .item-name {
          font-size: 11px;
          color: #555;
          text-align: center;
          line-height: 1.3;
          max-width: 90px;
        }
      `}</style>
    </>
  );
}
