// OTel Astronomy Shop Demo — Cloudflare Worker + D1
// Replicates the OpenTelemetry demo's API surface and "silent auth fail" pattern.
// Everything returns 200 even with wrong/missing session state.
// Session IDs are client-generated UUIDs — server never issues or validates them.
//
// SECURITY NOTE: This is a controlled demo app for load test correlation testing.
// All data served via innerHTML comes from our own seeded D1 database, not user input.
// Not intended for production use.

// --- Currency conversion rates (relative to EUR, from OTel demo) ---
const CURRENCY_RATES = {
  EUR: 1.0, USD: 1.0838, JPY: 164.85, BGN: 1.9558, CZK: 25.268,
  DKK: 7.4587, GBP: 0.85605, HUF: 396.40, PLN: 4.3121, RON: 4.9763,
  SEK: 11.2590, CHF: 0.9403, ISK: 149.80, NOK: 11.7045, HRK: 7.5345,
  RUB: 99.42, TRY: 35.67, AUD: 1.6599, BRL: 6.2834, CAD: 1.5243,
  CNY: 7.9087, HKD: 8.4394, IDR: 17553.0, ILS: 3.9192, INR: 92.66,
  KRW: 1504.72, MXN: 21.878, MYR: 4.8298, NZD: 1.8404, PHP: 62.93,
  SGD: 1.4553, THB: 37.174, ZAR: 19.738
};

const SUPPORTED_CURRENCIES = Object.keys(CURRENCY_RATES);

function convertCurrency(units, nanos, fromCode, toCode) {
  if (fromCode === toCode) return { currencyCode: toCode, units, nanos };
  const fromRate = CURRENCY_RATES[fromCode] || 1;
  const toRate = CURRENCY_RATES[toCode] || 1;
  const totalNanos = (units * 1e9 + nanos) * (toRate / fromRate);
  const newUnits = Math.floor(totalNanos / 1e9);
  const newNanos = Math.round(totalNanos % 1e9);
  return { currencyCode: toCode, units: newUnits, nanos: newNanos };
}

function formatProduct(row, currencyCode) {
  const price = currencyCode && currencyCode !== 'USD'
    ? convertCurrency(row.price_units, row.price_nanos, 'USD', currencyCode)
    : { currencyCode: 'USD', units: row.price_units, nanos: row.price_nanos };
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    picture: row.picture,
    priceUsd: price,
    categories: row.categories ? row.categories.split(',') : []
  };
}

function generateId() {
  return crypto.randomUUID();
}

