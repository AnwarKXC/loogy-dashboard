#!/usr/bin/env node

/**
 * Quick helper to exercise the SEO generator endpoint with a sample payload.
 *
 * Usage:
 *   node tools/test-seo-generator.mjs [--base http://localhost:3000] [--target shortDescriptions]
 *
 * By default the script targets the local Nuxt dev server at http://localhost:3000
 * and asks the generator for short descriptions. Adjust the payload below as needed
 * to test different product scenarios.
 */

const DEFAULT_BASE_URL = 'http://localhost:3000'
const DEFAULT_TARGET = 'shortDescriptions'

function parseArgs(argv) {
  const args = { base: DEFAULT_BASE_URL, target: DEFAULT_TARGET }

  for (let index = 2; index < argv.length; index += 1) {
    const current = argv[index]

    if (!current) {
      continue
    }

    if (current === '--base') {
      args.base = argv[index + 1] ?? DEFAULT_BASE_URL
      index += 1
      continue
    }

    if (current === '--target') {
      args.target = argv[index + 1] ?? DEFAULT_TARGET
      index += 1
      continue
    }

    if (current === '--help' || current === '-h') {
      printUsage()
      process.exit(0)
    }

    console.warn(`Unknown argument: ${current}`)
  }

  return args
}

function printUsage() {
  console.log(`Usage: node tools/test-seo-generator.mjs [options]\n\nOptions:\n  --base <url>    Base URL for your Nuxt app (default: ${DEFAULT_BASE_URL})\n  --target <key>  Generation target (title | description | keywords | all | descriptionEn | descriptionAr | shortDescriptionEn | shortDescriptionAr | descriptions | shortDescriptions)\n  --help          Show this message\n`)
}

async function main() {
  const { base, target } = parseArgs(process.argv)

  const payload = {
    name: 'UNO - Between Life and Beyond',
    nameAr: '',
    brand: 'SKECHERS',
    category: 'shoes',
    description: '',
    descriptionAr: '',
    shortDescription: '',
    shortDescriptionAr: '',
    slug: 'uno-between-life-and-beyond',
    keywords: [],
    randomize: true,
    target
  }

  const endpoint = new URL('/api/seo/generate', base).toString()

  console.log('Sending request to', endpoint)
  console.log('Payload:', JSON.stringify(payload, null, 2))

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })

  const text = await response.text()

  const summary = {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText
  }

  console.log('\nResponse meta:', summary)

  try {
    const json = JSON.parse(text)
    console.log('\nResponse JSON:', JSON.stringify(json, null, 2))
  } catch (error) {
    console.log('\nRaw response text:', text)
    if (error instanceof Error) {
      console.error('Failed to parse JSON:', error.message)
    }
  }
}

main().catch((error) => {
  console.error('Test failed:', error)
  process.exitCode = 1
})
