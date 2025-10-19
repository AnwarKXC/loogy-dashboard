declare module 'multiparty' {
  interface File {
    fieldName: string
    originalFilename: string
    path: string
    headers: Record<string, string>
    size: number
  }

  type Files = Record<string, File[]>
  type Fields = Record<string, string[]>

  class Form {
    parse(
      request: unknown,
      callback: (err: Error | null, fields: Fields, files: Files) => void
    ): void
  }

  const multiparty: {
    Form: typeof Form
  }

  export { Form, File, Files, Fields }
  export default multiparty
}

declare module 'mime-types' {
  type LookupInput = string | Buffer

  function lookup(path: LookupInput): string | false

  const mime: {
    lookup: typeof lookup
  }

  export { lookup }
  export default mime
}

export {}
