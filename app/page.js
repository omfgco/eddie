'use client';
import { useState, useEffect } from 'react';

const NICE_CLASSES = [
  "01 - Chemicals","02 - Paints","03 - Cosmetics & Cleaning","04 - Lubricants & Fuels",
  "05 - Pharmaceuticals","06 - Common Metals","07 - Machines","08 - Hand Tools",
  "09 - Electronics & Software","10 - Medical Devices","11 - Lighting & HVAC",
  "12 - Vehicles","13 - Firearms & Explosives","14 - Jewelry & Watches",
  "15 - Musical Instruments","16 - Paper & Printed Materials","17 - Rubber & Plastics",
  "18 - Leather Goods","19 - Building Materials","20 - Furniture",
  "21 - Household Utensils","22 - Ropes & Fibers","23 - Yarns & Threads",
  "24 - Textiles","25 - Clothing & Footwear","26 - Lace & Embroidery",
  "27 - Carpets & Rugs","28 - Games & Toys","29 - Processed Foods",
  "30 - Staple Foods","31 - Agricultural Products","32 - Beverages (non-alcoholic)",
  "33 - Alcoholic Beverages","34 - Tobacco","35 - Advertising & Business",
  "36 - Insurance & Finance","37 - Construction & Repair","38 - Telecommunications",
  "39 - Transportation & Storage","40 - Material Treatment","41 - Education & Entertainment",
  "42 - Science & Technology","43 - Food, Drink & Accommodation","44 - Medical & Beauty Services",
  "45 - Legal & Security Services"
];

const GEO_OPTIONS = ["United States only","US + Canada","North America + EU","Global — English-speaking markets","Global — all major markets","Specific regions (describe in additional context)"];
const POSITIONING_OPTIONS = ["Premium / Luxury","Mass Market / Accessible","Technical / Professional","Playful / Fun","Bold / Disruptive","Trusted / Heritage","Eco / Sustainable","Minimalist / Modern","Other (describe in additional context)"];

const DIM_LABELS = {
  blocking_risk: { name: 'Blocking Risk', desc: 'Direct hits only — crowded field excluded' },
  registrability_path: { name: 'Registrability Path', desc: 'Is there a viable route to ownership' },
  ownability: { name: 'Ownability', desc: 'Can distinctive equity be built around it' },
  cultural_safety: { name: 'Cultural & Linguistic Safety', desc: 'Cross-market meanings & associations' },
  confusion_proximity: { name: 'Confusion Proximity', desc: 'Sight / sound / meaning near-misses' },
  positioning_fit: { name: 'Positioning Fit', desc: 'Alignment with brand positioning' },
  digital_availability: { name: 'Digital Availability', desc: 'Domain & social handle openness' },
};

// Core dimensions drive the weighted score and the verdict. Reported dimensions
// are shown for context but are deliberately excluded from the math — a lost
// .com or a soft positioning fit must never push a name toward being killed.
const CORE_WEIGHTS = {
  blocking_risk: 4,
  registrability_path: 3,
  ownability: 2,
  cultural_safety: 2,
  confusion_proximity: 1,
};
const REPORTED_DIMS = ['positioning_fit', 'digital_availability'];

function weightedAvg(scores) {
  if (!scores) return null;
  let total = 0, weightSum = 0;
  for (const [key, weight] of Object.entries(CORE_WEIGHTS)) {
    const val = scores[key];
    if (val) { total += val.score * weight; weightSum += weight; }
  }
  return weightSum ? (total / weightSum).toFixed(1) : null;
}

// Verdict display. `label` goes on the badge, `short` in the summary chips.
// Eddie screens names BEFORE anything is presented, so the four tiers answer
// one question: does this name go in the deck?
const VERDICT_META = {
  PRESENT:            { color: '#22c55e', bg: '#16a34a', label: 'HELL YEAH!',   short: 'HELL YEAH!',   blurb: 'Clean — lead with it.' },
  PRESENT_WITH_FLAGS: { color: '#eab308', bg: '#ca8a04', label: 'YES, BUT',     short: 'YES, BUT',     blurb: 'In the deck — say the flags out loud.' },
  NOT_WORTH_IT:       { color: '#f97316', bg: '#ea580c', label: 'PROBABLY NOT', short: 'PROBABLY NOT', blurb: 'Achievable, but not worth the fight.' },
  BLOCKED:            { color: '#ef4444', bg: '#dc2626', label: 'NOPE!',        short: 'NOPE!',        blurb: 'Genuine blocker.' },
};

