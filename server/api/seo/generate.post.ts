import { defineEventHandler, readBody, setResponseStatus } from 'h3'
import { z } from 'zod'

import { generateProductCopyWithAI } from '../../utils/ai'

const MAX_SEO_TITLE_LENGTH = 80
const MAX_SEO_DESCRIPTION_LENGTH = 160
const MAX_SEO_KEYWORDS = 15
const MAX_DESCRIPTION_LENGTH = 2000
const MAX_SHORT_DESCRIPTION_LENGTH = 400

const PRIMARY_CONTENT_SOURCES = ['amazon.sa', 'noon.com', 'trendyol.com']
const FALLBACK_FEATURE_SENTENCES = [
  'Built for all-day comfort with details shoppers notice.',
  'Pairs easily with everyday outfits while keeping the look fresh.',
  'Trusted by customers who expect lasting comfort and bold styling.',
  'Designed to handle busy schedules without sacrificing style.'
]
const FALLBACK_CTA_EN = 'Secure this limited-edition release before it sells out.'
const FALLBACK_CTA_AR = 'احصل على هذا الإصدار المحدود قبل نفاد الكمية.'
const SHIPPING_KEYWORDS_EN = ['ship', 'shipping', 'delivery', 'deliveries', 'return', 'returns', 'courier', 'same day', 'fast delivery', 'express delivery']
const SHIPPING_KEYWORDS_AR = ['شحن', 'التسليم', 'تسليم', 'التوصيل', 'توصيل', 'التوصيلات', 'إرجاع', 'ارجاع', 'إعادة', 'سريع التوصيل', 'توصيل سريع']

const requestSchema = z.object({
  name: z.string().trim().min(1, 'Product name is required'),
  brand: z.string().trim().min(1, 'Brand is required'),
  category: z.string().trim().min(1, 'Category is required'),
  nameAr: z.string().trim().optional(),
  description: z.string().trim().optional(),
  descriptionAr: z.string().trim().optional(),
  shortDescription: z.string().trim().optional(),
  shortDescriptionAr: z.string().trim().optional(),
  slug: z.string().trim().optional(),
  keywords: z.array(z.string().trim()).optional(),
  randomize: z.boolean().optional().default(false),
  target: z.enum(['title', 'description', 'keywords', 'all', 'descriptionEn', 'descriptionAr', 'shortDescriptionEn', 'shortDescriptionAr', 'descriptions', 'shortDescriptions']).optional()
})

function containsShippingLanguage(text: string) {
  if (!text) {
    return false
  }

  const normalized = text.toLowerCase()

  if (SHIPPING_KEYWORDS_EN.some(keyword => normalized.includes(keyword))) {
    return true
  }

  for (const keyword of SHIPPING_KEYWORDS_AR) {
    if (text.includes(keyword)) {
      return true
    }
  }

  return false
}

type DuckDuckGoTopic = {
  Text?: string
  FirstURL?: string
  Topics?: DuckDuckGoTopic[]
}

interface DuckDuckGoResponse {
  Heading?: string
  AbstractText?: string
  AbstractURL?: string
  RelatedTopics?: DuckDuckGoTopic[]
}

interface SearchInsight {
  text: string
  url?: string
}

interface InsightRecord {
  text: string
  source?: string
}

function slugify(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\p{Diacritic}]/gu, '')
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
}

function normalizeSlugToPath(slug?: string | null) {
  if (!slug) {
    return ''
  }

  const trimmed = slug.trim()

  if (!trimmed) {
    return ''
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed
  }

  const sanitized = trimmed.replace(/^\/+/u, '')
  return sanitized ? `/${sanitized}` : ''
}

function truncateText(value: string, max: number) {
  if (!value) {
    return ''
  }

  if (value.length <= max) {
    return value
  }

  const clipped = value.slice(0, max).trim()
  const lastSpace = clipped.lastIndexOf(' ')

  if (lastSpace > max * 0.6) {
    return clipped.slice(0, lastSpace).trim()
  }

  return clipped
}

