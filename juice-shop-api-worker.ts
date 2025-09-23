// Cloudflare Worker for OWASP Juice Shop API
// This is a simplified version that provides basic product data

export default {
  async fetch(request: Request, env: any, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    
    // Handle CORS
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    // Mock product data for the Juice Shop
    const products = [
      {
        id: 1,
        name: "Apple Juice (1000ml)",
        description: "The all-time classic.",
        price: 1.99,
        image: "apple_juice.jpg",
        category: "Juices"
      },
      {
        id: 2,
        name: "Orange Juice (1000ml)",
        description: "Made from the finest hand-picked oranges.",
        price: 2.99,
        image: "orange_juice.jpg",
        category: "Juices"
      },
      {
        id: 3,
        name: "Banana Juice (1000ml)",
        description: "Monkey-approved!",
        price: 1.99,
        image: "banana_juice.jpg",
        category: "Juices"
      },
      {
        id: 4,
        name: "Raspberry Juice (1000ml)",
        description: "Exclusive to our store!",
        price: 4.99,
        image: "raspberry_juice.jpg",
        category: "Juices"
      },
      {
        id: 5,
        name: "Green Smoothie",
        description: "Looks poisonous but fresh!",
        price: 3.99,
        image: "green_smoothie.jpg",
        category: "Smoothies"
      },
      {
        id: 6,
        name: "Melon Bike (Comeback-2017 Edition)",
        description: "The wheels of this bicycle have been replaced by melons.",
        price: 3399.00,
        image: "melon_bike.jpg",
        category: "Bikes"
      },
      {
        id: 7,
        name: "OWASP Juice Shop T-Shirt",
        description: "Real fans wear it 24/7.",
        price: 20.99,
        image: "owasp_tshirt.jpg",
        category: "Accessories"
      },
      {
        id: 8,
        name: "OWASP Juice Shop Hoodie",
        description: "Comfortable and warm.",
        price: 49.99,
        image: "owasp_hoodie.jpg",
        category: "Accessories"
      }
    ];

    // Handle different API endpoints
    if (url.pathname === '/rest/products' || url.pathname === '/api/products') {
      return new Response(JSON.stringify(products), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    if (url.pathname === '/api/Products/') {
      return new Response(JSON.stringify({ data: products }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    // Product search endpoint (must come before individual product route)
    if (url.pathname === '/rest/products/search' && request.method === 'GET') {
      const searchQuery = url.searchParams.get('q') || '';
      
      if (!searchQuery.trim()) {
        // If no search query, return all products
        return new Response(JSON.stringify({ data: products }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }
      
      // Filter products based on search query
      const filteredProducts = products.filter(product => 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      return new Response(JSON.stringify({ data: filteredProducts }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    if (url.pathname.startsWith('/rest/products/')) {
      const productId = parseInt(url.pathname.split('/').pop());
      const product = products.find(p => p.id === productId);
      
      if (product) {
        return new Response(JSON.stringify(product), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      } else {
        return new Response(JSON.stringify({ error: 'Product not found' }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }
    }

    if (url.pathname === '/rest/user/login' && request.method === 'POST') {
      return new Response(JSON.stringify({
        authentication: {
          token: "fake-jwt-token-for-demo",
          bid: 1,
          umail: "admin@juice-sh.op"
        }
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    if (url.pathname === '/rest/user/registration' && request.method === 'POST') {
      return new Response(JSON.stringify({
        status: 'success',
        data: {
          id: 1,
          email: 'user@example.com'
        }
      }), {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    if (url.pathname === '/rest/basket' && request.method === 'GET') {
      return new Response(JSON.stringify({
        id: 1,
        Products: []
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    if (url.pathname === '/rest/basket' && request.method === 'POST') {
      return new Response(JSON.stringify({
        status: 'success',
        data: {
          id: 1,
          ProductId: 1,
          quantity: 1
        }
      }), {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    if (url.pathname === '/rest/user/whoami' && request.method === 'GET') {
      return new Response(JSON.stringify({
        user: {
          id: 1,
          email: 'admin@juice-sh.op',
          role: 'admin'
        }
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    if (url.pathname === '/rest/user/logout' && request.method === 'POST') {
      return new Response(JSON.stringify({
        status: 'success'
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    if (url.pathname === '/rest/categories' && request.method === 'GET') {
      return new Response(JSON.stringify([
        { id: 1, name: 'Juices' },
        { id: 2, name: 'Smoothies' },
        { id: 3, name: 'Bikes' },
        { id: 4, name: 'Accessories' }
      ]), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    if (url.pathname === '/rest/languages' && request.method === 'GET') {
      return new Response(JSON.stringify([
        {
          key: 'en',
          lang: 'English',
          country: 'United States',
          flag: 'us.svg'
        },
        {
          key: 'de',
          lang: 'Deutsch',
          country: 'Germany',
          flag: 'de.svg'
        },
        {
          key: 'fr',
          lang: 'Français',
          country: 'France',
          flag: 'fr.svg'
        },
        {
          key: 'es',
          lang: 'Español',
          country: 'Spain',
          flag: 'es.svg'
        },
        {
          key: 'it',
          lang: 'Italiano',
          country: 'Italy',
          flag: 'it.svg'
        },
        {
          key: 'pt',
          lang: 'Português',
          country: 'Portugal',
          flag: 'pt.svg'
        },
        {
          key: 'nl',
          lang: 'Nederlands',
          country: 'Netherlands',
          flag: 'nl.svg'
        },
        {
          key: 'ru',
          lang: 'Русский',
          country: 'Russia',
          flag: 'ru.svg'
        },
        {
          key: 'zh',
          lang: '中文',
          country: 'China',
          flag: 'cn.svg'
        },
        {
          key: 'ja',
          lang: '日本語',
          country: 'Japan',
          flag: 'jp.svg'
        }
      ]), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    // Admin endpoints
    if (url.pathname === '/rest/admin/application-version' && request.method === 'GET') {
      return new Response(JSON.stringify({
        version: '19.0.0',
        name: 'OWASP Juice Shop - Peak3000 Demo',
        description: 'Intentionally insecure web application for security training'
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    if (url.pathname === '/rest/admin/application-configuration' && request.method === 'GET') {
      return new Response(JSON.stringify({
        application: {
          name: 'OWASP Juice Shop - Peak3000 Demo',
          domain: 'peak3000.co.uk',
          logo: 'JuiceShop_Logo.png',
          favicon: 'favicon_js.ico',
          theme: 'bluegrey-lightgreen',
          showVersionNumber: true,
          showGitHubLinks: true
        },
        server: {
          port: 3000,
          basePath: '',
          baseUrl: 'https://demo.peak3000.co.uk'
        }
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    if (url.pathname === '/rest/admin/application-configuration' && request.method === 'PUT') {
      return new Response(JSON.stringify({
        status: 'success',
        message: 'Configuration updated successfully'
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    if (url.pathname === '/rest/admin/users' && request.method === 'GET') {
      return new Response(JSON.stringify([
        {
          id: 1,
          email: 'admin@juice-sh.op',
          role: 'admin',
          lastLoginIp: '127.0.0.1',
          profile: {
            username: 'admin',
            firstname: 'Admin',
            lastname: 'User'
          }
        }
      ]), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    if (url.pathname === '/rest/admin/application-logs' && request.method === 'GET') {
      return new Response(JSON.stringify({
        logs: [
          {
            timestamp: new Date().toISOString(),
            level: 'INFO',
            message: 'Application started successfully',
            source: 'server'
          }
        ]
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    // Additional API endpoints
    if (url.pathname === '/api/Quantitys/' && request.method === 'GET') {
      return new Response(JSON.stringify({
        data: [
          { id: 1, ProductId: 1, quantity: 1 },
          { id: 2, ProductId: 2, quantity: 2 },
          { id: 3, ProductId: 3, quantity: 3 },
          { id: 4, ProductId: 4, quantity: 4 },
          { id: 5, ProductId: 5, quantity: 5 },
          { id: 6, ProductId: 6, quantity: 1 },
          { id: 7, ProductId: 7, quantity: 1 },
          { id: 8, ProductId: 8, quantity: 1 }
        ]
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    if (url.pathname === '/api/Quantitys' && request.method === 'POST') {
      return new Response(JSON.stringify({
        status: 'success',
        data: {
          id: 1,
          quantity: 1
        }
      }), {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    if (url.pathname === '/api/BasketItems/' && request.method === 'GET') {
      return new Response(JSON.stringify({
        data: []
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    if (url.pathname === '/api/BasketItems' && request.method === 'POST') {
      return new Response(JSON.stringify({
        status: 'success',
        data: {
          id: 1,
          ProductId: 1,
          quantity: 1,
          BasketId: 1
        }
      }), {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    if (url.pathname.startsWith('/api/BasketItems/') && request.method === 'DELETE') {
      return new Response(JSON.stringify({
        status: 'success',
        data: {
          message: 'Item deleted successfully'
        }
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    // Challenges API endpoint
    if (url.pathname === '/api/Challenges/' && request.method === 'GET') {
      const challengeName = url.searchParams.get('name');
      
      // Mock challenges data for OWASP Juice Shop
      const challenges = [
        {
          id: 1,
          name: "Score Board",
          category: "Information Disclosure",
          description: "Find the hidden score board.",
          difficulty: 1,
          hint: "It's not where you think it is.",
          hintUrl: "https://pwning.owasp-juice.shop/part1/information-disclosure.html",
          mitigationUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Information_Exposure_Cheat_Sheet.html",
          solved: false,
          disabledEnv: null
        },
        {
          id: 2,
          name: "Admin Registration",
          category: "Broken Access Control",
          description: "Register as a user with administrator privileges.",
          difficulty: 2,
          hint: "Try to register with a different email format.",
          hintUrl: "https://pwning.owasp-juice.shop/part2/broken-access-control.html",
          mitigationUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Access_Control_Cheat_Sheet.html",
          solved: false,
          disabledEnv: null
        },
        {
          id: 3,
          name: "Login Admin",
          category: "Broken Access Control",
          description: "Log in with the administrator's user account.",
          difficulty: 1,
          hint: "Try some common passwords.",
          hintUrl: "https://pwning.owasp-juice.shop/part2/broken-access-control.html",
          mitigationUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html",
          solved: false,
          disabledEnv: null
        },
        {
          id: 4,
          name: "Login Bender",
          category: "Broken Access Control",
          description: "Log in with Bender's user account.",
          difficulty: 1,
          hint: "Try some common passwords.",
          hintUrl: "https://pwning.owasp-juice.shop/part2/broken-access-control.html",
          mitigationUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html",
          solved: false,
          disabledEnv: null
        },
        {
          id: 5,
          name: "Login Jim",
          category: "Broken Access Control",
          description: "Log in with Jim's user account.",
          difficulty: 1,
          hint: "Try some common passwords.",
          hintUrl: "https://pwning.owasp-juice.shop/part2/broken-access-control.html",
          mitigationUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html",
          solved: false,
          disabledEnv: null
        }
      ];

      if (challengeName) {
        // Filter by challenge name
        const filteredChallenges = challenges.filter(challenge => 
          challenge.name.toLowerCase().includes(challengeName.toLowerCase())
        );
        return new Response(JSON.stringify(filteredChallenges), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      } else {
        // Return all challenges
        return new Response(JSON.stringify(challenges), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }
    }

    if (url.pathname === '/api/Challenges' && request.method === 'POST') {
      return new Response(JSON.stringify({
        status: 'success',
        message: 'Challenge completed successfully'
      }), {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    // Handle Socket.IO connections
    if (url.pathname.startsWith('/socket.io/')) {
      // For Socket.IO polling transport, return a simple response
      if (url.pathname.includes('transport=polling')) {
        return new Response('40', {
          status: 200,
          headers: {
            'Content-Type': 'text/plain',
            ...corsHeaders
          }
        });
      }
      
      // For WebSocket upgrade requests, return 426 Upgrade Required
      if (request.headers.get('upgrade') === 'websocket') {
        return new Response('WebSocket not supported in Cloudflare Workers', {
          status: 426,
          headers: {
            'Content-Type': 'text/plain',
            ...corsHeaders
          }
        });
      }
      
      // Default Socket.IO response
      return new Response('40', {
        status: 200,
        headers: {
          'Content-Type': 'text/plain',
          ...corsHeaders
        }
      });
    }

        // Hints API endpoint
        if (url.pathname === '/api/Hints/' && request.method === 'GET') {
          return new Response(JSON.stringify({
            data: [
              {
                id: 1,
                ChallengeId: 1,
                text: "Look for a hidden link or button on the page.",
                order: 1,
                unlocked: true
              },
              {
                id: 2,
                ChallengeId: 2,
                text: "Try registering with an admin email address.",
                order: 1,
                unlocked: false
              },
              {
                id: 3,
                ChallengeId: 3,
                text: "Try common passwords like 'admin' or 'password'.",
                order: 1,
                unlocked: false
              }
            ]
          }), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });
        }

        if (url.pathname.startsWith('/api/Hints/') && request.method === 'PUT') {
          return new Response(JSON.stringify({
            status: 'success',
            data: {
              id: 1,
              ChallengeId: 1,
              text: "Hint updated successfully",
              order: 1,
              unlocked: true
            }
          }), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });
        }

        // Track order endpoint
        if (url.pathname.startsWith('/rest/track-order/') && request.method === 'GET') {
          const orderId = url.pathname.split('/').pop();
          return new Response(JSON.stringify({
            data: [{
              orderId: orderId,
              email: 'admin@juice-sh.op',
              totalPrice: 15.99,
              promotionalAmount: 0,
              deliveryPrice: 0,
              addressId: 1,
              paymentId: 1,
              eta: 2,
              delivered: false,
              bonus: 0,
              products: [
                {
                  id: 1,
                  name: "Apple Juice (1000ml)",
                  price: 1.99,
                  quantity: 1,
                  total: 1.99
                },
                {
                  id: 2,
                  name: "Orange Juice (1000ml)",
                  price: 2.99,
                  quantity: 2,
                  total: 5.98
                }
              ]
            }]
          }), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });
        }

        // Chatbot endpoints
        if (url.pathname === '/rest/chatbot/status' && request.method === 'GET') {
          return new Response(JSON.stringify({
            status: true,
            body: "Welcome to the OWASP Juice Shop! How can I help you today?"
          }), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });
        }

        if (url.pathname === '/rest/chatbot/respond' && request.method === 'POST') {
          return new Response(JSON.stringify({
            action: 'response',
            body: "Thank you for your message. This is a demo chatbot response."
          }), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });
        }

        // Order history endpoint
        if (url.pathname === '/rest/order-history' && request.method === 'GET') {
          return new Response(JSON.stringify({
            data: []
          }), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });
        }

        if (url.pathname === '/rest/order-history/orders' && request.method === 'GET') {
          return new Response(JSON.stringify({
            data: []
          }), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });
        }

        // Default response for unknown endpoints
        return new Response(JSON.stringify({ 
          error: 'Endpoint not found',
          path: url.pathname,
          method: request.method 
        }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
  }
};
