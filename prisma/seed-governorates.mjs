// Seed script for Governorates, Areas, and Shipping Zones
// Run with: node prisma/seed-governorates.mjs

import dotenv from 'dotenv'

dotenv.config()

process.env.PRISMA_CLIENT_ENGINE_TYPE ??= 'client'

const { PrismaClient } = await import('@prisma/client')
const { PrismaPg } = await import('@prisma/adapter-pg')
const { Pool } = await import('pg')

const connectionString = process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? process.env.POSTGRES_PRISMA_URL

if (!connectionString) {
  throw new Error('DATABASE_URL is required for seeding.')
}

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// Egypt governorates and areas data
const governoratesData = {
  'Cairo': {
    nameAr: 'القاهرة',
    areas: {
      'Hadayek Al Zaiton': 'حدائق الزيتون',
      'El Shorouk': 'الشروق',
      'El Marg': 'المرج',
      'Maadi Degla': 'المعادي دجلة',
      'Abaseya': 'العباسية',
      'New Nozha': 'النزهة الجديدة',
      'Dar Al Salam': 'دار السلام',
      'Al Kalaa': 'القلعة',
      'Basateen': 'البساتين',
      'Abdo Basha': 'عبده باشا',
      'Nasr City': 'مدينة نصر',
      '15th Of May City': 'مدينة 15 مايو',
      '5th Settlement': 'التجمع الخامس',
      'Heliopolis': 'مصر الجديدة',
      '3rd Settlement': 'التجمع الثالث',
      'Ezbet El Nakhl': 'عزبة النخل',
      'Katamiah': 'قطامية',
      'El Herafieen': 'الحرفيين',
      'Down Town': 'وسط البلد',
      'New Maadi': 'المعادى الجديدة',
      'Zamalek': 'الزمالك',
      '1st Settlement': 'التجمع الاول',
      'Helwan': 'حلوان',
      'Al Zeitoun': 'الزيتون',
      'Masaken Sheraton': 'مساكن شيراتون',
      'Hadayek Helwan': 'حدائق حلوان',
      'Ghamrah': 'غمره',
      'Rod El Farag': 'روض الفرج',
      'Al Matareya': 'المطرية',
      'Al Kasr Al Einy': 'القصر العيني',
      'New Cairo': 'القاهرة الجديدة',
      'Ain Shams': 'عين شمس',
      'Garden City': 'جاردن سيتي',
      'Mirage City': 'ميراج سيتى',
      'Amiria': 'العامرية',
      'Al Azhar': 'الأزهر',
      'Sayeda Zeinab': 'السيدة زينب',
      'Almaza': 'الماظة',
      'Fustat': 'الفسطاط',
      'Hadayek Maadi': 'حدائق المعادي',
      'Al Rehab': 'الرحاب',
      'Al Moski': 'الموسكي',
      'Manial Al Rodah': 'منيل الروضة',
      'Maadi': 'المعادى',
      'El Tahrir': 'التحرير',
      'New El Marg': 'نيو المرج',
      'Gesr Al Suez': 'جسر السويس',
      'Abdeen': 'عابدين',
      'Mokattam': 'المقطم',
      'Al Salam City': 'مدينة السلام',
      'Misr El Kadima': 'مصر القديمة',
      'Helmiet Elzaitoun': 'حلمية الزيتون',
      'Al Daher': 'الضاهر',
      'Hadayek Al Qobah': 'حدائق القبة',
      'Shubra': 'شبرا',
      'Cornish Al Nile': 'كورنيش النيل',
      'Badr City': 'مدينة بدر',
      'Ramsis': 'رمسيس',
      'Madinty': 'مدينتي',
      'Helmeya': 'الحلمية'
    }
  },
  'Giza': {
    nameAr: 'الجيزة',
    areas: {
      '6th of October': 'السادس من اكتوبر',
      'Mansoureya': 'المنصورية',
      'Hawamdya': 'الحوامدية',
      'Tirsa': 'تيرسا',
      'Abou Rawash': 'ابو رواش',
      'Omraneya': 'العمرانية',
      'Smart Village': 'القرية الذكية',
      'Kerdasa': 'كرداسة',
      'Saft El Laban': 'صفط اللبن',
      'Dokki': 'الدقي',
      'Al Saf': 'الصف',
      'Sheikh Zayed': 'الشيخ زايد',
      'Sakiat Mekki': 'ساقية مكي',
      'Mohandessin': 'المهندسين',
      'Al Kom Al Ahmer': 'الكوم الأحمر',
      'Imbaba': 'إمبابة',
      'Bolak Al Dakrour': 'بولاق الدكرور',
      'Al Monib': 'المنيب',
      'Berak Alkiaam': 'برك الكيام',
      'Al Moatamadia': 'المعتمدية',
      'Shabramant': 'شبرامانت',
      'Warraq': 'الوراق',
      'Manial': 'المنيل',
      'Haram': 'الهرم',
      'Agouza': 'العجوزة',
      'Qism el Giza': 'قسم الجيزة',
      'Faisal': 'فيصل',
      'Al Wahat': 'الواحات',
      'Hadayeq El Ahram': 'حدائق الاهرام',
      'Aossim': 'أوسيم',
      'Al Nobariah': 'النوبارية',
      'Badrashin': 'بدراشين',
      'Kit Kat': 'كت كات',
      'Al Barageel': 'البراجيل',
      'Al Manashi': 'المناشي'
    }
  },
  'Alexandria': {
    nameAr: 'الإسكندرية',
    areas: {
      'Miami': 'ميامي',
      'Smouha': 'سموحة',
      'Abees': 'أبيس',
      'Sedi Gaber': 'سيدي جابر',
      'El Borg El Kadem': 'البرج القديم',
      'Sedi Bisher': 'سيدي بشر',
      'Al Bitash': 'البيطاش',
      'Stanly': 'ستانلي',
      'El-Agamy': 'العجمي',
      'San Stefano': 'سان ستيفانو',
      'Mahtet El-Raml': 'محطة الرمل',
      'Al A\'mriah': 'العامرية',
      'Bangar EL Sokar': 'بنجر السكر',
      'Manshia': 'المنشية',
      'Sedi Kreir': 'سيدي كرير',
      'Kafer Abdou': 'كفر عبده',
      'Borg El Arab': 'برج العرب',
      'Roshdy': 'رشدي',
      'Abu Keer': 'ابو قير',
      'Glem': 'جليم',
      'Al Nahda Al Amria': 'النهضة العامرية',
      'Awaied-Ras Souda': 'عويد راس سودا',
      'Mandara': 'المندرة',
      'City Center': 'وسط المدينة',
      'Azarita': 'أزاريتا',
      'Maamora': 'المعمورة',
      'Al Soyof': 'السيوف',
      'Sporting': 'سبورتنج',
      'Khorshid': 'خورشيد',
      'Luran': 'لوران',
      'Asafra': 'العصافرة',
      'Zezenya': 'زيزينيا',
      'Muntazah': 'المنتزه'
    }
  },
  'Al Beheira': {
    nameAr: 'البحيرة',
    areas: {
      'Hosh Issa': 'حوش عيسى',
      'Rashid': 'رشيد',
      'Shubrakhit': 'شبراخيت',
      'Edko': 'إدكو',
      'Damanhour': 'دمنهور',
      'Etay Al Barud': 'ايتاي البارود',
      'Abu Hummus': 'ابو حمص',
      'Kom Hamadah': 'كوم حمادة',
      'Abou Al Matamer': 'ابو المطامير',
      'Al Delengat': 'الدلنجات',
      'El Nubariyah': 'النوبارية',
      'Kafr El Dawwar': 'كفر الدوار',
      'Edfina': 'إدفينا',
      'Wadi Al Natroun': 'وادي النطرون',
      'Al Mahmoudiyah': 'المحمودية',
      'Al Rahmaniyah': 'الرحمانية'
    }
  },
  'Al Daqahliya': {
    nameAr: 'الدقهلية',
    areas: {
      'Meet Ghamr': 'ميت غمر',
      'Belqas': 'بلقاس',
      'Nabroo': 'نابرو',
      'Manzala': 'المنزلة',
      'Shrbeen': 'شربين',
      'El Sinblaween': 'السنبلاوين',
      'Menit El Nasr': 'منية النصر',
      'Dekernes': 'دكرنس',
      'Aga': 'آغا',
      'Talkha': 'طلخا',
      'Al Mansoura': 'المنصورة'
    }
  },
  'Al Fayoum': {
    nameAr: 'الفيوم',
    areas: {
      'Sonores': 'سنورس',
      'Ebshoy': 'إبشواي',
      'Kofooer Elniel': 'كفور النيل',
      'New Fayoum': 'الفيوم الجديدة',
      'Atsa': 'اطسا',
      'Sanhoor': 'سنهور',
      'Tameaa': 'طامية',
      'Sersenaa': 'سيرسينا',
      'El Aagamen': 'العجمين',
      'Manshaa Abdalla': 'منشاء عبد الله',
      'Youssef Sadek': 'يوسف صادق',
      'Manshaa Elgamal': 'منشأة الجمال'
    }
  },
  'Al Gharbia': {
    nameAr: 'الغربية',
    areas: {
      'Alsanta': 'السنطة',
      'Al Mahala Al Kobra': 'المحلة الكبرى',
      'Samanood': 'سمنود',
      'Tanta': 'طنطا',
      'Qotoor': 'قطور',
      'Zefta': 'زفتى',
      'Basyoon': 'بسيون',
      'Kafr Alziat': 'كفر الزيات'
    }
  },
  'Al Meniya': {
    nameAr: 'المنيا',
    areas: {
      'Minya': 'المنيا',
      'Samaloot': 'سمالوط',
      'Eladwa': 'العدوة',
      'Mghagha': 'مغاغة',
      'Matai': 'مطاى',
      'Malawi': 'ملاوي',
      'Bani Mazar': 'بني مزار',
      'Dermwas': 'ديرماس',
      'Abo Korkas': 'ابو قرقاص'
    }
  },
  'Al Monufia': {
    nameAr: 'المنوفية',
    areas: {
      'Shohada': 'الشهداء',
      'Menoof': 'منوف',
      'Tala': 'تلا',
      'Shebin El Koom': 'شبين الكوم',
      'Sadat City': 'مدينة السادات',
      'Quesna': 'قويسنا',
      'Berket Al Sabei': 'بركة السبع',
      'Ashmoon': 'أشمون'
    }
  },
  'Al Sharqia': {
    nameAr: 'الشرقية',
    areas: {
      'Al Salhiya Al Gedida': 'الصالحية الجديدة',
      'Abu Hammad': 'ابو حماد',
      'Abu Kbeer': 'ابو كبير',
      'Hehya': 'ههيا',
      'Awlad Saqr': 'اولاد صقر',
      'Al Hasiniya': 'الحسينية',
      'Faqous': 'فاقوس',
      'Darb Negm': 'درب نجم',
      'Al Ibrahimiya': 'الابراهيمية',
      'Zakazik': 'الزقازيق',
      'Kafr Saqr': 'كفر صقر',
      'Mashtool Al Sooq': 'مشتول السوق',
      'Belbes': 'بيلبيس',
      'Meniya Alqamh': 'منيا القمه',
      '10th of Ramadan City': 'العاشر من رمضان'
    }
  },
  'Aswan': {
    nameAr: 'أسوان',
    areas: {
      'Aswan': 'أسوان',
      'Draw': 'دراو',
      'El Klabsha': 'كلابشة',
      'Al Sad Al Aali': 'السد العالي',
      'Abu Simbel': 'أبو سمبل',
      'Nasr Elnoba': 'نصر النوبة',
      'Edfo': 'إدفو',
      'Markaz Naser': 'مركز ناصر',
      'Kom Ombo': 'كوم امبو'
    }
  },
  'Asyut': {
    nameAr: 'أسيوط',
    areas: {
      'Dayrout': 'ديروط',
      'Asyut': 'أسيوط',
      'El Qusya': 'القوصية',
      'Assuit Elgdeda': 'اسيوط الجديدة',
      'Elfath': 'الفتح',
      'El Ghnayem': 'الغنايم',
      'Sahel Selim': 'ساحل سليم',
      'Abnoub': 'أبنوب',
      'El Badari': 'البدارى',
      'Abou Teag': 'ابو تيج',
      'Serfa': 'سيرفا',
      'Manflout': 'منفلوط'
    }
  },
  'Bani Souaif': {
    nameAr: 'بني سويف',
    areas: {
      'Bani Souaif': 'بني سويف',
      'El Wastaa': 'الواسطى',
      'El Korimat': 'الكريمات',
      'El Fashn': 'الفشن',
      'Naser': 'ناصر',
      'Ahnaseaa': 'إهناسيا',
      'New Bani Souaif': 'بني سويف الجديدة',
      'Bebaa': 'ببا',
      'Smostaa': 'سمسطا'
    }
  },
  'Damietta': {
    nameAr: 'دمياط',
    areas: {
      'Kafr Saad': 'كفر سعد',
      'Ras El Bar': 'رأس البر',
      'Fareskor': 'فارسكور',
      'Al Zarkah': 'الزرقا',
      'Damietta': 'دمياط',
      'New Damietta': 'دمياط الجديدة'
    }
  },
  'Ismailia': {
    nameAr: 'الإسماعيلية',
    areas: {
      'Elsalhia Elgdida': 'الصالحية الجديدة',
      'Al Kasaseen': 'القصاصين',
      'Abo Sultan': 'ابو سلطان',
      'El Tal El Kebir': 'التل الكبير',
      'Abu Swer': 'ابو صوير',
      'Qantara Gharb': 'قنطرة غرب',
      'Qantara Sharq': 'القنطرة شرق',
      'Nfeesha': 'نفيشة',
      'Ismailia': 'الإسماعيلية',
      'Srabioom': 'سرابيوم',
      'Fayed': 'فايد'
    }
  },
  'Kafr El Sheikh': {
    nameAr: 'كفر الشيخ',
    areas: {
      'Hamool': 'الحامول',
      'Kafr El Sheikh': 'كفر الشيخ',
      'Al Riadh': 'الرياض',
      'Qeleen': 'قلين',
      'Desouq': 'دسوق',
      'Seedy Salem': 'سيدى سالم',
      'Bela': 'بيلا',
      'Fooh': 'فوه',
      'Metobas': 'مطوبس',
      'Borollos': 'برج البرلس',
      'Balteem': 'بلطيم'
    }
  },
  'Luxor': {
    nameAr: 'الأقصر',
    areas: {
      'El Karnak': 'الكرنك',
      'El Korna': 'القرنة',
      'Armant Sharq': 'ارمنت شرق',
      'Esnaa': 'اسنا',
      'Luxor': 'الأقصر',
      'Armant Gharb': 'ارمنت غرب'
    }
  },
  'Matrooh': {
    nameAr: 'مطروح',
    areas: {
      'Matrooh': 'مطروح',
      'El Alamein': 'العلمين',
      'Sidi Abdel Rahman': 'سيدي عبد الرحمن',
      'El Dabaa': 'الضبعة',
      'Marsa Matrooh': 'مرسى مطروح'
    }
  },
  'New Valley': {
    nameAr: 'الوادي الجديد',
    areas: {
      'El Kharga': 'الخارجة',
      'New Valley': 'الوادي الجديد'
    }
  },
  'Port Said': {
    nameAr: 'بورسعيد',
    areas: {
      'Port Fouad': 'بور فؤاد',
      'Port Said': 'بورسعيد',
      'Zohoor District': 'حي الزهور'
    }
  },
  'Qalyubia': {
    nameAr: 'القليوبية',
    areas: {
      'Abu Zaabal': 'ابو زعبل',
      'Qaha': 'قها',
      'Tookh': 'طوخ',
      'El Oboor': 'العبور',
      'Meet Nama': 'ميت نما',
      'Al Shareaa Al Gadid': 'الشريعة الجديد',
      'Banha': 'بنها',
      'El Kanater EL Khayrya': 'القناطر الخيرية',
      'Sheben Alkanater': 'شبين القناطر',
      'El Qalag': 'القلج',
      'Bahteem': 'بهتيم',
      'Orabi': 'عرابي',
      'Qalyoob': 'قليوب',
      'Al Khanka': 'الخانكة',
      'El Khsos': 'الخصوص',
      'Kafr Shokr': 'كفر شكر',
      'Om Bayoumi': 'أم بيومي',
      'Shoubra Alkhema': 'شبرا الخيمة',
      'Mostorod': 'مسطرد'
    }
  },
  'Qena': {
    nameAr: 'قنا',
    areas: {
      'Deshna': 'دشنا',
      'Abu Tesht': 'ابوتشت',
      'Farshoot': 'فرشوط',
      'Qena': 'قنا',
      'Qoos': 'قوص',
      'Naqada': 'نقادة',
      'Naga Hamadi': 'نجع حمادي'
    }
  },
  'Red Sea': {
    nameAr: 'البحر الأحمر',
    areas: {
      'Red Sea': 'البحر الاحمر',
      'Safaga': 'سفاجا',
      'Hurghada': 'الغردقة',
      'Qouseir': 'القصير',
      'Marsa Alam': 'مرسى علم',
      'Gouna': 'الجونة',
      'Ras Ghareb': 'رأس غارب'
    }
  },
  'Sohag': {
    nameAr: 'سوهاج',
    areas: {
      'Sohag': 'سوهاج',
      'Tema': 'طما',
      'Saqatlah': 'ساقلته',
      'Dar Elsalam': 'دار السلام',
      'Gerga': 'جرجا',
      'Elbalyna': 'البالينا',
      'Maragha': 'مراغة',
      'El Monshah': 'المنشاه',
      'Ghena': 'جهينة',
      'Akhmem': 'أخميم',
      'Tahta': 'طهطا'
    }
  },
  'Suez': {
    nameAr: 'السويس',
    areas: {
      'Ataka District': 'حي عتاقة',
      'Suez': 'السويس',
      'Elganaien District': 'حي الجناين',
      'Al Adabya': 'الأدبية',
      'Ain Al Sukhna': 'العين السخنة',
      'El Arbeen District': 'حى الاربعين'
    }
  },
  'North Sinai': {
    nameAr: 'شمال سيناء',
    areas: {
      'North Sinai': 'شمال سيناء',
      'Al Arish': 'العريش'
    }
  },
  'South Sinai': {
    nameAr: 'جنوب سيناء',
    areas: {
      'Neweibaa': 'نويبع',
      'Dahab': 'دهب',
      'Saint Catherine': 'سانت كاترين',
      'Sharm Al Sheikh': 'شرم الشيخ',
      'Toor Sinai': 'طور سيناء',
      'Taba': 'طابا'
    }
  }
}