function collectTopics(topics?: DuckDuckGoTopic[], limit = 6) {
  if (!topics) {
    return []
  }

  const queue = [...topics]
  const texts: SearchInsight[] = []

  while (queue.length && texts.length < limit) {
    const topic = queue.shift()
    if (!topic) {
      continue
    }

    if (topic.Text) {
      texts.push({
        text: topic.Text,
        url: topic.FirstURL
      })
    }

    if (topic.Topics?.length) {
      queue.push(...topic.Topics)
    }
  }

  return texts
}

async function fetchSearchInsights(query: string, locale: 'en' | 'ar' = 'en'): Promise<SearchInsight[]> {
  if (!query) {
    return []
  }

  try {
    const region = locale === 'ar' ? 'ar-ar' : 'us-en'
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_redirect=1&skip_disambig=1&kl=${region}&hl=${locale}`
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'dashboard-seo-helper/1.0 (+https://nuxt-ui-templates.github.io)'
      }
    })

    if (!response.ok) {
      return []
    }

    const data = (await response.json()) as DuckDuckGoResponse
    const insights: SearchInsight[] = []

    if (data.Heading) {
      insights.push({ text: data.Heading })
    }

    if (data.AbstractText) {
      insights.push({ text: data.AbstractText, url: data.AbstractURL })
    }

    insights.push(...collectTopics(data.RelatedTopics))

    return insights
      .map(entry => ({
        text: entry.text.trim(),
        url: entry.url
      }))
      .filter(entry => entry.text.length > 0)
      .slice(0, 12)
  } catch {
    return []
  }
}
async function fetchPageSummary(url: string, _locale: 'en' | 'ar'): Promise<string[]> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'dashboard-seo-helper/1.0 (+https://nuxt-ui-templates.github.io)'
      },
      redirect: 'follow'
    })

    if (!response.ok) {
      return []
    }

    const contentType = response.headers.get('content-type') ?? ''
    if (!/text\/(html|plain)|application\/xhtml\+xml/i.test(contentType)) {
      return []
    }

    const raw = await response.text()
    const limited = raw.length > 30000 ? raw.slice(0, 30000) : raw
    const sanitized = limited
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')

    const sentences = extractSentences(sanitized, 10)
    return sentences.slice(0, 8)
  } catch {
    return []
  }
}

async function gatherInsightsFromPrimarySources(query: string, locale: 'en' | 'ar', context: { brand?: string | null, name?: string } = {}): Promise<InsightRecord[]> {
  const unique = new Map<string, InsightRecord>()
  let pageFetches = 0
  const MAX_PAGE_FETCHES = 10

  function addEntry(text: string | undefined, sourceLabel?: string) {
    const cleaned = cleanText(text)
    if (!cleaned) {
      return
    }

    if (containsShippingLanguage(cleaned)) {
      return
    }

    const key = cleaned.toLowerCase()
    if (unique.has(key)) {
      return
    }

    unique.set(key, {
      text: cleaned,
      source: sourceLabel
    })
  }

  function matchesBrand(url?: string) {
    const brand = cleanText(context.brand)?.toLowerCase().replace(/\s+/g, '')
    if (!brand || !url) {
      return false
    }
    return url.toLowerCase().includes(brand)
  }

  function maybeFetchSummary(url?: string, sourceLabel?: string) {
    if (!url || pageFetches >= MAX_PAGE_FETCHES) {
      return Promise.resolve()
    }

    pageFetches += 1
    return fetchPageSummary(url, locale)
      .then((sentences) => {
        for (const sentence of sentences) {
          addEntry(sentence, sourceLabel)
        }
      })
      .catch(() => {})
  }

  const tasks: Promise<void>[] = []

  const baseInsights = await fetchSearchInsights(query, locale)
  for (const insight of baseInsights) {
    addEntry(insight.text)
    tasks.push(maybeFetchSummary(insight.url))
  }

  const domainResults = await Promise.all(
    PRIMARY_CONTENT_SOURCES.map(async domain => ({
      domain,
      entries: await fetchSearchInsights(`${query} site:${domain}`, locale)
    }))
  )

  for (const result of domainResults) {
    for (const entry of result.entries.slice(0, 5)) {
      addEntry(entry.text, result.domain)
      tasks.push(maybeFetchSummary(entry.url, result.domain))
    }
  }

  if (context.brand) {
    const brandQueries = [
      `${context.brand} official ${locale === 'ar' ? 'arabic' : 'site'}`,
      `${context.brand} ${context.name ?? ''}`.trim(),
      `${context.brand} ${context.name ?? ''} specs ${locale === 'ar' ? 'مواصفات' : 'features'}`.trim()
    ]

    for (const brandQuery of brandQueries) {
      if (!brandQuery.trim()) {
        continue
      }

      const brandInsights = await fetchSearchInsights(brandQuery, locale)
      for (const insight of brandInsights.slice(0, 6)) {
        const sourceLabel = matchesBrand(insight.url) ? context.brand : undefined
        addEntry(insight.text, sourceLabel)
        if (matchesBrand(insight.url)) {
          tasks.push(maybeFetchSummary(insight.url, context.brand ?? undefined))
        }
      }
    }
  }

  await Promise.all(tasks)

  return Array.from(unique.values()).slice(0, 24)
}

async function translateToArabic(text: string) {
  const cleaned = cleanText(text)
  if (!cleaned) {
    return ''
  }

  // No caching: always fetch translation

  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(cleaned)}&langpair=en|ar`
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'dashboard-seo-helper/1.0 (+https://nuxt-ui-templates.github.io)'
      }
    })

    if (!response.ok) {
      return ''
    }

    const data = await response.json() as { responseData?: { translatedText?: string } }
    const translated = cleanText(data.responseData?.translatedText) ?? ''
    // No caching: do not store translation
    return translated
  } catch {
    return ''
  }
}

