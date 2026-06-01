// src/App.jsx
// LorcanaDeals — lorcana-deals.vercel.app
// Data flows through /api/lorcana (Vercel serverless) to avoid CORS.

import { useState, useEffect } from "react";

// ── Affiliate helpers ────────────────────────────────────────────────────────
const IMPACT_ID = "YOUR_IMPACT_ID";          // ← replace once Impact approves you
const AMAZON_TAG = "YOUR_AMAZON_TAG-20";     // ← replace with your Associates tag

function tcgLink(tcgPlayerId, cardName = "") {
  if (tcgPlayerId) {
    // Deep-link to the specific product page
    return `https://tcgplayer.sjv.io/c/${IMPACT_ID}/https://www.tcgplayer.com/product/${tcgPlayerId}`;
  }
  // Fall back to search
  const q = encodeURIComponent(`lorcana ${cardName}`);
  return `https://tcgplayer.sjv.io/c/${IMPACT_ID}/https://www.tcgplayer.com/search/lorcana/product?q=${q}`;
}

function amzLink(query) {
  return `https://www.amazon.com/s?k=${encodeURIComponent(query)}&tag=${AMAZON_TAG}`;
}

// ── Proxy-backed data fetchers ───────────────────────────────────────────────
async function fetchGroups() {
  const res = await fetch("/api/lorcana?route=groups");
  if (!res.ok) throw new Error(`groups ${res.status}`);
  const json = await res.json();
  // TCGCSV shape: { results: [{ groupId, name, ... }] }
  return (json.results || []).map(g => ({
    groupId: g.groupId,
    name:    g.name,
  }));
}

async function fetchLorcanaCards() {
  const res = await fetch("/api/lorcana?route=cards");
  if (!res.ok) throw new Error(`cards ${res.status}`);
  const json = await res.json();
  // LorcanaJSON allCards.json shape: array at root or under a key
  const raw = Array.isArray(json) ? json : (json.cards || json.data || []);
  return raw.map(c => ({
    id:           c.id,
    name:         c.name,
    fullName:     c.fullName || c.name,
    color:        c.color,
    rarity:       c.rarity,
    setNumber:    c.setNumber,
    images:       c.images || {},
    tcgPlayerId:  c.tcgPlayerId || null,
    tcgPlayerUrl: c.tcgPlayerUrl || null,
  }));
}

async function fetchPrices(groupId) {
  const res = await fetch(`/api/lorcana?route=prices&groupId=${groupId}`);
  if (!res.ok) throw new Error(`prices ${res.status}`);
  const json = await res.json();
  // TCGCSV shape: { results: [{ productId, lowPrice, marketPrice, ... }] }
  const map = {};
  for (const r of (json.results || [])) {
    map[r.productId] = {
      low:    r.lowPrice,
      market: r.marketPrice,
      mid:    r.midPrice,
    };
  }
  return map;
}

// ── Constants ────────────────────────────────────────────────────────────────
const INK_COLORS = ["all","Amber","Amethyst","Emerald","Ruby","Sapphire","Steel"];

