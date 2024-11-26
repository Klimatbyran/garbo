import { z } from 'zod'

// This module contains the expected response schema from the nlm-ingestor
// Generated with https://app.quicktype.io/

const TagSchema = z.enum(['header', 'list_item', 'para', 'table'])

const TypeSchema = z.enum(['full_row', 'table_data_row', 'table_header'])

const CellValueSchema = z.object({
  bbox: z.array(z.number()),
  block_class: z.string(),
  block_idx: z.number(),
  page_idx: z.number(),
  sentences: z.array(z.string()),
  tag: TagSchema,
})

const StyleSchema = z.object({
  'font-family': z.string(),
  'font-size': z.number(),
  'font-style': z.string(),
  'font-weight': z.number(),
  'text-align': z.string(),
  'text-transform': z.string(),
})

const CellSchema = z.object({
  cell_value: z.union([CellValueSchema, z.string()]),
  col_span: z.number().optional(),
})
export type Cell = z.infer<typeof CellSchema>

const StyleElementSchema = z.object({
  class_name: z.string(),
  style: StyleSchema,
})

const TableRowSchema = z.object({
  block_idx: z.number(),
  cells: z.array(CellSchema).optional(),
  type: TypeSchema,
  cell_value: z.string().optional(),
  col_span: z.number().optional(),
})

export const BaseBlockSchema = z.object({
  bbox: z.array(z.number()).optional(),
  block_class: z.string(),
  block_idx: z.number(),
  level: z.number(),
  page_idx: z.number(),
  tag: TagSchema,
})

const ParagraphSchema = BaseBlockSchema.extend({
  tag: z.enum(['para']),
  sentences: z.array(z.string()),
})
export type Paragraph = z.infer<typeof ParagraphSchema>

const HeaderSchema = ParagraphSchema.extend({
  tag: z.enum(['header']),
})
export type Header = z.infer<typeof HeaderSchema>

const ListItemSchema = ParagraphSchema.extend({
  tag: z.enum(['list_item']),
})
export type ListItem = z.infer<typeof ListItemSchema>

const TableSchema = BaseBlockSchema.extend({
  tag: z.enum(['table']),
  table_rows: z.array(TableRowSchema).optional(),
  left: z.number(),
  name: z.string(),
  top: z.number(),
})
export type Table = z.infer<typeof TableSchema>

const BlockSchema = z.discriminatedUnion('tag', [
  ParagraphSchema,
  HeaderSchema,
  ListItemSchema,
  TableSchema,
])
export type Block = z.infer<typeof BlockSchema>

const ResultSchema = z.object({
  blocks: z.array(BlockSchema),
  styles: z.array(StyleElementSchema),
})

const ReturnDictSchema = z.object({
  num_pages: z.number(),
  page_dim: z.array(z.number()),
  result: ResultSchema,
})

export const ParsedDocumentSchema = z.object({
  return_dict: ReturnDictSchema,
  status: z.number(),
})
export type ParsedDocument = z.infer<typeof ParsedDocumentSchema>