function buildKeywordSet({
  name,
  brand,
  category,
  slug,
  existing,
  insights
}: {
  name: string
  brand?: string
  category?: string
  slug?: string
  existing?: string[]
  insights: InsightRecord[]
}) {
  const keywords = new Set<string>(existing ?? [])
  const baseName = name || 'product'

  keywords.add(baseName)
  keywords.add(`${baseName} online`)
  keywords.add(`buy ${baseName}`)

  if (brand) {
    keywords.add(`${brand} ${baseName}`.trim())
    keywords.add(`${brand} deals`)
  }

  if (category) {
    keywords.add(`${category} ${baseName}`.trim())
    keywords.add(`${category} sale`)
  }

  if (slug) {
    keywords.add(slug.replace(/-/g, ' '))
  }

  for (const insight of insights) {
    const cleaned = insight.text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').trim()
    if (!cleaned) {
      continue
    }

    const parts = cleaned.split(/\s+/g)

    if (parts.length >= 2) {
      keywords.add(`${baseName} ${parts.slice(0, 2).join(' ')}`.trim())
    }

    if (parts.length >= 3) {
      keywords.add(`${parts.slice(0, 3).join(' ')}`)
    }

    if (cleaned.length > 10 && cleaned.length < 50) {
      keywords.add(cleaned)
    }
  }

  return Array.from(keywords)
    .map(keyword => truncateText(keyword.trim(), 60))
    .filter(keyword => keyword.length > 0)
    .slice(0, MAX_SEO_KEYWORDS * 2)
    .slice(0, MAX_SEO_KEYWORDS)
}

