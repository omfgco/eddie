/**
 * Generates a single-scroll vector PDF for one name result.
 * Uses jsPDF drawing primitives — text, rects, lines. No rasterization.
 * Produces small (<100KB), crisp, text-selectable PDFs.
 */

// OMFGCO dice mark, embedded as a base64 PNG so the PDF is fully self-contained.
// White artwork matted onto the header colour [14,19,24] rather than kept on
// transparency — avoids a jsPDF soft mask and keeps the file small.
const OMFGCO_LOGO = 'data:image/png;base64,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';
const LOGO_ASPECT = 72.6 / 39.3; // from the source SVG viewBox

const DIM_LABELS = {
  blocking_risk: { name: 'Blocking Risk', desc: 'Direct hits only - crowded field excluded' },
  registrability_path: { name: 'Registrability Path', desc: 'Is there a viable route to ownership' },
  ownability: { name: 'Ownability', desc: 'Can distinctive equity be built around it' },
  cultural_safety: { name: 'Cultural & Linguistic Safety', desc: 'Cross-market meanings & associations' },
  confusion_proximity: { name: 'Confusion Proximity', desc: 'Sight / sound / meaning near-misses' },
  positioning_fit: { name: 'Positioning Fit', desc: 'Alignment with brand positioning' },
  digital_availability: { name: 'Digital Availability', desc: 'Domain & social handle openness' },
};

// Core dimensions drive the weighted score & verdict; reported dims are shown
// for context and excluded from the weighted average.
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
  orange: [249, 115, 22],
  notesBg: [18, 32, 46],
  notesBorder: [28, 58, 92],
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
  if (v === 'PRESENT') return C.green;
  if (v === 'PRESENT_WITH_FLAGS') return C.yellow;
  if (v === 'INTERNAL_ONLY') return C.orange;
  return C.red;
}

function verdictBg(v) {
  if (v === 'PRESENT') return [22, 163, 74];
  if (v === 'PRESENT_WITH_FLAGS') return [202, 138, 4];
  if (v === 'INTERNAL_ONLY') return [234, 88, 12];
  return [220, 38, 38];
}

function verdictLabel(v) {
  if (v === 'PRESENT') return 'PRESENT';
  if (v === 'PRESENT_WITH_FLAGS') return 'PRESENT WITH FLAGS';
  if (v === 'INTERNAL_ONLY') return 'INTERNAL ONLY';
  return 'DEAD';
}

