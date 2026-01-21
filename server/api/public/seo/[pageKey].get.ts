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
  const titles: Record<string, Record<'EN' | 'AR', string>> = {
    home: { EN: 'Welcome to Our Store', AR: 'مرحباً بك في متجرنا' },
    products: { EN: 'Browse Products', AR: 'تصفح المنتجات' },
    categories: { EN: 'Shop by Category', AR: 'تسوق حسب الفئة' },
    cart: { EN: 'Shopping Cart', AR: 'سلة التسوق' },
    checkout: { EN: 'Checkout', AR: 'الدفع' },
    wishlist: { EN: 'My Wishlist', AR: 'قائمة الأمنيات' },
    about: { EN: 'About Us', AR: 'من نحن' },
    contact: { EN: 'Contact Us', AR: 'اتصل بنا' }
  }
  
  return titles[pageKey]?.[lang] || titles[pageKey]?.['EN'] || pageKey
}

function getDefaultDescription(pageKey: string, lang: 'EN' | 'AR'): string {
  const descriptions: Record<string, Record<'EN' | 'AR', string>> = {
    home: { EN: 'Discover amazing products at great prices', AR: 'اكتشف منتجات رائعة بأسعار مميزة' },
    products: { EN: 'Browse our wide selection of products', AR: 'تصفح مجموعتنا الواسعة من المنتجات' },
    categories: { EN: 'Find products organized by category', AR: 'ابحث عن المنتجات حسب الفئة' },
    cart: { EN: 'Review items in your shopping cart', AR: 'مراجعة المنتجات في سلة التسوق' },
    checkout: { EN: 'Complete your purchase securely', AR: 'أكمل عملية الشراء بأمان' },
    wishlist: { EN: 'Your saved favorite items', AR: 'المنتجات المفضلة المحفوظة' }
  }
  
  return descriptions[pageKey]?.[lang] || descriptions[pageKey]?.['EN'] || ''
}