function buildArabicKeywordSet({
  nameAr,
  brand,
  insights,
  extras
}: {
  nameAr?: string | null
  brand?: string | null
  insights: InsightRecord[]
  extras?: string[]
}) {
  const keywords = new Set<string>()

  function addKeyword(value?: string | null) {
    const cleaned = cleanText(value)
    if (!cleaned) {
      return
    }

    if (!/[\u0600-\u06FF]/.test(cleaned)) {
      return
    }

    if (containsShippingLanguage(cleaned)) {
      return
    }

    keywords.add(truncateText(cleaned, 60))
  }

  addKeyword(nameAr)

  if (brand && /[\u0600-\u06FF]/.test(brand)) {
    addKeyword(brand)
  }

  if (nameAr) {
    addKeyword(`حذاء ${nameAr}`)
  }

  for (const extra of extras ?? []) {
    addKeyword(extra)
  }

  for (const insight of insights) {
    if (!/[\u0600-\u06FF]/.test(insight.text)) {
      continue
    }

    const segments = insight.text
      .split(/[،,.؛!؟]/u)
      .map(segment => segment.trim())
      .filter(segment => segment.length > 0 && segment.length < 80)

    for (const segment of segments) {
      addKeyword(segment)

      const words = segment.split(/\s+/u)
      if (words.length >= 2 && words.length <= 4) {
        addKeyword(words.slice(0, Math.min(words.length, 4)).join(' '))
      }

      if (words.length >= 3) {
        addKeyword(words.slice(0, 3).join(' '))
        addKeyword(words.slice(0, 2).join(' '))
      }
    }
  }

  return Array.from(keywords)
    .filter(kw => kw.split(/\s+/u).length >= 2)
    .slice(0, MAX_SEO_KEYWORDS * 2)
    .slice(0, MAX_SEO_KEYWORDS)
}

function composeDescription({
  name,
  brand,
  category,
  summary,
  insight
}: {
  name: string
  brand?: string
  category?: string
  summary?: string
  insight?: InsightRecord
}) {
  const leadParts: string[] = []
  if (brand) {
    leadParts.push(`${brand} ${name}`.trim())
  } else {
    leadParts.push(name)
  }

  if (category) {
    leadParts.push(category)
  }

  const detailParts: string[] = []
  if (summary) {
    detailParts.push(summary)
  }

  const insightText = insight?.source ? `${insight.source}: ${insight.text}` : insight?.text
  if (insightText && (!summary || !summary.toLowerCase().includes(insightText.toLowerCase()))) {
    detailParts.push(insightText)
  }

  const content = `${leadParts.join(' — ')}. ${detailParts.join(' ')}`

  return truncateText(content.replace(/\s+/g, ' ').trim(), MAX_SEO_DESCRIPTION_LENGTH)
}

function cleanText(value?: string | null) {
  return value ? value.replace(/\s+/g, ' ').trim() : ''
}

function extractSentences(text: string, limit: number) {
  if (!text) {
    return []
  }

  const normalized = cleanText(text)
  if (!normalized) {
    return []
  }

  const rawSentences = normalized
    .split(/[.!؟?؛]+/u)
    .map(sentence => sentence.trim())
    .filter(sentence => sentence.length > 0)

  const unique: string[] = []
  for (const sentence of rawSentences) {
    const lower = sentence.toLowerCase()
    if (unique.some(existing => existing.toLowerCase() === lower)) {
      continue
    }
    unique.push(sentence)
    if (unique.length >= limit) {
      break
    }
  }

  return unique
}

function pushSentence(target: string[], sentence?: string) {
  const cleaned = cleanText(sentence)
  if (!cleaned) {
    return
  }

  const normalized = cleaned.toLowerCase()
  if (target.some(existing => existing.toLowerCase() === normalized)) {
    return
  }

  const punctuated = /[.!?]$/u.test(cleaned) ? cleaned : `${cleaned}.`
  target.push(punctuated)
}

function deriveCategoryContext({ category, insights }: { category?: string | null, insights: InsightRecord[] }) {
  const normalizedCategory = cleanText(category)?.toLowerCase()
  const targeted = normalizedCategory
    ? insights.find(entry => entry.text.toLowerCase().includes(normalizedCategory))
    : undefined
  const resolved = targeted?.text || insights[0]?.text || ''
  const formatted = resolved ? resolved.charAt(0).toUpperCase() + resolved.slice(1) : ''

  return {
    en: formatted,
    shortEn: truncateText(formatted || resolved, 120)
  }
}

