// Ensure engine type is compatible with the adapter-based client.
process.env.PRISMA_CLIENT_ENGINE_TYPE ??= 'client'

const { PrismaClient, Prisma } = await import('@prisma/client')
const { PrismaPg } = await import('@prisma/adapter-pg')
const { Pool } = await import('pg')

const connectionString = process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? process.env.POSTGRES_PRISMA_URL

if (!connectionString) {
  throw new Error('DATABASE_URL (or POSTGRES_URL/POSTGRES_PRISMA_URL) is required for seeding.')
}

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)

// Provide an empty options object because the generated Prisma client constructor
// expects a defined argument when optional chaining is compiled without guarding `n`.
const prisma = new PrismaClient({ adapter })

const categories = [
  { slug: 'electronics', translations: { en: { name: 'Electronics' }, ar: { name: 'الكترونيات' } } },
  { slug: 'home-living', translations: { en: { name: 'Home & Living' }, ar: { name: 'منزل ومعيشة' } } },
  { slug: 'health-beauty', translations: { en: { name: 'Health & Beauty' }, ar: { name: 'الصحة والجمال' } } },
  { slug: 'fashion', translations: { en: { name: 'Fashion' }, ar: { name: 'أزياء' } } },
  { slug: 'outdoors', translations: { en: { name: 'Outdoors' }, ar: { name: 'خارجية' } } }
]

const brands = [
  {
    slug: 'nova-tech',
    logo: 'https://dummyimage.com/96x96/0f172a/ffffff.png&text=NT',
    translations: { en: 'NovaTech', ar: 'نوفا تك' },
    descriptions: { en: 'Everyday electronics built to perform.', ar: 'إلكترونيات يومية للأداء.' }
  },
  {
    slug: 'aero-sound',
    logo: 'https://dummyimage.com/96x96/1f2937/ffffff.png&text=AS',
    translations: { en: 'AeroSound', ar: 'ايرو ساوند' },
    descriptions: { en: 'Audio gear tuned for clarity.', ar: 'معدات صوتية مصممة للوضوح.' }
  },
  {
    slug: 'urban-home',
    logo: 'https://dummyimage.com/96x96/334155/ffffff.png&text=UH',
    translations: { en: 'UrbanHome', ar: 'أوربان هوم' },
    descriptions: { en: 'Furniture and decor for modern homes.', ar: 'أثاث وديكور للمنازل الحديثة.' }
  },
  {
    slug: 'vital-life',
    logo: 'https://dummyimage.com/96x96/14532d/ffffff.png&text=VL',
    translations: { en: 'VitalLife', ar: 'فايتال لايف' },
    descriptions: { en: 'Health and wellness essentials.', ar: 'أساسيات الصحة والعافية.' }
  },
  {
    slug: 'style-haven',
    logo: 'https://dummyimage.com/96x96/0f172a/ffffff.png&text=SH',
    translations: { en: 'StyleHaven', ar: 'ستايل هافن' },
    descriptions: { en: 'Everyday fashion and outdoor essentials.', ar: 'أزياء يومية واحتياجات خارجية.' }
  }
]

