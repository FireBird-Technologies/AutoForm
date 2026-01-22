// Vercel Edge Function for OG meta tags
// This proxies to the backend for social media crawlers

export const config = {
  runtime: 'edge',
};

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

function isSocialCrawler(userAgent: string): boolean {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return SOCIAL_CRAWLERS.some(crawler => ua.includes(crawler));
}

export default async function handler(request: Request) {
  const url = new URL(request.url);
  const token = url.pathname.split('/').pop();
  const userAgent = request.headers.get('user-agent') || '';
  
  // Proxy to backend for OG tags
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
  
  try {
    const response = await fetch(`${backendUrl}/api/og/${token}`, {
      headers: { 'User-Agent': userAgent },
    });
    
    const html = await response.text();
    return new Response(html, {
      status: response.status,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    // Fallback - redirect to form
    const frontendUrl = process.env.FRONTEND_URL || url.origin;
    return Response.redirect(`${frontendUrl}/forms/${token}`, 302);
  }
}
