// src/App.jsx
// LorcanaDeals — lorcana-deals.vercel.app
// Data flows through /api/lorcana (Vercel serverless) to avoid CORS.

import { useState, useEffect } from "react";

// ── Affiliate helpers ────────────────────────────────────────────────────────
const IMPACT_ID      = "YOUR_IMPACT_ID";       // ← replace once Impact approves you
const AMAZON_TAG     = "YOUR_AMAZON_TAG-20";   // ← replace with your Associates tag
const TITANTOYZ_REF  = "bjtmzqnp";  // Titan Toyz goaffpro ref code

function tcgLink(tcgPlayerId, cardName = "") {
  if (tcgPlayerId) {
    return `https://tcgplayer.sjv.io/c/${IMPACT_ID}/https://www.tcgplayer.com/product/${tcgPlayerId}`;
  }
  const q = encodeURIComponent(`lorcana ${cardName}`);
  return `https://tcgplayer.sjv.io/c/${IMPACT_ID}/https://www.tcgplayer.com/search/lorcana/product?q=${q}`;
}

function amzLink(query) {
  return `https://www.amazon.com/s?k=${encodeURIComponent(query)}&tag=${AMAZON_TAG}`;
}

function titanLink(path) {
  // Titan Toyz affiliate: append ?ref=bjtmzqnp to every product URL
  return `https://titantoyz.com${path}?ref=${TITANTOYZ_REF}`;
}

// ── Proxy-backed data fetchers ───────────────────────────────────────────────
async function fetchGroups() {
  const res = await fetch("/api/lorcana?route=groups");
  if (!res.ok) throw new Error(`groups ${res.status}`);
  const json = await res.json();
  return (json.results || []).map(g => ({ groupId: g.groupId, name: g.name }));
}

async function fetchLorcanaCards() {
  const res = await fetch("/api/lorcana?route=cards");
  if (!res.ok) throw new Error(`cards ${res.status}`);
  const json = await res.json();
  const raw = Array.isArray(json) ? json : (json.cards || json.data || []);
  return raw.map(c => ({
    id:          c.id,
    name:        c.name,
    fullName:    c.fullName || c.name,
    color:       c.color || c.inkColor || c.ink || null,
    rarity:      c.rarity,
    setNumber:   c.setCode ? parseInt(c.setCode, 10) : (c.setNumber ?? null),
    images:      c.images || {},
    tcgPlayerId: c.externalLinks?.tcgPlayerId || c.tcgPlayerId || null,
  }));
}

async function fetchPricesForGroup(groupId) {
  const [priceRes, productRes] = await Promise.all([
    fetch(`/api/lorcana?route=prices&groupId=${groupId}`),
    fetch(`/api/lorcana?route=products&groupId=${groupId}`),
  ]);
  if (!priceRes.ok || !productRes.ok) return { byId: {}, byName: {} };

  const priceList   = (await priceRes.json()).results   || [];
  const productList = (await productRes.json()).results || [];

  const byId = {};
  for (const r of priceList) {
    // Keep only Normal subtype to avoid foil duplicates inflating byId
    if (!r.subTypeName || r.subTypeName === "Normal") {
      byId[r.productId] = { low: r.lowPrice, market: r.marketPrice, mid: r.midPrice };
    }
  }
  const byName = {};
  for (const p of productList) {
    const price = byId[p.productId];
    if (price) byName[p.name.toLowerCase().trim()] = price;
  }
  return { byId, byName };
}

// ── Price lookup helper ──────────────────────────────────────────────────────
function getPrice(allPrices, card) {
  if (!allPrices) return null;
  if (card.tcgPlayerId && allPrices.byId?.[card.tcgPlayerId]) {
    return allPrices.byId[card.tcgPlayerId];
  }
  if (card.fullName && allPrices.byName) {
    const exact = allPrices.byName[card.fullName.toLowerCase().trim()];
    if (exact) return exact;
    const baseName = card.fullName.split(" - ")[0].toLowerCase().trim();
    return allPrices.byName[baseName] || null;
  }
  return null;
}

// ── Constants ────────────────────────────────────────────────────────────────
const INK_COLORS = ["all","Amber","Amethyst","Emerald","Ruby","Sapphire","Steel"];