const products = [
  {
    slug: 'nova-phone-12',
    price: '799.00',
    salePrice: '749.00',
    discountPercentage: '6.25',
    stock: 150,
    images: [
      'https://dummyimage.com/600x400/0f172a/ffffff.png&text=Nova+Phone+12+Front',
      'https://dummyimage.com/600x400/1f2937/ffffff.png&text=Nova+Phone+12+Back'
    ],
    rating: '4.60',
    categorySlug: 'electronics',
    brandSlug: 'nova-tech',
    translations: {
      en: {
        name: 'Nova Phone 12',
        shortDescription: 'Flagship 5G smartphone with pro camera system.',
        description: '6.5 inch display, 5G connectivity, and all day battery life.'
      },
      ar: {
        name: 'نوفا فون 12',
        shortDescription: 'هاتف 5G رائد مع كاميرا احترافية.',
        description: 'شاشة 6.5 بوصة واتصال 5G وبطارية تدوم طوال اليوم.'
      }
    },
    seo: {
      title: 'Nova Phone 12',
      description: 'Stay connected with the Nova Phone 12 flagship smartphone.'
    }
  },
  {
    slug: 'aero-buds-pro',
    price: '189.00',
    salePrice: '159.00',
    discountPercentage: '15.87',
    stock: 260,
    images: ['https://dummyimage.com/600x400/111827/ffffff.png&text=Aero+Buds+Pro'],
    rating: '4.40',
    categorySlug: 'electronics',
    brandSlug: 'aero-sound',
    translations: {
      en: {
        name: 'Aero Buds Pro',
        shortDescription: 'Noise cancelling wireless earbuds with 24 hour battery.',
        description: 'Immersive audio, adaptive noise cancellation, and comfortable all-day wear.'
      },
      ar: {
        name: 'إيرو بادز برو',
        shortDescription: 'سماعات لاسلكية مع إلغاء ضوضاء وبطارية 24 ساعة.',
        description: 'صوت غامر مع إلغاء ضوضاء تكيفي وارتداء مريح طوال اليوم.'
      }
    },
    seo: {
      title: 'Aero Buds Pro',
      description: 'Premium wireless earbuds with adaptive noise cancellation.'
    }
  },
  {
    slug: 'nova-airbook-15',
    price: '1299.00',
    stock: 85,
    images: ['https://dummyimage.com/600x400/0f172a/ffffff.png&text=Nova+AirBook+15'],
    rating: '4.70',
    categorySlug: 'electronics',
    brandSlug: 'nova-tech',
    translations: {
      en: {
        name: 'Nova AirBook 15',
        shortDescription: 'Lightweight laptop built for productivity.',
        description: 'Latest processors, 1 TB SSD storage, and vibrant display.'
      },
      ar: {
        name: 'نوفا ايربوك 15',
        shortDescription: 'حاسوب محمول خفيف للإنتاجية.',
        description: 'معالجات حديثة وتخزين 1 تيرابايت وشاشة نابضة بالحياة.'
      }
    },
    seo: {
      title: 'Nova AirBook 15',
      description: 'Work anywhere with the Nova AirBook 15 ultra portable laptop.'
    }
  },
  {
    slug: 'nova-flex-case',
    price: '24.00',
    stock: 500,
    images: ['https://dummyimage.com/600x400/1f2937/ffffff.png&text=Nova+Flex+Case'],
    categorySlug: 'electronics',
    brandSlug: 'nova-tech',
    translations: {
      en: {
        name: 'Nova Flex Case',
        shortDescription: 'Protective silicone case for Nova phones.',
        description: 'Soft-touch silicone case with reinforced corners and antimicrobial coating.'
      },
      ar: {
        name: 'كفر نوفا فليكس',
        shortDescription: 'كفر سيليكون واقٍ لهواتف نوفا.',
        description: 'سيليكون ناعم بزاويا مدعمة وطبقة مضادة للميكروبات.'
      }
    },
    seo: {
      title: 'Nova Flex Case',
      description: 'Slim protective silicone case for Nova smartphones.'
    }
  },
  {
    slug: 'aero-smart-speaker',
    price: '129.00',
    stock: 190,
    images: ['https://dummyimage.com/600x400/0f172a/ffffff.png&text=Aero+Smart+Speaker'],
    rating: '4.10',
    categorySlug: 'electronics',
    brandSlug: 'aero-sound',
    translations: {
      en: {
        name: 'Aero Smart Speaker',
        shortDescription: 'Smart speaker with room-filling sound.',
        description: 'Voice assistant ready speaker with dual drivers and Wi-Fi streaming.'
      },
      ar: {
        name: 'مكبر صوت ايرو الذكي',
        shortDescription: 'مكبر صوت ذكي بصوت يغمر الغرفة.',
        description: 'مدعم بمساعد صوتي ومكبرين مع بث عبر الواي فاي.'
      }
    },
    seo: {
      title: 'Aero Smart Speaker',
      description: 'Smart speaker tuned for clear vocals and deep bass.'
    }
  },
  {
    slug: 'urban-lounge-sofa',
    price: '949.00',
    stock: 30,
    images: ['https://dummyimage.com/600x400/334155/ffffff.png&text=Urban+Lounge+Sofa'],
    rating: '4.20',
    categorySlug: 'home-living',
    brandSlug: 'urban-home',
    translations: {
      en: {
        name: 'Urban Lounge Sofa',
        shortDescription: 'Modular three-seat sofa with washable covers.',
        description: 'Performance fabric, sustainable wood framing, and modular sections.'
      },
      ar: {
        name: 'كنبة أوربان لاونج',
        shortDescription: 'كنبة بثلاثة مقاعد وأغطية قابلة للغسل.',
        description: 'قماش متين مع هيكل خشبي مستدام وأجزاء معيارية.'
      }
    },
    seo: {
      title: 'Urban Lounge Sofa',
      description: 'Modular sofa sized for apartments and compact living rooms.'
    }
  },
  {
    slug: 'urban-bamboo-cookset',
    price: '59.00',
    stock: 320,
    images: ['https://dummyimage.com/600x400/475569/ffffff.png&text=Bamboo+Cookset'],
    categorySlug: 'home-living',
    brandSlug: 'urban-home',
    translations: {
      en: {
        name: 'Urban Bamboo Cookset',
        shortDescription: 'Seven-piece bamboo utensil set for everyday cooking.',
        description: 'Sustainably sourced bamboo utensils with heat resistant handles.'
      },
      ar: {
        name: 'طقم طهي بامبو أوربان',
        shortDescription: 'طقم أدوات طهي من البامبو مكون من سبع قطع.',
        description: 'أدوات بامبو مستدامة بمقابض مقاومة للحرارة.'
      }
    },
    seo: {
      title: 'Urban Bamboo Cookset',
      description: 'Durable bamboo utensils for organized kitchens.'
    }
  },
  {
    slug: 'urban-glow-lamp',
    price: '129.00',
    stock: 110,
    images: ['https://dummyimage.com/600x400/0f172a/ffffff.png&text=Glow+Lamp'],
    categorySlug: 'home-living',
    brandSlug: 'urban-home',
    translations: {
      en: {
        name: 'Urban Glow Lamp',
        shortDescription: 'Dimmable table lamp with linen shade.',
        description: 'Warm LED lighting with touch controls and dual USB charging ports.'
      },
      ar: {
        name: 'مصباح أوربان جلو',
        shortDescription: 'مصباح طاولة معتم مع غطاء من الكتان.',
        description: 'إضاءة LED دافئة بتحكم باللمس ومنفذي شحن USB.'
      }
    },
    seo: {
      title: 'Urban Glow Lamp',
      description: 'Ambient table lamp with warm dimmable light.'
    }
  },
  {
    slug: 'vital-hydration-kit',
    price: '89.00',
    stock: 140,
    images: ['https://dummyimage.com/600x400/14532d/ffffff.png&text=Hydration+Kit'],
    rating: '4.30',
    categorySlug: 'health-beauty',
    brandSlug: 'vital-life',
    translations: {
      en: {
        name: 'Vital Hydration Kit',
        shortDescription: 'Daily hydration system with stainless bottle.',
        description: 'Steel bottle, electrolyte tablets, and habit tracker.'
      },
      ar: {
        name: 'عدة ترطيب فيتال',
        shortDescription: 'نظام ترطيب يومي مع قارورة ستانلس.',
        description: 'قارورة فولاذية وأقراص إلكتروليت ومتعقب عادات.'
      }
    },
    seo: {
      title: 'Vital Hydration Kit',
      description: 'Hydration essentials for fitness and wellness routines.'
    }
  },
  {
    slug: 'vital-glow-serum',
    price: '62.00',
    stock: 210,
    images: ['https://dummyimage.com/600x400/14532d/ffffff.png&text=Glow+Serum'],
    rating: '4.50',
    categorySlug: 'health-beauty',
    brandSlug: 'vital-life',
    translations: {
      en: {
        name: 'Vital Glow Serum',
        shortDescription: 'Vitamin enriched serum for daily skin renewal.',
        description: 'Lightweight serum with vitamins C and E to brighten and hydrate.'
      },
      ar: {
        name: 'سيروم فيتال جلو',
        shortDescription: 'سيروم غني بالفيتامينات لتجديد البشرة.',
        description: 'سيروم خفيف بفيتامين سي وإي لتفتيح وترطيب البشرة.'
      }
    },
    seo: {
      title: 'Vital Glow Serum',
      description: 'Daily serum that supports radiant and hydrated skin.'
    }
  },
  {
    slug: 'style-denim-jacket',
    price: '129.00',
    stock: 95,
    images: ['https://dummyimage.com/600x400/0f172a/ffffff.png&text=Denim+Jacket'],
    rating: '4.10',
    categorySlug: 'fashion',
    brandSlug: 'style-haven',
    translations: {
      en: {
        name: 'Style Denim Jacket',
        shortDescription: 'Classic denim jacket with modern fit.',
        description: 'Mid-weight denim with stretch, interior pocket, and matte buttons.'
      },
      ar: {
        name: 'جاكيت جينز ستايل',
        shortDescription: 'جاكيت جينز كلاسيكي بقصة عصرية.',
        description: 'دينم متوسط بمرونة وجيب داخلي وأزرار مطفية.'
      }
    },
    seo: {
      title: 'Style Denim Jacket',
      description: 'Classic denim reworked with a modern fit and finish.'
    }
  },
  {
    slug: 'style-runner-shoes',
    price: '159.00',
    salePrice: '139.00',
    discountPercentage: '12.58',
    stock: 180,
    images: ['https://dummyimage.com/600x400/111827/ffffff.png&text=Runner+Shoes'],
    rating: '4.30',
    categorySlug: 'fashion',
    brandSlug: 'style-haven',
    translations: {
      en: {
        name: 'Style Runner Shoes',
        shortDescription: 'Lightweight trainers for daily miles.',
        description: 'Breathable mesh upper, responsive midsole, and grippy outsole.'
      },
      ar: {
        name: 'حذاء ستايل رانر',
        shortDescription: 'حذاء خفيف للجري اليومي.',
        description: 'جزء علوي شبكي، نعل وسطي متجاوب ونعل خارجي بقبضة جيدة.'
      }
    },
    seo: {
      title: 'Style Runner Shoes',
      description: 'Lightweight trainers built for comfort and daily runs.'
    }
  },
  {
    slug: 'style-city-backpack',
    price: '89.00',
    stock: 220,
    images: ['https://dummyimage.com/600x400/1f2937/ffffff.png&text=City+Backpack'],
    categorySlug: 'fashion',
    brandSlug: 'style-haven',
    translations: {
      en: {
        name: 'Style City Backpack',
        shortDescription: 'Water-resistant commuter backpack.',
        description: 'Padded laptop sleeve, quick-access pockets, and breathable straps.'
      },
      ar: {
        name: 'حقيبة ظهر ستايل سيتي',
        shortDescription: 'حقيبة ظهر مقاومة للماء للتنقل.',
        description: 'حافظة لابتوب مبطنة وجيوب سهلة الوصول وأحزمة قابلة للتنفس.'
      }
    },
    seo: {
      title: 'Style City Backpack',
      description: 'Daily commuter backpack with smart organization.'
    }
  },
  {
    slug: 'outdoor-camp-lantern',
    price: '59.00',
    stock: 150,
    images: ['https://dummyimage.com/600x400/0f172a/ffffff.png&text=Camp+Lantern'],
    categorySlug: 'outdoors',
    brandSlug: 'style-haven',
    translations: {
      en: {
        name: 'Trail Camp Lantern',
        shortDescription: 'Rechargeable LED lantern with 3 brightness modes.',
        description: 'USB-C rechargeable, 20-hour runtime, and IPX4 splash resistance.'
      },
      ar: {
        name: 'فانوس التريل',
        shortDescription: 'فانوس LED قابل لإعادة الشحن بثلاث مستويات إضاءة.',
        description: 'شحن USB-C، عمر بطارية 20 ساعة، ومقاومة لرذاذ الماء IPX4.'
      }
    },
    seo: {
      title: 'Trail Camp Lantern',
      description: 'Rechargeable lantern for camping and backyard nights.'
    }
  },
  {
    slug: 'outdoor-trail-bottle',
    price: '39.00',
    stock: 260,
    images: ['https://dummyimage.com/600x400/0f172a/ffffff.png&text=Trail+Bottle'],
    categorySlug: 'outdoors',
    brandSlug: 'style-haven',
    translations: {
      en: {
        name: 'Trail Steel Bottle',
        shortDescription: 'Insulated stainless steel bottle 750ml.',
        description: 'Keeps drinks cold for 24h or hot for 12h with leak-proof lid.'
      },
      ar: {
        name: 'قارورة ستيل تريل',
        shortDescription: 'قارورة ستانلس معزولة 750 مل.',
        description: 'تحافظ على المشروبات باردة 24 ساعة أو ساخنة 12 ساعة مع غطاء محكم.'
      }
    },
    seo: {
      title: 'Trail Steel Bottle',
      description: 'Insulated bottle ready for hikes, commutes, and gym sessions.'
    }
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
    authProviderId: 'seed-customer-1'
  },
  {
    name: 'Jordan Brown',
    email: 'jordan.brown@example.com',
    phoneNumber: '+442038079000',
    isActive: false,
    lastSessionMinutesAgo: 60 * 24 * 3,
    createdDaysAgo: 90,
    authProviderId: 'seed-customer-2'
  },
  {
    name: 'Taylor Green',
    email: 'taylor.green@example.com',
    phoneNumber: '+33142278100',
    isActive: true,
    lastSessionMinutesAgo: 60 * 6,
    createdDaysAgo: 14,
    authProviderId: 'seed-customer-3'
  },
  {
    name: 'Morgan White',
    email: 'morgan.white@example.com',
    phoneNumber: '+49301234567',
    isActive: true,
    lastSessionMinutesAgo: 20,
    createdDaysAgo: 7,
    authProviderId: 'seed-customer-4'
  },
  {
    name: 'Casey Gray',
    email: 'casey.gray@example.com',
    phoneNumber: '+81312345678',
    isActive: false,
    lastSessionMinutesAgo: 60 * 24 * 14,
    createdDaysAgo: 120,
    authProviderId: 'seed-customer-5'
  }
]

