import { PrismaClient, Prisma } from '../app/generated/prisma/index.js'

const prisma = new PrismaClient()

const categoryTree = [
  {
    slug: 'electronics',
    name: { en: 'Electronics', ar: 'Electronics' },
    children: [
      {
        slug: 'electronics-smartphones',
        name: { en: 'Smartphones', ar: 'Smartphones' },
        children: [
          {
            slug: 'electronics-smartphones-accessories',
            name: { en: 'Phone Accessories', ar: 'Phone Accessories' }
          }
        ]
      },
      {
        slug: 'electronics-computers',
        name: { en: 'Computers & Tablets', ar: 'Computers & Tablets' }
      },
      {
        slug: 'electronics-audio',
        name: { en: 'Audio', ar: 'Audio' }
      }
    ]
  },
  {
    slug: 'home-living',
    name: { en: 'Home & Living', ar: 'Home & Living' },
    children: [
      {
        slug: 'home-living-furniture',
        name: { en: 'Furniture', ar: 'Furniture' }
      },
      {
        slug: 'home-living-kitchen',
        name: { en: 'Kitchen & Dining', ar: 'Kitchen & Dining' }
      }
    ]
  },
  {
    slug: 'health-beauty',
    name: { en: 'Health & Beauty', ar: 'Health & Beauty' },
    children: [
      {
        slug: 'health-beauty-skincare',
        name: { en: 'Skin Care', ar: 'Skin Care' }
      },
      {
        slug: 'health-beauty-fitness',
        name: { en: 'Fitness & Wellness', ar: 'Fitness & Wellness' }
      }
    ]
  }
]

const brands = [
  {
    slug: 'nova-tech',
    name: { en: 'NovaTech', ar: 'NovaTech' },
    logo: 'https://dummyimage.com/96x96/0f172a/ffffff.png&text=NT',
    description: { en: 'Consumer electronics designed for everyday performance.', ar: 'Consumer electronics designed for everyday performance.' }
  },
  {
    slug: 'aero-sound',
    name: { en: 'AeroSound', ar: 'AeroSound' },
    logo: 'https://dummyimage.com/96x96/1f2937/ffffff.png&text=AS',
    description: { en: 'Audio products built with precision engineering.', ar: 'Audio products built with precision engineering.' }
  },
  {
    slug: 'urban-home',
    name: { en: 'UrbanHome', ar: 'UrbanHome' },
    logo: 'https://dummyimage.com/96x96/334155/ffffff.png&text=UH',
    description: { en: 'Furniture and decor for modern homes.', ar: 'Furniture and decor for modern homes.' }
  },
  {
    slug: 'vital-life',
    name: { en: 'VitalLife', ar: 'VitalLife' },
    logo: 'https://dummyimage.com/96x96/14532d/ffffff.png&text=VL',
    description: { en: 'Health and wellness essentials.', ar: 'Health and wellness essentials.' }
  }
]

