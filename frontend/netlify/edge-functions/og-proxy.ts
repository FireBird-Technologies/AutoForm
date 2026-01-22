import type { Context } from "https://edge.netlify.com";

// Social media crawler user agents
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
  'yandex',
  'baiduspider',
  'facebot',
  'ia_archiver',
];

function isSocialCrawler(userAgent: string): boolean {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return SOCIAL_CRAWLERS.some(crawler => ua.includes(crawler));
}

export default async function handler(request: Request, context: Context) {
  const userAgent = request.headers.get('user-agent') || '';
  
  // If it's a social crawler, proxy to backend for OG meta tags
  if (isSocialCrawler(userAgent)) {
    const url = new URL(request.url);
    const token = url.pathname.replace('/forms/', '');
    
    // Get backend URL from environment
    const backendUrl = Deno.env.get('BACKEND_URL') || 'http://localhost:8000';
    const ogUrl = `${backendUrl}/api/og/${token}`;
    
    try {
      const response = await fetch(ogUrl, {
        headers: {
          'User-Agent': userAgent,
        },
      });
      
      // Return the OG meta page from backend
      const html = await response.text();
      return new Response(html, {
        status: response.status,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    } catch (error) {
      console.error('Error fetching OG tags:', error);
      // Fall through to SPA
    }
  }
  
  // For regular browsers, continue to the SPA
  return context.next();
}

export const config = {
  path: "/forms/*",
};