function formatRetailerInsightSentence(insight: InsightRecord) {
  const source = insight.source ?? ''
  const cleaned = cleanText(insight.text)
  if (!cleaned) {
    return ''
  }

  const detail = cleaned.endsWith('.') ? cleaned : `${cleaned}.`
  const normalizedSource = source.toLowerCase()

  if (!normalizedSource) {
    return detail
  }

  if (normalizedSource.includes('amazon.sa')) {
    return `Amazon.sa highlights ${detail.charAt(0).toLowerCase() + detail.slice(1)}`
  }

  if (normalizedSource.includes('noon.com')) {
    return `Noon.com shoppers mention ${detail.charAt(0).toLowerCase() + detail.slice(1)}`
  }

  if (normalizedSource.includes('trendyol.com')) {
    return `Trendyol.com notes ${detail.charAt(0).toLowerCase() + detail.slice(1)}`
  }

  if (contextualBrandMatchesSource(insight.source)) {
    return `${insight.source} reports ${detail.charAt(0).toLowerCase() + detail.slice(1)}`
  }

  return detail
}

function contextualBrandMatchesSource(source?: string) {
  if (!source) {
    return false
  }

  const normalized = source.toLowerCase()
  return !normalized.includes('.') || normalized.includes('official')
}

function scoreInsight(insight: InsightRecord, context: { name: string, brand?: string }) {
  const { name, brand } = context
  const normalized = insight.text.toLowerCase()
  const nameTokens = Array.from(new Set(name.toLowerCase().split(/[^a-z0-9]+/g).filter(Boolean)))
  let score = Math.min(insight.text.length, 500) / 20

  for (const token of nameTokens) {
    if (normalized.includes(token)) {
      score += 8
    }
  }

  if (brand) {
    const brandNormalized = brand.toLowerCase().replace(/\s+/g, '')
    if (normalized.includes(brandNormalized) || (insight.source && insight.source.toLowerCase().includes(brandNormalized))) {
      score += 15
    }
  }

  if (insight.source) {
    const src = insight.source.toLowerCase()
    if (src.includes('amazon.sa')) {
      score += 10
    } else if (src.includes('noon.com')) {
      score += 10
    } else if (src.includes('trendyol.com')) {
      score += 10
    } else if (src.includes('official') || (!src.includes('.') && brand && src.includes(brand.toLowerCase()))) {
      score += 12
    }
  }

  const featureKeywords = [
    'memory foam', 'air-cooled', 'duraleather', 'lace-up', 'special edition', 'limited edition',
    'مطاط', 'جلد', 'فوم', 'ذاكر', 'إصدار خاص', 'محدود', 'نعل', 'تصميم'
  ]

  for (const keyword of featureKeywords) {
    if (normalized.includes(keyword.toLowerCase()) || insight.text.includes(keyword)) {
      score += 6
    }
  }

  return score
}

function prioritizeInsights(insights: InsightRecord[], context: { name: string, brand?: string }) {
  return [...insights]
    .filter(entry => entry.text.length > 0)
    .sort((a, b) => scoreInsight(b, context) - scoreInsight(a, context))
}

