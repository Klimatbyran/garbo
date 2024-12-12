import { RequestHandler } from 'express'
import { ZodSchema } from 'zod'

// TODO: We need to improve the generic types here.
// Ideally we should to return the exact inferred schema, instead of turning everything into optional fields.
type RequestValidation<TParams, TQuery, TBody> = {
  params?: ZodSchema<TParams>
  query?: ZodSchema<TQuery>
  body?: ZodSchema<TBody>
}

export function validateRequest<
  Params = unknown,
  Query = unknown,
  Body = unknown
>({
  params,
  query,
  body,
}: RequestValidation<Params, Query, Body>): RequestHandler<
  Params,
  unknown,
  Body,
  Query
> {
  return (req, res, next) => {
    if (params) {
      params.parse(req.params)
    }

    if (query) {
      query.parse(req.query)
    }

    if (body) {
      body.parse(req.body)
    }

    return next()
  }
}

export function validateRequestBody<Body = unknown>(
  schema: ZodSchema<Body>
): RequestHandler<unknown, unknown, Body, unknown> {
  return validateRequest({ body: schema })
}

export function validateRequestParams<Params = unknown>(
  schema: ZodSchema<Params>
): RequestHandler<unknown, unknown, Params, unknown> {
  return validateRequest({ params: schema })
}

export function processRequest<
  Params = unknown,
  Query = unknown,
  Body = unknown
>({
  params,
  query,
  body,
}: RequestValidation<Params, Query, Body>): RequestHandler<
  Params,
  unknown,
  Body,
  Query
> {
  return (req, res, next) => {
    if (params) {
      req.params = params.parse(req.params)
    }

    if (query) {
      req.query = query.parse(req.query)
    }

    if (body) {
      req.body = body.parse(req.body)
    }

    return next()
  }
}

export function processRequestBody<Body = unknown>(
  schema: ZodSchema<Body>
): RequestHandler<unknown, unknown, Body, unknown> {
  return (req, res, next) => {
    try {
      // Handle undefined body or empty body
      if (!req.body || Object.keys(req.body).length === 0) {
        req.body = schema.parse({})
        return next()
      }

      // Check if body is wrapped in a 'data' field unnecessarily
      const bodyToValidate = req.body.data && Object.keys(req.body).length === 1 
        ? req.body.data 
        : req.body

      req.body = schema.parse(bodyToValidate)
      return next()
    } catch (error) {
      next(error)
    }
  }
}

export function processRequestParams<Params = unknown>(
  schema: ZodSchema<Params>
): RequestHandler<unknown, unknown, Params, unknown> {
  return processRequest({ params: schema })
}
