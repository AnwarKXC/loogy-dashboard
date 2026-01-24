/**
 * AI-powered SEO generation using Groq API (free tier available)
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

type GenerationTarget = 'title' | 'description' | 'keywords' | 'all' | 'descriptionEn' | 'descriptionAr' | 'shortDescriptionEn' | 'shortDescriptionAr' | 'descriptions' | 'shortDescriptions' | 'bilingualSeo'

const GROQ_API_KEY = process.env.GROQ_API_KEY
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'

const MAX_SEO_TITLE = 70
const MAX_SEO_DESCRIPTION = 160
const MAX_DESCRIPTION = 800
const MAX_SHORT_DESCRIPTION = 200

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
 * Generate SEO content using Groq AI
 */
async function generateWithGroq(
  context: ProductContext,
  target: GenerationTarget
): Promise<SeoGenerationResult | null> {
  if (!GROQ_API_KEY) {
    return null
  }

  const systemPrompt = `You are an expert e-commerce SEO copywriter specializing in bilingual (English/Arabic) product content. 
You create compelling, search-optimized content that:
- Uses the product name, brand, and category naturally
- Highlights key features and benefits
- Is optimized for search engines
- Is culturally appropriate for Arabic markets
- Never includes shipping/return policy information
- Never uses generic filler phrases

Respond ONLY with valid JSON, no markdown or explanation.`

  let userPrompt = ''
  let expectedFields: string[] = []

  const productInfo = `
Product: ${context.name}
${context.nameAr ? `Arabic Name: ${context.nameAr}` : ''}
Brand: ${context.brand || 'Unknown'}
Category: ${context.category || 'General'}
${context.description ? `Current Description: ${context.description.slice(0, 300)}` : ''}
${context.price ? `Price: ${context.price}` : ''}`

  switch (target) {
    case 'descriptionEn':
      userPrompt = `${productInfo}

Generate a compelling English product description (${MAX_DESCRIPTION} chars max) that:
- Opens with the brand and product name
- Highlights 3-4 key features/benefits
- Uses persuasive language
- Ends with a call to action

Return JSON: {"descriptionEn": "..."}`
      expectedFields = ['descriptionEn']
      break

    case 'descriptionAr':
      userPrompt = `${productInfo}

Generate a compelling Arabic (العربية) product description (${MAX_DESCRIPTION} chars max) that:
- Opens with the brand and product name in Arabic
- Highlights 3-4 key features/benefits in natural Arabic
- Uses persuasive Arabic marketing language
- Ends with a call to action in Arabic

Return JSON: {"descriptionAr": "..."}`
      expectedFields = ['descriptionAr']
      break

    case 'shortDescriptionEn':
      userPrompt = `${productInfo}

Generate a concise English short description (${MAX_SHORT_DESCRIPTION} chars max) that:
- Summarizes the product in 1-2 sentences
- Mentions the brand
- Highlights the main benefit

Return JSON: {"shortDescriptionEn": "..."}`
      expectedFields = ['shortDescriptionEn']
      break

    case 'shortDescriptionAr':
      userPrompt = `${productInfo}

Generate a concise Arabic (العربية) short description (${MAX_SHORT_DESCRIPTION} chars max) that:
- Summarizes the product in 1-2 sentences in natural Arabic
- Mentions the brand in Arabic if available
- Highlights the main benefit

Return JSON: {"shortDescriptionAr": "..."}`
      expectedFields = ['shortDescriptionAr']
      break

    case 'descriptions':
      userPrompt = `${productInfo}

Generate both English and Arabic product descriptions:

1. descriptionEn (${MAX_DESCRIPTION} chars): Compelling English description with features and benefits
2. descriptionAr (${MAX_DESCRIPTION} chars): Natural Arabic translation/adaptation

Return JSON: {"descriptionEn": "...", "descriptionAr": "..."}`
      expectedFields = ['descriptionEn', 'descriptionAr']
      break

    case 'shortDescriptions':
      userPrompt = `${productInfo}

Generate both English and Arabic short descriptions:

1. shortDescriptionEn (${MAX_SHORT_DESCRIPTION} chars): Concise English summary
2. shortDescriptionAr (${MAX_SHORT_DESCRIPTION} chars): Natural Arabic summary

Return JSON: {"shortDescriptionEn": "...", "shortDescriptionAr": "..."}`
      expectedFields = ['shortDescriptionEn', 'shortDescriptionAr']
      break

    case 'bilingualSeo':
      userPrompt = `${productInfo}

Generate complete bilingual SEO meta tags for this product:

1. seoTitleEn (${MAX_SEO_TITLE} chars): SEO title in English format "Product Name | Brand | Category"
2. seoTitleAr (${MAX_SEO_TITLE} chars): SEO title in Arabic
3. seoDescriptionEn (${MAX_SEO_DESCRIPTION} chars): Meta description in English - compelling summary for search results
4. seoDescriptionAr (${MAX_SEO_DESCRIPTION} chars): Meta description in Arabic
5. seoKeywordsEn: Comma-separated English keywords (8-12 keywords including product name, brand, category, features)
6. seoKeywordsAr: Comma-separated Arabic keywords
7. ogTitleEn (${MAX_SEO_TITLE} chars): Open Graph title in English (shorter, social-friendly)
8. ogTitleAr (${MAX_SEO_TITLE} chars): Open Graph title in Arabic
9. ogDescriptionEn (200 chars): Open Graph description in English
10. ogDescriptionAr (200 chars): Open Graph description in Arabic

Return JSON with all 10 fields.`
      expectedFields = [
        'seoTitleEn', 'seoTitleAr', 'seoDescriptionEn', 'seoDescriptionAr',
        'seoKeywordsEn', 'seoKeywordsAr', 'ogTitleEn', 'ogTitleAr',
        'ogDescriptionEn', 'ogDescriptionAr'
      ]
      break

    case 'all':
      userPrompt = `${productInfo}

Generate complete product content:

DESCRIPTIONS:
1. descriptionEn (${MAX_DESCRIPTION} chars): Full English product description
2. descriptionAr (${MAX_DESCRIPTION} chars): Full Arabic product description
3. shortDescriptionEn (${MAX_SHORT_DESCRIPTION} chars): Short English summary
4. shortDescriptionAr (${MAX_SHORT_DESCRIPTION} chars): Short Arabic summary

SEO META TAGS:
5. seoTitleEn (${MAX_SEO_TITLE} chars): SEO title "Product | Brand | Category"
6. seoTitleAr (${MAX_SEO_TITLE} chars): Arabic SEO title
7. seoDescriptionEn (${MAX_SEO_DESCRIPTION} chars): Meta description English
8. seoDescriptionAr (${MAX_SEO_DESCRIPTION} chars): Meta description Arabic
9. seoKeywordsEn: Comma-separated English keywords (10-15)
10. seoKeywordsAr: Comma-separated Arabic keywords
11. ogTitleEn (${MAX_SEO_TITLE} chars): Social sharing title English
12. ogTitleAr (${MAX_SEO_TITLE} chars): Social sharing title Arabic
13. ogDescriptionEn (200 chars): Social description English
14. ogDescriptionAr (200 chars): Social description Arabic

Return JSON with all fields.`
      expectedFields = [
        'descriptionEn', 'descriptionAr', 'shortDescriptionEn', 'shortDescriptionAr',
        'seoTitleEn', 'seoTitleAr', 'seoDescriptionEn', 'seoDescriptionAr',
        'seoKeywordsEn', 'seoKeywordsAr', 'ogTitleEn', 'ogTitleAr',
        'ogDescriptionEn', 'ogDescriptionAr'
      ]
      break

    case 'title':
      userPrompt = `${productInfo}

Generate an SEO-optimized title (${MAX_SEO_TITLE} chars max) in format:
"Product Name | Brand | Category"

Return JSON: {"title": "..."}`
      expectedFields = ['title']
      break

    case 'description':
      userPrompt = `${productInfo}

Generate an SEO meta description (${MAX_SEO_DESCRIPTION} chars max) that:
- Summarizes the product appealingly
- Includes brand and key benefit
- Has a subtle call to action

Return JSON: {"description": "..."}`
      expectedFields = ['description']
      break

    case 'keywords':
      userPrompt = `${productInfo}

Generate 10-15 SEO keywords as a comma-separated list including:
- Product name variations
- Brand + product combinations  
- Category terms
- Feature-based keywords
- Buy/shop intent keywords

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
    result.descriptionEn = truncate(descriptionTemplatesEn[randomIndex], MAX_DESCRIPTION)
  }

  if (['descriptionAr', 'descriptions', 'all'].includes(target)) {
    result.descriptionAr = truncate(descriptionTemplatesAr[randomIndex], MAX_DESCRIPTION)
  }

  if (['shortDescriptionEn', 'shortDescriptions', 'all'].includes(target)) {
    result.shortDescriptionEn = truncate(shortDescTemplatesEn[randomIndex], MAX_SHORT_DESCRIPTION)
  }

  if (['shortDescriptionAr', 'shortDescriptions', 'all'].includes(target)) {
    result.shortDescriptionAr = truncate(shortDescTemplatesAr[randomIndex], MAX_SHORT_DESCRIPTION)
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
