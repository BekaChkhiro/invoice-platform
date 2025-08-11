const fs = require('fs');
const path = require('path');

// Base URL of the site
const BASE_URL = 'https://invoice-platform.ge';

// Main routes to include in the sitemap
const MAIN_ROUTES = [
  '/',
  '/dashboard',
  '/invoices',
  '/clients',
  '/settings',
  '/analytics',
  '/login',
  '/register',
  '/forgot-password',
  '/contact',
  '/about',
  '/terms',
  '/privacy',
  '/faq',
];

// Generate sitemap XML
function generateSitemap() {
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${MAIN_ROUTES.map(route => {
    return `
  <url>
    <loc>${BASE_URL}${route}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>${route === '/' ? 'daily' : 'weekly'}</changefreq>
    <priority>${route === '/' ? '1.0' : route.includes('login') || route.includes('register') ? '0.7' : '0.8'}</priority>
  </url>`;
  }).join('')}
</urlset>`;

  // Write sitemap to public directory
  fs.writeFileSync(path.join(process.cwd(), 'public', 'sitemap.xml'), sitemap);
  console.log('✅ Sitemap generated successfully!');
}

// Execute the function
generateSitemap();
