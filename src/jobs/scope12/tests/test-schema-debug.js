import { z } from "zod"
import { zodToJsonSchema } from "zod-to-json-schema"
import { createHash } from "crypto"

// Create dummy schemas similar to what you're using
const testSchema = z.object({
  scope12: z.array(z.object({
    year: z.number(),
    scope1: z.object({
      total: z.number(),
      unit: z.string()
    }),
    scope2: z.object({
      mb: z.number().nullable(),
      lb: z.number().nullable(),
      unknown: z.number().nullable(),
      unit: z.string()
    })
  }))
});

const simpleSchema = z.object({
  name: z.string(),
  age: z.number().optional()
});

// Hashing functions
const hashString = (str) => {
  return createHash('sha256').update(str).digest('hex').substring(0, 16);
};

const hashSchema = (schema) => hashString(JSON.stringify(schema._def));

// Schema serialization function
const serializeSchema = (sch) => {
  if (!sch || !sch._def) return sch;
  
  const def = sch._def;
  console.log('Processing schema with typeName:', def.typeName);
  console.log('Shape keys:', def.shape ? Object.keys(def.shape) : 'no shape');
  
  switch (def.typeName) {
    case 'ZodObject':
      const shape = {};
      for (const [key, value] of Object.entries(def.shape || {})) {
        console.log(`  Processing property: ${key}`);
        shape[key] = serializeSchema(value);
      }
      return { type: 'object', properties: shape };
    
    case 'ZodString':
      return { type: 'string' };
    
    case 'ZodNumber':
      return { type: 'number' };
    
    case 'ZodArray':
      return { type: 'array', items: serializeSchema(def.type) };
    
    case 'ZodOptional':
      return { ...serializeSchema(def.innerType), optional: true };
    
    case 'ZodNullable':
      return { ...serializeSchema(def.innerType), nullable: true };
    
    default:
      return { type: def.typeName };
  }
};

// Test using zodToJsonSchema
console.log('=== TEST SCHEMA WITH zodToJsonSchema ===');
console.log('Hash:', hashSchema(testSchema));
console.log('JSON Schema:', JSON.stringify(zodToJsonSchema(testSchema), null, 2));

console.log('\n=== SIMPLE SCHEMA WITH zodToJsonSchema ===');
console.log('Hash:', hashSchema(simpleSchema));
console.log('JSON Schema:', JSON.stringify(zodToJsonSchema(simpleSchema), null, 2));