const SEALED_PRODUCTS = [
  {
    name: "The First Chapter Booster Box",
    set: 1,
    tcg: tcgLink(null, "Lorcana First Chapter Booster Box"),
    amz: amzLink("Disney Lorcana First Chapter Booster Box"),
    img: "https://tcgplayer-cdn.tcgplayer.com/product/490975_200w.jpg",
  },
  {
    name: "Rise of the Floodborn Booster Box",
    set: 2,
    tcg: tcgLink(null, "Lorcana Rise Floodborn Booster Box"),
    amz: amzLink("Disney Lorcana Rise of the Floodborn Booster Box"),
    img: "https://tcgplayer-cdn.tcgplayer.com/product/516052_200w.jpg",
  },
  {
    name: "Into the Inklands Booster Box",
    set: 3,
    tcg: tcgLink(null, "Lorcana Into Inklands Booster Box"),
    amz: amzLink("Disney Lorcana Into the Inklands Booster Box"),
    img: null,
  },
  {
    name: "Ursula's Return Booster Box",
    set: 4,
    tcg: tcgLink(null, "Lorcana Ursulas Return Booster Box"),
    amz: amzLink("Disney Lorcana Ursula's Return Booster Box"),
    img: null,
  },
  {
    name: "Shimmering Skies Booster Box",
    set: 5,
    tcg: tcgLink(null, "Lorcana Shimmering Skies Booster Box"),
    amz: amzLink("Disney Lorcana Shimmering Skies Booster Box"),
    img: null,
  },
  {
    name: "Azurite Sea Booster Box",
    set: 6,
    tcg: tcgLink(null, "Lorcana Azurite Sea Booster Box"),
    amz: amzLink("Disney Lorcana Azurite Sea Booster Box"),
    img: null,
  },
];

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:       #0d0f14;
    --surface:  #161920;
    --card-bg:  #1c1f2a;
    --border:   #2a2d3a;
    --accent:   #c084fc;      /* soft violet */
    --accent2:  #38bdf8;      /* sky blue */
    --gold:     #fbbf24;
    --text:     #e2e8f0;
    --muted:    #6b7280;
    --danger:   #f87171;
    --success:  #34d399;
    --radius:   10px;
    --font:     'Segoe UI', system-ui, sans-serif;
  }

  body { background: var(--bg); color: var(--text); font-family: var(--font); min-height: 100vh; }

  /* ── Header ── */
  .header {
    position: sticky; top: 0; z-index: 100;
    background: rgba(13,15,20,.9);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--border);
    padding: 0 1.5rem;
    display: flex; align-items: center; gap: 1.25rem;
    height: 64px;
  }
  .logo { font-size: 1.35rem; font-weight: 800; letter-spacing: -.5px; white-space: nowrap; }
  .logo span { color: var(--accent); }
  .search-bar {
    flex: 1; display: flex; align-items: center; gap: .5rem;
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 8px; padding: 0 .75rem; max-width: 480px;
  }
  .search-bar input {
    flex: 1; background: none; border: none; outline: none;
    color: var(--text); font-size: .95rem; padding: .5rem 0;
  }
  .search-icon { color: var(--muted); font-size: .9rem; }
  .nav-tabs { display: flex; gap: .25rem; }
  .nav-tab {
    background: none; border: none; color: var(--muted); cursor: pointer;
    padding: .4rem .85rem; border-radius: 6px; font-size: .88rem; font-weight: 600;
    transition: background .15s, color .15s;
  }
  .nav-tab:hover  { background: var(--surface); color: var(--text); }
  .nav-tab.active { background: var(--accent); color: #fff; }

  /* ── Hero ── */
  .hero {
    text-align: center; padding: 3.5rem 1rem 2rem;
    background: radial-gradient(ellipse 70% 40% at 50% 0%, rgba(192,132,252,.12) 0%, transparent 70%);
  }
  .hero-eyebrow { font-size: .8rem; letter-spacing: .12em; text-transform: uppercase; color: var(--accent); margin-bottom: .6rem; }
  .hero h1 { font-size: clamp(2rem, 5vw, 3.2rem); font-weight: 900; line-height: 1.1; }
  .hero p  { color: var(--muted); margin-top: .75rem; font-size: 1.05rem; }
  .status-bar {
    margin-top: 1rem; display: flex; justify-content: center; gap: 1rem;
    font-size: .78rem; color: var(--muted);
  }
  .status-dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: var(--success); margin-right: .35rem; }

  /* ── Filters ── */
  .filters {
    display: flex; flex-wrap: wrap; gap: .5rem;
    padding: 1rem 1.5rem; border-bottom: 1px solid var(--border);
    align-items: center;
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
    border-radius: 8px; padding: .3rem .65rem; font-size: .8rem; cursor: pointer;
    outline: none;
  }

  /* ── Grid ── */
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; padding: 1.25rem 1.5rem 3rem; }

  /* ── Card ── */
  .card {
    background: var(--card-bg); border: 1px solid var(--border); border-radius: var(--radius);
    overflow: hidden; display: flex; flex-direction: column;
    transition: transform .18s, border-color .18s, box-shadow .18s;
  }
  .card:hover { transform: translateY(-3px); border-color: var(--accent); box-shadow: 0 8px 24px rgba(192,132,252,.15); }
  .card-img-wrap { aspect-ratio: 3/4; background: var(--surface); overflow: hidden; position: relative; }
  .card-img-wrap img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .card-img-placeholder {
    width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
    font-size: 2.5rem; color: var(--border);
  }
  .card-body { padding: .75rem; display: flex; flex-direction: column; gap: .35rem; flex: 1; }
  .card-name { font-size: .88rem; font-weight: 700; line-height: 1.25; }
  .card-sub  { font-size: .72rem; color: var(--muted); }
  .card-tags { display: flex; gap: .35rem; flex-wrap: wrap; }
  .tag {
    font-size: .66rem; font-weight: 700; text-transform: uppercase; letter-spacing: .05em;
    padding: .15rem .45rem; border-radius: 4px;
  }
  .tag-amber     { background: rgba(251,191,36,.15);  color: #fbbf24; }
  .tag-amethyst  { background: rgba(192,132,252,.15); color: #c084fc; }
  .tag-emerald   { background: rgba(52,211,153,.15);  color: #34d399; }
  .tag-ruby      { background: rgba(248,113,113,.15); color: #f87171; }
  .tag-sapphire  { background: rgba(56,189,248,.15);  color: #38bdf8; }
  .tag-steel     { background: rgba(148,163,184,.15); color: #94a3b8; }
  .tag-rarity    { background: var(--surface); color: var(--muted); }
  .card-price { margin-top: auto; padding-top: .5rem; border-top: 1px solid var(--border); display: flex; align-items: baseline; gap: .4rem; }
  .price-main { font-size: 1.1rem; font-weight: 800; color: var(--accent); }
  .price-low  { font-size: .72rem; color: var(--muted); }
  .price-none { font-size: .75rem; color: var(--muted); font-style: italic; }
  .card-actions { display: flex; gap: .4rem; padding: .6rem .75rem .75rem; }
  .btn {
    flex: 1; padding: .45rem; border-radius: 6px; font-size: .75rem; font-weight: 700;
    cursor: pointer; border: none; text-decoration: none; text-align: center;
    transition: opacity .15s;
  }
  .btn:hover { opacity: .85; }
  .btn-primary { background: var(--accent); color: #fff; }
  .btn-secondary { background: var(--surface); color: var(--text); border: 1px solid var(--border); }

  /* Skeleton */
  .skeleton {
    background: linear-gradient(90deg, var(--surface) 25%, var(--border) 50%, var(--surface) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.4s infinite;
    border-radius: var(--radius);
  }
  @keyframes shimmer { to { background-position: -200% 0; } }
  .skeleton-card { height: 320px; }

  /* ── Sealed grid ── */
  .sealed-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1.25rem; padding: 1.25rem 1.5rem 3rem; }
  .sealed-card {
    background: var(--card-bg); border: 1px solid var(--border); border-radius: var(--radius);
    overflow: hidden; transition: transform .18s, border-color .18s;
  }
  .sealed-card:hover { transform: translateY(-3px); border-color: var(--accent2); }
  .sealed-img { height: 160px; background: var(--surface); display: flex; align-items: center; justify-content: center; font-size: 3rem; }
  .sealed-img img { width: 100%; height: 100%; object-fit: cover; }
  .sealed-body { padding: .9rem; }
  .sealed-name { font-weight: 700; font-size: .95rem; margin-bottom: .3rem; }
  .sealed-set  { font-size: .72rem; color: var(--muted); margin-bottom: .75rem; }
  .sealed-btns { display: flex; flex-direction: column; gap: .4rem; }

  /* ── Deals ── */
  .deals-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1rem; padding: 1.25rem 1.5rem 3rem; }
  .deal-badge {
    background: var(--success); color: #000; font-size: .65rem; font-weight: 800;
    padding: .15rem .45rem; border-radius: 4px; text-transform: uppercase; letter-spacing: .05em;
  }
  .empty { text-align: center; padding: 4rem 1rem; color: var(--muted); }
  .empty h3 { font-size: 1.1rem; margin-bottom: .5rem; }

  /* ── Footer ── */
  .footer { border-top: 1px solid var(--border); padding: 1.5rem; text-align: center; color: var(--muted); font-size: .75rem; }
  .footer a { color: var(--accent); text-decoration: none; }

  /* ── Error ── */
  .error-bar { background: rgba(248,113,113,.1); border: 1px solid var(--danger); color: var(--danger); border-radius: 8px; padding: .75rem 1rem; margin: 1rem 1.5rem; font-size: .85rem; }
`;

// ── Ink color tag helper ─────────────────────────────────────────────────────
function inkTag(color) {
  const cls = { Amber:"amber", Amethyst:"amethyst", Emerald:"emerald", Ruby:"ruby", Sapphire:"sapphire", Steel:"steel" }[color] || "";
  return <span className={`tag tag-${cls}`}>{color || "?"}</span>;
}

// ── Rarity emoji helper ──────────────────────────────────────────────────────
function rarityIcon(r) {
  const map = { Common:"●", Uncommon:"◆", Rare:"★", "Super Rare":"★★", Legendary:"⚜", Enchanted:"✨" };
  return map[r] || "●";
}

// ── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [tab,        setTab]        = useState("singles");
  const [groups,     setGroups]     = useState([]);
  const [activeSet,  setActiveSet]  = useState(null);
  const [cards,      setCards]      = useState([]);
  const [prices,     setPrices]     = useState({});
  const [activeInk,  setActiveInk]  = useState("all");
  const [search,     setSearch]     = useState("");
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [dataSource, setDataSource] = useState("Loading…");

  // Load groups on mount
  useEffect(() => {
    fetchGroups()
      .then(g => {
        setGroups(g);
        if (g.length > 0) setActiveSet(g[0]);
      })
      .catch(() => setGroups([]));
  }, []);

  // Load cards + prices when set changes
  useEffect(() => {
    setLoading(true);
    setError(null);

    const load = async () => {
      try {
        const rawCards = await fetchLorcanaCards();
        setCards(rawCards);
        setDataSource("LorcanaJSON · TCGCSV");

        if (activeSet?.groupId) {
          try {
            const priceMap = await fetchPrices(activeSet.groupId);
            setPrices(priceMap);
          } catch {
            setPrices({});
          }
        }
      } catch (e) {
        setError("Could not load card data from proxy. Check that api/lorcana.js is deployed.");
        setCards(PLACEHOLDER_CARDS);
        setDataSource("Demo data");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [activeSet]);

  // ── Filtered cards ──────────────────────────────────────────────────────
  const filtered = cards.filter(c => {
    const matchInk    = activeInk === "all" || c.color === activeInk;
    const matchSearch = !search || (c.name || "").toLowerCase().includes(search.toLowerCase());
    return matchInk && matchSearch;
  }).slice(0, 48);

  // ── Hot deals: low price is ≥10% below market ──────────────────────────
  const deals = cards.filter(c => {
    const p = prices[c.tcgPlayerId];
    return p && p.low && p.market && p.low <= p.market * 0.90;
  }).slice(0, 24);

  const totalCards = cards.length;
  const withPrices = Object.keys(prices).length;

  // ── Render card ─────────────────────────────────────────────────────────
  function CardTile({ c, badge }) {
    const p = prices[c.tcgPlayerId];
    const img = c.images?.full || c.images?.thumbnail;
    return (
      <div className="card">
        <div className="card-img-wrap">
          {img
            ? <img src={img} alt={c.fullName} loading="lazy" />
            : <div className="card-img-placeholder">🃏</div>
          }
        </div>
        <div className="card-body">
          <div className="card-name">{c.fullName || c.name}</div>
          <div className="card-tags">
            {inkTag(c.color)}
            <span className="tag tag-rarity">{rarityIcon(c.rarity)} {c.rarity}</span>
          </div>
          {badge && <span className="deal-badge">🔥 Deal</span>}
          <div className="card-price">
            {p
              ? <>
                  <span className="price-main">${p.market?.toFixed(2) ?? "—"}</span>
                  {p.low && <span className="price-low">Low ${p.low.toFixed(2)}</span>}
                </>
              : <span className="price-none">Price unavailable</span>
            }
          </div>
        </div>
        <div className="card-actions">
          <a className="btn btn-primary" href={tcgLink(c.tcgPlayerId, c.name)} target="_blank" rel="noopener noreferrer">
            TCGplayer
          </a>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <div className="app">

        {/* Header */}
        <header className="header">
          <div className="logo">Lorcana<span>Deals</span></div>
          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search cards…"
            />
          </div>
          <nav className="nav-tabs">
            {[["singles","Singles"],["sealed","Sealed"],["deals","🔥 Deals"]].map(([id,label]) => (
              <button key={id} className={`nav-tab ${tab===id?"active":""}`} onClick={() => setTab(id)}>
                {label}
              </button>
            ))}
          </nav>
        </header>

        {/* Hero */}
        <div className="hero">
          <div className="hero-eyebrow">✨ Live Price Tracking</div>
          <h1>Find the Best<br />Lorcana Deals</h1>
          <p>Real-time prices for singles and sealed product.</p>
          <div className="status-bar">
            <span><span className="status-dot"/>Source: {dataSource}</span>
            <span>{totalCards.toLocaleString()} cards · {withPrices.toLocaleString()} priced</span>
          </div>
        </div>

        {error && <div className="error-bar">⚠ {error}</div>}

        {/* ── Singles tab ─────────────────────────────────────────────── */}
        {tab === "singles" && (
          <>
            <div className="filters">
              <span className="filter-label">Set</span>
              <select
                className="set-select"
                value={activeSet?.groupId || ""}
                onChange={e => {
                  const g = groups.find(x => String(x.groupId) === e.target.value);
                  if (g) setActiveSet(g);
                }}
              >
                {groups.length === 0 && <option>Loading sets…</option>}
                {groups.map(g => <option key={g.groupId} value={g.groupId}>{g.name}</option>)}
              </select>

              <span className="filter-label" style={{marginLeft:".75rem"}}>Ink</span>
              {INK_COLORS.map(ink => (
                <button
                  key={ink}
                  className={`filter-btn ${activeInk===ink?"active":""}`}
                  onClick={() => setActiveInk(ink)}
                >
                  {ink === "all" ? "All" : ink}
                </button>
              ))}
            </div>

            <div className="grid">
              {loading
                ? Array.from({length:12}).map((_,i) => <div key={i} className="skeleton skeleton-card"/>)
                : filtered.length === 0
                  ? <div className="empty" style={{gridColumn:"1/-1"}}><h3>No cards found</h3><p>Try a different filter or search.</p></div>
                  : filtered.map(c => <CardTile key={c.id} c={c}/>)
              }
            </div>
          </>
        )}

        {/* ── Sealed tab ──────────────────────────────────────────────── */}
        {tab === "sealed" && (
          <div className="sealed-grid">
            {SEALED_PRODUCTS.map(p => (
              <div className="sealed-card" key={p.name}>
                <div className="sealed-img">
                  {p.img ? <img src={p.img} alt={p.name}/> : "📦"}
                </div>
                <div className="sealed-body">
                  <div className="sealed-name">{p.name}</div>
                  <div className="sealed-set">Set {p.set}</div>
                  <div className="sealed-btns">
                    <a className="btn btn-primary" href={p.tcg} target="_blank" rel="noopener noreferrer">
                      Buy on TCGplayer
                    </a>
                    <a className="btn btn-secondary" href={p.amz} target="_blank" rel="noopener noreferrer">
                      Check Amazon
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Deals tab ───────────────────────────────────────────────── */}
        {tab === "deals" && (
          <>
            <div style={{padding:"1rem 1.5rem .25rem", color:"var(--muted)", fontSize:".82rem"}}>
              Cards where the lowest listed price is ≥10% below market — updated every 10 min.
            </div>
            {loading
              ? <div className="deals-grid">{Array.from({length:8}).map((_,i) => <div key={i} className="skeleton skeleton-card"/>)}</div>
              : deals.length === 0
                ? <div className="empty"><h3>No deals right now</h3><p>Check back soon — the market moves fast.</p></div>
                : <div className="deals-grid">{deals.map(c => <CardTile key={c.id} c={c} badge/>)}</div>
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

// ── Placeholder cards for demo when proxy is unreachable ─────────────────────
const PLACEHOLDER_CARDS = [
  { id:1, name:"Elsa", fullName:"Elsa – Snow Queen",              color:"Amethyst", rarity:"Legendary",  setNumber:1, images:{full:"https://lorcanajson.org/files/current/en/images/large/001-204.jpg"}, tcgPlayerId:100 },
  { id:2, name:"Mickey Mouse", fullName:"Mickey Mouse – Brave Little Tailor", color:"Amber",    rarity:"Super Rare", setNumber:2, images:{},       tcgPlayerId:200 },
  { id:3, name:"Maleficent", fullName:"Maleficent – Monstrous Dragon",        color:"Emerald",  rarity:"Legendary",  setNumber:3, images:{},       tcgPlayerId:300 },
  { id:4, name:"Moana",     fullName:"Moana – Of Motunui",        color:"Ruby",     rarity:"Rare",       setNumber:4, images:{},       tcgPlayerId:400 },
  { id:5, name:"Simba",     fullName:"Simba – Returned King",     color:"Amber",    rarity:"Super Rare", setNumber:5, images:{},       tcgPlayerId:500 },
  { id:6, name:"Ursula",    fullName:"Ursula – Eric's Bride",     color:"Amethyst", rarity:"Legendary",  setNumber:6, images:{},       tcgPlayerId:600 },
  { id:7, name:"Ariel",     fullName:"Ariel – Spectacular Singer",color:"Ruby",     rarity:"Enchanted",  setNumber:7, images:{},       tcgPlayerId:700 },
  { id:8, name:"Belle",     fullName:"Belle – Strange but Special",color:"Sapphire",rarity:"Uncommon",   setNumber:9, images:{},       tcgPlayerId:900 },
];