function densityColor(a) {
  if (a === 'CLEAR') return C.green;
  if (a === 'MODERATE') return C.yellow;
  return C.orange;
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
  // compress: true deflates the content streams — without it jsPDF stores the
  // embedded logo as raw pixel data and the file balloons past 250KB.
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [PAGE_W, totalH + 4], compress: true });
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

    // OMFGCO dice mark, right-aligned in the header band
    const logoH = 8.5;
    const logoW = logoH * LOGO_ASPECT;
    const logoX = PAGE_W - MARGIN - logoW;
    const logoY = (14 - logoH) / 2;
    try {
      doc.addImage(OMFGCO_LOGO, 'PNG', logoX, logoY, logoW, logoH);
      const byW = doc.getTextWidth('BY');
      doc.text('BY', logoX - byW - 3, 9);
    } catch (e) {
      // If image embedding fails for any reason, fall back to the wordmark
      doc.text('BY OMFGCO', PAGE_W - MARGIN - doc.getTextWidth('BY OMFGCO'), 9);
    }
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

    const avg = weightedAvg(result.scores) ?? '';
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

  // ── Client Conversation Notes ──
  if (result.client_notes) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    const noteLines = wrapText(doc, result.client_notes, bodyW - 10);
    const notesH = noteLines.length * 4 + 11;

    if (!measureOnly) {
      rr(doc, bodyX, y, bodyW, notesH, 2, C.notesBg, C.notesBorder);
      doc.setFont('courier', 'bold');
      doc.setFontSize(5);
      doc.setTextColor(...C.accent);
      doc.text('CLIENT CONVERSATION NOTES', bodyX + 5, y + 5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(...C.textPrimary);
      noteLines.forEach((line, i) => doc.text(line, bodyX + 5, y + 10 + i * 4));
    }
    y += notesH + 6;
  }

  // ── Flags: Say This Out Loud ──
  if (result.flags?.length > 0) {
    if (!measureOnly) {
      doc.setFont('courier', 'bold');
      doc.setFontSize(5);
      doc.setTextColor(...C.textSecondary);
      doc.text(`SAY THIS OUT LOUD (${result.flags.length})`, bodyX, y + 2);
    }
    y += 7;

    for (const flag of result.flags) {
      const fc = sevColor(flag.severity);
      const fbg = sevBgColor(flag.severity);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      const issueLines = wrapText(doc, flag.issue || '', bodyW - 30);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      const mitLines = flag.mitigation
        ? wrapText(doc, `Path forward: ${flag.mitigation}`, bodyW - 30)
        : [];
      const flagH = issueLines.length * 4 + mitLines.length * 3.5 + (mitLines.length ? 3 : 0) + 7;

      if (!measureOnly) {
        rr(doc, bodyX, y, bodyW, flagH, 1.5, C.analysisBg, null);
        doc.setFillColor(...fc);
        doc.rect(bodyX, y, 0.8, flagH, 'F');

        doc.setFont('courier', 'bold');
        doc.setFontSize(4.5);
        const sevW = doc.getTextWidth(flag.severity || '') + 4;
        rr(doc, bodyX + 4, y + 2.5, sevW + 2, 5, 1, fbg, null);
        doc.setTextColor(...fc);
        doc.text(flag.severity || '', bodyX + 6, y + 6);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(...C.textPrimary);
        issueLines.forEach((line, i) => doc.text(line, bodyX + 10 + sevW, y + 6 + i * 4));

        if (mitLines.length) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(6);
          doc.setTextColor(...C.textSecondary);
          const mitY = y + 6 + issueLines.length * 4 + 2;
          mitLines.forEach((line, i) => doc.text(line, bodyX + 5, mitY + i * 3.5));
        }
      }
      y += flagH + 3;
    }
    y += 3;
  }

  // ── Field Density ──
  if (result.field_density) {
    const fd = result.field_density;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    const interpLines = wrapText(doc, fd.interpretation || '', bodyW - 10);
    const fdH = interpLines.length * 3.5 + 12;

    if (!measureOnly) {
      rr(doc, bodyX, y, bodyW, fdH, 2, C.panelBg, C.border);

      doc.setFont('courier', 'bold');
      doc.setFontSize(5);
      doc.setTextColor(...C.textSecondary);
      doc.text('FIELD DENSITY', bodyX + 5, y + 5);
      const fdw = doc.getTextWidth('FIELD DENSITY');

      const dc = densityColor(fd.assessment);
      doc.setFontSize(4.5);
      const aw = doc.getTextWidth(fd.assessment || '') + 4;
      rr(doc, bodyX + 5 + fdw + 4, y + 1.5, aw + 2, 5, 1, C.analysisBg, null);
      doc.setTextColor(...dc);
      doc.text(fd.assessment || '', bodyX + 7 + fdw + 4, y + 5);

      if (typeof fd.count === 'number') {
        doc.setFont('courier', 'normal');
        doc.setFontSize(5.5);
        doc.setTextColor(...C.textDim);
        doc.text(`${fd.count} similar marks`, bodyX + 5 + fdw + aw + 12, y + 5);
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(...C.textSecondary);
      interpLines.forEach((line, i) => doc.text(line, bodyX + 5, y + 10 + i * 3.5));
    }
    y += fdH + 6;
  }

  // ── Scorecard ──
  if (!measureOnly) {
    doc.setFont('courier', 'bold');
    doc.setFontSize(5);
    doc.setTextColor(...C.textSecondary);
    doc.text('SCORECARD', bodyX, y + 2);
  }
  y += 6;

  if (result.scores) {
    for (const key of Object.keys(CORE_WEIGHTS)) {
      const meta = DIM_LABELS[key];
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

  // ── Context dims (excluded from weighted average / verdict) ──
  const bonusEntries = REPORTED_DIMS.filter(k => result.scores?.[k]);
  if (bonusEntries.length > 0) {
    if (!measureOnly) {
      doc.setFont('courier', 'bold');
      doc.setFontSize(5);
      doc.setTextColor(...C.textSecondary);
      doc.text('CONTEXT', bodyX, y + 2);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5);
      doc.setTextColor(...C.textDim);
      doc.text('not factored into score or verdict', bodyX + doc.getTextWidth('CONTEXT ') + 14, y + 2);
    }
    y += 6;

    for (const key of bonusEntries) {
      const meta = DIM_LABELS[key];
      const val = result.scores[key];
      if (!measureOnly) {
        const color = scoreColor(val.score);
        rr(doc, bodyX, y - 3.5, bodyW, 8, 1.5, C.analysisBg, null);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(...C.textPrimary);
        doc.text(meta.name, bodyX + 4, y + 1.5);

        doc.setFont('courier', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(...color);
        doc.text(`${val.score}/10`, bodyX + 65, y + 1.5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(5.5);
        doc.setTextColor(...C.textSecondary);
        doc.text(val.label.substring(0, 60), bodyX + 82, y + 1.5);
      }
      y += 8;
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
        // Type badge (BLOCKING / FRICTION)
        doc.setFont('courier', 'bold');
        doc.setFontSize(4.5);
        let cursorX = bodyX;
        if (conflict.type) {
          const tcol = conflict.type === 'BLOCKING' ? C.red : C.accent;
          const typeW = doc.getTextWidth(conflict.type) + 4;
          rr(doc, cursorX, y, typeW + 2, 5.5, 1, C.analysisBg, null);
          doc.setTextColor(...tcol);
          doc.text(conflict.type, cursorX + 2, y + 3.8);
          cursorX += typeW + 4;
        }

        // Severity badge
        const sevW = doc.getTextWidth(conflict.severity) + 4;
        rr(doc, cursorX, y, sevW + 2, 5.5, 1, sbg, null);
        doc.setTextColor(...sc);
        doc.text(conflict.severity, cursorX + 2, y + 3.8);

        // Name
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(...C.textPrimary);
        doc.text(conflict.name || '', bodyX, y + 10);
      }
      y += 13;

      const catText = [conflict.category, conflict.url].filter(Boolean).join(' \u00B7 ');
      if (catText) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(5.5);
        const catLines = wrapText(doc, catText, bodyW - 4);
        if (!measureOnly) {
          doc.setTextColor(...C.textDim);
          catLines.forEach((line, i) => doc.text(line, bodyX, y + i * 3.5));
        }
        y += catLines.length * 3.5 + 1;
      }

      if (conflict.notes) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6);
        const noteLines = wrapText(doc, conflict.notes, bodyW - 4);
        if (!measureOnly) {
          doc.setTextColor(...C.textSecondary);
          noteLines.forEach((line, i) => doc.text(line, bodyX, y + i * 3.5));
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
  const discText = 'This is a knockout screen, not a clearance search. It uses AI-powered web search and should not be treated as legal advice. Pending applications, state registrations, and most common-law rights are not visible to web search. A PRESENT verdict means no obvious blockers surfaced \u2014 it does not mean the name is cleared. Always conduct a formal trademark search through a qualified attorney before filing or committing a client to a name.';
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
