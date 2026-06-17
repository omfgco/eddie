/**
 * Generates a single-scroll vector PDF for one name result.
 * Uses jsPDF drawing primitives — text, rects, lines. No rasterization.
 * Produces small (<100KB), crisp, text-selectable PDFs.
 */

const DIM_LABELS = {
  distinctiveness: { name: 'Distinctiveness', desc: 'Generic to Fanciful spectrum' },
  registrability: { name: 'Registrability', desc: 'Likelihood of successful TM registration' },
  conflict_risk: { name: 'Conflict Risk', desc: 'Existing marks in same/adjacent categories' },
  phonetic_conflicts: { name: 'Phonetic Conflicts', desc: 'Sound-alike confusion risk' },
  cultural_safety: { name: 'Cultural & Linguistic Safety', desc: 'Cross-market meanings & associations' },
  emotional_connotation: { name: 'Emotional Connotation', desc: 'Alignment with brand positioning' },
  digital_availability: { name: 'Digital Availability', desc: 'Domain & social handle openness' },
};

const C = {
  bg: [11, 15, 20],
  cardBg: [19, 25, 32],
  panelBg: [17, 24, 32],
  analysisBg: [26, 34, 48],
  border: [36, 45, 56],
  textPrimary: [230, 237, 243],
  textSecondary: [139, 148, 158],
  textDim: [110, 118, 129],
  accent: [88, 166, 255],
  green: [34, 197, 94],
  yellow: [234, 179, 8],
  red: [239, 68, 68],
  white: [255, 255, 255],
  barBg: [30, 37, 48],
  sevHighBg: [50, 20, 20],
  sevMedBg: [50, 40, 10],
  sevLowBg: [30, 32, 38],
};

function scoreColor(s) {
  if (s >= 7) return C.green;
  if (s >= 4) return C.yellow;
  return C.red;
}

function sevColor(sev) {
  if (sev === 'HIGH') return C.red;
  if (sev === 'MEDIUM') return C.yellow;
  return C.textDim;
}

function sevBgColor(sev) {
  if (sev === 'HIGH') return C.sevHighBg;
  if (sev === 'MEDIUM') return C.sevMedBg;
  return C.sevLowBg;
}

function verdictColor(v) {
  if (v === 'GO') return C.green;
  if (v === 'CAUTION') return C.yellow;
  return C.red;
}

function verdictBg(v) {
  if (v === 'GO') return [22, 163, 74];
  if (v === 'CAUTION') return [202, 138, 4];
  return [220, 38, 38];
}

function verdictLabel(v) {
  if (v === 'GO') return 'GO';
  if (v === 'CAUTION') return 'CAUTION';
  return 'STOP';
}

