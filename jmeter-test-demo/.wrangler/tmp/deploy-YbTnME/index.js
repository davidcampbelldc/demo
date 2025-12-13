var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/index.js
var index_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    };
    if (method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }
    try {
      if (path === "/__access" || path === "/__access/") {
        return await handleAccessGate(request, env, corsHeaders);
      }
      const accessGateResponse = await enforceSiteAccess(request, env, corsHeaders);
      if (accessGateResponse) {
        return accessGateResponse;
      }
      switch (true) {
        case (path === "/" && method === "GET"):
          return new Response(getHomePage(), {
            headers: { ...corsHeaders, "Content-Type": "text/html" }
          });
        case (path === "/login" && method === "GET"):
          return new Response(getLoginPage(), {
            headers: { ...corsHeaders, "Content-Type": "text/html" }
          });
        case (path === "/products" && method === "GET"):
          return new Response(getProductsPage(), {
            headers: { ...corsHeaders, "Content-Type": "text/html" }
          });
        case (path.startsWith("/product/") && method === "GET"):
          return new Response(getProductDetailPage(request), {
            headers: { ...corsHeaders, "Content-Type": "text/html" }
          });
        case (path === "/dashboard" && method === "GET"):
          return new Response(getDashboardPage(), {
            headers: { ...corsHeaders, "Content-Type": "text/html" }
          });
        case (path === "/dashboard1" && method === "GET"):
          return new Response(getDashboard1Page(), {
            headers: { ...corsHeaders, "Content-Type": "text/html" }
          });
        case (path === "/api/login" && method === "POST"):
          return await handleLogin(request, env, corsHeaders);
        case (path === "/api/products" && method === "GET"):
          return await handleGetProducts(request, env, corsHeaders);
        case (path.startsWith("/api/products/") && method === "GET"):
          return await handleGetSingleProduct(request, env, corsHeaders);
        case (path === "/api/user/profile" && method === "POST"):
          return await handleGetProfile(request, env, corsHeaders);
        case (path === "/api/orders" && method === "POST"):
          return await handleCreateOrder(request, env, corsHeaders);
        case (path === "/checkout" && method === "GET"):
          return new Response(getCheckoutPage(), {
            headers: { ...corsHeaders, "Content-Type": "text/html" }
          });
        case (path === "/api/checkout/process" && method === "POST"):
          return await handleProcessCheckout(request, env, corsHeaders);
        case (path === "/api/cart/add" && method === "POST"):
          return await handleAddToCart(request, env, corsHeaders);
        case (path === "/api/cart" && method === "GET"):
          return await handleGetCart(request, env, corsHeaders);
        case (path.startsWith("/api/orders/") && method === "GET"):
          return await handleGetOrder(request, env, corsHeaders);
        case (path === "/api/http-test" && method === "POST"):
          return await handleHttpTest(request, env, corsHeaders);
        case (path === "/api/http-test-step2" && method === "POST"):
          return await handleHttpTestStep2(request, env, corsHeaders);
        case (path === "/api/dashboard1/step1" && method === "POST"):
          return await handleDashboard1Step1(request, env, corsHeaders);
        case (path === "/api/dashboard1/step2" && method === "POST"):
          return await handleDashboard1Step2(request, env, corsHeaders);
        case (path === "/api/dashboard1/step3" && method === "POST"):
          return await handleDashboard1Step3(request, env, corsHeaders);
        case (path === "/api/dashboard1/step4" && method === "POST"):
          return await handleDashboard1Step4(request, env, corsHeaders);
        case (path === "/api/dashboard1/step5" && method === "POST"):
          return await handleDashboard1Step5(request, env, corsHeaders);
        case (path === "/api/dashboard1/step6" && method === "POST"):
          return await handleDashboard1Step6(request, env, corsHeaders);
        case (path === "/favicon.ico" && method === "GET"):
          if (!env.ASSETS) {
            return new Response("Static assets not configured", { status: 500, headers: corsHeaders });
          }
          return await env.ASSETS.fetch(new Request(new URL("/images/favicon.png", request.url), request));
        case (path.startsWith("/images/") && method === "GET"):
          if (!env.ASSETS) {
            return new Response("Static assets not configured", { status: 500, headers: corsHeaders });
          }
          return await env.ASSETS.fetch(new Request(new URL(path, request.url), request));
        case (path.startsWith("/static/") && method === "GET"):
          if (!env.ASSETS) {
            return new Response("Static assets not configured", { status: 500, headers: corsHeaders });
          }
          const assetUrl = new URL(request.url);
          assetUrl.pathname = path.replace(/^\/static/, "");
          return await env.ASSETS.fetch(new Request(assetUrl, request));
        default:
          return new Response("Not Found", {
            status: 404,
            headers: corsHeaders
          });
      }
    } catch (error) {
      console.error("Worker error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
  }
};
async function handleLogin(request, env, corsHeaders) {
  try {
    const body = await request.json();
    const { username, password } = body;
    if (!username || !password) {
      return new Response(JSON.stringify({ error: "Username and password required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    if (!env.DB) {
      return new Response(JSON.stringify({
        error: "Database not available",
        debug: "env.DB is undefined - check wrangler.toml binding"
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    const result = await env.DB.prepare(
      "SELECT id, username, email FROM users WHERE username = ? AND password_hash = ?"
    ).bind(username, `hash${password}`).first();
    if (!result) {
      return new Response(JSON.stringify({ error: "Invalid credentials" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    const sessionToken = generateToken();
    const sessionId = `sess_${result.id}_${Date.now()}`;
    const csrfToken = generateToken();
    const correlationId = generateToken();
    await env.DB.prepare(
      "UPDATE users SET session_token = ?, session_id = ?, csrf_token = ?, correlation_id = ? WHERE id = ?"
    ).bind(sessionToken, sessionId, csrfToken, correlationId, result.id).run();
    return new Response(JSON.stringify({
      success: true,
      user_id: result.id,
      username: result.username,
      email: result.email,
      session_token: sessionToken,
      session_id: sessionId,
      // Additional session ID for payload correlation
      csrf_token: csrfToken,
      // CSRF token for payload correlation
      expires_in: 3600,
      server_timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      correlation_id: correlationId
      // Correlation ID that should be sent back in requests
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Set-Cookie": `session_id=${sessionId}; Path=/; HttpOnly; SameSite=Lax`,
        // Add tokens to headers for correlation (in case body isn't captured)
        "X-Session-Token": sessionToken,
        "X-Session-Id": sessionId,
        "X-CSRF-Token": csrfToken,
        "X-Correlation-Id": correlationId,
        "X-User-Id": result.id.toString()
      }
    });
  } catch (error) {
    console.error("Error in handleLogin:", error);
    return new Response(JSON.stringify({
      error: error.message,
      debug: {
        stack: error.stack,
        dbAvailable: !!env.DB
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
}
__name(handleLogin, "handleLogin");
async function handleGetProducts(request, env, corsHeaders) {
  try {
    const url = new URL(request.url);
    const category = url.searchParams.get("category");
    if (!env.DB) {
      return new Response(JSON.stringify({
        error: "Database not available",
        debug: "env.DB is undefined - check wrangler.toml binding"
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    let query = "SELECT * FROM products";
    let params = [];
    if (category) {
      query += " WHERE category = ?";
      params.push(category);
    }
    console.log("Executing query:", query, "with params:", params);
    const result = await env.DB.prepare(query).bind(...params).all();
    console.log("Query result:", result);
    return new Response(JSON.stringify({
      products: result.results || [],
      count: (result.results || []).length,
      debug: {
        query,
        params,
        resultMeta: result.meta
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error in handleGetProducts:", error);
    return new Response(JSON.stringify({
      error: error.message,
      debug: {
        stack: error.stack,
        dbAvailable: !!env.DB
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
}
__name(handleGetProducts, "handleGetProducts");
async function handleGetSingleProduct(request, env, corsHeaders) {
  try {
    const url = new URL(request.url);
    const productId = url.pathname.split("/").pop();
    if (!env.DB) {
      return new Response(JSON.stringify({
        error: "Database not available",
        debug: "env.DB is undefined - check wrangler.toml binding"
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    if (!productId || isNaN(productId)) {
      return new Response(JSON.stringify({
        error: "Invalid product ID",
        debug: "Product ID must be a number"
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    console.log("Fetching product with ID:", productId);
    const result = await env.DB.prepare(
      "SELECT * FROM products WHERE id = ?"
    ).bind(productId).first();
    if (!result) {
      return new Response(JSON.stringify({
        error: "Product not found",
        product_id: productId
      }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    const productDetails = {
      ...result,
      in_stock: result.stock > 0,
      stock_status: result.stock > 50 ? "in_stock" : result.stock > 0 ? "low_stock" : "out_of_stock",
      discounted_price: result.price * 0.9,
      // 10% discount simulation
      related_products: [],
      // Could be populated with a related products query
      last_updated: (/* @__PURE__ */ new Date()).toISOString()
    };
    return new Response(JSON.stringify({
      success: true,
      product: productDetails
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error in handleGetSingleProduct:", error);
    return new Response(JSON.stringify({
      error: error.message,
      debug: {
        stack: error.stack,
        dbAvailable: !!env.DB
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
}
__name(handleGetSingleProduct, "handleGetSingleProduct");
async function handleGetProfile(request, env, corsHeaders) {
  try {
    const body = await request.json();
    const { session_token, user_id, correlation_id, session_id, csrf_token } = body;
    if (!session_token || !user_id || !correlation_id || !session_id || !csrf_token) {
      return new Response(JSON.stringify({
        error: "Missing required fields",
        required: ["session_token", "user_id", "correlation_id", "session_id", "csrf_token"],
        message: "All session data must be provided in request body for correlation testing"
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    const user = await env.DB.prepare(
      "SELECT id, username, email FROM users WHERE session_token = ? AND id = ? AND session_id = ? AND csrf_token = ? AND correlation_id = ?"
    ).bind(session_token, user_id, session_id, csrf_token, correlation_id).first();
    if (!user) {
      return new Response(JSON.stringify({
        error: "Invalid session data",
        message: "One or more session tokens are invalid or mismatched (session_token, user_id, session_id, csrf_token, or correlation_id)"
      }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    return new Response(JSON.stringify({
      success: true,
      user_id: user.id,
      username: user.username,
      email: user.email,
      session_info: {
        token_verified: true,
        correlation_id_received: correlation_id,
        created_at: (/* @__PURE__ */ new Date()).toISOString(),
        expires_at: new Date(Date.now() + 36e5).toISOString()
      },
      profile_data: {
        last_login: (/* @__PURE__ */ new Date()).toISOString(),
        account_type: user.username.includes("admin") ? "admin" : "standard",
        preferences: {
          theme: "default",
          notifications: true,
          next_correlation_key: generateToken()
          // Key for next request
        }
      },
      server_metadata: {
        request_id: generateToken(),
        server_time: (/* @__PURE__ */ new Date()).toISOString(),
        api_version: "v1.2.3"
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: "Invalid request format",
      message: "Request body must contain session_token, user_id, and correlation_id"
    }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
}
__name(handleGetProfile, "handleGetProfile");
async function handleAddToCart(request, env, corsHeaders) {
  try {
    const body = await request.json();
    const { product_id, quantity = 1, session_token, user_id, correlation_id, session_id, csrf_token, client_session_id } = body;
    if (!session_token || !user_id || !correlation_id || !session_id || !csrf_token) {
      return new Response(JSON.stringify({
        error: "Missing required session fields in request body",
        required: ["session_token", "user_id", "correlation_id", "session_id", "csrf_token"],
        message: "All session data must be provided in request body for correlation testing",
        example: {
          "product_id": 1,
          "quantity": 1,
          "session_token": "tok_...",
          "user_id": 1,
          "correlation_id": "tok_...",
          "session_id": "sess_...",
          "csrf_token": "tok_..."
        }
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    if (!product_id) {
      return new Response(JSON.stringify({ error: "Product ID is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    if (!env.DB) {
      return new Response(JSON.stringify({
        error: "Database not available",
        debug: "env.DB is undefined - check wrangler.toml binding"
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    const user = await env.DB.prepare(
      "SELECT id, username FROM users WHERE session_token = ? AND id = ? AND session_id = ? AND csrf_token = ? AND correlation_id = ?"
    ).bind(session_token, user_id, session_id, csrf_token, correlation_id).first();
    if (!user) {
      return new Response(JSON.stringify({
        error: "Invalid session data in request body",
        message: "One or more session tokens are invalid or mismatched (session_token, user_id, session_id, csrf_token, or correlation_id)"
      }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    if (!product_id) {
      return new Response(JSON.stringify({ error: "Product ID is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    if (!env.DB) {
      return new Response(JSON.stringify({
        error: "Database not available",
        debug: "env.DB is undefined - check wrangler.toml binding"
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    const product = await env.DB.prepare(
      "SELECT * FROM products WHERE id = ?"
    ).bind(product_id).first();
    if (!product) {
      return new Response(JSON.stringify({ error: "Product not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    if (product.stock < quantity) {
      return new Response(JSON.stringify({
        error: "Insufficient stock",
        available_stock: product.stock,
        requested_quantity: quantity
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    const cartItemId = generateToken();
    const subtotal = product.price * quantity;
    const requestId = generateToken();
    const cartItem = {
      cart_item_id: cartItemId,
      product_id: product.id,
      product_name: product.name,
      price: product.price,
      quantity,
      subtotal,
      added_at: (/* @__PURE__ */ new Date()).toISOString(),
      user_id: user.id,
      username: user.username,
      session_reference: session_token.substring(0, 16) + "...",
      // Partial session token in payload
      correlation_tracking: {
        request_id: requestId,
        client_correlation_id: correlation_id,
        client_session_id: client_session_id || null,
        server_correlation_id: generateToken()
      }
    };
    return new Response(JSON.stringify({
      success: true,
      message: "Product added to cart successfully",
      cart_item: cartItem,
      total_items_in_cart: Math.floor(Math.random() * 5) + 1,
      // Mock cart count
      cart_total: subtotal + Math.random() * 100,
      // Mock cart total
      next_step_token: generateToken(),
      // Token for next step correlation
      server_context: {
        processing_time: Math.floor(Math.random() * 100) + 50 + "ms",
        server_id: "srv-" + Math.random().toString(36).substr(2, 6),
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      }
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "X-Request-ID": requestId,
        // Custom header for correlation
        "X-Session-Hint": session_token.substring(0, 12)
        // Partial session in header too
      }
    });
  } catch (error) {
    console.error("Error in handleAddToCart:", error);
    return new Response(JSON.stringify({
      error: error.message,
      debug: {
        stack: error.stack,
        dbAvailable: !!env.DB
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
}
__name(handleAddToCart, "handleAddToCart");
async function handleGetCart(request, env, corsHeaders) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({
      error: "Authentication required",
      message: "Please login to view cart"
    }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
  const token = authHeader.substring(7);
  const user = await env.DB.prepare(
    "SELECT id, username FROM users WHERE session_token = ?"
  ).bind(token).first();
  if (!user) {
    return new Response(JSON.stringify({
      error: "Invalid or expired session token",
      message: "Please login again"
    }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
  const mockCartItems = [
    {
      cart_item_id: "cart_" + Date.now() + "_1",
      product_id: 1,
      product_name: "Laptop Pro",
      price: 1299.99,
      quantity: 1,
      subtotal: 1299.99
    },
    {
      cart_item_id: "cart_" + Date.now() + "_2",
      product_id: 2,
      product_name: "Wireless Mouse",
      price: 29.99,
      quantity: 2,
      subtotal: 59.98
    }
  ];
  const total = mockCartItems.reduce((sum, item) => sum + item.subtotal, 0);
  return new Response(JSON.stringify({
    success: true,
    user_id: user.id,
    username: user.username,
    cart_items: mockCartItems,
    item_count: mockCartItems.length,
    cart_total: total,
    checkout_token: generateToken()
    // For checkout correlation
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}
__name(handleGetCart, "handleGetCart");
async function handleProcessCheckout(request, env, corsHeaders) {
  try {
    const body = await request.json();
    const {
      session_token,
      user_id,
      correlation_id,
      session_id,
      csrf_token,
      checkout_token,
      cart_items,
      payment_method = "credit_card",
      billing_address,
      shipping_address
    } = body;
    if (!session_token || !user_id || !correlation_id || !session_id || !csrf_token || !checkout_token) {
      return new Response(JSON.stringify({
        error: "Missing required checkout fields in request body",
        required: ["session_token", "user_id", "correlation_id", "session_id", "csrf_token", "checkout_token"],
        message: "All session and checkout data must be provided in request body"
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    const user = await env.DB.prepare(
      "SELECT id, username FROM users WHERE session_token = ? AND id = ? AND session_id = ? AND csrf_token = ? AND correlation_id = ?"
    ).bind(session_token, user_id, session_id, csrf_token, correlation_id).first();
    if (!user) {
      return new Response(JSON.stringify({
        error: "Invalid session data in checkout request body",
        message: "One or more session tokens are invalid or mismatched"
      }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    const total = (cart_items?.length || 2) * 75;
    const orderToken = generateToken();
    const confirmationNumber = "CNF" + Date.now().toString().slice(-8);
    const transactionId = generateToken();
    const result = await env.DB.prepare(
      "INSERT INTO orders (user_id, order_token, total, status) VALUES (?, ?, ?, ?)"
    ).bind(user.id, orderToken, total, "confirmed").run();
    return new Response(JSON.stringify({
      success: true,
      message: "Checkout completed successfully",
      order_id: result.meta.last_row_id,
      order_token: orderToken,
      confirmation_number: confirmationNumber,
      total,
      status: "confirmed",
      payment_confirmation: {
        transaction_id: transactionId,
        payment_method,
        authorization_code: "AUTH" + Math.random().toString().slice(-6),
        processed_at: (/* @__PURE__ */ new Date()).toISOString()
      },
      shipping_info: {
        tracking_number: `TRK${result.meta.last_row_id.toString().padStart(8, "0")}`,
        estimated_delivery: new Date(Date.now() + 3 * 864e5).toISOString().split("T")[0]
      },
      correlation_validation: {
        session_token_used: session_token.substring(0, 12) + "...",
        user_id_confirmed: user_id,
        correlation_id_received: correlation_id,
        checkout_token_validated: checkout_token
      },
      next_steps: {
        order_tracking_url: `/api/orders/${orderToken}`,
        receipt_download_token: generateToken(),
        customer_service_ref: "CS" + Date.now().toString().slice(-6)
      }
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "X-Transaction-ID": transactionId,
        "X-Order-Confirmation": confirmationNumber
      }
    });
  } catch (error) {
    console.error("Error in handleProcessCheckout:", error);
    return new Response(JSON.stringify({
      error: "Invalid checkout request format",
      message: "Request body must contain all required session and checkout data"
    }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
}
__name(handleProcessCheckout, "handleProcessCheckout");
async function handleCreateOrder(request, env, corsHeaders) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Authorization token required" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
  const token = authHeader.substring(7);
  const body = await request.json();
  const { product_ids, quantities, client_request_id, checkout_token, payment_method = "credit_card" } = body;
  const user = await env.DB.prepare(
    "SELECT id FROM users WHERE session_token = ?"
  ).bind(token).first();
  if (!user) {
    return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
  const total = (product_ids?.length || 1) * 50;
  const orderToken = generateToken();
  const confirmationNumber = "CNF" + Date.now().toString().slice(-8);
  const result = await env.DB.prepare(
    "INSERT INTO orders (user_id, order_token, total, status) VALUES (?, ?, ?, ?)"
  ).bind(user.id, orderToken, total, "pending").run();
  return new Response(JSON.stringify({
    success: true,
    order_id: result.meta.last_row_id,
    order_token: orderToken,
    confirmation_number: confirmationNumber,
    total,
    status: "pending",
    estimated_delivery: "3-5 business days",
    payment_info: {
      method: payment_method,
      transaction_id: generateToken(),
      authorization_code: "AUTH" + Math.random().toString().slice(-6)
    },
    shipping_info: {
      tracking_number: `TRK${result.meta.last_row_id.toString().padStart(8, "0")}`,
      estimated_ship_date: new Date(Date.now() + 864e5).toISOString().split("T")[0]
      // Tomorrow
    },
    correlation_data: {
      client_request_id: client_request_id || null,
      checkout_token: checkout_token || null,
      server_order_ref: generateToken(),
      processing_node: "order-proc-" + Math.random().toString(36).substr(2, 4)
    },
    next_actions: {
      track_order_url: `/api/orders/${orderToken}`,
      invoice_download_token: generateToken(),
      customer_service_ref: "CS" + Date.now().toString().slice(-6)
    }
  }), {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "X-Order-ID": orderToken,
      "X-Confirmation": confirmationNumber
    }
  });
}
__name(handleCreateOrder, "handleCreateOrder");
async function handleGetOrder(request, env, corsHeaders) {
  const url = new URL(request.url);
  const orderToken = url.pathname.split("/").pop();
  const order = await env.DB.prepare(
    "SELECT o.*, u.username FROM orders o JOIN users u ON o.user_id = u.id WHERE o.order_token = ?"
  ).bind(orderToken).first();
  if (!order) {
    return new Response(JSON.stringify({ error: "Order not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
  return new Response(JSON.stringify({
    order_id: order.id,
    order_token: order.order_token,
    username: order.username,
    total: order.total,
    status: order.status,
    created_at: order.created_at,
    tracking_number: `TRK${order.id.toString().padStart(8, "0")}`
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}
__name(handleGetOrder, "handleGetOrder");
async function handleHttpTest(request, env, corsHeaders) {
  try {
    const body = await request.json();
    const { session_token, user_id, correlation_id, session_id, csrf_token, test_message } = body;
    if (!session_token || !user_id || !correlation_id || !session_id || !csrf_token) {
      return new Response('HTTP 400 - Missing required session fields in request body\n\nRequired: session_token, user_id, correlation_id, session_id, csrf_token\n\nExample:\n{\n  "session_token": "tok_...",\n  "user_id": 1,\n  "correlation_id": "tok_...",\n  "session_id": "sess_...",\n  "csrf_token": "tok_...",\n  "test_message": "Hello from LoadMagic!"\n}', {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "text/plain" }
      });
    }
    if (!env.DB) {
      return new Response("HTTP 500 - Database not available\n\nenv.DB is undefined - check wrangler.toml binding", {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "text/plain" }
      });
    }
    const user = await env.DB.prepare(
      "SELECT id, username FROM users WHERE session_token = ? AND id = ? AND session_id = ? AND csrf_token = ? AND correlation_id = ?"
    ).bind(session_token, user_id, session_id, csrf_token, correlation_id).first();
    if (!user) {
      return new Response("HTTP 401 - Invalid session data in request body\n\nOne or more session tokens are invalid or mismatched (session_token, user_id, session_id, csrf_token, or correlation_id)", {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "text/plain" }
      });
    }
    const testId = generateToken();
    const step2Token = generateToken();
    const timestamp = (/* @__PURE__ */ new Date()).toISOString();
    const serverId = "srv-" + Math.random().toString(36).substr(2, 6);
    await env.DB.prepare(
      "UPDATE users SET http_test_step2_token = ?, http_test_step2_token_timestamp = ? WHERE id = ?"
    ).bind(step2Token, timestamp, user.id).run();
    const responseText = `HTTP 200 - HTTP Test Step 1 Successful!

[AUTH] Authentication Method: Request Body Session Data
[INFO] Session Token: ${session_token.substring(0, 20)}...
[ID] User ID: ${user_id}
[SYNC] Correlation ID: ${correlation_id.substring(0, 20)}...
[USER] Username: ${user.username}

\u{1F9EA} Step 1 Test Details:
\u2022 Test ID: ${testId}
\u2022 Server ID: ${serverId}
\u2022 Timestamp: ${timestamp}
\u2022 Test Message: ${test_message || "No message provided"}

[OK] Session Validation: PASSED
[OK] Database Connection: ACTIVE
[OK] User Authentication: CONFIRMED

[TARGET] STEP 2 REQUIRED - Capture the Step 2 Token below!
\u{1F511} STEP 2 TOKEN: ${step2Token}

\u{1F4DD} Response Format: Plain HTTP (not JSON)
\u{1F517} Perfect for testing HTTP response parsing

\u26A0\uFE0F  IMPORTANT FOR CORRELATION:
\u2022 Extract the "STEP 2 TOKEN" from this response
\u2022 Use it in the next request to /api/http-test-step2
\u2022 Step 2 will FAIL without this token!

Next Steps:
\u2022 Extract STEP 2 TOKEN: ${step2Token}
\u2022 Send it to /api/http-test-step2 endpoint
\u2022 Test multi-step correlation`;
    return new Response(responseText, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/plain",
        "X-Test-ID": testId,
        "X-Step2-Token": step2Token,
        "X-Session-Hint": session_token.substring(0, 12),
        "X-User-ID": user_id.toString(),
        "X-Correlation-ID": correlation_id.substring(0, 12),
        "X-Server-ID": serverId,
        "X-Timestamp": timestamp
      }
    });
  } catch (error) {
    console.error("Error in handleHttpTest:", error);
    return new Response(`HTTP 500 - Internal Server Error

Error: ${error.message}

This endpoint requires session data in request body for correlation testing.`, {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "text/plain" }
    });
  }
}
__name(handleHttpTest, "handleHttpTest");
async function handleHttpTestStep2(request, env, corsHeaders) {
  try {
    const body = await request.json();
    const { session_token, user_id, correlation_id, session_id, csrf_token, step2_token, test_message } = body;
    if (!session_token || !user_id || !correlation_id || !session_id || !csrf_token || !step2_token) {
      return new Response('HTTP 400 - Missing required fields for Step 2\n\nRequired: session_token, user_id, correlation_id, session_id, csrf_token, step2_token\n\n\u26A0\uFE0F  step2_token MUST be extracted from Step 1 response!\n\nExample:\n{\n  "session_token": "tok_...",\n  "user_id": 1,\n  "correlation_id": "tok_...",\n  "session_id": "sess_...",\n  "csrf_token": "tok_...",\n  "step2_token": "tok_...",\n  "test_message": "Step 2 from LoadMagic!"\n}', {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "text/plain" }
      });
    }
    if (!env.DB) {
      return new Response("HTTP 500 - Database not available\n\nenv.DB is undefined - check wrangler.toml binding", {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "text/plain" }
      });
    }
    const user = await env.DB.prepare(
      "SELECT id, username, http_test_step2_token FROM users WHERE session_token = ? AND id = ? AND session_id = ? AND csrf_token = ? AND correlation_id = ?"
    ).bind(session_token, user_id, session_id, csrf_token, correlation_id).first();
    if (!user) {
      return new Response("HTTP 401 - Invalid session data in request body\n\nOne or more session tokens are invalid or mismatched (session_token, user_id, session_id, csrf_token, or correlation_id)", {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "text/plain" }
      });
    }
    if (!user.http_test_step2_token) {
      return new Response("HTTP 400 - Correlation FAILED: No step2_token found\n\n\u26A0\uFE0F  You must call /api/http-test (Step 1) first to generate a step2_token!\n\n[ERROR] Correlation Test: FAILED\n[ERROR] Reason: Missing Step 1 execution\n\nPlease run Step 1 first to generate the required step2_token.", {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "text/plain" }
      });
    }
    if (user.http_test_step2_token !== step2_token) {
      return new Response(`HTTP 400 - Correlation FAILED: step2_token mismatch

\u26A0\uFE0F  The step2_token you provided does not match the one generated in Step 1!

[ERROR] Correlation Test: FAILED
[ERROR] Expected: ${user.http_test_step2_token.substring(0, 20)}...
[ERROR] Received: ${step2_token.substring(0, 20)}...

This means your correlation extractor is not working correctly.

Please check:
1. Did you extract the step2_token from Step 1 response?
2. Is your Regular Expression Extractor configured correctly?
3. Are you using the correct variable name in Step 2 request?`, {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "text/plain",
          "X-Correlation-Status": "FAILED",
          "X-Expected-Token": user.http_test_step2_token.substring(0, 20),
          "X-Received-Token": step2_token.substring(0, 20)
        }
      });
    }
    await env.DB.prepare(
      "UPDATE users SET http_test_step2_token = NULL, http_test_step2_token_timestamp = NULL WHERE id = ?"
    ).bind(user.id).run();
    const step2Id = generateToken();
    const finalToken = generateToken();
    const timestamp = (/* @__PURE__ */ new Date()).toISOString();
    const serverId = "srv-" + Math.random().toString(36).substr(2, 6);
    const responseText = `HTTP 200 - HTTP Test Step 2 Successful!

[AUTH] Authentication Method: Request Body Session Data + Step 2 Token
[INFO] Session Token: ${session_token.substring(0, 20)}...
[ID] User ID: ${user_id}
[SYNC] Correlation ID: ${correlation_id.substring(0, 20)}...
\u{1F511} Step 2 Token: ${step2_token.substring(0, 20)}...
[USER] Username: ${user.username}

\u{1F9EA} Step 2 Test Details:
\u2022 Step 2 ID: ${step2Id}
\u2022 Server ID: ${serverId}
\u2022 Timestamp: ${timestamp}
\u2022 Test Message: ${test_message || "No message provided"}

[OK] Session Validation: PASSED
[OK] Step 2 Token Validation: PASSED
[OK] Database Connection: ACTIVE
[OK] User Authentication: CONFIRMED
[OK] Multi-Step Correlation: SUCCESSFUL

\u{1F389} MULTI-STEP CORRELATION COMPLETE!
\u{1F3C6} FINAL SUCCESS TOKEN: ${finalToken}

\u{1F4DD} Response Format: Plain HTTP (not JSON)
\u{1F517} Perfect for testing multi-step correlation

[OK] Correlation Test Results:
\u2022 Step 1: Session authentication \u2713
\u2022 Step 2: Token extraction \u2713
\u2022 Step 2: Token validation \u2713
\u2022 Multi-step flow: COMPLETE \u2713

[TARGET] This demonstrates successful multi-step correlation testing!
\u{1F4CA} Both steps required session data in request body
\u{1F517} Step 2 required token extracted from Step 1 response

Congratulations! Your correlation is working perfectly!`;
    return new Response(responseText, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/plain",
        "X-Step2-ID": step2Id,
        "X-Final-Token": finalToken,
        "X-Step2-Token-Received": step2_token.substring(0, 12),
        "X-Session-Hint": session_token.substring(0, 12),
        "X-User-ID": user_id.toString(),
        "X-Correlation-ID": correlation_id.substring(0, 12),
        "X-Server-ID": serverId,
        "X-Timestamp": timestamp
      }
    });
  } catch (error) {
    console.error("Error in handleHttpTestStep2:", error);
    return new Response(`HTTP 500 - Internal Server Error

Error: ${error.message}

This endpoint requires session data AND step2_token in request body for multi-step correlation testing.`, {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "text/plain" }
    });
  }
}
__name(handleHttpTestStep2, "handleHttpTestStep2");
async function handleDashboard1Step1(request, env, corsHeaders) {
  try {
    const body = await request.json();
    const { session_token, user_id } = body;
    if (!session_token || !user_id) {
      return new Response(JSON.stringify({
        error: "Missing required fields",
        required: ["session_token", "user_id"],
        hint: "This endpoint requires minimal session data for simplified testing"
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    if (!env.DB) {
      return new Response(JSON.stringify({
        error: "Database not available"
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    const user = await env.DB.prepare(
      "SELECT id, username, session_token, session_id, csrf_token, correlation_id FROM users WHERE session_token = ? AND id = ?"
    ).bind(session_token, user_id).first();
    if (!user) {
      return new Response(JSON.stringify({
        error: "Invalid session",
        hint: "Session token or user_id is invalid"
      }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    const shortID = (Math.floor(Math.random() * 9) + 1).toString();
    const timestamp = (/* @__PURE__ */ new Date()).toISOString();
    await env.DB.prepare(
      "UPDATE users SET dashboard1_shortid = ?, dashboard1_shortid_timestamp = ? WHERE id = ?"
    ).bind(shortID, timestamp, user.id).run();
    return new Response(JSON.stringify({
      success: true,
      message: "Step 1 completed - shortID generated",
      shortID,
      // Short value like "1", "2", "3"
      username: user.username,
      user_id: user.id,
      session_token: user.session_token,
      session_id: user.session_id,
      csrf_token: user.csrf_token,
      correlation_id: user.correlation_id,
      timestamp,
      hint: "Use this shortID in Step 2 request"
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "X-Session-Token": user.session_token || "",
        "X-Correlation-Id": user.correlation_id || "",
        "X-ShortID": shortID,
        // Also in header for multiple extraction options
        "X-Timestamp": timestamp
      }
    });
  } catch (error) {
    console.error("Error in handleDashboard1Step1:", error);
    return new Response(JSON.stringify({
      error: "Internal server error",
      message: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
}
__name(handleDashboard1Step1, "handleDashboard1Step1");
async function handleDashboard1Step2(request, env, corsHeaders) {
  try {
    const body = await request.json();
    const { session_token, user_id, shortID } = body;
    if (!session_token || !user_id || !shortID) {
      return new Response(JSON.stringify({
        error: "Missing required fields",
        required: ["session_token", "user_id", "shortID"],
        hint: "shortID must be extracted from Step 1 response"
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    if (!env.DB) {
      return new Response(JSON.stringify({
        error: "Database not available"
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    const user = await env.DB.prepare(
      "SELECT id, username, dashboard1_shortid, session_id, csrf_token, correlation_id, session_token FROM users WHERE session_token = ? AND id = ?"
    ).bind(session_token, user_id).first();
    if (!user) {
      return new Response(JSON.stringify({
        error: "Invalid session",
        hint: "Session token or user_id is invalid"
      }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    if (!/^[0-9]{1,2}$/.test(shortID)) {
      return new Response(JSON.stringify({
        error: "Invalid shortID format",
        received: shortID,
        expected: "Single digit number (1-9)",
        hint: "shortID must be extracted from Step 1 response"
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    if (!user.dashboard1_shortid) {
      return new Response(JSON.stringify({
        error: "No shortID found",
        hint: "You must call Step 1 first to generate a shortID",
        correlation_test: "FAILED",
        reason: "Missing Step 1 execution"
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    if (user.dashboard1_shortid !== shortID) {
      return new Response(JSON.stringify({
        error: "shortID mismatch - Correlation FAILED",
        expected: user.dashboard1_shortid,
        received: shortID,
        hint: "The shortID you provided does not match the one generated in Step 1",
        correlation_test: "FAILED",
        reason: "Incorrect correlation value - correlation extraction failed or wrong value used"
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    const timestamp = (/* @__PURE__ */ new Date()).toISOString();
    const finalID = (Math.floor(Math.random() * 90) + 10).toString();
    await env.DB.prepare(
      "UPDATE users SET dashboard1_shortid = NULL, dashboard1_shortid_timestamp = NULL WHERE id = ?"
    ).bind(user.id).run();
    return new Response(JSON.stringify({
      success: true,
      message: "Step 2 completed - Correlation successful!",
      username: user.username,
      user_id: user.id,
      shortID_received: shortID,
      shortID_validated: true,
      finalID,
      // Another short value for additional testing
      timestamp,
      correlation_test: "PASSED",
      hint: "Short value correlation is working correctly"
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "X-ShortID-Received": shortID,
        "X-FinalID": finalID,
        "X-Timestamp": timestamp,
        "X-Correlation-Status": "PASSED"
      }
    });
  } catch (error) {
    console.error("Error in handleDashboard1Step2:", error);
    return new Response(JSON.stringify({
      error: "Internal server error",
      message: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
}
__name(handleDashboard1Step2, "handleDashboard1Step2");
async function handleDashboard1Step3(request, env, corsHeaders) {
  try {
    const body = await request.json();
    const { session_token, user_id, session_id } = body || {};
    if (!session_token || !user_id || !session_id) {
      return new Response(JSON.stringify({
        error: "Missing required fields",
        required: ["session_token", "session_id", "user_id"],
        hint: "Send the full session body to generate the large viewstate"
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    if (!env.DB) {
      return new Response(JSON.stringify({
        error: "Database not available"
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    const user = await env.DB.prepare(
      "SELECT id, username, session_token, session_id, csrf_token, correlation_id FROM users WHERE session_token = ? AND id = ? AND session_id = ?"
    ).bind(session_token, user_id, session_id).first();
    if (!user) {
      return new Response(JSON.stringify({
        error: "Invalid session",
        hint: "Session token, session_id, or user_id is invalid"
      }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    const state = await buildLargeViewState(user.session_id, user.session_token, user.id);
    const responsePayload = {
      success: true,
      message: "Step 3 completed - large viewstate generated",
      viewstate: state.viewstate,
      viewstate_base64_length: state.viewstate.length,
      viewstate_raw_length: state.rawLength,
      signature: state.signature,
      signature_hint: state.signature.substring(0, 12) + "...",
      timestamp: state.timestamp,
      constraints: {
        minimum_view_length: 35e4,
        includes_nonce_and_signature: true,
        structure: ["v", "sid", "uid", "ts", "nonce", "sig", "view"]
      }
    };
    return new Response(JSON.stringify(responsePayload), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "X-Viewstate-Signature": state.signature,
        "X-Viewstate-Size": state.rawLength.toString(),
        "X-Viewstate-Base64-Size": state.viewstate.length.toString()
      }
    });
  } catch (error) {
    console.error("Error in handleDashboard1Step3:", error);
    return new Response(JSON.stringify({
      error: "Internal server error",
      message: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
}
__name(handleDashboard1Step3, "handleDashboard1Step3");
async function handleDashboard1Step4(request, env, corsHeaders) {
  try {
    const body = await request.json();
    const { session_token, user_id, session_id, viewstate } = body || {};
    if (!session_token || !user_id || !session_id || !viewstate) {
      return new Response(JSON.stringify({
        error: "Missing required fields",
        required: ["session_token", "session_id", "user_id", "viewstate"],
        hint: "Send the exact viewstate from Step 3 without trimming it"
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    if (!env.DB) {
      return new Response(JSON.stringify({
        error: "Database not available"
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    const user = await env.DB.prepare(
      "SELECT id, username, session_token, session_id FROM users WHERE session_token = ? AND id = ? AND session_id = ?"
    ).bind(session_token, user_id, session_id).first();
    if (!user) {
      return new Response(JSON.stringify({
        error: "Invalid session",
        hint: "Session token, session_id, or user_id is invalid"
      }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    let decoded;
    let parsed;
    try {
      decoded = atob(viewstate);
      parsed = JSON.parse(decoded);
    } catch (err) {
      return new Response(JSON.stringify({
        error: "Invalid viewstate encoding",
        details: err.message,
        hint: "Viewstate must be the base64 string returned in Step 3"
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    const issues = [];
    const requiredKeys = ["v", "sid", "uid", "ts", "nonce", "sig", "view"];
    const missingKeys = requiredKeys.filter((key) => !(key in parsed));
    if (missingKeys.length > 0) {
      issues.push(`Missing fields: ${missingKeys.join(", ")}`);
    }
    if (parsed.sid !== session_id) {
      issues.push("Session ID inside viewstate does not match request session_id");
    }
    if (String(parsed.uid) !== String(user.id)) {
      issues.push("User ID inside viewstate does not match request user_id");
    }
    if (!parsed.view || parsed.view.length < 35e4) {
      issues.push("Viewstate payload is too small - expected a large ASP.NET style payload (>350KB raw)");
    }
    const recomputedSignature = await sha256Base64(`${session_token}|${session_id}|${user_id}|${parsed.nonce}|${parsed.ts}`);
    if (parsed.sig !== recomputedSignature) {
      issues.push("Signature mismatch - correlation failed");
    }
    if (issues.length > 0) {
      return new Response(JSON.stringify({
        error: "Viewstate validation failed",
        issues,
        received_structure: Object.keys(parsed),
        received_lengths: {
          raw_view_length: parsed.view ? parsed.view.length : 0,
          base64_length: viewstate.length
        }
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    const responsePayload = {
      success: true,
      message: "Step 4 completed - large viewstate validated",
      validated: true,
      username: user.username,
      user_id: user.id,
      session_id: user.session_id,
      signature_valid: true,
      signature: parsed.sig,
      view_lengths: {
        raw_view_length: parsed.view.length,
        base64_length: viewstate.length
      },
      timestamp: parsed.ts,
      nonce: parsed.nonce
    };
    return new Response(JSON.stringify(responsePayload), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "X-Viewstate-Validated": "true",
        "X-Viewstate-Signature": parsed.sig,
        "X-Viewstate-Size": parsed.view.length.toString(),
        "X-Viewstate-Nonce": parsed.nonce
      }
    });
  } catch (error) {
    console.error("Error in handleDashboard1Step4:", error);
    return new Response(JSON.stringify({
      error: "Internal server error",
      message: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
}
__name(handleDashboard1Step4, "handleDashboard1Step4");
async function handleDashboard1Step5(request, env, corsHeaders) {
  try {
    const body = await request.json();
    const { session_token, user_id, session_id, transactions, meta } = body || {};
    if (!session_token || !user_id || !session_id || !transactions || !Array.isArray(transactions)) {
      return new Response(JSON.stringify({
        error: "Missing required fields",
        required: ["session_token", "session_id", "user_id", "transactions"],
        hint: "transactions must be an array and should be large (200KB+)"
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    if (!env.DB) {
      return new Response(JSON.stringify({
        error: "Database not available"
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    const user = await env.DB.prepare(
      "SELECT id, username, session_token, session_id FROM users WHERE session_token = ? AND id = ? AND session_id = ?"
    ).bind(session_token, user_id, session_id).first();
    if (!user) {
      return new Response(JSON.stringify({
        error: "Invalid session",
        hint: "Session token, session_id, or user_id is invalid"
      }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    const minCount = 600;
    if (transactions.length < minCount) {
      return new Response(JSON.stringify({
        error: "Payload too small",
        hint: `Provide at least ${minCount} transaction objects to simulate bulk payloads`
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    const transactionsString = JSON.stringify(transactions);
    if (transactionsString.length < 5e5) {
      return new Response(JSON.stringify({
        error: "Payload size too small",
        received_bytes: transactionsString.length,
        hint: "Aim for >500KB to exercise large-body handling"
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    const batchId = generateToken();
    const pivotIndex = Math.min(Math.floor(transactions.length / 2), transactions.length - 1);
    const pivotItem = transactions[pivotIndex] || {};
    const pivotItemId = pivotItem.id ? String(pivotItem.id) : `pivot_${pivotIndex}`;
    const validationCode = await sha256Base64(`${batchId}|${pivotItemId}|${session_token}|${session_id}|${user_id}|${transactions.length}`);
    const responseFiller = generateFillerString(4e5);
    const responseSignature = await sha256Base64(`${batchId}|${validationCode}|${responseFiller.substring(0, 100)}`);
    const responsePayload = {
      success: true,
      message: "Step 5 completed - bulk payload accepted",
      batch_id: batchId,
      pivot_item_id: pivotItemId,
      validation_code: validationCode,
      transactions_count: transactions.length,
      payload_bytes: transactionsString.length,
      constraints: {
        minimum_count: minCount,
        minimum_bytes: 5e5
      },
      meta_echo: meta || null,
      hint: "Send batch_id, pivot_item_id, validation_code, and transactions_count to Step 6",
      // Large response data for edge case testing (correlation tools must handle large responses)
      response_data: {
        filler: responseFiller,
        filler_length: responseFiller.length,
        response_signature: responseSignature,
        response_signature_hint: responseSignature.substring(0, 12) + "...",
        purpose: "Large response payload to test LLM token limit edge cases in correlation tools"
      }
    };
    return new Response(JSON.stringify(responsePayload), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "X-Batch-Id": batchId,
        "X-Large-Payload-Size": transactionsString.length.toString(),
        "X-Pivot-Item-Id": pivotItemId,
        "X-Validation-Code": validationCode.substring(0, 24) + "..."
      }
    });
  } catch (error) {
    console.error("Error in handleDashboard1Step5:", error);
    return new Response(JSON.stringify({
      error: "Internal server error",
      message: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
}
__name(handleDashboard1Step5, "handleDashboard1Step5");
async function handleDashboard1Step6(request, env, corsHeaders) {
  try {
    const body = await request.json();
    const { session_token, user_id, session_id, batch_id, validation_code, pivot_item_id, transactions_count } = body || {};
    if (!session_token || !user_id || !session_id || !batch_id || !validation_code || !pivot_item_id || !transactions_count) {
      return new Response(JSON.stringify({
        error: "Missing required fields",
        required: ["session_token", "session_id", "user_id", "batch_id", "validation_code", "pivot_item_id", "transactions_count"],
        hint: "Use the values returned from Step 5"
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    if (!env.DB) {
      return new Response(JSON.stringify({
        error: "Database not available"
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    const user = await env.DB.prepare(
      "SELECT id, username, session_token, session_id FROM users WHERE session_token = ? AND id = ? AND session_id = ?"
    ).bind(session_token, user_id, session_id).first();
    if (!user) {
      return new Response(JSON.stringify({
        error: "Invalid session",
        hint: "Session token, session_id, or user_id is invalid"
      }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    const expectedCode = await sha256Base64(`${batch_id}|${pivot_item_id}|${session_token}|${session_id}|${user_id}|${transactions_count}`);
    if (validation_code !== expectedCode) {
      return new Response(JSON.stringify({
        error: "Validation code mismatch - correlation failed",
        expected_hint: expectedCode.substring(0, 20) + "...",
        received_hint: validation_code.substring(0, 20) + "...",
        hint: "Ensure you replayed the exact code from Step 5"
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    const responsePayload = {
      success: true,
      message: "Step 6 completed - large payload correlation validated",
      batch_id,
      pivot_item_id,
      transactions_count,
      username: user.username,
      validation_confirmed: true,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    return new Response(JSON.stringify(responsePayload), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "X-Batch-Validated": batch_id,
        "X-Pivot-Item-Id": pivot_item_id,
        "X-Transactions-Count": transactions_count.toString()
      }
    });
  } catch (error) {
    console.error("Error in handleDashboard1Step6:", error);
    return new Response(JSON.stringify({
      error: "Internal server error",
      message: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
}
__name(handleDashboard1Step6, "handleDashboard1Step6");
var ACCESS_COOKIE_NAME = "lm_access";
var ACCESS_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
async function enforceSiteAccess(request, env, corsHeaders) {
  const secret = env.SITE_ACCESS_TOKEN;
  if (typeof secret !== "string" || secret.length === 0) {
    return new Response("Site access not configured", {
      status: 500,
      headers: { ...corsHeaders, "Cache-Control": "no-store" }
    });
  }
  const expectedCookieValue = await deriveAccessCookieValue(secret);
  const cookieValue = getCookieValue(request.headers.get("Cookie"), ACCESS_COOKIE_NAME);
  if (cookieValue && timingSafeEqual(cookieValue, expectedCookieValue)) {
    return null;
  }
  return buildAccessDeniedResponse(request, corsHeaders);
}
__name(enforceSiteAccess, "enforceSiteAccess");
async function handleAccessGate(request, env, corsHeaders) {
  const url = new URL(request.url);
  const secret = env.SITE_ACCESS_TOKEN;
  if (typeof secret !== "string" || secret.length === 0) {
    return new Response("Site access not configured", {
      status: 500,
      headers: { ...corsHeaders, "Cache-Control": "no-store" }
    });
  }
  const expectedCookieValue = await deriveAccessCookieValue(secret);
  const currentCookieValue = getCookieValue(request.headers.get("Cookie"), ACCESS_COOKIE_NAME);
  const alreadyUnlocked = currentCookieValue && timingSafeEqual(currentCookieValue, expectedCookieValue);
  const isSecure = url.protocol === "https:";
  const nextFromQuery = sanitizeNextPath(url.searchParams.get("next"));
  const nextPath = nextFromQuery || "/";
  if (url.searchParams.get("logout") === "1") {
    const clearCookie = buildSetCookieHeader(ACCESS_COOKIE_NAME, "", {
      maxAgeSeconds: 0,
      secure: isSecure
    });
    return new Response(getAccessGatePage({ status: "logged_out", next: nextPath }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html",
        "Cache-Control": "no-store",
        "Set-Cookie": clearCookie
      }
    });
  }
  if (request.method === "GET") {
    if (alreadyUnlocked) {
      return new Response(getAccessGatePage({ status: "already_unlocked", next: nextPath }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "text/html", "Cache-Control": "no-store" }
      });
    }
    return new Response(getAccessGatePage({ next: nextPath }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "text/html", "Cache-Control": "no-store" }
    });
  }
  if (request.method === "POST") {
    const { token, next } = await readAccessGateBody(request);
    const redirectTarget = sanitizeNextPath(next) || nextPath;
    if (!token) {
      return new Response(getAccessGatePage({ error: "Missing access token", next: redirectTarget }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "text/html", "Cache-Control": "no-store" }
      });
    }
    if (!timingSafeEqual(token, secret)) {
      return new Response(getAccessGatePage({ error: "Invalid access token", next: redirectTarget }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "text/html", "Cache-Control": "no-store" }
      });
    }
    const setCookie = buildSetCookieHeader(ACCESS_COOKIE_NAME, expectedCookieValue, {
      maxAgeSeconds: ACCESS_COOKIE_MAX_AGE_SECONDS,
      secure: isSecure
    });
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        "Cache-Control": "no-store",
        "Set-Cookie": setCookie,
        "Location": redirectTarget
      }
    });
  }
  return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
}
__name(handleAccessGate, "handleAccessGate");
function getCookieValue(cookieHeader, name) {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";");
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex === -1) continue;
    const key = trimmed.slice(0, equalsIndex).trim();
    if (key !== name) continue;
    return trimmed.slice(equalsIndex + 1);
  }
  return null;
}
__name(getCookieValue, "getCookieValue");
function buildSetCookieHeader(name, value, { maxAgeSeconds, secure }) {
  const pieces = [`${name}=${value}`, "Path=/", `Max-Age=${maxAgeSeconds}`, "SameSite=Lax", "HttpOnly"];
  if (secure) pieces.push("Secure");
  return pieces.join("; ");
}
__name(buildSetCookieHeader, "buildSetCookieHeader");
function sanitizeNextPath(value) {
  if (typeof value !== "string" || value.length === 0) return null;
  if (!value.startsWith("/")) return null;
  if (value.startsWith("//")) return null;
  if (/[\r\n]/.test(value)) return null;
  return value;
}
__name(sanitizeNextPath, "sanitizeNextPath");
function escapeHtml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
__name(escapeHtml, "escapeHtml");
function timingSafeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const encoder = new TextEncoder();
  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);
  if (aBytes.length !== bBytes.length) return false;
  let result = 0;
  for (let i = 0; i < aBytes.length; i++) {
    result |= aBytes[i] ^ bBytes[i];
  }
  return result === 0;
}
__name(timingSafeEqual, "timingSafeEqual");
async function deriveAccessCookieValue(secret) {
  const raw = await sha256Base64(`lm_access_cookie_v1|${secret}`);
  return raw.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
__name(deriveAccessCookieValue, "deriveAccessCookieValue");
function buildAccessDeniedResponse(request, corsHeaders) {
  const url = new URL(request.url);
  const accessUrl = `/__access?next=${encodeURIComponent(url.pathname + url.search)}`;
  const acceptsHtml = (request.headers.get("Accept") || "").includes("text/html");
  if (acceptsHtml && request.method === "GET") {
    return new Response(getAccessDeniedPage({ accessUrl }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "text/html", "Cache-Control": "no-store" }
    });
  }
  return new Response(JSON.stringify({
    error: "Unauthorized",
    message: "Unlock this private demo via /__access and retry.",
    access_url: accessUrl
  }), {
    status: 401,
    headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" }
  });
}
__name(buildAccessDeniedResponse, "buildAccessDeniedResponse");
async function readAccessGateBody(request) {
  const contentType = request.headers.get("Content-Type") || "";
  if (contentType.includes("application/json")) {
    const body = await request.json().catch(() => null);
    return {
      token: body && typeof body.token === "string" ? body.token : null,
      next: body && typeof body.next === "string" ? body.next : null
    };
  }
  const form = await request.formData().catch(() => null);
  if (form) {
    const token = form.get("token");
    const next = form.get("next");
    return {
      token: typeof token === "string" ? token : token ? String(token) : null,
      next: typeof next === "string" ? next : next ? String(next) : null
    };
  }
  return { token: null, next: null };
}
__name(readAccessGateBody, "readAccessGateBody");
function generateToken() {
  return "tok_" + Math.random().toString(36).substr(2, 16) + Date.now().toString(36);
}
__name(generateToken, "generateToken");
function generateFillerString(targetLength = 4e5) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const charsLen = chars.length;
  const result = new Array(targetLength);
  const chunkSize = 65536;
  let offset = 0;
  while (offset < targetLength) {
    const remaining = targetLength - offset;
    const currentChunkSize = Math.min(chunkSize, remaining);
    const randomBytes = new Uint8Array(currentChunkSize);
    crypto.getRandomValues(randomBytes);
    for (let i = 0; i < currentChunkSize; i++) {
      result[offset + i] = chars[randomBytes[i] % charsLen];
    }
    offset += currentChunkSize;
  }
  return result.join("");
}
__name(generateFillerString, "generateFillerString");
async function sha256Base64(input) {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashString = String.fromCharCode.apply(null, hashArray);
  return btoa(hashString);
}
__name(sha256Base64, "sha256Base64");
async function buildLargeViewState(sessionId, sessionToken, userId) {
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  const nonce = generateToken();
  const payloadBase = `${sessionToken}|${sessionId}|${userId}|${nonce}|${timestamp}`;
  const signature = await sha256Base64(payloadBase);
  const filler = generateFillerString();
  const stateObject = {
    v: "1.0",
    sid: sessionId,
    uid: userId,
    ts: timestamp,
    nonce,
    sig: signature,
    view: filler
  };
  const raw = JSON.stringify(stateObject);
  const viewstate = btoa(raw);
  return {
    viewstate,
    rawLength: raw.length,
    signature,
    timestamp
  };
}
__name(buildLargeViewState, "buildLargeViewState");
var LOGO_IMAGE_PATH = "/images/loadmagic-shadow.png";
var BASE_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');

  :root {
    --bg: #070b14;
    --panel: #0f1727;
    --panel-alt: #111b2e;
    --border: rgba(255, 255, 255, 0.08);
    --text: #e6e8ec;
    --muted: #9aa5be;
    --accent: #2fb1ff;
    --accent-2: #6fd6ff;
    --success: #34d399;
    --danger: #ef4444;
    --warn: #fbbf24;
    --shadow: 0 12px 40px rgba(0, 0, 0, 0.35);
  }

  * {
    box-sizing: border-box;
  }

  body.page {
    margin: 0;
    padding: 0 0 40px 0;
    background: radial-gradient(circle at 15% 20%, rgba(47, 177, 255, 0.08), transparent 35%), radial-gradient(circle at 80% 10%, rgba(111, 214, 255, 0.08), transparent 30%), var(--bg);
    color: var(--text);
    font-family: 'Space Grotesk', 'Segoe UI', sans-serif;
    line-height: 1.6;
  }

  a {
    color: var(--accent);
    text-decoration: none;
    font-weight: 500;
  }

  a:hover {
    color: var(--accent-2);
    text-decoration: underline;
  }

  .topbar {
    position: sticky;
    top: 0;
    z-index: 20;
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 18px 24px;
    background: linear-gradient(120deg, rgba(15, 22, 39, 0.95), rgba(12, 20, 34, 0.92));
    border-bottom: 1px solid var(--border);
    box-shadow: var(--shadow);
    backdrop-filter: blur(8px);
  }

  .logo {
    height: 52px;
    width: auto;
    display: block;
    filter: drop-shadow(0 8px 20px rgba(0, 0, 0, 0.4));
  }

  .titles {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .titles .eyebrow {
    letter-spacing: 0.16em;
    text-transform: uppercase;
    font-size: 11px;
    color: var(--muted);
    margin: 0;
  }

  .titles h1 {
    margin: 0;
    font-size: 22px;
  }

  .titles .subtitle {
    margin: 2px 0 0 0;
    color: var(--muted);
    font-size: 14px;
  }

  .nav {
    margin-left: auto;
    display: flex;
    gap: 10px;
    align-items: center;
    flex-wrap: wrap;
  }

  .nav a {
    padding: 8px 12px;
    border-radius: 10px;
    border: 1px solid var(--border);
    background: rgba(255, 255, 255, 0.03);
  }

  .content {
    max-width: 1100px;
    margin: 0 auto;
    padding: 26px 22px 40px;
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .card,
  .endpoint,
  .user-status,
  .session-info,
  .auth-test,
  .filters,
  .product,
  .product-detail,
  .checkout-section,
  .correlation-info,
  .test-section,
  .step-box {
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 16px 18px;
    box-shadow: 0 16px 36px rgba(0, 0, 0, 0.28);
  }

  .section-title {
    margin: 0 0 10px 0;
    font-size: 18px;
  }

  button {
    background: linear-gradient(135deg, var(--accent), var(--accent-2));
    color: #08101f;
    border: none;
    padding: 10px 16px;
    border-radius: 10px;
    font-weight: 700;
    cursor: pointer;
    transition: transform 0.12s ease, box-shadow 0.12s ease, opacity 0.12s ease;
  }

  button:hover {
    transform: translateY(-1px);
    box-shadow: 0 12px 26px rgba(47, 177, 255, 0.35);
    opacity: 0.95;
  }

  input,
  select,
  textarea {
    background: #0f1626;
    color: var(--text);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 10px 12px;
    width: 100%;
    font-size: 15px;
  }

  label {
    color: var(--muted);
  }

  code {
    background: #0f1626;
    padding: 2px 6px;
    border-radius: 6px;
    color: #9cdcfe;
  }

  pre {
    background: #0f1626;
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 12px;
    overflow-x: auto;
    color: var(--text);
  }

  .endpoint {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    flex-wrap: wrap;
  }

  .method {
    display: inline-block;
    padding: 4px 10px;
    border-radius: 8px;
    color: #0b1220;
    font-weight: 800;
  }

  .get {
    background: linear-gradient(135deg, #60a5fa, #38bdf8);
  }

  .post {
    background: linear-gradient(135deg, #34d399, #22c55e);
  }

  .success {
    background: rgba(52, 211, 153, 0.08);
    color: #34d399;
    border: 1px solid rgba(52, 211, 153, 0.35);
    border-radius: 10px;
    padding: 12px;
  }

  .error {
    background: rgba(239, 68, 68, 0.08);
    color: #fca5a5;
    border: 1px solid rgba(239, 68, 68, 0.35);
    border-radius: 10px;
    padding: 12px;
  }

  .info {
    background: rgba(59, 130, 246, 0.08);
    color: #93c5fd;
    border: 1px solid rgba(59, 130, 246, 0.28);
    border-radius: 10px;
    padding: 12px;
  }

  .user-status,
  .not-logged-in,
  .logged-in {
    border-radius: 12px;
  }

  .logged-in {
    background: rgba(52, 211, 153, 0.1);
    border: 1px solid rgba(52, 211, 153, 0.35);
  }

  .not-logged-in {
    background: rgba(251, 191, 36, 0.08);
    border: 1px solid rgba(251, 191, 36, 0.3);
  }

  .pill {
    display: inline-block;
    padding: 4px 10px;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid var(--border);
    border-radius: 999px;
    font-size: 13px;
    color: var(--muted);
  }

  ul {
    padding-left: 18px;
  }
`;
function renderHeader(title, subtitle = "") {
  return `
    <header class="topbar">
      <img src="${LOGO_IMAGE_PATH}" alt="LoadMagic.AI logo" class="logo">
      <div class="titles">
        <p class="eyebrow">LoadMagic.AI</p>
        <h1>${title}</h1>
        ${subtitle ? `<p class="subtitle">${subtitle}</p>` : ""}
      </div>
      <nav class="nav">
        <a href="/">Home</a>
        <a href="/products">Products</a>
        <a href="/login">Login</a>
        <a href="/dashboard">Dashboard</a>
        <a href="/dashboard1">Dashboard1</a>
      </nav>
    </header>
  `;
}
__name(renderHeader, "renderHeader");
function getAccessGatePage({ error = null, status = null, next = "/" } = {}) {
  const safeNext = escapeHtml(next);
  const notice = error ? `<div class="error"><strong>Access denied:</strong> ${escapeHtml(error)}</div>` : status === "already_unlocked" ? `<div class="success"><strong>Already unlocked.</strong> You can continue.</div>` : status === "logged_out" ? `<div class="info"><strong>Logged out.</strong> Access cookie cleared.</div>` : `<div class="info"><strong>Private demo.</strong> Enter the access token to continue.</div>`;
  const actions = status === "already_unlocked" ? `
      <p><a href="${safeNext}">Continue to ${safeNext}</a></p>
      <p><a href="/__access?logout=1">Log out</a></p>
    ` : `
      <form method="POST" action="/__access" style="display: grid; gap: 10px; max-width: 520px;">
        <label for="token">Access token</label>
        <input id="token" name="token" type="password" autocomplete="current-password" required />
        <input type="hidden" name="next" value="${safeNext}" />
        <button type="submit">Unlock</button>
      </form>
      <p style="margin-top: 12px; color: var(--muted);">After unlocking, a cookie is set so HAR exports typically keep access intact.</p>
    `;
  return `<!DOCTYPE html>
<html>
<head>
  <title>Private Demo Access</title>
  <style>${BASE_STYLES}</style>
</head>
<body class="page">
  <div class="content">
    <div class="card">
      <h2 class="section-title">LoadMagic \u2013 Private Demo</h2>
      ${notice}
      <p style="margin-top: 12px;">Next: <code>${safeNext}</code></p>
      ${actions}
    </div>
  </div>
</body>
</html>`;
}
__name(getAccessGatePage, "getAccessGatePage");
function getAccessDeniedPage({ accessUrl } = {}) {
  const safeAccessUrl = escapeHtml(accessUrl || "/__access");
  return `<!DOCTYPE html>
<html>
<head>
  <title>Private Demo</title>
  <style>${BASE_STYLES}</style>
</head>
<body class="page">
  <div class="content">
    <div class="card">
      <h2 class="section-title">Private Demo</h2>
      <div class="info">
        This site is protected. Unlock access first.
      </div>
      <p style="margin-top: 12px;"><a href="${safeAccessUrl}">Go to ${safeAccessUrl}</a></p>
    </div>
  </div>
</body>
</html>`;
}
__name(getAccessDeniedPage, "getAccessDeniedPage");
function getHomePage() {
  return `<!DOCTYPE html>
<html>
<head>
    <title>LoadMagic Test Demo</title>
    <style>
      ${BASE_STYLES}
      .endpoint-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        gap: 12px;
      }
      .endpoint strong {
        color: var(--text);
      }
    </style>
</head>
<body class="page">
    ${renderHeader("LoadMagic Test Demo", "Dark mode experience for LoadMagic.AI correlation flows")}
    <div class="content">
      <div class="card">
          <p>This demo app provides both HTML forms and JSON API endpoints for testing your dynamic correlation plugin.</p>
      </div>
      
      <div class="card">
          <h2 class="section-title">HTML Pages (for manual testing)</h2>
          <ul>
              <li><a href="/login">Login Form</a></li>
              <li><a href="/products">Products Catalog</a></li>
              <li><a href="/checkout">Checkout Process</a> (session required)</li>
              <li><a href="/dashboard">Authenticated Dashboard</a> (session required)</li>
              <li><a href="/dashboard1">Dashboard1</a>  (short data edge case test)</li>
          </ul>
      </div>
      
      <div class="card">
          <h2 class="section-title">API Endpoints (for testing)</h2>
          <div class="endpoint-grid">
              <div class="endpoint">
                  <span class="method post">POST</span> <strong>/api/login</strong><br>
                  Body: <code>{"username": "testuser1", "password": "123"}</code><br>
                  Returns: <code>session_token</code> for correlation
              </div>
              
              <div class="endpoint">
                  <span class="method get">GET</span> <strong>/api/products</strong><br>
                  Optional: <code>?category=Electronics</code><br>
                  Returns: List of products with IDs for correlation
              </div>
              
              <div class="endpoint">
                  <span class="method get">GET</span> <strong>/api/products/{product_id}</strong><br>
                  Example: <code>/api/products/1</code><br>
                  Returns: Individual product details with enhanced data
              </div>
              
              <div class="endpoint">
                  <span class="method post">POST</span> <strong>/api/user/profile</strong><br>
                  Body: <code>{"session_token": "...", "user_id": 1, "correlation_id": "..."}</code><br>
                  Returns: User profile data (auth via request body, not headers)
              </div>
              
              <div class="endpoint">
                  <span class="method post">POST</span> <strong>/api/cart/add</strong><br>
                  Body: <code>{"product_id": 1, "session_token": "...", "user_id": 1, "correlation_id": "..."}</code><br>
                  Returns: Cart item details (auth via request body, not headers)
              </div>
              
              <div class="endpoint">
                  <span class="method post">POST</span> <strong>/api/checkout/process</strong><br>
                  Body: <code>{"session_token": "...", "user_id": 1, "correlation_id": "...", "checkout_token": "..."}</code><br>
                  Returns: Order confirmation (all correlation data required in body)
              </div>
              
              <div class="endpoint">
                  <span class="method post">POST</span> <strong>/api/orders</strong><br>
                  Headers: <code>Authorization: Bearer {session_token}</code><br>
                  Body: <code>{"product_ids": [1,2], "quantities": [1,2]}</code><br>
                  Returns: <code>order_token</code> for correlation
              </div>
              
              <div class="endpoint">
                  <span class="method get">GET</span> <strong>/api/orders/{order_token}</strong><br>
                  Returns: Order details and tracking info
              </div>
              
              <div class="endpoint">
                  <span class="method post">POST</span> <strong>/api/http-test</strong><br>
                  Body: <code>{"session_token": "...", "user_id": 1, "correlation_id": "...", "test_message": "Hello!"}</code><br>
                  Returns: <strong>Plain HTTP text response (not JSON)</strong> with Step 2 token for next step
              </div>
              
              <div class="endpoint">
                  <span class="method post">POST</span> <strong>/api/http-test-step2</strong><br>
                  Body: <code>{"session_token": "...", "user_id": 1, "correlation_id": "...", "step2_token": "..."}</code><br>
                  Returns: <strong>Plain HTTP text response (not JSON)</strong> - Requires Step 2 token from Step 1!
              </div>
          </div>
      </div>
      
      <div class="card">
          <h2 class="section-title">Test Users</h2>
          <ul>
              <li><strong>testuser1</strong> / password: <strong>123</strong></li>
              <li><strong>testuser2</strong> / password: <strong>456</strong></li>
              <li><strong>adminuser</strong> / password: <strong>789</strong></li>
          </ul>
      </div>
    </div>
    
    <script>
      // Global addToCart function used by all pages
      window.addToCart = function(productId) {
          // Get all session-related data from localStorage
          const token = localStorage.getItem('session_token');
          const sessionId = localStorage.getItem('session_id');
          const csrfToken = localStorage.getItem('csrf_token');
          const userId = localStorage.getItem('user_id');
          const correlationId = localStorage.getItem('correlation_id');

          console.log('Debug - Session data:', {
              token: token ? token.substring(0, 20) + '...' : 'missing',
              sessionId: sessionId ? sessionId.substring(0, 20) + '...' : 'missing',
              csrfToken: csrfToken ? csrfToken.substring(0, 20) + '...' : 'missing',
              userId: userId,
              correlationId: correlationId ? correlationId.substring(0, 20) + '...' : 'missing'
          });

          if (!token || !sessionId || !csrfToken || !userId || !correlationId) {
              alert('[ERROR] Missing session data! Please login first to get all required tokens.\\n\\nRequired: session_token, session_id, csrf_token, correlation_id, user_id');
              return;
          }

          // Make actual API call with ALL authentication data in the body
          const quantity = 1;
          const requestPayload = {
              product_id: productId,
              quantity: quantity,
              session_token: token,
              session_id: sessionId,
              csrf_token: csrfToken,
              user_id: parseInt(userId),
              correlation_id: correlationId,
              client_session_id: sessionId,
              client_request_id: 'req_' + Date.now(),
              timestamp: new Date().toISOString()
          };
          
          console.log('Sending cart add request with payload:', requestPayload);
          
          fetch('/api/cart/add', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify(requestPayload)
          })
          .then(response => {
              console.log('Cart add response status:', response.status);
              return response.json();
          })
          .then(data => {
              console.log('Cart add response data:', data);
              
              if (data.success) {
                  // Store next step token for future correlation
                  localStorage.setItem('next_step_token', data.next_step_token);
                  
                  alert('[OK] Body-Authenticated Success! Added ' + data.cart_item.product_name + ' to cart.\\n\\n[AUTH] Authentication Method: ALL DATA IN REQUEST BODY\\n[INFO] Session Token: ' + token.substring(0, 20) + '...\\n[ID] User ID: ' + userId + '\\n[SYNC] Correlation ID: ' + correlationId.substring(0, 20) + '...\\n\\n[PACKAGE] Cart Item ID: ' + data.cart_item.cart_item_id + '\\n[USER] User: ' + data.cart_item.username + '\\n[MONEY] Subtotal: $' + data.cart_item.subtotal + '\\n[TARGET] Next Step Token: ' + data.next_step_token + '\\n\\n[SPARKLE] This request used NO Authorization headers - all session/auth data was in the request body for advanced correlation testing!');
              } else {
                  alert('[ERROR] Error: ' + data.error + '\\n\\nMessage: ' + (data.message || 'Unknown error') + '\\n\\nMake sure you have all required fields: session_token, user_id, correlation_id');
              }
          })
          .catch(error => {
              console.error('Cart add error:', error);
              alert('[ERROR] Network Error: ' + error.message);
          });
      };
      
      function logout() {
          localStorage.removeItem('session_token');
          localStorage.removeItem('username');
          localStorage.removeItem('user_id');
          localStorage.removeItem('correlation_id');
          localStorage.removeItem('session_id');
          localStorage.removeItem('csrf_token');
          localStorage.removeItem('next_step_token');
          location.reload();
      }
      <\/script>
  </body>
  </html>`;
}
__name(getHomePage, "getHomePage");
function getLoginPage() {
  return `<!DOCTYPE html>
<html>
<head>
    <title>Login - LoadMagic Test Demo</title>
    <style>
      ${BASE_STYLES}
      form {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .form-card {
        max-width: 520px;
      }
    </style>
</head>
<body class="page">
    ${renderHeader("Login", "Generate fresh tokens for correlation")}
    <div class="content">
      <div class="card form-card">
        <h2 class="section-title">Login Form</h2>
        <form onsubmit="handleLogin(event)">
            <input type="text" id="username" placeholder="Username" required>
            <input type="password" id="password" placeholder="Password" required>
            <button type="submit">Login</button>
        </form>
        
        <div id="result"></div>
        
        <p><a href="/">\u2190 Back to Home</a></p>
      </div>
    </div>
    
    <script>
      async function handleLogin(event) {
          event.preventDefault();
          const username = document.getElementById('username').value;
          const password = document.getElementById('password').value;
          
          try {
              const response = await fetch('/api/login', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ username, password })
              });
              
              const data = await response.json();
              
              if (data.success) {
                  // Store additional correlation data for later use
                  localStorage.setItem('session_token', data.session_token);
                  localStorage.setItem('user_id', data.user_id); // Store user ID for body requests
                  localStorage.setItem('session_id', data.session_id);
                  localStorage.setItem('csrf_token', data.csrf_token);
                  localStorage.setItem('correlation_id', data.correlation_id);
                  localStorage.setItem('username', data.username);
                  
                  document.getElementById('result').innerHTML = 
                      '<h3>[OK] Login Successful!</h3>' +
                      '<div style="background: #e8f5e8; padding: 15px; border-radius: 5px; margin: 10px 0;">' +
                          '<p><strong>Session Token:</strong> <code>' + data.session_token + '</code></p>' +
                          '<p><strong>Session ID:</strong> <code>' + data.session_id + '</code></p>' +
                          '<p><strong>CSRF Token:</strong> <code>' + data.csrf_token + '</code></p>' +
                          '<p><strong>Correlation ID:</strong> <code>' + data.correlation_id + '</code></p>' +
                          '<p><strong>User ID:</strong> ' + data.user_id + '</p>' +
                          '<p><strong>Username:</strong> ' + data.username + '</p>' +
                          '<p><strong>Email:</strong> ' + data.email + '</p>' +
                          '<p><strong>Expires In:</strong> ' + data.expires_in + ' seconds</p>' +
                          '<p><strong>Server Timestamp:</strong> ' + data.server_timestamp + '</p>' +
                      '</div>' +
                      '<div style="margin-top: 15px;">' +
                          '<button onclick="testAuthenticatedRequest()" style="background: #28a745; padding: 8px 12px; border: none; border-radius: 3px; color: white; cursor: pointer; margin-right: 10px;">Test Authenticated Request</button>' +
                          '<a href="/dashboard" style="background: #0366d6; color: white; padding: 8px 12px; text-decoration: none; border-radius: 3px;">Go to Dashboard</a>' +
                          '<a href="/dashboard1" style="background: #667eea; color: white; padding: 8px 12px; text-decoration: none; border-radius: 3px; margin-left: 5px;">Go to Dashboard1</a>' +
                          '<a href="/checkout" style="background: #ffc107; color: black; padding: 8px 12px; text-decoration: none; border-radius: 3px; margin-left: 5px;">Go to Checkout</a>' +
                      '</div>';
              } else {
                  document.getElementById('result').innerHTML = 
                      '<div style="background: #f8d7da; color: #721c24; padding: 10px; border-radius: 3px;"><h3>[ERROR] Login Failed</h3><pre>' + JSON.stringify(data, null, 2) + '</pre></div>';
              }
          } catch (error) {
              document.getElementById('result').innerHTML = 
                  '<div style="background: #f8d7da; color: #721c24; padding: 10px; border-radius: 3px;"><h3>[ERROR] Error</h3><pre>' + error.message + '</pre></div>';
          }
      }
      
      async function testAuthenticatedRequest() {
          const token = localStorage.getItem('session_token');
          const sessionId = localStorage.getItem('session_id');
          const csrfToken = localStorage.getItem('csrf_token');
          const correlationId = localStorage.getItem('correlation_id');
          const userId = localStorage.getItem('user_id');

          if (!token || !sessionId || !csrfToken || !correlationId || !userId) {
              alert('Missing session data. Please login to get all required tokens.');
              return;
          }

          try {
              const response = await fetch('/api/user/profile', {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json'
                      // No Authorization header - all auth data in body!
                  },
                  body: JSON.stringify({
                      session_token: token,
                      session_id: sessionId,
                      csrf_token: csrfToken,
                      correlation_id: correlationId,
                      user_id: parseInt(userId)
                  })
              });

              const data = await response.json();

              document.getElementById('result').innerHTML += 
                  '<div style="background: #d1ecf1; padding: 15px; border-radius: 5px; margin-top: 15px;">' +
                      '<h4>Authenticated Request Result (4-Token Validation):</h4>' +
                      '<pre>' + JSON.stringify(data, null, 2) + '</pre>' +
                  '</div>';
          } catch (error) {
              alert('Error testing authenticated request: ' + error.message);
          }
      }
      <\/script>
  </body>
  </html>`;
}
__name(getLoginPage, "getLoginPage");
function getDashboardPage() {
  return `<!DOCTYPE html>
<html>
<head>
    <title>Dashboard - LoadMagic Test Demo</title>
    <style>
      ${BASE_STYLES}
      .endpoint-test {
        display: flex;
        gap: 10px;
        align-items: center;
        flex-wrap: wrap;
        margin: 10px 0;
      }
    </style>
</head>
<body class="page">
    ${renderHeader("Dashboard", "Authenticated flows and multi-step tokens")}
    <div class="content">
      <div class="card session-info" id="session-info">
          <h3>Session Information</h3>
          <p>Loading session data...</p>
          <p id="session-warning" style="display:none; color:#fbbf24; font-weight:600; margin-top:8px;">
            No session token detected. Please login first (Home \u2192 Login) to generate fresh tokens. Clear browser storage if you suspect stale data.
          </p>
      </div>
      
      <div class="card auth-test">
          <h3>Test Authenticated Endpoints</h3>
          <p>These endpoints require your session token for correlation testing:</p>
          
          <div class="endpoint-test">
              <button onclick="testProfile()">Test GET /api/user/profile</button>
              <span>Get user profile using session token</span>
          </div>
          
          <div class="endpoint-test">
              <button onclick="testCreateOrder()">Test POST /api/orders</button>
              <span>Create an order using session token</span>
          </div>
          
          <div class="endpoint-test">
              <button onclick="testViewCart()">Test POST /api/cart/add</button>
              <span>Add item to cart using session data in request body</span>
          </div>
          
          <div class="endpoint-test">
              <button onclick="testHttpTest()" style="background: #6f42c1;">Test POST /api/http-test</button>
              <span>HTTP-only response endpoint (perfect for HTTP testing)</span>
          </div>
          
          <div class="endpoint-test">
              <button onclick="testHttpTestStep2()" style="background: #e83e8c;" id="step2Button" disabled>Test POST /api/http-test-step2</button>
              <span>Step 2 requires token from Step 1 response (multi-step correlation)</span>
          </div>
          
          <div class="endpoint-test">
              <button onclick="testLogout()">Test Logout</button>
              <span>Clear session token (simulate logout)</span>
          </div>
      </div>
      
      <div class="card" id="test-results"></div>
      
      <p><a href="/">\u2190 Back to Home</a> | <a href="/login">Login</a></p>
    </div>
    
    <script>
      // Check for session token on page load
      window.onload = function() {
          const token = localStorage.getItem('session_token');
          const username = localStorage.getItem('username');
          
          if (token) {
              document.getElementById('session-info').innerHTML = 
                  '<h3>[OK] Active Session</h3>' +
                  '<p><strong>Username:</strong> ' + (username || 'Unknown') + '</p>' +
                  '<p><strong>Session Token:</strong> <code>' + token + '</code></p>' +
                  '<p><strong>Token Length:</strong> ' + token.length + ' characters</p>' +
                  '<p><strong>Status:</strong> <span style="color: #28a745; font-weight: bold;">AUTHENTICATED</span></p>' +
                  '<p><em>This token will be used for authenticated API requests</em></p>';
          } else {
              document.getElementById('session-info').innerHTML = 
                  '<h3>[ERROR] No Active Session</h3>' +
                  '<p>You need to <a href="/login">login</a> first to access authenticated features.</p>' +
                  '<p><strong>Status:</strong> <span style="color: #dc3545; font-weight: bold;">NOT AUTHENTICATED</span></p>';
          }
      };
      
      async function testProfile() {
          const token = localStorage.getItem('session_token');
          const userId = localStorage.getItem('user_id');
          const correlationId = localStorage.getItem('correlation_id');
          const sessionId = localStorage.getItem('session_id');
          const csrfToken = localStorage.getItem('csrf_token');

          if (!token || !userId || !correlationId || !sessionId || !csrfToken) {
              showResult('error', 'Missing session data. Please login to get all required tokens (session_token, session_id, csrf_token, correlation_id, user_id).');
              return;
          }

          try {
              showResult('info', 'Testing POST /api/user/profile with all 4 tokens in request body...');

              const response = await fetch('/api/user/profile', {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json'
                      // NO Authorization header - all auth data in body!
                  },
                  body: JSON.stringify({
                      session_token: token,
                      session_id: sessionId,
                      csrf_token: csrfToken,
                      correlation_id: correlationId,
                      user_id: parseInt(userId)
                  })
              });

              const data = await response.json();

              if (response.ok) {
                  showResult('success', 'Profile request successful with 4-token validation!', data);
              } else {
                  showResult('error', 'Profile request failed: ' + data.error, data);
              }
          } catch (error) {
              showResult('error', 'Network error: ' + error.message);
          }
      }
      
      async function testCreateOrder() {
          const token = localStorage.getItem('session_token');
          const checkoutToken = localStorage.getItem('next_step_token') || 'checkout_' + Date.now();
          
          if (!token) {
              showResult('error', 'No session token found. Please login first.');
              return;
          }
          
          try {
              showResult('info', 'Testing POST /api/orders with session token and correlation data...');
              
              const response = await fetch('/api/orders', {
                  method: 'POST',
                  headers: {
                      'Authorization': 'Bearer ' + token,
                      'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                      product_ids: [1, 2],
                      quantities: [1, 2],
                      client_request_id: 'order_req_' + Date.now(),  // Payload correlation
                      checkout_token: checkoutToken,                  // Payload correlation
                      payment_method: 'credit_card',                  // Payload data
                      shipping_preference: 'standard'                 // Payload data
                  })
              });
              
              const data = await response.json();
              
              if (response.ok) {
                  // Store order correlation data for future requests
                  localStorage.setItem('order_token', data.order_token);
                  localStorage.setItem('confirmation_number', data.confirmation_number);
                  
                  showResult('success', 'Order created successfully! Note all the correlation tokens in payload and headers.', data);
              } else {
                  showResult('error', 'Order creation failed: ' + data.error, data);
              }
          } catch (error) {
              showResult('error', 'Network error: ' + error.message);
          }
      }
      
      async function testViewCart() {
          const token = localStorage.getItem('session_token');
          const userId = localStorage.getItem('user_id');
          const correlationId = localStorage.getItem('correlation_id');
          const sessionId = localStorage.getItem('session_id');
          const csrfToken = localStorage.getItem('csrf_token');

          if (!token || !userId || !correlationId || !sessionId || !csrfToken) {
              showResult('error', 'Missing session data. Please login to get all required tokens (session_token, session_id, csrf_token, correlation_id, user_id).');
              return;
          }

          try {
              showResult('info', 'Testing POST /api/cart/add with all 4 tokens in request body...');

              const response = await fetch('/api/cart/add', {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json'
                      // NO Authorization header - all auth data in body!
                  },
                  body: JSON.stringify({
                      product_id: 1, // Test with product 1
                      quantity: 1,
                      session_token: token,
                      session_id: sessionId,
                      csrf_token: csrfToken,
                      correlation_id: correlationId,
                      user_id: parseInt(userId),
                      client_session_id: sessionId,
                      client_request_id: 'dashboard_test_' + Date.now(),
                      timestamp: new Date().toISOString()
                  })
              });

              const data = await response.json();

              if (response.ok) {
                  showResult('success', 'Cart add request successful with 4-token validation!', data);
              } else {
                  showResult('error', 'Cart add request failed: ' + data.error, data);
              }
          } catch (error) {
              showResult('error', 'Network error: ' + error.message);
          }
      }
      
      async function testHttpTest() {
          const token = localStorage.getItem('session_token');
          const userId = localStorage.getItem('user_id');
          const correlationId = localStorage.getItem('correlation_id');
          const sessionId = localStorage.getItem('session_id');
          const csrfToken = localStorage.getItem('csrf_token');

          if (!token || !userId || !correlationId || !sessionId || !csrfToken) {
              showResult('error', 'Missing session data. Please login to get all required tokens (session_token, session_id, csrf_token, correlation_id, user_id).');
              return;
          }

          try {
              showResult('info', 'Testing POST /api/http-test with all 4 tokens in request body (HTTP response, not JSON)...');

              const response = await fetch('/api/http-test', {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json'
                      // NO Authorization header - all auth data in body!
                  },
                  body: JSON.stringify({
                      session_token: token,
                      session_id: sessionId,
                      csrf_token: csrfToken,
                      correlation_id: correlationId,
                      user_id: parseInt(userId),
                      client_session_id: sessionId,
                      test_message: 'Dashboard HTTP Test - ' + new Date().toLocaleString(),
                      client_request_id: 'http_test_' + Date.now(),
                      timestamp: new Date().toISOString()
                  })
              });
              
              const responseText = await response.text();
              
              if (response.ok) {
                  // Extract step 2 token from response for next step
                  const step2TokenMatch = responseText.match(/STEP 2 TOKEN: (tok_[a-zA-Z0-9_]+)/);
                  const step2Token = step2TokenMatch ? step2TokenMatch[1] : null;
                  
                  if (step2Token) {
                      // Store step 2 token for next request
                      localStorage.setItem('step2_token', step2Token);
                      // Enable Step 2 button
                      const step2Button = document.getElementById('step2Button');
                      if (step2Button) {
                          step2Button.disabled = false;
                          step2Button.style.background = '#e83e8c';
                      }
                  }
                  
                  showResult('success', 'HTTP Test Step 1 successful! Step 2 token extracted and Step 2 button enabled. This endpoint returns plain HTTP text (not JSON) - perfect for HTTP response testing.', {
                      status: response.status,
                      statusText: response.statusText,
                      headers: Object.fromEntries(response.headers.entries()),
                      responseBody: responseText,
                      extractedStep2Token: step2Token
                  });
              } else {
                  showResult('error', 'HTTP Test failed: ' + response.status + ' ' + response.statusText, {
                      status: response.status,
                      statusText: response.statusText,
                      responseBody: responseText
                  });
              }
          } catch (error) {
              showResult('error', 'Network error: ' + error.message);
          }
      }
      
      async function testHttpTestStep2() {
          const token = localStorage.getItem('session_token');
          const userId = localStorage.getItem('user_id');
          const correlationId = localStorage.getItem('correlation_id');
          const sessionId = localStorage.getItem('session_id');
          const csrfToken = localStorage.getItem('csrf_token');
          const step2Token = localStorage.getItem('step2_token');

          if (!token || !userId || !correlationId || !sessionId || !csrfToken) {
              showResult('error', 'Missing session data. Please login to get all required tokens (session_token, session_id, csrf_token, correlation_id, user_id).');
              return;
          }

          if (!step2Token) {
              showResult('error', 'Missing Step 2 token! Please run Step 1 first to extract the Step 2 token from the response.');
              return;
          }

          try {
              showResult('info', 'Testing POST /api/http-test-step2 with all 4 tokens + Step 2 token (multi-step correlation)...');

              const response = await fetch('/api/http-test-step2', {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json'
                      // NO Authorization header - all auth data in body!
                  },
                  body: JSON.stringify({
                      session_token: token,
                      session_id: sessionId,
                      csrf_token: csrfToken,
                      correlation_id: correlationId,
                      user_id: parseInt(userId),
                      client_session_id: sessionId,
                      step2_token: step2Token,
                      test_message: 'Dashboard Step 2 Test - ' + new Date().toLocaleString(),
                      client_request_id: 'http_step2_' + Date.now(),
                      timestamp: new Date().toISOString()
                  })
              });
              
              const responseText = await response.text();
              
              if (response.ok) {
                  // Extract final token from response
                  const finalTokenMatch = responseText.match(/FINAL SUCCESS TOKEN: (tok_[a-zA-Z0-9_]+)/);
                  const finalToken = finalTokenMatch ? finalTokenMatch[1] : null;
                  
                  showResult('success', 'HTTP Test Step 2 successful! Multi-step correlation complete! This demonstrates successful token extraction and validation.', {
                      status: response.status,
                      statusText: response.statusText,
                      headers: Object.fromEntries(response.headers.entries()),
                      responseBody: responseText,
                      extractedFinalToken: finalToken,
                      step2TokenUsed: step2Token
                  });
              } else {
                  showResult('error', 'HTTP Test Step 2 failed: ' + response.status + ' ' + response.statusText, {
                      status: response.status,
                      statusText: response.statusText,
                      responseBody: responseText,
                      step2TokenUsed: step2Token
                  });
              }
          } catch (error) {
              showResult('error', 'Network error: ' + error.message);
          }
      }
      
      function testLogout() {
          localStorage.removeItem('session_token');
          localStorage.removeItem('username');
          showResult('success', 'Session cleared! You are now logged out.');
          
          // Update session info display
          document.getElementById('session-info').innerHTML = 
              '<h3>[ERROR] Session Cleared</h3>' +
              '<p>You have been logged out. <a href="/login">Login again</a> to test authenticated endpoints.</p>' +
              '<p><strong>Status:</strong> <span style="color: #dc3545; font-weight: bold;">NOT AUTHENTICATED</span></p>';
      }
      
      function showResult(type, message, data = null) {
          const resultDiv = document.getElementById('test-results');
          const timestamp = new Date().toLocaleTimeString();
          
          let html = '<div class="' + type + '">' +
              '<strong>[' + timestamp + '] ' + message + '</strong>' +
          '</div>';
          
          if (data) {
              html = '<div class="' + type + '">' +
                  '<strong>[' + timestamp + '] ' + message + '</strong>' +
                  '<pre>' + JSON.stringify(data, null, 2) + '</pre>' +
              '</div>';
          }
          
          html += '</div>';
          
          resultDiv.innerHTML = html + resultDiv.innerHTML;
      }
      <\/script>
  </body>
  </html>`;
}
__name(getDashboardPage, "getDashboardPage");
function getDashboard1Page() {
  return `<!DOCTYPE html>
<html>
<head>
    <title>Dashboard1 - Short + Viewstate Correlation Test</title>
    <style>
      ${BASE_STYLES}
      .header {
        background: linear-gradient(135deg, rgba(47, 177, 255, 0.18), rgba(111, 214, 255, 0.16));
        border: 1px solid var(--border);
      }
      .step-box {
        border-left: 4px solid var(--accent);
      }
      .step-box.heavy {
        border-left-color: var(--warn);
        background: linear-gradient(120deg, rgba(47, 177, 255, 0.08), rgba(0, 0, 0, 0));
      }
      .btn-step2 { background: var(--success); color: #07141f; }
      .btn-step2:hover { opacity: 0.95; }
      .btn-step3 { background: var(--warn); color: #0b1220; }
      .btn-step4 { background: var(--accent-2); color: #0b1220; }
      .nav-links {
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid var(--border);
      }
      .note { color: var(--muted); font-size: 14px; }
    </style>
</head>
<body class="page">
    ${renderHeader("Dashboard1", "Short + large state correlation test")}
    <div class="content">
      <div class="card header">
          <h2>[TARGET] Dashboard1 - Short + Viewstate Correlation Test</h2>
          <p style="margin: 5px 0; opacity: 0.9;">Short IDs plus ASP.NET-style __VIEWSTATE bloat to pressure-test extraction logic</p>
          <div class="pill">Edge cases: tiny IDs + 60kb+ state</div>
      </div>

      <div class="card session-info" id="session-info">
          <h3>Session Information</h3>
          <p>Loading session data...</p>
          <p id="session-warning" style="display:none; color:#fbbf24; font-weight:600; margin-top:8px;">
            No session token detected. Please login first (Home \u2192 Login) to generate fresh tokens. Clear browser storage if you suspect stale data.
          </p>
      </div>

      <div class="card test-section">
          <h3>[INFO] Test Flow Overview</h3>
          <p>Two correlation edge cases in one place: tiny numeric IDs (Steps 1-2), oversized signed viewstate (Steps 3-4), and bulk JSON payloads (Steps 5-6).</p>
          <ul>
            <li><strong>Short values:</strong> 1-9 IDs that break naive regexes.</li>
            <li><strong>Large viewstate:</strong> ~500KB base64 payload with nonce + signature that must be replayed intact.</li>
            <li><strong>Bulk JSON:</strong> 500KB+ request bodies with hundreds of items and a buried validation code.</li>
          </ul>

          <div class="step-box">
              <h4>Step 1: Get Dynamic shortID</h4>
              <p>Call <code>POST /api/dashboard1/step1</code> to receive a short dynamic ID (1-9)</p>
              <button onclick="runStep1()">\u25B6 Run Step 1</button>
          </div>

          <div class="step-box">
              <h4>Step 2: Use Dynamic shortID</h4>
              <p>Call <code>POST /api/dashboard1/step2</code> with the shortID from Step 1</p>
              <button onclick="runStep2()" class="btn-step2" id="step2Button" disabled>\u25B6 Run Step 2</button>
              <small style="display: block; margin-top: 5px; color: var(--muted);">Enabled after Step 1 completes</small>
          </div>

          <div class="step-box heavy">
              <h4>Step 3: Generate Large Viewstate</h4>
              <p>Call <code>POST /api/dashboard1/step3</code> with full session data to generate a signed, ~530KB <code>__VIEWSTATE</code>-style payload. Capture the base64 value for replay.</p>
              <button onclick="runStep3()" class="btn-step3" id="step3Button">\u25B6 Run Step 3</button>
              <small class="note">Requires session_token + session_id + user_id; ~400KB raw / ~530KB base64 (exceeds LLM token limits).</small>
          </div>

          <div class="step-box heavy">
              <h4>Step 4: Replay Viewstate</h4>
              <p>Call <code>POST /api/dashboard1/step4</code> with the exact viewstate from Step 3. Server validates signature, size (&gt;=60kb), and embedded session metadata.</p>
              <button onclick="runStep4()" class="btn-step4" id="step4Button" disabled>\u25B6 Run Step 4</button>
              <small class="note">Enabled after Step 3 succeeds</small>
          </div>

          <div class="step-box heavy">
              <h4>Step 5: Send Huge JSON Payload + Large Response</h4>
              <p>Call <code>POST /api/dashboard1/step5</code> with 500KB+ JSON (800+ items). Response returns ~400KB+ with batch_id and validation code buried in the large response.</p>
              <button onclick="runStep5()" class="btn-step3" id="step5Button">\u25B6 Run Step 5</button>
              <small class="note">Client sends ~800KB request; server returns ~400KB response (both exceed LLM token limits).</small>
          </div>

          <div class="step-box heavy">
              <h4>Step 6: Validate Batch Correlation</h4>
              <p>Call <code>POST /api/dashboard1/step6</code> with the batch_id + validation_code from Step 5. Server recomputes and confirms correctness.</p>
              <button onclick="runStep6()" class="btn-step4" id="step6Button" disabled>\u25B6 Run Step 6</button>
              <small class="note">Enabled after Step 5 succeeds</small>
          </div>
      </div>

      <div class="card" id="test-results"></div>

      <div class="nav-links card">
          <a href="/">\u2190 Home</a> |
          <a href="/login">Login</a> |
          <a href="/dashboard">Main Dashboard</a>
      </div>
    </div>

    <script>
      let extractedShortID = null;
      let extractedViewState = null;
      let viewStateMeta = null;
      let extractedBatchId = null;
      let extractedBatchCode = null;
      let extractedPivotItemId = null;
      let extractedBatchTxCount = null;

      function refreshSessionInfo() {
          const token = localStorage.getItem('session_token');
          const username = localStorage.getItem('username');
          const userId = localStorage.getItem('user_id');
          const sessionId = localStorage.getItem('session_id');
          const csrf = localStorage.getItem('csrf_token');
          const correlationId = localStorage.getItem('correlation_id');
          const warning = document.getElementById('session-warning');

          const hasSession = token && userId && sessionId && csrf && correlationId;

          if (hasSession) {
              const safe = (label, value) => value ? '<code>' + value + '</code>' : '<em>missing</em>';
              document.getElementById('session-info').innerHTML = 
                  '<h3>[OK] Active Session</h3>' +
                  '<p><strong>Username:</strong> ' + (username || 'Unknown') + '</p>' +
                  '<p><strong>User ID:</strong> ' + userId + '</p>' +
                  '<p><strong>Session Token:</strong> ' + safe('token', token) + '</p>' +
                  '<p><strong>Session ID:</strong> ' + safe('session_id', sessionId) + '</p>' +
                  '<p><strong>CSRF Token:</strong> ' + safe('csrf_token', csrf) + '</p>' +
                  '<p><strong>Correlation ID:</strong> ' + safe('correlation_id', correlationId) + '</p>' +
                  '<p style="color: #28a745; font-weight: bold;">Ready to test!</p>';
              if (warning) warning.style.display = 'none';
          } else {
              document.getElementById('session-info').innerHTML = 
                  '<h3>[ERROR] No Active Session</h3>' +
                  '<p>You need to <a href="/login">login</a> first to test this flow.</p>' +
                  '<p style="color: #dc3545; font-weight: bold;">Not authenticated</p>';
              if (warning) warning.style.display = 'block';
          }
      }

      // Check for session token on page load
      window.onload = function() {
          refreshSessionInfo();
      };

function buildLargeTransactions(count = 800, fillerLength = 5000, targetBytes = 800000) {
    const payload = [];
    const seed = Date.now();
    const fillerUnit = 'TXNLOAD';
    let filler = (fillerUnit.repeat(Math.ceil(fillerLength / fillerUnit.length))).slice(0, fillerLength);

    const build = (startIndex, total) => {
        for (let i = 0; i < total; i++) {
            const idx = startIndex + i;
            payload.push({
                id: 'txn_' + seed + '_' + idx,
                amount: 1000 + idx,
                currency: 'USD',
                description: 'Large payload item ' + idx,
                metadata: {
                    client: 'client_' + ((idx % 5) + 1),
                    route: 'edge-case-bulk',
                    idx,
                    filler
                }
            });
        }
    };

    build(0, count);

    let size = JSON.stringify(payload).length;
    let iter = 0;
    while (size < targetBytes && iter < 4) {
        // increase filler and append more items until we meet target size
        fillerLength += 1000;
        filler = (fillerUnit.repeat(Math.ceil(fillerLength / fillerUnit.length))).slice(0, fillerLength);
        build(payload.length, 100);
        size = JSON.stringify(payload).length;
        iter++;
    }

    return { payload, size };
}

      async function runStep1() {
          const token = localStorage.getItem('session_token');
          const userId = localStorage.getItem('user_id');

          if (!token || !userId) {
              showResult('error', 'Missing session data. Please login first.');
              const warning = document.getElementById('session-warning');
              if (warning) warning.style.display = 'block';
              return;
          }

          try {
              showResult('info', '[SYNC] Running Step 1: Requesting dynamic shortID...');

              const response = await fetch('/api/dashboard1/step1', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                      session_token: token,
                      user_id: parseInt(userId)
                  })
              });

              const data = await response.json();

              if (response.ok && data.success) {
                  // Extract the shortID from response
                  extractedShortID = data.shortID;

                  // Hydrate session tokens from network response to avoid stale localStorage
                  if (data.session_token) localStorage.setItem('session_token', data.session_token);
                  if (data.user_id) localStorage.setItem('user_id', data.user_id);
                  if (data.session_id) localStorage.setItem('session_id', data.session_id);
                  if (data.csrf_token) localStorage.setItem('csrf_token', data.csrf_token);
                  if (data.correlation_id) localStorage.setItem('correlation_id', data.correlation_id);
                  refreshSessionInfo();

                  // Enable Step 2 button
                  const step2Button = document.getElementById('step2Button');
                  if (step2Button) {
                      step2Button.disabled = false;
                  }

                  showResult('success', '[OK] Step 1 Completed! Dynamic shortID extracted: <span class="highlight">' + extractedShortID + '</span>', data);
              } else {
                  showResult('error', 'Step 1 failed: ' + (data.error || 'Unknown error'), data);
              }
          } catch (error) {
              showResult('error', 'Network error in Step 1: ' + error.message);
          }
      }

      async function runStep2() {
          const token = localStorage.getItem('session_token');
          const userId = localStorage.getItem('user_id');

          if (!token || !userId) {
              showResult('error', 'Missing session data. Please login first.');
              const warning = document.getElementById('session-warning');
              if (warning) warning.style.display = 'block';
              return;
          }

          if (!extractedShortID) {
              showResult('error', 'No shortID available. Please run Step 1 first.');
              return;
          }

          try {
              showResult('info', '[SYNC] Running Step 2: Validating shortID "<span class="highlight">' + extractedShortID + '</span>"...');

              const response = await fetch('/api/dashboard1/step2', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                      session_token: token,
                      user_id: parseInt(userId),
                      shortID: extractedShortID
                  })
              });

              const data = await response.json();

              if (response.ok && data.success) {
                  showResult('success', '[SPARKLE] Step 2 Completed! Short value correlation test PASSED! Final ID: <span class="highlight">' + data.finalID + '</span>', data);
              } else {
                  showResult('error', 'Step 2 failed: ' + (data.error || 'Unknown error'), data);
              }
          } catch (error) {
              showResult('error', 'Network error in Step 2: ' + error.message);
          }
      }

      async function runStep3() {
          const token = localStorage.getItem('session_token');
          const userId = localStorage.getItem('user_id');
          const sessionId = localStorage.getItem('session_id');

          if (!token || !userId || !sessionId) {
              showResult('error', 'Missing session data. Please login first (needs session_token, user_id, session_id).');
              const warning = document.getElementById('session-warning');
              if (warning) warning.style.display = 'block';
              return;
          }

          try {
              showResult('info', '[ASYNC] Running Step 3: Generating large, signed viewstate (~65kb)...');

              const response = await fetch('/api/dashboard1/step3', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                      session_token: token,
                      user_id: parseInt(userId),
                      session_id: sessionId
                  })
              });

              const data = await response.json();

              if (response.ok && data.success && data.viewstate) {
                  extractedViewState = data.viewstate;
                  viewStateMeta = {
                      base64_length: data.viewstate_base64_length,
                      raw_length: data.viewstate_raw_length,
                      signature: data.signature,
                      signature_hint: data.signature_hint,
                      timestamp: data.timestamp
                  };

                  const step4Button = document.getElementById('step4Button');
                  if (step4Button) {
                      step4Button.disabled = false;
                  }

                  showResult('success', '[OK] Step 3 complete. Large viewstate captured.', {
                      base64_length: data.viewstate_base64_length,
                      raw_length: data.viewstate_raw_length,
                      signature_hint: data.signature_hint,
                      preview: data.viewstate.substring(0, 120) + '...'
                  });
              } else {
                  extractedViewState = null;
                  viewStateMeta = null;
                  const step4Button = document.getElementById('step4Button');
                  if (step4Button) {
                      step4Button.disabled = true;
                  }
                  showResult('error', 'Step 3 failed: ' + (data.error || 'Unknown error'), data);
              }
          } catch (error) {
              showResult('error', 'Network error in Step 3: ' + error.message);
          }
      }

      async function runStep4() {
          const token = localStorage.getItem('session_token');
          const userId = localStorage.getItem('user_id');
          const sessionId = localStorage.getItem('session_id');

          if (!token || !userId || !sessionId) {
              showResult('error', 'Missing session data. Please login first.');
              const warning = document.getElementById('session-warning');
              if (warning) warning.style.display = 'block';
              return;
          }

          if (!extractedViewState) {
              showResult('error', 'No viewstate available. Run Step 3 to capture the large state first.');
              return;
          }

          try {
              showResult('info', '[ASYNC] Running Step 4: Replaying large viewstate for validation...');

              const response = await fetch('/api/dashboard1/step4', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                      session_token: token,
                      user_id: parseInt(userId),
                      session_id: sessionId,
                      viewstate: extractedViewState
                  })
              });

              const data = await response.json();

              if (response.ok && data.success) {
                  showResult('success', '[OK] Step 4 completed. Large viewstate validated with signature + size checks.', data);
              } else {
              showResult('error', 'Step 4 failed: ' + (data.error || 'Unknown error'), data);
              }
          } catch (error) {
              showResult('error', 'Network error in Step 4: ' + error.message);
          }
      }

      async function runStep5() {
          const token = localStorage.getItem('session_token');
          const userId = localStorage.getItem('user_id');
          const sessionId = localStorage.getItem('session_id');

          if (!token || !userId || !sessionId) {
              showResult('error', 'Missing session data. Please login first.');
              const warning = document.getElementById('session-warning');
              if (warning) warning.style.display = 'block';
              return;
          }

          const { payload, size } = buildLargeTransactions();

          try {
              showResult('info', '[ASYNC] Running Step 5: Sending ' + size.toLocaleString() + ' bytes of JSON...');

              const response = await fetch('/api/dashboard1/step5', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                      session_token: token,
                      user_id: parseInt(userId),
                      session_id: sessionId,
                      transactions: payload,
                      meta: {
                          client_request_id: 'bulk_' + Date.now(),
                          approx_size: size
                      }
                  })
              });

              const data = await response.json();

              if (response.ok && data.success) {
                  extractedBatchId = data.batch_id;
                  extractedBatchCode = data.validation_code;
                  extractedPivotItemId = data.pivot_item_id;
                  extractedBatchTxCount = data.transactions_count;

                  const step6Button = document.getElementById('step6Button');
                  if (step6Button) {
                      step6Button.disabled = false;
                  }

                  showResult('success', '[OK] Step 5 completed. Batch + validation code captured.', {
                      batch_id: data.batch_id,
                      pivot_item_id: data.pivot_item_id,
                      validation_code_hint: data.validation_code.substring(0, 24) + '...',
                      transactions_count: data.transactions_count,
                      payload_bytes: data.payload_bytes
                  });
              } else {
                  extractedBatchId = null;
                  extractedBatchCode = null;
                  extractedPivotItemId = null;
                  extractedBatchTxCount = null;
                  const step6Button = document.getElementById('step6Button');
                  if (step6Button) step6Button.disabled = true;
                  showResult('error', 'Step 5 failed: ' + (data.error || 'Unknown error'), data);
              }
          } catch (error) {
              showResult('error', 'Network error in Step 5: ' + error.message);
          }
      }

      async function runStep6() {
          const token = localStorage.getItem('session_token');
          const userId = localStorage.getItem('user_id');
          const sessionId = localStorage.getItem('session_id');

          if (!token || !userId || !sessionId) {
              showResult('error', 'Missing session data. Please login first.');
              const warning = document.getElementById('session-warning');
              if (warning) warning.style.display = 'block';
              return;
          }

          if (!extractedBatchId || !extractedBatchCode || !extractedPivotItemId || !extractedBatchTxCount) {
              showResult('error', 'Missing batch data. Run Step 5 first to capture batch_id and validation_code.');
              return;
          }

          try {
              showResult('info', '[ASYNC] Running Step 6: Validating batch correlation...');

              const response = await fetch('/api/dashboard1/step6', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                      session_token: token,
                      user_id: parseInt(userId),
                      session_id: sessionId,
                      batch_id: extractedBatchId,
                      validation_code: extractedBatchCode,
                      pivot_item_id: extractedPivotItemId,
                      transactions_count: extractedBatchTxCount
                  })
              });

              const data = await response.json();

              if (response.ok && data.success) {
                  showResult('success', '[OK] Step 6 completed. Batch validation confirmed.', data);
              } else {
                  showResult('error', 'Step 6 failed: ' + (data.error || 'Unknown error'), data);
              }
          } catch (error) {
              showResult('error', 'Network error in Step 6: ' + error.message);
          }
      }

      function showResult(type, message, data = null) {
          const resultDiv = document.getElementById('test-results');
          const timestamp = new Date().toLocaleTimeString();

          let html = 
              '<div class="' + type + '">' +
                  '<strong>[' + timestamp + ']</strong> ' + message +
                  (data ? '<pre>' + JSON.stringify(data, null, 2) + '</pre>' : '') +
              '</div>';

          resultDiv.innerHTML = html + resultDiv.innerHTML;
      }
      <\/script>
  </body>
  </html>`;
}
__name(getDashboard1Page, "getDashboard1Page");
function getCheckoutPage() {
  return `<!DOCTYPE html>
<html>
<head>
    <title>Checkout - LoadMagic Test Demo</title>
    <style>
      ${BASE_STYLES}
      .form-group { margin: 15px 0; }
      .checkout-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 14px; }
    </style>
</head>
<body class="page">
    ${renderHeader("Checkout", "Dark-mode checkout with body-auth correlation")}
    <div class="content">
      <div id="user-status" class="card user-status">
          <p>Loading session status...</p>
      </div>
      
      <div class="checkout-grid">
        <div class="checkout-section">
            <h3>[PACKAGE] Mock Cart Items</h3>
            <div id="cart-summary">
                <p>\u2022 Laptop Pro - $1299.99</p>
                <p>\u2022 Wireless Mouse - $29.99</p>
                <hr>
                <p><strong>Total: $1329.98</strong></p>
            </div>
        </div>
        
        <div class="checkout-section">
            <h3>\u{1F4B3} Payment Information</h3>
            <div class="form-group">
                <label>Payment Method:</label>
                <select id="paymentMethod">
                    <option value="credit_card">Credit Card</option>
                    <option value="paypal">PayPal</option>
                    <option value="bank_transfer">Bank Transfer</option>
                </select>
            </div>
            <div class="form-group">
                <label>Card Number:</label>
                <input type="text" id="cardNumber" placeholder="1234 5678 9012 3456" maxlength="19">
            </div>
        </div>
        
        <div class="checkout-section">
            <h3>\u{1F4CD} Shipping Address</h3>
            <div class="form-group">
                <label>Full Name:</label>
                <input type="text" id="fullName" placeholder="John Doe">
            </div>
            <div class="form-group">
                <label>Address:</label>
                <textarea id="address" rows="3" placeholder="123 Main St
Anytown, ST 12345"></textarea>
            </div>
        </div>
      </div>
      
      <div class="correlation-info">
          <h4>[SYNC] Correlation Data (will be sent in request body):</h4>
          <div id="correlation-display">Loading correlation data...</div>
      </div>
      
      <div style="text-align: center; margin: 24px 0;">
          <button onclick="processCheckout()" id="checkoutBtn" disabled>Complete Checkout</button>
          <button onclick="goToCart()" style="background: #6c757d;">View Cart</button>
      </div>
      
      <div class="card" id="checkout-result"></div>
      
      <p><a href="/products">\u2190 Back to Products</a> | <a href="/">Home</a></p>
    </div>
    
    <script>
      window.onload = function() {
          checkLoginStatus();
          displayCorrelationData();
      };
      
      function checkLoginStatus() {
          const token = localStorage.getItem('session_token');
          const username = localStorage.getItem('username');
          
          if (token && username) {
              document.getElementById('user-status').innerHTML = 
                  '<div class="logged-in">' +
                      '<h3>[OK] Logged in as: ' + username + '</h3>' +
                      '<p>Ready for authenticated checkout with correlation data!</p>' +
                  '</div>';
              document.getElementById('checkoutBtn').disabled = false;
          } else {
              document.getElementById('user-status').innerHTML = 
                  '<div class="not-logged-in">' +
                      '<h3>[ERROR] Not logged in</h3>' +
                      '<p><a href="/login">Login required</a> to complete checkout with session correlation.</p>' +
                  '</div>';
          }
      }
      
      function displayCorrelationData() {
          const sessionToken = localStorage.getItem('session_token');
          const userId = localStorage.getItem('user_id');
          const correlationId = localStorage.getItem('correlation_id');
          const checkoutToken = localStorage.getItem('next_step_token') || 'checkout_' + Date.now();
          
          document.getElementById('correlation-display').innerHTML = 
              '<p><strong>Session Token:</strong> <code>' + (sessionToken ? sessionToken.substring(0, 20) + '...' : 'Not available') + '</code></p>' +
              '<p><strong>User ID:</strong> <code>' + (userId || 'Not available') + '</code></p>' +
              '<p><strong>Correlation ID:</strong> <code>' + (correlationId || 'Not available') + '</code></p>' +
              '<p><strong>Checkout Token:</strong> <code>' + checkoutToken + '</code></p>' +
              '<p><em>All of this data will be sent in the request body for correlation testing!</em></p>';
      }
      
      async function processCheckout() {
          const sessionToken = localStorage.getItem('session_token');
          const sessionId = localStorage.getItem('session_id');
          const csrfToken = localStorage.getItem('csrf_token');
          const userId = localStorage.getItem('user_id');
          const correlationId = localStorage.getItem('correlation_id');
          const checkoutToken = localStorage.getItem('next_step_token') || 'checkout_' + Date.now();

          if (!sessionToken || !sessionId || !csrfToken || !userId || !correlationId) {
              alert('[ERROR] Missing session data! Please login first to get all required tokens (session_token, session_id, csrf_token, correlation_id, user_id).');
              return;
          }

          const checkoutData = {
              session_token: sessionToken,           // Required in body!
              session_id: sessionId,                 // Required in body!
              csrf_token: csrfToken,                 // Required in body!
              user_id: parseInt(userId),             // Required in body!
              correlation_id: correlationId,         // Required in body!
              checkout_token: checkoutToken,         // Required in body!
              cart_items: [
                  { product_id: 1, quantity: 1, name: "Laptop Pro", price: 1299.99 },
                  { product_id: 2, quantity: 1, name: "Wireless Mouse", price: 29.99 }
              ],
              payment_method: document.getElementById('paymentMethod').value,
              billing_address: {
                  name: document.getElementById('fullName').value,
                  card_number: document.getElementById('cardNumber').value
              },
              shipping_address: {
                  name: document.getElementById('fullName').value,
                  address: document.getElementById('address').value
              },
              client_checkout_id: 'checkout_req_' + Date.now(),
              timestamp: new Date().toISOString()
          };
          
          try {
              const response = await fetch('/api/checkout/process', {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json'
                      // Note: NO Authorization header - all auth data is in the body!
                  },
                  body: JSON.stringify(checkoutData)
              });
              
              const result = await response.json();
              
              if (result.success) {
                  document.getElementById('checkout-result').innerHTML = 
                      '<div style="background: #d4edda; color: #155724; padding: 20px; border-radius: 5px; margin: 20px 0;">' +
                          '<h3>[SPARKLE] Checkout Successful!</h3>' +
                          '<p><strong>Order Token:</strong> ' + result.order_token + '</p>' +
                          '<p><strong>Confirmation Number:</strong> ' + result.confirmation_number + '</p>' +
                          '<p><strong>Transaction ID:</strong> ' + result.payment_confirmation.transaction_id + '</p>' +
                          '<p><strong>Tracking Number:</strong> ' + result.shipping_info.tracking_number + '</p>' +
                          '<p><strong>Total:</strong> $' + result.total + '</p>' +
                          '<hr>' +
                          '<h4>[OK] Correlation Data Validated:</h4>' +
                          '<p>Session Token: ' + result.correlation_validation.session_token_used + '</p>' +
                          '<p>User ID: ' + result.correlation_validation.user_id_confirmed + '</p>' +
                          '<p>Correlation ID: ' + result.correlation_validation.correlation_id_received + '</p>' +
                          '<p>Checkout Token: ' + result.correlation_validation.checkout_token_validated + '</p>' +
                      '</div>';
              } else {
                  document.getElementById('checkout-result').innerHTML = 
                      '<div style="background: #f8d7da; color: #721c24; padding: 15px; border-radius: 5px;">' +
                          '<h3>[ERROR] Checkout Failed</h3>' +
                          '<p><strong>Error:</strong> ' + result.error + '</p>' +
                          '<p><strong>Message:</strong> ' + result.message + '</p>' +
                      '</div>';
              }
          } catch (error) {
              document.getElementById('checkout-result').innerHTML = 
                  '<div style="background: #f8d7da; color: #721c24; padding: 15px; border-radius: 5px;">' +
                      '<h3>[ERROR] Network Error</h3>' +
                      '<p>' + error.message + '</p>' +
                  '</div>';
          }
      }
      
      function goToCart() {
          alert('Mock cart view - in real app this would show detailed cart contents');
      }
      <\/script>
  </body>
  </html>`;
}
__name(getCheckoutPage, "getCheckoutPage");
function getProductDetailPage(request) {
  const url = new URL(request.url);
  const productId = url.pathname.split("/").pop();
  return `<!DOCTYPE html>
<html>
<head>
    <title>Product Details - LoadMagic Test Demo</title>
    <style>
      ${BASE_STYLES}
      .product-detail { margin-top: 10px; }
      .price { color: var(--accent); font-weight: 700; font-size: 1.2em; }
      .stock-status { padding: 5px 10px; border-radius: 8px; color: white; font-weight: bold; }
      .in_stock { background: #22c55e; }
      .low_stock { background: #fbbf24; color: #0b1220; }
      .out_of_stock { background: #ef4444; }
      .loading { text-align: center; padding: 50px; }
    </style>
</head>
<body class="page">
    ${renderHeader("Product Details", "View catalog entries for correlation")}
    <div class="content">
      <h2>Product Details</h2>
      
      <div id="user-status" class="card user-status">
          <p>Loading user status...</p>
      </div>
      
      <div id="product-detail" class="loading card">Loading product ${productId}...</div>
      
      <div class="card" style="margin-top: 10px;">
          <a href="/products">\u2190 Back to Products</a> | 
          <a href="/">Home</a>
      </div>
    </div>
    
    <script>
      // Check login status on page load
      window.onload = function() {
          checkLoginStatus();
          loadProduct();
      };
      
      function checkLoginStatus() {
          const token = localStorage.getItem('session_token');
          const username = localStorage.getItem('username');
          
          if (token && username) {
              document.getElementById('user-status').innerHTML = 
                  '<div class="logged-in">' +
                      '<h3>[OK] Logged in as: ' + username + '</h3>' +
                      '<p>Session active - you can add items to cart!</p>' +
                      '<button onclick="logout()" style="background: #dc3545; color: white; padding: 5px 10px; border: none; border-radius: 3px; cursor: pointer; margin-right: 10px;">Logout</button>' +
                      '<a href="/dashboard" style="background: #28a745; color: white; padding: 5px 10px; text-decoration: none; border-radius: 3px;">Dashboard</a>' +
                  '</div>';
          } else {
              document.getElementById('user-status').innerHTML = 
                  '<div class="not-logged-in">' +
                      '<h3>[USER] Not logged in</h3>' +
                      '<p><a href="/login">Login</a> to add items to cart (session required for authenticated endpoints).</p>' +
                  '</div>';
          }
      }
      async function loadProduct() {
          try {
              const response = await fetch('/api/products/${productId}');
              const data = await response.json();
              
              if (!data.success) {
                  document.getElementById('product-detail').innerHTML = 
                      '<div style="color: red;">Error: ' + data.error + '</div>';
                  return;
              }
              
              const product = data.product;
              const stockClass = product.stock_status;
              const stockText = product.stock_status.replace('_', ' ').toUpperCase();
              
              document.getElementById('product-detail').innerHTML = 
                  '<div class="product-detail">' +
                      '<h3>' + product.name + '</h3>' +
                      '<p><strong>Category:</strong> ' + product.category + '</p>' +
                      '<p class="price">Price: $' + product.price + '</p>' +
                      '<p><strong>Discounted Price:</strong> <span style="color: #28a745;">$' + product.discounted_price.toFixed(2) + '</span></p>' +
                      '<p><strong>Stock:</strong> ' + product.stock + ' available</p>' +
                      '<p><span class="stock-status ' + stockClass + '">' + stockText + '</span></p>' +
                      '<p><strong>Product ID:</strong> ' + product.id + '</p>' +
                      '<p><strong>Last Updated:</strong> ' + new Date(product.last_updated).toLocaleString() + '</p>' +
                      '<div style="margin-top: 20px;">' +
                          '<button onclick="window.addToCart(' + product.id + ')">Add to Cart</button>' +
                          '<button onclick="checkSimilar('' + product.category + '')">View Similar Products</button>' +
                      '</div>' +
                  '</div>';
          } catch (error) {
              document.getElementById('product-detail').innerHTML = 
                  '<div style="color: red;">Error loading product: ' + error.message + '</div>';
          }
      }
      
      function checkSimilar(category) {
          window.location.href = '/products?category=' + encodeURIComponent(category);
      }
      
      function logout() {
          localStorage.removeItem('session_token');
          localStorage.removeItem('username');
          localStorage.removeItem('user_id');
          localStorage.removeItem('correlation_id');
          localStorage.removeItem('session_id');
          localStorage.removeItem('csrf_token');
          localStorage.removeItem('next_step_token');
          checkLoginStatus();
      }
      <\/script>
  </body>
  </html>`;
}
__name(getProductDetailPage, "getProductDetailPage");
function getProductsPage() {
  return `<!DOCTYPE html>
<html>
<head>
    <title>Products - LoadMagic Test Demo</title>
    <style>
      ${BASE_STYLES}
      .filters {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .product h4 {
        margin-top: 0;
      }
    </style>
</head>
<body class="page">
    ${renderHeader("Products", "Browse catalog entries for correlation")}
    <div class="content">
      <h2>Products Catalog</h2>
      
      <div id="user-status" class="card user-status">
          <p>Loading user status...</p>
      </div>
      
      <div class="filters card">
          <button onclick="loadProducts()">All Products</button>
          <button onclick="loadProducts('Electronics')">Electronics</button>
          <button onclick="loadProducts('Home')">Home</button>
          <button onclick="loadProducts('Sports')">Sports</button>
          <button onclick="loadProducts('Office')">Office</button>
      </div>
      
      <div id="products">Loading...</div>
      
      <p><a href="/">\u2190 Back to Home</a></p>
    </div>
    
    <script>
      // Global addToCart function used by all pages
      window.addToCart = function(productId) {
          // Get all session-related data from localStorage
          const token = localStorage.getItem('session_token');
          const sessionId = localStorage.getItem('session_id');
          const csrfToken = localStorage.getItem('csrf_token');
          const userId = localStorage.getItem('user_id');
          const correlationId = localStorage.getItem('correlation_id');

          console.log('Debug - Session data:', {
              token: token ? token.substring(0, 20) + '...' : 'missing',
              sessionId: sessionId ? sessionId.substring(0, 20) + '...' : 'missing',
              csrfToken: csrfToken ? csrfToken.substring(0, 20) + '...' : 'missing',
              userId: userId,
              correlationId: correlationId ? correlationId.substring(0, 20) + '...' : 'missing'
          });

          if (!token || !sessionId || !csrfToken || !userId || !correlationId) {
              alert('[ERROR] Missing session data! Please login first to get all required tokens.\\n\\nRequired: session_token, session_id, csrf_token, correlation_id, user_id');
              return;
          }

          // Make actual API call with ALL authentication data in the body
          const quantity = 1;
          const requestPayload = {
              product_id: productId,
              quantity: quantity,
              session_token: token,
              session_id: sessionId,
              csrf_token: csrfToken,
              user_id: parseInt(userId),
              correlation_id: correlationId,
              client_session_id: sessionId,
              client_request_id: 'req_' + Date.now(),
              timestamp: new Date().toISOString()
          };
          
          console.log('Sending cart add request with payload:', requestPayload);
          
          fetch('/api/cart/add', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify(requestPayload)
          })
          .then(response => {
              console.log('Cart add response status:', response.status);
              return response.json();
          })
          .then(data => {
              console.log('Cart add response data:', data);
              
              if (data.success) {
                  // Store next step token for future correlation
                  localStorage.setItem('next_step_token', data.next_step_token);
                  
                  alert('[OK] Body-Authenticated Success! Added ' + data.cart_item.product_name + ' to cart.\\n\\n[AUTH] Authentication Method: ALL DATA IN REQUEST BODY\\n[INFO] Session Token: ' + token.substring(0, 20) + '...\\n[ID] User ID: ' + userId + '\\n[SYNC] Correlation ID: ' + correlationId.substring(0, 20) + '...\\n\\n[PACKAGE] Cart Item ID: ' + data.cart_item.cart_item_id + '\\n[USER] User: ' + data.cart_item.username + '\\n[MONEY] Subtotal: $' + data.cart_item.subtotal + '\\n[TARGET] Next Step Token: ' + data.next_step_token + '\\n\\n[SPARKLE] This request used NO Authorization headers - all session/auth data was in the request body for advanced correlation testing!');
              } else {
                  alert('[ERROR] Error: ' + data.error + '\\n\\nMessage: ' + (data.message || 'Unknown error') + '\\n\\nMake sure you have all required fields: session_token, user_id, correlation_id');
              }
          })
          .catch(error => {
              console.error('Cart add error:', error);
              alert('[ERROR] Network Error: ' + error.message);
          });
      };
      
      // Check login status and load products on page load
      window.onload = function() {
          checkLoginStatus();
          loadProducts();
      };
      
      function checkLoginStatus() {
          const token = localStorage.getItem('session_token');
          const username = localStorage.getItem('username');
          
          if (token && username) {
              document.getElementById('user-status').innerHTML = 
                  '<div class="logged-in">' +
                      '<h3>[OK] Logged in as: ' + username + '</h3>' +
                      '<p>Session active - you can add items to cart!</p>' +
                      '<button onclick="logout()" style="background: #dc3545; color: white; padding: 5px 10px; border: none; border-radius: 3px; cursor: pointer; margin-right: 10px;">Logout</button>' +
                      '<a href="/dashboard" style="background: #28a745; color: white; padding: 5px 10px; text-decoration: none; border-radius: 3px;">Dashboard</a>' +
                  '</div>';
          } else {
              document.getElementById('user-status').innerHTML = 
                  '<div class="not-logged-in">' +
                      '<h3>[USER] Not logged in</h3>' +
                      '<p><a href="/login">Login</a> to add items to cart (session required for authenticated endpoints).</p>' +
                  '</div>';
          }
      }
      
      async function loadProducts(category = '') {
          try {
              const url = category ? '/api/products?category=' + category : '/api/products';
              const response = await fetch(url);
              const data = await response.json();
              
              let html = '<h3>Found ' + data.count + ' products:</h3>';
              data.products.forEach(product => {
                  html += '<div class="product">' +
                      '<h4><a href="/product/' + product.id + '" style="text-decoration: none; color: #0366d6;">' + product.name + '</a></h4>' +
                      '<p>Category: ' + product.category + '</p>' +
                      '<p class="price">$' + product.price + '</p>' +
                      '<p>Stock: ' + product.stock + ' available</p>' +
                      '<p><small>Product ID: ' + product.id + '</small></p>' +
                      '<button onclick="viewProduct(' + product.id + ')">View Details</button>' +
                      '<button onclick="window.addToCart(' + product.id + ')" style="background: #28a745; margin-left: 5px;">Add to Cart</button>' +
                  '</div>';
              });
              
              document.getElementById('products').innerHTML = html;
          } catch (error) {
              document.getElementById('products').innerHTML = 'Error loading products: ' + error.message;
          }
      }
      
      function viewProduct(productId) {
          window.location.href = '/product/' + productId;
      }
      
      function logout() {
          localStorage.removeItem('session_token');
          localStorage.removeItem('username');
          localStorage.removeItem('user_id');
          localStorage.removeItem('correlation_id');
          localStorage.removeItem('session_id');
          localStorage.removeItem('csrf_token');
          localStorage.removeItem('next_step_token');
          checkLoginStatus();
      }
      
      <\/script>
  </body>
  </html>`;
}
__name(getProductsPage, "getProductsPage");
export {
  index_default as default
};
//# sourceMappingURL=index.js.map
