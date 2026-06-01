import { useState, useEffect, useCallback } from "react";

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --ink-amber:   #F5A623;
    --ink-sapphire:#1A6FD4;
    --ink-emerald: #1AAD6B;
    --ink-ruby:    #D42B2B;
    --ink-amethyst:#8B35D4;
    --ink-steel:   #5B7FA6;

    --bg:          #0A0C10;
    --surface:     #111420;
    --surface2:    #181C2A;
    --border:      rgba(255,255,255,0.07);
    --text:        #E8EAF0;
    --muted:       #6B7280;
    --gold:        #C9A84C;
    --gold-light:  #F0D080;
  }

  body { background: var(--bg); color: var(--text); font-family: 'DM Sans', sans-serif; }

  /* ── Layout ── */
  .app { min-height: 100vh; display: flex; flex-direction: column; }

  /* ── Header ── */
  .header {
    position: sticky; top: 0; z-index: 100;
    background: rgba(10,12,16,0.85);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid var(--border);
    padding: 0 2rem;
    display: flex; align-items: center; gap: 2rem; height: 64px;
  }
  .logo {
    font-family: 'Cinzel', serif; font-weight: 900; font-size: 1.25rem;
    letter-spacing: .04em;
    background: linear-gradient(135deg, var(--gold-light), var(--gold));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    white-space: nowrap;
  }
  .logo span { font-weight: 400; opacity: .7; }
  .search-bar {
    flex: 1; max-width: 480px;
    display: flex; align-items: center; gap: .5rem;
    background: var(--surface2); border: 1px solid var(--border);
    border-radius: 10px; padding: .5rem 1rem;
    transition: border-color .2s;
  }
  .search-bar:focus-within { border-color: var(--gold); }
  .search-bar input {
    flex: 1; background: none; border: none; outline: none;
    color: var(--text); font-size: .9rem; font-family: inherit;
  }
  .search-bar input::placeholder { color: var(--muted); }
  .search-icon { color: var(--muted); font-size: 1rem; }
  .nav-tabs { display: flex; gap: .25rem; margin-left: auto; }
  .nav-tab {
    background: none; border: none; cursor: pointer;
    color: var(--muted); font-family: 'DM Sans', sans-serif;
    font-size: .85rem; font-weight: 500; padding: .4rem .85rem;
    border-radius: 8px; transition: all .15s; white-space: nowrap;
  }
  .nav-tab:hover { color: var(--text); background: var(--surface2); }
  .nav-tab.active { color: var(--gold); background: rgba(201,168,76,.12); }

  /* ── Hero ── */
  .hero {
    position: relative; overflow: hidden;
    padding: 4rem 2rem 3rem;
    background: radial-gradient(ellipse 80% 60% at 50% -10%, rgba(201,168,76,.15) 0%, transparent 70%);
    border-bottom: 1px solid var(--border);
    text-align: center;
  }
  .hero-eyebrow {
    display: inline-flex; align-items: center; gap: .4rem;
    font-size: .75rem; font-weight: 500; letter-spacing: .12em; text-transform: uppercase;
    color: var(--gold); background: rgba(201,168,76,.1);
    border: 1px solid rgba(201,168,76,.2); border-radius: 999px;
    padding: .25rem .9rem; margin-bottom: 1.25rem;
  }
  .hero h1 {
    font-family: 'Cinzel', serif; font-size: clamp(2rem, 5vw, 3.5rem);
    font-weight: 700; line-height: 1.1; margin-bottom: 1rem;
    background: linear-gradient(160deg, #fff 30%, var(--gold-light));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }
  .hero p { color: var(--muted); font-size: 1.05rem; max-width: 520px; margin: 0 auto 2rem; }
  .hero-stats { display: flex; gap: 2.5rem; justify-content: center; flex-wrap: wrap; }
  .hero-stat { text-align: center; }
  .hero-stat-val {
    font-family: 'Cinzel', serif; font-size: 1.6rem; font-weight: 700;
    color: var(--gold-light); display: block;
  }
  .hero-stat-label { font-size: .75rem; color: var(--muted); text-transform: uppercase; letter-spacing: .08em; }

  /* ── Section ── */
  .section { padding: 2.5rem 2rem; max-width: 1400px; margin: 0 auto; width: 100%; }
  .section-header {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 1.5rem;
  }
  .section-title {
    font-family: 'Cinzel', serif; font-size: 1.1rem; font-weight: 600;
    color: var(--text); display: flex; align-items: center; gap: .5rem;
  }
  .section-title .dot {
    width: 6px; height: 6px; border-radius: 50%; background: var(--gold);
  }
  .see-all {
    font-size: .8rem; color: var(--gold); text-decoration: none;
    opacity: .8; transition: opacity .15s; cursor: pointer; background: none; border: none;
  }
  .see-all:hover { opacity: 1; }

  /* ── Ink Filter Pills ── */
  .ink-filters { display: flex; gap: .5rem; flex-wrap: wrap; margin-bottom: 1.5rem; }
  .ink-pill {
    display: flex; align-items: center; gap: .35rem;
    border: none; cursor: pointer; border-radius: 999px;
    padding: .3rem .8rem; font-size: .78rem; font-weight: 500;
    font-family: 'DM Sans', sans-serif;
    background: var(--surface2); color: var(--muted);
    border: 1px solid var(--border); transition: all .15s;
  }
  .ink-pill.active { border-color: currentColor; }
  .ink-pill .swatch { width: 8px; height: 8px; border-radius: 50%; }

  /* ── Card Grid ── */
  .card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
  }

  /* ── Card ── */
  .card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 14px; overflow: hidden;
    transition: transform .2s, border-color .2s, box-shadow .2s;
    cursor: pointer; position: relative;
  }
  .card:hover {
    transform: translateY(-4px);
    border-color: rgba(201,168,76,.3);
    box-shadow: 0 12px 40px rgba(0,0,0,.5), 0 0 0 1px rgba(201,168,76,.1);
  }
  .card-img-wrap {
    position: relative; aspect-ratio: 5/7; overflow: hidden;
    background: var(--surface2);
  }
  .card-img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .card-img-placeholder {
    width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
    color: var(--muted); font-size: 2.5rem;
  }
  .card-badge {
    position: absolute; top: .5rem; right: .5rem;
    font-size: .65rem; font-weight: 600; letter-spacing: .06em; text-transform: uppercase;
    padding: .2rem .5rem; border-radius: 6px;
  }
  .badge-deal { background: rgba(26,173,107,.2); color: #4DE8A0; border: 1px solid rgba(26,173,107,.3); }
  .badge-hot  { background: rgba(212,43,43,.2);  color: #FF6B6B; border: 1px solid rgba(212,43,43,.3); }
  .badge-new  { background: rgba(26,111,212,.2); color: #60A5FA; border: 1px solid rgba(26,111,212,.3); }
  .card-body { padding: .85rem; }
  .card-name {
    font-size: .88rem; font-weight: 500; color: var(--text);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    margin-bottom: .15rem;
  }
  .card-sub { font-size: .75rem; color: var(--muted); margin-bottom: .65rem; }
  .card-price-row { display: flex; align-items: center; justify-content: space-between; }
  .card-price {
    font-family: 'Cinzel', serif; font-size: 1rem; font-weight: 600;
    color: var(--gold-light);
  }
  .card-price-change {
    font-size: .72rem; font-weight: 500; padding: .15rem .4rem; border-radius: 5px;
  }
  .price-up   { background: rgba(212,43,43,.15); color: #FF6B6B; }
  .price-down { background: rgba(26,173,107,.15); color: #4DE8A0; }
  .price-flat { background: rgba(107,114,128,.15); color: var(--muted); }
  .card-buy-btn {
    display: block; width: 100%; margin-top: .65rem;
    background: rgba(201,168,76,.1); border: 1px solid rgba(201,168,76,.2);
    color: var(--gold); font-family: 'DM Sans', sans-serif;
    font-size: .78rem; font-weight: 500; text-align: center;
    padding: .4rem; border-radius: 8px; cursor: pointer;
    text-decoration: none; transition: all .15s;
  }
  .card-buy-btn:hover { background: rgba(201,168,76,.2); border-color: rgba(201,168,76,.4); }

  /* ── Sealed Product ── */
  .sealed-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1rem;
  }
  .sealed-card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 14px; padding: 1.25rem;
    display: flex; gap: 1rem; align-items: flex-start;
    transition: border-color .2s, transform .2s;
    cursor: pointer;
  }
  .sealed-card:hover { border-color: rgba(201,168,76,.25); transform: translateY(-2px); }
  .sealed-icon {
    width: 52px; height: 52px; border-radius: 10px;
    background: var(--surface2); display: flex; align-items: center;
    justify-content: center; font-size: 1.5rem; flex-shrink: 0;
  }
  .sealed-info { flex: 1; min-width: 0; }
  .sealed-name { font-size: .9rem; font-weight: 500; margin-bottom: .2rem; }
  .sealed-set  { font-size: .75rem; color: var(--muted); margin-bottom: .6rem; }
  .sealed-prices { display: flex; gap: .75rem; flex-wrap: wrap; }
  .sealed-price-item { display: flex; flex-direction: column; }
  .sealed-price-source { font-size: .65rem; color: var(--muted); text-transform: uppercase; letter-spacing: .06em; }
  .sealed-price-val { font-family: 'Cinzel', serif; font-size: .95rem; color: var(--gold-light); font-weight: 600; }
  .sealed-buy-row { display: flex; gap: .5rem; margin-top: .75rem; }
  .sealed-btn {
    flex: 1; padding: .35rem .5rem; border-radius: 7px; border: none;
    font-size: .72rem; font-weight: 500; cursor: pointer; text-align: center;
    text-decoration: none; font-family: 'DM Sans', sans-serif; transition: opacity .15s;
  }
  .sealed-btn:hover { opacity: .85; }
  .btn-tcg { background: rgba(26,111,212,.25); color: #60A5FA; border: 1px solid rgba(26,111,212,.3); }
  .btn-amz { background: rgba(245,166,35,.2); color: var(--gold); border: 1px solid rgba(245,166,35,.25); }

  /* ── Set Selector ── */
  .set-chips { display: flex; gap: .5rem; flex-wrap: wrap; margin-bottom: 1.5rem; }
  .set-chip {
    background: var(--surface2); border: 1px solid var(--border);
    border-radius: 8px; padding: .35rem .8rem;
    font-size: .78rem; color: var(--muted); cursor: pointer;
    transition: all .15s; font-family: 'DM Sans', sans-serif;
  }
  .set-chip:hover { color: var(--text); border-color: rgba(255,255,255,.15); }
  .set-chip.active { color: var(--gold); border-color: rgba(201,168,76,.4); background: rgba(201,168,76,.08); }

  /* ── Loading / Empty ── */
  .loading-grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem;
  }
  .skeleton {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 14px; overflow: hidden;
    animation: shimmer 1.4s ease infinite;
  }
  .skeleton-img { aspect-ratio: 5/7; background: var(--surface2); }
  .skeleton-body { padding: .85rem; display: flex; flex-direction: column; gap: .5rem; }
  .skeleton-line {
    height: 12px; border-radius: 6px; background: var(--surface2);
  }
  .skeleton-line.short { width: 60%; }
  @keyframes shimmer {
    0%,100% { opacity: 1; }
    50% { opacity: .5; }
  }

  /* ── Status bar ── */
  .status-bar {
    background: rgba(26,173,107,.08); border: 1px solid rgba(26,173,107,.2);
    border-radius: 10px; padding: .6rem 1rem;
    display: flex; align-items: center; gap: .5rem;
    font-size: .78rem; color: #4DE8A0; margin-bottom: 1.5rem;
  }
  .status-bar.error {
    background: rgba(212,43,43,.08); border-color: rgba(212,43,43,.2); color: #FF6B6B;
  }
  .status-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: currentColor; flex-shrink: 0;
    animation: pulse 2s ease infinite;
  }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }

  /* ── Footer ── */
  .footer {
    margin-top: auto; border-top: 1px solid var(--border);
    padding: 1.5rem 2rem; text-align: center;
    font-size: .75rem; color: var(--muted); line-height: 1.8;
  }
  .footer a { color: var(--gold); opacity: .7; text-decoration: none; }
  .footer a:hover { opacity: 1; }

  /* ── Responsive ── */
  @media (max-width: 640px) {
    .header { padding: 0 1rem; gap: 1rem; }
    .nav-tabs { display: none; }
    .search-bar { max-width: none; }
    .section { padding: 1.5rem 1rem; }
    .hero { padding: 2.5rem 1rem 2rem; }
    .hero-stats { gap: 1.5rem; }
  }
`;

// ── Constants ────────────────────────────────────────────────────────────────
const INK_COLORS = [
  { id: "all",      label: "All",      color: "#6B7280" },
  { id: "Amber",    label: "Amber",    color: "#F5A623" },
  { id: "Amethyst", label: "Amethyst", color: "#8B35D4" },
  { id: "Emerald",  label: "Emerald",  color: "#1AAD6B" },
  { id: "Ruby",     label: "Ruby",     color: "#D42B2B" },
  { id: "Sapphire", label: "Sapphire", color: "#1A6FD4" },
  { id: "Steel",    label: "Steel",    color: "#5B7FA6" },
];

const SEALED_PRODUCTS = [
  { id: 1, name: "Booster Box", set: "Archazia's Island", icon: "📦", tcgPrice: 94.99, amzPrice: 99.99, tcgId: "lorcana-archazias-island-booster-box", amzAsin: "B0EXAMPLE1" },
  { id: 2, name: "Booster Box", set: "Azurite Sea", icon: "📦", tcgPrice: 89.99, amzPrice: 92.49, tcgId: "lorcana-azurite-sea-booster-box", amzAsin: "B0EXAMPLE2" },
  { id: 3, name: "Starter Deck – Amber/Amethyst", set: "Archazia's Island", icon: "🎴", tcgPrice: 14.49, amzPrice: 15.99, tcgId: "lorcana-archazias-starter-amber", amzAsin: "B0EXAMPLE3" },
  { id: 4, name: "Illumineer's Trove", set: "Shimmering Skies", icon: "✨", tcgPrice: 44.99, amzPrice: 49.99, tcgId: "lorcana-shimskies-trove", amzAsin: "B0EXAMPLE4" },
  { id: 5, name: "Booster Pack", set: "Archazia's Island", icon: "🃏", tcgPrice: 3.99, amzPrice: null, tcgId: "lorcana-archazias-pack", amzAsin: null },
  { id: 6, name: "Booster Box", set: "Whispers in the Well", icon: "📦", tcgPrice: 87.50, amzPrice: 89.99, tcgId: "lorcana-whispers-booster-box", amzAsin: "B0EXAMPLE6" },
];

// ── Affiliate link builders ───────────────────────────────────────────────────
const tcgLink  = (id)   => `https://www.tcgplayer.com/search/lorcana/product?q=${encodeURIComponent(id)}&utm_campaign=affiliate&utm_source=lorcanadeals`;
const amzLink  = (asin) => `https://www.amazon.com/dp/${asin}?tag=YOUR_AFFILIATE_TAG`;

// ── TCGCSV category ID for Lorcana (68 as of 2024)
const LORCANA_CATEGORY = 68;

// ── Fetch helpers ─────────────────────────────────────────────────────────────
async function fetchLorcanaCards(setId = null) {
  // LorcanaJSON — fetch all cards for a set or a sample
  const base = "https://lorcanajson.org/files/current/en";
  const url = setId
    ? `${base}/allCards.json`
    : `${base}/allCards.json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("LorcanaJSON fetch failed");
  const data = await res.json();
  // allCards.json returns { cards: [...] }
  return (data.cards || data).slice(0, 120);
}

async function fetchPrices(groupId) {
  const url = `https://tcgcsv.com/tcgplayer/${LORCANA_CATEGORY}/${groupId}/prices`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("TCGCSV prices fetch failed");
  const data = await res.json();
  // Returns { results: [{ productId, marketPrice, lowPrice, ... }] }
  const map = {};
  (data.results || []).forEach(p => { map[p.productId] = p; });
  return map;
}

async function fetchGroups() {
  const url = `https://tcgcsv.com/tcgplayer/${LORCANA_CATEGORY}/groups`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("TCGCSV groups fetch failed");
  const data = await res.json();
  return (data.results || []).filter(g => g.name).slice(0, 12);
}

// ── Skeleton loader ───────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="skeleton">
      <div className="skeleton-img" />
      <div className="skeleton-body">
        <div className="skeleton-line" />
        <div className="skeleton-line short" />
        <div className="skeleton-line short" />
      </div>
    </div>
  );
}

