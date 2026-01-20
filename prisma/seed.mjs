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
  { slug: 'mens-fashion', translations: { en: { name: 'Men\'s Fashion' }, ar: { name: 'أزياء رجالي' } } },
  { slug: 'womens-fashion', translations: { en: { name: 'Women\'s Fashion' }, ar: { name: 'أزياء نسائي' } } },
  { slug: 'shoes', translations: { en: { name: 'Shoes' }, ar: { name: 'أحذية' } } },
  { slug: 'bags', translations: { en: { name: 'Bags' }, ar: { name: 'حقائب' } } },
  { slug: 'accessories', translations: { en: { name: 'Accessories' }, ar: { name: 'إكسسوارات' } } },
  { slug: 'winter-collection', translations: { en: { name: 'Winter Collection' }, ar: { name: 'كولكشن الشتاء' } } }
]

const brands = [
  {
    slug: 'turkey-style',
    logo: 'https://images.unsplash.com/photo-1560243563-062bfc001d68?w=96',
    translations: { en: 'Turkey Style', ar: 'تركي ستايل' },
    descriptions: { en: 'Authentic Turkish fashion for every occasion.', ar: 'أزياء تركية أصيلة لكل مناسبة.' }
  },
  {
    slug: 'istanbul-trends',
    logo: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=96',
    translations: { en: 'Istanbul Trends', ar: 'تريندات إسطنبول' },
    descriptions: { en: 'Trendy styles from the heart of Istanbul.', ar: 'أحدث صيحات الموضة من قلب إسطنبول.' }
  },
  {
    slug: 'anatolian-crafts',
    logo: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=96',
    translations: { en: 'Anatolian Crafts', ar: 'حرف الأناضول' },
    descriptions: { en: 'Handcrafted quality from Anatolia.', ar: 'جودة يدوية من الأناضول.' }
  },
  {
    slug: 'modern-ottoman',
    logo: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=96',
    translations: { en: 'Modern Ottoman', ar: 'العثماني الحديث' },
    descriptions: { en: 'Blend of heritage and modern fashion.', ar: 'مزج بين التراث والموضة الحديثة.' }
  }
]

