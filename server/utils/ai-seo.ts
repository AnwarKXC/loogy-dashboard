/**
 * AI-powered SEO generation using Groq API (free tier available)
 * Enhanced with competitor research from Amazon.eg and Noon
 * Falls back to smart template generation if no API key is configured
 */

interface ProductContext {
  name: string
  nameAr?: string
  brand?: string
  category?: string
  description?: string
  descriptionAr?: string
  shortDescription?: string
  shortDescriptionAr?: string
  slug?: string
  price?: number
  images?: string[]
}

interface SeoGenerationResult {
  // Descriptions
  descriptionEn?: string
  descriptionAr?: string
  shortDescriptionEn?: string
  shortDescriptionAr?: string
  // Bilingual SEO
  seoTitleEn?: string
  seoTitleAr?: string
  seoDescriptionEn?: string
  seoDescriptionAr?: string
  seoKeywordsEn?: string
  seoKeywordsAr?: string
  ogTitleEn?: string
  ogTitleAr?: string
  ogDescriptionEn?: string
  ogDescriptionAr?: string
  // Legacy
  title?: string
  description?: string
  keywords?: string[]
  canonical?: string
}

interface CompetitorResearch {
  amazonEg?: {
    title?: string
    description?: string
    features?: string[]
    keywords?: string[]
  }
  noon?: {
    title?: string
    description?: string
    features?: string[]
    keywords?: string[]
  }
  brandPage?: {
    description?: string
    features?: string[]
    tagline?: string
  }
}

type GenerationTarget = 'title' | 'description' | 'keywords' | 'all' | 'descriptionEn' | 'descriptionAr' | 'shortDescriptionEn' | 'shortDescriptionAr' | 'descriptions' | 'shortDescriptions' | 'bilingualSeo'

const GROQ_API_KEY = process.env.GROQ_API_KEY
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'

const MAX_SEO_TITLE = 70
const MAX_SEO_DESCRIPTION = 160
const MAX_DESCRIPTION = 800
const MAX_SHORT_DESCRIPTION = 200
const FETCH_TIMEOUT = 5000 // 5 seconds timeout for external requests

function truncate(text: string, max: number): string {
  if (!text || text.length <= max) return text || ''
  const cut = text.slice(0, max).trim()
  const lastSpace = cut.lastIndexOf(' ')
  return lastSpace > max * 0.6 ? cut.slice(0, lastSpace).trim() : cut
}

function cleanText(text?: string | null): string {
  return text?.replace(/\s+/g, ' ').trim() || ''
}

/**
 * Search Amazon.eg for product information
 */
async function searchAmazonEg(productName: string, brand?: string): Promise<CompetitorResearch['amazonEg']> {
  try {
    const searchQuery = encodeURIComponent(`${brand || ''} ${productName}`.trim())
    const searchUrl = `https://www.amazon.eg/s?k=${searchQuery}`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT)

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8',
        'Accept': 'text/html,application/xhtml+xml'
      },
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      console.log('Amazon.eg search failed:', response.status)
      return undefined
    }

    const html = await response.text()

    // Extract product titles from search results
    const titleMatches = html.match(/class="a-size-base-plus a-color-base a-text-normal"[^>]*>([^<]+)</gi)
    const titles = titleMatches?.slice(0, 3).map(m => m.replace(/<[^>]+>/g, '').trim()) || []

    // Extract features/bullet points
    const featureMatches = html.match(/class="a-list-item"[^>]*>([^<]+)</gi)
    const features = featureMatches?.slice(0, 5).map(m => m.replace(/<[^>]+>/g, '').trim()).filter(f => f.length > 10) || []

    // Extract keywords from titles
    const keywords = titles.flatMap(t => t.split(/[\s,|]+/).filter(w => w.length > 3)).slice(0, 10)

    return {
      title: titles[0] || undefined,
      features: features.length > 0 ? features : undefined,
      keywords: keywords.length > 0 ? keywords : undefined
    }
  } catch (error) {
    console.log('Amazon.eg search error:', error instanceof Error ? error.message : 'Unknown error')
    return undefined
  }
}