const products = [
  {
    slug: 'nova-phone-12',
    name: { en: 'Nova Phone 12', ar: 'Nova Phone 12' },
    shortDescription: { en: 'Flagship 5G smartphone with pro camera system.', ar: 'Flagship 5G smartphone with pro camera system.' },
    description: { en: 'Experience speed and clarity with the Nova Phone 12 featuring a 6.5 inch display, 5G connectivity, and all day battery life.', ar: 'Experience speed and clarity with the Nova Phone 12 featuring a 6.5 inch display, 5G connectivity, and all day battery life.' },
    price: '799.00',
    salePrice: '749.00',
    discountPercentage: '6.25',
    quantity: 150,
    stock: 150,
    images: [
      'https://dummyimage.com/600x400/0f172a/ffffff.png&text=Nova+Phone+12+Front',
      'https://dummyimage.com/600x400/1f2937/ffffff.png&text=Nova+Phone+12+Back'
    ],
    rating: '4.60',
    seo: {
      title: 'Nova Phone 12',
      description: 'Stay connected with the Nova Phone 12 flagship smartphone.'
    },
    categorySlug: 'electronics-smartphones',
    brandSlug: 'nova-tech'
  },
  {
    slug: 'aero-buds-pro',
    name: { en: 'Aero Buds Pro', ar: 'Aero Buds Pro' },
    shortDescription: { en: 'Noise cancelling wireless earbuds with 24 hour battery.', ar: 'Noise cancelling wireless earbuds with 24 hour battery.' },
    description: { en: 'Compact earbuds delivering immersive audio, adaptive noise cancellation, and comfortable all day wear.', ar: 'Compact earbuds delivering immersive audio, adaptive noise cancellation, and comfortable all day wear.' },
    price: '189.00',
    salePrice: '159.00',
    discountPercentage: '15.87',
    quantity: 260,
    stock: 260,
    images: [
      'https://dummyimage.com/600x400/111827/ffffff.png&text=Aero+Buds+Pro'
    ],
    rating: '4.40',
    seo: {
      title: 'Aero Buds Pro',
      description: 'Premium wireless earbuds with adaptive noise cancellation.'
    },
    categorySlug: 'electronics-audio',
    brandSlug: 'aero-sound'
  },
  {
    slug: 'nova-airbook-15',
    name: { en: 'Nova AirBook 15', ar: 'Nova AirBook 15' },
    shortDescription: { en: 'Lightweight laptop built for productivity.', ar: 'Lightweight laptop built for productivity.' },
    description: { en: 'The Nova AirBook 15 pairs a lightweight chassis with the latest processors, 1 TB SSD storage, and a vibrant display.', ar: 'The Nova AirBook 15 pairs a lightweight chassis with the latest processors, 1 TB SSD storage, and a vibrant display.' },
    price: '1299.00',
    quantity: 85,
    stock: 85,
    images: [
      'https://dummyimage.com/600x400/0f172a/ffffff.png&text=Nova+AirBook+15'
    ],
    rating: '4.70',
    seo: {
      title: 'Nova AirBook 15',
      description: 'Work anywhere with the Nova AirBook 15 ultra portable laptop.'
    },
    categorySlug: 'electronics-computers',
    brandSlug: 'nova-tech'
  },
  {
    slug: 'nova-flex-case',
    name: { en: 'Nova Flex Case', ar: 'Nova Flex Case' },
    shortDescription: { en: 'Protective silicone case tailored for Nova phones.', ar: 'Protective silicone case tailored for Nova phones.' },
    description: { en: 'Soft touch silicone case with reinforced corners and antimicrobial coating to keep your Nova device secure.', ar: 'Soft touch silicone case with reinforced corners and antimicrobial coating to keep your Nova device secure.' },
    price: '24.00',
    quantity: 500,
    stock: 500,
    images: [
      'https://dummyimage.com/600x400/1f2937/ffffff.png&text=Nova+Flex+Case'
    ],
    seo: {
      title: 'Nova Flex Case',
      description: 'Slim protective silicone case for Nova smartphones.'
    },
    categorySlug: 'electronics-smartphones-accessories',
    brandSlug: 'nova-tech'
  },
  {
    slug: 'urban-lounge-sofa',
    name: { en: 'Urban Lounge Sofa', ar: 'Urban Lounge Sofa' },
    shortDescription: { en: 'Modular three seat sofa with washable covers.', ar: 'Modular three seat sofa with washable covers.' },
    description: { en: 'Bring comfort to your living space with a modular sofa finished in performance fabric and sustainable wood framing.', ar: 'Bring comfort to your living space with a modular sofa finished in performance fabric and sustainable wood framing.' },
    price: '949.00',
    quantity: 30,
    stock: 30,
    images: [
      'https://dummyimage.com/600x400/334155/ffffff.png&text=Urban+Lounge+Sofa'
    ],
    rating: '4.20',
    seo: {
      title: 'Urban Lounge Sofa',
      description: 'Modular sofa sized for apartments and compact living rooms.'
    },
    categorySlug: 'home-living-furniture',
    brandSlug: 'urban-home'
  },
  {
    slug: 'urban-bamboo-cookset',
    name: { en: 'Urban Bamboo Cookset', ar: 'Urban Bamboo Cookset' },
    shortDescription: { en: 'Seven piece bamboo utensil set for everyday cooking.', ar: 'Seven piece bamboo utensil set for everyday cooking.' },
    description: { en: 'Sustainably sourced bamboo cooking utensils with heat resistant handles and countertop holder.', ar: 'Sustainably sourced bamboo cooking utensils with heat resistant handles and countertop holder.' },
    price: '59.00',
    quantity: 320,
    stock: 320,
    images: [
      'https://dummyimage.com/600x400/475569/ffffff.png&text=Bamboo+Cookset'
    ],
    seo: {
      title: 'Urban Bamboo Cookset',
      description: 'Durable bamboo utensils for organized kitchens.'
    },
    categorySlug: 'home-living-kitchen',
    brandSlug: 'urban-home'
  },
  {
    slug: 'vital-hydration-kit',
    name: { en: 'Vital Hydration Kit', ar: 'Vital Hydration Kit' },
    shortDescription: { en: 'Daily hydration system with stainless bottle.', ar: 'Daily hydration system with stainless bottle.' },
    description: { en: 'Stay energized with the Vital Hydration Kit including a stainless steel bottle, electrolyte tablets, and habit tracker.', ar: 'Stay energized with the Vital Hydration Kit including a stainless steel bottle, electrolyte tablets, and habit tracker.' },
    price: '89.00',
    quantity: 140,
    stock: 140,
    images: [
      'https://dummyimage.com/600x400/14532d/ffffff.png&text=Hydration+Kit'
    ],
    rating: '4.30',
    seo: {
      title: 'Vital Hydration Kit',
      description: 'Hydration essentials for fitness and wellness routines.'
    },
    categorySlug: 'health-beauty-fitness',
    brandSlug: 'vital-life'
  },
  {
    slug: 'vital-glow-serum',
    name: { en: 'Vital Glow Serum', ar: 'Vital Glow Serum' },
    shortDescription: { en: 'Vitamin enriched serum for daily skin renewal.', ar: 'Vitamin enriched serum for daily skin renewal.' },
    description: { en: 'Lightweight serum formulated with vitamins C and E to brighten, hydrate, and smooth skin texture.', ar: 'Lightweight serum formulated with vitamins C and E to brighten, hydrate, and smooth skin texture.' },
    price: '62.00',
    quantity: 210,
    stock: 210,
    images: [
      'https://dummyimage.com/600x400/14532d/ffffff.png&text=Glow+Serum'
    ],
    rating: '4.50',
    seo: {
      title: 'Vital Glow Serum',
      description: 'Daily serum that supports radiant and hydrated skin.'
    },
    categorySlug: 'health-beauty-skincare',
    brandSlug: 'vital-life'
  }
]

