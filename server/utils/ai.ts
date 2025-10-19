type GenerateProductCopyParams = {
  name: string
  brand?: string
  category?: string
  existingEnglish?: string
  existingArabic?: string
  insightsEn: string[]
  insightsAr: string[]
}

type GenerateProductCopyResult = {
  nameAr?: string
  descriptionEn: string
  descriptionAr: string
  shortDescriptionEn: string
  shortDescriptionAr: string
  keywords?: string[]
}

const HF_API_TOKEN = process.env.HF_API_TOKEN
const HF_MODEL = process.env.HF_SEO_MODEL || 'mistralai/Mistral-7B-Instruct'

function clampArray(values: string[], limit: number) {
  return values.filter(Boolean).slice(0, limit)
}

function formatContextList(values: string[]) {
  if (!values.length) {
    return 'None.'
  }
  return values.slice(0, 12).map((entry, index) => `${index + 1}. ${entry}`).join('\n')
}

function extractJsonPayload(text: string) {
  if (!text) {
    return ''
  }

  const firstBrace = text.indexOf('{')
  const lastBrace = text.lastIndexOf('}')

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return ''
  }

  return text.slice(firstBrace, lastBrace + 1)
}

function hasMeaningfulContent(text: string, minimumCharacters = 80, minimumUniqueWords = 6) {
  const normalized = text.replace(/[^\p{Letter}\p{Number}\s]/gu, ' ').replace(/\s+/g, ' ').trim()
  if (!normalized) {
    return false
  }

  if (normalized.length < minimumCharacters) {
    return false
  }

  const words = normalized.split(/\s+/g)
  if (words.length < minimumUniqueWords) {
    return false
  }

  const uniqueWords = new Set(words.map(word => word.toLowerCase()))
  if (uniqueWords.size < minimumUniqueWords) {
    return false
  }

  const genericPhrases = [
    'perfect for daily use',
    'high quality',
    'great choice',
    'excellent product',
    'designed for you',
    'ideal for everyone',
    'مثالي للاستخدام اليومي',
    'جودة عالية',
    'اختيار رائع'
  ]

  const lowerText = normalized.toLowerCase()
  const hasGenericContent = genericPhrases.some(phrase => lowerText.includes(phrase.toLowerCase()))

  return !hasGenericContent
}

