import { NextResponse } from 'next/server';

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
  "42 - Science & Technology","43 - Food Services","44 - Medical & Beauty Services",
  "45 - Legal & Security Services"
];

const SYSTEM = `You are a trademark classification expert. Given a business description, recommend relevant Nice Classification classes.
Return ONLY valid JSON:
{
  "recommendations": [
    { "class_code": "43 - Food Services", "priority": "ESSENTIAL", "rationale": "Why." }
  ]
}
Rules:
- priority: ESSENTIAL, RECOMMENDED, or CONSIDER
- class_code must exactly match: ${NICE_CLASSES.map(c => `"${c}"`).join(", ")}
- Only recommend genuinely applicable classes. Order by priority.`;

export async function POST(request) {
  try {
    const { description } = await request.json();
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'API key not configured' }, { status: 500 });

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system: SYSTEM,
        messages: [{ role: 'user', content: `Business: ${description}` }],
      }),
    });

    const data = await res.json();
    if (data.error) return NextResponse.json({ error: data.error.message }, { status: 500 });

    const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n');
    const match = text.match(/\{[\s\S]*"recommendations"[\s\S]*\}/);
    if (!match) return NextResponse.json({ error: 'Parse error' }, { status: 500 });

    return NextResponse.json(JSON.parse(match[0].replace(/```json|```/g, '').trim()));
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
