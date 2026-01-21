import type { H3Event } from 'h3'
import { getCookie, setCookie } from 'h3'

const CART_COOKIE = 'storefront_cart'
const WISHLIST_COOKIE = 'storefront_wishlist'

export type CartCookie = {
  items: Array<{ productId: number, variantId?: number, quantity: number }>
}

export type WishlistCookie = {
  items: Array<{ productId: number, variantId?: number }>
}

const cartDefaults: CartCookie = { items: [] }
const wishlistDefaults: WishlistCookie = { items: [] }

function safeParse<T>(raw: string | undefined, fallback: T): T {
  if (!raw) return fallback

  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function readCartCookie(event: H3Event): CartCookie {
  const raw = getCookie(event, CART_COOKIE)
  const parsed = safeParse<CartCookie>(raw, cartDefaults)

  if (!Array.isArray(parsed.items)) {
    return cartDefaults
  }

  return parsed
}

export function writeCartCookie(event: H3Event, cart: CartCookie) {
  setCookie(event, CART_COOKIE, JSON.stringify(cart), {
    httpOnly: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7
  })
}

export function readWishlistCookie(event: H3Event): WishlistCookie {
  const raw = getCookie(event, WISHLIST_COOKIE)
  const parsed = safeParse<WishlistCookie>(raw, wishlistDefaults)

  if (!Array.isArray(parsed.items)) {
    return wishlistDefaults
  }

  return parsed
}

export function writeWishlistCookie(event: H3Event, wishlist: WishlistCookie) {
  setCookie(event, WISHLIST_COOKIE, JSON.stringify(wishlist), {
    httpOnly: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30
  })
}
