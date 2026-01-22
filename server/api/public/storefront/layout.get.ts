import { eventHandler } from 'h3'

import prisma from '../../../db'

const DEFAULT_LAYOUT = {
  brand: {
    name: 'Turkey Store',
    logoUrl: null as string | null,
    homeUrl: '/'
  },
  navLinks: [
    { label: 'Home', to: '/' },
    { label: 'Products', to: '/products' },
    { label: 'Categories', to: '/categories' },
    { label: 'Deals', to: '/#deals' },
    { label: 'Contact Us', to: '/#contact' }
  ],
  actions: {
    showSearch: true,
    searchUrl: '/search',
    showWishlist: true,
    showCart: true,
    accountUrl: '/admin/login'
  },
  footer: {
    copyright: `© ${new Date().getFullYear()} Loogy. All rights reserved.`,
    description: 'The fastest online store with full dark mode support and Paymob payment gateway.',
    links: [
      { label: 'Privacy Policy', to: '/pages/privacy-policy' },
      { label: 'Refund Policy', to: '/pages/refund-policy' },
      { label: 'Shipping', to: '/pages/shipping-policy' },
      { label: 'Terms and Conditions', to: '/pages/terms-and-conditions' }
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
