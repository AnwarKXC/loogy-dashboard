import { defineEventHandler, getRouterParam, getQuery, createError } from 'h3'
import prisma from '../../../db'

// Get SEO for a specific page (public endpoint)
export default defineEventHandler(async (event) => {
  const pageKey = getRouterParam(event, 'pageKey')
  const query = getQuery(event)
  const lang = (query.lang as 'EN' | 'AR') || 'EN'

  if (!pageKey) {
    throw createError({
      statusCode: 400,
      message: 'Page key is required'
    })
  }

  const pageSEO = await prisma.pageSEO.findUnique({
    where: {
      pageKey_lang: {
        pageKey,
        lang
      }
    }
  })

  // Fallback to English if Arabic not found
  if (!pageSEO && lang === 'AR') {
    const fallback = await prisma.pageSEO.findUnique({
      where: {
        pageKey_lang: {
          pageKey,
          lang: 'EN'
        }
      }
    })
    
    if (fallback) {
      return {
        ...fallback,
        isFallback: true
      }
    }
  }

  if (!pageSEO) {
    // Return default SEO if not configured
    return {
      pageKey,
      lang,
      title: getDefaultTitle(pageKey, lang),
      description: getDefaultDescription(pageKey, lang),
      keywords: null,
      ogTitle: null,
      ogDescription: null,
      ogImage: null,
      canonicalUrl: null,
      robots: 'index, follow',
      structuredData: null,
      isDefault: true
    }
  }

  return pageSEO
})

function getDefaultTitle(pageKey: string, lang: 'EN' | 'AR'): string {
  const titles: Record<string, string> = {
    home: 'Welcome to Our Store',
    products: 'Browse Products',
    categories: 'Shop by Category',
    cart: 'Shopping Cart',
    checkout: 'Checkout',
    wishlist: 'My Wishlist',
    about: 'About Us',
    contact: 'Contact Us'
  }
  
  return titles[pageKey] || pageKey
}

function getDefaultDescription(pageKey: string, lang: 'EN' | 'AR'): string {
  const descriptions: Record<string, string> = {
    home: 'Discover amazing products at great prices',
    products: 'Browse our wide selection of products',
    categories: 'Find products organized by category',
    cart: 'Review items in your shopping cart',
    checkout: 'Complete your purchase securely',
    wishlist: 'Your saved favorite items'
  }
  
  return descriptions[pageKey] || ''
}