function wrapText(doc, text, maxWidth) {
  if (!text) return [];
  const words = text.replace(/\n/g, ' ').split(/\s+/);
  const lines = [];
  let current = '';
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (doc.getTextWidth(test) <= maxWidth) {
      current = test;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function rr(doc, x, y, w, h, r, fillColor, strokeColor) {
  if (fillColor) doc.setFillColor(...fillColor);
  if (strokeColor) {
    doc.setDrawColor(...strokeColor);
    doc.setLineWidth(0.3);
  }
  const mode = fillColor && strokeColor ? 'FD' : fillColor ? 'F' : 'S';
  doc.roundedRect(x, y, w, h, r, r, mode);
}

/**
 * Two-pass approach: first pass calculates height, second pass draws.
 */
export async function generateNamePDF(nameResult, context) {
  const { jsPDF } = await import('jspdf');

  const PAGE_W = 210;
  const MARGIN = 12;
  const CONTENT_W = PAGE_W - 2 * MARGIN;
  const bodyX = MARGIN + 6;
  const bodyW = CONTENT_W - 12;

  // Pass 1: measure height
  const measureDoc = new jsPDF({ unit: 'mm', format: [PAGE_W, 5000] });
  const totalH = drawReport(measureDoc, nameResult, context, PAGE_W, MARGIN, CONTENT_W, bodyX, bodyW, true);

  // Pass 2: draw at exact height
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [PAGE_W, totalH + 4] });
  drawReport(doc, nameResult, context, PAGE_W, MARGIN, CONTENT_W, bodyX, bodyW, false);

  const safeName = nameResult.name.replace(/[^a-zA-Z0-9\s'-]/g, '').trim();
  doc.save(`Eddie — ${safeName}.pdf`);
}

function drawReport(doc, result, context, PAGE_W, MARGIN, CONTENT_W, bodyX, bodyW, measureOnly) {
  let y = 0;

  // Background
  if (!measureOnly) {
    doc.setFillColor(...C.bg);
    doc.rect(0, 0, PAGE_W, 5000, 'F');
  }

  // ── Header ──
  if (!measureOnly) {
    rr(doc, 0, 0, PAGE_W, 14, 0, [14, 19, 24], null);
    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.2);
    doc.line(0, 14, PAGE_W, 14);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...C.accent);
    doc.text('Eddie', MARGIN, 9.5);
    const ew = doc.getTextWidth('Eddie');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(...C.textDim);
    doc.text('TRADEMARK NAME VETTER', MARGIN + ew + 4, 9);
    doc.text('BY OMFGCO', PAGE_W - MARGIN - doc.getTextWidth('BY OMFGCO'), 9);
  }
  y = 18;

  // ── Context panel ──
  const ctxH = 34;
  if (!measureOnly) {
    rr(doc, MARGIN, y, CONTENT_W, ctxH, 2, C.panelBg, C.border);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5);
    doc.setTextColor(...C.accent);
    doc.text('ANALYSIS CONTEXT', MARGIN + 5, y + 5.5);

    doc.setFontSize(6);
    const ctxY = y + 10;
    const col2 = MARGIN + CONTENT_W / 2;

    const ctxPairs = [
      [MARGIN + 5, ctxY, 'Industry:', context.industry || ''],
      [col2, ctxY, 'Description:', context.description || ''],
      [MARGIN + 5, ctxY + 5.5, 'Scope:', context.geoScope || ''],
      [col2, ctxY + 5.5, 'Positioning:', context.positioning || ''],
    ];

    for (const [cx, cy, label, val] of ctxPairs) {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...C.textDim);
      doc.text(label, cx, cy);
      const lw = doc.getTextWidth(label + ' ');
      doc.setTextColor(...C.textSecondary);
      doc.text(val.substring(0, 50), cx + lw, cy);
    }

    doc.setTextColor(...C.textDim);
    doc.text('Nice Classes:', MARGIN + 5, ctxY + 11);
    doc.setTextColor(...C.textSecondary);
    const ncText = (context.niceClasses || []).join(' \u00B7 ') || '';
    doc.text(ncText.substring(0, 120), MARGIN + 5 + doc.getTextWidth('Nice Classes: '), ctxY + 11);

    if (context.additionalContext) {
      doc.setTextColor(...C.textDim);
      doc.text('Additional:', MARGIN + 5, ctxY + 16.5);
      doc.setTextColor(...C.textSecondary);
      const addLines = wrapText(doc, context.additionalContext, CONTENT_W - 35);
      addLines.slice(0, 2).forEach((line, i) =>
        doc.text(line, MARGIN + 5 + doc.getTextWidth('Additional: '), ctxY + 16.5 + i * 3.5)
      );
    }
  }
  y += ctxH + 6;

  // ── Card header ──
  const cardStartY = y;

  // We'll draw the card background after we know the full height
  if (!measureOnly) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...C.textPrimary);
  }

  // Skip card bg for now, draw header content
  const headerY = y;
  y += 14; // card header height

  if (!measureOnly) {
    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.2);
    doc.line(MARGIN, headerY + 12, MARGIN + CONTENT_W, headerY + 12);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...C.textPrimary);
    doc.text(result.name, MARGIN + 6, headerY + 8.5);

    const nameW = doc.getTextWidth(result.name);
    const vLabel = verdictLabel(result.verdict);
    doc.setFontSize(5.5);
    const vbW = doc.getTextWidth(vLabel) + 6;
    rr(doc, MARGIN + 6 + nameW + 4, headerY + 3.5, vbW, 7, 1.5, verdictBg(result.verdict), null);
    doc.setTextColor(...C.white);
    doc.text(vLabel, MARGIN + 6 + nameW + 7, headerY + 8);

    const avg = result.scores
      ? (Object.values(result.scores).reduce((s, v) => s + v.score, 0) / Object.keys(result.scores).length).toFixed(1)
      : '';
    doc.setFont('courier', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(...C.textSecondary);
    doc.text(`avg ${avg}/10`, MARGIN + 6 + nameW + vbW + 8, headerY + 8);
  }

  // ── Verdict summary ──
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  const summaryLines = wrapText(doc, result.verdict_summary || '', bodyW - 8);
  const summaryH = summaryLines.length * 4 + 6;

  if (!measureOnly) {
    rr(doc, bodyX, y + 2, bodyW, summaryH, 1.5, C.analysisBg, null);
    doc.setDrawColor(...verdictColor(result.verdict));
    doc.setLineWidth(0.8);
    doc.line(bodyX, y + 3.5, bodyX, y + 2 + summaryH - 1.5);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(...C.textSecondary);
    summaryLines.forEach((line, i) => doc.text(line, bodyX + 5, y + 6.5 + i * 4));
  }
  y += summaryH + 7;

  // ── Scorecard ──
  if (!measureOnly) {
    doc.setFont('courier', 'bold');
    doc.setFontSize(5);
    doc.setTextColor(...C.textSecondary);
    doc.text('SCORECARD', bodyX, y + 2);
  }
  y += 6;

  if (result.scores) {
    for (const [key, meta] of Object.entries(DIM_LABELS)) {
      const val = result.scores[key];
      if (!val) continue;

      if (!measureOnly) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(...C.textPrimary);
        doc.text(meta.name, bodyX, y + 2);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(5);
        doc.setTextColor(...C.textDim);
        doc.text(meta.desc, bodyX, y + 5.5);

        // Bar
        const barX = bodyX + 55;
        const barW = 32;
        const barH = 2;
        rr(doc, barX, y + 1.5, barW, barH, 1, C.barBg, null);
        const fillW = barW * (val.score / 10);
        if (fillW > 0) rr(doc, barX, y + 1.5, fillW, barH, 1, scoreColor(val.score), null);

        doc.setFont('courier', 'bold');
        doc.setFontSize(6);
        doc.setTextColor(...scoreColor(val.score));
        doc.text(String(val.score), barX + barW + 3, y + 3);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(5.5);
        doc.setTextColor(...C.textSecondary);
        doc.text(val.label.substring(0, 65), barX + barW + 10, y + 3);
      }
      y += 9;
    }
  }
  y += 4;

  // ── Conflicts ──
  if (result.conflicts_found?.length > 0) {
    if (!measureOnly) {
      doc.setFont('courier', 'bold');
      doc.setFontSize(5);
      doc.setTextColor(...C.textSecondary);
      doc.text(`CONFLICTS FOUND (${result.conflicts_found.length})`, bodyX, y + 2);
    }
    y += 7;

    for (const conflict of result.conflicts_found) {
      const sc = sevColor(conflict.severity);
      const sbg = sevBgColor(conflict.severity);

      if (!measureOnly) {
        // Severity badge
        doc.setFont('courier', 'bold');
        doc.setFontSize(4.5);
        const sevW = doc.getTextWidth(conflict.severity) + 4;
        rr(doc, bodyX, y, sevW + 2, 5.5, 1, sbg, null);
        doc.setTextColor(...sc);
        doc.text(conflict.severity, bodyX + 2, y + 3.8);

        // Name
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(...C.textPrimary);
        doc.text(conflict.name || '', bodyX + 18, y + 4);
      }
      y += 7;

      const catText = [conflict.category, conflict.url].filter(Boolean).join(' \u00B7 ');
      if (catText) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(5.5);
        const catLines = wrapText(doc, catText, bodyW - 20);
        if (!measureOnly) {
          doc.setTextColor(...C.textDim);
          catLines.forEach((line, i) => doc.text(line, bodyX + 18, y + i * 3.5));
        }
        y += catLines.length * 3.5 + 1;
      }

      if (conflict.notes) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6);
        const noteLines = wrapText(doc, conflict.notes, bodyW - 20);
        if (!measureOnly) {
          doc.setTextColor(...C.textSecondary);
          noteLines.forEach((line, i) => doc.text(line, bodyX + 18, y + i * 3.5));
        }
        y += noteLines.length * 3.5 + 2;
      }
      y += 3;
    }
  }
  y += 3;

  // ── Analysis ──
  if (result.analysis) {
    if (!measureOnly) {
      doc.setFont('courier', 'bold');
      doc.setFontSize(5);
      doc.setTextColor(...C.textSecondary);
      doc.text('DETAILED ANALYSIS', bodyX, y + 2);
    }
    y += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    const paragraphs = result.analysis.split(/\n\n+/);
    for (const para of paragraphs) {
      const lines = wrapText(doc, para.trim(), bodyW - 4);
      if (!measureOnly) {
        doc.setTextColor(...C.textSecondary);
        lines.forEach((line, i) => doc.text(line, bodyX + 2, y + i * 3.8));
      }
      y += lines.length * 3.8 + 4;
    }
  }
  y += 6;

  // ── Disclaimer ──
  const discText = 'This analysis uses AI-powered web search and should not be treated as legal advice. A GO verdict means no obvious conflicts were found \u2014 it does not guarantee registrability. Always conduct a formal trademark search through a qualified attorney before filing.';
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  const discLines = wrapText(doc, discText, CONTENT_W - 12);
  const discH = discLines.length * 3.2 + 8;

  if (!measureOnly) {
    rr(doc, MARGIN, y, CONTENT_W, discH, 2, C.panelBg, C.border);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.5);
    doc.setTextColor(...C.textSecondary);
    doc.text('Disclaimer:', MARGIN + 5, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C.textDim);
    discLines.forEach((line, i) => doc.text(line, MARGIN + 5, y + 5 + (i + 1) * 3.2));
  }
  y += discH + 4;

  // ── Draw card background (behind everything) ──
  if (!measureOnly) {
    // We draw the card bg as the bottom layer by using the known height
    const cardH = y - cardStartY - discH - 10;
    // Unfortunately jsPDF doesn't support z-ordering, so we drew content over bg.
    // The card bg was skipped — we rely on the page bg. This is fine for the dark theme.
  }

  return y;
}
