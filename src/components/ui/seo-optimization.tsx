'use client'

import Head from 'next/head'
import { usePathname } from 'next/navigation'
import React from 'react'

// SEO metadata types
interface MetaTagsProps {
  title: string
  description: string
  keywords?: string
  ogTitle?: string
  ogDescription?: string
  ogImage?: string
  ogUrl?: string
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player'
  twitterTitle?: string
  twitterDescription?: string
  twitterImage?: string
  canonical?: string
  noindex?: boolean
  children?: React.ReactNode
}

// Georgian SEO content defaults
export const georgianSeoDefaults = {
  title: 'ინვოისების მართვის სისტემა | Invoice Platform',
  description: 'მარტივი და ეფექტური ინვოისების მართვა ქართული ბიზნესებისთვის',
  keywords: 'ინვოისი, ბიზნესი, ფინანსები, საქართველო',
  ogImage: '/images/og-image.jpg',
}

// Meta tags component
export function MetaTags({
  title = georgianSeoDefaults.title,
  description = georgianSeoDefaults.description,
  keywords = georgianSeoDefaults.keywords,
  ogTitle,
  ogDescription,
  ogImage = georgianSeoDefaults.ogImage,
  ogUrl,
  twitterCard = 'summary_large_image',
  twitterTitle,
  twitterDescription,
  twitterImage,
  canonical,
  noindex = false,
  children,
}: MetaTagsProps) {
  const pathname = usePathname()
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://invoice-platform.ge'
  const currentUrl = `${baseUrl}${pathname}`
  
  // Use provided values or defaults
  const finalOgTitle = ogTitle || title
  const finalOgDescription = ogDescription || description
  const finalOgUrl = ogUrl || currentUrl
  const finalTwitterTitle = twitterTitle || finalOgTitle
  const finalTwitterDescription = twitterDescription || finalOgDescription
  const finalTwitterImage = twitterImage || ogImage
  const finalCanonical = canonical || currentUrl
  
  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      <link rel="canonical" href={finalCanonical} />
      
      {/* Open Graph Tags */}
      <meta property="og:title" content={finalOgTitle} />
      <meta property="og:description" content={finalOgDescription} />
      <meta property="og:url" content={finalOgUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Invoice Platform" />
      {ogImage && <meta property="og:image" content={ogImage.startsWith('http') ? ogImage : `${baseUrl}${ogImage}`} />}
      <meta property="og:locale" content="ka_GE" />
      
      {/* Twitter Card Tags */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={finalTwitterTitle} />
      <meta name="twitter:description" content={finalTwitterDescription} />
      {finalTwitterImage && (
        <meta 
          name="twitter:image" 
          content={finalTwitterImage.startsWith('http') ? finalTwitterImage : `${baseUrl}${finalTwitterImage}`} 
        />
      )}
      
      {/* Additional meta tags */}
      {children}
    </Head>
  )
}

// Structured data for rich snippets
interface StructuredDataProps {
  type: 'Organization' | 'BreadcrumbList' | 'FAQPage' | 'Product' | 'Article' | 'LocalBusiness'
  data: any
}

export function StructuredData({ type, data }: StructuredDataProps) {
  // Create structured data based on type
  const getStructuredData = () => {
    const baseData = {
      '@context': 'https://schema.org',
      '@type': type,
    }
    
    return { ...baseData, ...data }
  }
  
  return (
    <Head>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(getStructuredData()) }}
      />
    </Head>
  )
}

// Organization structured data
export function OrganizationStructuredData({ 
  name = 'Invoice Platform',
  url = 'https://invoice-platform.ge',
  logo = 'https://invoice-platform.ge/logo.png',
  sameAs = [],
}: {
  name?: string
  url?: string
  logo?: string
  sameAs?: string[]
}) {
  const data = {
    name,
    url,
    logo,
    sameAs,
  }
  
  return <StructuredData type="Organization" data={data} />
}

// Breadcrumb structured data
export function BreadcrumbStructuredData({ items }: { 
  items: { name: string; item: string }[] 
}) {
  const itemListElement = items.map((item, index) => ({
    '@type': 'ListItem',
    'position': index + 1,
    'name': item.name,
    'item': item.item,
  }))
  
  const data = {
    itemListElement,
  }
  
  return <StructuredData type="BreadcrumbList" data={data} />
}

// FAQ structured data
export function FAQStructuredData({ questions }: {
  questions: { question: string; answer: string }[]
}) {
  const mainEntity = questions.map(q => ({
    '@type': 'Question',
    'name': q.question,
    'acceptedAnswer': {
      '@type': 'Answer',
      'text': q.answer,
    },
  }))
  
  const data = {
    mainEntity,
  }
  
  return <StructuredData type="FAQPage" data={data} />
}

// Sitemap generation helper
export function generateSitemap(baseUrl: string, routes: string[]) {
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${routes
    .map(route => {
      return `
    <url>
      <loc>${baseUrl}${route}</loc>
      <lastmod>${new Date().toISOString()}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>${route === '/' ? '1.0' : '0.8'}</priority>
    </url>
  `
    })
    .join('')}
</urlset>
`
  return sitemap
}

// Robots.txt configuration
export function generateRobots(baseUrl: string) {
  return `# https://www.robotstxt.org/robotstxt.html
User-agent: *
Allow: /

# Sitemaps
Sitemap: ${baseUrl}/sitemap.xml
`
}

// Page-specific SEO component
interface PageSeoProps {
  title: string
  description: string
  path: string
  image?: string
  noindex?: boolean
}

export function PageSeo({
  title,
  description,
  path,
  image,
  noindex = false,
}: PageSeoProps) {
  const fullTitle = `${title} | Invoice Platform`
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://invoice-platform.ge'
  const url = `${baseUrl}${path}`
  const ogImage = image || '/images/og-image.jpg'
  
  return (
    <MetaTags
      title={fullTitle}
      description={description}
      ogTitle={fullTitle}
      ogDescription={description}
      ogUrl={url}
      ogImage={ogImage}
      canonical={url}
      noindex={noindex}
    />
  )
}