function generateTrackingId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = '';
  for (let i = 0; i < 18; i++) {
    if (i === 2 || i === 6 || i === 13) { id += '-'; continue; }
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

function jsonResponse(data, corsHeaders, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// --- Hardcoded ads matching OTel demo ---
const ADS = [
  { redirectUrl: '/product/2ZYFJ3GM2N', text: 'Roof Binoculars for viewing nature!' },
  { redirectUrl: '/product/66VCHSJNUP', text: 'Starsense Explorer — your personal sky guide!' },
  { redirectUrl: '/product/0PUK6V6EV0', text: 'Start imaging planets with the Solar System Color Imager!' },
  { redirectUrl: '/product/9SIQT8TOJO', text: 'RASA V2 — pro deep-sky imaging starts here.' },
  { redirectUrl: '/product/OLJCESPC7Z', text: 'Explorascope — great views on the go!' },
  { redirectUrl: '/product/1YMWWN1N4O', text: 'Catch the next eclipse with the Travel Solar Scope!' },
  { redirectUrl: '/product/HQTGWGPNH4', text: 'Discover the history of comets!' }
];

// =======================================================================
// API Handlers
// =======================================================================

// GET /api/products — list all products
async function handleListProducts(url, env, cors) {
  const currencyCode = url.searchParams.get('currencyCode') || 'USD';
  const { results } = await env.DB.prepare('SELECT * FROM products').all();
  return jsonResponse(results.map(r => formatProduct(r, currencyCode)), cors);
}

// GET /api/products/:id — single product
async function handleGetProduct(path, url, env, cors) {
  const productId = path.split('/api/products/')[1];
  const currencyCode = url.searchParams.get('currencyCode') || 'USD';
  const row = await env.DB.prepare('SELECT * FROM products WHERE id = ?').bind(productId).first();
  if (!row) return jsonResponse({ error: 'product not found' }, cors, 404);
  return jsonResponse(formatProduct(row, currencyCode), cors);
}

// GET /api/cart — get cart for session
// SILENT FAIL: unknown/missing sessionId returns empty cart with 200
async function handleGetCart(url, env, cors) {
  const sessionId = url.searchParams.get('sessionId') || '';
  const currencyCode = url.searchParams.get('currencyCode') || 'USD';

  if (!sessionId) {
    return jsonResponse({ userId: '', items: [] }, cors);
  }

  const { results: cartRows } = await env.DB.prepare(
    `SELECT ci.product_id, ci.quantity, p.id, p.name, p.description, p.picture,
            p.price_units, p.price_nanos, p.price_currency_code, p.categories
     FROM cart_items ci
     JOIN products p ON ci.product_id = p.id
     WHERE ci.user_id = ?`
  ).bind(sessionId).all();

  const items = cartRows.map(r => ({
    productId: r.product_id,
    quantity: r.quantity,
    product: formatProduct(r, currencyCode)
  }));

  return jsonResponse({ userId: sessionId, items }, cors);
}

// POST /api/cart — add item to cart
// SILENT FAIL: any userId accepted, no validation
async function handleAddToCart(request, env, cors) {
  const body = await request.json();
  const userId = body.userId || '';
  const item = body.item || {};
  const productId = item.productId || '';
  const quantity = item.quantity || 1;

  if (!userId || !productId) {
    // Still return 200 with the cart — silent fail pattern
    return jsonResponse({ userId: userId || '', items: [] }, cors);
  }

  // Upsert: add quantity if exists, insert if not
  await env.DB.prepare(
    `INSERT INTO cart_items (user_id, product_id, quantity)
     VALUES (?, ?, ?)
     ON CONFLICT(user_id, product_id) DO UPDATE SET quantity = quantity + excluded.quantity`
  ).bind(userId, productId, quantity).run();

  // Return raw cart (no product enrichment, matching OTel POST behavior)
  const { results } = await env.DB.prepare(
    'SELECT product_id, quantity FROM cart_items WHERE user_id = ?'
  ).bind(userId).all();

  return jsonResponse({
    userId,
    items: results.map(r => ({ productId: r.product_id, quantity: r.quantity }))
  }, cors);
}

// DELETE /api/cart — empty cart
async function handleEmptyCart(request, env, cors) {
  const body = await request.json();
  const userId = body.userId || '';
  if (userId) {
    await env.DB.prepare('DELETE FROM cart_items WHERE user_id = ?').bind(userId).run();
  }
  return new Response(null, { status: 204, headers: cors });
}

// POST /api/checkout — place order
// SILENT FAIL: checkout with empty/wrong userId succeeds with zero items, 200
async function handleCheckout(request, url, env, cors) {
  const body = await request.json();
  const userId = body.userId || '';
  const userCurrency = body.userCurrency || 'USD';
  const currencyCode = url.searchParams.get('currencyCode') || userCurrency;
  const email = body.email || '';
  const address = body.address || {};
  const orderId = generateId();
  const trackingId = generateTrackingId();

  // Read cart items (may be empty — silent fail)
  const { results: cartRows } = await env.DB.prepare(
    `SELECT ci.product_id, ci.quantity, p.id, p.name, p.description, p.picture,
            p.price_units, p.price_nanos, p.price_currency_code, p.categories
     FROM cart_items ci
     JOIN products p ON ci.product_id = p.id
     WHERE ci.user_id = ?`
  ).bind(userId).all();

  // Compute shipping: $4.99 base + $1.99 per unique item
  let shippingUnits = 4;
  let shippingNanos = 990000000;
  for (let i = 0; i < cartRows.length; i++) {
    shippingNanos += 1990000000;
    shippingUnits += Math.floor(shippingNanos / 1e9);
    shippingNanos = shippingNanos % 1e9;
  }
  const shippingCost = convertCurrency(shippingUnits, shippingNanos, 'USD', currencyCode);

  // Build order items with costs
  const orderItems = cartRows.map(r => {
    const cost = convertCurrency(r.price_units * r.quantity, r.price_nanos * r.quantity, 'USD', currencyCode);
    return {
      cost,
      item: {
        productId: r.product_id,
        quantity: r.quantity,
        product: formatProduct(r, currencyCode)
      }
    };
  });

  // Persist order + items + empty cart in a single batch
  const stmts = [
    env.DB.prepare(
      `INSERT INTO orders (order_id, user_id, user_currency, email, shipping_tracking_id,
        shipping_cost_units, shipping_cost_nanos, shipping_cost_currency,
        street_address, city, state, country, zip_code)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(orderId, userId, currencyCode, email, trackingId,
      shippingCost.units, shippingCost.nanos, shippingCost.currencyCode,
      address.streetAddress || '', address.city || '', address.state || '',
      address.country || '', address.zipCode || '')
  ];

  for (const oi of orderItems) {
    stmts.push(
      env.DB.prepare(
        `INSERT INTO order_items (order_id, product_id, quantity, cost_currency_code, cost_units, cost_nanos)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).bind(orderId, oi.item.productId, oi.item.quantity,
        oi.cost.currencyCode, oi.cost.units, oi.cost.nanos)
    );
  }

  // Empty cart after checkout
  stmts.push(
    env.DB.prepare('DELETE FROM cart_items WHERE user_id = ?').bind(userId)
  );

  await env.DB.batch(stmts);

  return jsonResponse({
    orderId,
    shippingTrackingId: trackingId,
    shippingCost,
    shippingAddress: address,
    items: orderItems
  }, cors);
}

// GET /api/recommendations — random products excluding input
async function handleRecommendations(url, env, cors) {
  const currencyCode = url.searchParams.get('currencyCode') || 'USD';
  const productIds = url.searchParams.getAll('productIds');
  const { results } = await env.DB.prepare('SELECT * FROM products').all();

  const exclude = new Set(productIds);
  let candidates = results.filter(r => !exclude.has(r.id));
  // Fisher-Yates shuffle and take up to 4
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  return jsonResponse(candidates.slice(0, 4).map(r => formatProduct(r, currencyCode)), cors);
}

// GET /api/shipping — shipping quote
async function handleShipping(url, cors) {
  const currencyCode = url.searchParams.get('currencyCode') || 'USD';
  let itemCount = 0;
  try {
    const itemList = JSON.parse(url.searchParams.get('itemList') || '[]');
    itemCount = itemList.length;
  } catch (e) { /* silent */ }

  let units = 4, nanos = 990000000;
  for (let i = 0; i < itemCount; i++) {
    nanos += 1990000000;
    units += Math.floor(nanos / 1e9);
    nanos = nanos % 1e9;
  }

  return jsonResponse(convertCurrency(units, nanos, 'USD', currencyCode), cors);
}

// GET /api/currency — list supported currencies
function handleCurrency(cors) {
  return jsonResponse(SUPPORTED_CURRENCIES, cors);
}

// GET /api/data — ads
function handleAds(url, cors) {
  const shuffled = [...ADS].sort(() => 0.5 - Math.random());
  return jsonResponse(shuffled.slice(0, 2), cors);
}

// =======================================================================
// HTML Pages — all content from our own seeded DB, no user-generated HTML
// =======================================================================

function getHomePage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Astronomy Shop — LoadMagic Demo</title>
  <link rel="icon" type="image/png" href="/images/favicon.png">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0a1a; color: #e0e0e0; }
    header { background: linear-gradient(135deg, #1a1a3e 0%, #2d1b69 100%); padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center; }
    header .brand { display: flex; align-items: center; gap: 0.75rem; }
    header .brand img { height: 28px; }
    header h1 { font-size: 1.5rem; color: #c8a2f8; }
    header nav { display: flex; align-items: center; }
    header nav a { color: #a0a0c0; text-decoration: none; margin-left: 1.5rem; }
    header nav a:hover { color: #c8a2f8; }
    .banner { background: linear-gradient(135deg, #2d1b69 0%, #1a0a3e 100%); padding: 3rem 2rem; text-align: center; }
    .banner h2 { font-size: 2rem; color: #fff; margin-bottom: 0.5rem; }
    .banner p { color: #a0a0c0; font-size: 1.1rem; }
    .products { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; padding: 2rem; max-width: 1200px; margin: 0 auto; }
    .product-card { background: #141428; border: 1px solid #2a2a4a; border-radius: 8px; padding: 1.5rem; transition: border-color 0.2s; cursor: pointer; }
    .product-card:hover { border-color: #6b4ebd; }
    .product-card h3 { color: #c8a2f8; margin-bottom: 0.5rem; font-size: 1.1rem; }
    .product-card .desc { color: #888; font-size: 0.85rem; margin-bottom: 1rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .product-card .price { color: #4ade80; font-weight: bold; font-size: 1.2rem; }
    .product-card .cats { color: #666; font-size: 0.75rem; margin-top: 0.5rem; }
    .cart-bar { position: fixed; bottom: 0; left: 0; right: 0; background: #1a1a3e; padding: 1rem 2rem; display: none; justify-content: space-between; align-items: center; border-top: 1px solid #2a2a4a; }
    .cart-bar.visible { display: flex; }
    .cart-bar button { background: #6b4ebd; color: white; border: none; padding: 0.7rem 1.5rem; border-radius: 6px; cursor: pointer; font-size: 1rem; }
    .cart-bar button:hover { background: #7c5fd0; }
    #currency-select { background: #1a1a3e; color: #a0a0c0; border: 1px solid #2a2a4a; padding: 0.3rem; border-radius: 4px; margin-left: 1rem; }
    footer { text-align: center; padding: 2rem; color: #444; font-size: 0.8rem; margin-bottom: 60px; }
    footer a { color: #6b4ebd; }
  </style>
</head>
<body>
  <header>
    <div class="brand">
      <img src="/images/loadmagic-shadow.png" alt="LoadMagic">
      <h1>Astronomy Shop</h1>
    </div>
    <nav>
      <a href="/">Home</a>
      <a href="/cart">Cart (<span id="cart-count">0</span>)</a>
      <label for="currency-select">Currency:</label>
      <select id="currency-select" onchange="setCurrency(this.value)">
        <option value="USD">USD</option><option value="EUR">EUR</option>
        <option value="GBP">GBP</option><option value="JPY">JPY</option>
        <option value="CAD">CAD</option><option value="AUD">AUD</option>
      </select>
    </nav>
  </header>
  <div class="banner">
    <h2>Welcome to the Astronomy Shop</h2>
    <p>Telescopes, binoculars, and accessories for exploring the cosmos</p>
  </div>
  <div class="products" id="product-grid"></div>
  <div class="cart-bar" id="cart-bar">
    <span id="cart-summary"></span>
    <button onclick="window.location='/cart'">View Cart & Checkout</button>
  </div>
  <footer>
    <p>Astronomy Shop Demo &mdash; powered by <a href="https://loadmagic.ai">LoadMagic.ai</a></p>
    <p style="margin-top:0.3rem;font-size:0.7rem;">AI-powered performance testing &mdash; <a href="https://loadmagic.ai">Try it free</a></p>
  </footer>
  <script>
    // Session: client-generated UUID stored in localStorage (THE silent-fail pattern)
    function getSession() {
      let s = localStorage.getItem('session');
      if (!s) {
        s = JSON.stringify({ userId: crypto.randomUUID(), currencyCode: 'USD' });
        localStorage.setItem('session', s);
      }
      return JSON.parse(s);
    }
    function setSessionValue(key, value) {
      const s = getSession();
      s[key] = value;
      localStorage.setItem('session', JSON.stringify(s));
    }
    function setCurrency(code) {
      setSessionValue('currencyCode', code);
      loadProducts();
    }
    function formatPrice(money) {
      const amt = money.units + money.nanos / 1e9;
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: money.currencyCode }).format(amt);
    }
    // Escape text to prevent any injection from DB content
    function esc(str) { const d = document.createElement('div'); d.textContent = str; return d.innerHTML; }

    async function loadProducts() {
      const session = getSession();
      const res = await fetch('/api/products?currencyCode=' + session.currencyCode);
      const products = await res.json();
      const grid = document.getElementById('product-grid');
      grid.innerHTML = products.map(function(p) {
        return '<div class="product-card" data-id="' + esc(p.id) + '">' +
          '<h3>' + esc(p.name) + '</h3>' +
          '<p class="desc">' + esc(p.description) + '</p>' +
          '<div class="price">' + esc(formatPrice(p.priceUsd)) + '</div>' +
          '<div class="cats">' + esc(p.categories.join(', ')) + '</div></div>';
      }).join('');
      grid.querySelectorAll('.product-card').forEach(function(card) {
        card.addEventListener('click', function() { window.location = '/product/' + card.dataset.id; });
      });
    }

    async function updateCartCount() {
      const session = getSession();
      const res = await fetch('/api/cart?sessionId=' + session.userId);
      const cart = await res.json();
      const count = cart.items.reduce(function(sum, i) { return sum + i.quantity; }, 0);
      document.getElementById('cart-count').textContent = count;
      const bar = document.getElementById('cart-bar');
      if (count > 0) {
        bar.classList.add('visible');
        document.getElementById('cart-summary').textContent = count + ' item(s) in cart';
      } else {
        bar.classList.remove('visible');
      }
    }

    loadProducts();
    updateCartCount();
  </script>
</body>
</html>`;
}

function getProductPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Product — Astronomy Shop — LoadMagic Demo</title>
  <link rel="icon" type="image/png" href="/images/favicon.png">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0a1a; color: #e0e0e0; }
    header { background: linear-gradient(135deg, #1a1a3e 0%, #2d1b69 100%); padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center; }
    header .brand { display: flex; align-items: center; gap: 0.75rem; }
    header .brand img { height: 28px; }
    header h1 a { font-size: 1.5rem; color: #c8a2f8; text-decoration: none; }
    header nav a { color: #a0a0c0; text-decoration: none; margin-left: 1.5rem; }
    .product-detail { max-width: 800px; margin: 2rem auto; padding: 2rem; background: #141428; border-radius: 8px; border: 1px solid #2a2a4a; }
    .product-detail h2 { color: #c8a2f8; margin-bottom: 1rem; }
    .product-detail .desc { color: #aaa; line-height: 1.6; margin-bottom: 1.5rem; }
    .product-detail .price { color: #4ade80; font-size: 1.5rem; font-weight: bold; margin-bottom: 1.5rem; }
    .product-detail .cats { color: #666; margin-bottom: 1.5rem; }
    .qty-row { display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; }
    .qty-row select { background: #1a1a3e; color: #e0e0e0; border: 1px solid #2a2a4a; padding: 0.5rem; border-radius: 4px; }
    button.add-cart { background: #6b4ebd; color: white; border: none; padding: 0.8rem 2rem; border-radius: 6px; cursor: pointer; font-size: 1rem; }
    button.add-cart:hover { background: #7c5fd0; }
    .recommendations { max-width: 800px; margin: 2rem auto; padding: 0 2rem; }
    .recommendations h3 { color: #c8a2f8; margin-bottom: 1rem; }
    .rec-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 1rem; }
    .rec-card { background: #141428; border: 1px solid #2a2a4a; border-radius: 6px; padding: 1rem; cursor: pointer; }
    .rec-card:hover { border-color: #6b4ebd; }
    .rec-card h4 { color: #c8a2f8; font-size: 0.9rem; margin-bottom: 0.3rem; }
    .rec-card .price { color: #4ade80; font-size: 0.95rem; }
    .added-msg { color: #4ade80; display: none; margin-top: 0.5rem; }
  </style>
</head>
<body>
  <header>
    <div class="brand">
      <img src="/images/loadmagic-shadow.png" alt="LoadMagic">
      <h1><a href="/">Astronomy Shop</a></h1>
    </div>
    <nav><a href="/">Home</a> <a href="/cart">Cart</a></nav>
  </header>
  <div class="product-detail" id="product-detail">Loading...</div>
  <div class="recommendations"><h3>You may also like</h3><div class="rec-grid" id="rec-grid"></div></div>
  <script>
    function getSession() {
      let s = localStorage.getItem('session');
      if (!s) { s = JSON.stringify({ userId: crypto.randomUUID(), currencyCode: 'USD' }); localStorage.setItem('session', s); }
      return JSON.parse(s);
    }
    function formatPrice(money) {
      const amt = money.units + money.nanos / 1e9;
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: money.currencyCode }).format(amt);
    }
    function esc(str) { const d = document.createElement('div'); d.textContent = str; return d.innerHTML; }

    const productId = window.location.pathname.split('/product/')[1];
    const session = getSession();

    async function load() {
      const res = await fetch('/api/products/' + productId + '?currencyCode=' + session.currencyCode);
      const p = await res.json();
      document.title = p.name + ' — Astronomy Shop';
      const detail = document.getElementById('product-detail');
      detail.innerHTML =
        '<h2>' + esc(p.name) + '</h2>' +
        '<p class="desc">' + esc(p.description) + '</p>' +
        '<div class="price">' + esc(formatPrice(p.priceUsd)) + '</div>' +
        '<div class="cats">Categories: ' + esc(p.categories.join(', ')) + '</div>' +
        '<div class="qty-row"><label>Qty:</label><select id="qty">' +
        [1,2,3,4,5,10].map(function(n) { return '<option value="' + n + '">' + n + '</option>'; }).join('') +
        '</select><button class="add-cart" id="add-btn">Add to Cart</button></div>' +
        '<div class="added-msg" id="added-msg">Added to cart!</div>';
      document.getElementById('add-btn').addEventListener('click', addToCart);

      // Load recommendations
      const recRes = await fetch('/api/recommendations?productIds=' + productId + '&currencyCode=' + session.currencyCode);
      const recs = await recRes.json();
      const recGrid = document.getElementById('rec-grid');
      recGrid.innerHTML = recs.map(function(r) {
        return '<div class="rec-card" data-id="' + esc(r.id) + '">' +
          '<h4>' + esc(r.name) + '</h4><div class="price">' + esc(formatPrice(r.priceUsd)) + '</div></div>';
      }).join('');
      recGrid.querySelectorAll('.rec-card').forEach(function(card) {
        card.addEventListener('click', function() { window.location = '/product/' + card.dataset.id; });
      });
    }

    async function addToCart() {
      const qty = parseInt(document.getElementById('qty').value);
      await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: session.userId, item: { productId: productId, quantity: qty } })
      });
      const msg = document.getElementById('added-msg');
      msg.style.display = 'block';
      setTimeout(function() { msg.style.display = 'none'; }, 2000);
    }

    load();
  </script>
</body>
</html>`;
}

function getCartPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cart — Astronomy Shop — LoadMagic Demo</title>
  <link rel="icon" type="image/png" href="/images/favicon.png">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0a1a; color: #e0e0e0; }
    header { background: linear-gradient(135deg, #1a1a3e 0%, #2d1b69 100%); padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center; }
    header .brand { display: flex; align-items: center; gap: 0.75rem; }
    header .brand img { height: 28px; }
    header h1 a { font-size: 1.5rem; color: #c8a2f8; text-decoration: none; }
    header nav a { color: #a0a0c0; text-decoration: none; margin-left: 1.5rem; }
    .container { max-width: 800px; margin: 2rem auto; padding: 0 2rem; }
    h2 { color: #c8a2f8; margin-bottom: 1.5rem; }
    .cart-item { display: flex; justify-content: space-between; align-items: center; background: #141428; border: 1px solid #2a2a4a; border-radius: 6px; padding: 1rem; margin-bottom: 0.75rem; }
    .cart-item .name { color: #c8a2f8; }
    .cart-item .qty { color: #888; }
    .cart-item .price { color: #4ade80; font-weight: bold; }
    .empty-msg { color: #666; font-style: italic; }
    .empty-msg a { color: #6b4ebd; }
    .total-row { display: flex; justify-content: space-between; padding: 1rem 0; border-top: 1px solid #2a2a4a; margin-top: 1rem; font-size: 1.2rem; }
    .total-row .price { color: #4ade80; font-weight: bold; }
    .checkout-form { background: #141428; border: 1px solid #2a2a4a; border-radius: 8px; padding: 1.5rem; margin-top: 2rem; }
    .checkout-form h3 { color: #c8a2f8; margin-bottom: 1rem; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
    .form-grid label { color: #888; font-size: 0.85rem; }
    .form-grid input { background: #1a1a3e; color: #e0e0e0; border: 1px solid #2a2a4a; padding: 0.5rem; border-radius: 4px; width: 100%; }
    .form-grid .full { grid-column: 1 / -1; }
    button.checkout-btn { background: #6b4ebd; color: white; border: none; padding: 0.8rem 2rem; border-radius: 6px; cursor: pointer; font-size: 1rem; margin-top: 1rem; width: 100%; }
    button.checkout-btn:hover { background: #7c5fd0; }
    button.empty-btn { background: #333; color: #888; border: 1px solid #444; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; margin-top: 0.5rem; }
    .order-result { background: #0d2818; border: 1px solid #1a5c2e; border-radius: 8px; padding: 1.5rem; margin-top: 2rem; display: none; }
    .order-result h3 { color: #4ade80; margin-bottom: 0.5rem; }
    .order-result p { color: #aaa; margin-bottom: 0.3rem; }
  </style>
</head>
<body>
  <header>
    <div class="brand">
      <img src="/images/loadmagic-shadow.png" alt="LoadMagic">
      <h1><a href="/">Astronomy Shop</a></h1>
    </div>
    <nav><a href="/">Home</a> <a href="/cart">Cart</a></nav>
  </header>
  <div class="container">
    <h2>Shopping Cart</h2>
    <div id="cart-items"></div>
    <div class="total-row" id="total-row" style="display:none;">
      <span>Total</span><span class="price" id="total-price"></span>
    </div>
    <button class="empty-btn" id="empty-btn" style="display:none;">Empty Cart</button>
    <div class="checkout-form" id="checkout-form" style="display:none;">
      <h3>Checkout</h3>
      <div class="form-grid">
        <div class="full"><label>Email</label><input id="f-email" value="larry_sergei@example.com"></div>
        <div><label>Street</label><input id="f-street" value="1600 Amphitheatre Parkway"></div>
        <div><label>City</label><input id="f-city" value="Mountain View"></div>
        <div><label>State</label><input id="f-state" value="CA"></div>
        <div><label>Zip</label><input id="f-zip" value="94043"></div>
        <div class="full"><label>Country</label><input id="f-country" value="United States"></div>
        <div><label>Card Number</label><input id="f-card" value="4432-8015-6152-0454"></div>
        <div><label>Exp Month</label><input id="f-expmonth" value="1" type="number"></div>
        <div><label>Exp Year</label><input id="f-expyear" value="2039" type="number"></div>
        <div><label>CVV</label><input id="f-cvv" value="672" type="number"></div>
      </div>
      <button class="checkout-btn" id="checkout-btn">Place Order</button>
    </div>
    <div class="order-result" id="order-result">
      <h3>Order Confirmed!</h3>
      <p>Order ID: <span id="r-orderid"></span></p>
      <p>Tracking: <span id="r-tracking"></span></p>
      <p>Shipping: <span id="r-shipping"></span></p>
    </div>
  </div>
  <script>
    function getSession() {
      let s = localStorage.getItem('session');
      if (!s) { s = JSON.stringify({ userId: crypto.randomUUID(), currencyCode: 'USD' }); localStorage.setItem('session', s); }
      return JSON.parse(s);
    }
    function formatPrice(money) {
      const amt = money.units + money.nanos / 1e9;
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: money.currencyCode }).format(amt);
    }
    function esc(str) { const d = document.createElement('div'); d.textContent = str; return d.innerHTML; }
    const session = getSession();

    async function loadCart() {
      const res = await fetch('/api/cart?sessionId=' + session.userId + '&currencyCode=' + session.currencyCode);
      const cart = await res.json();
      const el = document.getElementById('cart-items');
      if (!cart.items.length) {
        el.innerHTML = '<p class="empty-msg">Your cart is empty. <a href="/">Browse products</a></p>';
        document.getElementById('total-row').style.display = 'none';
        document.getElementById('empty-btn').style.display = 'none';
        document.getElementById('checkout-form').style.display = 'none';
        return;
      }
      let total = 0;
      el.innerHTML = cart.items.map(function(i) {
        const amt = i.product.priceUsd.units + i.product.priceUsd.nanos / 1e9;
        const lineTotal = amt * i.quantity;
        total += lineTotal;
        return '<div class="cart-item"><div><span class="name">' + esc(i.product.name) +
          '</span> <span class="qty">x' + i.quantity + '</span></div>' +
          '<div class="price">' + esc(formatPrice({
            currencyCode: i.product.priceUsd.currencyCode,
            units: Math.floor(lineTotal),
            nanos: Math.round((lineTotal % 1) * 1e9)
          })) + '</div></div>';
      }).join('');
      document.getElementById('total-row').style.display = 'flex';
      document.getElementById('total-price').textContent = formatPrice({
        currencyCode: session.currencyCode,
        units: Math.floor(total),
        nanos: Math.round((total % 1) * 1e9)
      });
      document.getElementById('empty-btn').style.display = 'inline-block';
      document.getElementById('checkout-form').style.display = 'block';
    }

    async function emptyCart() {
      await fetch('/api/cart', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: session.userId })
      });
      loadCart();
    }

    async function checkout() {
      const res = await fetch('/api/checkout?currencyCode=' + session.currencyCode, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session.userId,
          userCurrency: session.currencyCode,
          email: document.getElementById('f-email').value,
          address: {
            streetAddress: document.getElementById('f-street').value,
            city: document.getElementById('f-city').value,
            state: document.getElementById('f-state').value,
            zipCode: document.getElementById('f-zip').value,
            country: document.getElementById('f-country').value
          },
          creditCard: {
            creditCardNumber: document.getElementById('f-card').value,
            creditCardExpirationMonth: parseInt(document.getElementById('f-expmonth').value),
            creditCardExpirationYear: parseInt(document.getElementById('f-expyear').value),
            creditCardCvv: parseInt(document.getElementById('f-cvv').value)
          }
        })
      });
      const order = await res.json();
      document.getElementById('checkout-form').style.display = 'none';
      document.getElementById('cart-items').innerHTML = '';
      document.getElementById('total-row').style.display = 'none';
      document.getElementById('empty-btn').style.display = 'none';
      const result = document.getElementById('order-result');
      result.style.display = 'block';
      document.getElementById('r-orderid').textContent = order.orderId;
      document.getElementById('r-tracking').textContent = order.shippingTrackingId;
      document.getElementById('r-shipping').textContent = formatPrice(order.shippingCost);
    }

    document.getElementById('empty-btn').addEventListener('click', emptyCart);
    document.getElementById('checkout-btn').addEventListener('click', checkout);
    loadCart();
  </script>
</body>
</html>`;
}

// =======================================================================
// Worker entry point
// =======================================================================
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // --- API routes ---
      if (path === '/api/products' && method === 'GET') {
        return await handleListProducts(url, env, corsHeaders);
      }
      if (path.startsWith('/api/products/') && method === 'GET') {
        return await handleGetProduct(path, url, env, corsHeaders);
      }
      if (path === '/api/cart' && method === 'GET') {
        return await handleGetCart(url, env, corsHeaders);
      }
      if (path === '/api/cart' && method === 'POST') {
        return await handleAddToCart(request, env, corsHeaders);
      }
      if (path === '/api/cart' && method === 'DELETE') {
        return await handleEmptyCart(request, env, corsHeaders);
      }
      if (path === '/api/checkout' && method === 'POST') {
        return await handleCheckout(request, url, env, corsHeaders);
      }
      if (path === '/api/recommendations' && method === 'GET') {
        return await handleRecommendations(url, env, corsHeaders);
      }
      if (path === '/api/shipping' && method === 'GET') {
        return await handleShipping(url, corsHeaders);
      }
      if (path === '/api/currency' && method === 'GET') {
        return handleCurrency(corsHeaders);
      }
      if (path === '/api/data' && method === 'GET') {
        return handleAds(url, corsHeaders);
      }

      // --- HTML pages ---
      if (path === '/' && method === 'GET') {
        return new Response(getHomePage(), { headers: { ...corsHeaders, 'Content-Type': 'text/html' } });
      }
      if (path.startsWith('/product/') && method === 'GET') {
        return new Response(getProductPage(), { headers: { ...corsHeaders, 'Content-Type': 'text/html' } });
      }
      if (path === '/cart' && method === 'GET') {
        return new Response(getCartPage(), { headers: { ...corsHeaders, 'Content-Type': 'text/html' } });
      }

      // --- 404 ---
      return jsonResponse({ error: 'not found' }, corsHeaders, 404);

    } catch (err) {
      return jsonResponse({ error: 'internal error', message: err.message }, corsHeaders, 500);
    }
  }
};