async function composeProductCopy({
  name,
  nameAr,
  brand,
  category,
  summaryEn,
  summaryAr,
  shortDescriptionAr,
  insightsEn,
  insightsAr
}: {
  name: string
  nameAr?: string
  brand?: string
  category?: string
  summaryEn?: string
  summaryAr?: string
  shortDescriptionAr?: string
  insightsEn: InsightRecord[]
  insightsAr: InsightRecord[]
}) {
  const aiCopy = await generateProductCopyWithAI({
    name,
    brand,
    category,
    existingEnglish: summaryEn,
    existingArabic: summaryAr || shortDescriptionAr,
    insightsEn: insightsEn.map(entry => entry.text),
    insightsAr: insightsAr.map(entry => entry.text)
  })

  if (aiCopy) {
    return {
      nameAr: aiCopy.nameAr || nameAr,
      descriptionEn: truncateText(aiCopy.descriptionEn, MAX_DESCRIPTION_LENGTH),
      descriptionAr: truncateText(aiCopy.descriptionAr, MAX_DESCRIPTION_LENGTH),
      shortDescriptionEn: truncateText(aiCopy.shortDescriptionEn, MAX_SHORT_DESCRIPTION_LENGTH),
      shortDescriptionAr: truncateText(aiCopy.shortDescriptionAr, MAX_SHORT_DESCRIPTION_LENGTH),
      keywords: aiCopy.keywords
    }
  }

  const prioritizedInsightsEn = prioritizeInsights(insightsEn, { name, brand })
  const categoryContext = deriveCategoryContext({ category, insights: prioritizedInsightsEn })

  const englishSentences: string[] = []

  const displayName = brand ? `${brand} ${name}`.trim() : name
  const categoryLabel = cleanText(category)?.toLowerCase()

  const lead = categoryLabel
    ? `${displayName} refreshes your ${categoryLabel} lineup with dependable details.`
    : `${displayName} blends everyday comfort with a polished finish.`
  pushSentence(englishSentences, lead)

  const summarySentences = extractSentences(summaryEn || '', 3)
  for (const sentence of summarySentences) {
    pushSentence(englishSentences, sentence)
  }

  const formattedInsights = prioritizedInsightsEn
    .map(formatRetailerInsightSentence)
    .filter(Boolean)
    .slice(0, 8)

  for (const sentence of formattedInsights) {
    pushSentence(englishSentences, sentence)
  }

  if (englishSentences.length < 5) {
    for (const fallback of FALLBACK_FEATURE_SENTENCES) {
      pushSentence(englishSentences, fallback)
      if (englishSentences.length >= 5) {
        break
      }
    }
  }

  pushSentence(englishSentences, FALLBACK_CTA_EN)

  const descriptionEn = truncateText(englishSentences.join(' '), MAX_DESCRIPTION_LENGTH)

  const shortHighlight = formattedInsights[0] || categoryContext.shortEn || summarySentences[0] || 'Available as a limited drop.'
  const shortIntro = categoryLabel
    ? `${displayName} keeps ${categoryLabel} shoppers ready.`
    : `${displayName} is in stock now.`
  const shortDescriptionEn = truncateText(`${shortIntro} ${shortHighlight} Secure yours before it sells out.`, MAX_SHORT_DESCRIPTION_LENGTH)

  const resolvedNameAr = cleanText(nameAr) || (await translateToArabic(displayName)) || displayName

  const arabicSentences: string[] = []
  const arabicSummarySentences = extractSentences(summaryAr || '', 4)

  if (arabicSummarySentences.length) {
    for (const sentence of arabicSummarySentences) {
      pushSentence(arabicSentences, sentence)
    }
  } else if (insightsAr.length) {
    for (const insight of prioritizeInsights(insightsAr, { name, brand }).slice(0, 6)) {
      pushSentence(arabicSentences, insight.text)
    }
  } else {
    const translatedFallback = await translateToArabic(descriptionEn)
    const fallbackSentences = extractSentences(translatedFallback, 6)
    for (const sentence of fallbackSentences) {
      pushSentence(arabicSentences, sentence)
    }
  }

  if (!arabicSentences.length && formattedInsights.length) {
    const translatedHighlights = await Promise.all(
      formattedInsights.slice(0, 5).map(sentence => translateToArabic(sentence))
    )
    for (const translated of translatedHighlights) {
      pushSentence(arabicSentences, translated)
    }
  }

  if (!arabicSentences.length) {
    const translatedName = await translateToArabic(displayName)
    pushSentence(arabicSentences, translatedName || resolvedNameAr)
  }

  const descriptionAr = truncateText(arabicSentences.join(' '), MAX_DESCRIPTION_LENGTH)

  let shortDescriptionArText = cleanText(shortDescriptionAr)
  if (!shortDescriptionArText) {
    const translatedShort = await translateToArabic(shortDescriptionEn)
    shortDescriptionArText = translatedShort || (await translateToArabic(categoryContext.shortEn || displayName)) || `${resolvedNameAr}. ${FALLBACK_CTA_AR}`
  }

  const shortDescriptionArResult = truncateText(shortDescriptionArText || FALLBACK_CTA_AR, MAX_SHORT_DESCRIPTION_LENGTH)

  return {
    nameAr: resolvedNameAr,
    descriptionEn,
    descriptionAr,
    shortDescriptionEn,
    shortDescriptionAr: shortDescriptionArResult
  }
}

