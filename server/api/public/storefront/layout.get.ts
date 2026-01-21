import { eventHandler } from 'h3'

import prisma from '../../../db'

const DEFAULT_LAYOUT = {
  brand: {
    name: 'Turkey Store',
    logoUrl: null as string | null,
    homeUrl: '/'
  },
  navLinks: [
    { label: 'الرئيسية', to: '/' },
    { label: 'المنتجات', to: '/products' },
    { label: 'الفئات', to: '/categories' },
    { label: 'العروض', to: '/#deals' },
    { label: 'تواصل معنا', to: '/#contact' }
  ],
  actions: {
    showSearch: true,
    searchUrl: '/search',
    showWishlist: true,
    showCart: true,
    accountUrl: '/admin/login'
  },
  footer: {
    copyright: `© ${new Date().getFullYear()} Loogy. جميع الحقوق محفوظة.`,
    description: 'أسرع متجر إلكتروني بدعم كامل للوضع الليلي مع بوابة دفع Paymob.',
    links: [
      { label: 'سياسة الخصوصية', to: '/pages/privacy-policy' },
      { label: 'سياسة الاسترجاع', to: '/pages/refund-policy' },
      { label: 'الشحن', to: '/pages/shipping-policy' },
      { label: 'الشروط والأحكام', to: '/pages/terms-and-conditions' }
    ],
    socials: [
      { label: 'Facebook', icon: 'i-lucide-facebook', url: '' },
      { label: 'Instagram', icon: 'i-lucide-instagram', url: '' },
      { label: 'YouTube', icon: 'i-lucide-youtube', url: '' }
    ]
  }
}

export default eventHandler(async () => {
  let content: { data?: unknown } | null = null

  try {
    content = await prisma.storefrontContent.findUnique({ where: { key: 'layout' } })
  } catch (error: unknown) {
    const code = (error as { code?: string })?.code
    if (code !== 'P2021') {
      throw error
    }
  }

  const resolved = content?.data && typeof content.data === 'object'
    ? { ...DEFAULT_LAYOUT, ...(content.data as Record<string, unknown>) }
    : DEFAULT_LAYOUT

  return {
    layout: resolved
  }
})