const decimalOrNull = value => (value ? new Prisma.Decimal(value) : null)

const upsertCategoryTranslations = async (categoryId, translations) => {
  for (const [langKey, entry] of Object.entries(translations)) {
    if (!entry?.name) continue
    const lang = langKey.toUpperCase()
    await prisma.categoryTranslation.upsert({
      where: {
        categoryId_lang: {
          categoryId,
          lang
        }
      },
      update: {
        name: entry.name,
        description: entry.description ?? null
      },
      create: {
        categoryId,
        lang,
        name: entry.name,
        description: entry.description ?? null
      }
    })
  }
}

const upsertBrandTranslations = async (brandId, translations, descriptions) => {
  for (const [langKey, name] of Object.entries(translations)) {
    if (!name) continue
    const lang = langKey.toUpperCase()
    await prisma.brandTranslation.upsert({
      where: {
        brandId_lang: {
          brandId,
          lang
        }
      },
      update: {
        name,
        description: descriptions?.[langKey] ?? null
      },
      create: {
        brandId,
        lang,
        name,
        description: descriptions?.[langKey] ?? null
      }
    })
  }
}

const upsertProductTranslations = async (productId, translations) => {
  for (const [langKey, entry] of Object.entries(translations)) {
    if (!entry?.name) continue
    const lang = langKey.toUpperCase()
    await prisma.productTranslation.upsert({
      where: {
        productId_lang: {
          productId,
          lang
        }
      },
      update: {
        name: entry.name,
        shortDescription: entry.shortDescription ?? null,
        description: entry.description ?? null
      },
      create: {
        productId,
        lang,
        name: entry.name,
        shortDescription: entry.shortDescription ?? null,
        description: entry.description ?? null
      }
    })
  }
}

