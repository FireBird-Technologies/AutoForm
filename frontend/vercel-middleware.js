// Vercel Edge Middleware for OG meta tags
// Detects social media crawlers and serves OG tags from backend

const SOCIAL_CRAWLERS = [
  'facebookexternalhit',
  'linkedinbot',
  'twitterbot', 
  'slackbot',
  'whatsapp',
  'telegrambot',
  'discordbot',
  'pinterest',
  'googlebot',
  'bingbot',
];

function isSocialCrawler(userAgent) {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return SOCIAL_CRAWLERS.some(crawler => ua.includes(crawler));
}

export default async function middleware(request) {
  const url = new URL(request.url);
  
  // Only handle /forms/* paths  
  if (!url.pathname.startsWith('/forms/')) {
    return;
  }
  
  const userAgent = request.headers.get('user-agent') || '';
  
  // If it's a social crawler, proxy to backend for OG meta tags
  if (isSocialCrawler(userAgent)) {
    const token = url.pathname.replace('/forms/', '');
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    
    try {
      const response = await fetch(`${backendUrl}/og/${token}`, {
        headers: { 'User-Agent': userAgent },
      });
      
      return new Response(await response.text(), {
        status: response.status,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    } catch (error) {
      console.error('OG proxy error:', error);
    }
  }
  
  // Regular browsers - continue to SPA
  return;
}

export const config = {
  matcher: '/forms/:path*',
};