/**
 * Search Noon for product information
 */
async function searchNoon(productName: string, brand?: string): Promise<CompetitorResearch['noon']> {
  try {
    const searchQuery = encodeURIComponent(`${brand || ''} ${productName}`.trim())
    const searchUrl = `https://www.noon.com/egypt-en/search/?q=${searchQuery}`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT)

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8',
        'Accept': 'text/html,application/xhtml+xml'
      },
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      console.log('Noon search failed:', response.status)
      return undefined
    }

    const html = await response.text()

    // Extract product names from Noon search
    const titleMatches = html.match(/data-qa="product-name"[^>]*>([^<]+)</gi)
      || html.match(/"name":"([^"]+)"/gi)
    const titles = titleMatches?.slice(0, 3).map((m) => {
      const clean = m.replace(/<[^>]+>/g, '').replace(/"name":"/, '').replace(/"$/, '').trim()
      return clean
    }) || []

    // Extract features
    const featureMatches = html.match(/"description":"([^"]+)"/gi)
    const features = featureMatches?.slice(0, 3).map(m => m.replace(/"description":"/, '').replace(/"$/, '').trim()) || []

    // Extract keywords
    const keywords = titles.flatMap(t => t.split(/[\s,|]+/).filter(w => w.length > 3)).slice(0, 10)

    return {
      title: titles[0] || undefined,
      features: features.length > 0 ? features : undefined,
      keywords: keywords.length > 0 ? keywords : undefined
    }
  } catch (error) {
    console.log('Noon search error:', error instanceof Error ? error.message : 'Unknown error')
    return undefined
  }
}

/**
 * Fetch brand information if brand URL is known
 */
async function fetchBrandInfo(brandName: string): Promise<CompetitorResearch['brandPage']> {
  // Common brand domains to try
  const brandDomains = [
    `https://www.${brandName.toLowerCase().replace(/\s+/g, '')}.com`,
    `https://www.${brandName.toLowerCase().replace(/\s+/g, '-')}.com`,
    `https://${brandName.toLowerCase().replace(/\s+/g, '')}.com`
  ]

  for (const url of brandDomains) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT)

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html'
        },
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) continue

      const html = await response.text()

      // Extract meta description
      const metaDescMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)
        || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i)
      const description = metaDescMatch?.[1]

      // Extract tagline from h1 or slogan
      const taglineMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i)
        || html.match(/class=["'][^"']*slogan[^"']*["'][^>]*>([^<]+)</i)
      const tagline = taglineMatch?.[1]?.trim()

      if (description || tagline) {
        return {
          description: description?.slice(0, 500),
          tagline: tagline?.slice(0, 100)
        }
      }
    } catch {
      continue
    }
  }

  return undefined
}

/**
 * Gather competitor research from Amazon.eg, Noon, and brand pages
 */
async function gatherCompetitorResearch(
  productName: string,
  brand?: string
): Promise<CompetitorResearch> {
  const research: CompetitorResearch = {}

  // Run all searches in parallel with a short timeout
  const [amazonResult, noonResult, brandResult] = await Promise.allSettled([
    searchAmazonEg(productName, brand),
    searchNoon(productName, brand),
    brand ? fetchBrandInfo(brand) : Promise.resolve(undefined)
  ])

  if (amazonResult.status === 'fulfilled' && amazonResult.value) {
    research.amazonEg = amazonResult.value
  }

  if (noonResult.status === 'fulfilled' && noonResult.value) {
    research.noon = noonResult.value
  }

  if (brandResult.status === 'fulfilled' && brandResult.value) {
    research.brandPage = brandResult.value
  }

  return research
}

/**
 * Generate SEO content using Groq AI with competitor research
 */