export default defineEventHandler(async (event) => {
  const rawBody = await readBody(event)
  const parsed = requestSchema.safeParse(rawBody ?? {})

  if (!parsed.success) {
    setResponseStatus(event, 400)
    return {
      error: parsed.error.issues[0]?.message ?? 'Invalid request payload'
    }
  }

  const body = parsed.data
  const _randomize = body.randomize ?? false
  const name = body.name.trim()
  const brand = body.brand?.trim()
  const category = body.category?.trim()
  const slug = body.slug?.trim() || slugify(name)
  const nameAr = body.nameAr?.trim()
  const descriptionAr = body.descriptionAr?.trim() || body.shortDescriptionAr?.trim()

  const queryTerms = [name, category, brand].filter(Boolean).join(' ')
  const [insightsEn, insightsAr]: [InsightRecord[], InsightRecord[]] = await Promise.all([
    gatherInsightsFromPrimarySources(queryTerms, 'en', { brand, name }),
    gatherInsightsFromPrimarySources(queryTerms, 'ar', { brand, name })
  ])
  const summary = body.shortDescription || body.description || insightsEn[0]?.text || ''
  const secondaryInsight = insightsEn.find(entry => entry.text !== summary)

  const titlePieces: string[] = []

  if (brand) {
    titlePieces.push(`${brand} ${name}`.trim())
  } else {
    titlePieces.push(name)
  }

  if (category) {
    titlePieces.push(category)
  }

  if (insightsEn.length) {
    const highlight = insightsEn[0]?.source ? `${insightsEn[0].source}: ${insightsEn[0].text}` : insightsEn[0]?.text
    if (highlight) {
      titlePieces.push(highlight)
    }
  }

  const title = truncateText(titlePieces.filter(Boolean).join(' | '), MAX_SEO_TITLE_LENGTH) || truncateText(name, MAX_SEO_TITLE_LENGTH)

  const description = composeDescription({
    name,
    brand,
    category,
    summary,
    insight: secondaryInsight
  })

  const copy = await composeProductCopy({
    name,
    nameAr,
    brand,
    category,
    summaryEn: body.description || body.shortDescription,
    summaryAr: descriptionAr,
    shortDescriptionAr: body.shortDescriptionAr,
    insightsEn,
    insightsAr
  })

  const keywordSeeds = body.keywords ? [...body.keywords] : []
  if (copy.keywords?.length) {
    keywordSeeds.push(...copy.keywords)
  }

  const keywords = buildKeywordSet({
    name,
    brand,
    category,
    slug,
    existing: keywordSeeds,
    insights: insightsEn
  })

  const arabicBrandHint = (() => {
    const source = cleanText(copy.nameAr ?? nameAr ?? body.nameAr)
    if (!source) {
      return null
    }

    const tokens = source.split(/\s+/u)
    if (tokens.length < 1) {
      return null
    }

    const candidate = tokens[0]
    return /[\u0600-\u06FF]/.test(candidate) ? candidate : null
  })()

  const arabicExtras = [body.descriptionAr, body.shortDescriptionAr, copy.descriptionAr, copy.shortDescriptionAr]
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)

  const keywordsAr = buildArabicKeywordSet({
    nameAr: copy.nameAr ?? nameAr ?? body.nameAr ?? null,
    brand: arabicBrandHint,
    insights: insightsAr,
    extras: arabicExtras
  })

  const canonical = normalizeSlugToPath(slug)

  return {
    result: {
      title,
      description,
      keywords,
      canonical,
      nameAr: copy.nameAr ?? nameAr ?? body.nameAr,
      descriptionEn: copy.descriptionEn,
      descriptionAr: copy.descriptionAr,
      shortDescriptionEn: copy.shortDescriptionEn,
      shortDescriptionAr: copy.shortDescriptionAr,
      keywordsAr
    }
  }
})