const SET_NAME_TO_NUMBER = {
  "first chapter":         1,
  "rise of the floodborn": 2,
  "into the inklands":     3,
  "ursula's return":       4,
  "shimmering skies":      5,
  "azurite sea":           6,
  "archazia":              7,
  "reign of jafar":        8,
};

function setNumberFromGroup(groupName) {
  if (!groupName) return null;
  const lower = groupName.toLowerCase();
  for (const [key, num] of Object.entries(SET_NAME_TO_NUMBER)) {
    if (lower.includes(key)) return num;
  }
  return null;
}

// Strip "Disney Lorcana" / "Disney Lorcana TCG" prefix for cleaner dropdown
function cleanGroupName(name) {
  return name.replace(/^Disney Lorcana(?: TCG)?[:\s]*/i, "").trim();
}

// ── Sealed product data ──────────────────────────────────────────────────────
// TCGplayer sealed (English booster boxes)
const TCG_SEALED = [
  { name:"The First Chapter Booster Box",     set:1, tcg:tcgLink(null,"Lorcana First Chapter Booster Box"),     amz:amzLink("Disney Lorcana First Chapter Booster Box") },
  { name:"Rise of the Floodborn Booster Box", set:2, tcg:tcgLink(null,"Lorcana Rise Floodborn Booster Box"),    amz:amzLink("Disney Lorcana Rise of the Floodborn Booster Box") },
  { name:"Into the Inklands Booster Box",     set:3, tcg:tcgLink(null,"Lorcana Into Inklands Booster Box"),     amz:amzLink("Disney Lorcana Into the Inklands Booster Box") },
  { name:"Ursula's Return Booster Box",       set:4, tcg:tcgLink(null,"Lorcana Ursulas Return Booster Box"),    amz:amzLink("Disney Lorcana Ursula's Return Booster Box") },
  { name:"Shimmering Skies Booster Box",      set:5, tcg:tcgLink(null,"Lorcana Shimmering Skies Booster Box"),  amz:amzLink("Disney Lorcana Shimmering Skies Booster Box") },
  { name:"Azurite Sea Booster Box",           set:6, tcg:tcgLink(null,"Lorcana Azurite Sea Booster Box"),       amz:amzLink("Disney Lorcana Azurite Sea Booster Box") },
  { name:"Archazia's Island Booster Box",     set:7, tcg:tcgLink(null,"Lorcana Archazia Island Booster Box"),   amz:amzLink("Disney Lorcana Archazia Island Booster Box") },
];

