# Eddie Vetter — Trademark Intelligence Engine

AI-powered trademark name vetting tool. Enter candidate names, get detailed conflict analysis with scores across 7 dimensions, and download individual PDF reports per name.

## Quick Setup (5 minutes)

### 1. Get an Anthropic API Key
- Go to [console.anthropic.com](https://console.anthropic.com/)
- Create an account and generate an API key
- You'll need credit on the account (the tool uses Claude Sonnet with web search)

### 2. Deploy to Vercel (Easiest)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. Push this project to a GitHub repository
2. Go to [vercel.com](https://vercel.com) and sign up (free)
3. Click "Import Project" → select your GitHub repo
4. In the **Environment Variables** section, add:
   - Key: `ANTHROPIC_API_KEY`
   - Value: your API key from step 1
5. Click **Deploy**
6. Done! You'll get a URL like `eddie-vetter.vercel.app`

### 3. Run Locally (Alternative)

```bash
# Clone and install
git clone <your-repo-url>
cd eddie-vetter-app
npm install

# Add your API key
cp .env.example .env.local
# Edit .env.local and paste your key

# Run
npm run dev
# Open http://localhost:3000
```

## How It Works

1. **Input** — Enter candidate names, industry, geographic scope, brand positioning, and Nice classes
2. **Analysis** — Each name is sent individually to Claude Sonnet with web search enabled. The server-side API route handles the call (no browser timeout issues).
3. **Results** — Client conversation notes, flags with mitigation paths, field density, scores across 5 weighted dimensions, conflicts tagged BLOCKING or FRICTION, and detailed analysis
4. **Download** — Click the "↓ PDF" button on any name card to download a single-scroll dark-theme PDF report for that name

## What Eddie Is (and Isn't)

Eddie is a **knockout screen**, not a clearance search. It answers "is this name worth presenting to the client, and what should we say about it?" — not "is this name legally clear?" Pending applications, state registrations, and most common-law rights are invisible to web search.

Intended workflow:

```
60 candidates → Eddie → 10-12 survivors → attorney knockout search → 3-4 → full clearance → file
```

## Verdicts

| Verdict | Meaning |
|---|---|
| **PRESENT** | Put it in the deck. No caveats required. |
| **PRESENT WITH FLAGS** | Show it — say the flags out loud before the client falls in love. Most common verdict. |
| **INTERNAL ONLY** | Don't lead with it. Real problems with a real path. |
| **DEAD** | Genuine blocker. |

DEAD is reserved for true blocking hits. Crowded fields, geographic descriptiveness, adjacent-class marks, and unavailable domains never produce a DEAD verdict.

## Scoring Dimensions

**Core (weighted, drives the verdict)** — weighted average divisor is 12:

| Dimension | Weight | What It Measures |
|-----------|--------|-------------------|
| Blocking Risk | 4× | Direct hits only — a crowded field does *not* lower this |
| Registrability Path | 3× | Whether a viable route to ownership exists |
| Ownability | 2× | Whether distinctive equity can be built around the name |
| Cultural & Linguistic Safety | 2× | Cross-market meanings and associations |
| Confusion Proximity | 1× | Sight / sound / meaning near-misses |

**Reported (context only — excluded from the score and verdict):**

| Dimension | What It Measures |
|-----------|-------------------|
| Positioning Fit | Alignment with stated brand positioning |
| Digital Availability | Domain and social handle openness |

## The Crowded Field Rule

When 10+ similar marks coexist in the target class, that's evidence of a **weak, diluted field** — individual marks are narrow and coexistence is normal. A crowded field *lowers* blocking risk and *lowers* ownability. Forty SUMMIT marks in Class 43 means the name is hard to own, not that it's dead.

## Client Conversation Notes

Every non-DEAD name gets plain-language notes a strategist can say out loud in a client meeting, plus flags with concrete mitigation paths (composite/design filing, narrowed goods description, Supplemental Register runway, coexistence agreement, geographic restriction). These appear at the top of the card and the PDF — above the scorecard — so a risk is legible at the moment of presentation.

## Notes

- **API costs**: Each name analysis uses ~1-2 Claude Sonnet calls with web search. Estimate ~$0.10-0.30 per name.
- **Speed**: Expect 30-90 seconds per name due to web search.
- **Vercel timeout**: The free tier has a 10-second function timeout. You'll need Vercel Pro ($20/mo) for the 300-second timeout needed for web search. Alternatively, run locally with `npm run dev`.
- **Not legal advice**: This is a knockout screen, not clearance. Always follow up with a qualified trademark attorney before filing or committing a client to a name. Ensure your client agreement disclaims trademark clearance and assigns that obligation to client counsel.
