import { zodResponseFormat } from 'openai/helpers/zod'
import wikidata from '../src/prompts/wikidata'

describe('wikidata response schema', () => {
  it('converts to a Structured Outputs schema', () => {
    expect(() =>
      zodResponseFormat(wikidata.responseSchema, 'wikidata')
    ).not.toThrow()
  })

  it('requires logo and description, as openai 4 sent it', () => {
    const format = zodResponseFormat(wikidata.responseSchema, 'wikidata')
    const schema = format.json_schema.schema as {
      properties: {
        wikidata: {
          required: string[]
          properties: Record<string, { type: string }>
        }
      }
    }
    const inner = schema.properties.wikidata
    expect(inner.required).toEqual([
      'node',
      'url',
      'logo',
      'label',
      'description',
    ])
    expect(inner.properties.logo.type).toBe('string')
  })

  it('throws on the base schema, which has optional fields', () => {
    expect(() => zodResponseFormat(wikidata.schema, 'wikidata')).toThrow(
      /uses `.optional\(\)` without `.nullable\(\)`/
    )
  })

  it('still parses a Wikidata value without logo and description', () => {
    const parsed = wikidata.schema.safeParse({
      wikidata: { node: 'Q1', url: 'https://wikidata.org/wiki/Q1', label: 'A' },
    })
    expect(parsed.success).toBe(true)
  })
})