async function generateWithGroq(
  context: ProductContext,
  target: GenerationTarget
): Promise<SeoGenerationResult | null> {
  if (!GROQ_API_KEY) {
    return null
  }

  // Gather competitor research in parallel
  console.log('🔍 Gathering competitor research from Amazon.eg, Noon, and brand pages...')
  const research = await gatherCompetitorResearch(context.name, context.brand)

  // Build competitor insights section
  let competitorInsights = ''
  if (research.amazonEg || research.noon || research.brandPage) {
    competitorInsights = '\n\n--- COMPETITOR & MARKET RESEARCH ---'

    if (research.amazonEg) {
      competitorInsights += `\n\nAMAZON.EG INSIGHTS:`
      if (research.amazonEg.title) competitorInsights += `\n- Top listing title: "${research.amazonEg.title}"`
      if (research.amazonEg.features?.length) competitorInsights += `\n- Key features found: ${research.amazonEg.features.slice(0, 3).join('; ')}`
      if (research.amazonEg.keywords?.length) competitorInsights += `\n- Popular keywords: ${research.amazonEg.keywords.slice(0, 8).join(', ')}`
    }

    if (research.noon) {
      competitorInsights += `\n\nNOON INSIGHTS:`
      if (research.noon.title) competitorInsights += `\n- Top listing title: "${research.noon.title}"`
      if (research.noon.features?.length) competitorInsights += `\n- Key features found: ${research.noon.features.slice(0, 3).join('; ')}`
      if (research.noon.keywords?.length) competitorInsights += `\n- Popular keywords: ${research.noon.keywords.slice(0, 8).join(', ')}`
    }

    if (research.brandPage) {
      competitorInsights += `\n\nBRAND PAGE INSIGHTS:`
      if (research.brandPage.tagline) competitorInsights += `\n- Brand tagline: "${research.brandPage.tagline}"`
      if (research.brandPage.description) competitorInsights += `\n- Brand description: "${research.brandPage.description.slice(0, 200)}..."`
    }

    competitorInsights += '\n\nUse these insights to craft better content that outperforms competitors.'
    console.log('✅ Competitor research gathered:', {
      amazonEg: !!research.amazonEg,
      noon: !!research.noon,
      brandPage: !!research.brandPage
    })
  } else {
    console.log('⚠️ No competitor research available, proceeding with product info only')
  }

  const systemPrompt = `You are a SENIOR SEO SPECIALIST with 15+ years of experience in e-commerce product optimization for the Egyptian and Middle Eastern markets.

YOUR EXPERTISE:
- Expert in Google Search Egypt, Amazon.eg, and Noon SEO algorithms
- Deep understanding of Arabic and English bilingual SEO
- Conversion-focused copywriting that drives sales
- Knowledge of Egyptian consumer psychology and buying behavior
- Expert at crafting content that ranks AND converts

YOUR APPROACH:
1. Analyze the product and competitor data provided
2. Identify the strongest keywords and selling points
3. Create content that OUTPERFORMS competitor listings
4. Use power words that drive action in both English and Arabic
5. Ensure proper keyword density without stuffing
6. Write for HUMANS first, search engines second

CONTENT RULES:
- Never use generic filler phrases like "high quality" without specifics
- Always include the brand name naturally (2-3 times in descriptions)
- Use category-relevant keywords throughout
- Include Egyptian-market specific terms when relevant
- Never mention shipping, returns, or policies
- End with subtle but effective calls to action
- Arabic content should sound NATIVE, not translated

Respond ONLY with valid JSON, no markdown or explanation.`

  let userPrompt = ''
  let expectedFields: string[] = []

  const productInfo = `
=== PRODUCT INFORMATION ===
Product Name: ${context.name}
${context.nameAr ? `Arabic Name: ${context.nameAr}` : ''}
Brand: ${context.brand || 'Unknown'}
Category: ${context.category || 'General'}
${context.description ? `Current Description: ${context.description.slice(0, 300)}` : ''}
${context.price ? `Price: EGP ${context.price}` : ''}
${competitorInsights}`

  switch (target) {
    case 'descriptionEn':
      userPrompt = `${productInfo}

As a Senior SEO Specialist, create a COMPELLING English product description (${MAX_DESCRIPTION} chars max) that:
- Opens with a hook using the brand and product name
- Highlights 3-4 SPECIFIC features/benefits (use competitor research if available)
- Uses power words: discover, experience, elevate, premium, authentic
- Creates urgency subtly
- Ends with a call to action
- Outperforms competitor listings with better keyword integration

Return JSON: {"descriptionEn": "..."}`
      expectedFields = ['descriptionEn']
      break

    case 'descriptionAr':
      userPrompt = `${productInfo}

As a Senior SEO Specialist, create a COMPELLING Arabic (العربية) product description (${MAX_DESCRIPTION} chars max) that:
- Opens with the brand and product name in natural Arabic
- Highlights 3-4 SPECIFIC features/benefits
- Uses Arabic marketing power words: اكتشف، استمتع، احصل على، جودة فاخرة، أصلي
- Sounds like a NATIVE Arabic speaker wrote it (not translated)
- Creates urgency subtly
- Ends with a call to action in Arabic

Return JSON: {"descriptionAr": "..."}`
      expectedFields = ['descriptionAr']
      break

    case 'shortDescriptionEn':
      userPrompt = `${productInfo}

As a Senior SEO Specialist, create a POWERFUL short description (${MAX_SHORT_DESCRIPTION} chars max) that:
- Captures attention in the first 5 words
- Mentions the brand naturally
- Highlights the #1 benefit that makes customers buy
- Works great in search listings and product grids

Return JSON: {"shortDescriptionEn": "..."}`
      expectedFields = ['shortDescriptionEn']
      break

    case 'shortDescriptionAr':
      userPrompt = `${productInfo}

As a Senior SEO Specialist, create a POWERFUL Arabic (العربية) short description (${MAX_SHORT_DESCRIPTION} chars max) that:
- Captures attention immediately in natural Arabic
- Mentions the brand
- Highlights the main benefit
- Sounds native, not translated

Return JSON: {"shortDescriptionAr": "..."}`
      expectedFields = ['shortDescriptionAr']
      break

    case 'descriptions':
      userPrompt = `${productInfo}

As a Senior SEO Specialist, create COMPELLING bilingual product descriptions that OUTPERFORM competitors:

1. descriptionEn (${MAX_DESCRIPTION} chars): 
   - Hook with brand + product name
   - 3-4 specific features/benefits
   - Power words and urgency
   - Strong call to action

2. descriptionAr (${MAX_DESCRIPTION} chars): 
   - Native Arabic, NOT translated
   - Same quality as English but culturally adapted
   - Arabic marketing language

Return JSON: {"descriptionEn": "...", "descriptionAr": "..."}`
      expectedFields = ['descriptionEn', 'descriptionAr']
      break

    case 'shortDescriptions':
      userPrompt = `${productInfo}

As a Senior SEO Specialist, create POWERFUL short descriptions:

1. shortDescriptionEn (${MAX_SHORT_DESCRIPTION} chars): Attention-grabbing English summary
2. shortDescriptionAr (${MAX_SHORT_DESCRIPTION} chars): Native Arabic summary

Return JSON: {"shortDescriptionEn": "...", "shortDescriptionAr": "..."}`
      expectedFields = ['shortDescriptionEn', 'shortDescriptionAr']
      break

    case 'bilingualSeo':
      userPrompt = `${productInfo}

As a Senior SEO Specialist with expertise in Egyptian e-commerce, create COMPLETE bilingual SEO meta tags that will OUTRANK competitors on Google Egypt:

1. seoTitleEn (${MAX_SEO_TITLE} chars): SEO title - Format: "Product Name | Brand | Category" - Front-load with keywords
2. seoTitleAr (${MAX_SEO_TITLE} chars): Arabic SEO title - Native Arabic, not translated
3. seoDescriptionEn (${MAX_SEO_DESCRIPTION} chars): Meta description - Include brand, benefit, and call to action
4. seoDescriptionAr (${MAX_SEO_DESCRIPTION} chars): Arabic meta description - Native Arabic marketing language
5. seoKeywordsEn: 10-15 high-value English keywords (include: product name, brand, category, "buy", "shop", "Egypt", long-tail variations)
6. seoKeywordsAr: 10-15 Arabic keywords (include product in Arabic, brand, category, شراء، تسوق، مصر)
7. ogTitleEn (${MAX_SEO_TITLE} chars): Social sharing title - More engaging, emoji-friendly
8. ogTitleAr (${MAX_SEO_TITLE} chars): Arabic social title
9. ogDescriptionEn (200 chars): Social description - Conversational, shareable
10. ogDescriptionAr (200 chars): Arabic social description

Return JSON with all 10 fields. Use competitor research insights to beat their rankings.`
      expectedFields = [
        'seoTitleEn', 'seoTitleAr', 'seoDescriptionEn', 'seoDescriptionAr',
        'seoKeywordsEn', 'seoKeywordsAr', 'ogTitleEn', 'ogTitleAr',
        'ogDescriptionEn', 'ogDescriptionAr'
      ]
      break

    case 'all':
      userPrompt = `${productInfo}

As a SENIOR SEO SPECIALIST with deep expertise in Egyptian e-commerce, create COMPLETE product content that will DOMINATE search results and CONVERT visitors to buyers:

=== PRODUCT DESCRIPTIONS ===
1. descriptionEn (${MAX_DESCRIPTION} chars): 
   - Compelling English description
   - Hook with brand + product name in first sentence
   - 3-4 specific features/benefits
   - Use power words: discover, experience, elevate, premium, authentic
   - End with subtle call to action

2. descriptionAr (${MAX_DESCRIPTION} chars): 
   - NATIVE Arabic (not translated)
   - Same quality and features as English
   - Arabic marketing power words
   - Culturally appropriate for Egyptian market

3. shortDescriptionEn (${MAX_SHORT_DESCRIPTION} chars): Punchy English summary for listings
4. shortDescriptionAr (${MAX_SHORT_DESCRIPTION} chars): Native Arabic summary

=== SEO META TAGS (Optimized for Google Egypt) ===
5. seoTitleEn (${MAX_SEO_TITLE} chars): "Product | Brand | Category"
6. seoTitleAr (${MAX_SEO_TITLE} chars): Arabic SEO title
7. seoDescriptionEn (${MAX_SEO_DESCRIPTION} chars): Meta description with benefit + call to action
8. seoDescriptionAr (${MAX_SEO_DESCRIPTION} chars): Arabic meta description
9. seoKeywordsEn: 12-15 high-value English keywords (product, brand, category, buy, shop, Egypt, variations)
10. seoKeywordsAr: 12-15 Arabic keywords (include شراء، تسوق، مصر)

=== SOCIAL SHARING (Open Graph) ===
11. ogTitleEn (${MAX_SEO_TITLE} chars): Engaging social title
12. ogTitleAr (${MAX_SEO_TITLE} chars): Arabic social title
13. ogDescriptionEn (200 chars): Conversational social description
14. ogDescriptionAr (200 chars): Arabic social description

Use the competitor research insights to OUTPERFORM their listings. Return JSON with all 14 fields.`
      expectedFields = [
        'descriptionEn', 'descriptionAr', 'shortDescriptionEn', 'shortDescriptionAr',
        'seoTitleEn', 'seoTitleAr', 'seoDescriptionEn', 'seoDescriptionAr',
        'seoKeywordsEn', 'seoKeywordsAr', 'ogTitleEn', 'ogTitleAr',
        'ogDescriptionEn', 'ogDescriptionAr'
      ]
      break

    case 'title':
      userPrompt = `${productInfo}

As a Senior SEO Specialist, create an optimized title (${MAX_SEO_TITLE} chars max):
- Format: "Product Name | Brand | Category"
- Front-load with highest-value keywords
- Make it compelling for search results

Return JSON: {"title": "..."}`
      expectedFields = ['title']
      break

    case 'description':
      userPrompt = `${productInfo}

As a Senior SEO Specialist, create a meta description (${MAX_SEO_DESCRIPTION} chars max) that:
- Starts with the brand/product for keyword matching
- Includes the key benefit
- Has a compelling call to action
- Will get clicks in Google search results

Return JSON: {"description": "..."}`
      expectedFields = ['description']
      break

    case 'keywords':
      userPrompt = `${productInfo}

As a Senior SEO Specialist, generate 15 HIGH-VALUE keywords that will rank on Google Egypt:

REQUIRED KEYWORD TYPES:
- Product name (exact + variations)
- Brand + product combinations
- Category terms (English and transliterated Arabic)
- "Buy" + product intent keywords
- "Shop" + product intent keywords
- Long-tail keywords (3-4 words)
- Egypt-specific keywords if relevant
- Feature-based keywords from competitor research

Use competitor keywords as inspiration but CREATE BETTER ones.

Return JSON: {"keywords": ["keyword1", "keyword2", ...]}`
      expectedFields = ['keywords']
      break

    default:
      return null
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      })
    })

    if (!response.ok) {
      console.error('Groq API error:', response.status, await response.text())
      return null
    }

    const data = await response.json() as {
      choices?: Array<{ message?: { content?: string } }>
    }

    const content = data.choices?.[0]?.message?.content
    if (!content) {
      return null
    }

    const parsed = JSON.parse(content) as SeoGenerationResult

    // Validate expected fields are present
    for (const field of expectedFields) {
      if (!(field in parsed) || !parsed[field as keyof SeoGenerationResult]) {
        console.warn(`Missing expected field: ${field}`)
      }
    }

    // Truncate fields to their limits
    if (parsed.descriptionEn) parsed.descriptionEn = truncate(parsed.descriptionEn, MAX_DESCRIPTION)
    if (parsed.descriptionAr) parsed.descriptionAr = truncate(parsed.descriptionAr, MAX_DESCRIPTION)
    if (parsed.shortDescriptionEn) parsed.shortDescriptionEn = truncate(parsed.shortDescriptionEn, MAX_SHORT_DESCRIPTION)
    if (parsed.shortDescriptionAr) parsed.shortDescriptionAr = truncate(parsed.shortDescriptionAr, MAX_SHORT_DESCRIPTION)
    if (parsed.seoTitleEn) parsed.seoTitleEn = truncate(parsed.seoTitleEn, MAX_SEO_TITLE)
    if (parsed.seoTitleAr) parsed.seoTitleAr = truncate(parsed.seoTitleAr, MAX_SEO_TITLE)
    if (parsed.seoDescriptionEn) parsed.seoDescriptionEn = truncate(parsed.seoDescriptionEn, MAX_SEO_DESCRIPTION)
    if (parsed.seoDescriptionAr) parsed.seoDescriptionAr = truncate(parsed.seoDescriptionAr, MAX_SEO_DESCRIPTION)
    if (parsed.ogTitleEn) parsed.ogTitleEn = truncate(parsed.ogTitleEn, MAX_SEO_TITLE)
    if (parsed.ogTitleAr) parsed.ogTitleAr = truncate(parsed.ogTitleAr, MAX_SEO_TITLE)
    if (parsed.ogDescriptionEn) parsed.ogDescriptionEn = truncate(parsed.ogDescriptionEn, 200)
    if (parsed.ogDescriptionAr) parsed.ogDescriptionAr = truncate(parsed.ogDescriptionAr, 200)
    if (parsed.title) parsed.title = truncate(parsed.title, MAX_SEO_TITLE)
    if (parsed.description) parsed.description = truncate(parsed.description, MAX_SEO_DESCRIPTION)

    return parsed
  } catch (error) {
    console.error('Groq generation error:', error)
    return null
  }
}