// Titan Toyz sealed — only in-stock or pre-order products (no sold-out)
const TITAN_SEALED = [
  {
    name: "Set 8: Reign of Jafar Booster Box",
    badge: "Pre-Order",
    price: "$179.99 CAD",
    inStock: true,
    url: titanLink("/products/disney-lorcana-set-8-reign-of-jafar-booster"),
    img: "https://titantoyz.com/cdn/shop/files/Untitleddesign-2025-04-07T195101.876.jpg",
  },
  {
    name: "Set 8: Reign of Jafar Trove",
    badge: "Pre-Order",
    price: "$59.99 CAD",
    inStock: true,
    url: titanLink("/products/disney-lorcana-set-8-reign-of-jafar-trove"),
    img: "https://titantoyz.com/cdn/shop/files/Untitleddesign-2025-04-07T194725.960.jpg",
  },
  {
    name: "Japanese Ver. — The First Chapter Box (16 packs)",
    badge: "In Stock",
    price: "$89.99 CAD",
    inStock: true,
    url: titanLink("/products/disney-lorcana-tcg-japanese-ver-booster-pack-the-first-chapter-16packs-box"),
    img: "https://titantoyz.com/cdn/shop/files/Untitled_design_75.jpg",
  },
  {
    name: "Japanese Ver. — Rise of the Floodborn Box (16 packs)",
    badge: "In Stock",
    price: "$75.99 CAD",
    inStock: true,
    url: titanLink("/products/disney-lorcana-tcg-japanese-ver-booster-pack-rise-of-the-floodborn-16packs-box"),
    img: "https://titantoyz.com/cdn/shop/files/Untitled_design_-_2025-03-21T085715.855.jpg",
  },
  {
    name: "Japanese Ver. — Into the Inklands Box",
    badge: "Sale",
    price: "$29.99 CAD",
    originalPrice: "$59.99 CAD",
    inStock: true,
    url: titanLink("/products/disney-lorcana-tcg-japanese-ver-booster-pack-into-the-inklands-box-1"),
    img: "https://titantoyz.com/cdn/shop/files/Untitleddesign-2025-04-10T232536.820.jpg",
  },
  {
    name: "Japanese Ver. — Ursula's Return Box",
    badge: "Pre-Order",
    price: "$59.99 CAD",
    inStock: true,
    url: titanLink("/products/disney-lorcana-tcg-japanese-ver-booster-pack-ursulas-return-box"),
    img: "https://titantoyz.com/cdn/shop/files/Untitleddesign-2025-05-12T095505.927.jpg",
  },
  {
    name: "Japanese Ver. — Starter Deck Rise of Floodborn (Amethyst & Steel)",
    badge: "Pre-Order",
    price: "$29.99 CAD",
    inStock: true,
    url: titanLink("/products/disney-lorcana-tcg-japanese-ver-booster-pack-rise-of-the-floodborn-16packs-box-copy"),
    img: "https://titantoyz.com/cdn/shop/files/lorcana.png",
  },
  {
    name: "Japanese Ver. — Starter Deck Rise of Floodborn (Amber & Sapphire)",
    badge: "Pre-Order",
    price: "$29.99 CAD",
    inStock: true,
    url: titanLink("/products/disney-lorcana-tcg-japanese-ver-starter-deck-rise-of-the-floodborn-amber-sapphire"),
    img: "https://titantoyz.com/cdn/shop/files/lorcana.png",
  },
  {
    name: "Japanese Ver. — Starter Deck Into the Inklands (Amber & Emerald)",
    badge: "Sale",
    price: "$10.99 CAD",
    originalPrice: "$25.99 CAD",
    inStock: true,
    url: titanLink("/products/disney-lorcana-tcg-japanese-ver-starter-deck-into-the-inklands-amber-emerald"),
    img: "https://titantoyz.com/cdn/shop/files/disney-lorcana-logo.jpg",
  },
  {
    name: "Japanese Ver. — Starter Deck Into the Inklands (Ruby & Sapphire)",
    badge: "Sale",
    price: "$10.99 CAD",
    originalPrice: "$25.99 CAD",
    inStock: true,
    url: titanLink("/products/disney-lorcana-tcg-japanese-ver-starter-deck-into-the-inklands-ruby-sapphire"),
    img: "https://titantoyz.com/cdn/shop/files/disney-lorcana-logo.jpg",
  },
];

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #0d0f14; --surface: #161920; --card-bg: #1c1f2a; --border: #2a2d3a;
    --accent: #c084fc; --accent2: #38bdf8; --gold: #fbbf24;
    --text: #e2e8f0; --muted: #6b7280; --danger: #f87171; --success: #34d399;
    --titan: #f97316;
    --radius: 10px; --font: 'Segoe UI', system-ui, sans-serif;
  }
  body { background: var(--bg); color: var(--text); font-family: var(--font); min-height: 100vh; }

  .header {
    position: sticky; top: 0; z-index: 100;
    background: rgba(13,15,20,.9); backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--border);
    padding: 0 1.5rem; display: flex; align-items: center; gap: 1.25rem; height: 64px;
  }
  .logo { font-size: 1.35rem; font-weight: 800; letter-spacing: -.5px; white-space: nowrap; }
  .logo span { color: var(--accent); }
  .search-bar {
    flex: 1; display: flex; align-items: center; gap: .5rem;
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 8px; padding: 0 .75rem; max-width: 480px;
  }
  .search-bar input { flex: 1; background: none; border: none; outline: none; color: var(--text); font-size: .95rem; padding: .5rem 0; }
  .search-icon { color: var(--muted); font-size: .9rem; }
  .nav-tabs { display: flex; gap: .25rem; }
  .nav-tab {
    background: none; border: none; color: var(--muted); cursor: pointer;
    padding: .4rem .85rem; border-radius: 6px; font-size: .88rem; font-weight: 600;
    transition: background .15s, color .15s;
  }
  .nav-tab:hover  { background: var(--surface); color: var(--text); }
  .nav-tab.active { background: var(--accent); color: #fff; }

  .hero {
    text-align: center; padding: 3.5rem 1rem 2rem;
    background: radial-gradient(ellipse 70% 40% at 50% 0%, rgba(192,132,252,.12) 0%, transparent 70%);
  }
  .hero-eyebrow { font-size: .8rem; letter-spacing: .12em; text-transform: uppercase; color: var(--accent); margin-bottom: .6rem; }
  .hero h1 { font-size: clamp(2rem, 5vw, 3.2rem); font-weight: 900; line-height: 1.1; }
  .hero p  { color: var(--muted); margin-top: .75rem; font-size: 1.05rem; }
  .status-bar { margin-top: 1rem; display: flex; justify-content: center; gap: 1rem; font-size: .78rem; color: var(--muted); }
  .status-dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: var(--success); margin-right: .35rem; }

  .filters {
    display: flex; flex-wrap: wrap; gap: .5rem;
    padding: 1rem 1.5rem; border-bottom: 1px solid var(--border); align-items: center;
  }
  .filter-label { font-size: .75rem; text-transform: uppercase; letter-spacing: .08em; color: var(--muted); margin-right: .25rem; }
  .filter-btn {
    background: var(--surface); border: 1px solid var(--border); color: var(--text);
    border-radius: 20px; padding: .3rem .8rem; font-size: .8rem; cursor: pointer;
    transition: border-color .15s, color .15s;
  }
  .filter-btn:hover  { border-color: var(--accent); }
  .filter-btn.active { border-color: var(--accent); color: var(--accent); background: rgba(192,132,252,.08); }
  .set-select {
    background: var(--surface); border: 1px solid var(--border); color: var(--text);
    border-radius: 8px; padding: .3rem .65rem; font-size: .8rem; cursor: pointer; outline: none;
  }

  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; padding: 1.25rem 1.5rem 3rem; }

  .card {
    background: var(--card-bg); border: 1px solid var(--border); border-radius: var(--radius);
    overflow: hidden; display: flex; flex-direction: column;
    transition: transform .18s, border-color .18s, box-shadow .18s;
  }
  .card:hover { transform: translateY(-3px); border-color: var(--accent); box-shadow: 0 8px 24px rgba(192,132,252,.15); }
  .card-img-wrap { aspect-ratio: 3/4; background: var(--surface); overflow: hidden; }
  .card-img-wrap img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .card-img-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 2.5rem; color: var(--border); }
  .card-body { padding: .75rem; display: flex; flex-direction: column; gap: .35rem; flex: 1; }
  .card-name { font-size: .88rem; font-weight: 700; line-height: 1.25; }
  .card-tags { display: flex; gap: .35rem; flex-wrap: wrap; }
  .tag { font-size: .66rem; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; padding: .15rem .45rem; border-radius: 4px; }
  .tag-amber    { background: rgba(251,191,36,.15);  color: #fbbf24; }
  .tag-amethyst { background: rgba(192,132,252,.15); color: #c084fc; }
  .tag-emerald  { background: rgba(52,211,153,.15);  color: #34d399; }
  .tag-ruby     { background: rgba(248,113,113,.15); color: #f87171; }
  .tag-sapphire { background: rgba(56,189,248,.15);  color: #38bdf8; }
  .tag-steel    { background: rgba(148,163,184,.15); color: #94a3b8; }
  .tag-rarity   { background: var(--surface); color: var(--muted); }
  .card-price { margin-top: auto; padding-top: .5rem; border-top: 1px solid var(--border); display: flex; align-items: baseline; gap: .4rem; }
  .price-main { font-size: 1.1rem; font-weight: 800; color: var(--accent); }
  .price-low  { font-size: .72rem; color: var(--muted); }
  .price-none { font-size: .75rem; color: var(--muted); font-style: italic; }
  .card-actions { display: flex; gap: .4rem; padding: .6rem .75rem .75rem; }
  .btn {
    flex: 1; padding: .45rem; border-radius: 6px; font-size: .75rem; font-weight: 700;
    cursor: pointer; border: none; text-decoration: none; text-align: center; transition: opacity .15s;
  }
  .btn:hover { opacity: .85; }
  .btn-primary   { background: var(--accent); color: #fff; }
  .btn-secondary { background: var(--surface); color: var(--text); border: 1px solid var(--border); }
  .btn-titan     { background: var(--titan); color: #fff; }

  .skeleton { background: linear-gradient(90deg, var(--surface) 25%, var(--border) 50%, var(--surface) 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; border-radius: var(--radius); }
  @keyframes shimmer { to { background-position: -200% 0; } }
  .skeleton-card { height: 320px; }

  /* ── Sealed tab ── */
  .sealed-section { padding: 1.25rem 1.5rem 0; }
  .sealed-section-title {
    font-size: .7rem; font-weight: 800; text-transform: uppercase; letter-spacing: .12em;
    color: var(--muted); margin-bottom: .9rem; display: flex; align-items: center; gap: .5rem;
  }
  .sealed-section-title::after { content: ''; flex: 1; height: 1px; background: var(--border); }
  .sealed-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1.1rem; margin-bottom: 2rem; }

  .sealed-card {
    background: var(--card-bg); border: 1px solid var(--border); border-radius: var(--radius);
    overflow: hidden; display: flex; flex-direction: column;
    transition: transform .18s, border-color .18s;
  }
  .sealed-card:hover { transform: translateY(-3px); border-color: var(--accent2); }
  .sealed-card.titan:hover { border-color: var(--titan); }

  .sealed-img {
    height: 150px; background: var(--surface); display: flex; align-items: center; justify-content: center;
    font-size: 3rem; overflow: hidden;
  }
  .sealed-img img { width: 100%; height: 100%; object-fit: cover; display: block; }

  .sealed-body { padding: .85rem; flex: 1; display: flex; flex-direction: column; gap: .3rem; }
  .sealed-name { font-weight: 700; font-size: .88rem; line-height: 1.3; }
  .sealed-meta { display: flex; align-items: center; gap: .4rem; margin-bottom: .4rem; }
  .sealed-price { font-size: 1rem; font-weight: 800; color: var(--accent2); }
  .sealed-price-orig { font-size: .75rem; color: var(--muted); text-decoration: line-through; }
  .sealed-badge {
    font-size: .6rem; font-weight: 800; text-transform: uppercase; letter-spacing: .06em;
    padding: .15rem .4rem; border-radius: 4px;
  }
  .badge-preorder  { background: rgba(56,189,248,.15);  color: var(--accent2); }
  .badge-instock   { background: rgba(52,211,153,.15);  color: var(--success); }
  .badge-sale      { background: rgba(251,191,36,.15);  color: var(--gold); }
  .sealed-btns { display: flex; flex-direction: column; gap: .4rem; margin-top: auto; }

  /* ── Deals tab ── */
  .deals-toolbar {
    padding: 1rem 1.5rem .5rem; display: flex; align-items: center; gap: .75rem;
    color: var(--muted); font-size: .82rem; flex-wrap: wrap;
  }
  .deals-loading-bar { padding: 1rem 1.5rem; color: var(--muted); font-size: .82rem; }
  .deals-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; padding: .5rem 1.5rem 3rem; }
  .deal-badge { background: var(--success); color: #000; font-size: .65rem; font-weight: 800; padding: .15rem .45rem; border-radius: 4px; text-transform: uppercase; letter-spacing: .05em; }
  .deal-savings { font-size: .7rem; color: var(--success); font-weight: 700; }

  .empty { text-align: center; padding: 4rem 1rem; color: var(--muted); }
  .empty h3 { font-size: 1.1rem; margin-bottom: .5rem; }
  .error-bar { background: rgba(248,113,113,.1); border: 1px solid var(--danger); color: var(--danger); border-radius: 8px; padding: .75rem 1rem; margin: 1rem 1.5rem; font-size: .85rem; }
  .footer { border-top: 1px solid var(--border); padding: 1.5rem; text-align: center; color: var(--muted); font-size: .75rem; }
  .footer a { color: var(--accent); text-decoration: none; }
`;

function inkTag(color) {
  const cls = { Amber:"amber", Amethyst:"amethyst", Emerald:"emerald", Ruby:"ruby", Sapphire:"sapphire", Steel:"steel" }[color] || "";
  return <span className={`tag tag-${cls}`}>{color || "?"}</span>;
}
function rarityIcon(r) {
  return { Common:"●", Uncommon:"◆", Rare:"★", "Super Rare":"★★", Legendary:"⚜", Enchanted:"✨" }[r] || "●";
}
function badgeClass(b) {
  if (b === "Sale") return "badge-sale";
  if (b === "In Stock") return "badge-instock";
  return "badge-preorder";
}

// ── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [tab,        setTab]        = useState("singles");
  const [groups,     setGroups]     = useState([]);
  const [activeSet,  setActiveSet]  = useState(null);
  const [cards,      setCards]      = useState([]);

  // Singles: prices for the active set only
  const [prices,     setPrices]     = useState({ byId: {}, byName: {} });
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);

  // Deals: merged prices across ALL sets
  const [allPrices,    setAllPrices]    = useState(null);   // null = not yet fetched
  const [dealsLoading, setDealsLoading] = useState(false);

  const [activeInk,  setActiveInk]  = useState("all");
  const [search,     setSearch]     = useState("");

  // ── Load groups once ─────────────────────────────────────────────────────
  useEffect(() => {
    fetchGroups()
      .then(g => {
        setGroups(g);
        const best = g.find(x => x.name.toLowerCase().includes("first chapter")) || g[0];
        if (best) setActiveSet(best);
      })
      .catch(() => setGroups([]));
  }, []);

  // ── Load ALL cards once ──────────────────────────────────────────────────
  useEffect(() => {
    fetchLorcanaCards()
      .then(setCards)
      .catch(() => setCards(PLACEHOLDER_CARDS));
  }, []);

  // ── Load prices for the active set (Singles tab) ─────────────────────────
  useEffect(() => {
    if (!activeSet?.groupId) return;
    setLoading(true);
    setError(null);
    fetchPricesForGroup(activeSet.groupId)
      .then(p => { setPrices(p); setLoading(false); })
      .catch(() => { setPrices({ byId: {}, byName: {} }); setLoading(false); setError("Could not load prices for this set."); });
  }, [activeSet]);

  // ── Fetch ALL set prices when Deals tab is first opened ──────────────────
  useEffect(() => {
    if (tab !== "deals" || allPrices !== null || groups.length === 0) return;

    setDealsLoading(true);
    // Only fetch main sets (exclude promo/special groups)
    const mainGroups = groups.filter(g => {
      const lower = g.name.toLowerCase();
      return !lower.includes("promo") && !lower.includes("special") && setNumberFromGroup(g.name) !== null;
    });

    Promise.all(mainGroups.map(g => fetchPricesForGroup(g.groupId)))
      .then(results => {
        // Merge all byId and byName maps into one
        const merged = { byId: {}, byName: {} };
        for (const r of results) {
          Object.assign(merged.byId,   r.byId);
          Object.assign(merged.byName, r.byName);
        }
        setAllPrices(merged);
        setDealsLoading(false);
      })
      .catch(() => setDealsLoading(false));
  }, [tab, groups, allPrices]);

  // ── Filter cards for Singles tab ─────────────────────────────────────────
  const activeSetNumber = setNumberFromGroup(activeSet?.name);
  const filtered = cards.filter(c => {
    const matchSet    = activeSetNumber === null || c.setNumber === activeSetNumber;
    const matchInk    = activeInk === "all" || c.color === activeInk;
    const matchSearch = !search || (c.name || "").toLowerCase().includes(search.toLowerCase());
    return matchSet && matchInk && matchSearch;
  }).slice(0, 48);

  // ── Deals: all cards with a price, sorted by market price descending ─────
  const deals = allPrices
    ? cards
        .map(c => ({ c, p: getPrice(allPrices, c) }))
        .filter(({ p }) => p && p.market && p.low && p.low <= p.market * 0.90)
        .sort((a, b) => (b.p.market || 0) - (a.p.market || 0))
        .slice(0, 48)
    : [];

  const withPrices = Object.keys(prices.byId).length;

  // ── Card tile ────────────────────────────────────────────────────────────
  function CardTile({ c, p, badge }) {
    const img = c.images?.full || c.images?.thumbnail;
    const savings = p && p.market && p.low ? Math.round((1 - p.low / p.market) * 100) : null;
    return (
      <div className="card">
        <div className="card-img-wrap">
          {img ? <img src={img} alt={c.fullName} loading="lazy" /> : <div className="card-img-placeholder">🃏</div>}
        </div>
        <div className="card-body">
          <div className="card-name">{c.fullName || c.name}</div>
          <div className="card-tags">
            {inkTag(c.color)}
            <span className="tag tag-rarity">{rarityIcon(c.rarity)} {c.rarity}</span>
          </div>
          {badge && (
            <div style={{display:"flex", gap:".35rem", alignItems:"center"}}>
              <span className="deal-badge">🔥 Deal</span>
              {savings && <span className="deal-savings">−{savings}% vs market</span>}
            </div>
          )}
          <div className="card-price">
            {p
              ? <><span className="price-main">${p.market?.toFixed(2) ?? "—"}</span>{p.low && <span className="price-low">Low ${p.low.toFixed(2)}</span>}</>
              : <span className="price-none">Price unavailable</span>
            }
          </div>
        </div>
        <div className="card-actions">
          <a className="btn btn-primary" href={tcgLink(c.tcgPlayerId, c.name)} target="_blank" rel="noopener noreferrer">TCGplayer</a>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        <header className="header">
          <div className="logo">Lorcana<span>Deals</span></div>
          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search cards…" />
          </div>
          <nav className="nav-tabs">
            {[["singles","Singles"],["sealed","Sealed"],["deals","🔥 Deals"]].map(([id,label]) => (
              <button key={id} className={`nav-tab ${tab===id?"active":""}`} onClick={() => setTab(id)}>{label}</button>
            ))}
          </nav>
        </header>

        <div className="hero">
          <div className="hero-eyebrow">✨ Live Price Tracking</div>
          <h1>Find the Best<br />Lorcana Deals</h1>
          <p>Real-time prices for singles and sealed product.</p>
          <div className="status-bar">
            <span><span className="status-dot"/>LorcanaJSON · TCGCSV</span>
            <span>{cards.length.toLocaleString()} cards · {withPrices.toLocaleString()} priced</span>
          </div>
        </div>

        {error && <div className="error-bar">⚠ {error}</div>}

        {/* ── Singles ── */}
        {tab === "singles" && (
          <>
            <div className="filters">
              <span className="filter-label">Set</span>
              <select className="set-select" value={activeSet?.groupId || ""}
                onChange={e => { const g = groups.find(x => String(x.groupId) === e.target.value); if (g) setActiveSet(g); }}>
                {groups.length === 0 && <option>Loading…</option>}
                {groups.map(g => <option key={g.groupId} value={g.groupId}>{cleanGroupName(g.name)}</option>)}
              </select>
              <span className="filter-label" style={{marginLeft:".75rem"}}>Ink</span>
              {INK_COLORS.map(ink => (
                <button key={ink} className={`filter-btn ${activeInk===ink?"active":""}`} onClick={() => setActiveInk(ink)}>
                  {ink === "all" ? "All" : ink}
                </button>
              ))}
            </div>
            <div className="grid">
              {loading
                ? Array.from({length:12}).map((_,i) => <div key={i} className="skeleton skeleton-card"/>)
                : filtered.length === 0
                  ? <div className="empty" style={{gridColumn:"1/-1"}}><h3>No cards found</h3><p>Try a different filter.</p></div>
                  : filtered.map(c => <CardTile key={c.id} c={c} p={getPrice(prices, c)} />)
              }
            </div>
          </>
        )}

        {/* ── Sealed ── */}
        {tab === "sealed" && (
          <div style={{paddingBottom:"3rem"}}>

            {/* TCGplayer section */}
            <div className="sealed-section">
              <div className="sealed-section-title">TCGplayer — English Booster Boxes</div>
              <div className="sealed-grid">
                {TCG_SEALED.map(p => (
                  <div className="sealed-card" key={p.name}>
                    <div className="sealed-img">📦</div>
                    <div className="sealed-body">
                      <div className="sealed-name">{p.name}</div>
                      <div className="sealed-btns">
                        <a className="btn btn-primary"   href={p.tcg} target="_blank" rel="noopener noreferrer">Buy on TCGplayer</a>
                        <a className="btn btn-secondary" href={p.amz} target="_blank" rel="noopener noreferrer">Check Amazon</a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Titan Toyz section */}
            <div className="sealed-section">
              <div className="sealed-section-title">Titan Toyz — Canadian Retailer 🇨🇦</div>
              <div style={{
                background:"rgba(249,115,22,.08)", border:"1px solid rgba(249,115,22,.3)",
                borderRadius:"8px", padding:".65rem 1rem", marginBottom:"1rem",
                fontSize:".82rem", color:"var(--titan)", display:"flex", alignItems:"center", gap:".5rem"
              }}>
                🏷️ Use code <strong>JBFRVERW</strong> at checkout for 5% off your Titan Toyz order!
              </div>
              <div className="sealed-grid">
                {TITAN_SEALED.map(p => (
                  <div className="sealed-card titan" key={p.name}>
                    <div className="sealed-img">
                      <img src={p.img} alt={p.name} loading="lazy" onError={e => { e.target.style.display="none"; }} />
                    </div>
                    <div className="sealed-body">
                      <div className="sealed-name">{p.name}</div>
                      <div className="sealed-meta">
                        <span className={`sealed-badge ${badgeClass(p.badge)}`}>{p.badge}</span>
                        <span className="sealed-price">{p.price}</span>
                        {p.originalPrice && <span className="sealed-price-orig">{p.originalPrice}</span>}
                      </div>
                      <div className="sealed-btns">
                        <a className="btn btn-titan" href={p.url} target="_blank" rel="noopener noreferrer">Buy on Titan Toyz</a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ── Deals ── */}
        {tab === "deals" && (
          <>
            <div className="deals-toolbar">
              <span>Cards where the lowest listing is ≥10% below market price, sorted by most valuable first.</span>
            </div>
            {dealsLoading
              ? <div className="deals-loading-bar">⏳ Loading prices across all sets…</div>
              : deals.length === 0
                ? <div className="empty"><h3>No deals right now</h3><p>Check back soon.</p></div>
                : <div className="deals-grid">{deals.map(({c, p}) => <CardTile key={c.id} c={c} p={p} badge />)}</div>
            }
          </>
        )}

        <footer className="footer">
          <p>
            LorcanaDeals is not affiliated with Ravensburger or Disney. &nbsp;·&nbsp;
            Prices via <a href="https://tcgcsv.com" target="_blank" rel="noopener noreferrer">TCGCSV</a> &nbsp;·&nbsp;
            Card data via <a href="https://lorcanajson.org" target="_blank" rel="noopener noreferrer">LorcanaJSON</a>
          </p>
          <p style={{marginTop:".4rem"}}>Affiliate links present · Disney Lorcana is © Ravensburger / Disney</p>
        </footer>
      </div>
    </>
  );
}

const PLACEHOLDER_CARDS = [
  { id:1, name:"Elsa",         fullName:"Elsa - Snow Queen",                  color:"Amethyst", rarity:"Legendary",  setNumber:1, images:{full:"https://lorcanajson.org/files/current/en/images/large/001-204.jpg"}, tcgPlayerId:100 },
  { id:2, name:"Mickey Mouse", fullName:"Mickey Mouse - Brave Little Tailor", color:"Amber",    rarity:"Super Rare", setNumber:1, images:{}, tcgPlayerId:200 },
  { id:3, name:"Maleficent",   fullName:"Maleficent - Monstrous Dragon",      color:"Emerald",  rarity:"Legendary",  setNumber:1, images:{}, tcgPlayerId:300 },
  { id:4, name:"Moana",        fullName:"Moana - Of Motunui",                 color:"Ruby",     rarity:"Rare",       setNumber:1, images:{}, tcgPlayerId:400 },
  { id:5, name:"Simba",        fullName:"Simba - Returned King",              color:"Amber",    rarity:"Super Rare", setNumber:2, images:{}, tcgPlayerId:500 },
  { id:6, name:"Ursula",       fullName:"Ursula - Eric's Bride",              color:"Amethyst", rarity:"Legendary",  setNumber:2, images:{}, tcgPlayerId:600 },
  { id:7, name:"Ariel",        fullName:"Ariel - Spectacular Singer",         color:"Ruby",     rarity:"Enchanted",  setNumber:2, images:{}, tcgPlayerId:700 },
  { id:8, name:"Belle",        fullName:"Belle - Strange but Special",        color:"Sapphire", rarity:"Uncommon",   setNumber:3, images:{}, tcgPlayerId:900 },
];