async function seedCategories() {
  const map = new Map()
  for (const category of categories) {
    const record = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: { slug: category.slug }
    })
    await upsertCategoryTranslations(record.id, category.translations)
    map.set(category.slug, record.id)
  }
  return map
}

async function seedBrands() {
  const map = new Map()
  for (const brand of brands) {
    const record = await prisma.brand.upsert({
      where: { slug: brand.slug },
      update: {
        logo: brand.logo
      },
      create: {
        slug: brand.slug,
        logo: brand.logo
      }
    })
    await upsertBrandTranslations(record.id, brand.translations, brand.descriptions)
    map.set(brand.slug, record.id)
  }
  return map
}

async function seedProducts(categoryMap, brandMap) {
  for (const product of products) {
    const categoryId = categoryMap.get(product.categorySlug)
    const brandId = brandMap.get(product.brandSlug)

    if (!categoryId) {
      throw new Error(`Missing category for product ${product.slug}`)
    }
    if (!brandId) {
      throw new Error(`Missing brand for product ${product.slug}`)
    }

    const price = new Prisma.Decimal(product.price)
    const salePrice = decimalOrNull(product.salePrice)
    const discountPercentage = decimalOrNull(product.discountPercentage)
    const rating = decimalOrNull(product.rating)

    const record = await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        price,
        salePrice,
        discountPercentage,
        stock: product.stock,
        images: product.images,
        rating,
        categoryId,
        brandId,
        isPublished: true,
        isArchived: false
      },
      create: {
        slug: product.slug,
        price,
        salePrice,
        discountPercentage,
        stock: product.stock,
        images: product.images,
        rating,
        categoryId,
        brandId,
        isPublished: true,
        isArchived: false
      }
    })

    await upsertProductTranslations(record.id, product.translations)
  }
}

const minutesAgoToDate = minutes => new Date(Date.now() - minutes * 60 * 1000)
const daysAgoToDate = days => new Date(Date.now() - days * 24 * 60 * 60 * 1000)

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
        authProviderId: customer.authProviderId,
        role: 'CUSTOMER'
      }
    })
  }
}

async function main() {
  const categoryMap = await seedCategories()
  const brandMap = await seedBrands()
  await seedProducts(categoryMap, brandMap)
  await seedCustomers()
}

main()
  .then(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
  .catch(async (error) => {
    console.error('Seeding failed', error)
    await prisma.$disconnect()
    await pool.end()
    process.exit(1)
  })
