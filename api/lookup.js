const USER_LOOKUP = "https://users.roblox.com/v1/usernames/users";
const PRESENCE = "https://presence.roblox.com/v1/presence/users";
const UNIVERSE_FROM_PLACE = "https://apis.roblox.com/universes/v1/places/";
const GAME_DETAILS = "https://games.roblox.com/v1/games";

async function robloxJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", "User-Agent": "RBX-Finder-X/1.0", ...(options.headers || {}) }
  });
  if (!response.ok) throw new Error(`Roblox returned HTTP ${response.status}`);
  return response.json();
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST." });

  try {
    const username = String(req.body?.username || "").trim();
    if (!username || username.length > 20 || !/^[A-Za-z0-9_]+$/.test(username)) {
      return res.status(400).json({ error: "Enter a valid Roblox username." });
    }

    const lookup = await robloxJson(USER_LOOKUP, {
      method: "POST",
      body: JSON.stringify({ usernames: [username], excludeBannedUsers: false })
    });
    const user = lookup.data?.[0];
    if (!user) return res.status(404).json({ error: "Roblox username not found." });

    const presenceResponse = await robloxJson(PRESENCE, {
      method: "POST",
      body: JSON.stringify({ userIds: [user.id] })
    });
    const p = presenceResponse.userPresences?.[0] || {};
    const presenceType = Number(p.userPresenceType ?? 0);
    const result = {
      user: { id: user.id, name: user.name, displayName: user.displayName },
      presenceType,
      status: ["Offline", "Online", "In Game", "In Studio"][presenceType] || "Unknown",
      lastLocation: p.lastLocation || null,
      placeId: p.placeId || null,
      rootPlaceId: p.rootPlaceId || null,
      universeId: p.universeId || null,
      gameId: p.gameId || null,
      experienceName: null,
      creatorName: null,
      joinUrl: null,
      note: null
    };

    const placeId = result.rootPlaceId || result.placeId;
    if (placeId) {
      try {
        const universe = await robloxJson(UNIVERSE_FROM_PLACE + encodeURIComponent(placeId) + "/universe");
        result.universeId = result.universeId || universe.universeId || null;
      } catch (_) {}
    }
    if (result.universeId) {
      try {
        const details = await robloxJson(GAME_DETAILS + "?universeIds=" + encodeURIComponent(result.universeId));
        const game = details.data?.[0];
        if (game) {
          result.experienceName = game.name || null;
          result.creatorName = game.creator?.name || null;
          result.gameRootPlaceId = game.rootPlaceId || null;
        }
      } catch (_) {}
    }
    if (result.placeId && result.gameId) {
      result.joinUrl = "roblox://experiences/start?placeId=" +
        encodeURIComponent(result.placeId) + "&gameInstanceId=" + encodeURIComponent(result.gameId);
    }
    if (presenceType === 2 && !result.gameId) {
      result.note = "Roblox confirms this user is in an experience, but did not return a server instance ID. This tool cannot reveal IDs Roblox withholds.";
    } else if (presenceType === 0) {
      result.note = "Roblox currently reports this account as offline.";
    } else if (presenceType === 1) {
      result.note = "The account is online, but Roblox is not exposing an active experience.";
    } else if (presenceType === 3) {
      result.note = "Roblox reports this account is using Roblox Studio.";
    }
    return res.status(200).json(result);
  } catch (error) {
    return res.status(502).json({ error: error.message || "Could not retrieve Roblox presence right now." });
  }
}