// Legacy verdict values from reports run before the rename.
const LEGACY_VERDICTS = { INTERNAL_ONLY: 'NOT_WORTH_IT', DEAD: 'BLOCKED', GO: 'PRESENT', CAUTION: 'PRESENT_WITH_FLAGS', STOP: 'BLOCKED' };
const vMeta = v => VERDICT_META[v] || VERDICT_META[LEGACY_VERDICTS[v]] || { color: '#6b7280', bg: '#6b7280', label: v || '—', short: v || '—', blurb: '' };

// ── Styles ──
const s = {
  input: { width: '100%', padding: '10px 14px', background: '#0d1117', border: '1px solid #242d38', borderRadius: 8, color: '#e6edf3', fontSize: 14, outline: 'none', boxSizing: 'border-box' },
  label: { display: 'block', fontWeight: 700, fontSize: 13, marginBottom: 6, color: '#e6edf3' },
};

function ScoreBar({ score }) {
  const color = score >= 7 ? '#22c55e' : score >= 4 ? '#eab308' : '#ef4444';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
      <div style={{ flex: 1, height: 5, background: '#1e2530', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${score * 10}%`, height: '100%', borderRadius: 3, background: color, transition: 'width 0.6s ease' }} />
      </div>
      <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color, minWidth: 20, textAlign: 'right' }}>{score}</span>
    </div>
  );
}

function VerdictBadge({ verdict }) {
  const c = vMeta(verdict);
  return <span style={{ display: 'inline-block', padding: '4px 14px', background: c.bg, color: '#fff', borderRadius: 5, fontFamily: 'monospace', fontSize: 11, fontWeight: 800, letterSpacing: 1.2, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{c.label}</span>;
}

function NameCard({ result, context }) {
  const [open, setOpen] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const avg = weightedAvg(result.scores) ?? '—';
  const verdictBorder = vMeta(result.verdict).color;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const { generateNamePDF } = await import('../lib/generatePDF');
      await generateNamePDF(result, context);
    } catch (err) {
      alert('PDF generation failed: ' + err.message);
    }
    setDownloading(false);
  };

  return (
    <div style={{ background: '#131920', border: '1px solid #242d38', borderRadius: 10, marginBottom: 16, overflow: 'hidden' }}>
      <div onClick={() => setOpen(o => !o)} style={{ padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', userSelect: 'none', borderBottom: open ? '1px solid #242d38' : 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>{result.name}</span>
          <VerdictBadge verdict={result.verdict} />
          <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#8b949e' }}>avg {avg}/10</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={e => { e.stopPropagation(); handleDownload(); }} disabled={downloading}
            style={{ padding: '5px 14px', background: '#58a6ff15', border: '1px solid #58a6ff50', borderRadius: 6, color: '#58a6ff', fontSize: 12, fontWeight: 600, cursor: downloading ? 'wait' : 'pointer' }}>
            {downloading ? 'Generating…' : '↓ PDF'}
          </button>
          <span style={{ fontSize: 16, color: '#8b949e', transition: 'transform .2s', transform: open ? 'rotate(180deg)' : '' }}>▾</span>
        </div>
      </div>
      {open && (
        <div style={{ padding: '16px 20px 20px' }}>
          <p style={{ margin: '0 0 20px', padding: '12px 16px', background: '#1a2230', borderRadius: 8, fontSize: 14, lineHeight: 1.65, fontStyle: 'italic', color: '#c9d1d9', borderLeft: `3px solid ${verdictBorder}` }}>{result.verdict_summary}</p>

          {result.scope_note && (
            <div style={{ marginBottom: 16, padding: '12px 16px', background: '#2a1f08', border: '1px solid #5c4514', borderRadius: 8, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ fontFamily: 'monospace', fontSize: 9, fontWeight: 800, color: '#eab308', background: '#eab30818', padding: '2px 8px', borderRadius: 4, whiteSpace: 'nowrap', marginTop: 2 }}>SCOPE</span>
              <div style={{ fontSize: 13.5, color: '#e6d5a8', lineHeight: 1.6 }}>{result.scope_note}</div>
            </div>
          )}

          {result.client_notes && (
            <div style={{ marginBottom: 20, padding: '16px 18px', background: '#12202e', border: '1px solid #1c3a5c', borderRadius: 10 }}>
              <h4 style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 800, letterSpacing: 1.8, textTransform: 'uppercase', color: '#58a6ff', margin: '0 0 10px' }}>Client Conversation Notes</h4>
              <div style={{ fontSize: 14.5, lineHeight: 1.7, color: '#e6edf3' }}>{result.client_notes}</div>
            </div>
          )}

          {result.flags?.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <h4 style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 800, letterSpacing: 1.8, textTransform: 'uppercase', color: '#8b949e', margin: '0 0 10px' }}>Say This Out Loud ({result.flags.length})</h4>
              {result.flags.map((f, i) => {
                const fc = { HIGH: '#ef4444', MEDIUM: '#eab308', LOW: '#6b7280' }[f.severity] || '#6b7280';
                return (
                  <div key={i} style={{ padding: '12px 14px', background: '#1a2230', borderRadius: 8, marginBottom: 8, borderLeft: `3px solid ${fc}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: 9, fontWeight: 800, color: fc, background: `${fc}18`, padding: '2px 8px', borderRadius: 4 }}>{f.severity}</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#e6edf3' }}>{f.issue}</span>
                    </div>
                    {f.mitigation && (
                      <div style={{ fontSize: 13, color: '#8b949e', marginTop: 6, lineHeight: 1.6 }}>
                        <span style={{ color: '#58a6ff', fontWeight: 700 }}>Path forward: </span>{f.mitigation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {result.field_density && (
            <div style={{ marginBottom: 24, padding: '12px 16px', background: '#161b22', border: '1px solid #242d38', borderRadius: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase', color: '#8b949e' }}>Field Density</span>
                {(() => {
                  const a = result.field_density.assessment;
                  const ac = { CLEAR: '#22c55e', MODERATE: '#eab308', CROWDED: '#f97316' }[a] || '#6b7280';
                  return <span style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 800, color: ac, background: `${ac}18`, padding: '2px 9px', borderRadius: 4 }}>{a}</span>;
                })()}
                {typeof result.field_density.count === 'number' && (
                  <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#6e7681' }}>{result.field_density.count} similar marks</span>
                )}
              </div>
              {result.field_density.interpretation && (
                <div style={{ fontSize: 13, color: '#8b949e', lineHeight: 1.6 }}>{result.field_density.interpretation}</div>
              )}
            </div>
          )}

          <div style={{ marginBottom: 24 }}>
            <h4 style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 800, letterSpacing: 1.8, textTransform: 'uppercase', color: '#8b949e', margin: '0 0 12px' }}>Scorecard</h4>
            {result.scores && Object.keys(CORE_WEIGHTS).map((key) => {
              const meta = DIM_LABELS[key];
              const val = result.scores[key];
              if (!val) return null;
              return (
                <div key={key} style={{ display: 'grid', gridTemplateColumns: '170px 130px 1fr', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div><div style={{ fontSize: 13, fontWeight: 600, color: '#e6edf3' }}>{meta.name}</div><div style={{ fontSize: 10, color: '#6e7681' }}>{meta.desc}</div></div>
                  <ScoreBar score={val.score} />
                  <span style={{ fontSize: 12, color: '#8b949e' }}>{val.label}</span>
                </div>
              );
            })}
          </div>

          {result.scores && REPORTED_DIMS.some(k => result.scores[k]) && (
            <div style={{ marginBottom: 24 }}>
              <h4 style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 800, letterSpacing: 1.8, textTransform: 'uppercase', color: '#8b949e', margin: '0 0 12px' }}>
                Context <span style={{ fontFamily: "'Segoe UI', sans-serif", fontSize: 11, fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: '#6e7681' }}>— not factored into score or verdict</span>
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {REPORTED_DIMS.map((key) => {
                  const meta = DIM_LABELS[key];
                  const val = result.scores[key];
                  if (!val) return null;
                  const color = val.score >= 7 ? '#22c55e' : val.score >= 4 ? '#eab308' : '#ef4444';
                  return (
                    <div key={key} style={{ padding: '10px 14px', background: '#1a2230', border: '1px solid #242d38', borderRadius: 8, minWidth: 190 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#8b949e' }}>{meta.name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                        <span style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 800, color }}>{val.score}/10</span>
                        <span style={{ fontSize: 12, color: '#8b949e' }}>{val.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {result.conflicts_found?.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h4 style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 800, letterSpacing: 1.8, textTransform: 'uppercase', color: '#8b949e', margin: '0 0 12px' }}>Conflicts Found ({result.conflicts_found.length})</h4>
              {result.conflicts_found.map((c, i) => {
                const sc = { HIGH: '#ef4444', MEDIUM: '#eab308', LOW: '#6b7280' }[c.severity] || '#6b7280';
                const isBlocking = c.type === 'BLOCKING';
                const tc = isBlocking ? '#ef4444' : '#58a6ff';
                return (
                  <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 12px', background: '#1a2230', borderRadius: 6, marginBottom: 6 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start', marginTop: 2 }}>
                      {c.type && <span style={{ fontFamily: 'monospace', fontSize: 9, fontWeight: 800, color: tc, background: `${tc}18`, border: `1px solid ${tc}40`, padding: '2px 8px', borderRadius: 4, whiteSpace: 'nowrap' }}>{c.type}</span>}
                      <span style={{ fontFamily: 'monospace', fontSize: 9, fontWeight: 800, color: sc, background: `${sc}18`, padding: '2px 8px', borderRadius: 4, whiteSpace: 'nowrap' }}>{c.severity}</span>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#e6edf3' }}>{c.name}</div>
                      <div style={{ fontSize: 12, color: '#8b949e', marginTop: 2 }}>{c.category}{c.url ? ` · ${c.url}` : ''}</div>
                      {c.notes && <div style={{ fontSize: 13, color: '#8b949e', marginTop: 4, lineHeight: 1.5 }}>{c.notes}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {result.analysis && (
            <div style={{ marginBottom: 24 }}>
              <h4 style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 800, letterSpacing: 1.8, textTransform: 'uppercase', color: '#8b949e', margin: '0 0 12px' }}>Detailed Analysis</h4>
              <div style={{ fontSize: 14, lineHeight: 1.8, color: '#c9d1d9', whiteSpace: 'pre-wrap' }}>{result.analysis}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function NiceClassPicker({ selected, onToggle, industry, description }) {
  const [showManual, setShowManual] = useState(false);
  const [recs, setRecs] = useState(null);
  const [recLoading, setRecLoading] = useState(false);

  const getRecs = async () => {
    const desc = [industry, description].filter(Boolean).join(' — ');
    if (!desc.trim()) return;
    setRecLoading(true);
    try {
      const res = await fetch('/api/recommend-classes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ description: desc }) });
      const data = await res.json();
      setRecs(data.recommendations || []);
    } catch { setRecs([]); }
    setRecLoading(false);
  };

  const prioColor = { ESSENTIAL: '#ef4444', RECOMMENDED: '#eab308', CONSIDER: '#6b7280' };
  const prioLabel = { ESSENTIAL: 'Must file', RECOMMENDED: 'Should file', CONSIDER: 'Consider' };

  return (
    <div>
      <div style={{ padding: '10px 14px', background: '#0d1117', border: '1px solid #242d38', borderRadius: 8, fontSize: 14, color: selected.length ? '#e6edf3' : '#6e7681', marginBottom: 8 }}>
        {selected.length ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {selected.map(cls => (
              <span key={cls} onClick={() => onToggle(cls)} style={{ padding: '3px 10px', background: '#1c3a5c', border: '1px solid #58a6ff', borderRadius: 5, fontSize: 12, color: '#58a6ff', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>{cls} <span style={{ fontSize: 10, opacity: 0.7 }}>✕</span></span>
            ))}
          </div>
        ) : 'No classes selected yet'}
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <button onClick={getRecs} disabled={recLoading} style={{ padding: '8px 16px', background: recLoading ? '#1c2333' : '#58a6ff15', border: '1px solid #58a6ff50', borderRadius: 6, color: '#58a6ff', fontSize: 13, fontWeight: 600, cursor: recLoading ? 'wait' : 'pointer' }}>
          {recLoading ? 'Analyzing…' : '✦ Recommend Classes'}
        </button>
        <button onClick={() => setShowManual(m => !m)} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #242d38', borderRadius: 6, color: '#8b949e', fontSize: 13, cursor: 'pointer' }}>
          {showManual ? 'Hide' : 'Browse'} all 45 classes
        </button>
      </div>
      {recs?.length > 0 && (
        <div style={{ padding: 14, background: '#0f1a2a', border: '1px solid #1c3050', borderRadius: 8, marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase', color: '#58a6ff' }}>Recommended</span>
            <button onClick={() => recs.forEach(r => { if (!selected.includes(r.class_code)) onToggle(r.class_code); })} style={{ padding: '4px 12px', background: '#58a6ff20', border: '1px solid #58a6ff40', borderRadius: 5, color: '#58a6ff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>+ Add all</button>
          </div>
          {recs.map((r, i) => {
            const isSel = selected.includes(r.class_code);
            return (
              <div key={i} onClick={() => { if (!isSel) onToggle(r.class_code); }} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 10px', borderRadius: 6, marginBottom: 4, cursor: 'pointer', border: isSel ? '1px solid #58a6ff30' : '1px solid transparent' }}>
                <div style={{ width: 18, height: 18, borderRadius: 4, marginTop: 1, flexShrink: 0, border: `2px solid ${isSel ? '#58a6ff' : '#3a4450'}`, background: isSel ? '#58a6ff' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {isSel && <span style={{ color: '#0b0f14', fontSize: 11, fontWeight: 900 }}>✓</span>}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#e6edf3' }}>{r.class_code}</span>
                    <span style={{ fontFamily: 'monospace', fontSize: 9, fontWeight: 800, color: prioColor[r.priority], background: `${prioColor[r.priority]}18`, padding: '1px 7px', borderRadius: 3, textTransform: 'uppercase' }}>{prioLabel[r.priority]}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#8b949e', marginTop: 3 }}>{r.rationale}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {showManual && (
        <div style={{ padding: 12, background: '#0d1117', border: '1px solid #242d38', borderRadius: 8, maxHeight: 220, overflowY: 'auto', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {NICE_CLASSES.map(cls => {
            const active = selected.includes(cls);
            return <div key={cls} onClick={() => onToggle(cls)} style={{ padding: '4px 10px', borderRadius: 5, cursor: 'pointer', fontSize: 12, background: active ? '#1c3a5c' : '#161b22', border: `1px solid ${active ? '#58a6ff' : '#242d38'}`, color: active ? '#58a6ff' : '#8b949e', fontWeight: active ? 600 : 400 }}>{cls}</div>;
          })}
        </div>
      )}
    </div>
  );
}

// ═══ MAIN APP ═══
export default function Home() {
  const [step, setStep] = useState('input');
  const [namesInput, setNamesInput] = useState('');
  const [ctx, setCtx] = useState({ industry: '', description: '', niceClasses: [], geoScope: GEO_OPTIONS[0], positioning: '', competitors: '', additionalContext: '' });
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const [loadingName, setLoadingName] = useState('');
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const set = (k, v) => setCtx(p => ({ ...p, [k]: v }));

  const runAnalysis = async () => {
    const names = namesInput.split(/[,\n]+/).map(n => n.trim()).filter(Boolean);
    if (!names.length) { setError('Enter at least one name.'); return; }
    if (!ctx.industry.trim()) { setError('Industry is required.'); return; }
    setError(null); setResults([]); setStep('loading');
    setProgress({ current: 0, total: names.length });

    const allResults = [];
    for (let i = 0; i < names.length; i++) {
      setLoadingName(names[i]);
      setProgress({ current: i + 1, total: names.length });
      try {
        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: names[i], context: ctx }),
        });
        const data = await res.json();
        if (data.error) {
          allResults.push({ name: names[i], verdict: 'NOT_WORTH_IT', verdict_summary: `Analysis failed: ${data.error}`, scores: {}, flags: [], conflicts_found: [], analysis: '' });
        } else if (data.names?.[0]) {
          allResults.push(data.names[0]);
        }
      } catch (err) {
        allResults.push({ name: names[i], verdict: 'NOT_WORTH_IT', verdict_summary: `Request failed: ${err.message}`, scores: {}, flags: [], conflicts_found: [], analysis: '' });
      }
      // Update results incrementally
      setResults([...allResults]);
    }
    setStep('results');
  };

  return (
    <div style={{ fontFamily: "'Segoe UI', -apple-system, system-ui, sans-serif", background: '#0b0f14', color: '#e6edf3', minHeight: '100vh' }}>
      <div style={{ padding: '20px 28px', borderBottom: '1px solid #1c2333', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, letterSpacing: -1, color: '#58a6ff' }}>Eddie</h1>
        <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#6e7681', letterSpacing: 1.5, textTransform: 'uppercase' }}>Trademark Name Vetter</span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 14 }}>
          <a href="https://www.omfgco.com/" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#6e7681', letterSpacing: 1.5, textTransform: 'uppercase' }}>BY</span>
            <img src="/omfgco-dice.svg" alt="OMFGCO" style={{ height: 30 }} />
          </a>
          {step === 'results' && (
            <button onClick={() => { setStep('input'); setResults([]); setError(null); }} style={{ padding: '6px 16px', background: 'transparent', border: '1px solid #242d38', borderRadius: 6, color: '#8b949e', fontSize: 13, cursor: 'pointer' }}>← New Search</button>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 28px 80px' }}>

        {/* INPUT */}
        {step === 'input' && (<>
          <div style={{ marginBottom: 24 }}>
            <label style={s.label}>Candidate Names <span style={{ fontWeight: 400, color: '#6e7681' }}>— one per line or comma-separated</span></label>
            <textarea value={namesInput} onChange={e => setNamesInput(e.target.value)} placeholder={"Apex\nVelocity Health\nNovara"} rows={4} style={{ ...s.input, fontFamily: 'monospace', fontSize: 15, resize: 'vertical' }} />
          </div>
          <div style={{ padding: 20, background: '#111820', border: '1px solid #1c2333', borderRadius: 10, marginBottom: 20 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 800, color: '#8b949e', textTransform: 'uppercase', letterSpacing: 1 }}>Business Context</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div><label style={s.label}>Industry / Category <span style={{ color: '#ef4444' }}>*</span></label><input value={ctx.industry} onChange={e => set('industry', e.target.value)} placeholder="e.g. Health & wellness SaaS" style={s.input} /></div>
              <div><label style={s.label}>Product / Service Description</label><input value={ctx.description} onChange={e => set('description', e.target.value)} placeholder="e.g. AI-powered fitness coaching app" style={s.input} /></div>
              <div><label style={s.label}>Geographic Scope</label><select value={ctx.geoScope} onChange={e => set('geoScope', e.target.value)} style={s.input}>{GEO_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}</select></div>
              <div><label style={s.label}>Brand Positioning</label><select value={ctx.positioning} onChange={e => set('positioning', e.target.value)} style={s.input}><option value="">Select…</option>{POSITIONING_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}</select></div>
            </div>
            <div style={{ marginTop: 14 }}><label style={s.label}>Nice Classification(s)</label><NiceClassPicker selected={ctx.niceClasses} onToggle={cls => set('niceClasses', ctx.niceClasses.includes(cls) ? ctx.niceClasses.filter(c => c !== cls) : [...ctx.niceClasses, cls])} industry={ctx.industry} description={ctx.description} /></div>
            <div style={{ marginTop: 14 }}><label style={s.label}>Key Competitors</label><input value={ctx.competitors} onChange={e => set('competitors', e.target.value)} placeholder="e.g. Peloton, Noom, MyFitnessPal" style={s.input} /></div>
            <div style={{ marginTop: 14 }}><label style={s.label}>Additional Context</label><textarea value={ctx.additionalContext} onChange={e => set('additionalContext', e.target.value)} placeholder="e.g. We plan to expand into wearables in 2027." rows={3} style={{ ...s.input, resize: 'vertical' }} /></div>
          </div>
          <div style={{ padding: '16px 20px', background: '#111820', border: '1px solid #1c2333', borderRadius: 10, marginBottom: 24 }}>
            <h3 style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 800, color: '#6e7681', textTransform: 'uppercase', letterSpacing: 1 }}>Scored on 5 weighted dimensions · 2 reported for context</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {['Blocking Risk (4×)','Registrability Path (3×)','Ownability (2×)','Cultural & Linguistic Safety (2×)','Confusion Proximity (1×)','Positioning Fit — context','Digital Availability — context'].map(d => (
                <span key={d} style={{ padding: '4px 12px', background: '#1c2333', borderRadius: 20, fontSize: 12, color: '#8b949e' }}>{d}</span>
              ))}
            </div>
          </div>
          {error && <div style={{ padding: '12px 16px', background: '#2d1215', border: '1px solid #5c2328', borderRadius: 8, color: '#f87171', fontSize: 14, marginBottom: 16 }}>{error}</div>}
          <button onClick={runAnalysis} style={{ width: '100%', padding: 14, background: '#58a6ff', color: '#0b0f14', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 800, cursor: 'pointer' }}>Run Trademark Analysis</button>
          <p style={{ textAlign: 'center', fontSize: 12, color: '#6e7681', marginTop: 10 }}>Each name is analyzed individually with live web search. Expect 30–90 sec per name.</p>
        </>)}

        {/* LOADING */}
        {step === 'loading' && (
          <div>
            <div style={{ textAlign: 'center', padding: '40px 0 30px' }}>
              <div style={{ width: 48, height: 48, border: '3px solid #1c2333', borderTopColor: '#58a6ff', borderRadius: '50%', margin: '0 auto 20px', animation: 'spin 1s linear infinite' }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Analyzing "{loadingName}" ({progress.current}/{progress.total})</div>
              <div style={{ fontFamily: 'monospace', fontSize: 13, color: '#6e7681' }}>Searching trademark databases, domains, and social handles…</div>
            </div>
            {/* Show results as they come in */}
            {results.length > 0 && (
              <>
                <div style={{ fontSize: 13, color: '#8b949e', marginBottom: 12 }}>Completed so far:</div>
                {results.map(n => <NameCard key={n.name} result={n} context={ctx} />)}
              </>
            )}
          </div>
        )}

        {/* RESULTS */}
        {step === 'results' && (
          <>
            <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
              {results.map(n => {
                const m = vMeta(n.verdict);
                return (
                  <div key={n.name} style={{ padding: '8px 16px', background: `${m.color}12`, border: `1px solid ${m.color}40`, borderRadius: 8, fontSize: 14 }}>
                    <span style={{ fontWeight: 800, color: m.color }}>{m.short}</span>
                    <span style={{ color: '#8b949e', marginLeft: 8 }}>{n.name}</span>
                  </div>
                );
              })}
            </div>
            {results.map(n => <NameCard key={n.name} result={n} context={ctx} />)}
            <div style={{ marginTop: 24, padding: '14px 20px', background: '#111820', border: '1px solid #1c2333', borderRadius: 8, fontSize: 13, color: '#6e7681', lineHeight: 1.7 }}>
              <strong style={{ color: '#8b949e' }}>Disclaimer:</strong> This is a knockout screen, not a clearance search. It uses AI-powered web search and should not be treated as legal advice. Pending applications, state registrations, and most common-law rights are not visible to web search. A PRESENT verdict means no obvious blockers surfaced — it does not mean the name is cleared. Always conduct a formal trademark search through a qualified attorney before filing or committing a client to a name.
            </div>
          </>
        )}
      </div>
    </div>
  );
}
