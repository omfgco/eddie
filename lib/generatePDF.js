/**
 * Generates a single-scroll PDF for one name result.
 * Uses html2canvas to capture a hidden DOM element, then jsPDF to output.
 */
export async function generateNamePDF(nameResult, context) {
  const html2canvas = (await import('html2canvas')).default;
  const { jsPDF } = await import('jspdf');

  // Create a hidden container with the report HTML
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '900px';
  container.innerHTML = buildReportHTML(nameResult, context);
  document.body.appendChild(container);

  // Wait for render
  await new Promise(r => setTimeout(r, 100));

  try {
    const canvas = await html2canvas(container, {
      backgroundColor: '#0b0f14',
      scale: 2,
      useCORS: true,
      logging: false,
    });

    const imgWidth = 210; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [imgWidth, imgHeight],
    });

    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

    const safeName = nameResult.name.replace(/[^a-zA-Z0-9\s'-]/g, '').trim();
    pdf.save(`Eddie — ${safeName}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}

function scoreColorClass(score) {
  if (score >= 7) return 'green';
  if (score >= 4) return 'yellow';
  return 'red';
}

function sevClass(sev) {
  return (sev || '').toLowerCase();
}

const DIM_LABELS = {
  distinctiveness: { name: 'Distinctiveness', desc: 'Generic → Fanciful spectrum' },
  registrability: { name: 'Registrability', desc: 'Likelihood of successful TM registration' },
  conflict_risk: { name: 'Conflict Risk', desc: 'Existing marks in same/adjacent categories' },
  phonetic_conflicts: { name: 'Phonetic Conflicts', desc: 'Sound-alike confusion risk' },
  cultural_safety: { name: 'Cultural & Linguistic Safety', desc: 'Cross-market meanings & associations' },
  emotional_connotation: { name: 'Emotional Connotation', desc: 'Alignment with brand positioning' },
  digital_availability: { name: 'Digital Availability', desc: 'Domain & social handle openness' },
};

function buildReportHTML(result, ctx) {
  const avg = result.scores
    ? (Object.values(result.scores).reduce((s, v) => s + v.score, 0) / Object.keys(result.scores).length).toFixed(1)
    : '—';

  const verdictBorderColor = { GO: '#22c55e', CAUTION: '#eab308', STOP: '#ef4444' }[result.verdict] || '#6b7280';
  const badgeBg = { GO: '#16a34a', CAUTION: '#ca8a04', STOP: '#dc2626' }[result.verdict] || '#6b7280';
  const badgeLabel = { GO: 'GO ✓', CAUTION: 'CAUTION ⚠', STOP: 'STOP ✕' }[result.verdict] || result.verdict;

  let scoresHTML = '';
  for (const [key, meta] of Object.entries(DIM_LABELS)) {
    const val = result.scores?.[key];
    if (!val) continue;
    const col = scoreColorClass(val.score);
    const colors = { green: '#22c55e', yellow: '#eab308', red: '#ef4444' };
    scoresHTML += `
      <div style="display:grid;grid-template-columns:170px 130px 1fr;align-items:center;gap:8px;margin-bottom:8px;">
        <div><div style="font-size:13px;font-weight:600;color:#e6edf3">${meta.name}</div><div style="font-size:10px;color:#6e7681">${meta.desc}</div></div>
        <div style="display:flex;align-items:center;gap:8px;width:100%">
          <div style="flex:1;height:5px;background:#1e2530;border-radius:3px;overflow:hidden">
            <div style="width:${val.score * 10}%;height:100%;border-radius:3px;background:${colors[col]}"></div>
          </div>
          <span style="font-family:monospace;font-size:12px;font-weight:700;color:${colors[col]};min-width:20px;text-align:right">${val.score}</span>
        </div>
        <span style="font-size:12px;color:#8b949e">${val.label}</span>
      </div>`;
  }

  let conflictsHTML = '';
  for (const c of (result.conflicts_found || [])) {
    const sevColors = { HIGH: '#ef4444', MEDIUM: '#eab308', LOW: '#6b7280' };
    const sc = sevColors[c.severity] || '#6b7280';
    conflictsHTML += `
      <div style="display:flex;gap:10px;padding:10px 12px;background:#1a2230;border-radius:6px;margin-bottom:6px">
        <span style="font-family:monospace;font-size:9px;font-weight:800;color:${sc};background:${sc}18;padding:2px 8px;border-radius:4px;align-self:flex-start;margin-top:2px;white-space:nowrap">${c.severity}</span>
        <div>
          <div style="font-weight:700;font-size:14px;color:#e6edf3">${c.name}</div>
          <div style="font-size:12px;color:#8b949e;margin-top:2px">${c.category}${c.url ? ' · ' + c.url : ''}</div>
          ${c.notes ? `<div style="font-size:13px;color:#8b949e;margin-top:4px;line-height:1.5">${c.notes}</div>` : ''}
        </div>
      </div>`;
  }

  return `
    <div style="font-family:'Segoe UI',-apple-system,system-ui,sans-serif;background:#0b0f14;color:#e6edf3;padding:0;width:900px">
      <div style="padding:20px 28px;border-bottom:1px solid #1c2333;display:flex;align-items:center;gap:14px">
        <h1 style="margin:0;font-size:26px;font-weight:900;letter-spacing:-1px;color:#58a6ff">Eddie</h1>
        <span style="font-family:monospace;font-size:10px;color:#6e7681;letter-spacing:1.5px;text-transform:uppercase">Trademark Name Vetter</span>
        <span style="margin-left:auto;font-family:monospace;font-size:10px;color:#6e7681;letter-spacing:1.5px;text-transform:uppercase">BY OMFGCO</span>
      </div>
      <div style="max-width:900px;margin:0 auto;padding:24px 28px 40px">
        <div style="padding:16px 20px;background:#111820;border:1px solid #1c2333;border-radius:10px;margin-bottom:24px">
          <div style="font-family:monospace;font-size:10px;font-weight:800;letter-spacing:1.8px;text-transform:uppercase;color:#58a6ff;margin-bottom:12px">Analysis Context</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:13px">
            <div><span style="color:#6e7681">Industry:</span> <span style="color:#c9d1d9">${ctx.industry || '—'}</span></div>
            <div><span style="color:#6e7681">Description:</span> <span style="color:#c9d1d9">${ctx.description || '—'}</span></div>
            <div><span style="color:#6e7681">Scope:</span> <span style="color:#c9d1d9">${ctx.geoScope || '—'}</span></div>
            <div><span style="color:#6e7681">Positioning:</span> <span style="color:#c9d1d9">${ctx.positioning || '—'}</span></div>
            <div style="grid-column:1/-1"><span style="color:#6e7681">Nice Classes:</span> <span style="color:#c9d1d9">${(ctx.niceClasses || []).join(' · ') || '—'}</span></div>
            ${ctx.additionalContext ? `<div style="grid-column:1/-1"><span style="color:#6e7681">Additional:</span> <span style="color:#c9d1d9">${ctx.additionalContext}</span></div>` : ''}
          </div>
        </div>

        <div style="background:#131920;border:1px solid #242d38;border-radius:10px;overflow:hidden;margin-bottom:16px">
          <div style="padding:16px 20px;border-bottom:1px solid #242d38;display:flex;align-items:center;gap:14px;flex-wrap:wrap">
            <span style="font-size:22px;font-weight:800;letter-spacing:-0.5px">${result.name}</span>
            <span style="display:inline-block;padding:4px 14px;background:${badgeBg};color:#fff;border-radius:5px;font-family:monospace;font-size:11px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase">${badgeLabel}</span>
            <span style="font-family:monospace;font-size:12px;color:#8b949e">avg ${avg}/10</span>
          </div>
          <div style="padding:16px 20px 20px">
            <p style="margin:0 0 20px;padding:12px 16px;background:#1a2230;border-radius:8px;font-size:14px;line-height:1.65;font-style:italic;color:#c9d1d9;border-left:3px solid ${verdictBorderColor}">${result.verdict_summary}</p>

            <div style="margin-bottom:24px">
              <h4 style="font-family:monospace;font-size:10px;font-weight:800;letter-spacing:1.8px;text-transform:uppercase;color:#8b949e;margin:0 0 12px">Scorecard</h4>
              ${scoresHTML}
            </div>

            ${(result.conflicts_found?.length > 0) ? `
            <div style="margin-bottom:24px">
              <h4 style="font-family:monospace;font-size:10px;font-weight:800;letter-spacing:1.8px;text-transform:uppercase;color:#8b949e;margin:0 0 12px">Conflicts Found (${result.conflicts_found.length})</h4>
              ${conflictsHTML}
            </div>` : ''}

            ${result.analysis ? `
            <div style="margin-bottom:24px">
              <h4 style="font-family:monospace;font-size:10px;font-weight:800;letter-spacing:1.8px;text-transform:uppercase;color:#8b949e;margin:0 0 12px">Detailed Analysis</h4>
              <div style="font-size:14px;line-height:1.8;color:#c9d1d9;white-space:pre-wrap">${result.analysis}</div>
            </div>` : ''}
          </div>
        </div>

        <div style="margin-top:24px;padding:14px 20px;background:#111820;border:1px solid #1c2333;border-radius:8px;font-size:13px;color:#6e7681;line-height:1.7">
          <strong style="color:#8b949e">Disclaimer:</strong> This analysis uses AI-powered web search and should not be treated as legal advice. A GO verdict means no obvious conflicts were found — it does not guarantee registrability. Always conduct a formal trademark search through a qualified attorney before filing.
        </div>
      </div>
    </div>`;
}
