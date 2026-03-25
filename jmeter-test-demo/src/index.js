export default {
    async fetch(request, env, ctx) {
      const url = new URL(request.url);
      const path = url.pathname;
      const method = request.method;
  
	      // CORS headers for all responses
	      const corsHeaders = {
	        'Access-Control-Allow-Origin': '*',
	        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
	        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-TOKEN, X-FlowA-CSRF, X-Admin-SessionId, X-HTML-CSRF, X-SWEC-Counter, X-Delivery-Quote',
	        'Access-Control-Expose-Headers': 'X-Session-Token, X-Session-Id, X-CSRF-Token, X-Correlation-Id, X-User-Id, X-ShortID, X-FinalID, X-Timestamp, X-CSRF-TOKEN, X-FlowA-CSRF, X-Admin-SessionId, X-Visitor-Id, X-Journey-Id, X-Auth-Level, X-Customer-Context, X-Basket-Id, X-Basket-Version, X-Checkout-Flow-Id, X-Flow-Recovered, X-Delivery-Quote, X-Payment-Nonce, X-Pricing-Sig, X-SWEC-Counter',
	      };
  
      // Handle OPTIONS requests for CORS
      if (method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
      }
  
      try {
        // Private access gate (cookie-based; avoids Authorization headers that often get redacted in HAR exports)
        if (path === '/__access' || path === '/__access/') {
          return await handleAccessGate(request, env, corsHeaders);
        }

        const accessGateResponse = await enforceSiteAccess(request, env, corsHeaders);
        if (accessGateResponse) {
          return accessGateResponse;
        }

        // Routes
        switch (true) {
          case path === '/' && method === 'GET':
            return new Response(getHomePage(), { 
              headers: { ...corsHeaders, 'Content-Type': 'text/html' } 
            });
  
          case path === '/login' && method === 'GET':
            return new Response(getLoginPage(), { 
              headers: { ...corsHeaders, 'Content-Type': 'text/html' } 
            });
  
          case path === '/products' && method === 'GET':
            return new Response(getProductsPage(), { 
              headers: { ...corsHeaders, 'Content-Type': 'text/html' } 
            });
  
          case path.startsWith('/product/') && method === 'GET':
            return new Response(getProductDetailPage(request), { 
              headers: { ...corsHeaders, 'Content-Type': 'text/html' } 
            });
  
          case path === '/dashboard' && method === 'GET':
            return new Response(getDashboardPage(), {
              headers: { ...corsHeaders, 'Content-Type': 'text/html' }
            });

          case path === '/dashboard1' && method === 'GET':
            return new Response(getDashboard1Page(), {
              headers: { ...corsHeaders, 'Content-Type': 'text/html' }
            });

          case path === '/api/login' && method === 'POST':
            return await handleLogin(request, env, corsHeaders);
  
          case path === '/api/products' && method === 'GET':
            return await handleGetProducts(request, env, corsHeaders);
  
          case path.startsWith('/api/products/') && method === 'GET':
            return await handleGetSingleProduct(request, env, corsHeaders);
  
          case path === '/api/user/profile' && method === 'POST':
            return await handleGetProfile(request, env, corsHeaders);
  
          case path === '/api/orders' && method === 'POST':
            return await handleCreateOrder(request, env, corsHeaders);
  
          case path === '/checkout' && method === 'GET':
            return new Response(getCheckoutPage(), { 
              headers: { ...corsHeaders, 'Content-Type': 'text/html' } 
            });
  
          case path === '/api/checkout/process' && method === 'POST':
            return await handleProcessCheckout(request, env, corsHeaders);
  
          case path === '/api/cart/add' && method === 'POST':
            return await handleAddToCart(request, env, corsHeaders);
  
          case path === '/api/cart' && method === 'GET':
            return await handleGetCart(request, env, corsHeaders);
  
          case path.startsWith('/api/orders/') && method === 'GET':
            return await handleGetOrder(request, env, corsHeaders);

          case path === '/api/http-test' && method === 'POST':
            return await handleHttpTest(request, env, corsHeaders);

          case path === '/api/http-test-step2' && method === 'POST':
            return await handleHttpTestStep2(request, env, corsHeaders);

          case path === '/api/dashboard1/step1' && method === 'POST':
            return await handleDashboard1Step1(request, env, corsHeaders);

          case path === '/api/dashboard1/step2' && method === 'POST':
            return await handleDashboard1Step2(request, env, corsHeaders);

          case path === '/api/dashboard1/step3' && method === 'POST':
            return await handleDashboard1Step3(request, env, corsHeaders);

          case path === '/api/dashboard1/step4' && method === 'POST':
            return await handleDashboard1Step4(request, env, corsHeaders);

          case path === '/api/dashboard1/step5' && method === 'POST':
            return await handleDashboard1Step5(request, env, corsHeaders);

	          case path === '/api/dashboard1/step6' && method === 'POST':
	            return await handleDashboard1Step6(request, env, corsHeaders);

	          case path === '/api/dashboard1/step7' && method === 'POST':
	            return await handleDashboard1Step7(request, env, corsHeaders);

	          case path === '/api/dashboard1/step8' && method === 'POST':
	            return await handleDashboard1Step8(request, env, corsHeaders);

	          case path === '/api/dashboard1/step9' && method === 'POST':
	            return await handleDashboard1Step9(request, env, corsHeaders);

	          case path === '/api/dashboard1/step10' && method === 'POST':
	            return await handleDashboard1Step10(request, env, corsHeaders);

	          case path === '/api/dashboard1/step11' && method === 'POST':
	            return await handleDashboard1Step11(request, env, corsHeaders);

	          case path === '/api/dashboard1/step12' && method === 'POST':
	            return await handleDashboard1Step12(request, env, corsHeaders);

          // Nasty Flow routes
          case path === '/nasty' && method === 'GET':
            return new Response(getNastyFlowPage(), {
              headers: { ...corsHeaders, 'Content-Type': 'text/html' }
            });

          case path === '/api/nasty/init' && method === 'POST':
            return await handleNastyInit(request, env, corsHeaders);

          case path === '/api/nasty/home' && method === 'POST':
            return await handleNastyHome(request, env, corsHeaders);

          case path === '/api/nasty/login-page' && method === 'POST':
            return await handleNastyLoginPage(request, env, corsHeaders);

          case path === '/api/nasty/login-submit' && method === 'POST':
            return await handleNastyLoginSubmit(request, env, corsHeaders);

          case path === '/api/nasty/account-summary' && method === 'POST':
            return await handleNastyAccountSummary(request, env, corsHeaders);

          case path === '/api/nasty/product' && method === 'POST':
            return await handleNastyProduct(request, env, corsHeaders);

          case path === '/api/nasty/basket-add' && method === 'POST':
            return await handleNastyBasketAdd(request, env, corsHeaders);

          case path === '/api/nasty/basket' && method === 'POST':
            return await handleNastyBasket(request, env, corsHeaders);

          case path === '/api/nasty/checkout-start' && method === 'POST':
            return await handleNastyCheckoutStart(request, env, corsHeaders);

          case path === '/api/nasty/delivery-options' && method === 'POST':
            return await handleNastyDeliveryOptions(request, env, corsHeaders);

          case path === '/api/nasty/payment' && method === 'POST':
            return await handleNastyPayment(request, env, corsHeaders);

          case path === '/api/nasty/confirm-order' && method === 'POST':
            return await handleNastyConfirmOrder(request, env, corsHeaders);

	          case path === '/favicon.ico' && method === 'GET':
	            if (!env.ASSETS) {
	              return new Response('Static assets not configured', { status: 500, headers: corsHeaders });
	            }
            return await env.ASSETS.fetch(new Request(new URL('/images/favicon.png', request.url), request));

          case path.startsWith('/images/') && method === 'GET':
            if (!env.ASSETS) {
              return new Response('Static assets not configured', { status: 500, headers: corsHeaders });
            }
            return await env.ASSETS.fetch(new Request(new URL(path, request.url), request));

          case path.startsWith('/static/') && method === 'GET':
            if (!env.ASSETS) {
              return new Response('Static assets not configured', { status: 500, headers: corsHeaders });
            }
            // Strip the /static prefix to match asset root
            const assetUrl = new URL(request.url);
            assetUrl.pathname = path.replace(/^\/static/, '');
            return await env.ASSETS.fetch(new Request(assetUrl, request));

          default:
            return new Response('Not Found', { 
              status: 404, 
              headers: corsHeaders 
            });
        }
      } catch (error) {
        console.error('Worker error:', error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    },
  };
  
  // API Handlers
  async function handleLogin(request, env, corsHeaders) {
    try {
      const body = await request.json();
      const { username, password } = body;
  
      if (!username || !password) {
        return new Response(JSON.stringify({ error: 'Username and password required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
  
      // Check if database is available
      if (!env.DB) {
        return new Response(JSON.stringify({ 
          error: 'Database not available',
          debug: 'env.DB is undefined - check wrangler.toml binding' 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
  
      // Query database for user
      const result = await env.DB.prepare(
        'SELECT id, username, email FROM users WHERE username = ? AND password_hash = ?'
      ).bind(username, `hash${password}`).first();
  
      if (!result) {
        return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
  
      // Generate all required tokens for correlation testing
      const sessionToken = generateToken();
      const sessionId = `sess_${result.id}_${Date.now()}`;
      const csrfToken = generateToken();
      const correlationId = generateToken();

      // Update user with all session tokens for validation
      await env.DB.prepare(
        'UPDATE users SET session_token = ?, session_id = ?, csrf_token = ?, correlation_id = ? WHERE id = ?'
      ).bind(sessionToken, sessionId, csrfToken, correlationId, result.id).run();

      return new Response(JSON.stringify({
        success: true,
        user_id: result.id,
        username: result.username,
        email: result.email,
        session_token: sessionToken,
        session_id: sessionId, // Additional session ID for payload correlation
        csrf_token: csrfToken, // CSRF token for payload correlation
        expires_in: 3600,
        server_timestamp: new Date().toISOString(),
        correlation_id: correlationId // Correlation ID that should be sent back in requests
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Set-Cookie': `session_id=${sessionId}; Path=/; HttpOnly; SameSite=Lax`,
          // Add tokens to headers for correlation (in case body isn't captured)
          'X-Session-Token': sessionToken,
          'X-Session-Id': sessionId,
          'X-CSRF-Token': csrfToken,
          'X-Correlation-Id': correlationId,
          'X-User-Id': result.id.toString()
        }
      });
    } catch (error) {
      console.error('Error in handleLogin:', error);
      return new Response(JSON.stringify({ 
        error: error.message,
        debug: {
          stack: error.stack,
          dbAvailable: !!env.DB
        }
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
  
  async function handleGetProducts(request, env, corsHeaders) {
    try {
      const url = new URL(request.url);
      const category = url.searchParams.get('category');
      
      // Check if database is available
      if (!env.DB) {
        return new Response(JSON.stringify({ 
          error: 'Database not available',
          debug: 'env.DB is undefined - check wrangler.toml binding' 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      let query = 'SELECT * FROM products';
      let params = [];
      
      if (category) {
        query += ' WHERE category = ?';
        params.push(category);
      }
      
      console.log('Executing query:', query, 'with params:', params);
      const result = await env.DB.prepare(query).bind(...params).all();
      console.log('Query result:', result);
      
      return new Response(JSON.stringify({
        products: result.results || [],
        count: (result.results || []).length,
        debug: {
          query: query,
          params: params,
          resultMeta: result.meta
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error in handleGetProducts:', error);
      return new Response(JSON.stringify({ 
        error: error.message,
        debug: {
          stack: error.stack,
          dbAvailable: !!env.DB
        }
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
  
  async function handleGetSingleProduct(request, env, corsHeaders) {
    try {
      const url = new URL(request.url);
      const productId = url.pathname.split('/').pop();
      
      // Check if database is available
      if (!env.DB) {
        return new Response(JSON.stringify({ 
          error: 'Database not available',
          debug: 'env.DB is undefined - check wrangler.toml binding' 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // Validate product ID
      if (!productId || isNaN(productId)) {
        return new Response(JSON.stringify({ 
          error: 'Invalid product ID',
          debug: 'Product ID must be a number'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      console.log('Fetching product with ID:', productId);
      const result = await env.DB.prepare(
        'SELECT * FROM products WHERE id = ?'
      ).bind(productId).first();
      
      if (!result) {
        return new Response(JSON.stringify({ 
          error: 'Product not found',
          product_id: productId
        }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // Add some additional computed fields for richer data
      const productDetails = {
        ...result,
        in_stock: result.stock > 0,
        stock_status: result.stock > 50 ? 'in_stock' : result.stock > 0 ? 'low_stock' : 'out_of_stock',
        discounted_price: result.price * 0.9, // 10% discount simulation
        related_products: [], // Could be populated with a related products query
        last_updated: new Date().toISOString()
      };
      
      return new Response(JSON.stringify({
        success: true,
        product: productDetails
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error in handleGetSingleProduct:', error);
      return new Response(JSON.stringify({ 
        error: error.message,
        debug: {
          stack: error.stack,
          dbAvailable: !!env.DB
        }
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
  
  async function handleGetProfile(request, env, corsHeaders) {
    try {
      const body = await request.json();
      const { session_token, user_id, correlation_id, session_id, csrf_token } = body;

      // Require ALL session data in request body for correlation testing
      if (!session_token || !user_id || !correlation_id || !session_id || !csrf_token) {
        return new Response(JSON.stringify({
          error: 'Missing required fields',
          required: ['session_token', 'user_id', 'correlation_id', 'session_id', 'csrf_token'],
          message: 'All session data must be provided in request body for correlation testing'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Validate ALL session tokens from request body
      const user = await env.DB.prepare(
        'SELECT id, username, email FROM users WHERE session_token = ? AND id = ? AND session_id = ? AND csrf_token = ? AND correlation_id = ?'
      ).bind(session_token, user_id, session_id, csrf_token, correlation_id).first();

      if (!user) {
        return new Response(JSON.stringify({
          error: 'Invalid session data',
          message: 'One or more session tokens are invalid or mismatched (session_token, user_id, session_id, csrf_token, or correlation_id)'
        }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
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
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 3600000).toISOString()
        },
        profile_data: {
          last_login: new Date().toISOString(),
          account_type: user.username.includes('admin') ? 'admin' : 'standard',
          preferences: {
            theme: 'default',
            notifications: true,
            next_correlation_key: generateToken() // Key for next request
          }
        },
        server_metadata: {
          request_id: generateToken(),
          server_time: new Date().toISOString(),
          api_version: "v1.2.3"
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({ 
        error: 'Invalid request format',
        message: 'Request body must contain session_token, user_id, and correlation_id'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
  
  async function handleAddToCart(request, env, corsHeaders) {
    try {
      const body = await request.json();
      const { product_id, quantity = 1, session_token, user_id, correlation_id, session_id, csrf_token, client_session_id } = body;

      // Require ALL session data in request body for correlation testing
      if (!session_token || !user_id || !correlation_id || !session_id || !csrf_token) {
        return new Response(JSON.stringify({
          error: 'Missing required session fields in request body',
          required: ['session_token', 'user_id', 'correlation_id', 'session_id', 'csrf_token'],
          message: 'All session data must be provided in request body for correlation testing',
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
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
  
      if (!product_id) {
        return new Response(JSON.stringify({ error: 'Product ID is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
  
      // Check if database is available
      if (!env.DB) {
        return new Response(JSON.stringify({ 
          error: 'Database not available',
          debug: 'env.DB is undefined - check wrangler.toml binding' 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
  
      // Validate ALL session tokens from request body
      const user = await env.DB.prepare(
        'SELECT id, username FROM users WHERE session_token = ? AND id = ? AND session_id = ? AND csrf_token = ? AND correlation_id = ?'
      ).bind(session_token, user_id, session_id, csrf_token, correlation_id).first();

      if (!user) {
        return new Response(JSON.stringify({
          error: 'Invalid session data in request body',
          message: 'One or more session tokens are invalid or mismatched (session_token, user_id, session_id, csrf_token, or correlation_id)'
        }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
  
      if (!product_id) {
        return new Response(JSON.stringify({ error: 'Product ID is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
  
      // Check if database is available
      if (!env.DB) {
        return new Response(JSON.stringify({ 
          error: 'Database not available',
          debug: 'env.DB is undefined - check wrangler.toml binding' 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
  
      // Get product details
      const product = await env.DB.prepare(
        'SELECT * FROM products WHERE id = ?'
      ).bind(product_id).first();
  
      if (!product) {
        return new Response(JSON.stringify({ error: 'Product not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
  
      // Check stock availability
      if (product.stock < quantity) {
        return new Response(JSON.stringify({ 
          error: 'Insufficient stock',
          available_stock: product.stock,
          requested_quantity: quantity
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
  
      // Generate cart item ID for correlation testing
      const cartItemId = generateToken();
      const subtotal = product.price * quantity;
      const requestId = generateToken();

      // Simulate adding to cart (in real app, this would store in cart table/session)
      const cartItem = {
        cart_item_id: cartItemId,
        product_id: product.id,
        product_name: product.name,
        price: product.price,
        quantity: quantity,
        subtotal: subtotal,
        added_at: new Date().toISOString(),
        user_id: user.id,
        username: user.username,
        session_reference: session_token.substring(0, 16) + "...", // Partial session token in payload
        correlation_tracking: {
          request_id: requestId,
          client_correlation_id: correlation_id,
          client_session_id: client_session_id || null,
          server_correlation_id: generateToken()
        }
      };
  
      return new Response(JSON.stringify({
        success: true,
        message: 'Product added to cart successfully',
        cart_item: cartItem,
        total_items_in_cart: Math.floor(Math.random() * 5) + 1, // Mock cart count
        cart_total: subtotal + (Math.random() * 100), // Mock cart total
        next_step_token: generateToken(), // Token for next step correlation
        server_context: {
          processing_time: Math.floor(Math.random() * 100) + 50 + "ms",
          server_id: "srv-" + Math.random().toString(36).substr(2, 6),
          timestamp: new Date().toISOString()
        }
      }), {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-Request-ID': requestId, // Custom header for correlation
          'X-Session-Hint': session_token.substring(0, 12) // Partial session in header too
        }
      });
    } catch (error) {
      console.error('Error in handleAddToCart:', error);
      return new Response(JSON.stringify({ 
        error: error.message,
        debug: {
          stack: error.stack,
          dbAvailable: !!env.DB
        }
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
  
  async function handleGetCart(request, env, corsHeaders) {
    // Check for authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ 
        error: 'Authentication required',
        message: 'Please login to view cart' 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  
    const token = authHeader.substring(7);
    
    // Validate session token and get user
    const user = await env.DB.prepare(
      'SELECT id, username FROM users WHERE session_token = ?'
    ).bind(token).first();
  
    if (!user) {
      return new Response(JSON.stringify({ 
        error: 'Invalid or expired session token',
        message: 'Please login again' 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  
    // Mock cart data for correlation testing
    const mockCartItems = [
      {
        cart_item_id: 'cart_' + Date.now() + '_1',
        product_id: 1,
        product_name: 'Laptop Pro',
        price: 1299.99,
        quantity: 1,
        subtotal: 1299.99
      },
      {
        cart_item_id: 'cart_' + Date.now() + '_2',
        product_id: 2,
        product_name: 'Wireless Mouse',
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
      checkout_token: generateToken() // For checkout correlation
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  
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

      // Require all correlation data in request body
      if (!session_token || !user_id || !correlation_id || !session_id || !csrf_token || !checkout_token) {
        return new Response(JSON.stringify({
          error: 'Missing required checkout fields in request body',
          required: ['session_token', 'user_id', 'correlation_id', 'session_id', 'csrf_token', 'checkout_token'],
          message: 'All session and checkout data must be provided in request body'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Validate ALL session tokens
      const user = await env.DB.prepare(
        'SELECT id, username FROM users WHERE session_token = ? AND id = ? AND session_id = ? AND csrf_token = ? AND correlation_id = ?'
      ).bind(session_token, user_id, session_id, csrf_token, correlation_id).first();

      if (!user) {
        return new Response(JSON.stringify({
          error: 'Invalid session data in checkout request body',
          message: 'One or more session tokens are invalid or mismatched'
        }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
  
      // Process checkout (mock)
      const total = (cart_items?.length || 2) * 75.00;
      const orderToken = generateToken();
      const confirmationNumber = "CNF" + Date.now().toString().slice(-8);
      const transactionId = generateToken();
  
      // Create order
      const result = await env.DB.prepare(
        'INSERT INTO orders (user_id, order_token, total, status) VALUES (?, ?, ?, ?)'
      ).bind(user.id, orderToken, total, 'confirmed').run();
  
      return new Response(JSON.stringify({
        success: true,
        message: 'Checkout completed successfully',
        order_id: result.meta.last_row_id,
        order_token: orderToken,
        confirmation_number: confirmationNumber,
        total: total,
        status: 'confirmed',
        payment_confirmation: {
          transaction_id: transactionId,
          payment_method: payment_method,
          authorization_code: "AUTH" + Math.random().toString().slice(-6),
          processed_at: new Date().toISOString()
        },
        shipping_info: {
          tracking_number: `TRK${result.meta.last_row_id.toString().padStart(8, '0')}`,
          estimated_delivery: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]
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
          'Content-Type': 'application/json',
          'X-Transaction-ID': transactionId,
          'X-Order-Confirmation': confirmationNumber
        }
      });
    } catch (error) {
      console.error('Error in handleProcessCheckout:', error);
      return new Response(JSON.stringify({ 
        error: 'Invalid checkout request format',
        message: 'Request body must contain all required session and checkout data'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
  
  async function handleCreateOrder(request, env, corsHeaders) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Authorization token required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  
    const token = authHeader.substring(7);
    const body = await request.json();
    const { product_ids, quantities, client_request_id, checkout_token, payment_method = "credit_card" } = body;
  
    // Validate session token and get user
    const user = await env.DB.prepare(
      'SELECT id FROM users WHERE session_token = ?'
    ).bind(token).first();
  
    if (!user) {
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  
    // Calculate total (simplified)
    const total = (product_ids?.length || 1) * 50.00; // Mock calculation
    const orderToken = generateToken();
    const confirmationNumber = "CNF" + Date.now().toString().slice(-8);
  
    // Create order
    const result = await env.DB.prepare(
      'INSERT INTO orders (user_id, order_token, total, status) VALUES (?, ?, ?, ?)'
    ).bind(user.id, orderToken, total, 'pending').run();
  
    return new Response(JSON.stringify({
      success: true,
      order_id: result.meta.last_row_id,
      order_token: orderToken,
      confirmation_number: confirmationNumber,
      total: total,
      status: 'pending',
      estimated_delivery: '3-5 business days',
      payment_info: {
        method: payment_method,
        transaction_id: generateToken(),
        authorization_code: "AUTH" + Math.random().toString().slice(-6)
      },
      shipping_info: {
        tracking_number: `TRK${result.meta.last_row_id.toString().padStart(8, '0')}`,
        estimated_ship_date: new Date(Date.now() + 86400000).toISOString().split('T')[0] // Tomorrow
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
        'Content-Type': 'application/json',
        'X-Order-ID': orderToken,
        'X-Confirmation': confirmationNumber
      }
    });
  }
  
  async function handleGetOrder(request, env, corsHeaders) {
    const url = new URL(request.url);
    const orderToken = url.pathname.split('/').pop();
  
    const order = await env.DB.prepare(
      'SELECT o.*, u.username FROM orders o JOIN users u ON o.user_id = u.id WHERE o.order_token = ?'
    ).bind(orderToken).first();
  
    if (!order) {
      return new Response(JSON.stringify({ error: 'Order not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  
    return new Response(JSON.stringify({
      order_id: order.id,
      order_token: order.order_token,
      username: order.username,
      total: order.total,
      status: order.status,
      created_at: order.created_at,
      tracking_number: `TRK${order.id.toString().padStart(8, '0')}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  
  async function handleHttpTest(request, env, corsHeaders) {
    try {
      const body = await request.json();
      const { session_token, user_id, correlation_id, session_id, csrf_token, test_message } = body;

      // Require ALL session data in request body for correlation testing
      if (!session_token || !user_id || !correlation_id || !session_id || !csrf_token) {
        return new Response('HTTP 400 - Missing required session fields in request body\n\nRequired: session_token, user_id, correlation_id, session_id, csrf_token\n\nExample:\n{\n  "session_token": "tok_...",\n  "user_id": 1,\n  "correlation_id": "tok_...",\n  "session_id": "sess_...",\n  "csrf_token": "tok_...",\n  "test_message": "Hello from LoadMagic!"\n}', {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
        });
      }

      // Check if database is available
      if (!env.DB) {
        return new Response('HTTP 500 - Database not available\n\nenv.DB is undefined - check wrangler.toml binding', {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
        });
      }

      // Validate ALL session tokens from request body
      const user = await env.DB.prepare(
        'SELECT id, username FROM users WHERE session_token = ? AND id = ? AND session_id = ? AND csrf_token = ? AND correlation_id = ?'
      ).bind(session_token, user_id, session_id, csrf_token, correlation_id).first();

      if (!user) {
        return new Response('HTTP 401 - Invalid session data in request body\n\nOne or more session tokens are invalid or mismatched (session_token, user_id, session_id, csrf_token, or correlation_id)', {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
        });
      }

      // Generate test response data
      const testId = generateToken();
      const step2Token = generateToken();
      const timestamp = new Date().toISOString();
      const serverId = "srv-" + Math.random().toString(36).substr(2, 6);

      // Store the step2Token in the database for validation in Step 2
      await env.DB.prepare(
        'UPDATE users SET http_test_step2_token = ?, http_test_step2_token_timestamp = ? WHERE id = ?'
      ).bind(step2Token, timestamp, user.id).run();

      // Return simple HTTP response (not JSON) - perfect for testing
      const responseText = `HTTP 200 - HTTP Test Step 1 Successful!

[AUTH] Authentication Method: Request Body Session Data
[INFO] Session Token: ${session_token.substring(0, 20)}...
[ID] User ID: ${user_id}
[SYNC] Correlation ID: ${correlation_id.substring(0, 20)}...
[USER] Username: ${user.username}

🧪 Step 1 Test Details:
• Test ID: ${testId}
• Server ID: ${serverId}
• Timestamp: ${timestamp}
• Test Message: ${test_message || 'No message provided'}

[OK] Session Validation: PASSED
[OK] Database Connection: ACTIVE
[OK] User Authentication: CONFIRMED

[TARGET] STEP 2 REQUIRED - Capture the Step 2 Token below!
🔑 STEP 2 TOKEN: ${step2Token}

📝 Response Format: Plain HTTP (not JSON)
🔗 Perfect for testing HTTP response parsing

⚠️  IMPORTANT FOR CORRELATION:
• Extract the "STEP 2 TOKEN" from this response
• Use it in the next request to /api/http-test-step2
• Step 2 will FAIL without this token!

Next Steps:
• Extract STEP 2 TOKEN: ${step2Token}
• Send it to /api/http-test-step2 endpoint
• Test multi-step correlation`;

      return new Response(responseText, {
        status: 200,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'text/plain',
          'X-Test-ID': testId,
          'X-Step2-Token': step2Token,
          'X-Session-Hint': session_token.substring(0, 12),
          'X-User-ID': user_id.toString(),
          'X-Correlation-ID': correlation_id.substring(0, 12),
          'X-Server-ID': serverId,
          'X-Timestamp': timestamp
        }
      });
    } catch (error) {
      console.error('Error in handleHttpTest:', error);
      return new Response(`HTTP 500 - Internal Server Error\n\nError: ${error.message}\n\nThis endpoint requires session data in request body for correlation testing.`, {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
      });
    }
  }

  async function handleHttpTestStep2(request, env, corsHeaders) {
    try {
      const body = await request.json();
      const { session_token, user_id, correlation_id, session_id, csrf_token, step2_token, test_message } = body;

      // Require ALL session data AND step2_token from step 1
      if (!session_token || !user_id || !correlation_id || !session_id || !csrf_token || !step2_token) {
        return new Response('HTTP 400 - Missing required fields for Step 2\n\nRequired: session_token, user_id, correlation_id, session_id, csrf_token, step2_token\n\n⚠️  step2_token MUST be extracted from Step 1 response!\n\nExample:\n{\n  "session_token": "tok_...",\n  "user_id": 1,\n  "correlation_id": "tok_...",\n  "session_id": "sess_...",\n  "csrf_token": "tok_...",\n  "step2_token": "tok_...",\n  "test_message": "Step 2 from LoadMagic!"\n}', {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
        });
      }

      // Check if database is available
      if (!env.DB) {
        return new Response('HTTP 500 - Database not available\n\nenv.DB is undefined - check wrangler.toml binding', {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
        });
      }

      // Validate ALL session tokens from request body and retrieve stored step2_token
      const user = await env.DB.prepare(
        'SELECT id, username, http_test_step2_token FROM users WHERE session_token = ? AND id = ? AND session_id = ? AND csrf_token = ? AND correlation_id = ?'
      ).bind(session_token, user_id, session_id, csrf_token, correlation_id).first();

      if (!user) {
        return new Response('HTTP 401 - Invalid session data in request body\n\nOne or more session tokens are invalid or mismatched (session_token, user_id, session_id, csrf_token, or correlation_id)', {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
        });
      }

      // CRITICAL: Validate that the step2_token matches the one stored in Step 1
      if (!user.http_test_step2_token) {
        return new Response('HTTP 400 - Correlation FAILED: No step2_token found\n\n⚠️  You must call /api/http-test (Step 1) first to generate a step2_token!\n\n[ERROR] Correlation Test: FAILED\n[ERROR] Reason: Missing Step 1 execution\n\nPlease run Step 1 first to generate the required step2_token.', {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
        });
      }

      if (user.http_test_step2_token !== step2_token) {
        return new Response(`HTTP 400 - Correlation FAILED: step2_token mismatch\n\n⚠️  The step2_token you provided does not match the one generated in Step 1!\n\n[ERROR] Correlation Test: FAILED\n[ERROR] Expected: ${user.http_test_step2_token.substring(0, 20)}...\n[ERROR] Received: ${step2_token.substring(0, 20)}...\n\nThis means your correlation extractor is not working correctly.\n\nPlease check:\n1. Did you extract the step2_token from Step 1 response?\n2. Is your Regular Expression Extractor configured correctly?\n3. Are you using the correct variable name in Step 2 request?`, {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/plain',
            'X-Correlation-Status': 'FAILED',
            'X-Expected-Token': user.http_test_step2_token.substring(0, 20),
            'X-Received-Token': step2_token.substring(0, 20)
          }
        });
      }

      // Clear the stored step2_token after successful validation (prevents reuse)
      await env.DB.prepare(
        'UPDATE users SET http_test_step2_token = NULL, http_test_step2_token_timestamp = NULL WHERE id = ?'
      ).bind(user.id).run();

      // Generate step 2 response data
      const step2Id = generateToken();
      const finalToken = generateToken();
      const timestamp = new Date().toISOString();
      const serverId = "srv-" + Math.random().toString(36).substr(2, 6);

      // Return step 2 HTTP response
      const responseText = `HTTP 200 - HTTP Test Step 2 Successful!

[AUTH] Authentication Method: Request Body Session Data + Step 2 Token
[INFO] Session Token: ${session_token.substring(0, 20)}...
[ID] User ID: ${user_id}
[SYNC] Correlation ID: ${correlation_id.substring(0, 20)}...
🔑 Step 2 Token: ${step2_token.substring(0, 20)}...
[USER] Username: ${user.username}

🧪 Step 2 Test Details:
• Step 2 ID: ${step2Id}
• Server ID: ${serverId}
• Timestamp: ${timestamp}
• Test Message: ${test_message || 'No message provided'}

[OK] Session Validation: PASSED
[OK] Step 2 Token Validation: PASSED
[OK] Database Connection: ACTIVE
[OK] User Authentication: CONFIRMED
[OK] Multi-Step Correlation: SUCCESSFUL

🎉 MULTI-STEP CORRELATION COMPLETE!
🏆 FINAL SUCCESS TOKEN: ${finalToken}

📝 Response Format: Plain HTTP (not JSON)
🔗 Perfect for testing multi-step correlation

[OK] Correlation Test Results:
• Step 1: Session authentication ✓
• Step 2: Token extraction ✓
• Step 2: Token validation ✓
• Multi-step flow: COMPLETE ✓

[TARGET] This demonstrates successful multi-step correlation testing!
📊 Both steps required session data in request body
🔗 Step 2 required token extracted from Step 1 response

Congratulations! Your correlation is working perfectly!`;

      return new Response(responseText, {
        status: 200,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'text/plain',
          'X-Step2-ID': step2Id,
          'X-Final-Token': finalToken,
          'X-Step2-Token-Received': step2_token.substring(0, 12),
          'X-Session-Hint': session_token.substring(0, 12),
          'X-User-ID': user_id.toString(),
          'X-Correlation-ID': correlation_id.substring(0, 12),
          'X-Server-ID': serverId,
          'X-Timestamp': timestamp
        }
      });
    } catch (error) {
      console.error('Error in handleHttpTestStep2:', error);
      return new Response(`HTTP 500 - Internal Server Error\n\nError: ${error.message}\n\nThis endpoint requires session data AND step2_token in request body for multi-step correlation testing.`, {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
      });
    }
  }

  // Dashboard1 API Handlers - Short value correlation testing
  async function handleDashboard1Step1(request, env, corsHeaders) {
    try {
      const body = await request.json();
      const { session_token, user_id } = body;

      // Simple authentication - only require session_token and user_id
      if (!session_token || !user_id) {
        return new Response(JSON.stringify({
          error: 'Missing required fields',
          required: ['session_token', 'user_id'],
          hint: 'This endpoint requires minimal session data for simplified testing'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Check if database is available
      if (!env.DB) {
        return new Response(JSON.stringify({
          error: 'Database not available'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Validate session token and fetch all session fields for network response
      const user = await env.DB.prepare(
        'SELECT id, username, session_token, session_id, csrf_token, correlation_id FROM users WHERE session_token = ? AND id = ?'
      ).bind(session_token, user_id).first();

      if (!user) {
        return new Response(JSON.stringify({
          error: 'Invalid session',
          hint: 'Session token or user_id is invalid'
        }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Generate a SHORT shortID for correlation testing (1-2 digit numbers)
      // This is the key difference - testing correlation with very short values
      const shortID = (Math.floor(Math.random() * 9) + 1).toString(); // "1" through "9"
      const timestamp = new Date().toISOString();

      // Store the shortID in the database for validation in Step 2
      await env.DB.prepare(
        'UPDATE users SET dashboard1_shortid = ?, dashboard1_shortid_timestamp = ? WHERE id = ?'
      ).bind(shortID, timestamp, user.id).run();

      // Return JSON response with short shortID
      return new Response(JSON.stringify({
        success: true,
        message: 'Step 1 completed - shortID generated',
        shortID: shortID, // Short value like "1", "2", "3"
        username: user.username,
        user_id: user.id,
        session_token: user.session_token,
        session_id: user.session_id,
        csrf_token: user.csrf_token,
        correlation_id: user.correlation_id,
        timestamp: timestamp,
        hint: 'Use this shortID in Step 2 request'
      }), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-Session-Token': user.session_token || '',
          'X-Correlation-Id': user.correlation_id || '',
          'X-ShortID': shortID, // Also in header for multiple extraction options
          'X-Timestamp': timestamp
        }
      });
    } catch (error) {
      console.error('Error in handleDashboard1Step1:', error);
      return new Response(JSON.stringify({
        error: 'Internal server error',
        message: error.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }

  async function handleDashboard1Step2(request, env, corsHeaders) {
    try {
      const body = await request.json();
      const { session_token, user_id, shortID } = body;

      // Require session data AND shortID from step 1
      if (!session_token || !user_id || !shortID) {
        return new Response(JSON.stringify({
          error: 'Missing required fields',
          required: ['session_token', 'user_id', 'shortID'],
          hint: 'shortID must be extracted from Step 1 response'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Check if database is available
      if (!env.DB) {
        return new Response(JSON.stringify({
          error: 'Database not available'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Validate session token and get stored shortID + session fields
      const user = await env.DB.prepare(
        'SELECT id, username, dashboard1_shortid, session_id, csrf_token, correlation_id, session_token FROM users WHERE session_token = ? AND id = ?'
      ).bind(session_token, user_id).first();

      if (!user) {
        return new Response(JSON.stringify({
          error: 'Invalid session',
          hint: 'Session token or user_id is invalid'
        }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Validate shortID format (should be 1-2 digit number)
      if (!/^[0-9]{1,2}$/.test(shortID)) {
        return new Response(JSON.stringify({
          error: 'Invalid shortID format',
          received: shortID,
          expected: 'Single digit number (1-9)',
          hint: 'shortID must be extracted from Step 1 response'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // CRITICAL: Validate that the shortID matches the one stored in Step 1
      if (!user.dashboard1_shortid) {
        return new Response(JSON.stringify({
          error: 'No shortID found',
          hint: 'You must call Step 1 first to generate a shortID',
          correlation_test: 'FAILED',
          reason: 'Missing Step 1 execution'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (user.dashboard1_shortid !== shortID) {
        return new Response(JSON.stringify({
          error: 'shortID mismatch - Correlation FAILED',
          expected: user.dashboard1_shortid,
          received: shortID,
          hint: 'The shortID you provided does not match the one generated in Step 1',
          correlation_test: 'FAILED',
          reason: 'Incorrect correlation value - correlation extraction failed or wrong value used'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const timestamp = new Date().toISOString();
      const finalID = (Math.floor(Math.random() * 90) + 10).toString(); // "10" through "99"

      // Clear the stored shortID after successful validation (prevents reuse)
      await env.DB.prepare(
        'UPDATE users SET dashboard1_shortid = NULL, dashboard1_shortid_timestamp = NULL WHERE id = ?'
      ).bind(user.id).run();

      // Return success response
      return new Response(JSON.stringify({
        success: true,
        message: 'Step 2 completed - Correlation successful!',
        username: user.username,
        user_id: user.id,
        shortID_received: shortID,
        shortID_validated: true,
        finalID: finalID, // Another short value for additional testing
        timestamp: timestamp,
        correlation_test: 'PASSED',
        hint: 'Short value correlation is working correctly'
      }), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-ShortID-Received': shortID,
          'X-FinalID': finalID,
          'X-Timestamp': timestamp,
          'X-Correlation-Status': 'PASSED'
        }
      });
    } catch (error) {
      console.error('Error in handleDashboard1Step2:', error);
      return new Response(JSON.stringify({
        error: 'Internal server error',
        message: error.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }

  async function handleDashboard1Step3(request, env, corsHeaders) {
    try {
      const body = await request.json();
      const { session_token, user_id, session_id } = body || {};

      if (!session_token || !user_id || !session_id) {
        return new Response(JSON.stringify({
          error: 'Missing required fields',
          required: ['session_token', 'session_id', 'user_id'],
          hint: 'Send the full session body to generate the large viewstate'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (!env.DB) {
        return new Response(JSON.stringify({
          error: 'Database not available'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const user = await env.DB.prepare(
        'SELECT id, username, session_token, session_id, csrf_token, correlation_id FROM users WHERE session_token = ? AND id = ? AND session_id = ?'
      ).bind(session_token, user_id, session_id).first();

      if (!user) {
        return new Response(JSON.stringify({
          error: 'Invalid session',
          hint: 'Session token, session_id, or user_id is invalid'
        }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const state = await buildLargeViewState(user.session_id, user.session_token, user.id);

      const responsePayload = {
        success: true,
        message: 'Step 3 completed - large viewstate generated',
        viewstate: state.viewstate,
        viewstate_base64_length: state.viewstate.length,
        viewstate_raw_length: state.rawLength,
        signature: state.signature,
        signature_hint: state.signature.substring(0, 12) + '...',
        timestamp: state.timestamp,
        constraints: {
          minimum_view_length: 350000,
          includes_nonce_and_signature: true,
          structure: ['v', 'sid', 'uid', 'ts', 'nonce', 'sig', 'view']
        }
      };

      return new Response(JSON.stringify(responsePayload), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-Viewstate-Signature': state.signature,
          'X-Viewstate-Size': state.rawLength.toString(),
          'X-Viewstate-Base64-Size': state.viewstate.length.toString()
        }
      });
    } catch (error) {
      console.error('Error in handleDashboard1Step3:', error);
      return new Response(JSON.stringify({
        error: 'Internal server error',
        message: error.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }

  async function handleDashboard1Step4(request, env, corsHeaders) {
    try {
      const body = await request.json();
      const { session_token, user_id, session_id, viewstate } = body || {};

      if (!session_token || !user_id || !session_id || !viewstate) {
        return new Response(JSON.stringify({
          error: 'Missing required fields',
          required: ['session_token', 'session_id', 'user_id', 'viewstate'],
          hint: 'Send the exact viewstate from Step 3 without trimming it'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (!env.DB) {
        return new Response(JSON.stringify({
          error: 'Database not available'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const user = await env.DB.prepare(
        'SELECT id, username, session_token, session_id FROM users WHERE session_token = ? AND id = ? AND session_id = ?'
      ).bind(session_token, user_id, session_id).first();

      if (!user) {
        return new Response(JSON.stringify({
          error: 'Invalid session',
          hint: 'Session token, session_id, or user_id is invalid'
        }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      let decoded;
      let parsed;

      try {
        decoded = atob(viewstate);
        parsed = JSON.parse(decoded);
      } catch (err) {
        return new Response(JSON.stringify({
          error: 'Invalid viewstate encoding',
          details: err.message,
          hint: 'Viewstate must be the base64 string returned in Step 3'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const issues = [];
      const requiredKeys = ['v', 'sid', 'uid', 'ts', 'nonce', 'sig', 'view'];
      const missingKeys = requiredKeys.filter(key => !(key in parsed));

      if (missingKeys.length > 0) {
        issues.push(`Missing fields: ${missingKeys.join(', ')}`);
      }

      if (parsed.sid !== session_id) {
        issues.push('Session ID inside viewstate does not match request session_id');
      }

      if (String(parsed.uid) !== String(user.id)) {
        issues.push('User ID inside viewstate does not match request user_id');
      }

      if (!parsed.view || parsed.view.length < 350000) {
        issues.push('Viewstate payload is too small - expected a large ASP.NET style payload (>350KB raw)');
      }

      const recomputedSignature = await sha256Base64(`${session_token}|${session_id}|${user_id}|${parsed.nonce}|${parsed.ts}`);

      if (parsed.sig !== recomputedSignature) {
        issues.push('Signature mismatch - correlation failed');
      }

      if (issues.length > 0) {
        return new Response(JSON.stringify({
          error: 'Viewstate validation failed',
          issues,
          received_structure: Object.keys(parsed),
          received_lengths: {
            raw_view_length: parsed.view ? parsed.view.length : 0,
            base64_length: viewstate.length
          }
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const responsePayload = {
        success: true,
        message: 'Step 4 completed - large viewstate validated',
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
          'Content-Type': 'application/json',
          'X-Viewstate-Validated': 'true',
          'X-Viewstate-Signature': parsed.sig,
          'X-Viewstate-Size': parsed.view.length.toString(),
          'X-Viewstate-Nonce': parsed.nonce
        }
      });
    } catch (error) {
      console.error('Error in handleDashboard1Step4:', error);
      return new Response(JSON.stringify({
        error: 'Internal server error',
        message: error.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }

  async function handleDashboard1Step5(request, env, corsHeaders) {
    try {
      const body = await request.json();
      const { session_token, user_id, session_id, transactions, meta } = body || {};

      if (!session_token || !user_id || !session_id || !transactions || !Array.isArray(transactions)) {
        return new Response(JSON.stringify({
          error: 'Missing required fields',
          required: ['session_token', 'session_id', 'user_id', 'transactions'],
          hint: 'transactions must be an array and should be large (200KB+)'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (!env.DB) {
        return new Response(JSON.stringify({
          error: 'Database not available'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const user = await env.DB.prepare(
        'SELECT id, username, session_token, session_id FROM users WHERE session_token = ? AND id = ? AND session_id = ?'
      ).bind(session_token, user_id, session_id).first();

      if (!user) {
        return new Response(JSON.stringify({
          error: 'Invalid session',
          hint: 'Session token, session_id, or user_id is invalid'
        }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Basic structure validation for transactions array
      const minCount = 600;
      if (transactions.length < minCount) {
        return new Response(JSON.stringify({
          error: 'Payload too small',
          hint: `Provide at least ${minCount} transaction objects to simulate bulk payloads`
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const transactionsString = JSON.stringify(transactions);
      if (transactionsString.length < 500000) {
        return new Response(JSON.stringify({
          error: 'Payload size too small',
          received_bytes: transactionsString.length,
          hint: 'Aim for >500KB to exercise large-body handling'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const batchId = generateToken();
      const pivotIndex = Math.min(Math.floor(transactions.length / 2), transactions.length - 1);
      const pivotItem = transactions[pivotIndex] || {};
      const pivotItemId = pivotItem.id ? String(pivotItem.id) : `pivot_${pivotIndex}`;
      const validationCode = await sha256Base64(`${batchId}|${pivotItemId}|${session_token}|${session_id}|${user_id}|${transactions.length}`);

      // Generate large response payload (~400KB) to test response correlation edge cases
      const responseFiller = generateFillerString(400000);
      const responseSignature = await sha256Base64(`${batchId}|${validationCode}|${responseFiller.substring(0, 100)}`);

      const responsePayload = {
        success: true,
        message: 'Step 5 completed - bulk payload accepted',
        batch_id: batchId,
        pivot_item_id: pivotItemId,
        validation_code: validationCode,
        transactions_count: transactions.length,
        payload_bytes: transactionsString.length,
        constraints: {
          minimum_count: minCount,
          minimum_bytes: 500000
        },
        meta_echo: meta || null,
        hint: 'Send batch_id, pivot_item_id, validation_code, and transactions_count to Step 6',
        // Large response data for edge case testing (correlation tools must handle large responses)
        response_data: {
          filler: responseFiller,
          filler_length: responseFiller.length,
          response_signature: responseSignature,
          response_signature_hint: responseSignature.substring(0, 12) + '...',
          purpose: 'Large response payload to test LLM token limit edge cases in correlation tools'
        }
      };

      return new Response(JSON.stringify(responsePayload), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-Batch-Id': batchId,
          'X-Large-Payload-Size': transactionsString.length.toString(),
          'X-Pivot-Item-Id': pivotItemId,
          'X-Validation-Code': validationCode.substring(0, 24) + '...'
        }
      });
    } catch (error) {
      console.error('Error in handleDashboard1Step5:', error);
      return new Response(JSON.stringify({
        error: 'Internal server error',
        message: error.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }

	  async function handleDashboard1Step6(request, env, corsHeaders) {
    try {
      const body = await request.json();
      const { session_token, user_id, session_id, batch_id, validation_code, pivot_item_id, transactions_count } = body || {};

      if (!session_token || !user_id || !session_id || !batch_id || !validation_code || !pivot_item_id || !transactions_count) {
        return new Response(JSON.stringify({
          error: 'Missing required fields',
          required: ['session_token', 'session_id', 'user_id', 'batch_id', 'validation_code', 'pivot_item_id', 'transactions_count'],
          hint: 'Use the values returned from Step 5'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (!env.DB) {
        return new Response(JSON.stringify({
          error: 'Database not available'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const user = await env.DB.prepare(
        'SELECT id, username, session_token, session_id FROM users WHERE session_token = ? AND id = ? AND session_id = ?'
      ).bind(session_token, user_id, session_id).first();

      if (!user) {
        return new Response(JSON.stringify({
          error: 'Invalid session',
          hint: 'Session token, session_id, or user_id is invalid'
        }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const expectedCode = await sha256Base64(`${batch_id}|${pivot_item_id}|${session_token}|${session_id}|${user_id}|${transactions_count}`);

      if (validation_code !== expectedCode) {
        return new Response(JSON.stringify({
          error: 'Validation code mismatch - correlation failed',
          expected_hint: expectedCode.substring(0, 20) + '...',
          received_hint: validation_code.substring(0, 20) + '...',
          hint: 'Ensure you replayed the exact code from Step 5'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const responsePayload = {
        success: true,
        message: 'Step 6 completed - large payload correlation validated',
        batch_id,
        pivot_item_id,
        transactions_count,
        username: user.username,
        validation_confirmed: true,
        timestamp: new Date().toISOString()
      };

      return new Response(JSON.stringify(responsePayload), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-Batch-Validated': batch_id,
          'X-Pivot-Item-Id': pivot_item_id,
          'X-Transactions-Count': transactions_count.toString()
        }
      });
    } catch (error) {
      console.error('Error in handleDashboard1Step6:', error);
      return new Response(JSON.stringify({
        error: 'Internal server error',
        message: error.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
	  }

	  // Dashboard1 Flow A - Headers + Cookies + Scope + high token density
	  async function handleDashboard1Step7(request, env, corsHeaders) {
	    try {
	      const url = new URL(request.url);
	      const isSecure = url.protocol === 'https:';

	      const flowaSession = `flowa_${generateToken()}`;
	      const csrfHeaderToken = await deriveFlowAToken(flowaSession, 'csrfA');
	      const decoyCsrf = await deriveFlowAToken(flowaSession, 'decoy_body_csrf');

	      const cookieSession = buildSetCookieHeader(FLOWA_SESSION_COOKIE_NAME, flowaSession, {
	        secure: isSecure
	      });

	      // Deliberately vary attribute order across multiple cookies to test parsing robustness.
	      const cookieHint = [
	        `${FLOWA_HINT_COOKIE_NAME}=1`,
	        'HttpOnly',
	        'SameSite=Lax',
	        'Path=/',
	        isSecure ? 'Secure' : null
	      ].filter(Boolean).join('; ');

	      const cookieNoise = [
	        `${FLOWA_NOISE_COOKIE_NAME}=tok_${randomHex(16)}`,
	        'SameSite=Lax',
	        'Path=/',
	        isSecure ? 'Secure' : null,
	        'HttpOnly'
	      ].filter(Boolean).join('; ');

	      const headers = new Headers({
	        ...corsHeaders,
	        'Content-Type': 'application/json',
	        'Cache-Control': 'no-store',
	        'X-CSRF-TOKEN': csrfHeaderToken
	      });
	      headers.append('Set-Cookie', cookieSession);
	      headers.append('Set-Cookie', cookieHint);
	      headers.append('Set-Cookie', cookieNoise);

		      return new Response(JSON.stringify({
		        success: true,
		        flow: 'Flow A1',
		        step: 7,
		        purpose: 'Header-only token + cookies (with body decoy)',
		        edge_cases: [
		          'Extract dynamic token from response header (X-CSRF-TOKEN)',
		          'Persist HttpOnly cookie (flowa_session)',
		          'Ignore misleading csrf in response body'
		        ],
		        csrf: decoyCsrf,
		        note: 'Step 8 validates header/cookie reuse (X-CSRF-TOKEN + body.csrf).'
		      }), { status: 200, headers });
	    } catch (error) {
	      console.error('Error in handleDashboard1Step7:', error);
	      return new Response(JSON.stringify({
	        error: 'Internal server error',
	        message: error.message
	      }), {
	        status: 500,
	        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
	      });
	    }
	  }

	  async function handleDashboard1Step8(request, env, corsHeaders) {
	    try {
	      const body = await request.json().catch(() => null);
	      const csrfFromBody = body && typeof body.csrf === 'string' ? body.csrf : null;

	      const flowaSession = getCookieValue(request.headers.get('Cookie'), FLOWA_SESSION_COOKIE_NAME);
	      if (!flowaSession) {
	        return new Response(JSON.stringify({
	          error: 'Missing Flow A session cookie',
	          required: [`Cookie: ${FLOWA_SESSION_COOKIE_NAME}=...`],
	          hint: 'Run Step 7 first to receive the flowa_session cookie'
	        }), {
	          status: 401,
	          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
	        });
	      }

	      const csrfFromHeader = request.headers.get('X-CSRF-TOKEN');
	      const expectedCsrfHeaderToken = await deriveFlowAToken(flowaSession, 'csrfA');

	      if (!csrfFromHeader) {
	        return new Response(JSON.stringify({
	          error: 'Missing required header',
	          required: ['X-CSRF-TOKEN'],
	          hint: 'Extract X-CSRF-TOKEN from Step 7 response headers and replay it here'
	        }), {
	          status: 400,
	          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
	        });
	      }

	      if (!csrfFromBody) {
	        return new Response(JSON.stringify({
	          error: 'Missing required body field',
	          required: ['csrf'],
	          hint: 'Set body.csrf to the same value as the X-CSRF-TOKEN header'
	        }), {
	          status: 400,
	          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
	        });
	      }

	      if (csrfFromHeader !== expectedCsrfHeaderToken) {
	        return new Response(JSON.stringify({
	          error: 'CSRF header mismatch - correlation FAILED',
	          correlation_test: 'FAILED',
	          received_hint: csrfFromHeader.substring(0, 16),
	          expected_hint: expectedCsrfHeaderToken.substring(0, 16),
	          hint: 'Use the exact X-CSRF-TOKEN value from Step 7 (response header)'
	        }), {
	          status: 400,
	          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
	        });
	      }

	      if (csrfFromBody !== csrfFromHeader) {
	        return new Response(JSON.stringify({
	          error: 'CSRF body/header mismatch - correlation FAILED',
	          correlation_test: 'FAILED',
	          hint: 'Body csrf must exactly match the X-CSRF-TOKEN header'
	        }), {
	          status: 400,
	          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
	        });
	      }

	      return new Response(JSON.stringify({
	        success: true,
	        flow: 'Flow A1',
	        step: 8,
	        message: 'Flow A1 completed - header-only token + cookie correlation validated',
	        correlation_test: 'PASSED',
	        validated: {
	          cookie_session: true,
	          header_token: true,
	          header_to_body: true
	        },
	        timestamp: new Date().toISOString()
	      }), {
	        status: 200,
	        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
	      });
	    } catch (error) {
	      console.error('Error in handleDashboard1Step8:', error);
	      return new Response(JSON.stringify({
	        error: 'Internal server error',
	        message: error.message
	      }), {
	        status: 500,
	        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
	      });
	    }
	  }

	  async function handleDashboard1Step9(request, env, corsHeaders) {
	    try {
	      const url = new URL(request.url);
	      const isSecure = url.protocol === 'https:';
	      const body = await request.json().catch(() => null);
	      const decoyCountRaw = body && (typeof body.decoy_count === 'number' || typeof body.decoy_count === 'string')
	        ? Number(body.decoy_count)
	        : null;
	      const decoyCount = Number.isFinite(decoyCountRaw)
	        ? Math.max(FLOWA_DECOY_COUNT_MIN, Math.min(FLOWA_DECOY_COUNT_MAX, Math.floor(decoyCountRaw)))
	        : FLOWA_DECOY_COUNT_DEFAULT;

	      const flowa2Session = `flowa2_${generateToken()}`;
	      const correctNextCsrf = await deriveFlowAToken(flowa2Session, 'csrfB');
	      const csrfDecoy = await deriveFlowAToken(flowa2Session, 'csrf_decoy');
	      const previousCsrf = await deriveFlowAToken(flowa2Session, 'previous_csrf');
	      const sessionId = await deriveFlowASessionId(flowa2Session, 'sessionId');
	      const adminSessionId = await deriveFlowASessionId(flowa2Session, 'admin.sessionId');

	      const decoys = {};
	      for (let i = 1; i <= decoyCount; i++) {
	        const key = `decoy_${String(i).padStart(3, '0')}`;
	        decoys[key] = `tok_${randomHex(16)}`;
	      }

	      const headers = new Headers({
	        ...corsHeaders,
	        'Content-Type': 'application/json',
	        'Cache-Control': 'no-store'
	      });
	      headers.append('Set-Cookie', buildSetCookieHeader(FLOWA2_SESSION_COOKIE_NAME, flowa2Session, { secure: isSecure }));

	      return new Response(JSON.stringify({
	        success: true,
	        flow: 'Flow A2',
	        step: 9,
	        purpose: 'Ambiguity + scope + high token density (200)',
	        edge_cases: [
	          'Multiple similar candidates (csrf/previous_csrf/meta.csrf)',
	          'Same token name, different scope (sessionId vs admin.sessionId)',
	          'High token density decoys (50–200)',
	          'Body → header reuse (meta.csrf, admin.sessionId)',
	          'Body → body reuse (meta.csrf)'
	        ],
	        csrf: csrfDecoy,
	        previous_csrf: previousCsrf,
	        meta: {
	          csrf: correctNextCsrf
	        },
	        sessionId,
	        admin: {
	          sessionId: adminSessionId
	        },
	        decoy_count: decoyCount,
	        decoys,
	        note: 'Step 10 must use meta.csrf in BOTH body.csrf and X-FlowA-CSRF, and admin.sessionId in X-Admin-SessionId.'
	      }), { status: 200, headers });
	    } catch (error) {
	      console.error('Error in handleDashboard1Step9:', error);
	      return new Response(JSON.stringify({
	        error: 'Internal server error',
	        message: error.message
	      }), {
	        status: 500,
	        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
	      });
	    }
	  }

	  async function handleDashboard1Step10(request, env, corsHeaders) {
	    try {
	      const body = await request.json().catch(() => null);
	      const csrfFromBody = body && typeof body.csrf === 'string' ? body.csrf : null;

	      const flowa2Session = getCookieValue(request.headers.get('Cookie'), FLOWA2_SESSION_COOKIE_NAME);
	      if (!flowa2Session) {
	        return new Response(JSON.stringify({
	          error: 'Missing Flow A2 session cookie',
	          required: [`Cookie: ${FLOWA2_SESSION_COOKIE_NAME}=...`],
	          hint: 'Run Step 9 first to receive the flowa2_session cookie'
	        }), {
	          status: 401,
	          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
	        });
	      }

	      const csrfFromHeader = request.headers.get('X-FlowA-CSRF');
	      const adminSessionIdHeader = request.headers.get('X-Admin-SessionId');

	      if (!csrfFromHeader || !csrfFromBody || !adminSessionIdHeader) {
	        return new Response(JSON.stringify({
	          error: 'Missing required fields',
	          required: ['Header: X-FlowA-CSRF', 'Header: X-Admin-SessionId', 'Body: csrf'],
	          hint: 'Use meta.csrf and admin.sessionId from Step 9 response'
	        }), {
	          status: 400,
	          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
	        });
	      }

	      if (csrfFromBody !== csrfFromHeader) {
	        return new Response(JSON.stringify({
	          error: 'Header/body mismatch - correlation FAILED',
	          correlation_test: 'FAILED',
	          hint: 'Header X-FlowA-CSRF must exactly match body.csrf'
	        }), {
	          status: 400,
	          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
	        });
	      }

	      const expectedCsrf = await deriveFlowAToken(flowa2Session, 'csrfB');
	      const expectedAdminSessionId = await deriveFlowASessionId(flowa2Session, 'admin.sessionId');

	      if (csrfFromHeader !== expectedCsrf) {
	        return new Response(JSON.stringify({
	          error: 'CSRF mismatch - correlation FAILED',
	          correlation_test: 'FAILED',
	          hint: 'Use meta.csrf from Step 9 response (NOT top-level csrf)'
	        }), {
	          status: 400,
	          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
	        });
	      }

	      if (adminSessionIdHeader !== expectedAdminSessionId) {
	        return new Response(JSON.stringify({
	          error: 'Admin sessionId scope mismatch - correlation FAILED',
	          correlation_test: 'FAILED',
	          hint: 'Use admin.sessionId from Step 9 response (NOT top-level sessionId) in X-Admin-SessionId'
	        }), {
	          status: 400,
	          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
	        });
	      }

	      return new Response(JSON.stringify({
	        success: true,
	        flow: 'Flow A2',
	        step: 10,
	        message: 'Flow A2 completed - ambiguity + scope + decoy resistance validated',
	        correlation_test: 'PASSED',
	        validated: {
	          meta_csrf: true,
	          admin_session_scope: true,
	          body_to_header: true
	        },
	        timestamp: new Date().toISOString()
	      }), {
	        status: 200,
	        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
	      });
	    } catch (error) {
	      console.error('Error in handleDashboard1Step10:', error);
	      return new Response(JSON.stringify({
	        error: 'Internal server error',
	        message: error.message
	      }), {
	        status: 500,
	        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
	      });
	    }
	  }

	  // Dashboard1 Flow B - HTML-encoded vs raw + noise values (static + random)
	  async function handleDashboard1Step11(request, env, corsHeaders) {
	    try {
	      const url = new URL(request.url);
	      const isSecure = url.protocol === 'https:';

	      const flowbSession = `flowb_${generateToken()}`;
	      const rawToken = await deriveFlowBToken(flowbSession, 'csrf_html');
	      const rawDecoyToken = await deriveFlowBToken(flowbSession, 'csrf_decoy');

	      const encodedToken = escapeHtml(rawToken);
	      const encodedDecoyToken = escapeHtml(rawDecoyToken);

	      const staticNoiseInputs = [];
	      for (let i = 1; i <= FLOWB_STATIC_NOISE_COUNT; i++) {
	        const hash = await sha256Hex(`flowb_static_noise_v1|${i}`);
	        staticNoiseInputs.push({
	          name: `static_noise_${String(i).padStart(3, '0')}`,
	          value: `tok_${hash.slice(0, 32)}`
	        });
	      }

	      const randomNoiseInputs = [];
	      for (let i = 1; i <= FLOWB_RANDOM_NOISE_COUNT; i++) {
	        randomNoiseInputs.push({
	          name: `uuid_noise_${String(i).padStart(3, '0')}`,
	          value: randomUuid()
	        });
	      }

	      const buildHiddenInput = ({ name, value }) =>
	        `<input type="hidden" name="${escapeHtml(name)}" value="${escapeHtml(value)}" />`;

	      const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Dashboard1 Flow B - HTML Encoded Token</title>
  </head>
  <body>
	    <h2>Dashboard1 - Flow B (Encoding + Noise)</h2>
	    <p><strong>Purpose:</strong> token is HTML-encoded in the response body and must be decoded before reuse.</p>
	    <p><strong>Next:</strong> call <code>POST /api/dashboard1/step12</code> with the decoded token in both header and JSON body.</p>

    <form>
      <h3>Real token (HTML-encoded)</h3>
      <p>Extract from HTML as text (regex) to observe <code>&amp;amp;</code> vs <code>&amp;</code> difference.</p>
      <input type="hidden" name="csrf_html" value="${encodedToken}" />

      <h3>Decoy token (also HTML-encoded)</h3>
      <input type="hidden" name="csrf_decoy" value="${encodedDecoyToken}" />

      <h3>Noise: high-entropy but static</h3>
      ${staticNoiseInputs.map(buildHiddenInput).join('\n      ')}

      <h3>Noise: uncorrelatable random data (per-request UUIDs)</h3>
      ${randomNoiseInputs.map(buildHiddenInput).join('\n      ')}
    </form>
  </body>
</html>`;

	      const headers = new Headers({
	        ...corsHeaders,
	        'Content-Type': 'text/html',
	        'Cache-Control': 'no-store'
	      });
	      headers.append('Set-Cookie', buildSetCookieHeader(FLOWB_SESSION_COOKIE_NAME, flowbSession, { secure: isSecure }));

	      return new Response(html, { status: 200, headers });
	    } catch (error) {
	      console.error('Error in handleDashboard1Step11:', error);
	      return new Response(JSON.stringify({
	        error: 'Internal server error',
	        message: error.message
	      }), {
	        status: 500,
	        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
	      });
	    }
	  }

	  async function handleDashboard1Step12(request, env, corsHeaders) {
	    try {
	      const flowbSession = getCookieValue(request.headers.get('Cookie'), FLOWB_SESSION_COOKIE_NAME);
	      if (!flowbSession) {
	        return new Response(JSON.stringify({
	          error: 'Missing Flow B session cookie',
	          required: [`Cookie: ${FLOWB_SESSION_COOKIE_NAME}=...`],
	          hint: 'Run Step 11 first to receive the flowb_session cookie'
	        }), {
	          status: 401,
	          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
	        });
	      }

	      const headerToken = request.headers.get('X-HTML-CSRF');
	      const body = await request.json().catch(() => null);
	      const bodyToken = body && typeof body.csrf === 'string' ? body.csrf : null;

	      if (!headerToken || !bodyToken) {
	        return new Response(JSON.stringify({
	          error: 'Missing required fields',
	          required: ['Header: X-HTML-CSRF', 'Body: csrf'],
	          hint: 'Use the decoded csrf_html token from Step 11 in BOTH header and body'
	        }), {
	          status: 400,
	          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
	        });
	      }

	      const expectedRawToken = await deriveFlowBToken(flowbSession, 'csrf_html');

	      if (looksHtmlEntityEncoded(headerToken) || looksHtmlEntityEncoded(bodyToken)) {
	        return new Response(JSON.stringify({
	          error: 'Token appears HTML-encoded - decode required',
	          correlation_test: 'FAILED',
	          hint: 'Your value still contains HTML entities like &amp; or &lt;. Decode HTML entities before reuse (e.g. &amp;amp; → &amp;).'
	        }), {
	          status: 400,
	          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
	        });
	      }

	      if (headerToken !== bodyToken) {
	        return new Response(JSON.stringify({
	          error: 'Header/body mismatch - correlation FAILED',
	          correlation_test: 'FAILED',
	          hint: 'Header X-HTML-CSRF must exactly match body.csrf'
	        }), {
	          status: 400,
	          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
	        });
	      }

	      if (headerToken !== expectedRawToken) {
	        return new Response(JSON.stringify({
	          error: 'Token mismatch - correlation FAILED',
	          correlation_test: 'FAILED',
	          received_hint: headerToken.substring(0, 24),
	          expected_hint: expectedRawToken.substring(0, 24),
	          hint: 'Use the decoded csrf_html token from Step 11 (NOT csrf_decoy, and NOT the HTML-encoded form).'
	        }), {
	          status: 400,
	          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
	        });
	      }

	      return new Response(JSON.stringify({
	        success: true,
	        flow: 'Flow B',
	        step: 12,
	        message: 'Flow B completed - HTML decoding + body→header reuse validated',
	        correlation_test: 'PASSED',
	        timestamp: new Date().toISOString()
	      }), {
	        status: 200,
	        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
	      });
	    } catch (error) {
	      console.error('Error in handleDashboard1Step12:', error);
	      return new Response(JSON.stringify({
	        error: 'Internal server error',
	        message: error.message
	      }), {
	        status: 500,
	        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
	      });
	    }
	  }

	// Utility Functions
	const ACCESS_COOKIE_NAME = 'lm_access';
	const ACCESS_VISIT_COOKIE_NAME = 'lm_access_visit';
	const ACCESS_VISIT_COOKIE_MAX_AGE_SECONDS = 2;
	const FLOWA_SESSION_COOKIE_NAME = 'flowa_session';
	const FLOWA_HINT_COOKIE_NAME = 'flowa_hint';
	const FLOWA_NOISE_COOKIE_NAME = 'flowa_noise';
	const FLOWA2_SESSION_COOKIE_NAME = 'flowa2_session';
	const FLOWA_DECOY_COUNT_DEFAULT = 200;
	const FLOWA_DECOY_COUNT_MIN = 50;
	const FLOWA_DECOY_COUNT_MAX = 200;
	const FLOWB_SESSION_COOKIE_NAME = 'flowb_session';
	const FLOWB_STATIC_NOISE_COUNT = 12;
	const FLOWB_RANDOM_NOISE_COUNT = 12;

function isTruthyEnvValue(value) {
  if (typeof value !== 'string') return false;
  const normalized = value.trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
}

function shouldChallengeEveryVisit(env) {
  return isTruthyEnvValue(env.SITE_ACCESS_CHALLENGE_EVERY_VISIT);
}

function isVisitRequest(path, request) {
  if (request.method !== 'GET') return false;
  if (path === '/favicon.ico') return false;
  if (path.startsWith('/api/')) return false;
  if (path.startsWith('/images/')) return false;
  if (path.startsWith('/static/')) return false;
  return true;
}

async function deriveVisitCookieValue(secret, nextPath) {
  const raw = await sha256Base64(`lm_access_visit_v1|${secret}|${nextPath}`);
  return raw.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function buildVisitChallengeRedirectResponse(request, corsHeaders) {
  const url = new URL(request.url);
  const next = url.pathname + url.search;
  const location = `/__access?next=${encodeURIComponent(next)}`;
  return new Response(null, {
    status: 302,
    headers: { ...corsHeaders, 'Cache-Control': 'no-store', 'Location': location }
  });
}

async function enforceSiteAccess(request, env, corsHeaders) {
  const url = new URL(request.url);
  const secret = env.SITE_ACCESS_TOKEN;
  if (typeof secret !== 'string' || secret.length === 0) {
    return new Response('Site access not configured', {
      status: 500,
      headers: { ...corsHeaders, 'Cache-Control': 'no-store' }
    });
  }

  const expectedCookieValue = await deriveAccessCookieValue(secret);
  const cookieValue = getCookieValue(request.headers.get('Cookie'), ACCESS_COOKIE_NAME);
  if (cookieValue && timingSafeEqual(cookieValue, expectedCookieValue)) {
    if (shouldChallengeEveryVisit(env) && isVisitRequest(url.pathname, request)) {
      const expectedVisitCookieValue = await deriveVisitCookieValue(secret, url.pathname + url.search);
      const visitCookieValue = getCookieValue(request.headers.get('Cookie'), ACCESS_VISIT_COOKIE_NAME);
      if (!visitCookieValue || !timingSafeEqual(visitCookieValue, expectedVisitCookieValue)) {
        return buildVisitChallengeRedirectResponse(request, corsHeaders);
      }
    }
    return null;
  }

  return buildAccessDeniedResponse(request, corsHeaders);
}

async function handleAccessGate(request, env, corsHeaders) {
  const url = new URL(request.url);
  const secret = env.SITE_ACCESS_TOKEN;
  if (typeof secret !== 'string' || secret.length === 0) {
    return new Response('Site access not configured', {
      status: 500,
      headers: { ...corsHeaders, 'Cache-Control': 'no-store' }
    });
  }

  const challengeEveryVisit = shouldChallengeEveryVisit(env);
  const expectedCookieValue = await deriveAccessCookieValue(secret);
  const currentCookieValue = getCookieValue(request.headers.get('Cookie'), ACCESS_COOKIE_NAME);
  const alreadyUnlocked = currentCookieValue && timingSafeEqual(currentCookieValue, expectedCookieValue);
  const isSecure = url.protocol === 'https:';
  const nextFromQuery = sanitizeNextPath(url.searchParams.get('next'));
  const nextPath = nextFromQuery || '/';

  if (url.searchParams.get('logout') === '1') {
    const clearCookie = buildSetCookieHeader(ACCESS_COOKIE_NAME, '', {
      maxAgeSeconds: 0,
      secure: isSecure
    });
    const clearVisitCookie = buildSetCookieHeader(ACCESS_VISIT_COOKIE_NAME, '', {
      maxAgeSeconds: 0,
      secure: isSecure
    });

    const headers = new Headers({
      ...corsHeaders,
      'Content-Type': 'text/html',
      'Cache-Control': 'no-store'
    });
    headers.append('Set-Cookie', clearCookie);
    headers.append('Set-Cookie', clearVisitCookie);

    return new Response(getAccessGatePage({ status: 'logged_out', next: nextPath }), {
      status: 200,
      headers
    });
  }

  if (request.method === 'GET') {
    if (alreadyUnlocked && !challengeEveryVisit) {
      return new Response(getAccessGatePage({ status: 'already_unlocked', next: nextPath }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/html', 'Cache-Control': 'no-store' }
      });
    }

    return new Response(getAccessGatePage({ next: nextPath, status: alreadyUnlocked ? 'visit_required' : null }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'text/html', 'Cache-Control': 'no-store' }
    });
  }

  if (request.method === 'POST') {
    const { token, next } = await readAccessGateBody(request);
    const redirectTarget = sanitizeNextPath(next) || nextPath;

    if (!token) {
      return new Response(getAccessGatePage({ error: 'Missing access token', next: redirectTarget }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'text/html', 'Cache-Control': 'no-store' }
      });
    }

    if (!timingSafeEqual(token, secret)) {
      return new Response(getAccessGatePage({ error: 'Invalid access token', next: redirectTarget }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'text/html', 'Cache-Control': 'no-store' }
      });
    }

    const setCookie = buildSetCookieHeader(ACCESS_COOKIE_NAME, expectedCookieValue, {
      secure: isSecure
    });

    const headers = new Headers({
      ...corsHeaders,
      'Cache-Control': 'no-store',
      'Location': redirectTarget
    });
    headers.append('Set-Cookie', setCookie);

    if (challengeEveryVisit) {
      const visitCookieValue = await deriveVisitCookieValue(secret, redirectTarget);
      const visitCookie = buildSetCookieHeader(ACCESS_VISIT_COOKIE_NAME, visitCookieValue, {
        maxAgeSeconds: ACCESS_VISIT_COOKIE_MAX_AGE_SECONDS,
        secure: isSecure
      });
      headers.append('Set-Cookie', visitCookie);
    }

    return new Response(null, {
      status: 302,
      headers
    });
  }

  return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
}

function getCookieValue(cookieHeader, name) {
  if (!cookieHeader) return null;

  const parts = cookieHeader.split(';');
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const equalsIndex = trimmed.indexOf('=');
    if (equalsIndex === -1) continue;
    const key = trimmed.slice(0, equalsIndex).trim();
    if (key !== name) continue;
    return trimmed.slice(equalsIndex + 1);
  }

  return null;
}

function buildSetCookieHeader(name, value, { maxAgeSeconds, secure }) {
  const pieces = [`${name}=${value}`, 'Path=/'];
  if (maxAgeSeconds !== undefined && maxAgeSeconds !== null) {
    pieces.push(`Max-Age=${maxAgeSeconds}`);
  }
  pieces.push('SameSite=Lax', 'HttpOnly');
  if (secure) pieces.push('Secure');
  return pieces.join('; ');
}

function sanitizeNextPath(value) {
  if (typeof value !== 'string' || value.length === 0) return null;
  if (!value.startsWith('/')) return null;
  if (value.startsWith('//')) return null;
  if (/[\r\n]/.test(value)) return null;
  return value;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
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

async function deriveAccessCookieValue(secret) {
  const raw = await sha256Base64(`lm_access_cookie_v1|${secret}`);
  return raw.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function buildAccessDeniedResponse(request, corsHeaders) {
  const url = new URL(request.url);
  const accessUrl = `/__access?next=${encodeURIComponent(url.pathname + url.search)}`;
  const acceptsHtml = (request.headers.get('Accept') || '').includes('text/html');

  if (acceptsHtml && request.method === 'GET') {
    return new Response(getAccessDeniedPage({ accessUrl }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'text/html', 'Cache-Control': 'no-store' }
    });
  }

  return new Response(JSON.stringify({
    error: 'Unauthorized',
    message: 'Unlock this private demo via /__access and retry.',
    access_url: accessUrl
  }), {
    status: 401,
    headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });
}

async function readAccessGateBody(request) {
  const contentType = request.headers.get('Content-Type') || '';

  if (contentType.includes('application/json')) {
    const body = await request.json().catch(() => null);
    return {
      token: body && typeof body.token === 'string' ? body.token : null,
      next: body && typeof body.next === 'string' ? body.next : null
    };
  }

  const form = await request.formData().catch(() => null);
  if (form) {
    const token = form.get('token');
    const next = form.get('next');
    return {
      token: typeof token === 'string' ? token : token ? String(token) : null,
      next: typeof next === 'string' ? next : next ? String(next) : null
    };
  }

  return { token: null, next: null };
}

	function generateToken() {
	  return 'tok_' + Math.random().toString(36).substr(2, 16) + Date.now().toString(36);
	}

	function randomHex(byteLength) {
	  const bytes = new Uint8Array(byteLength);
	  crypto.getRandomValues(bytes);
	  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
	}

	function randomUuid() {
	  const hex = randomHex(16);
	  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
	}

	function looksHtmlEntityEncoded(value) {
	  return typeof value === 'string' && /&(amp|lt|gt|quot|#39);/i.test(value);
	}

	async function sha256Hex(input) {
	  const encoder = new TextEncoder();
	  const data = encoder.encode(input);
	  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
	  const hashArray = Array.from(new Uint8Array(hashBuffer));
	  return hashArray.map((byte) => byte.toString(16).padStart(2, '0')).join('');
	}

	async function deriveFlowAToken(flowaSession, purpose) {
	  const hash = await sha256Hex(`flowa_v1|${purpose}|${flowaSession}`);
	  return `tok_${hash.slice(0, 32)}`;
	}

	async function deriveFlowASessionId(flowaSession, purpose) {
	  const hash = await sha256Hex(`flowa_v1|${purpose}|${flowaSession}`);
	  return `sess_${hash.slice(0, 14)}`;
	}

	async function deriveNastyToken(nastySessionId, purpose) {
	  const hash = await sha256Hex(`nasty_v1|${purpose}|${nastySessionId}`);
	  return `ntok_${hash.slice(0, 32)}`;
	}

	async function deriveNastyCsrf(nastySessionId) {
	  // Generates a token containing & characters that will be HTML-entity-encoded
	  const hash = await sha256Hex(`nasty_csrf|${nastySessionId}`);
	  return `ntok_${hash.slice(0, 12)}&sig=${hash.slice(12, 24)}&v=${hash.slice(24, 32)}`;
	}

	async function deriveFlowBToken(flowbSession, purpose) {
	  const hash = await sha256Hex(`flowb_v1|${purpose}|${flowbSession}`);
	  const left = hash.slice(0, 16);
	  const right = hash.slice(16, 32);
	  return `tok_${left}&sig=${right}`;
	}

	function generateFillerString(targetLength = 400000) {
	  // Generate highly random content that doesn't compress well
	  // Using crypto.getRandomValues for true randomness that defeats gzip
	  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
	  const charsLen = chars.length;
  const result = new Array(targetLength);

  // Generate in chunks of 65536 (max for getRandomValues)
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

  return result.join('');
}

async function sha256Base64(input) {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashString = String.fromCharCode.apply(null, hashArray);
  return btoa(hashString);
}

async function buildLargeViewState(sessionId, sessionToken, userId) {
  const timestamp = new Date().toISOString();
  const nonce = generateToken();
  const payloadBase = `${sessionToken}|${sessionId}|${userId}|${nonce}|${timestamp}`;
  const signature = await sha256Base64(payloadBase);
  const filler = generateFillerString(); // ~400KB raw to exceed 128k-token contexts

  const stateObject = {
    v: '1.0',
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

// Shared styling and branding
const LOGO_IMAGE_PATH = '/images/loadmagic-shadow.png';

const BASE_STYLES = `
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

function renderHeader(title, subtitle = '') {
  return `
    <header class="topbar">
      <img src="${LOGO_IMAGE_PATH}" alt="LoadMagic.AI logo" class="logo">
      <div class="titles">
        <p class="eyebrow">LoadMagic.AI</p>
        <h1>${title}</h1>
        ${subtitle ? `<p class="subtitle">${subtitle}</p>` : ''}
      </div>
      <nav class="nav">
        <a href="/">Home</a>
        <a href="/products">Products</a>
        <a href="/login">Login</a>
        <a href="/dashboard">Dashboard</a>
        <a href="/dashboard1">Dashboard1</a>
        <a href="/nasty">Nasty Flow</a>
      </nav>
    </header>
  `;
}

function getAccessGatePage({ error = null, status = null, next = '/' } = {}) {
  const safeNext = escapeHtml(next);
  const notice = error
    ? `<div class="error"><strong>Access denied:</strong> ${escapeHtml(error)}</div>`
    : status === 'already_unlocked'
      ? `<div class="success"><strong>Already unlocked.</strong> You can continue.</div>`
      : status === 'logged_out'
        ? `<div class="info"><strong>Logged out.</strong> Access cookie cleared.</div>`
        : status === 'visit_required'
          ? `<div class="info"><strong>Per-visit access enabled.</strong> Enter the access token to continue.</div>`
        : `<div class="info"><strong>Private demo.</strong> Enter the access token to continue.</div>`;

  const actions = status === 'already_unlocked'
    ? `
      <p><a href="${safeNext}">Continue to ${safeNext}</a></p>
      <p><a href="/__access?logout=1">Log out</a></p>
    `
    : `
      <form method="POST" action="/__access" style="display: grid; gap: 10px; max-width: 520px;">
        <label for="token">Access token</label>
        <input id="token" name="token" type="password" autocomplete="current-password" required />
        <input type="hidden" name="next" value="${safeNext}" />
        <button type="submit">Unlock</button>
      </form>
      <p style="margin-top: 12px; color: var(--muted);">After unlocking, a session cookie is set so HAR exports typically keep access intact.</p>
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
      <h2 class="section-title">LoadMagic – Private Demo</h2>
      ${notice}
      <p style="margin-top: 12px;">Next: <code>${safeNext}</code></p>
      ${actions}
    </div>
  </div>
</body>
</html>`;
}

function getAccessDeniedPage({ accessUrl } = {}) {
  const safeAccessUrl = escapeHtml(accessUrl || '/__access');
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

// HTML Pages
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
    ${renderHeader('LoadMagic Test Demo', 'Dark mode experience for LoadMagic.AI correlation flows')}
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
              <li><a href="/nasty">Nasty Flow</a> (cascading silent failure checkout)</li>
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
      </script>
  </body>
  </html>`;
  }
  
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
    ${renderHeader('Login', 'Generate fresh tokens for correlation')}
    <div class="content">
      <div class="card form-card">
        <h2 class="section-title">Login Form</h2>
        <form onsubmit="handleLogin(event)">
            <input type="text" id="username" placeholder="Username" required>
            <input type="password" id="password" placeholder="Password" required>
            <button type="submit">Login</button>
        </form>
        
        <div id="result"></div>
        
        <p><a href="/">← Back to Home</a></p>
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
      </script>
  </body>
  </html>`;
  }
  
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
    ${renderHeader('Dashboard', 'Authenticated flows and multi-step tokens')}
    <div class="content">
      <div class="card session-info" id="session-info">
          <h3>Session Information</h3>
          <p>Loading session data...</p>
          <p id="session-warning" style="display:none; color:#fbbf24; font-weight:600; margin-top:8px;">
            No session token detected. Please login first (Home → Login) to generate fresh tokens. Clear browser storage if you suspect stale data.
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
      
      <p><a href="/">← Back to Home</a> | <a href="/login">Login</a></p>
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
      </script>
  </body>
  </html>`;
  }

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
    ${renderHeader('Dashboard1', 'Short + large state correlation test')}
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
            No session token detected. Please login first (Home → Login) to generate fresh tokens. Clear browser storage if you suspect stale data.
          </p>
      </div>

			      <div class="card test-section">
			          <h3>[INFO] Test Flow Overview</h3>
			          <p>Six correlation edge-case packs in one place: tiny numeric IDs (Steps 1-2), oversized signed viewstate (Steps 3-4), bulk JSON payloads (Steps 5-6), header-only token + cookies (Steps 7-8), ambiguity/scope + 200 decoys (Steps 9-10), and HTML-encoded token handling with noise (Steps 11-12).</p>
			          <ul>
			            <li><strong>Short values:</strong> 1-9 IDs that break naive regexes.</li>
			            <li><strong>Large viewstate:</strong> ~500KB base64 payload with nonce + signature that must be replayed intact.</li>
			            <li><strong>Bulk JSON:</strong> 500KB+ request bodies with hundreds of items and a buried validation code.</li>
			            <li><strong>Headers + cookies:</strong> extract token from response header and replay into header + body.</li>
				            <li><strong>Ambiguity + decoys + scope:</strong> 200 candidates; real token is nested (<code>meta.csrf</code>) and scope matters (<code>admin.sessionId</code>).</li>
			            <li><strong>Encoding + noise:</strong> HTML entity decoding plus static + random noise that must be ignored.</li>
			          </ul>

          <div class="step-box">
              <h4>Step 1: Get Dynamic shortID</h4>
              <p>Call <code>POST /api/dashboard1/step1</code> to receive a short dynamic ID (1-9)</p>
              <button onclick="runStep1()">▶ Run Step 1</button>
          </div>

          <div class="step-box">
              <h4>Step 2: Use Dynamic shortID</h4>
              <p>Call <code>POST /api/dashboard1/step2</code> with the shortID from Step 1</p>
              <button onclick="runStep2()" class="btn-step2" id="step2Button" disabled>▶ Run Step 2</button>
              <small style="display: block; margin-top: 5px; color: var(--muted);">Enabled after Step 1 completes</small>
          </div>

          <div class="step-box heavy">
              <h4>Step 3: Generate Large Viewstate</h4>
              <p>Call <code>POST /api/dashboard1/step3</code> with full session data to generate a signed, ~530KB <code>__VIEWSTATE</code>-style payload. Capture the base64 value for replay.</p>
              <button onclick="runStep3()" class="btn-step3" id="step3Button">▶ Run Step 3</button>
              <small class="note">Requires session_token + session_id + user_id; ~400KB raw / ~530KB base64 (exceeds LLM token limits).</small>
          </div>

          <div class="step-box heavy">
              <h4>Step 4: Replay Viewstate</h4>
              <p>Call <code>POST /api/dashboard1/step4</code> with the exact viewstate from Step 3. Server validates signature, size (&gt;=60kb), and embedded session metadata.</p>
              <button onclick="runStep4()" class="btn-step4" id="step4Button" disabled>▶ Run Step 4</button>
              <small class="note">Enabled after Step 3 succeeds</small>
          </div>

          <div class="step-box heavy">
              <h4>Step 5: Send Huge JSON Payload + Large Response</h4>
              <p>Call <code>POST /api/dashboard1/step5</code> with 500KB+ JSON (800+ items). Response returns ~400KB+ with batch_id and validation code buried in the large response.</p>
              <button onclick="runStep5()" class="btn-step3" id="step5Button">▶ Run Step 5</button>
              <small class="note">Client sends ~800KB request; server returns ~400KB response (both exceed LLM token limits).</small>
          </div>

	          <div class="step-box heavy">
	              <h4>Step 6: Validate Batch Correlation</h4>
	              <p>Call <code>POST /api/dashboard1/step6</code> with the batch_id + validation_code from Step 5. Server recomputes and confirms correctness.</p>
	              <button onclick="runStep6()" class="btn-step4" id="step6Button" disabled>▶ Run Step 6</button>
	              <small class="note">Enabled after Step 5 succeeds</small>
	          </div>

		          <div class="step-box">
		              <h4>Step 7: Flow A1 Start (Header Token + Cookies)</h4>
		              <p>Call <code>POST /api/dashboard1/step7</code>. Extract <code>X-CSRF-TOKEN</code> from response headers and persist the <code>flowa_session</code> cookie. Body contains a decoy <code>csrf</code>.</p>
		              <button onclick="runStep7()" id="step7Button">▶ Run Step 7</button>
		          </div>

		          <div class="step-box">
		              <h4>Step 8: Flow A1 Confirm (Header ↔ Body)</h4>
		              <p>Call <code>POST /api/dashboard1/step8</code> using <code>X-CSRF-TOKEN</code> in BOTH request header and body (<code>csrf</code>). Server fails unless you replay the exact value from Step 7.</p>
		              <button onclick="runStep8()" class="btn-step2" id="step8Button" disabled>▶ Run Step 8</button>
		              <small class="note">Enabled after Step 7 succeeds</small>
		          </div>

		          <div class="step-box">
		              <h4>Step 9: Flow A2 Start (Ambiguity + 200 Decoys + Scope)</h4>
		              <p>Call <code>POST /api/dashboard1/step9</code> to receive ambiguous candidates and 200 decoys. The real next token is <code>meta.csrf</code>, and the correct scoped session is <code>admin.sessionId</code>.</p>
		              <button onclick="runStep9()" class="btn-step3" id="step9Button">▶ Run Step 9</button>
		          </div>

		          <div class="step-box">
		              <h4>Step 10: Flow A2 Confirm (Body → Header + Scope)</h4>
		              <p>Call <code>POST /api/dashboard1/step10</code> with <code>meta.csrf</code> from Step 9 in BOTH body (<code>csrf</code>) and <code>X-FlowA-CSRF</code> header, and send <code>admin.sessionId</code> in <code>X-Admin-SessionId</code>.</p>
		              <button onclick="runStep10()" class="btn-step4" id="step10Button" disabled>▶ Run Step 10</button>
		              <small class="note">Enabled after Step 9 succeeds</small>
		          </div>

		          <div class="step-box">
		              <h4>Step 11: Flow B Start (HTML‑Encoded Token + Noise)</h4>
		              <p>Call <code>POST /api/dashboard1/step11</code> (returns <code>text/html</code>). Extract <code>csrf_html</code> from the HTML response (you’ll see <code>&amp;amp;</code>), decode HTML entities, and persist the <code>flowb_session</code> cookie. The HTML also contains static + random noise fields that should NOT be reused.</p>
		              <button onclick="runStep11()" id="step11Button">▶ Run Step 11</button>
		          </div>

		          <div class="step-box">
		              <h4>Step 12: Flow B Confirm (Decoded Token)</h4>
		              <p>Call <code>POST /api/dashboard1/step12</code> with the decoded token in BOTH header (<code>X-HTML-CSRF</code>) and JSON body (<code>csrf</code>). Server rejects the HTML‑encoded form.</p>
		              <button onclick="runStep12()" class="btn-step4" id="step12Button" disabled>▶ Run Step 12</button>
		              <small class="note">Enabled after Step 11 succeeds</small>
		          </div>
			      </div>

      <div class="card" id="test-results"></div>

      <div class="nav-links card">
          <a href="/">← Home</a> |
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
			      let flowA1CsrfA = null;
			      let flowA2CsrfB = null;
			      let flowA2AdminSessionId = null;
			      let flowBEncodedCsrf = null;
			      let flowBRawCsrf = null;

	      function decodeHtmlEntities(value) {
	          const textarea = document.createElement('textarea');
	          textarea.innerHTML = value;
	          return textarea.value;
	      }

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

	      async function runStep7() {
	          try {
	              showResult('info', '[ASYNC] Running Step 7: Flow A start (header token + cookies)...');
	
	              const response = await fetch('/api/dashboard1/step7', {
	                  method: 'POST',
	                  headers: { 'Content-Type': 'application/json' },
	                  body: JSON.stringify({})
	              });
	
	              const data = await response.json();
	              const csrfHeader = response.headers.get('X-CSRF-TOKEN');
	
		              if (response.ok && data.success && csrfHeader) {
		                  flowA1CsrfA = csrfHeader;
	
		                  const step8Button = document.getElementById('step8Button');
		                  if (step8Button) step8Button.disabled = false;
	
		                  showResult('success', '[OK] Step 7 completed. Captured X-CSRF-TOKEN header.', {
		                      step: 7,
		                      captured: { 'X-CSRF-TOKEN': csrfHeader },
		                      response: data
		                  });
	              } else {
	                  showResult('error', 'Step 7 failed: ' + (data.error || 'Missing X-CSRF-TOKEN header'), data);
	              }
	          } catch (error) {
	              showResult('error', 'Network error in Step 7: ' + error.message);
	          }
	      }

		      async function runStep8() {
		          if (!flowA1CsrfA) {
		              showResult('error', 'Missing X-CSRF-TOKEN from Step 7. Run Step 7 first.');
		              return;
		          }

		          try {
		              showResult('info', '[ASYNC] Running Step 8: Flow A1 confirm (header↔body)...');
	
		              const response = await fetch('/api/dashboard1/step8', {
		                  method: 'POST',
		                  headers: {
		                      'Content-Type': 'application/json',
		                      'X-CSRF-TOKEN': flowA1CsrfA
		                  },
		                  body: JSON.stringify({
		                      csrf: flowA1CsrfA
		                  })
		              });
	
		              const data = await response.json();
	
		              if (response.ok && data.success) {
		                  showResult('success', '[OK] Step 8 completed. Flow A1 validated.', data);
		              } else {
		                  showResult('error', 'Step 8 failed: ' + (data.error || 'Unknown error'), data);
		              }
		          } catch (error) {
	              showResult('error', 'Network error in Step 8: ' + error.message);
	          }
	      }

		      async function runStep9() {
		          try {
		              showResult('info', '[ASYNC] Running Step 9: Flow A2 start (ambiguity + decoys + scope)...');

		              const response = await fetch('/api/dashboard1/step9', {
		                  method: 'POST',
		                  headers: { 'Content-Type': 'application/json' },
		                  body: JSON.stringify({ decoy_count: 200 })
		              });

		              const data = await response.json();

		              if (response.ok && data.success) {
		                  flowA2CsrfB = data && data.meta ? data.meta.csrf : null;
		                  flowA2AdminSessionId = data && data.admin ? data.admin.sessionId : null;

		                  const step10Button = document.getElementById('step10Button');
		                  if (step10Button) step10Button.disabled = false;

		                  showResult('success', '[OK] Step 9 completed. Captured meta.csrf + admin.sessionId.', {
		                      step: 9,
		                      captured: {
		                          'meta.csrf': flowA2CsrfB,
		                          'admin.sessionId': flowA2AdminSessionId
		                      }
		                  });
		              } else {
		                  showResult('error', 'Step 9 failed: ' + (data.error || 'Unknown error'), data);
		              }
		          } catch (error) {
		              showResult('error', 'Network error in Step 9: ' + error.message);
		          }
		      }

		      async function runStep10() {
		          if (!flowA2CsrfB || !flowA2AdminSessionId) {
		              showResult('error', 'Missing Flow A2 data. Run Step 9 first to capture meta.csrf and admin.sessionId.');
		              return;
		          }

		          try {
		              showResult('info', '[ASYNC] Running Step 10: Flow A2 confirm (body→header + scope)...');

		              const response = await fetch('/api/dashboard1/step10', {
		                  method: 'POST',
		                  headers: {
		                      'Content-Type': 'application/json',
		                      'X-FlowA-CSRF': flowA2CsrfB,
		                      'X-Admin-SessionId': flowA2AdminSessionId
		                  },
		                  body: JSON.stringify({
		                      csrf: flowA2CsrfB
		                  })
		              });

		              const data = await response.json();

		              if (response.ok && data.success) {
		                  showResult('success', '[OK] Step 10 completed. Flow A2 validated.', data);
		              } else {
		                  showResult('error', 'Step 10 failed: ' + (data.error || 'Unknown error'), data);
		              }
		          } catch (error) {
		              showResult('error', 'Network error in Step 10: ' + error.message);
		          }
		      }

		      async function runStep11() {
		          try {
		              showResult('info', '[ASYNC] Running Step 11: Flow B start (HTML-encoded token + noise)...');

		              const response = await fetch('/api/dashboard1/step11', {
		                  method: 'POST',
		                  headers: { 'Content-Type': 'application/json' },
		                  body: JSON.stringify({})
		              });

		              const html = await response.text();
		              const match = html.match(/name="csrf_html" value="([^"]+)"/);
		              const encoded = match ? match[1] : null;
		              const decoded = encoded ? decodeHtmlEntities(encoded) : null;

		              if (response.ok && encoded && decoded) {
		                  flowBEncodedCsrf = encoded;
		                  flowBRawCsrf = decoded;

		                  const step12Button = document.getElementById('step12Button');
		                  if (step12Button) step12Button.disabled = false;

		                  showResult('success', '[OK] Step 11 completed. Extracted + decoded csrf_html from HTML.', {
		                      step: 11,
		                      extracted: {
		                          csrf_html_encoded: encoded,
		                          csrf_html_decoded: decoded
		                      }
		                  });
		              } else {
		                  showResult('error', 'Step 11 failed: missing csrf_html in HTML response', {
		                      status: response.status,
		                      html_hint: html.substring(0, 300) + '...'
		                  });
		              }
		          } catch (error) {
		              showResult('error', 'Network error in Step 11: ' + error.message);
		          }
		      }

		      async function runStep12() {
		          if (!flowBRawCsrf) {
		              showResult('error', 'Missing decoded csrf_html token from Step 11. Run Step 11 first.');
		              return;
		          }

		          try {
		              showResult('info', '[ASYNC] Running Step 12: Flow B confirm (decoded token)...');

		              const response = await fetch('/api/dashboard1/step12', {
		                  method: 'POST',
		                  headers: {
		                      'Content-Type': 'application/json',
		                      'X-HTML-CSRF': flowBRawCsrf
		                  },
		                  body: JSON.stringify({
		                      csrf: flowBRawCsrf
		                  })
		              });

		              const data = await response.json();

		              if (response.ok && data.success) {
		                  showResult('success', '[OK] Step 12 completed. Flow B validated.', {
		                      response: data,
		                      used: {
		                          header: flowBRawCsrf,
		                          body: flowBRawCsrf,
		                          encoded_example: flowBEncodedCsrf
		                      }
		                  });
		              } else {
		                  showResult('error', 'Step 11 failed: ' + (data.error || 'Unknown error'), data);
		              }
		          } catch (error) {
		              showResult('error', 'Network error in Step 12: ' + error.message);
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
      </script>
  </body>
  </html>`;
  }

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
    ${renderHeader('Checkout', 'Dark-mode checkout with body-auth correlation')}
    <div class="content">
      <div id="user-status" class="card user-status">
          <p>Loading session status...</p>
      </div>
      
      <div class="checkout-grid">
        <div class="checkout-section">
            <h3>[PACKAGE] Mock Cart Items</h3>
            <div id="cart-summary">
                <p>• Laptop Pro - $1299.99</p>
                <p>• Wireless Mouse - $29.99</p>
                <hr>
                <p><strong>Total: $1329.98</strong></p>
            </div>
        </div>
        
        <div class="checkout-section">
            <h3>💳 Payment Information</h3>
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
            <h3>📍 Shipping Address</h3>
            <div class="form-group">
                <label>Full Name:</label>
                <input type="text" id="fullName" placeholder="John Doe">
            </div>
            <div class="form-group">
                <label>Address:</label>
                <textarea id="address" rows="3" placeholder="123 Main St\nAnytown, ST 12345"></textarea>
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
      
      <p><a href="/products">← Back to Products</a> | <a href="/">Home</a></p>
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
      </script>
  </body>
  </html>`;
  }
  
function getProductDetailPage(request) {
  const url = new URL(request.url);
  const productId = url.pathname.split('/').pop();
  
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
    ${renderHeader('Product Details', 'View catalog entries for correlation')}
    <div class="content">
      <h2>Product Details</h2>
      
      <div id="user-status" class="card user-status">
          <p>Loading user status...</p>
      </div>
      
      <div id="product-detail" class="loading card">Loading product ${productId}...</div>
      
      <div class="card" style="margin-top: 10px;">
          <a href="/products">← Back to Products</a> | 
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
                          '<button onclick="checkSimilar(\'' + product.category + '\')">View Similar Products</button>' +
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
      </script>
  </body>
  </html>`;
  }
  
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
    ${renderHeader('Products', 'Browse catalog entries for correlation')}
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
      
      <p><a href="/">← Back to Home</a></p>
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

      </script>
  </body>
  </html>`;
  }

// ============================================================================
// NASTY FLOW — Cascading Silent Failure Checkout Demo
// ============================================================================

// Init — Self-contained user creation for multi-threaded testing
async function handleNastyInit(request, env, corsHeaders) {
  let body = {};
  try { body = await request.json(); } catch (e) { /* empty body OK, defaults to count=1 */ }
  const count = Math.min(Math.max(parseInt(body.count) || 1, 1), 50);

  const users = [];
  for (let i = 0; i < count; i++) {
    const suffix = generateToken().slice(0, 8);
    const username = `nasty_${suffix}`;
    const password = `np_${generateToken().slice(0, 8)}`;
    const passwordHash = `hash${password}`;
    const email = `${username}@loadmagic.test`;
    const sessionToken = generateToken();

    // Insert user
    const result = await env.DB.prepare(
      'INSERT INTO users (username, password_hash, email, session_token) VALUES (?, ?, ?, ?)'
    ).bind(username, passwordHash, email, sessionToken).run();

    const userId = result.meta?.last_row_id;

    users.push({
      user_id: userId,
      username: username,
      password: password,
      session_token: sessionToken,
      ready: true
    });
  }

  return new Response(JSON.stringify({ users }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Sticky session route validation — returns 502 "Bad Gateway" on mismatch (like a real LB)
function validateRouteId(request, session, corsHeaders) {
  const cookieHeader = request.headers.get('Cookie');
  const routeCookie = getCookieValue(cookieHeader, 'ROUTEID');
  if (!routeCookie || routeCookie !== session.route_id) {
    return new Response(JSON.stringify({ error: 'Bad Gateway' }), {
      status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  return null; // valid
}

// T1: Home — Mixed Extraction Types + Sticky Session Cookie
async function handleNastyHome(request, env, corsHeaders) {
  const { session_token, user_id } = await request.json();

  if (!session_token || !user_id) {
    return new Response(JSON.stringify({
      error: 'Missing required fields',
      required: ['session_token', 'user_id'],
      hint: 'Use /api/nasty/init to create a session'
    }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const user = await env.DB.prepare('SELECT id FROM users WHERE session_token = ? AND id = ?')
    .bind(session_token, user_id).first();
  if (!user) {
    return new Response(JSON.stringify({ error: 'Invalid session' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const nastySessionId = 'nsess_' + generateToken();
  // Short 4-char visitorId (echoes Dashboard1 short-ID challenge)
  const visitorId = Math.random().toString(36).substr(2, 4);
  const journeyId = 'jrn_' + generateToken();

  // Generate sticky session route ID (simulates load balancer affinity cookie)
  const routeHash = await sha256Hex(`route|${nastySessionId}`);
  const routeId = 'srv_' + routeHash.slice(0, 8);

  await env.DB.prepare(
    'INSERT INTO nasty_flow_sessions (user_id, nasty_session_id, visitor_id, journey_id, route_id) VALUES (?, ?, ?, ?, ?)'
  ).bind(user.id, nastySessionId, visitorId, journeyId, routeId).run();

  const homeResponse = new Response(JSON.stringify({
    success: true,
    page: 'home',
    visitorId: visitorId,
    nastySessionId: nastySessionId,
    metadata: {
      pageLoadId: generateToken(),
      serverTime: new Date().toISOString(),
      tracking: {
        journeyId: journeyId,
        source: 'direct',
        campaign: null
      }
    }
  }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Visitor-Id': visitorId, 'X-Journey-Id': journeyId } });
  homeResponse.headers.append('Set-Cookie', `nasty_session=${nastySessionId}; Path=/; HttpOnly; SameSite=Lax`);
  homeResponse.headers.append('Set-Cookie', `ROUTEID=${routeId}; Path=/; SameSite=Lax`);
  return homeResponse;
}

// T2: Login Page — HTML + Entity Encoding + Decoys + 30s Expiry
async function handleNastyLoginPage(request, env, corsHeaders) {
  const { nasty_session_id } = await request.json();
  const cookieHeader = request.headers.get('Cookie');
  const cookieSession = getCookieValue(cookieHeader, 'nasty_session');

  if (!nasty_session_id || !cookieSession) {
    return new Response(JSON.stringify({
      error: 'Missing nasty_session_id or nasty_session cookie',
      hint: 'Run T1 (Home) first'
    }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const session = await env.DB.prepare(
    'SELECT * FROM nasty_flow_sessions WHERE nasty_session_id = ?'
  ).bind(nasty_session_id).first();
  if (!session) {
    return new Response(JSON.stringify({ error: 'Invalid nasty session' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  const routeError = validateRouteId(request, session, corsHeaders);
  if (routeError) return routeError;

  // Generate tokens
  const csrfToken = await deriveNastyCsrf(nasty_session_id);
  const authFlowId = 'aflow_' + generateToken();
  const pageInstanceId = 'pinst_' + generateToken();
  const csrfCreatedAt = new Date().toISOString();

  // Dynamic field name suffix — per-session, forces dynamic regex extraction
  const fieldSuffixHash = await sha256Hex(nasty_session_id + 'field_salt');
  const fieldSuffix = fieldSuffixHash.slice(0, 4);
  const csrfFieldName = `csrf_${fieldSuffix}`;
  const aflowFieldName = `aflow_${fieldSuffix}`;

  // Store in DB (include field_name_suffix for T3 validation)
  await env.DB.prepare(
    'UPDATE nasty_flow_sessions SET csrf_token = ?, auth_flow_id = ?, page_instance_id = ?, csrf_token_created_at = ?, field_name_suffix = ? WHERE nasty_session_id = ?'
  ).bind(csrfToken, authFlowId, pageInstanceId, csrfCreatedAt, fieldSuffix, nasty_session_id).run();

  // HTML-entity-encode the CSRF token (contains & characters)
  const encodedCsrf = escapeHtml(csrfToken);

  // Generate 200 decoy hidden inputs
  const decoyInputs = [];
  for (let i = 1; i <= 200; i++) {
    const num = String(i).padStart(3, '0');
    decoyInputs.push(`    <input type="hidden" name="decoy_${num}" value="${escapeHtml(generateToken())}" />`);
  }

  // Decoy CSRF in the <script> block (NOT the real one)
  const decoyCsrfMeta = await deriveNastyToken(nasty_session_id, 'decoy_csrf');

  const html = `<!DOCTYPE html>
<html lang="en">
<head><title>Login - LoadMagic Demo</title></head>
<body>
  <h1>Login</h1>
  <form id="loginForm" method="POST" action="/api/nasty/login-submit">
    <input type="hidden" name="${csrfFieldName}" value="${encodedCsrf}" />
    <input type="hidden" name="${aflowFieldName}" value="${authFlowId}" />
${decoyInputs.join('\n')}
    <div>
      <label for="username">Username:</label>
      <input type="text" id="username" name="username" value="testuser1" />
    </div>
    <div>
      <label for="password">Password:</label>
      <input type="password" id="password" name="password" value="123" />
    </div>
    <button type="submit">Sign In</button>
  </form>
  <script>
    window.__PAGE_STATE__ = {
      pageInstanceId: "${pageInstanceId}",
      formConfig: { method: "POST", action: "/api/nasty/login-submit" },
      csrfMeta: "${decoyCsrfMeta}"
    };
  </script>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'text/html' }
  });
}

// T3: Login Submit — Silent Partial Auth (The Trap)
async function handleNastyLoginSubmit(request, env, corsHeaders) {
  const body = await request.json();
  const { page_instance_id, username, password, nasty_session_id } = body;
  const cookieHeader = request.headers.get('Cookie');
  const cookieSession = getCookieValue(cookieHeader, 'nasty_session');

  if (!nasty_session_id || !cookieSession) {
    return new Response(JSON.stringify({
      error: 'Missing session', hint: 'Run T1 and T2 first'
    }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const session = await env.DB.prepare(
    'SELECT * FROM nasty_flow_sessions WHERE nasty_session_id = ?'
  ).bind(nasty_session_id).first();
  if (!session) {
    return new Response(JSON.stringify({ error: 'Invalid nasty session' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  const routeErr3 = validateRouteId(request, session, corsHeaders);
  if (routeErr3) return routeErr3;

  // Extract CSRF and auth_flow_id from dynamic field names
  const fieldSuffix = session.field_name_suffix || '';
  const csrfFieldName = `csrf_${fieldSuffix}`;
  const aflowFieldName = `aflow_${fieldSuffix}`;
  const csrf_token = body[csrfFieldName];
  const auth_flow_id = body[aflowFieldName];

  // Validate credentials
  const user = await env.DB.prepare('SELECT id, username, email FROM users WHERE username = ? AND password_hash = ?')
    .bind(username || '', `hash${password || ''}`).first();

  // Check all conditions for full auth
  let authLevel = 'full';
  let degradeReason = null;

  // Check CSRF — reject if still HTML-encoded
  if (!csrf_token) {
    authLevel = 'guest-upgraded';
    degradeReason = 'missing csrf_token';
  } else if (looksHtmlEntityEncoded(csrf_token)) {
    authLevel = 'guest-upgraded';
    degradeReason = 'csrf_token still HTML-encoded';
  } else if (csrf_token !== session.csrf_token) {
    authLevel = 'guest-upgraded';
    degradeReason = 'csrf_token mismatch';
  }

  // Check CSRF expiry (30 seconds)
  if (authLevel === 'full' && session.csrf_token_created_at) {
    const csrfAge = Date.now() - new Date(session.csrf_token_created_at).getTime();
    if (csrfAge > 30000) {
      authLevel = 'guest-upgraded';
      degradeReason = 'csrf_token expired (30s limit)';
    }
  }

  // Check auth_flow_id
  if (authLevel === 'full' && auth_flow_id !== session.auth_flow_id) {
    authLevel = 'guest-upgraded';
    degradeReason = 'auth_flow_id mismatch';
  }

  // Check page_instance_id
  if (authLevel === 'full' && page_instance_id !== session.page_instance_id) {
    authLevel = 'guest-upgraded';
    degradeReason = 'page_instance_id mismatch';
  }

  // Check credentials
  if (!user) {
    authLevel = 'guest-upgraded';
    degradeReason = degradeReason || 'invalid credentials';
  }

  // Generate tokens based on auth level
  const accessToken = authLevel === 'full'
    ? await deriveNastyToken(nasty_session_id, 'access_token_full')
    : await deriveNastyToken(nasty_session_id, 'access_token_guest');
  const customerContextId = authLevel === 'full'
    ? 'cctx_' + generateToken()
    : null;

  // Update session
  await env.DB.prepare(
    'UPDATE nasty_flow_sessions SET auth_level = ?, customer_context_id = ?, access_token = ? WHERE nasty_session_id = ?'
  ).bind(authLevel, customerContextId, accessToken, nasty_session_id).run();

  const responseHeaders = {
    ...corsHeaders,
    'Content-Type': 'application/json',
    'X-Auth-Level': authLevel
  };

  // Only set auth cookie and customer context header on full auth
  if (authLevel === 'full') {
    const authCookieVal = await deriveNastyToken(nasty_session_id, 'auth_cookie');
    responseHeaders['Set-Cookie'] = `nasty_auth=${authCookieVal}; Path=/; HttpOnly; SameSite=Lax`;
    responseHeaders['X-Customer-Context'] = customerContextId;
  }

  const responseBody = {
    success: true,
    message: `Welcome back, ${user ? user.username : username}!`,
    user: {
      username: user ? user.username : username,
      displayName: user ? user.username : 'Guest User',
      authLevel: authLevel
    },
    session: {
      accessToken: accessToken,
      refreshToken: await deriveNastyToken(nasty_session_id, authLevel === 'full' ? 'refresh_full' : 'refresh_guest'),
      expiresIn: authLevel === 'full' ? 3600 : 900
    },
    metadata: {
      loginMethod: authLevel === 'full' ? 'credentials' : 'fallback',
      reauthRecommended: authLevel !== 'full',
      mfaStatus: authLevel === 'full' ? 'not_required' : 'skipped'
    }
  };

  // Only include customerContextId on full auth
  if (authLevel === 'full') {
    responseBody.user.customerContextId = customerContextId;
  }

  return new Response(JSON.stringify(responseBody), {
    status: 200,
    headers: responseHeaders
  });
}

// T4: Account Summary — SWEC Counter + Aura Fragments
async function handleNastyAccountSummary(request, env, corsHeaders) {
  const body = await request.json();
  const { nasty_session_id, access_token } = body;
  const cookieHeader = request.headers.get('Cookie');
  const cookieSession = getCookieValue(cookieHeader, 'nasty_session');
  const incomingSwec = request.headers.get('X-SWEC-Counter');

  if (!nasty_session_id || !access_token) {
    return new Response(JSON.stringify({
      error: 'Missing required fields', required: ['nasty_session_id', 'access_token']
    }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const session = await env.DB.prepare(
    'SELECT * FROM nasty_flow_sessions WHERE nasty_session_id = ? AND access_token = ?'
  ).bind(nasty_session_id, access_token).first();
  if (!session) {
    return new Response(JSON.stringify({ error: 'Invalid session or access_token' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  const routeErr4 = validateRouteId(request, session, corsHeaders);
  if (routeErr4) return routeErr4;

  // SWEC counter validation (Siebel-style strict sequencing)
  const expectedSwec = session.swec_counter + 1;
  let swecValid = true;
  if (incomingSwec !== null && incomingSwec !== undefined && String(incomingSwec) !== String(expectedSwec)) {
    swecValid = false;
  }

  // Increment counter
  const newSwec = expectedSwec;

  // Generate aura context fragments (client must assemble for T8)
  const auraFwuid = await sha256Hex(`aura_fwuid|${nasty_session_id}`);
  const fwuid = auraFwuid.slice(0, 12);
  const auraMode = 'PROD';
  const auraApp = 'store:main';

  const isFullAuth = session.auth_level === 'full';

  // Conditional: full auth gets a reward token (guest-upgraded does NOT)
  const rewardToken = isFullAuth ? 'rwt_' + generateToken() : null;

  await env.DB.prepare(
    'UPDATE nasty_flow_sessions SET swec_counter = ?, aura_fwuid = ?, aura_mode = ?, aura_app = ?, reward_token = ? WHERE nasty_session_id = ?'
  ).bind(newSwec, fwuid, auraMode, auraApp, rewardToken, nasty_session_id).run();

  const responseBody = {
    authenticated: true,
    authLevel: session.auth_level,
    account: {
      customerContextId: session.customer_context_id || undefined,
      loyaltyTier: isFullAuth ? 'gold' : 'none',
      savedAddresses: isFullAuth ? 2 : 0,
      savedPaymentMethods: isFullAuth ? 1 : 0
    },
    swecCounter: newSwec,
    swecValid: swecValid,
    auraContext: {
      fwuid: fwuid,
      mode: auraMode,
      app: auraApp
    }
  };

  // Only include loyalty block for full auth — key is ABSENT for guest-upgraded
  if (isFullAuth) {
    responseBody.loyalty = {
      tier: 'gold',
      rewardToken: rewardToken,
      pointsBalance: 2450
    };
  }

  return new Response(JSON.stringify(responseBody), {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'X-SWEC-Counter': String(newSwec),
      'X-Auth-Level': session.auth_level
    }
  });
}

// T5: Product Page — Large ViewState (~500KB+)
async function handleNastyProduct(request, env, corsHeaders) {
  const body = await request.json();
  const { nasty_session_id, access_token, swec_counter } = body;
  const cookieHeader = request.headers.get('Cookie');
  const cookieSession = getCookieValue(cookieHeader, 'nasty_session');

  if (!nasty_session_id || !access_token) {
    return new Response(JSON.stringify({
      error: 'Missing required fields', required: ['nasty_session_id', 'access_token']
    }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const session = await env.DB.prepare(
    'SELECT * FROM nasty_flow_sessions WHERE nasty_session_id = ? AND access_token = ?'
  ).bind(nasty_session_id, access_token).first();
  if (!session) {
    return new Response(JSON.stringify({ error: 'Invalid session' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  const routeErr5 = validateRouteId(request, session, corsHeaders);
  if (routeErr5) return routeErr5;

  // Increment SWEC
  const newSwec = session.swec_counter + 1;

  // Generate product view token
  const productViewToken = 'pvt_' + generateToken();

  // Build large viewstate (~530KB base64)
  const vsResult = await buildLargeViewState(nasty_session_id, access_token, String(session.user_id));

  await env.DB.prepare(
    'UPDATE nasty_flow_sessions SET swec_counter = ?, product_view_token = ?, viewstate_signature = ? WHERE nasty_session_id = ?'
  ).bind(newSwec, productViewToken, vsResult.signature, nasty_session_id).run();

  return new Response(JSON.stringify({
    product: {
      id: 'SKU-1001',
      name: 'Premium Wireless Headphones',
      price: 249.99,
      currency: 'GBP',
      stock: 42,
      category: 'Electronics'
    },
    viewState: vsResult.viewstate,
    viewStateSignature: vsResult.signature,
    viewStateLength: vsResult.rawLength,
    productViewToken: productViewToken,
    swecCounter: newSwec
  }), {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'X-SWEC-Counter': String(newSwec)
    }
  });
}

// T6: Add to Basket — Large Payload Replay + Basket Versioning
async function handleNastyBasketAdd(request, env, corsHeaders) {
  const body = await request.json();
  const { nasty_session_id, access_token, product_view_token, view_state, view_state_signature, product_id, quantity, swec_counter } = body;

  if (!nasty_session_id || !access_token || !product_view_token) {
    return new Response(JSON.stringify({
      error: 'Missing required fields',
      required: ['nasty_session_id', 'access_token', 'product_view_token', 'view_state', 'view_state_signature']
    }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const session = await env.DB.prepare(
    'SELECT * FROM nasty_flow_sessions WHERE nasty_session_id = ? AND access_token = ?'
  ).bind(nasty_session_id, access_token).first();
  if (!session) {
    return new Response(JSON.stringify({ error: 'Invalid session' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  const routeErr6 = validateRouteId(request, session, corsHeaders);
  if (routeErr6) return routeErr6;

  // Idempotency key — required, must be unique per request
  const idempotencyKey = request.headers.get('Idempotency-Key');
  if (!idempotencyKey) {
    return new Response(JSON.stringify({ error: 'Missing required header' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Check if this idempotency key was already used by ANY session
  const existingIdem = await env.DB.prepare(
    'SELECT idempotency_response FROM nasty_flow_sessions WHERE idempotency_key = ?'
  ).bind(idempotencyKey).first();
  if (existingIdem && existingIdem.idempotency_response) {
    // Return the cached response — may be from a DIFFERENT session (silent cross-thread data)
    return new Response(existingIdem.idempotency_response, {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Validate product_view_token
  if (product_view_token !== session.product_view_token) {
    return new Response(JSON.stringify({
      error: 'Invalid product_view_token',
      hint: 'Token must match the one from T5 (Product page)'
    }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  // Validate viewstate signature
  if (view_state_signature && view_state_signature !== session.viewstate_signature) {
    return new Response(JSON.stringify({
      error: 'ViewState signature mismatch',
      hint: 'The viewstate was tampered with or not replayed correctly'
    }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  // Validate viewstate is present and large enough
  if (!view_state || view_state.length < 50000) {
    return new Response(JSON.stringify({
      error: 'ViewState missing or too small',
      hint: 'The full ~530KB viewstate from T5 must be replayed',
      receivedLength: view_state ? view_state.length : 0
    }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  // Increment SWEC
  const newSwec = session.swec_counter + 1;

  // Create basket
  const basketId = 'bsk_' + generateToken();
  const isFullAuth = session.auth_level === 'full';
  const ownership = isFullAuth ? 'authenticated' : 'anonymous';

  const basePrice = 249.99;
  const memberDiscount = isFullAuth ? 25.00 : 0;

  const basketResponseBody = JSON.stringify({
    success: true,
    basket: {
      basketId: basketId,
      basketVersion: 1,
      ownership: ownership,
      mergePending: !isFullAuth,
      items: [{ sku: product_id || 'SKU-1001', qty: quantity || 1, price: basePrice, name: 'Premium Wireless Headphones' }],
      subtotal: basePrice,
      memberDiscount: memberDiscount,
      total: basePrice - memberDiscount
    },
    swecCounter: newSwec
  });

  // Store basket + idempotency key + cached response
  await env.DB.prepare(
    'UPDATE nasty_flow_sessions SET swec_counter = ?, basket_id = ?, basket_version = 1, basket_ownership = ?, idempotency_key = ?, idempotency_response = ? WHERE nasty_session_id = ?'
  ).bind(newSwec, basketId, ownership, idempotencyKey, basketResponseBody, nasty_session_id).run();

  return new Response(basketResponseBody, {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'X-Basket-Id': basketId,
      'X-Basket-Version': '1',
      'X-SWEC-Counter': String(newSwec)
    }
  });
}

// T7: Basket Page — Version Drift
async function handleNastyBasket(request, env, corsHeaders) {
  const body = await request.json();
  const { nasty_session_id, access_token, basket_id, basket_version, swec_counter } = body;

  if (!nasty_session_id || !access_token || !basket_id) {
    return new Response(JSON.stringify({
      error: 'Missing required fields', required: ['nasty_session_id', 'access_token', 'basket_id']
    }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const session = await env.DB.prepare(
    'SELECT * FROM nasty_flow_sessions WHERE nasty_session_id = ? AND access_token = ?'
  ).bind(nasty_session_id, access_token).first();
  if (!session) {
    return new Response(JSON.stringify({ error: 'Invalid session' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  const routeErr7 = validateRouteId(request, session, corsHeaders);
  if (routeErr7) return routeErr7;

  if (basket_id !== session.basket_id) {
    return new Response(JSON.stringify({ error: 'basket_id mismatch' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Increment SWEC
  const newSwec = session.swec_counter + 1;

  // Server applies background promo calc → bumps basket_version to 2
  const serverVersion = 2;
  const versionConflict = (basket_version !== undefined && Number(basket_version) !== session.basket_version);

  const isFullAuth = session.auth_level === 'full';
  const basePrice = 249.99;
  const promoApplied = isFullAuth && !versionConflict;
  const discount = promoApplied ? 25.00 : 0;

  await env.DB.prepare(
    'UPDATE nasty_flow_sessions SET swec_counter = ?, basket_version = ? WHERE nasty_session_id = ?'
  ).bind(newSwec, serverVersion, nasty_session_id).run();

  return new Response(JSON.stringify({
    basket: {
      basketId: session.basket_id,
      basketVersion: serverVersion,
      ownership: session.basket_ownership,
      items: [{ sku: 'SKU-1001', qty: 1, price: basePrice, name: 'Premium Wireless Headphones' }],
      promoApplied: promoApplied ? 'MEMBER10' : null,
      subtotal: basePrice,
      discount: discount,
      total: basePrice - discount,
      versionConflictResolved: versionConflict,
      promoDropped: versionConflict && isFullAuth
    },
    swecCounter: newSwec
  }), {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'X-Basket-Version': String(serverVersion),
      'X-SWEC-Counter': String(newSwec)
    }
  });
}

// T8: Start Checkout — Client-Assembled Value + Silent Flow Rebuild
async function handleNastyCheckoutStart(request, env, corsHeaders) {
  const body = await request.json();
  const { nasty_session_id, access_token, basket_id, basket_version, aura_context, swec_counter } = body;

  if (!nasty_session_id || !access_token || !basket_id) {
    return new Response(JSON.stringify({
      error: 'Missing required fields',
      required: ['nasty_session_id', 'access_token', 'basket_id', 'basket_version', 'aura_context']
    }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const session = await env.DB.prepare(
    'SELECT * FROM nasty_flow_sessions WHERE nasty_session_id = ? AND access_token = ?'
  ).bind(nasty_session_id, access_token).first();
  if (!session) {
    return new Response(JSON.stringify({ error: 'Invalid session' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  const routeErr8 = validateRouteId(request, session, corsHeaders);
  if (routeErr8) return routeErr8;

  // Increment SWEC
  const newSwec = session.swec_counter + 1;

  // Validate aura_context (client-assembled from T4 fragments)
  const expectedAura = `${session.aura_fwuid};${session.aura_mode};${session.aura_app}`;
  const auraValid = aura_context === expectedAura;

  // Validate request fingerprint — client must compute sha256(session_id|basket_id|version|aura)
  const incomingFingerprint = request.headers.get('X-Request-Fingerprint');
  const expectedFingerprintInput = `${nasty_session_id}|${basket_id}|${basket_version}|${aura_context}`;
  const expectedFingerprint = await sha256Hex(expectedFingerprintInput);
  const fingerprintValid = incomingFingerprint === expectedFingerprint;

  // Check overall state consistency (fingerprint mismatch also triggers rebuild)
  const stateConsistent = (
    session.auth_level === 'full' &&
    basket_id === session.basket_id &&
    Number(basket_version) === session.basket_version &&
    auraValid &&
    fingerprintValid
  );

  const flowRecovered = !stateConsistent;
  const checkoutFlowId = flowRecovered
    ? 'cflow_rebuilt_' + generateToken()
    : 'cflow_' + generateToken();
  const requestVerificationToken = 'rvt_' + generateToken();

  const isFullAuth = session.auth_level === 'full';
  const total = isFullAuth && !flowRecovered ? 224.99 : 249.99;

  await env.DB.prepare(
    'UPDATE nasty_flow_sessions SET swec_counter = ?, checkout_flow_id = ?, flow_recovered = ?, request_verification_token = ? WHERE nasty_session_id = ?'
  ).bind(newSwec, checkoutFlowId, flowRecovered ? 1 : 0, requestVerificationToken, nasty_session_id).run();

  return new Response(JSON.stringify({
    success: true,
    checkout: {
      checkoutFlowId: checkoutFlowId,
      flowRecovered: flowRecovered,
      recoveryMode: flowRecovered ? 'state-rebuilt' : null,
      basketSnapshot: { version: session.basket_version, total: total },
      deliveryAddressRequired: true,
      requestVerificationToken: requestVerificationToken
    },
    swecCounter: newSwec
  }), {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'X-Checkout-Flow-Id': checkoutFlowId,
      'X-Flow-Recovered': String(flowRecovered),
      'X-SWEC-Counter': String(newSwec)
    }
  });
}

// T9: Delivery Options — Header-Only Token
async function handleNastyDeliveryOptions(request, env, corsHeaders) {
  const body = await request.json();
  const { nasty_session_id, checkout_flow_id, basket_id, basket_version, swec_counter } = body;

  if (!nasty_session_id || !checkout_flow_id) {
    return new Response(JSON.stringify({
      error: 'Missing required fields', required: ['nasty_session_id', 'checkout_flow_id']
    }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const session = await env.DB.prepare(
    'SELECT * FROM nasty_flow_sessions WHERE nasty_session_id = ?'
  ).bind(nasty_session_id).first();
  if (!session) {
    return new Response(JSON.stringify({ error: 'Invalid session' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  const routeErr9 = validateRouteId(request, session, corsHeaders);
  if (routeErr9) return routeErr9;

  // Increment SWEC
  const newSwec = session.swec_counter + 1;

  // Check if checkout_flow_id matches
  const flowMatches = checkout_flow_id === session.checkout_flow_id;
  const isDegraded = session.flow_recovered === 1 || !flowMatches;

  // Generate delivery quote token tied to the ACTUAL flow
  const deliveryQuoteToken = await deriveNastyToken(
    nasty_session_id,
    `delivery_quote|${session.checkout_flow_id}|${session.basket_version}`
  );

  // Conditional: non-degraded full-auth gets premium option + premium quote token
  const premiumQuoteToken = (!isDegraded && session.auth_level === 'full')
    ? 'pqt_' + generateToken()
    : null;

  await env.DB.prepare(
    'UPDATE nasty_flow_sessions SET swec_counter = ?, delivery_quote_token = ?, premium_quote_token = ? WHERE nasty_session_id = ?'
  ).bind(newSwec, deliveryQuoteToken, premiumQuoteToken, nasty_session_id).run();

  // Delivery quote token is ONLY in the header, never in the JSON body
  const deliveryOptions = isDegraded
    ? [
        { id: 'standard', label: 'Standard (3-5 days)', price: 4.99 },
        { id: 'express', label: 'Express (next day)', price: 12.99 }
      ]
    : [
        { id: 'standard', label: 'Standard (3-5 days)', price: 4.99 },
        { id: 'express', label: 'Express (next day)', price: 12.99 },
        { id: 'premium', label: 'Premium (same day)', price: 24.99 }
      ];

  const responseHeaders = {
    ...corsHeaders,
    'Content-Type': 'application/json',
    'X-Delivery-Quote': deliveryQuoteToken,
    'X-SWEC-Counter': String(newSwec)
  };
  // Premium quote token only present for non-degraded full-auth — header absent otherwise
  if (premiumQuoteToken) {
    responseHeaders['X-Premium-Quote'] = premiumQuoteToken;
  }

  return new Response(JSON.stringify({
    deliveryOptions: deliveryOptions,
    selectedOption: 'standard',
    quoteStatus: isDegraded ? 'fallback' : 'confirmed',
    deliveryEta: isDegraded ? '3-7 business days' : '2026-03-27',
    swecCounter: newSwec
  }), {
    status: 200,
    headers: responseHeaders
  });
}

// T10: Payment Page — HTML Response with Mixed Extraction
async function handleNastyPayment(request, env, corsHeaders) {
  const body = await request.json();
  const { nasty_session_id, checkout_flow_id, delivery_quote_token, swec_counter } = body;
  const headerDeliveryQuote = request.headers.get('X-Delivery-Quote');

  if (!nasty_session_id || !checkout_flow_id) {
    return new Response(JSON.stringify({
      error: 'Missing required fields', required: ['nasty_session_id', 'checkout_flow_id', 'delivery_quote_token']
    }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const session = await env.DB.prepare(
    'SELECT * FROM nasty_flow_sessions WHERE nasty_session_id = ?'
  ).bind(nasty_session_id).first();
  if (!session) {
    return new Response(JSON.stringify({ error: 'Invalid session' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  const routeErr10 = validateRouteId(request, session, corsHeaders);
  if (routeErr10) return routeErr10;

  // Increment SWEC
  const newSwec = session.swec_counter + 1;

  // Check delivery quote token matches (dual: body + header)
  const bodyQuoteValid = delivery_quote_token === session.delivery_quote_token;
  const headerQuoteValid = headerDeliveryQuote === session.delivery_quote_token;
  const isDegraded = session.flow_recovered === 1 || !bodyQuoteValid || !headerQuoteValid;

  // Generate payment tokens
  const paymentNonce = isDegraded
    ? 'pnonce_fallback_' + generateToken()
    : 'pnonce_' + generateToken();
  const pricingSignature = await sha256Base64(
    `pricing|${session.checkout_flow_id}|${session.basket_id}|${session.basket_version}|${paymentNonce}`
  );

  // Decoy nonce
  const decoyNonce = 'pnonce_backup_' + generateToken();

  await env.DB.prepare(
    'UPDATE nasty_flow_sessions SET swec_counter = ?, payment_nonce = ?, pricing_signature = ? WHERE nasty_session_id = ?'
  ).bind(newSwec, paymentNonce, pricingSignature, nasty_session_id).run();

  const isFullAuth = session.auth_level === 'full';
  const loyaltyDiscount = isFullAuth && !isDegraded ? 25.00 : 0;

  const html = `<!DOCTYPE html>
<html lang="en">
<head><title>Payment - LoadMagic Demo</title></head>
<body>
  <h1>Payment Details</h1>
  <form id="paymentForm" method="POST" action="/api/nasty/confirm-order">
    <input type="hidden" name="payment_nonce" value="${paymentNonce}" />
    <input type="hidden" name="pricing_signature" value="${escapeHtml(pricingSignature)}" />
    <input type="hidden" name="payment_nonce_backup" value="${decoyNonce}" />
    <input type="hidden" name="checkout_flow_id" value="${session.checkout_flow_id}" />
    <div>
      <label>Card Number:</label>
      <input type="text" value="4111 1111 1111 1111" readonly />
    </div>
    <button type="submit">Confirm Order</button>
  </form>
  <script>
    window.__PAYMENT_BOOTSTRAP__ = {
      riskMode: "${isDegraded ? 'review' : 'standard'}",
      customerVerified: ${!isDegraded},
      loyaltyDiscount: ${loyaltyDiscount},
      paymentMethods: ${isDegraded ? '["visa"]' : '["visa", "mastercard", "amex"]'},
      pricingSignature: "${pricingSignature}"
    };
  </script>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/html',
      'X-Payment-Nonce': paymentNonce,
      'X-Pricing-Sig': pricingSignature,
      'X-SWEC-Counter': String(newSwec)
    }
  });
}

// T11: Confirm Order — Explosion
async function handleNastyConfirmOrder(request, env, corsHeaders) {
  const body = await request.json();
  const {
    nasty_session_id, checkout_flow_id, basket_id, basket_version,
    delivery_quote_token, payment_nonce, pricing_signature, swec_counter,
    reward_token, premium_quote_token
  } = body;
  const cookieHeader = request.headers.get('Cookie');
  const cookieSession = getCookieValue(cookieHeader, 'nasty_session');
  const cookieAuth = getCookieValue(cookieHeader, 'nasty_auth');

  if (!nasty_session_id) {
    return new Response(JSON.stringify({ error: 'Missing nasty_session_id' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const session = await env.DB.prepare(
    'SELECT * FROM nasty_flow_sessions WHERE nasty_session_id = ?'
  ).bind(nasty_session_id).first();
  if (!session) {
    return new Response(JSON.stringify({ error: 'Invalid session' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  const routeErr11 = validateRouteId(request, session, corsHeaders);
  if (routeErr11) return routeErr11;

  // Run ALL checks and collect results
  const checks = {};

  // Auth level
  checks.authLevelCheck = session.auth_level === 'full'
    ? 'PASS' : `FAIL: expected 'full', got '${session.auth_level}'`;

  // Auth cookie
  const expectedAuthCookie = session.auth_level === 'full'
    ? await deriveNastyToken(nasty_session_id, 'auth_cookie')
    : null;
  checks.authCookieCheck = cookieAuth && cookieAuth === expectedAuthCookie
    ? 'PASS' : `FAIL: nasty_auth cookie ${cookieAuth ? 'invalid' : 'missing'}`;

  // Basket ownership
  checks.basketOwnershipCheck = session.basket_ownership === 'authenticated'
    ? 'PASS' : `FAIL: expected 'authenticated', got '${session.basket_ownership}'`;

  // Checkout flow
  checks.checkoutFlowCheck = checkout_flow_id === session.checkout_flow_id
    ? (session.flow_recovered ? 'WARN: flow was rebuilt (stale flow ID matched rebuilt flow)' : 'PASS')
    : `FAIL: checkout_flow_id mismatch`;

  checks.flowRecoveryCheck = session.flow_recovered === 0
    ? 'PASS' : 'FAIL: flow was rebuilt (flowRecovered: true)';

  // Basket
  checks.basketIdCheck = basket_id === session.basket_id
    ? 'PASS' : `FAIL: basket_id mismatch`;
  checks.basketVersionCheck = Number(basket_version) === session.basket_version
    ? 'PASS' : `FAIL: expected version ${session.basket_version}, got ${basket_version}`;

  // Delivery quote
  checks.deliveryQuoteCheck = delivery_quote_token === session.delivery_quote_token
    ? 'PASS' : 'FAIL: delivery_quote_token mismatch (may be tied to wrong flow)';

  // Payment
  checks.paymentNonceCheck = payment_nonce === session.payment_nonce
    ? 'PASS' : 'FAIL: payment_nonce mismatch';
  checks.pricingSignatureCheck = pricing_signature === session.pricing_signature
    ? 'PASS' : 'FAIL: pricing_signature mismatch';

  // SWEC counter
  const expectedSwec = session.swec_counter + 1;
  checks.sequenceCounterCheck = String(swec_counter) === String(expectedSwec)
    ? 'PASS' : `FAIL: expected SWEC ${expectedSwec}, got ${swec_counter}`;

  // Session cookie
  checks.sessionCookieCheck = cookieSession === nasty_session_id
    ? 'PASS' : 'FAIL: nasty_session cookie mismatch';

  // Conditional tokens — only checked if they SHOULD be present
  if (session.auth_level === 'full') {
    checks.rewardTokenCheck = reward_token === session.reward_token
      ? 'PASS' : 'FAIL: reward_token mismatch';
  }
  if (session.premium_quote_token) {
    checks.premiumQuoteCheck = premium_quote_token === session.premium_quote_token
      ? 'PASS' : 'FAIL: premium_quote_token mismatch';
  }

  // Determine if all passed
  const allPassed = Object.values(checks).every(v => v === 'PASS');
  const failures = Object.entries(checks).filter(([, v]) => v.startsWith('FAIL'));

  if (allPassed) {
    return new Response(JSON.stringify({
      success: true,
      order: {
        orderId: 'ORD-' + Date.now().toString(36).toUpperCase(),
        confirmationNumber: 'CNF' + Math.random().toString(36).substr(2, 8).toUpperCase(),
        status: 'confirmed',
        total: 224.99,
        currency: 'GBP',
        authLevel: 'full',
        basketOwnership: 'authenticated',
        flowIntegrity: 'intact'
      },
      diagnostics: checks,
      message: 'Order placed successfully!'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // EXPLOSION — HTTP 500 with diagnostics
  // Trace the root cause
  let rootCause = 'Unknown';
  const breadcrumbs = [];

  if (checks.authLevelCheck.startsWith('FAIL')) {
    rootCause = 'Authentication degraded at Transaction 3 (login-submit). All downstream state was built on guest-upgraded context.';
    breadcrumbs.push("T3: authLevel was 'guest-upgraded' (not 'full') — likely stale csrf_token, expired csrf, or wrong auth_flow_id/page_instance_id");
  }
  if (checks.basketOwnershipCheck.startsWith('FAIL')) {
    breadcrumbs.push("T6: basket created with 'anonymous' ownership (consequence of partial auth)");
  }
  if (checks.flowRecoveryCheck.startsWith('FAIL')) {
    breadcrumbs.push('T8: checkout flow was rebuilt (flowRecovered: true) — state inconsistency detected');
  }
  if (checks.deliveryQuoteCheck.startsWith('FAIL')) {
    breadcrumbs.push('T9: delivery quote token tied to rebuilt flow, not the original');
  }
  if (checks.paymentNonceCheck.startsWith('FAIL')) {
    breadcrumbs.push('T10: payment nonce generated in fallback mode');
  }
  if (checks.pricingSignatureCheck.startsWith('FAIL')) {
    breadcrumbs.push('T10: pricing signature mismatch — computed against wrong flow state');
  }

  if (!rootCause.startsWith('Auth') && checks.flowRecoveryCheck.startsWith('FAIL')) {
    rootCause = 'Checkout flow was silently rebuilt at Transaction 8 due to state inconsistency. Downstream tokens (delivery quote, payment nonce) were tied to the rebuilt flow.';
  }

  return new Response(JSON.stringify({
    error: 'ORDER_STATE_RECONCILIATION_FAILED',
    status: 500,
    message: 'Unable to process order: internal state reconciliation failed',
    diagnostics: checks,
    failureCount: failures.length,
    rootCauseHint: rootCause,
    breadcrumbs: breadcrumbs
  }), {
    status: 500,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// ============================================================================
// Nasty Flow HTML Page
// ============================================================================
function getNastyFlowPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <title>Nasty Flow - LoadMagic Test Demo</title>
  <style>
    ${BASE_STYLES}

    .flow-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 12px;
      max-width: 900px;
      margin: 0 auto;
    }

    .step-box {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .step-num {
      background: var(--accent);
      color: #fff;
      border-radius: 50%;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      flex-shrink: 0;
    }

    .step-info { flex: 1; }
    .step-info h3 { margin: 0 0 4px; color: var(--fg); font-size: 14px; }
    .step-info p { margin: 0; color: var(--muted); font-size: 12px; }

    .edge-case-tag {
      display: inline-block;
      background: rgba(0, 200, 150, 0.15);
      color: #00c896;
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 4px;
      margin-top: 4px;
    }

    .step-btn {
      background: var(--accent);
      color: #fff;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 12px;
      white-space: nowrap;
    }
    .step-btn:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }
    .step-btn:hover:not(:disabled) { opacity: 0.85; }

    .step-status {
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 4px;
      flex-shrink: 0;
    }
    .status-pass { background: rgba(0,200,100,0.15); color: #00c864; }
    .status-degraded { background: rgba(255,170,0,0.15); color: #ffaa00; }
    .status-fail { background: rgba(255,60,60,0.15); color: #ff3c3c; }
    .status-pending { background: rgba(150,150,150,0.1); color: var(--muted); }

    .result-area {
      background: #0a0e18;
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 16px;
      margin-top: 16px;
      max-height: 400px;
      overflow-y: auto;
      font-family: monospace;
      font-size: 12px;
      color: var(--fg);
      white-space: pre-wrap;
      word-break: break-all;
    }

    .session-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
      font-size: 12px;
    }
    .session-card h3 { margin: 0 0 8px; color: var(--fg); }
    .session-card code { color: var(--accent); }

    .run-all-btn {
      background: linear-gradient(135deg, var(--accent), #00c896);
      color: #fff;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 16px;
    }
    .run-all-btn:hover { opacity: 0.9; }
  </style>
</head>
<body>
  ${renderHeader('Nasty Flow', 'Cascading silent failure checkout — 11 transactions, layered corruption')}
  <div class="content" style="max-width: 960px; margin: 0 auto; padding: 24px;">

    <div class="session-card" id="sessionInfo">
      <h3>Session</h3>
      <p>Click <strong>Initialize</strong> to create a fresh user, or use existing login credentials.</p>
      <button class="step-btn" onclick="initSession()" id="initBtn" style="margin-bottom:8px">Initialize Session</button>
      <p>Username: <code id="dispUsername">—</code></p>
      <p>Session Token: <code id="dispSessionToken">—</code></p>
      <p>User ID: <code id="dispUserId">—</code></p>
    </div>

    <button class="run-all-btn" onclick="runAllSteps()">Run All Steps (Golden Path)</button>

    <div class="flow-grid">
      <div class="step-box" id="stepBox1">
        <div class="step-num">1</div>
        <div class="step-info">
          <h3>Home Page</h3>
          <p>Establishes nasty session, generates visitorId + journeyId</p>
          <span class="edge-case-tag">Mixed extraction + ROUTEID sticky session cookie</span>
        </div>
        <span class="step-status status-pending" id="status1">pending</span>
        <button class="step-btn" onclick="runStep(1)">Run</button>
      </div>

      <div class="step-box" id="stepBox2">
        <div class="step-num">2</div>
        <div class="step-info">
          <h3>Login Page</h3>
          <p>Returns HTML with dynamic field names, entity-encoded CSRF, 200 decoys, pageInstanceId in script</p>
          <span class="edge-case-tag">Dynamic field names + HTML entities + 200 decoys + 30s expiry</span>
        </div>
        <span class="step-status status-pending" id="status2">pending</span>
        <button class="step-btn" onclick="runStep(2)" disabled id="btn2">Run</button>
      </div>

      <div class="step-box" id="stepBox3">
        <div class="step-num">3</div>
        <div class="step-info">
          <h3>Login Submit</h3>
          <p>Validates tokens — full auth or silent partial auth (HTTP 200 either way!)</p>
          <span class="edge-case-tag">Silent failure: partial auth on stale/encoded tokens</span>
        </div>
        <span class="step-status status-pending" id="status3">pending</span>
        <button class="step-btn" onclick="runStep(3)" disabled id="btn3">Run</button>
      </div>

      <div class="step-box" id="stepBox4">
        <div class="step-num">4</div>
        <div class="step-info">
          <h3>Account Summary</h3>
          <p>SWEC counter validation + aura context fragments for assembly</p>
          <span class="edge-case-tag">SWEC counter + aura fragments + conditional loyalty block</span>
        </div>
        <span class="step-status status-pending" id="status4">pending</span>
        <button class="step-btn" onclick="runStep(4)" disabled id="btn4">Run</button>
      </div>

      <div class="step-box" id="stepBox5">
        <div class="step-num">5</div>
        <div class="step-info">
          <h3>Product Page</h3>
          <p>Returns product details + ~530KB viewstate blob + productViewToken</p>
          <span class="edge-case-tag">Large ViewState (~500KB+ base64) for externalized extraction</span>
        </div>
        <span class="step-status status-pending" id="status5">pending</span>
        <button class="step-btn" onclick="runStep(5)" disabled id="btn5">Run</button>
      </div>

      <div class="step-box" id="stepBox6">
        <div class="step-num">6</div>
        <div class="step-info">
          <h3>Add to Basket</h3>
          <p>Replays ~530KB viewstate + creates basket (authenticated or anonymous)</p>
          <span class="edge-case-tag">Large payload replay + Idempotency-Key header + basket ownership</span>
        </div>
        <span class="step-status status-pending" id="status6">pending</span>
        <button class="step-btn" onclick="runStep(6)" disabled id="btn6">Run</button>
      </div>

      <div class="step-box" id="stepBox7">
        <div class="step-num">7</div>
        <div class="step-info">
          <h3>Basket Page</h3>
          <p>Server bumps version (promo calc), detects version drift</p>
          <span class="edge-case-tag">Version drift: versionConflictResolved breadcrumb</span>
        </div>
        <span class="step-status status-pending" id="status7">pending</span>
        <button class="step-btn" onclick="runStep(7)" disabled id="btn7">Run</button>
      </div>

      <div class="step-box" id="stepBox8">
        <div class="step-num">8</div>
        <div class="step-info">
          <h3>Start Checkout</h3>
          <p>Validates client-assembled aura_context — silent flow rebuild on mismatch</p>
          <span class="edge-case-tag">Client-assembled value + X-Request-Fingerprint + silent flow rebuild</span>
        </div>
        <span class="step-status status-pending" id="status8">pending</span>
        <button class="step-btn" onclick="runStep(8)" disabled id="btn8">Run</button>
      </div>

      <div class="step-box" id="stepBox9">
        <div class="step-num">9</div>
        <div class="step-info">
          <h3>Delivery Options</h3>
          <p>Delivery quote token is ONLY in X-Delivery-Quote response header</p>
          <span class="edge-case-tag">Header-only extraction + conditional X-Premium-Quote</span>
        </div>
        <span class="step-status status-pending" id="status9">pending</span>
        <button class="step-btn" onclick="runStep(9)" disabled id="btn9">Run</button>
      </div>

      <div class="step-box" id="stepBox10">
        <div class="step-num">10</div>
        <div class="step-info">
          <h3>Payment Page</h3>
          <p>HTML response: nonce in hidden field, pricingSignature in embedded script</p>
          <span class="edge-case-tag">HTML + embedded script JSON + dual header/body validation</span>
        </div>
        <span class="step-status status-pending" id="status10">pending</span>
        <button class="step-btn" onclick="runStep(10)" disabled id="btn10">Run</button>
      </div>

      <div class="step-box" id="stepBox11">
        <div class="step-num">11</div>
        <div class="step-info">
          <h3>Confirm Order</h3>
          <p>Full state reconciliation — success or HTTP 500 with root cause diagnostics</p>
          <span class="edge-case-tag">Explosion: all checks, rootCauseHint, breadcrumbs</span>
        </div>
        <span class="step-status status-pending" id="status11">pending</span>
        <button class="step-btn" onclick="runStep(11)" disabled id="btn11">Run</button>
      </div>
    </div>

    <div class="result-area" id="resultArea">Results will appear here...</div>
  </div>

  <script>
    // Flow state
    const state = {
      session_token: null,
      user_id: null,
      username: null,
      password: null,
      nasty_session_id: null,
      visitor_id: null,
      journey_id: null,
      csrf_field_name: null,
      csrf_token: null,
      aflow_field_name: null,
      auth_flow_id: null,
      page_instance_id: null,
      access_token: null,
      swec_counter: 0,
      aura_fwuid: null,
      aura_mode: null,
      aura_app: null,
      reward_token: null,
      product_view_token: null,
      view_state: null,
      view_state_signature: null,
      basket_id: null,
      basket_version: null,
      checkout_flow_id: null,
      delivery_quote_token: null,
      premium_quote_token: null,
      payment_nonce: null,
      pricing_signature: null
    };

    async function initSession() {
      log('--- Initializing Session ---');
      const res = await fetch('/api/nasty/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: 1 })
      });
      const data = await res.json();
      if (data.users && data.users.length > 0) {
        const u = data.users[0];
        state.session_token = u.session_token;
        state.user_id = u.user_id;
        state.username = u.username;
        state.password = u.password;
        document.getElementById('dispUsername').textContent = u.username;
        document.getElementById('dispSessionToken').textContent = u.session_token.slice(0, 16) + '...';
        document.getElementById('dispUserId').textContent = u.user_id;
        document.getElementById('initBtn').disabled = true;
        document.getElementById('initBtn').textContent = 'Initialized';
        log('User created: ' + u.username + ' (ID: ' + u.user_id + ')');
      } else {
        log('ERROR: Init failed - ' + JSON.stringify(data));
      }
    }

    // SHA-256 hex helper for request fingerprint
    async function sha256hex(str) {
      const data = new TextEncoder().encode(str);
      const hash = await crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // Display session info
    document.getElementById('dispSessionToken').textContent = '—';
    document.getElementById('dispUserId').textContent = '—';

    function log(msg) {
      const area = document.getElementById('resultArea');
      area.textContent += msg + '\\n';
      area.scrollTop = area.scrollHeight;
    }

    function setStatus(step, status, label) {
      const el = document.getElementById('status' + step);
      el.className = 'step-status status-' + status;
      el.textContent = label || status;
    }

    function enableBtn(step) {
      const btn = document.getElementById('btn' + step);
      if (btn) btn.disabled = false;
    }

    async function runStep(step) {
      log('\\n--- Step ' + step + ' ---');
      setStatus(step, 'pending', 'running...');
      try {
        switch(step) {
          case 1: await stepHome(); break;
          case 2: await stepLoginPage(); break;
          case 3: await stepLoginSubmit(); break;
          case 4: await stepAccountSummary(); break;
          case 5: await stepProduct(); break;
          case 6: await stepBasketAdd(); break;
          case 7: await stepBasket(); break;
          case 8: await stepCheckoutStart(); break;
          case 9: await stepDeliveryOptions(); break;
          case 10: await stepPayment(); break;
          case 11: await stepConfirmOrder(); break;
        }
      } catch(e) {
        setStatus(step, 'fail', 'error');
        log('ERROR: ' + e.message);
      }
    }

    async function runAllSteps() {
      document.getElementById('resultArea').textContent = '';
      // Auto-init if no session
      if (!state.session_token) {
        await initSession();
      }
      for (let i = 1; i <= 11; i++) {
        await runStep(i);
        // Small delay between steps
        await new Promise(r => setTimeout(r, 200));
      }
    }

    async function stepHome() {
      if (!state.session_token) {
        log('No session — initializing...');
        await initSession();
      }
      const res = await fetch('/api/nasty/home', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_token: state.session_token, user_id: Number(state.user_id) })
      });
      const data = await res.json();
      log(JSON.stringify(data, null, 2));
      if (data.success) {
        state.nasty_session_id = data.nastySessionId;
        state.visitor_id = data.visitorId;
        state.journey_id = data.metadata.tracking.journeyId;
        setStatus(1, 'pass', 'done');
        enableBtn(2);
      } else {
        setStatus(1, 'fail', 'failed');
      }
    }

    async function stepLoginPage() {
      const res = await fetch('/api/nasty/login-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nasty_session_id: state.nasty_session_id })
      });
      const html = await res.text();
      // Extract CSRF from DYNAMIC field name (csrf_XXXX) and decode HTML entities
      const csrfMatch = html.match(/name="(csrf_[a-z0-9]{4})"\\s+value="([^"]*)"/);
      if (csrfMatch) {
        state.csrf_field_name = csrfMatch[1];
        const ta = document.createElement('textarea');
        ta.innerHTML = csrfMatch[2];
        state.csrf_token = ta.value;
        log('Extracted ' + state.csrf_field_name + ' (decoded): ' + state.csrf_token);
      }
      // Extract auth_flow_id from DYNAMIC field name (aflow_XXXX)
      const afMatch = html.match(/name="(aflow_[a-z0-9]{4})"\\s+value="([^"]*)"/);
      if (afMatch) {
        state.aflow_field_name = afMatch[1];
        state.auth_flow_id = afMatch[2];
        log('Extracted ' + state.aflow_field_name + ': ' + state.auth_flow_id);
      }
      // Extract pageInstanceId from <script> JSON
      const piMatch = html.match(/pageInstanceId:\\s*"([^"]*)"/);
      if (piMatch) {
        state.page_instance_id = piMatch[1];
        log('Extracted pageInstanceId from script: ' + state.page_instance_id);
      }
      log('(HTML response: ' + html.length + ' chars, contains 200 decoy fields)');
      setStatus(2, 'pass', 'done');
      enableBtn(3);
    }

    async function stepLoginSubmit() {
      // Build body with DYNAMIC field names
      const submitBody = {
        nasty_session_id: state.nasty_session_id,
        page_instance_id: state.page_instance_id,
        username: state.username || 'testuser1',
        password: state.password || '123'
      };
      // Use the dynamic field names extracted from T2
      if (state.csrf_field_name) submitBody[state.csrf_field_name] = state.csrf_token;
      if (state.aflow_field_name) submitBody[state.aflow_field_name] = state.auth_flow_id;

      const res = await fetch('/api/nasty/login-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitBody)
      });
      const data = await res.json();
      log(JSON.stringify(data, null, 2));
      state.access_token = data.session.accessToken;
      const authLevel = data.user.authLevel;
      if (authLevel === 'full') {
        setStatus(3, 'pass', 'full auth');
      } else {
        setStatus(3, 'degraded', 'DEGRADED: ' + authLevel);
      }
      enableBtn(4);
    }

    async function stepAccountSummary() {
      state.swec_counter++;
      const res = await fetch('/api/nasty/account-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-SWEC-Counter': String(state.swec_counter)
        },
        body: JSON.stringify({
          nasty_session_id: state.nasty_session_id,
          access_token: state.access_token
        })
      });
      const data = await res.json();
      log(JSON.stringify(data, null, 2));
      state.swec_counter = data.swecCounter;
      // Capture aura fragments
      if (data.auraContext) {
        state.aura_fwuid = data.auraContext.fwuid;
        state.aura_mode = data.auraContext.mode;
        state.aura_app = data.auraContext.app;
        log('Aura fragments: ' + state.aura_fwuid + ';' + state.aura_mode + ';' + state.aura_app);
      }
      // Capture conditional loyalty reward token (only present for full auth)
      if (data.loyalty && data.loyalty.rewardToken) {
        state.reward_token = data.loyalty.rewardToken;
        log('Loyalty rewardToken: ' + state.reward_token);
      }
      setStatus(4, data.authLevel === 'full' ? 'pass' : 'degraded', data.authLevel);
      enableBtn(5);
    }

    async function stepProduct() {
      const res = await fetch('/api/nasty/product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nasty_session_id: state.nasty_session_id,
          access_token: state.access_token,
          swec_counter: state.swec_counter
        })
      });
      const data = await res.json();
      state.product_view_token = data.productViewToken;
      state.view_state = data.viewState;
      state.view_state_signature = data.viewStateSignature;
      state.swec_counter = data.swecCounter;
      log('Product: ' + data.product.name + ' - ' + data.product.price + ' ' + data.product.currency);
      log('ViewState length: ' + (data.viewState ? data.viewState.length : 0) + ' chars');
      log('productViewToken: ' + data.productViewToken);
      setStatus(5, 'pass', 'done (' + Math.round((data.viewState||'').length/1024) + 'KB viewstate)');
      enableBtn(6);
    }

    async function stepBasketAdd() {
      // Generate unique idempotency key per request
      const idempotencyKey = crypto.randomUUID();
      log('Idempotency-Key: ' + idempotencyKey);
      const res = await fetch('/api/nasty/basket-add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey },
        body: JSON.stringify({
          nasty_session_id: state.nasty_session_id,
          access_token: state.access_token,
          product_view_token: state.product_view_token,
          view_state: state.view_state,
          view_state_signature: state.view_state_signature,
          product_id: 'SKU-1001',
          quantity: 1,
          swec_counter: state.swec_counter
        })
      });
      const data = await res.json();
      log(JSON.stringify(data, null, 2));
      state.basket_id = data.basket.basketId;
      state.basket_version = data.basket.basketVersion;
      state.swec_counter = data.swecCounter;
      const ownership = data.basket.ownership;
      setStatus(6, ownership === 'authenticated' ? 'pass' : 'degraded', ownership);
      enableBtn(7);
    }

    async function stepBasket() {
      const res = await fetch('/api/nasty/basket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nasty_session_id: state.nasty_session_id,
          access_token: state.access_token,
          basket_id: state.basket_id,
          basket_version: state.basket_version,
          swec_counter: state.swec_counter
        })
      });
      const data = await res.json();
      log(JSON.stringify(data, null, 2));
      state.basket_version = data.basket.basketVersion;
      state.swec_counter = data.swecCounter;
      setStatus(7, data.basket.versionConflictResolved ? 'degraded' : 'pass',
        data.basket.versionConflictResolved ? 'version drift!' : 'v' + data.basket.basketVersion);
      enableBtn(8);
    }

    async function stepCheckoutStart() {
      const auraContext = state.aura_fwuid + ';' + state.aura_mode + ';' + state.aura_app;
      // Compute request fingerprint from 4 previously-extracted values
      const fingerprintInput = state.nasty_session_id + '|' + state.basket_id + '|' + state.basket_version + '|' + auraContext;
      const fingerprint = await sha256hex(fingerprintInput);
      log('X-Request-Fingerprint: ' + fingerprint);
      const res = await fetch('/api/nasty/checkout-start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Request-Fingerprint': fingerprint },
        body: JSON.stringify({
          nasty_session_id: state.nasty_session_id,
          access_token: state.access_token,
          basket_id: state.basket_id,
          basket_version: state.basket_version,
          aura_context: auraContext,
          swec_counter: state.swec_counter
        })
      });
      const data = await res.json();
      log(JSON.stringify(data, null, 2));
      state.checkout_flow_id = data.checkout.checkoutFlowId;
      state.swec_counter = data.swecCounter;
      setStatus(8, data.checkout.flowRecovered ? 'degraded' : 'pass',
        data.checkout.flowRecovered ? 'REBUILT!' : 'intact');
      enableBtn(9);
    }

    async function stepDeliveryOptions() {
      const res = await fetch('/api/nasty/delivery-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nasty_session_id: state.nasty_session_id,
          checkout_flow_id: state.checkout_flow_id,
          basket_id: state.basket_id,
          basket_version: state.basket_version,
          swec_counter: state.swec_counter
        })
      });
      // Token is ONLY in the header
      state.delivery_quote_token = res.headers.get('X-Delivery-Quote');
      // Conditional: premium quote token only present for non-degraded full-auth
      const premiumQuote = res.headers.get('X-Premium-Quote');
      if (premiumQuote) {
        state.premium_quote_token = premiumQuote;
        log('X-Premium-Quote header: ' + premiumQuote);
      }
      const data = await res.json();
      log(JSON.stringify(data, null, 2));
      log('X-Delivery-Quote header: ' + state.delivery_quote_token);
      state.swec_counter = data.swecCounter;
      setStatus(9, data.quoteStatus === 'confirmed' ? 'pass' : 'degraded', data.quoteStatus);
      enableBtn(10);
    }

    async function stepPayment() {
      const res = await fetch('/api/nasty/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Delivery-Quote': state.delivery_quote_token || ''
        },
        body: JSON.stringify({
          nasty_session_id: state.nasty_session_id,
          checkout_flow_id: state.checkout_flow_id,
          delivery_quote_token: state.delivery_quote_token,
          swec_counter: state.swec_counter
        })
      });
      const html = await res.text();
      // Extract payment_nonce from hidden field
      const nonceMatch = html.match(/name="payment_nonce"\\s+value="([^"]*)"/);
      if (nonceMatch) {
        state.payment_nonce = nonceMatch[1];
        log('Extracted payment_nonce: ' + state.payment_nonce);
      }
      // Extract pricingSignature from embedded script JSON
      const sigMatch = html.match(/pricingSignature:\\s*"([^"]*)"/);
      if (sigMatch) {
        state.pricing_signature = sigMatch[1];
        log('Extracted pricingSignature from script: ' + state.pricing_signature);
      }
      // Check degraded indicators
      const riskMatch = html.match(/riskMode:\\s*"([^"]*)"/);
      const riskMode = riskMatch ? riskMatch[1] : 'unknown';
      // Sync SWEC from response header (HTML response has no JSON swecCounter)
      const swecHeader = res.headers.get('X-SWEC-Counter');
      state.swec_counter = swecHeader ? parseInt(swecHeader) : (state.swec_counter || 0) + 1;
      log('riskMode: ' + riskMode);
      setStatus(10, riskMode === 'standard' ? 'pass' : 'degraded', riskMode);
      enableBtn(11);
    }

    async function stepConfirmOrder() {
      const res = await fetch('/api/nasty/confirm-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nasty_session_id: state.nasty_session_id,
          checkout_flow_id: state.checkout_flow_id,
          basket_id: state.basket_id,
          basket_version: state.basket_version,
          delivery_quote_token: state.delivery_quote_token,
          payment_nonce: state.payment_nonce,
          pricing_signature: state.pricing_signature,
          swec_counter: state.swec_counter + 1,
          reward_token: state.reward_token,
          premium_quote_token: state.premium_quote_token
        })
      });
      const data = await res.json();
      log(JSON.stringify(data, null, 2));
      if (res.status === 200 && data.success) {
        setStatus(11, 'pass', 'ORDER CONFIRMED!');
      } else {
        setStatus(11, 'fail', 'HTTP ' + res.status + ' — ' + (data.failureCount || 0) + ' checks failed');
        if (data.rootCauseHint) log('\\nROOT CAUSE: ' + data.rootCauseHint);
        if (data.breadcrumbs) {
          log('\\nBREADCRUMBS:');
          data.breadcrumbs.forEach(b => log('  - ' + b));
        }
      }
    }
  </script>
</body>
</html>`;
}