const customers = [
  {
    name: 'Alex Smith',
    email: 'alex.smith@example.com',
    phoneNumber: '+12025550101',
    isActive: true,
    lastSessionMinutesAgo: 45,
    createdDaysAgo: 30,
    firebaseUid: 'seed-customer-1'
  },
  {
    name: 'Jordan Brown',
    email: 'jordan.brown@example.com',
    phoneNumber: '+442038079000',
    isActive: false,
    lastSessionMinutesAgo: 60 * 24 * 3,
    createdDaysAgo: 90,
    firebaseUid: 'seed-customer-2'
  },
  {
    name: 'Taylor Green',
    email: 'taylor.green@example.com',
    phoneNumber: '+33142278100',
    isActive: true,
    lastSessionMinutesAgo: 60 * 6,
    createdDaysAgo: 14,
    firebaseUid: 'seed-customer-3'
  },
  {
    name: 'Morgan White',
    email: 'morgan.white@example.com',
    phoneNumber: '+49301234567',
    isActive: true,
    lastSessionMinutesAgo: 20,
    createdDaysAgo: 7,
    firebaseUid: 'seed-customer-4'
  },
  {
    name: 'Casey Gray',
    email: 'casey.gray@example.com',
    phoneNumber: '+81312345678',
    isActive: false,
    lastSessionMinutesAgo: 60 * 24 * 14,
    createdDaysAgo: 120,
    firebaseUid: 'seed-customer-5'
  },
  {
    name: 'Jamie Johnson',
    email: 'jamie.johnson@example.com',
    phoneNumber: '+61298765432',
    isActive: true,
    lastSessionMinutesAgo: 60 * 2,
    createdDaysAgo: 3,
    firebaseUid: 'seed-customer-6'
  },
  {
    name: 'Riley Davis',
    email: 'riley.davis@example.com',
    phoneNumber: '+12125550123',
    isActive: true,
    lastSessionMinutesAgo: 60 * 24,
    createdDaysAgo: 45,
    firebaseUid: 'seed-customer-7'
  },
  {
    name: 'Kelly Wilson',
    email: 'kelly.wilson@example.com',
    phoneNumber: '+16175550999',
    isActive: true,
    lastSessionMinutesAgo: 15,
    createdDaysAgo: 2,
    firebaseUid: 'seed-customer-8'
  },
  {
    name: 'Drew Moore',
    email: 'drew.moore@example.com',
    phoneNumber: '+14155559876',
    isActive: false,
    lastSessionMinutesAgo: 60 * 24 * 21,
    createdDaysAgo: 200,
    firebaseUid: 'seed-customer-9'
  },
  {
    name: 'Jordan Taylor',
    email: 'jordan.taylor@example.com',
    phoneNumber: '+13125550111',
    isActive: true,
    lastSessionMinutesAgo: 60 * 12,
    createdDaysAgo: 60,
    firebaseUid: 'seed-customer-10'
  }
]

