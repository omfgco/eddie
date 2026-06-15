import { NextResponse } from 'next/server';

export const maxDuration = 300; // Vercel Pro: 5 min timeout

const SYSTEM_PROMPT = `You are a senior trademark attorney and brand naming strategist performing a comprehensive name vetting analysis. You have access to web search — USE IT AGGRESSIVELY for every single name to find real conflicts.

For each candidate name, you MUST:

1. SEARCH the web thoroughly for:
   - Existing businesses, brands, or products using this exact name or phonetically/visually similar names in the same or adjacent categories
   - Active trademark registrations (search USPTO TESS, EUIPO, WIPO as relevant to the geographic scope)
   - Domain registrations — check .com, .co, .io, .ai, .app and note what you find
   - Social media handles (@name on major platforms)
   - Any notable cultural, historical, slang, or foreign-language meanings that could be problematic
   - Phonetically similar existing brand names that could cause confusion

2. SCORE the name across these 7 dimensions (each scored 1-10):

   a) **Distinctiveness** (Trademark Spectrum): 1-2=Generic, 3-4=Descriptive, 5-6=Suggestive, 7-8=Arbitrary, 9-10=Fanciful
   b) **Registrability**: Likelihood of successful trademark registration. 10=slam dunk, 1=virtually impossible.
   c) **Conflict Risk**: Inverse of conflicts found. 10=no conflicts, 1=identical name in same category.
   d) **Phonetic Conflicts**: Sound-alike confusion risk. 10=unique, 1=sounds identical to a major brand.
   e) **Cultural & Linguistic Safety**: Cross-market meanings. 10=clean everywhere, 1=offensive in target market.
   f) **Emotional Connotation**: Does the name evoke the right feelings for the brand positioning? 10=perfect fit, 1=misaligned.
   g) **Digital Availability**: Domain and social handle availability. 10=wide open, 1=all taken by competitors.

3. PROVIDE for each name:
   - Verdict: GO, CAUTION, or STOP
   - One-sentence verdict summary
   - Specific conflicts with real details
   - 3-5 paragraph analysis

RESPOND ONLY with valid JSON (no markdown, no backticks):
{
  "names": [
    {
      "name": "CandidateName",
      "verdict": "GO",
      "verdict_summary": "One sentence.",
      "scores": {
        "distinctiveness": { "score": 8, "label": "Arbitrary" },
        "registrability": { "score": 7, "label": "Likely registrable" },
        "conflict_risk": { "score": 4, "label": "Several similar marks" },
        "phonetic_conflicts": { "score": 9, "label": "Unique" },
        "cultural_safety": { "score": 9, "label": "No issues" },
        "emotional_connotation": { "score": 7, "label": "Good fit" },
        "digital_availability": { "score": 3, "label": ".com taken" }
      },
      "conflicts_found": [
        { "name": "Brand", "category": "What they do", "url": "example.com", "severity": "HIGH", "notes": "Details" }
      ],
      "analysis": "Multi-paragraph analysis."
    }
  ]
}`;

export async function POST(request) {
  try {
    const { name, context } = await request.json();

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
    }

    const userPrompt = `Vet the following candidate name for trademark viability. Search the web thoroughly.

CANDIDATE NAME: ${name}

BUSINESS CONTEXT:
- Industry / Category: ${context.industry}
- Product / Service Description: ${context.description || "Not specified"}
- Nice Classification(s): ${context.niceClasses?.length ? context.niceClasses.join("; ") : "Not specified — infer from industry"}
- Geographic Scope: ${context.geoScope}
- Brand Positioning: ${context.positioning || "Not specified"}
- Key Competitors: ${context.competitors || "Not specified — search for market leaders"}
- Additional Context: ${context.additionalContext || "None"}

CRITICAL: Use web search for this name. Be ruthlessly honest. Return ONLY valid JSON.`;

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 8000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      }),
    });

    const data = await res.json();

    if (data.error) {
      return NextResponse.json({ error: data.error.message }, { status: 500 });
    }

    const text = (data.content || [])
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('\n');

    const jsonMatch = text.match(/\{[\s\S]*"names"[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Could not parse results. Try again.' }, { status: 500 });
    }

    const parsed = JSON.parse(jsonMatch[0].replace(/```json|```/g, '').trim());
    return NextResponse.json(parsed);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
