import openAPIConfig from '../config/openapi'

/**
 * Format valid OpenAPI tags as an array.
 */
export function getTags(...tags: (keyof typeof openAPIConfig.tags)[]) {
  return tags
}
