# Eddie (the vetter) — Trademark Intelligence Engine

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
3. **Results** — Scores across 7 dimensions, real conflicts found via web search, detailed analysis, and ownability suggestions
4. **Download** — Click the "↓ PDF" button on any name card to download a single-scroll dark-theme PDF report for that name

## Scoring Dimensions

| Dimension | What It Measures |
|-----------|-----------------|
| Distinctiveness | Where the name falls on the Generic → Fanciful trademark spectrum |
| Registrability | Likelihood of successful trademark registration |
| Conflict Risk | Existing marks in same/adjacent categories |
| Phonetic Conflicts | Sound-alike confusion risk when spoken |
| Cultural & Linguistic Safety | Cross-market meanings and associations |
| Emotional Connotation | Alignment with stated brand positioning |
| Digital Availability | Domain and social handle openness |

## Notes

- **API costs**: Each name analysis uses ~1-2 Claude Sonnet calls with web search. Estimate ~$0.10-0.30 per name.
- **Speed**: Expect 30-90 seconds per name due to web search.
- **Vercel timeout**: The free tier has a 10-second function timeout. You'll need Vercel Pro ($20/mo) for the 300-second timeout needed for web search. Alternatively, run locally with `npm run dev`.
- **Not legal advice**: Always follow up with a qualified trademark attorney before filing.
