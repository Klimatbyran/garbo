import * as z from 'zod'

export const BodyLabelSchema = z.enum(['list', 'unspecified'])
export type BodyLabel = z.infer<typeof BodyLabelSchema>

export const NameSchema = z.enum(['list', '_root_'])
export type Name = z.infer<typeof NameSchema>

export const CoordOriginSchema = z.enum(['BOTTOMLEFT'])
export type CoordOrigin = z.infer<typeof CoordOriginSchema>

export const PictureLabelSchema = z.enum(['picture', 'table'])
export type PictureLabel = z.infer<typeof PictureLabelSchema>

export const TextLabelSchema = z.enum([
  'caption',
  'footnote',
  'list_item',
  'page_footer',
  'page_header',
  'paragraph',
  'section_header',
  'text',
])
export type TextLabel = z.infer<typeof TextLabelSchema>

export const MarkerSchema = z.enum(['-'])
export type Marker = z.infer<typeof MarkerSchema>

export const ParentSchema = z.object({
  $ref: z.string(),
})
export type Parent = z.infer<typeof ParentSchema>

export const OriginSchema = z.object({
  mimetype: z.string(),
  binary_hash: z.number(),
  filename: z.string(),
})
export type Origin = z.infer<typeof OriginSchema>

export const SizeSchema = z.object({
  width: z.number(),
  height: z.number(),
})
export type Size = z.infer<typeof SizeSchema>

export const BboxSchema = z.object({
  l: z.number(),
  t: z.number(),
  r: z.number(),
  b: z.number(),
  coord_origin: CoordOriginSchema,
})
export type Bbox = z.infer<typeof BboxSchema>

export const ProvSchema = z.object({
  page_no: z.number(),
  bbox: BboxSchema,
  charspan: z.array(z.number()),
})
export type Prov = z.infer<typeof ProvSchema>

export const TextSchema = z.object({
  self_ref: z.string(),
  parent: ParentSchema,
  children: z.array(z.any()),
  label: TextLabelSchema,
  prov: z.array(ProvSchema),
  orig: z.string(),
  text: z.string(),
  level: z.number().optional(),
  enumerated: z.boolean().optional(),
  marker: MarkerSchema.optional(),
})
export type Text = z.infer<typeof TextSchema>

export const BodySchema = z.object({
  self_ref: z.string(),
  children: z.array(ParentSchema),
  name: NameSchema,
  label: BodyLabelSchema,
  parent: ParentSchema.optional(),
})
export type Body = z.infer<typeof BodySchema>

export const PageSchema = z.object({
  size: SizeSchema,
  page_no: z.number(),
})
export type Page = z.infer<typeof PageSchema>

export const TableCellSchema = z.object({
  bbox: BboxSchema.optional(),
  row_span: z.number(),
  col_span: z.number(),
  start_row_offset_idx: z.number(),
  end_row_offset_idx: z.number(),
  start_col_offset_idx: z.number(),
  end_col_offset_idx: z.number(),
  text: z.string(),
  column_header: z.boolean(),
  row_header: z.boolean(),
  row_section: z.boolean(),
})
export type TableCell = z.infer<typeof TableCellSchema>

export const DataSchema = z.object({
  table_cells: z.array(TableCellSchema),
  num_rows: z.number(),
  num_cols: z.number(),
  grid: z.array(z.array(TableCellSchema)),
})
export type Data = z.infer<typeof DataSchema>

export const PictureSchema = z.object({
  self_ref: z.string(),
  parent: ParentSchema,
  children: z.array(z.any()),
  label: PictureLabelSchema,
  prov: z.array(ProvSchema),
  captions: z.array(ParentSchema),
  references: z.array(z.any()),
  footnotes: z.array(z.any()),
  annotations: z.array(z.any()).optional(),
  data: DataSchema.optional(),
})
export type Picture = z.infer<typeof PictureSchema>

export const DoclingDocumentSchema = z.object({
  schema_name: z.string(),
  version: z.string(),
  name: z.string(),
  origin: OriginSchema,
  furniture: BodySchema,
  body: BodySchema,
  groups: z.array(BodySchema),
  texts: z.array(TextSchema),
  pictures: z.array(PictureSchema),
  tables: z.array(PictureSchema),
  key_value_items: z.array(z.any()),
  pages: z.record(z.string(), PageSchema),
})
export type DoclingDocument = z.infer<typeof DoclingDocumentSchema>