// ── Card tile ─────────────────────────────────────────────────────────────────
function CardTile({ card, price }) {
  const marketPrice = price?.marketPrice;
  const lowPrice    = price?.lowPrice;
  const pctOff = marketPrice && lowPrice
    ? Math.round((1 - lowPrice / marketPrice) * 100)
    : null;

  const isDeal = pctOff && pctOff >= 10;
  const isNew  = card.setNumber <= 20;

  const inkColor = INK_COLORS.find(i => i.id === card.color)?.color || "#6B7280";
  const tcgUrl   = card.tcgPlayerUrl || tcgLink(card.fullName || card.name);

  return (
    <div className="card">
      <div className="card-img-wrap">
        {card.images?.full ? (
          <img className="card-img" src={card.images.full} alt={card.name} loading="lazy" />
        ) : (
          <div className="card-img-placeholder">🃏</div>
        )}
        {isDeal && <span className="card-badge badge-deal">🔥 Deal</span>}
        {isNew && !isDeal && <span className="card-badge badge-new">New</span>}
      </div>
      <div className="card-body">
        <div className="card-name" title={card.fullName || card.name}>
          {card.name}
        </div>
        <div className="card-sub" style={{ color: inkColor }}>
          {card.color || "—"} · {card.rarity || ""}
        </div>
        <div className="card-price-row">
          <span className="card-price">
            {marketPrice ? `$${marketPrice.toFixed(2)}` : "—"}
          </span>
          {pctOff !== null && (
            <span className={`card-price-change ${pctOff > 0 ? "price-down" : "price-flat"}`}>
              {pctOff > 0 ? `${pctOff}% off` : "At market"}
            </span>
          )}
        </div>
        <a className="card-buy-btn" href={tcgUrl} target="_blank" rel="noopener noreferrer sponsored">
          Buy on TCGplayer →
        </a>
      </div>
    </div>
  );
}

