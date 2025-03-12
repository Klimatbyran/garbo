// Import and re-export specific schemas to avoid conflicts
import { 
  wikidataIdSchema,
  wikidataIdParamSchema,
  garboEntityIdSchema,
  yearSchema,
  yearParamSchema,
  errorSchema,
  getErrorSchemas,
  emissionUnitSchemaGarbo,
  emissionUnitSchemaWithDefault
} from './common';

import {
  authenticationBodySchema,
  authenticationResponseSchema
} from './auth';

// Export everything explicitly to avoid star export conflicts
export {
  wikidataIdSchema,
  wikidataIdParamSchema,
  garboEntityIdSchema,
  yearSchema,
  yearParamSchema,
  errorSchema,
  getErrorSchemas,
  emissionUnitSchemaGarbo,
  emissionUnitSchemaWithDefault,
  authenticationBodySchema,
  authenticationResponseSchema
};

// Export other modules
export * from './request';
export * from './response';