export async function generateProductCopyWithAI(params: GenerateProductCopyParams): Promise<GenerateProductCopyResult | null> {
  if (!HF_API_TOKEN) {
    return null
  }

  const { name, brand, category, existingEnglish, existingArabic, insightsEn, insightsAr } = params

  const englishInsightsFormatted = formatContextList(insightsEn)
  const arabicInsightsFormatted = formatContextList(insightsAr)

  const prompt = `You are a bilingual e-commerce SEO specialist crafting product descriptions that drive conversions and rank well in search engines.

Product name: ${name}
Brand: ${brand || 'Unknown'}
Category: ${category || 'Uncategorised'}

Existing English description: ${existingEnglish || 'None provided.'}
Existing Arabic description: ${existingArabic || 'None provided.'}

English search findings from Amazon.sa, Noon.com, Trendyol.com, and official brand sources:
${englishInsightsFormatted}

Arabic search findings from أمازون السعودية, نون.كوم, ترينديول, and brand sites:
${arabicInsightsFormatted}

CRITICAL INSTRUCTIONS:

1. **Anchor to Real Details**: Extract specific product features, materials, technologies (e.g., "Air-Cooled Memory Foam", "duraleather upper", "special edition") from the search findings. Do NOT write generic phrases like "perfect for daily use" or "high quality materials" unless you can cite them from the insights.

2. **Arabic Name**: Infer the official Arabic product name from Arabic insights. If unavailable, transliterate naturally for Arabic speakers.

3. **Tone & Style**:
   - English: Conversational yet authoritative. Write like a knowledgeable sales associate who knows the product inside-out.
   - Arabic: Modern Standard Arabic (فصحى حديثة) with natural phrasing shoppers expect in UAE/Saudi markets.
   - Both: Avoid corporate jargon, shipping promises, or vague superlatives. Be specific.

4. **Structure**:
   - **descriptionEn** (3-5 sentences): Lead with what makes this product special (edition, design story, hero feature). Follow with 2-3 concrete benefits or design details. Close with aspirational usage context.
   - **descriptionAr** (3-5 sentences): Mirror the structure but ensure it reads naturally in Arabic, not as a direct translation.
   - **shortDescriptionEn** (1-2 sentences): Hook + key differentiator + urgency (e.g., "limited edition", "exclusive drop").
   - **shortDescriptionAr** (1-2 sentences): Same approach, culturally appropriate.

5. **Keywords** (8-12 English): Focus on high-intent search terms: "{brand} {product}", "{category} {feature}", "{product} buy online", "{special edition name}". Avoid single generic words.

6. **Quality Bars**:
   - Minimum 100 characters for long descriptions
   - Minimum 50 characters for short descriptions
   - No repetition between long and short descriptions
   - No invented product specs
   - Reject output if it sounds like a template

EXAMPLE (for reference only, adapt to actual product):
{
  "nameAr": "سكيتشرز أونو - بين الحياة وما بعدها",
  "descriptionEn": "Celebrate the eternal connection with the Skechers Street™ UNO - Between Life and Beyond, a special edition inspired by Día de los Muertos. This iconic lace-up showcases a smooth duraleather upper adorned with traditional symbols: spirit guide dogs, festive marigolds, and papel picado motifs that honor those we remember. Equipped with a Skechers Air-Cooled Memory Foam® insole and translucent Skech-Air® midsole for all-day comfort. Perfect for collectors and culture enthusiasts seeking a meaningful statement sneaker.",
  "descriptionAr": "احتفل بالرابطة الأبدية مع حذاء سكيتشرز ستريت™ أونو - بين الحياة وما بعدها، إصدار خاص مستوحى من يوم الموتى المكسيكي. يتميز هذا الحذاء بتصميم من الجلد المتين المزين برموز تقليدية: كلاب الأرواح المرشدة، زهور القطيفة الاحتفالية، وزخارف الورق المقصوص التي تكرّم من نتذكرهم. مجهز بنعل داخلي من الفوم الذاكر المبرّد بالهواء® ونعل أوسط شفاف من تقنية Skech-Air® لراحة طوال اليوم. مثالي لهواة الجمع ومحبي الثقافة الباحثين عن حذاء رياضي مميز وذو معنى.",
  "shortDescriptionEn": "Limited-edition Día de los Muertos tribute with Air-Cooled Memory Foam® comfort. Secure this iconic design before it's gone.",
  "shortDescriptionAr": "إصدار محدود يحتفي بيوم الموتى مع راحة الفوم الذاكر المبرّد بالهواء®. احصل على هذا التصميم المميز قبل نفاد الكمية.",
  "keywords": [
    "skechers uno between life and beyond",
    "dia de los muertos sneakers",
    "skechers special edition",
    "air cooled memory foam shoes",
    "skechers street uno",
    "limited edition skechers",
    "duraleather sneakers",
    "skechers uno buy online"
  ]
}

Return ONLY a valid JSON object with these exact keys: nameAr, descriptionEn, descriptionAr, shortDescriptionEn, shortDescriptionAr, keywords. No markdown, no commentary, no extra text.`

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'dashboard-seo-helper/1.0 (+https://nuxt-ui-templates.github.io)'
    }
    headers.Authorization = `Bearer ${HF_API_TOKEN}`

    const response = await fetch(`https://api-inference.huggingface.co/models/${encodeURIComponent(HF_MODEL)}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 1000,
          temperature: 0.6,
          top_p: 0.9,
          return_full_text: false
        }
      })
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json() as Array<{ generated_text?: string } | { error?: string }>
    if (!Array.isArray(data) || data.length === 0) {
      return null
    }

    const firstResult = data[0] as { generated_text?: string }
    const generated = typeof firstResult.generated_text === 'string' ? firstResult.generated_text : ''
    const payload = extractJsonPayload(generated)

    if (!payload) {
      return null
    }

    const parsed = JSON.parse(payload) as GenerateProductCopyResult
    const descriptionEn = parsed.descriptionEn?.trim()
    const descriptionAr = parsed.descriptionAr?.trim()
    const shortDescriptionEn = parsed.shortDescriptionEn?.trim()
    const shortDescriptionAr = parsed.shortDescriptionAr?.trim()

    if (!descriptionEn || !descriptionAr || !shortDescriptionEn || !shortDescriptionAr) {
      return null
    }

    const contentSamples = [descriptionEn, descriptionAr, shortDescriptionEn, shortDescriptionAr]
    const contentIsWeak = contentSamples.some(sample => !hasMeaningfulContent(sample, sample === descriptionEn || sample === descriptionAr ? 100 : 50, 8))

    if (contentIsWeak) {
      return null
    }

    if (descriptionEn.toLowerCase() === shortDescriptionEn.toLowerCase()) {
      return null
    }

    if (descriptionAr.toLowerCase() === shortDescriptionAr.toLowerCase()) {
      return null
    }

    const keywords = parsed.keywords ? clampArray(parsed.keywords.map(keyword => keyword.toLowerCase().trim()), 12) : undefined

    return {
      nameAr: parsed.nameAr?.trim(),
      descriptionEn,
      descriptionAr,
      shortDescriptionEn,
      shortDescriptionAr,
      keywords
    }
  } catch {
    return null
  }
}