// ── Sealed product tile ───────────────────────────────────────────────────────
function SealedTile({ product }) {
  const cheapest = product.amzPrice
    ? Math.min(product.tcgPrice, product.amzPrice)
    : product.tcgPrice;
  const msrpSavings = product.tcgPrice < product.amzPrice
    ? null
    : product.amzPrice
      ? Math.round((product.tcgPrice - product.amzPrice) / product.tcgPrice * 100)
      : null;

  return (
    <div className="sealed-card">
      <div className="sealed-icon">{product.icon}</div>
      <div className="sealed-info">
        <div className="sealed-name">{product.name}</div>
        <div className="sealed-set">{product.set}</div>
        <div className="sealed-prices">
          <div className="sealed-price-item">
            <span className="sealed-price-source">TCGplayer</span>
            <span className="sealed-price-val">${product.tcgPrice.toFixed(2)}</span>
          </div>
          {product.amzPrice && (
            <div className="sealed-price-item">
              <span className="sealed-price-source">Amazon</span>
              <span className="sealed-price-val">${product.amzPrice.toFixed(2)}</span>
            </div>
          )}
          <div className="sealed-price-item">
            <span className="sealed-price-source">Best</span>
            <span className="sealed-price-val" style={{ color: "#4DE8A0" }}>${cheapest.toFixed(2)}</span>
          </div>
        </div>
        <div className="sealed-buy-row">
          <a className="sealed-btn btn-tcg" href={tcgLink(product.tcgId)} target="_blank" rel="noopener noreferrer sponsored">
            TCGplayer
          </a>
          {product.amzPrice && (
            <a className="sealed-btn btn-amz" href={amzLink(product.amzAsin)} target="_blank" rel="noopener noreferrer sponsored">
              Amazon
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [tab,        setTab]        = useState("singles");
  const [cards,      setCards]      = useState([]);
  const [prices,     setPrices]     = useState({});
  const [groups,     setGroups]     = useState([]);
  const [activeSet,  setActiveSet]  = useState(null);
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

    const loadData = async () => {
      try {
        // Fetch cards from LorcanaJSON
        const rawCards = await fetchLorcanaCards();
        setCards(rawCards);
        setDataSource("LorcanaJSON · TCGCSV");

        // Fetch prices for active set
        if (activeSet?.groupId) {
          try {
            const priceMap = await fetchPrices(activeSet.groupId);
            setPrices(priceMap);
          } catch {
            // Prices unavailable — continue without
            setPrices({});
          }
        }
      } catch (e) {
        setError("Could not load card data. CORS or network issue — this works best deployed.");
        // Use placeholder cards for demo
        setCards(PLACEHOLDER_CARDS);
        setDataSource("Demo data (deploy to fetch live)");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [activeSet]);

  // Filter cards
  const filtered = cards.filter(c => {
    const matchInk    = activeInk === "all" || c.color === activeInk;
    const matchSearch = !search || (c.name || "").toLowerCase().includes(search.toLowerCase());
    return matchInk && matchSearch;
  }).slice(0, 48);

  const totalCards = cards.length;
  const withPrices = Object.keys(prices).length;

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
              placeholder="Search cards, sets, characters…"
            />
          </div>
          <nav className="nav-tabs">
            {[["singles","Singles"],["sealed","Sealed Product"],["deals","Hot Deals"]].map(([id,label]) => (
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
          <p>Real-time prices for singles and sealed product. Compare across TCGplayer and Amazon.</p>
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="hero-stat-val">{totalCards.toLocaleString()}</span>
              <span className="hero-stat-label">Cards Tracked</span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-val">{withPrices > 0 ? withPrices.toLocaleString() : "—"}</span>
              <span className="hero-stat-label">Live Prices</span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-val">{groups.length || "—"}</span>
              <span className="hero-stat-label">Sets</span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-val">2</span>
              <span className="hero-stat-label">Marketplaces</span>
            </div>
          </div>
        </div>

        {/* Singles Tab */}
        {tab === "singles" && (
          <div className="section">
            {/* Data status */}
            <div className={`status-bar ${error ? "error" : ""}`}>
              <span className="status-dot" />
              {error ? error : `Data: ${dataSource} · ${filtered.length} cards shown`}
            </div>

            {/* Set chips */}
            {groups.length > 0 && (
              <div className="set-chips">
                {groups.map(g => (
                  <button
                    key={g.groupId}
                    className={`set-chip ${activeSet?.groupId === g.groupId ? "active" : ""}`}
                    onClick={() => setActiveSet(g)}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
            )}

            {/* Ink filters */}
            <div className="ink-filters">
              {INK_COLORS.map(ink => (
                <button
                  key={ink.id}
                  className={`ink-pill ${activeInk === ink.id ? "active" : ""}`}
                  style={activeInk === ink.id ? { color: ink.color } : {}}
                  onClick={() => setActiveInk(ink.id)}
                >
                  <span className="swatch" style={{ background: ink.color }} />
                  {ink.label}
                </button>
              ))}
            </div>

            {/* Cards */}
            {loading ? (
              <div className="loading-grid">
                {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : (
              <div className="card-grid">
                {filtered.map((card, i) => (
                  <CardTile key={card.id || i} card={card} price={prices[card.tcgPlayerId]} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Sealed Tab */}
        {tab === "sealed" && (
          <div className="section">
            <div className="section-header">
              <h2 className="section-title"><span className="dot" />Sealed Product</h2>
            </div>
            <div className="sealed-grid">
              {SEALED_PRODUCTS.map(p => <SealedTile key={p.id} product={p} />)}
            </div>
          </div>
        )}

        {/* Deals Tab */}
        {tab === "deals" && (
          <div className="section">
            <div className="section-header">
              <h2 className="section-title"><span className="dot" />Hot Deals Right Now</h2>
            </div>
            <div className={`status-bar ${error ? "error" : ""}`}>
              <span className="status-dot" />
              Showing cards where market price beats low listing by 10%+
            </div>
            <div className="card-grid">
              {cards
                .filter(c => {
                  const p = prices[c.tcgPlayerId];
                  if (!p?.marketPrice || !p?.lowPrice) return false;
                  return ((1 - p.lowPrice / p.marketPrice) * 100) >= 10;
                })
                .slice(0, 24)
                .map((card, i) => (
                  <CardTile key={card.id || i} card={card} price={prices[card.tcgPlayerId]} />
                ))
              }
              {/* Always show some sealed deals */}
              {SEALED_PRODUCTS.filter(p => p.amzPrice && p.tcgPrice > p.amzPrice).map(p => (
                <SealedTile key={`sealed-${p.id}`} product={p} />
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="footer">
          <p>
            Card data from <a href="https://lorcanajson.org" target="_blank" rel="noopener">LorcanaJSON</a> ·
            Prices from <a href="https://tcgcsv.com" target="_blank" rel="noopener">TCGCSV</a> /
            <a href="https://www.tcgplayer.com" target="_blank" rel="noopener"> TCGplayer</a>
          </p>
          <p style={{ marginTop: ".4rem" }}>
            Affiliate links present · Disney Lorcana is © Ravensburger / Disney
          </p>
        </footer>
      </div>
    </>
  );
}

// ── Placeholder cards for demo when CORS blocks fetches ────────────────────────
const PLACEHOLDER_CARDS = [
  { id:1, name:"Elsa", fullName:"Elsa – Snow Queen", color:"Amethyst", rarity:"Legendary", setNumber:1, images:{full:"https://lorcanajson.org/files/current/en/images/large/001-204.jpg"}, tcgPlayerUrl:"https://www.tcgplayer.com/search/lorcana/product?q=Elsa", tcgPlayerId:null },
  { id:2, name:"Mickey Mouse", fullName:"Mickey Mouse – Brave Little Tailor", color:"Amber", rarity:"Super Rare", setNumber:2, images:{full:null}, tcgPlayerUrl:null, tcgPlayerId:null },
  { id:3, name:"Maleficent", fullName:"Maleficent – Monstrous Dragon", color:"Emerald", rarity:"Legendary", setNumber:3, images:{full:null}, tcgPlayerUrl:null, tcgPlayerId:null },
  { id:4, name:"Moana", fullName:"Moana – Of Motunui", color:"Ruby", rarity:"Rare", setNumber:4, images:{full:null}, tcgPlayerUrl:null, tcgPlayerId:null },
  { id:5, name:"Simba", fullName:"Simba – Returned King", color:"Amber", rarity:"Super Rare", setNumber:5, images:{full:null}, tcgPlayerUrl:null, tcgPlayerId:null },
  { id:6, name:"Ursula", fullName:"Ursula – Eric's Bride", color:"Amethyst", rarity:"Legendary", setNumber:6, images:{full:null}, tcgPlayerUrl:null, tcgPlayerId:null },
  { id:7, name:"Ariel", fullName:"Ariel – Spectacular Singer", color:"Ruby", rarity:"Enchanted", setNumber:7, images:{full:null}, tcgPlayerUrl:null, tcgPlayerId:null },
  { id:8, name:"Captain Hook", fullName:"Captain Hook – Thinking a Happy Thought", color:"Steel", rarity:"Common", setNumber:8, images:{full:null}, tcgPlayerUrl:null, tcgPlayerId:null },
  { id:9, name:"Belle", fullName:"Belle – Strange but Special", color:"Sapphire", rarity:"Uncommon", setNumber:9, images:{full:null}, tcgPlayerUrl:null, tcgPlayerId:null },
  { id:10, name:"Gaston", fullName:"Gaston – Handsome Schemer", color:"Ruby", rarity:"Rare", setNumber:10, images:{full:null}, tcgPlayerUrl:null, tcgPlayerId:null },
  { id:11, name:"Cinderella", fullName:"Cinderella – Gentle and Kind", color:"Amber", rarity:"Rare", setNumber:11, images:{full:null}, tcgPlayerUrl:null, tcgPlayerId:null },
  { id:12, name:"Tinker Bell", fullName:"Tinker Bell – Giant Fairy", color:"Emerald", rarity:"Super Rare", setNumber:12, images:{full:null}, tcgPlayerUrl:null, tcgPlayerId:null },
].map(c => ({ ...c, tcgPlayerId: c.id * 100 }));