// Create slug from name
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function main() {
  console.log('🚀 Starting Governorates & Areas Seeding...\n')

  // First, create default shipping zones
  console.log('📦 Creating default shipping zones...')

  const defaultZones = [
    { name: 'Cairo & Giza', price: 50.00, estimatedDays: '1-2 days', displayOrder: 1 },
    { name: 'Delta Region', price: 75.00, estimatedDays: '2-3 days', displayOrder: 2 },
    { name: 'Upper Egypt', price: 100.00, estimatedDays: '3-5 days', displayOrder: 3 },
    { name: 'Coastal Cities', price: 85.00, estimatedDays: '2-4 days', displayOrder: 4 },
    { name: 'Remote Areas', price: 120.00, estimatedDays: '5-7 days', displayOrder: 5 }
  ]

  const createdZones = {}
  for (const zone of defaultZones) {
    const created = await prisma.shippingZone.upsert({
      where: { id: zone.displayOrder },
      update: zone,
      create: zone
    })
    createdZones[zone.name] = created
    console.log(`  ✓ ${zone.name} - ${zone.price} EGP`)
  }

  // Map governorates to zones
  const governorateZoneMap = {
    'Cairo': 'Cairo & Giza',
    'Giza': 'Cairo & Giza',
    'Alexandria': 'Coastal Cities',
    'Port Said': 'Coastal Cities',
    'Damietta': 'Coastal Cities',
    'Red Sea': 'Coastal Cities',
    'Matrooh': 'Coastal Cities',
    'Al Daqahliya': 'Delta Region',
    'Al Gharbia': 'Delta Region',
    'Al Monufia': 'Delta Region',
    'Al Sharqia': 'Delta Region',
    'Kafr El Sheikh': 'Delta Region',
    'Al Beheira': 'Delta Region',
    'Qalyubia': 'Delta Region',
    'Ismailia': 'Delta Region',
    'Suez': 'Delta Region',
    'Al Meniya': 'Upper Egypt',
    'Asyut': 'Upper Egypt',
    'Sohag': 'Upper Egypt',
    'Qena': 'Upper Egypt',
    'Luxor': 'Upper Egypt',
    'Aswan': 'Upper Egypt',
    'Al Fayoum': 'Upper Egypt',
    'Bani Souaif': 'Upper Egypt',
    'New Valley': 'Remote Areas',
    'North Sinai': 'Remote Areas',
    'South Sinai': 'Remote Areas'
  }

  console.log('\n🌍 Seeding governorates and areas...')

  let governorateOrder = 0
  for (const [nameEn, data] of Object.entries(governoratesData)) {
    governorateOrder++
    const slug = slugify(nameEn)
    const zoneName = governorateZoneMap[nameEn] || 'Remote Areas'
    const zone = createdZones[zoneName]

    // Create or update governorate
    const governorate = await prisma.governorate.upsert({
      where: { slug },
      update: {
        nameEn,
        nameAr: data.nameAr,
        shippingZoneId: zone.id,
        displayOrder: governorateOrder
      },
      create: {
        nameEn,
        nameAr: data.nameAr,
        slug,
        shippingZoneId: zone.id,
        displayOrder: governorateOrder
      }
    })

    console.log(`  ✓ ${nameEn} (${data.nameAr}) - Zone: ${zoneName}`)

    // Create areas for this governorate
    let areaOrder = 0
    for (const [areaNameEn, areaNameAr] of Object.entries(data.areas)) {
      areaOrder++
      const areaSlug = slugify(areaNameEn)

      await prisma.area.upsert({
        where: {
          governorateId_slug: {
            governorateId: governorate.id,
            slug: areaSlug
          }
        },
        update: {
          nameEn: areaNameEn,
          nameAr: areaNameAr,
          displayOrder: areaOrder
        },
        create: {
          governorateId: governorate.id,
          nameEn: areaNameEn,
          nameAr: areaNameAr,
          slug: areaSlug,
          displayOrder: areaOrder
        }
      })
    }
    console.log(`    → ${areaOrder} areas added`)
  }

  console.log('\n✅ Seeding completed successfully!')

  // Print summary
  const govCount = await prisma.governorate.count()
  const areaCount = await prisma.area.count()
  const zoneCount = await prisma.shippingZone.count()

  console.log(`\n📊 Summary:`)
  console.log(`   - Shipping Zones: ${zoneCount}`)
  console.log(`   - Governorates: ${govCount}`)
  console.log(`   - Areas: ${areaCount}`)
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
