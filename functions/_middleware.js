// Cloudflare Pages Functions
// This file handles routing for the SPA

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Handle API routes
    if (url.pathname.startsWith('/api/') || 
        url.pathname.startsWith('/rest/') || 
        url.pathname.startsWith('/b2b/') ||
        url.pathname.startsWith('/metrics') ||
        url.pathname.startsWith('/ftp') ||
        url.pathname.startsWith('/encryptionkeys') ||
        url.pathname.startsWith('/support/logs') ||
        url.pathname.startsWith('/.well-known') ||
        url.pathname.startsWith('/file-upload') ||
        url.pathname.startsWith('/profile/image') ||
        url.pathname.startsWith('/rest/memories') ||
        url.pathname.startsWith('/the/devs/are/so/funny') ||
        url.pathname.startsWith('/this/page/is/hidden') ||
        url.pathname.startsWith('/we/may/also/instruct') ||
        url.pathname.startsWith('/dataerasure') ||
        url.pathname.startsWith('/redirect') ||
        url.pathname.startsWith('/promotion') ||
        url.pathname.startsWith('/video') ||
        url.pathname.startsWith('/profile') ||
        url.pathname.startsWith('/snippets')) {
      // Proxy to the Node.js backend
      const backendUrl = new URL(request.url);
      backendUrl.hostname = 'your-backend-worker.your-subdomain.workers.dev';
      
      return fetch(backendUrl.toString(), {
        method: request.method,
        headers: request.headers,
        body: request.body
      });
    }
    
    // Serve static files
    if (url.pathname.startsWith('/assets/') || 
        url.pathname.startsWith('/favicon') ||
        url.pathname.endsWith('.js') ||
        url.pathname.endsWith('.css') ||
        url.pathname.endsWith('.png') ||
        url.pathname.endsWith('.jpg') ||
        url.pathname.endsWith('.jpeg') ||
        url.pathname.endsWith('.gif') ||
        url.pathname.endsWith('.svg') ||
        url.pathname.endsWith('.ico') ||
        url.pathname.endsWith('.woff') ||
        url.pathname.endsWith('.woff2') ||
        url.pathname.endsWith('.ttf') ||
        url.pathname.endsWith('.eot')) {
      return env.ASSETS.fetch(request);
    }
    
    // For all other routes, serve the Angular SPA
    return env.ASSETS.fetch(new Request(new URL('/', request.url), request));
  }
};
