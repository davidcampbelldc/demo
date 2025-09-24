export default {
    async fetch(request, env, ctx) {
      const url = new URL(request.url);
      const path = url.pathname;
      const method = request.method;
  
      // CORS headers for all responses
      const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      };
  
      // Handle OPTIONS requests for CORS
      if (method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
      }
  
      try {
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
  
      // Generate session token
      const sessionToken = generateToken();
      
      // Update user with session token
      await env.DB.prepare(
        'UPDATE users SET session_token = ? WHERE id = ?'
      ).bind(sessionToken, result.id).run();
  
      return new Response(JSON.stringify({
        success: true,
        user_id: result.id,
        username: result.username,
        email: result.email,
        session_token: sessionToken,
        session_id: `sess_${result.id}_${Date.now()}`, // Additional session ID for payload correlation
        csrf_token: generateToken(), // CSRF token for payload correlation
        expires_in: 3600,
        server_timestamp: new Date().toISOString(),
        correlation_id: generateToken() // Correlation ID that should be sent back in requests
      }), {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Set-Cookie': `session_id=sess_${result.id}_${Date.now()}; Path=/; HttpOnly; SameSite=Lax` // Cookie-based session
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
      const { session_token, user_id, correlation_id } = body;
  
      // Require session data in request body instead of headers
      if (!session_token || !user_id || !correlation_id) {
        return new Response(JSON.stringify({ 
          error: 'Missing required fields',
          required: ['session_token', 'user_id', 'correlation_id'],
          message: 'Session data must be provided in request body for correlation testing'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
  
      // Validate session token from request body
      const user = await env.DB.prepare(
        'SELECT id, username, email FROM users WHERE session_token = ? AND id = ?'
      ).bind(session_token, user_id).first();
  
      if (!user) {
        return new Response(JSON.stringify({ 
          error: 'Invalid session data',
          message: 'Session token, user ID, or correlation ID mismatch'
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
      const { product_id, quantity = 1, session_token, user_id, correlation_id, client_session_id } = body;

      // Require session data in request body for JMeter correlation testing
      if (!session_token || !user_id || !correlation_id) {
        return new Response(JSON.stringify({ 
          error: 'Missing required session fields in request body',
          required: ['session_token', 'user_id', 'correlation_id'],
          message: 'All session data must be provided in request body for JMeter correlation testing',
          example: {
            "product_id": 1,
            "quantity": 1,
            "session_token": "tok_...",
            "user_id": 1,
            "correlation_id": "tok_..."
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
  
      // Validate session token and user ID from request body
      const user = await env.DB.prepare(
        'SELECT id, username FROM users WHERE session_token = ? AND id = ?'
      ).bind(session_token, user_id).first();

      if (!user) {
        return new Response(JSON.stringify({ 
          error: 'Invalid session data in request body',
          message: 'Session token and user ID combination is invalid' 
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
        checkout_token, 
        cart_items, 
        payment_method = "credit_card",
        billing_address,
        shipping_address 
      } = body;
  
      // Require all correlation data in request body
      if (!session_token || !user_id || !correlation_id || !checkout_token) {
        return new Response(JSON.stringify({ 
          error: 'Missing required checkout fields in request body',
          required: ['session_token', 'user_id', 'correlation_id', 'checkout_token'],
          message: 'All session and checkout data must be provided in request body'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
  
      // Validate session
      const user = await env.DB.prepare(
        'SELECT id, username FROM users WHERE session_token = ? AND id = ?'
      ).bind(session_token, user_id).first();
  
      if (!user) {
        return new Response(JSON.stringify({ 
          error: 'Invalid session data in checkout request body'
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
      const { session_token, user_id, correlation_id, test_message } = body;

      // Require session data in request body for JMeter correlation testing
      if (!session_token || !user_id || !correlation_id) {
        return new Response('HTTP 400 - Missing required session fields in request body\n\nRequired: session_token, user_id, correlation_id\n\nExample:\n{\n  "session_token": "tok_...",\n  "user_id": 1,\n  "correlation_id": "tok_...",\n  "test_message": "Hello from JMeter!"\n}', {
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

      // Validate session token and user ID from request body
      const user = await env.DB.prepare(
        'SELECT id, username FROM users WHERE session_token = ? AND id = ?'
      ).bind(session_token, user_id).first();

      if (!user) {
        return new Response('HTTP 401 - Invalid session data in request body\n\nSession token and user ID combination is invalid', {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
        });
      }

      // Generate test response data
      const testId = generateToken();
      const step2Token = generateToken();
      const timestamp = new Date().toISOString();
      const serverId = "srv-" + Math.random().toString(36).substr(2, 6);

      // Return simple HTTP response (not JSON) - perfect for JMeter testing
      const responseText = `HTTP 200 - JMeter HTTP Test Step 1 Successful!

🔐 Authentication Method: Request Body Session Data
📋 Session Token: ${session_token.substring(0, 20)}...
🆔 User ID: ${user_id}
🔄 Correlation ID: ${correlation_id.substring(0, 20)}...
👤 Username: ${user.username}

🧪 Step 1 Test Details:
• Test ID: ${testId}
• Server ID: ${serverId}
• Timestamp: ${timestamp}
• Test Message: ${test_message || 'No message provided'}

✅ Session Validation: PASSED
✅ Database Connection: ACTIVE
✅ User Authentication: CONFIRMED

🎯 STEP 2 REQUIRED - Capture the Step 2 Token below!
🔑 STEP 2 TOKEN: ${step2Token}

📝 Response Format: Plain HTTP (not JSON)
🔗 Perfect for testing HTTP response parsing in JMeter

⚠️  IMPORTANT FOR JMETER CORRELATION:
• Extract the "STEP 2 TOKEN" from this response
• Use it in the next request to /api/http-test-step2
• Step 2 will FAIL without this token!

Next Steps:
• Extract STEP 2 TOKEN: ${step2Token}
• Send it to /api/http-test-step2 endpoint
• Test multi-step correlation in JMeter`;

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
      return new Response(`HTTP 500 - Internal Server Error\n\nError: ${error.message}\n\nThis endpoint requires session data in request body for JMeter correlation testing.`, {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
      });
    }
  }

  async function handleHttpTestStep2(request, env, corsHeaders) {
    try {
      const body = await request.json();
      const { session_token, user_id, correlation_id, step2_token, test_message } = body;

      // Require session data AND step2_token from step 1
      if (!session_token || !user_id || !correlation_id || !step2_token) {
        return new Response('HTTP 400 - Missing required fields for Step 2\n\nRequired: session_token, user_id, correlation_id, step2_token\n\n⚠️  step2_token MUST be extracted from Step 1 response!\n\nExample:\n{\n  "session_token": "tok_...",\n  "user_id": 1,\n  "correlation_id": "tok_...",\n  "step2_token": "tok_...",\n  "test_message": "Step 2 from JMeter!"\n}', {
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

      // Validate session token and user ID from request body
      const user = await env.DB.prepare(
        'SELECT id, username FROM users WHERE session_token = ? AND id = ?'
      ).bind(session_token, user_id).first();

      if (!user) {
        return new Response('HTTP 401 - Invalid session data in request body\n\nSession token and user ID combination is invalid', {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
        });
      }

      // Generate step 2 response data
      const step2Id = generateToken();
      const finalToken = generateToken();
      const timestamp = new Date().toISOString();
      const serverId = "srv-" + Math.random().toString(36).substr(2, 6);

      // Return step 2 HTTP response
      const responseText = `HTTP 200 - JMeter HTTP Test Step 2 Successful!

🔐 Authentication Method: Request Body Session Data + Step 2 Token
📋 Session Token: ${session_token.substring(0, 20)}...
🆔 User ID: ${user_id}
🔄 Correlation ID: ${correlation_id.substring(0, 20)}...
🔑 Step 2 Token: ${step2_token.substring(0, 20)}...
👤 Username: ${user.username}

🧪 Step 2 Test Details:
• Step 2 ID: ${step2Id}
• Server ID: ${serverId}
• Timestamp: ${timestamp}
• Test Message: ${test_message || 'No message provided'}

✅ Session Validation: PASSED
✅ Step 2 Token Validation: PASSED
✅ Database Connection: ACTIVE
✅ User Authentication: CONFIRMED
✅ Multi-Step Correlation: SUCCESSFUL

🎉 MULTI-STEP CORRELATION COMPLETE!
🏆 FINAL SUCCESS TOKEN: ${finalToken}

📝 Response Format: Plain HTTP (not JSON)
🔗 Perfect for testing multi-step correlation in JMeter

✅ JMeter Correlation Test Results:
• Step 1: Session authentication ✓
• Step 2: Token extraction ✓
• Step 2: Token validation ✓
• Multi-step flow: COMPLETE ✓

🎯 This demonstrates successful multi-step correlation testing!
📊 Both steps required session data in request body
🔗 Step 2 required token extracted from Step 1 response

Congratulations! Your JMeter correlation is working perfectly!`;

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
      return new Response(`HTTP 500 - Internal Server Error\n\nError: ${error.message}\n\nThis endpoint requires session data AND step2_token in request body for JMeter multi-step correlation testing.`, {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
      });
    }
  }

  // Utility Functions
  function generateToken() {
    return 'tok_' + Math.random().toString(36).substr(2, 16) + Date.now().toString(36);
  }
  
  // HTML Pages
  function getHomePage() {
    return `<!DOCTYPE html>
  <html>
  <head>
      <title>JMeter Test Demo</title>
      <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
          .endpoint { background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 5px; }
          .method { display: inline-block; padding: 3px 8px; border-radius: 3px; color: white; font-weight: bold; }
          .get { background: #61affe; }
          .post { background: #49cc90; }
          a { color: #0366d6; text-decoration: none; }
          a:hover { text-decoration: underline; }
          .user-status { background: #e8f5e8; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
          .not-logged-in { background: #fff3cd; color: #856404; }
          .logged-in { background: #d4edda; color: #155724; }
      </style>
  </head>
  <body>
      <h1>JMeter Test Demo API</h1>
      
      <div id="user-status" class="user-status">
          <p>Loading user status...</p>
      </div>
      
      <p>This demo app provides both HTML forms and JSON API endpoints for testing your JMeter dynamic correlation plugin.</p>
      
      <h2>HTML Pages (for manual testing)</h2>
      <ul>
          <li><a href="/login">Login Form</a></li>
          <li><a href="/products">Products Catalog</a></li>
          <li><a href="/checkout">Checkout Process</a> (session required)</li>
          <li><a href="/dashboard">Authenticated Dashboard</a> (session required)</li>
      </ul>
      
      <h2>API Endpoints (for JMeter testing)</h2>
      
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
      
      <h2>Test Users</h2>
      <ul>
          <li><strong>testuser1</strong> / password: <strong>123</strong></li>
          <li><strong>testuser2</strong> / password: <strong>456</strong></li>
          <li><strong>adminuser</strong> / password: <strong>789</strong></li>
      </ul>
      
      <script>
      // Global addToCart function used by all pages
      window.addToCart = function(productId) {
          // Get all session-related data from localStorage
          const token = localStorage.getItem('session_token');
          const userId = localStorage.getItem('user_id');
          const correlationId = localStorage.getItem('correlation_id');
          const sessionId = localStorage.getItem('session_id');
          
          console.log('Debug - Session data:', {
              token: token ? token.substring(0, 20) + '...' : 'missing',
              userId: userId,
              correlationId: correlationId ? correlationId.substring(0, 20) + '...' : 'missing',
              sessionId: sessionId
          });
          
          if (!token || !userId || !correlationId) {
              alert('❌ Missing session data! Please login first to get all required correlation IDs.\\n\\nRequired: session_token, user_id, correlation_id');
              return;
          }
          
          // Make actual API call with ALL authentication data in the body
          const quantity = 1;
          const requestPayload = {
              product_id: productId,
              quantity: quantity,
              session_token: token,
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
                  
                  alert(\`✅ Body-Authenticated Success! Added \${data.cart_item.product_name} to cart.\\n\\n🔐 Authentication Method: ALL DATA IN REQUEST BODY\\n📋 Session Token: \${token.substring(0, 20)}...\\n🆔 User ID: \${userId}\\n🔄 Correlation ID: \${correlationId.substring(0, 20)}...\\n\\n📦 Cart Item ID: \${data.cart_item.cart_item_id}\\n👤 User: \${data.cart_item.username}\\n💰 Subtotal: $\${data.cart_item.subtotal}\\n🎯 Next Step Token: \${data.next_step_token}\\n\\n✨ This request used NO Authorization headers - all session/auth data was in the request body for advanced JMeter correlation testing!\`);
              } else {
                  alert(\`❌ Error: \${data.error}\\n\\nMessage: \${data.message || 'Unknown error'}\\n\\nMake sure you have all required fields: session_token, user_id, correlation_id\`);
              }
          })
          .catch(error => {
              console.error('Cart add error:', error);
              alert('❌ Network Error: ' + error.message);
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
      <title>Login - JMeter Test Demo</title>
      <style>
          body { font-family: Arial, sans-serif; max-width: 400px; margin: 100px auto; padding: 20px; }
          form { background: #f5f5f5; padding: 20px; border-radius: 5px; }
          input { width: 100%; padding: 10px; margin: 5px 0; border: 1px solid #ddd; border-radius: 3px; box-sizing: border-box; }
          button { background: #0366d6; color: white; padding: 10px 20px; border: none; border-radius: 3px; cursor: pointer; }
          button:hover { background: #0256d0; }
          .result { margin-top: 20px; padding: 10px; border-radius: 3px; }
          a { color: #0366d6; }
      </style>
  </head>
  <body>
      <h2>Login Form</h2>
      <form onsubmit="handleLogin(event)">
          <input type="text" id="username" placeholder="Username" required>
          <input type="password" id="password" placeholder="Password" required>
          <button type="submit">Login</button>
      </form>
      
      <div id="result"></div>
      
      <p><a href="/">← Back to Home</a></p>
      
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
                  
                  document.getElementById('result').innerHTML = \`
                      <h3>✅ Login Successful!</h3>
                      <div style="background: #e8f5e8; padding: 15px; border-radius: 5px; margin: 10px 0;">
                          <p><strong>Session Token:</strong> <code>\${data.session_token}</code></p>
                          <p><strong>Session ID:</strong> <code>\${data.session_id}</code></p>
                          <p><strong>CSRF Token:</strong> <code>\${data.csrf_token}</code></p>
                          <p><strong>Correlation ID:</strong> <code>\${data.correlation_id}</code></p>
                          <p><strong>User ID:</strong> \${data.user_id}</p>
                          <p><strong>Username:</strong> \${data.username}</p>
                          <p><strong>Email:</strong> \${data.email}</p>
                          <p><strong>Expires In:</strong> \${data.expires_in} seconds</p>
                          <p><strong>Server Timestamp:</strong> \${data.server_timestamp}</p>
                      </div>
                      <div style="margin-top: 15px;">
                          <button onclick="testAuthenticatedRequest()" style="background: #28a745; padding: 8px 12px; border: none; border-radius: 3px; color: white; cursor: pointer; margin-right: 10px;">Test Authenticated Request</button>
                          <a href="/dashboard" style="background: #0366d6; color: white; padding: 8px 12px; text-decoration: none; border-radius: 3px;">Go to Dashboard</a>
                          <a href="/checkout" style="background: #ffc107; color: black; padding: 8px 12px; text-decoration: none; border-radius: 3px; margin-left: 5px;">Go to Checkout</a>
                      </div>
                  \`;
              } else {
                  document.getElementById('result').innerHTML = 
                      '<div style="background: #f8d7da; color: #721c24; padding: 10px; border-radius: 3px;"><h3>❌ Login Failed</h3><pre>' + JSON.stringify(data, null, 2) + '</pre></div>';
              }
          } catch (error) {
              document.getElementById('result').innerHTML = 
                  '<div style="background: #f8d7da; color: #721c24; padding: 10px; border-radius: 3px;"><h3>❌ Error</h3><pre>' + error.message + '</pre></div>';
          }
      }
      
      async function testAuthenticatedRequest() {
          const token = localStorage.getItem('session_token');
          if (!token) {
              alert('No session token found. Please login first.');
              return;
          }
          
          try {
              const response = await fetch('/api/user/profile', {
                  method: 'POST', // Changed to POST for body data
                  headers: {
                      'Content-Type': 'application/json'
                      // No Authorization header - using body instead!
                  },
                  body: JSON.stringify({
                      session_token: token,
                      user_id: parseInt(localStorage.getItem('user_id') || '1'),
                      correlation_id: localStorage.getItem('correlation_id')
                  })
              });
              
              const data = await response.json();
              
              document.getElementById('result').innerHTML += \`
                  <div style="background: #d1ecf1; padding: 15px; border-radius: 5px; margin-top: 15px;">
                      <h4>🔐 Authenticated Request Result:</h4>
                      <pre>\${JSON.stringify(data, null, 2)}</pre>
                  </div>
              \`;
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
      <title>Dashboard - JMeter Test Demo</title>
      <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
          .session-info { background: #e8f5e8; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
          .auth-test { background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .endpoint-test { margin: 15px 0; }
          button { background: #0366d6; color: white; padding: 10px 15px; border: none; border-radius: 3px; cursor: pointer; margin: 5px; }
          button:hover { background: #0256d0; }
          .success { background: #d4edda; color: #155724; padding: 10px; border-radius: 3px; margin: 10px 0; }
          .error { background: #f8d7da; color: #721c24; padding: 10px; border-radius: 3px; margin: 10px 0; }
          .info { background: #d1ecf1; color: #0c5460; padding: 10px; border-radius: 3px; margin: 10px 0; }
          pre { background: #f8f9fa; padding: 10px; border-radius: 3px; overflow-x: auto; }
          a { color: #0366d6; }
      </style>
  </head>
  <body>
      <h2>🔐 Authenticated Dashboard</h2>
      
      <div class="session-info" id="session-info">
          <h3>Session Information</h3>
          <p>Loading session data...</p>
      </div>
      
      <div class="auth-test">
          <h3>Test Authenticated Endpoints</h3>
          <p>These endpoints require your session token for JMeter correlation testing:</p>
          
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
              <span>HTTP-only response endpoint (perfect for JMeter HTTP testing)</span>
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
      
      <div id="test-results"></div>
      
      <p><a href="/">← Back to Home</a> | <a href="/login">Login</a></p>
      
      <script>
      // Check for session token on page load
      window.onload = function() {
          const token = localStorage.getItem('session_token');
          const username = localStorage.getItem('username');
          
          if (token) {
              document.getElementById('session-info').innerHTML = \`
                  <h3>✅ Active Session</h3>
                  <p><strong>Username:</strong> \${username || 'Unknown'}</p>
                  <p><strong>Session Token:</strong> <code>\${token}</code></p>
                  <p><strong>Token Length:</strong> \${token.length} characters</p>
                  <p><strong>Status:</strong> <span style="color: #28a745; font-weight: bold;">AUTHENTICATED</span></p>
                  <p><em>This token will be used for authenticated API requests</em></p>
              \`;
          } else {
              document.getElementById('session-info').innerHTML = \`
                  <h3>❌ No Active Session</h3>
                  <p>You need to <a href="/login">login</a> first to access authenticated features.</p>
                  <p><strong>Status:</strong> <span style="color: #dc3545; font-weight: bold;">NOT AUTHENTICATED</span></p>
              \`;
          }
      };
      
      async function testProfile() {
          const token = localStorage.getItem('session_token');
          if (!token) {
              showResult('error', 'No session token found. Please login first.');
              return;
          }
          
          try {
              showResult('info', 'Testing GET /api/user/profile with session token...');
              
              const response = await fetch('/api/user/profile', {
                  headers: {
                      'Authorization': 'Bearer ' + token,
                      'Content-Type': 'application/json'
                  }
              });
              
              const data = await response.json();
              
              if (response.ok) {
                  showResult('success', 'Profile request successful!', data);
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
          
          if (!token || !userId || !correlationId) {
              showResult('error', 'Missing session data. Please login to get all required correlation IDs.');
              return;
          }
          
          try {
              showResult('info', 'Testing POST /api/cart/add with session data in request body...');
              
              const response = await fetch('/api/cart/add', {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json'
                      // NO Authorization header!
                  },
                  body: JSON.stringify({
                      product_id: 1, // Test with product 1
                      quantity: 1,
                      session_token: token,
                      user_id: parseInt(userId),
                      correlation_id: correlationId,
                      client_session_id: sessionId,
                      client_request_id: 'dashboard_test_' + Date.now(),
                      timestamp: new Date().toISOString()
                  })
              });
              
              const data = await response.json();
              
              if (response.ok) {
                  showResult('success', 'Cart add request successful using body authentication!', data);
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
          
          if (!token || !userId || !correlationId) {
              showResult('error', 'Missing session data. Please login to get all required correlation IDs.');
              return;
          }
          
          try {
              showResult('info', 'Testing POST /api/http-test with session data in request body (HTTP response, not JSON)...');
              
              const response = await fetch('/api/http-test', {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json'
                      // NO Authorization header - all auth data in body!
                  },
                  body: JSON.stringify({
                      session_token: token,
                      user_id: parseInt(userId),
                      correlation_id: correlationId,
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
                  
                  showResult('success', 'HTTP Test Step 1 successful! Step 2 token extracted and Step 2 button enabled. This endpoint returns plain HTTP text (not JSON) - perfect for JMeter HTTP response testing.', {
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
          const step2Token = localStorage.getItem('step2_token');
          
          if (!token || !userId || !correlationId) {
              showResult('error', 'Missing session data. Please login to get all required correlation IDs.');
              return;
          }
          
          if (!step2Token) {
              showResult('error', 'Missing Step 2 token! Please run Step 1 first to extract the Step 2 token from the response.');
              return;
          }
          
          try {
              showResult('info', 'Testing POST /api/http-test-step2 with session data + Step 2 token (multi-step correlation)...');
              
              const response = await fetch('/api/http-test-step2', {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json'
                      // NO Authorization header - all auth data in body!
                  },
                  body: JSON.stringify({
                      session_token: token,
                      user_id: parseInt(userId),
                      correlation_id: correlationId,
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
          document.getElementById('session-info').innerHTML = \`
              <h3>❌ Session Cleared</h3>
              <p>You have been logged out. <a href="/login">Login again</a> to test authenticated endpoints.</p>
              <p><strong>Status:</strong> <span style="color: #dc3545; font-weight: bold;">NOT AUTHENTICATED</span></p>
          \`;
      }
      
      function showResult(type, message, data = null) {
          const resultDiv = document.getElementById('test-results');
          const timestamp = new Date().toLocaleTimeString();
          
          let html = \`<div class="\${type}">
              <strong>[\${timestamp}] \${message}</strong>
          \`;
          
          if (data) {
              html += \`<pre>\${JSON.stringify(data, null, 2)}</pre>\`;
          }
          
          html += '</div>';
          
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
      <title>Checkout - JMeter Test Demo</title>
      <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
          .user-status { background: #e8f5e8; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
          .not-logged-in { background: #fff3cd; color: #856404; }
          .logged-in { background: #d4edda; color: #155724; }
          .checkout-section { background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 15px 0; }
          .form-group { margin: 15px 0; }
          label { display: block; font-weight: bold; margin-bottom: 5px; }
          input, select, textarea { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 3px; box-sizing: border-box; }
          button { background: #28a745; color: white; padding: 10px 20px; border: none; border-radius: 3px; cursor: pointer; margin: 5px; }
          button:hover { background: #218838; }
          .correlation-info { background: #e7f3ff; padding: 10px; border-radius: 3px; margin: 10px 0; font-size: 0.9em; }
          a { color: #0366d6; }
      </style>
  </head>
  <body>
      <h2>🛒 Checkout</h2>
      
      <div id="user-status" class="user-status">
          <p>Loading session status...</p>
      </div>
      
      <div class="checkout-section">
          <h3>📦 Mock Cart Items</h3>
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
      
      <div class="correlation-info">
          <h4>🔄 JMeter Correlation Data (will be sent in request body):</h4>
          <div id="correlation-display">Loading correlation data...</div>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
          <button onclick="processCheckout()" id="checkoutBtn" disabled>Complete Checkout</button>
          <button onclick="goToCart()" style="background: #6c757d;">View Cart</button>
      </div>
      
      <div id="checkout-result"></div>
      
      <p><a href="/products">← Back to Products</a> | <a href="/">Home</a></p>
      
      <script>
      window.onload = function() {
          checkLoginStatus();
          displayCorrelationData();
      };
      
      function checkLoginStatus() {
          const token = localStorage.getItem('session_token');
          const username = localStorage.getItem('username');
          
          if (token && username) {
              document.getElementById('user-status').innerHTML = \`
                  <div class="logged-in">
                      <h3>✅ Logged in as: \${username}</h3>
                      <p>Ready for authenticated checkout with correlation data!</p>
                  </div>
              \`;
              document.getElementById('checkoutBtn').disabled = false;
          } else {
              document.getElementById('user-status').innerHTML = \`
                  <div class="not-logged-in">
                      <h3>❌ Not logged in</h3>
                      <p><a href="/login">Login required</a> to complete checkout with session correlation.</p>
                  </div>
              \`;
          }
      }
      
      function displayCorrelationData() {
          const sessionToken = localStorage.getItem('session_token');
          const userId = localStorage.getItem('user_id');
          const correlationId = localStorage.getItem('correlation_id');
          const checkoutToken = localStorage.getItem('next_step_token') || 'checkout_' + Date.now();
          
          document.getElementById('correlation-display').innerHTML = \`
              <p><strong>Session Token:</strong> <code>\${sessionToken ? sessionToken.substring(0, 20) + '...' : 'Not available'}</code></p>
              <p><strong>User ID:</strong> <code>\${userId || 'Not available'}</code></p>
              <p><strong>Correlation ID:</strong> <code>\${correlationId || 'Not available'}</code></p>
              <p><strong>Checkout Token:</strong> <code>\${checkoutToken}</code></p>
              <p><em>All of this data will be sent in the request body for correlation testing!</em></p>
          \`;
      }
      
      async function processCheckout() {
          const sessionToken = localStorage.getItem('session_token');
          const userId = localStorage.getItem('user_id');
          const correlationId = localStorage.getItem('correlation_id');
          const checkoutToken = localStorage.getItem('next_step_token') || 'checkout_' + Date.now();
          
          if (!sessionToken || !userId || !correlationId) {
              alert('❌ Missing session data! Please login first to get all required correlation IDs.');
              return;
          }
          
          const checkoutData = {
              session_token: sessionToken,           // Required in body!
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
                  document.getElementById('checkout-result').innerHTML = \`
                      <div style="background: #d4edda; color: #155724; padding: 20px; border-radius: 5px; margin: 20px 0;">
                          <h3>🎉 Checkout Successful!</h3>
                          <p><strong>Order Token:</strong> \${result.order_token}</p>
                          <p><strong>Confirmation Number:</strong> \${result.confirmation_number}</p>
                          <p><strong>Transaction ID:</strong> \${result.payment_confirmation.transaction_id}</p>
                          <p><strong>Tracking Number:</strong> \${result.shipping_info.tracking_number}</p>
                          <p><strong>Total:</strong> $\${result.total}</p>
                          <hr>
                          <h4>✅ Correlation Data Validated:</h4>
                          <p>Session Token: \${result.correlation_validation.session_token_used}</p>
                          <p>User ID: \${result.correlation_validation.user_id_confirmed}</p>
                          <p>Correlation ID: \${result.correlation_validation.correlation_id_received}</p>
                          <p>Checkout Token: \${result.correlation_validation.checkout_token_validated}</p>
                      </div>
                  \`;
              } else {
                  document.getElementById('checkout-result').innerHTML = \`
                      <div style="background: #f8d7da; color: #721c24; padding: 15px; border-radius: 5px;">
                          <h3>❌ Checkout Failed</h3>
                          <p><strong>Error:</strong> \${result.error}</p>
                          <p><strong>Message:</strong> \${result.message}</p>
                      </div>
                  \`;
              }
          } catch (error) {
              document.getElementById('checkout-result').innerHTML = \`
                  <div style="background: #f8d7da; color: #721c24; padding: 15px; border-radius: 5px;">
                      <h3>❌ Network Error</h3>
                      <p>\${error.message}</p>
                  </div>
              \`;
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
      <title>Product Details - JMeter Test Demo</title>
      <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
          .product-detail { border: 1px solid #ddd; padding: 20px; border-radius: 5px; background: #f9f9f9; }
          .price { color: #0366d6; font-weight: bold; font-size: 1.2em; }
          .stock-status { padding: 5px 10px; border-radius: 3px; color: white; font-weight: bold; }
          .in_stock { background: #28a745; }
          .low_stock { background: #ffc107; color: black; }
          .out_of_stock { background: #dc3545; }
          .loading { text-align: center; padding: 50px; }
          a { color: #0366d6; }
          button { background: #0366d6; color: white; padding: 10px 15px; border: none; border-radius: 3px; cursor: pointer; margin: 5px; }
          button:hover { background: #0256d0; }
          .user-status { background: #e8f5e8; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
          .not-logged-in { background: #fff3cd; color: #856404; }
          .logged-in { background: #d4edda; color: #155724; }
      </style>
  </head>
  <body>
      <h2>Product Details</h2>
      
      <div id="user-status" class="user-status">
          <p>Loading user status...</p>
      </div>
      
      <div id="product-detail" class="loading">Loading product ${productId}...</div>
      
      <div style="margin-top: 20px;">
          <a href="/products">← Back to Products</a> | 
          <a href="/">Home</a>
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
              document.getElementById('user-status').innerHTML = \`
                  <div class="logged-in">
                      <h3>✅ Logged in as: \${username}</h3>
                      <p>Session active - you can add items to cart!</p>
                      <button onclick="logout()" style="background: #dc3545; color: white; padding: 5px 10px; border: none; border-radius: 3px; cursor: pointer; margin-right: 10px;">Logout</button>
                      <a href="/dashboard" style="background: #28a745; color: white; padding: 5px 10px; text-decoration: none; border-radius: 3px;">Dashboard</a>
                  </div>
              \`;
          } else {
              document.getElementById('user-status').innerHTML = \`
                  <div class="not-logged-in">
                      <h3>👤 Not logged in</h3>
                      <p><a href="/login">Login</a> to add items to cart (session required for authenticated endpoints).</p>
                  </div>
              \`;
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
              
              document.getElementById('product-detail').innerHTML = \`
                  <div class="product-detail">
                      <h3>\${product.name}</h3>
                      <p><strong>Category:</strong> \${product.category}</p>
                      <p class="price">Price: $\${product.price}</p>
                      <p><strong>Discounted Price:</strong> <span style="color: #28a745;">$\${product.discounted_price.toFixed(2)}</span></p>
                      <p><strong>Stock:</strong> \${product.stock} available</p>
                      <p><span class="stock-status \${stockClass}">\${stockText}</span></p>
                      <p><strong>Product ID:</strong> \${product.id}</p>
                      <p><strong>Last Updated:</strong> \${new Date(product.last_updated).toLocaleString()}</p>
                      
                      <div style="margin-top: 20px;">
                          <button onclick="window.addToCart(\${product.id})">Add to Cart</button>
                          <button onclick="checkSimilar('\${product.category}')">View Similar Products</button>
                      </div>
                  </div>
              \`;
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
      <title>Products - JMeter Test Demo</title>
      <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
          .filters { background: #f5f5f5; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
          .product { border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 5px; }
          .price { color: #0366d6; font-weight: bold; }
          button { background: #0366d6; color: white; padding: 5px 10px; border: none; border-radius: 3px; cursor: pointer; }
          button:hover { background: #0256d0; }
          a { color: #0366d6; }
          .user-status { background: #e8f5e8; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
          .not-logged-in { background: #fff3cd; color: #856404; }
          .logged-in { background: #d4edda; color: #155724; }
      </style>
  </head>
  <body>
      <h2>Products Catalog</h2>
      
      <div id="user-status" class="user-status">
          <p>Loading user status...</p>
      </div>
      
      <div class="filters">
          <button onclick="loadProducts()">All Products</button>
          <button onclick="loadProducts('Electronics')">Electronics</button>
          <button onclick="loadProducts('Home')">Home</button>
          <button onclick="loadProducts('Sports')">Sports</button>
          <button onclick="loadProducts('Office')">Office</button>
      </div>
      
      <div id="products">Loading...</div>
      
      <p><a href="/">← Back to Home</a></p>
      
      <script>
      // Global addToCart function used by all pages
      window.addToCart = function(productId) {
          // Get all session-related data from localStorage
          const token = localStorage.getItem('session_token');
          const userId = localStorage.getItem('user_id');
          const correlationId = localStorage.getItem('correlation_id');
          const sessionId = localStorage.getItem('session_id');
          
          console.log('Debug - Session data:', {
              token: token ? token.substring(0, 20) + '...' : 'missing',
              userId: userId,
              correlationId: correlationId ? correlationId.substring(0, 20) + '...' : 'missing',
              sessionId: sessionId
          });
          
          if (!token || !userId || !correlationId) {
              alert('❌ Missing session data! Please login first to get all required correlation IDs.\\n\\nRequired: session_token, user_id, correlation_id');
              return;
          }
          
          // Make actual API call with ALL authentication data in the body
          const quantity = 1;
          const requestPayload = {
              product_id: productId,
              quantity: quantity,
              session_token: token,
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
                  
                  alert(\`✅ Body-Authenticated Success! Added \${data.cart_item.product_name} to cart.\\n\\n🔐 Authentication Method: ALL DATA IN REQUEST BODY\\n📋 Session Token: \${token.substring(0, 20)}...\\n🆔 User ID: \${userId}\\n🔄 Correlation ID: \${correlationId.substring(0, 20)}...\\n\\n📦 Cart Item ID: \${data.cart_item.cart_item_id}\\n👤 User: \${data.cart_item.username}\\n💰 Subtotal: $\${data.cart_item.subtotal}\\n🎯 Next Step Token: \${data.next_step_token}\\n\\n✨ This request used NO Authorization headers - all session/auth data was in the request body for advanced JMeter correlation testing!\`);
              } else {
                  alert(\`❌ Error: \${data.error}\\n\\nMessage: \${data.message || 'Unknown error'}\\n\\nMake sure you have all required fields: session_token, user_id, correlation_id\`);
              }
          })
          .catch(error => {
              console.error('Cart add error:', error);
              alert('❌ Network Error: ' + error.message);
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
              document.getElementById('user-status').innerHTML = \`
                  <div class="logged-in">
                      <h3>✅ Logged in as: \${username}</h3>
                      <p>Session active - you can add items to cart!</p>
                      <button onclick="logout()" style="background: #dc3545; color: white; padding: 5px 10px; border: none; border-radius: 3px; cursor: pointer; margin-right: 10px;">Logout</button>
                      <a href="/dashboard" style="background: #28a745; color: white; padding: 5px 10px; text-decoration: none; border-radius: 3px;">Dashboard</a>
                  </div>
              \`;
          } else {
              document.getElementById('user-status').innerHTML = \`
                  <div class="not-logged-in">
                      <h3>👤 Not logged in</h3>
                      <p><a href="/login">Login</a> to add items to cart (session required for authenticated endpoints).</p>
                  </div>
              \`;
          }
      }
      
      async function loadProducts(category = '') {
          try {
              const url = category ? '/api/products?category=' + category : '/api/products';
              const response = await fetch(url);
              const data = await response.json();
              
              let html = '<h3>Found ' + data.count + ' products:</h3>';
              data.products.forEach(product => {
                  html += \`<div class="product">
                      <h4><a href="/product/\${product.id}" style="text-decoration: none; color: #0366d6;">\${product.name}</a></h4>
                      <p>Category: \${product.category}</p>
                      <p class="price">$\${product.price}</p>
                      <p>Stock: \${product.stock} available</p>
                      <p><small>Product ID: \${product.id}</small></p>
                      <button onclick="viewProduct(\${product.id})">View Details</button>
                      <button onclick="window.addToCart(\${product.id})" style="background: #28a745; margin-left: 5px;">Add to Cart</button>
                  </div>\`;
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