function minutesAgoToDate(minutes) {
  return new Date(Date.now() - minutes * 60 * 1000)
}

function daysAgoToDate(days) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000)
}

async function seedCustomers() {
  for (const customer of customers) {
    const lastSession = minutesAgoToDate(customer.lastSessionMinutesAgo)
    const createdAt = daysAgoToDate(customer.createdDaysAgo)

    await prisma.user.upsert({
      where: { email: customer.email },
      update: {
        name: customer.name,
        phoneNumber: customer.phoneNumber,
        isActive: customer.isActive,
        lastSession
      },
      create: {
        name: customer.name,
        email: customer.email,
        phoneNumber: customer.phoneNumber,
        isActive: customer.isActive,
        lastSession,
        createdAt,
        firebaseUid: customer.firebaseUid,
        role: 'CUSTOMER'
      }
    })
  }
}

async function upsertCategory(node, parentId) {
  const record = await prisma.category.upsert({
    where: { slug: node.slug },
    update: {
      name: node.name,
      parentId
    },
    create: {
      name: node.name,
      slug: node.slug,
      parentId
    }
  })

  if (node.children?.length) {
    for (const child of node.children) {
      await upsertCategory(child, record.id)
    }
  }
}

async function seedCategories() {
  for (const root of categoryTree) {
    await upsertCategory(root, null)
  }
}

async function seedBrands() {
  for (const brand of brands) {
    await prisma.brand.upsert({
      where: { slug: brand.slug },
      update: {
        name: brand.name,
        logo: brand.logo,
        description: brand.description
      },
      create: {
        name: brand.name,
        slug: brand.slug,
        logo: brand.logo,
        description: brand.description
      }
    })
  }
}

async function seedProducts() {
  for (const product of products) {
    const category = await prisma.category.findUnique({ where: { slug: product.categorySlug } })
    if (!category) {
      throw new Error(`Missing category for product ${product.slug}`)
    }

    const brand = await prisma.brand.findUnique({ where: { slug: product.brandSlug } })
    if (!brand) {
      throw new Error(`Missing brand for product ${product.slug}`)
    }

    const price = new Prisma.Decimal(product.price)
    const salePrice = product.salePrice ? new Prisma.Decimal(product.salePrice) : null
    const discountPercentage = product.discountPercentage ? new Prisma.Decimal(product.discountPercentage) : null
    const rating = product.rating ? new Prisma.Decimal(product.rating) : null

    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        name: product.name,
        description: product.description,
        shortDescription: product.shortDescription,
        price,
        salePrice,
        discountPercentage,
        quantity: product.quantity,
        stock: product.stock,
        images: product.images,
        rating,
        seo: product.seo,
        categoryId: category.id,
        categoryName: category.name,
        brandId: brand.id,
        brandName: brand.name
      },
      create: {
        name: product.name,
        description: product.description,
        shortDescription: product.shortDescription,
        price,
        salePrice,
        discountPercentage,
        quantity: product.quantity,
        stock: product.stock,
        images: product.images,
        rating,
        seo: product.seo,
        categoryId: category.id,
        categoryName: category.name,
        brandId: brand.id,
        brandName: brand.name,
        slug: product.slug
      }
    })
  }
}

async function main() {
  await seedCategories()
  await seedBrands()
  await seedProducts()
  await seedCustomers()
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error('Seeding failed', error)
    await prisma.$disconnect()
    process.exit(1)
  })
