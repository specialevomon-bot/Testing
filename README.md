# RBX Finder X

A responsive Roblox public-presence lookup website.

## Deploy

This project is designed for Vercel (Node.js serverless API + static frontend).

1. Import this GitHub repository into Vercel.
2. Deploy with the default settings. No environment variables are required.
3. Open the generated Vercel URL.

## Run locally

Requires Node.js 18+ and Vercel CLI:

```bash
npm install -g vercel
vercel dev
```

## What it can show

- Roblox username and numeric user ID
- Public presence state (Offline, Online, In Game, Studio)
- Place ID, root place ID, universe ID, when Roblox returns them
- Experience title and creator, when public metadata can be resolved
- Job ID and a join deep-link only when Roblox supplies the actual server instance ID

## Privacy and reliability

RBX Finder X uses Roblox's public username, presence, universe and game metadata endpoints. Roblox may omit presence fields based on privacy settings or API behavior. The app does not bypass privacy controls, scrape private data, guess Job IDs, or claim a server is joinable when Roblox has not supplied a valid instance ID.

The project is independent and is not affiliated with Roblox Corporation.
