// Cloudflare Worker for OWASP Juice Shop API
// This is a simplified version that provides basic product data

export default {
  async fetch(request, env, ctx) {
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