const products = [
  // Men's Fashion - Shirts
  {
    slug: 'mens-striped-shirt-2026',
    price: '450.00',
    salePrice: '350.00',
    discountPercentage: '22.22',
    stock: 120,
    images: [
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600',
      'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600'
    ],
    rating: '4.80',
    categorySlug: 'mens-fashion',
    brandSlug: 'turkey-style',
    translations: {
      en: {
        name: 'Striped Fashion Shirt 2026',
        shortDescription: 'Premium cotton striped shirt with modern fit.',
        description: 'High quality Turkish cotton shirt with elegant stripes. Perfect for both casual and formal occasions.'
      },
      ar: {
        name: 'قميص موضة مخطط 2026',
        shortDescription: 'قميص قطني فاخر مخطط بقصة عصرية.',
        description: 'قميص قطني تركي عالي الجودة بخطوط أنيقة. مثالي للمناسبات الرسمية والكاجوال.'
      }
    },
    seo: {
      title: 'Striped Fashion Shirt 2026 | Turkey Store',
      description: 'Shop premium Turkish striped shirts for men.'
    }
  },
  {
    slug: 'mens-slim-fit-shirt-black',
    price: '420.00',
    salePrice: '320.00',
    discountPercentage: '23.81',
    stock: 85,
    images: [
      'https://images.unsplash.com/photo-1620012253295-c15cc3e65df4?w=600',
      'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=600'
    ],
    rating: '4.70',
    categorySlug: 'mens-fashion',
    brandSlug: 'istanbul-trends',
    translations: {
      en: {
        name: 'Slim Fit Black Shirt',
        shortDescription: 'Elegant black slim fit shirt.',
        description: 'Premium slim fit black shirt made from Turkish fabric. Breathable and comfortable for all-day wear.'
      },
      ar: {
        name: 'قميص أسود سليم فيت',
        shortDescription: 'قميص أسود أنيق بقصة ضيقة.',
        description: 'قميص أسود سليم فيت من قماش تركي فاخر. قابل للتنفس ومريح طوال اليوم.'
      }
    },
    seo: {
      title: 'Slim Fit Black Shirt | Turkey Store',
      description: 'Premium black slim fit shirt for men.'
    }
  },
  {
    slug: 'mens-casual-linen-shirt',
    price: '380.00',
    stock: 150,
    images: [
      'https://images.unsplash.com/photo-1602810318660-d2c46b750f88?w=600'
    ],
    rating: '4.60',
    categorySlug: 'mens-fashion',
    brandSlug: 'anatolian-crafts',
    translations: {
      en: {
        name: 'Casual Linen Shirt',
        shortDescription: 'Lightweight linen shirt for summer.',
        description: 'Natural linen shirt perfect for hot summer days. Loose fit for maximum comfort.'
      },
      ar: {
        name: 'قميص كتان كاجوال',
        shortDescription: 'قميص كتان خفيف للصيف.',
        description: 'قميص كتان طبيعي مثالي لأيام الصيف الحارة. قصة واسعة لراحة قصوى.'
      }
    },
    seo: {
      title: 'Casual Linen Shirt | Turkey Store',
      description: 'Comfortable linen shirt for summer.'
    }
  },
  {
    slug: 'mens-polo-navy',
    price: '280.00',
    salePrice: '220.00',
    discountPercentage: '21.43',
    stock: 200,
    images: [
      'https://images.unsplash.com/photo-1625910513413-5fc45e80bc10?w=600'
    ],
    rating: '4.50',
    categorySlug: 'mens-fashion',
    brandSlug: 'turkey-style',
    translations: {
      en: {
        name: 'Navy Blue Polo Shirt',
        shortDescription: 'Classic navy polo shirt.',
        description: 'Premium cotton polo in navy blue. Perfect for casual outings and golf.'
      },
      ar: {
        name: 'بولو أزرق نيفي',
        shortDescription: 'بولو كلاسيكي أزرق نيفي.',
        description: 'بولو قطني فاخر باللون الأزرق النيفي. مثالي للتنزه والجولف.'
      }
    },
    seo: {
      title: 'Navy Blue Polo Shirt | Turkey Store',
      description: 'Classic polo shirt for men.'
    }
  },
  // Women's Fashion
  {
    slug: 'womens-elegant-blouse',
    price: '520.00',
    salePrice: '420.00',
    discountPercentage: '19.23',
    stock: 75,
    images: [
      'https://images.unsplash.com/photo-1551048632-24e444b48a3e?w=600',
      'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=600'
    ],
    rating: '4.90',
    categorySlug: 'womens-fashion',
    brandSlug: 'istanbul-trends',
    translations: {
      en: {
        name: 'Elegant Silk Blouse',
        shortDescription: 'Premium silk blouse for women.',
        description: 'Luxurious Turkish silk blouse with delicate details. Perfect for special occasions.'
      },
      ar: {
        name: 'بلوزة حرير أنيقة',
        shortDescription: 'بلوزة حرير فاخرة للنساء.',
        description: 'بلوزة حرير تركي فاخرة بتفاصيل رقيقة. مثالية للمناسبات الخاصة.'
      }
    },
    seo: {
      title: 'Elegant Silk Blouse | Turkey Store',
      description: 'Premium silk blouse for women.'
    }
  },
  {
    slug: 'womens-casual-dress',
    price: '680.00',
    salePrice: '550.00',
    discountPercentage: '19.12',
    stock: 60,
    images: [
      'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600'
    ],
    rating: '4.85',
    categorySlug: 'womens-fashion',
    brandSlug: 'modern-ottoman',
    translations: {
      en: {
        name: 'Casual Summer Dress',
        shortDescription: 'Flowy summer dress with floral pattern.',
        description: 'Light and comfortable summer dress with beautiful floral prints. Perfect for beach and casual outings.'
      },
      ar: {
        name: 'فستان صيفي كاجوال',
        shortDescription: 'فستان صيفي انسيابي بنقشة زهور.',
        description: 'فستان صيفي خفيف ومريح بطبعات زهور جميلة. مثالي للشاطئ والتنزه.'
      }
    },
    seo: {
      title: 'Casual Summer Dress | Turkey Store',
      description: 'Beautiful summer dress for women.'
    }
  },
  {
    slug: 'womens-cardigan-beige',
    price: '450.00',
    stock: 90,
    images: [
      'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600'
    ],
    rating: '4.70',
    categorySlug: 'womens-fashion',
    brandSlug: 'anatolian-crafts',
    translations: {
      en: {
        name: 'Beige Wool Cardigan',
        shortDescription: 'Soft wool cardigan for winter.',
        description: 'Cozy wool cardigan in beige color. Perfect layering piece for cold weather.'
      },
      ar: {
        name: 'كارديجان صوف بيج',
        shortDescription: 'كارديجان صوف ناعم للشتاء.',
        description: 'كارديجان صوف مريح باللون البيج. قطعة مثالية للطبقات في الطقس البارد.'
      }
    },
    seo: {
      title: 'Beige Wool Cardigan | Turkey Store',
      description: 'Soft wool cardigan for women.'
    }
  },
  // Shoes
  {
    slug: 'mens-leather-oxford',
    price: '850.00',
    salePrice: '720.00',
    discountPercentage: '15.29',
    stock: 45,
    images: [
      'https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=600',
      'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=600'
    ],
    rating: '4.95',
    categorySlug: 'shoes',
    brandSlug: 'turkey-style',
    translations: {
      en: {
        name: 'Leather Oxford Shoes',
        shortDescription: 'Premium leather oxford dress shoes.',
        description: 'Handcrafted Turkish leather oxford shoes. Classic design with modern comfort.'
      },
      ar: {
        name: 'حذاء أوكسفورد جلد',
        shortDescription: 'حذاء أوكسفورد جلد طبيعي فاخر.',
        description: 'حذاء أوكسفورد جلد تركي صناعة يدوية. تصميم كلاسيكي براحة عصرية.'
      }
    },
    seo: {
      title: 'Leather Oxford Shoes | Turkey Store',
      description: 'Premium leather oxford shoes for men.'
    }
  },
  {
    slug: 'mens-casual-sneakers',
    price: '480.00',
    salePrice: '380.00',
    discountPercentage: '20.83',
    stock: 130,
    images: [
      'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600'
    ],
    rating: '4.65',
    categorySlug: 'shoes',
    brandSlug: 'istanbul-trends',
    translations: {
      en: {
        name: 'Casual White Sneakers',
        shortDescription: 'Stylish white sneakers for everyday wear.',
        description: 'Comfortable and stylish white sneakers. Perfect for casual and smart casual looks.'
      },
      ar: {
        name: 'سنيكرز أبيض كاجوال',
        shortDescription: 'سنيكرز أبيض أنيق للاستخدام اليومي.',
        description: 'سنيكرز أبيض مريح وأنيق. مثالي للإطلالات الكاجوال والسمارت كاجوال.'
      }
    },
    seo: {
      title: 'Casual White Sneakers | Turkey Store',
      description: 'Stylish white sneakers for men.'
    }
  },
  {
    slug: 'womens-heels-black',
    price: '620.00',
    salePrice: '520.00',
    discountPercentage: '16.13',
    stock: 55,
    images: [
      'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600'
    ],
    rating: '4.80',
    categorySlug: 'shoes',
    brandSlug: 'modern-ottoman',
    translations: {
      en: {
        name: 'Elegant Black Heels',
        shortDescription: 'Classic black high heels.',
        description: 'Elegant black heels with comfortable cushioning. Perfect for formal occasions.'
      },
      ar: {
        name: 'كعب أسود أنيق',
        shortDescription: 'كعب عالي أسود كلاسيكي.',
        description: 'كعب أسود أنيق مع بطانة مريحة. مثالي للمناسبات الرسمية.'
      }
    },
    seo: {
      title: 'Elegant Black Heels | Turkey Store',
      description: 'Classic black heels for women.'
    }
  },
  // Bags
  {
    slug: 'leather-crossbody-bag',
    price: '750.00',
    salePrice: '620.00',
    discountPercentage: '17.33',
    stock: 40,
    images: [
      'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600'
    ],
    rating: '4.88',
    categorySlug: 'bags',
    brandSlug: 'anatolian-crafts',
    translations: {
      en: {
        name: 'Leather Crossbody Bag',
        shortDescription: 'Handcrafted leather crossbody bag.',
        description: 'Premium Turkish leather crossbody bag. Spacious compartments with adjustable strap.'
      },
      ar: {
        name: 'حقيبة كروس جلد',
        shortDescription: 'حقيبة كروس جلد صناعة يدوية.',
        description: 'حقيبة كروس جلد تركي فاخر. جيوب واسعة مع حزام قابل للتعديل.'
      }
    },
    seo: {
      title: 'Leather Crossbody Bag | Turkey Store',
      description: 'Handcrafted leather crossbody bag.'
    }
  },
  {
    slug: 'womens-tote-bag-tan',
    price: '580.00',
    stock: 70,
    images: [
      'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600'
    ],
    rating: '4.72',
    categorySlug: 'bags',
    brandSlug: 'turkey-style',
    translations: {
      en: {
        name: 'Tan Leather Tote Bag',
        shortDescription: 'Spacious leather tote bag.',
        description: 'Large leather tote bag in tan color. Perfect for work and shopping.'
      },
      ar: {
        name: 'حقيبة توت جلد تان',
        shortDescription: 'حقيبة توت جلد واسعة.',
        description: 'حقيبة توت جلد كبيرة باللون التان. مثالية للعمل والتسوق.'
      }
    },
    seo: {
      title: 'Tan Leather Tote Bag | Turkey Store',
      description: 'Spacious leather tote bag for women.'
    }
  },
  {
    slug: 'mens-laptop-briefcase',
    price: '920.00',
    salePrice: '780.00',
    discountPercentage: '15.22',
    stock: 35,
    images: [
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600'
    ],
    rating: '4.90',
    categorySlug: 'bags',
    brandSlug: 'istanbul-trends',
    translations: {
      en: {
        name: 'Leather Laptop Briefcase',
        shortDescription: 'Professional leather briefcase.',
        description: 'Premium leather briefcase with laptop compartment. Ideal for business professionals.'
      },
      ar: {
        name: 'حقيبة لابتوب جلد',
        shortDescription: 'حقيبة مهنية من الجلد.',
        description: 'حقيبة جلد فاخرة مع حجرة للابتوب. مثالية لرجال الأعمال.'
      }
    },
    seo: {
      title: 'Leather Laptop Briefcase | Turkey Store',
      description: 'Professional leather briefcase for men.'
    }
  },
  // Accessories
  {
    slug: 'leather-belt-brown',
    price: '280.00',
    salePrice: '220.00',
    discountPercentage: '21.43',
    stock: 180,
    images: [
      'https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=600'
    ],
    rating: '4.55',
    categorySlug: 'accessories',
    brandSlug: 'turkey-style',
    translations: {
      en: {
        name: 'Brown Leather Belt',
        shortDescription: 'Classic brown leather belt.',
        description: 'High quality Turkish leather belt with brass buckle. Timeless design.'
      },
      ar: {
        name: 'حزام جلد بني',
        shortDescription: 'حزام جلد بني كلاسيكي.',
        description: 'حزام جلد تركي عالي الجودة بإبزيم نحاسي. تصميم خالد.'
      }
    },
    seo: {
      title: 'Brown Leather Belt | Turkey Store',
      description: 'Classic brown leather belt for men.'
    }
  },
  {
    slug: 'silk-scarf-floral',
    price: '350.00',
    stock: 100,
    images: [
      'https://images.unsplash.com/photo-1601924582970-9238bcb495d9?w=600'
    ],
    rating: '4.78',
    categorySlug: 'accessories',
    brandSlug: 'modern-ottoman',
    translations: {
      en: {
        name: 'Floral Silk Scarf',
        shortDescription: 'Elegant silk scarf with floral pattern.',
        description: 'Luxurious Turkish silk scarf with beautiful floral design. Perfect accessory for any outfit.'
      },
      ar: {
        name: 'وشاح حرير زهور',
        shortDescription: 'وشاح حرير أنيق بنقشة زهور.',
        description: 'وشاح حرير تركي فاخر بتصميم زهور جميل. إكسسوار مثالي لأي إطلالة.'
      }
    },
    seo: {
      title: 'Floral Silk Scarf | Turkey Store',
      description: 'Elegant silk scarf for women.'
    }
  },
  {
    slug: 'leather-wallet-black',
    price: '320.00',
    salePrice: '260.00',
    discountPercentage: '18.75',
    stock: 150,
    images: [
      'https://images.unsplash.com/photo-1627123424574-724758594e93?w=600'
    ],
    rating: '4.68',
    categorySlug: 'accessories',
    brandSlug: 'anatolian-crafts',
    translations: {
      en: {
        name: 'Black Leather Wallet',
        shortDescription: 'Slim leather wallet with RFID protection.',
        description: 'Premium leather wallet with multiple card slots and RFID blocking technology.'
      },
      ar: {
        name: 'محفظة جلد سوداء',
        shortDescription: 'محفظة جلد رفيعة مع حماية RFID.',
        description: 'محفظة جلد فاخرة بفتحات متعددة للبطاقات وتقنية حجب RFID.'
      }
    },
    seo: {
      title: 'Black Leather Wallet | Turkey Store',
      description: 'Premium leather wallet for men.'
    }
  },
  // Winter Collection
  {
    slug: 'wool-overcoat-gray',
    price: '1450.00',
    salePrice: '1150.00',
    discountPercentage: '20.69',
    stock: 30,
    images: [
      'https://images.unsplash.com/photo-1544923246-77307dd628b5?w=600',
      'https://images.unsplash.com/photo-1539533113208-f6df8cc8b543?w=600'
    ],
    rating: '4.92',
    categorySlug: 'winter-collection',
    brandSlug: 'turkey-style',
    translations: {
      en: {
        name: 'Wool Overcoat Gray',
        shortDescription: 'Premium wool overcoat for winter.',
        description: 'Luxurious wool overcoat in gray. Double-breasted design with satin lining.'
      },
      ar: {
        name: 'معطف صوف رمادي',
        shortDescription: 'معطف صوف فاخر للشتاء.',
        description: 'معطف صوف فاخر باللون الرمادي. تصميم ببطانة ساتان.'
      }
    },
    seo: {
      title: 'Wool Overcoat Gray | Turkey Store',
      description: 'Premium wool overcoat for men.'
    }
  },
  {
    slug: 'knit-sweater-burgundy',
    price: '480.00',
    salePrice: '380.00',
    discountPercentage: '20.83',
    stock: 85,
    images: [
      'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600'
    ],
    rating: '4.75',
    categorySlug: 'winter-collection',
    brandSlug: 'istanbul-trends',
    translations: {
      en: {
        name: 'Burgundy Knit Sweater',
        shortDescription: 'Warm knit sweater in burgundy.',
        description: 'Soft merino wool sweater in rich burgundy color. Perfect for cold winter days.'
      },
      ar: {
        name: 'سويتر محبوك بورجندي',
        shortDescription: 'سويتر محبوك دافئ بلون بورجندي.',
        description: 'سويتر صوف ميرينو ناعم بلون بورجندي غني. مثالي لأيام الشتاء الباردة.'
      }
    },
    seo: {
      title: 'Burgundy Knit Sweater | Turkey Store',
      description: 'Warm knit sweater for men.'
    }
  },
  {
    slug: 'puffer-jacket-navy',
    price: '780.00',
    salePrice: '620.00',
    discountPercentage: '20.51',
    stock: 65,
    images: [
      'https://images.unsplash.com/photo-1544923246-77307dd628b5?w=600'
    ],
    rating: '4.82',
    categorySlug: 'winter-collection',
    brandSlug: 'modern-ottoman',
    translations: {
      en: {
        name: 'Navy Puffer Jacket',
        shortDescription: 'Warm puffer jacket for extreme cold.',
        description: 'Down-filled puffer jacket with water-resistant outer shell. Ultra warm for harsh winters.'
      },
      ar: {
        name: 'جاكيت بافر نيفي',
        shortDescription: 'جاكيت بافر دافئ للبرد القارس.',
        description: 'جاكيت بافر محشو بالريش مع غلاف مقاوم للماء. دافئ جداً للشتاء القارس.'
      }
    },
    seo: {
      title: 'Navy Puffer Jacket | Turkey Store',
      description: 'Warm puffer jacket for men.'
    }
  },
  {
    slug: 'cashmere-scarf-camel',
    price: '550.00',
    stock: 50,
    images: [
      'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=600'
    ],
    rating: '4.88',
    categorySlug: 'winter-collection',
    brandSlug: 'anatolian-crafts',
    translations: {
      en: {
        name: 'Cashmere Scarf Camel',
        shortDescription: 'Pure cashmere scarf in camel color.',
        description: 'Luxurious 100% cashmere scarf. Incredibly soft and warm. A winter essential.'
      },
      ar: {
        name: 'وشاح كشمير كاميل',
        shortDescription: 'وشاح كشمير نقي بلون الكاميل.',
        description: 'وشاح كشمير فاخر 100%. ناعم ودافئ بشكل لا يصدق. قطعة أساسية للشتاء.'
      }
    },
    seo: {
      title: 'Cashmere Scarf Camel | Turkey Store',
      description: 'Pure cashmere scarf for winter.'
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
  console.log('Starting seed...')
  const categoryMap = await seedCategories()
  console.log(`Seeded ${categoryMap.size} categories`)
  const brandMap = await seedBrands()
  console.log(`Seeded ${brandMap.size} brands`)
  await seedProducts(categoryMap, brandMap)
  console.log(`Seeded ${products.length} products`)
  await seedCustomers()
  console.log(`Seeded ${customers.length} customers`)
  console.log('Seed complete!')
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
