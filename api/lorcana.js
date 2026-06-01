// api/lorcana.js — Vercel Serverless Function
// Proxies requests to LorcanaJSON and TCGCSV server-side to avoid CORS errors.
//
// Routes (via ?route= query param):
//   ?route=cards               → LorcanaJSON allCards.json
//   ?route=groups              → TCGCSV Lorcana set groups
//   ?route=products&groupId=N  → TCGCSV product list for a set (name → productId mapping)
//   ?route=prices&groupId=N    → TCGCSV prices for a specific set group

const LORCANA_JSON_BASE = "https://lorcanajson.org/files/current/en";
const TCGCSV_BASE       = "https://tcgcsv.com/tcgplayer/71";

export default async function handler(req, res) {
  // Allow GET only
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { route, groupId } = req.query;

  // ── CORS headers ───────────────────────────────────────────────────────────
  res.setHeader("Access-Control-Allow-Origin",  "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Preflight
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    let upstreamUrl;

    switch (route) {
      case "cards":
        upstreamUrl = `${LORCANA_JSON_BASE}/allCards.json`;
        break;

      case "groups":
        upstreamUrl = `${TCGCSV_BASE}/groups`;
        break;

      // NEW: fetch product list so App.jsx can join prices by card name
      // when LorcanaJSON cards don't have a tcgPlayerId
      case "products":
        if (!groupId) {
          return res.status(400).json({ error: "groupId is required for route=products" });
        }
        upstreamUrl = `${TCGCSV_BASE}/${groupId}/products`;
        break;

      case "prices":
        if (!groupId) {
          return res.status(400).json({ error: "groupId is required for route=prices" });
        }
        upstreamUrl = `${TCGCSV_BASE}/${groupId}/prices`;
        break;

      default:
        return res.status(400).json({
          error: `Unknown route: "${route}". Use cards | groups | products | prices`,
        });
    }

    const upstream = await fetch(upstreamUrl, {
      headers: {
        "User-Agent": "LorcanaDeals/1.0 (lorcana-deals.vercel.app)",
        "Accept":     "application/json",
      },
    });

    if (!upstream.ok) {
      return res.status(upstream.status).json({
        error: `Upstream returned ${upstream.status}`,
        url:   upstreamUrl,
      });
    }

    const data = await upstream.json();

    // Cache 10 min on Vercel CDN, serve stale for 60 s while revalidating
    res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate=60");
    return res.status(200).json(data);

  } catch (err) {
    console.error("[api/lorcana] fetch failed:", err);
    return res.status(500).json({ error: "Proxy fetch failed", detail: err.message });
  }
}