/**
 * Smart template-based fallback when AI is not available
 * Uses the actual product data to generate reasonable content
 */
function generateWithTemplates(
  context: ProductContext,
  target: GenerationTarget
): SeoGenerationResult {
  const name = cleanText(context.name)
  const nameAr = cleanText(context.nameAr)
  const brand = cleanText(context.brand) || ''
  const category = cleanText(context.category) || ''

  const brandedName = brand ? `${brand} ${name}` : name
  const brandedNameAr = nameAr ? (brand ? `${brand} ${nameAr}` : nameAr) : ''

  const result: SeoGenerationResult = {}

  // Description templates
  const descriptionTemplatesEn = [
    `Discover the ${brandedName}${category ? ` from our ${category} collection` : ''}. Crafted with attention to detail and designed for those who appreciate quality. Features premium materials and expert craftsmanship that delivers exceptional performance and style.`,
    `The ${brandedName} combines style and functionality${category ? ` in the ${category} category` : ''}. Built with quality materials and designed for everyday excellence. A must-have addition to your collection.`,
    `Experience the ${brandedName}${brand ? ` by ${brand}` : ''}. Premium quality meets practical design in this exceptional ${category || 'product'}. Designed for customers who demand the best.`
  ]

  const descriptionTemplatesAr = [
    `اكتشف ${brandedNameAr || brandedName}${category ? ` من مجموعة ${category}` : ''}. مصنوع بعناية فائقة ومصمم لمن يقدرون الجودة. يتميز بمواد فاخرة وحرفية متقنة تقدم أداءً وأناقة استثنائية.`,
    `يجمع ${brandedNameAr || brandedName} بين الأناقة والوظيفة${category ? ` في فئة ${category}` : ''}. مصنوع من مواد عالية الجودة ومصمم للتميز اليومي. إضافة لا غنى عنها لمجموعتك.`,
    `جرب ${brandedNameAr || brandedName}${brand ? ` من ${brand}` : ''}. الجودة الفاخرة تلتقي بالتصميم العملي في هذا ${category || 'المنتج'} الاستثنائي.`
  ]

  const shortDescTemplatesEn = [
    `${brandedName}${category ? ` - Premium ${category}` : ''}. Quality craftsmanship, exceptional value.`,
    `Shop the ${brandedName}. ${brand ? `Authentic ${brand} quality` : 'Premium quality'} you can trust.`,
    `${brandedName}${category ? ` in ${category}` : ''}. Designed for excellence, built to last.`
  ]

  const shortDescTemplatesAr = [
    `${brandedNameAr || brandedName}${category ? ` - ${category} فاخر` : ''}. حرفية عالية وقيمة استثنائية.`,
    `تسوق ${brandedNameAr || brandedName}. ${brand ? `جودة ${brand} الأصلية` : 'جودة فاخرة'} يمكنك الوثوق بها.`,
    `${brandedNameAr || brandedName}. مصمم للتميز، مبني ليدوم.`
  ]

  const randomIndex = Math.floor(Math.random() * 3)

  // Generate based on target
  if (['descriptionEn', 'descriptions', 'all'].includes(target)) {
    result.descriptionEn = truncate(descriptionTemplatesEn[randomIndex] || descriptionTemplatesEn[0] || '', MAX_DESCRIPTION)
  }

  if (['descriptionAr', 'descriptions', 'all'].includes(target)) {
    result.descriptionAr = truncate(descriptionTemplatesAr[randomIndex] || descriptionTemplatesAr[0] || '', MAX_DESCRIPTION)
  }

  if (['shortDescriptionEn', 'shortDescriptions', 'all'].includes(target)) {
    result.shortDescriptionEn = truncate(shortDescTemplatesEn[randomIndex] || shortDescTemplatesEn[0] || '', MAX_SHORT_DESCRIPTION)
  }

  if (['shortDescriptionAr', 'shortDescriptions', 'all'].includes(target)) {
    result.shortDescriptionAr = truncate(shortDescTemplatesAr[randomIndex] || shortDescTemplatesAr[0] || '', MAX_SHORT_DESCRIPTION)
  }

  if (['bilingualSeo', 'all'].includes(target)) {
    result.seoTitleEn = truncate(`${name}${brand ? ` | ${brand}` : ''}${category ? ` | ${category}` : ''}`, MAX_SEO_TITLE)
    result.seoTitleAr = truncate(`${nameAr || name}${brand ? ` | ${brand}` : ''}`, MAX_SEO_TITLE)
    result.seoDescriptionEn = truncate(`Shop ${brandedName}. ${brand ? `Official ${brand} product` : 'Premium quality'} with fast shipping. Order now!`, MAX_SEO_DESCRIPTION)
    result.seoDescriptionAr = truncate(`تسوق ${brandedNameAr || brandedName}. ${brand ? `منتج ${brand} الرسمي` : 'جودة فاخرة'} مع شحن سريع. اطلب الآن!`, MAX_SEO_DESCRIPTION)

    const keywordsEn = [name, `buy ${name}`, `${name} online`]
    if (brand) keywordsEn.push(brand, `${brand} ${name}`, `${brand} products`)
    if (category) keywordsEn.push(category, `${category} ${name}`)
    result.seoKeywordsEn = keywordsEn.slice(0, 12).join(', ')

    const keywordsAr = nameAr ? [nameAr, `شراء ${nameAr}`, `${nameAr} اونلاين`] : []
    if (brand) keywordsAr.push(brand, `${brand} ${nameAr || name}`)
    result.seoKeywordsAr = keywordsAr.slice(0, 10).join('، ')

    result.ogTitleEn = truncate(brandedName, MAX_SEO_TITLE)
    result.ogTitleAr = truncate(brandedNameAr || brandedName, MAX_SEO_TITLE)
    result.ogDescriptionEn = truncate(`${brandedName} - Premium quality ${category || 'product'}. Shop now!`, 200)
    result.ogDescriptionAr = truncate(`${brandedNameAr || brandedName} - ${category || 'منتج'} بجودة فاخرة. تسوق الآن!`, 200)
  }

  if (['title', 'all'].includes(target)) {
    result.title = truncate(`${name}${brand ? ` | ${brand}` : ''}${category ? ` | ${category}` : ''}`, MAX_SEO_TITLE)
  }

  if (['description', 'all'].includes(target)) {
    result.description = truncate(`Shop ${brandedName}. Premium quality ${category || 'product'} with fast shipping.`, MAX_SEO_DESCRIPTION)
  }

  if (['keywords', 'all'].includes(target)) {
    const keywords = [name, `buy ${name}`, `${name} online`, `shop ${name}`]
    if (brand) keywords.push(brand, `${brand} ${name}`)
    if (category) keywords.push(category, `${category} sale`)
    result.keywords = keywords.slice(0, 15)
  }

  return result
}

/**
 * Main entry point for SEO content generation
 * Tries AI first, falls back to templates
 */
export async function generateSeoContent(
  context: ProductContext,
  target: GenerationTarget
): Promise<SeoGenerationResult> {
  // Try AI generation first
  const aiResult = await generateWithGroq(context, target)

  if (aiResult) {
    return aiResult
  }

  // Fall back to template generation
  console.log('AI generation unavailable, using templates')
  return generateWithTemplates(context, target)
}

export type { ProductContext, SeoGenerationResult, GenerationTarget }
