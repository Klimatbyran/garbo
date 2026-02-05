# Testing API Tokens Locally

This guide will help you test the API token authentication system locally.

## Prerequisites

1. **Database is running**: Make sure Docker containers are up
   ```bash
   docker-compose up
   ```

2. **Run the migration**: Apply the database migration to create the `ApiToken` table
   ```bash
   npm run prisma migrate dev
   ```

3. **Start the API server**:
   ```bash
   npm run dev-api
   ```
   The API will be available at `http://localhost:3000`

## Step 1: Get an Authentication Token

To create API tokens, you first need to authenticate. You have two options:

### Option A: GitHub OAuth (for users)

1. Visit: `http://localhost:3000/api/auth/github`
2. Complete the GitHub OAuth flow
3. You'll receive a JWT token in the response

### Option B: Service Authentication (for bots/scripts)

Service authentication uses the `API_SECRET` from your `.env` file. You can set this to any value when running locally.

1. **Check your `.env` file** - Make sure `API_SECRET` is set (it can be any string):
   ```bash
   # In your .env file:
   API_SECRET=my-local-secret-123
   ```

2. **Authenticate using the service endpoint**:
   ```bash
   curl -X POST http://localhost:3000/api/auth/token \
     -H "Content-Type: application/json" \
     -d '{
       "client_id": "test-client",
       "client_secret": "my-local-secret-123"
     }'
   ```

   **Important**: Replace `"my-local-secret-123"` with the value from your `.env` file's `API_SECRET`.

   The `client_id` can be any string - it will be used as the username for the created user.

3. **Response**: You'll receive a JWT token:
   ```json
   {
     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   }
   ```

   **Save this token** - you'll use it to create API tokens in the next step.

## Step 2: Create API Tokens

Now you can create API tokens with different permissions. Replace `YOUR_JWT_TOKEN` with the token from Step 1.

### Create Token XXX (companies + municipalities access)

```bash
curl -X POST http://localhost:3000/api/api-tokens \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Full Access Token",
    "permissions": ["companies", "municipalities"]
  }'
```

**Save the `token` value from the response** - this is the API token you'll use for requests.

### Create Token YXX (companies only)

```bash
curl -X POST http://localhost:3000/api/api-tokens \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Companies Only Token",
    "permissions": ["companies"]
  }'
```

**Save this token value too.**

## Step 3: Test Token Permissions

### Test Token XXX (should work for both companies and municipalities)

#### ✅ Should succeed - Companies endpoint
```bash
curl -X GET http://localhost:3000/api/companies \
  -H "Authorization: Bearer TOKEN_XXX"
```

#### ✅ Should succeed - Municipalities endpoint
```bash
curl -X GET http://localhost:3000/api/municipalities \
  -H "Authorization: Bearer TOKEN_XXX"
```

### Test Token YXX (should only work for companies)

#### ✅ Should succeed - Companies endpoint
```bash
curl -X GET http://localhost:3000/api/companies \
  -H "Authorization: Bearer TOKEN_YXX"
```

#### ❌ Should fail (403 Forbidden) - Municipalities endpoint
```bash
curl -X GET http://localhost:3000/api/municipalities \
  -H "Authorization: Bearer TOKEN_YXX"
```

Expected response:
```json
{
  "message": "Forbidden - Insufficient permissions"
}
```

### Test without token (should fail)

#### ❌ Should fail (401 Unauthorized)
```bash
curl -X GET http://localhost:3000/api/companies
```

Expected response:
```json
{
  "message": "Unauthorized"
}
```

## Step 4: Manage API Tokens

### List all tokens

```bash
curl -X GET http://localhost:3000/api/api-tokens \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get a specific token

```bash
curl -X GET http://localhost:3000/api/api-tokens/TOKEN_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Update a token (e.g., change permissions)

```bash
curl -X PATCH http://localhost:3000/api/api-tokens/TOKEN_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "permissions": ["companies", "municipalities", "regions"]
  }'
```

### Deactivate a token

```bash
curl -X PATCH http://localhost:3000/api/api-tokens/TOKEN_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "active": false
  }'
```

### Delete a token

```bash
curl -X DELETE http://localhost:3000/api/api-tokens/TOKEN_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Available Permission Values

Based on the API routes, here are the available permission values:

- `companies` - Access to `/api/companies/*`
- `municipalities` - Access to `/api/municipalities/*`
- `regions` - Access to `/api/regions/*`
- `nation` - Access to `/api/nation/*`
- `screenshots` - Access to `/api/screenshots/*`
- `newsletters` - Access to `/api/newsletters/*`
- `validation` - Access to `/api/validation/*`
- `emissions-assessment` - Access to `/api/emissions-assessment/*`
- `industry-gics` - Access to `/api/industry-gics/*`
- `reporting-period` - Access to `/api/reporting-period/*`

## Testing with Different HTTP Methods

The permission system works for all HTTP methods (GET, POST, PATCH, DELETE). Test with different methods:

```bash
# GET request
curl -X GET http://localhost:3000/api/companies \
  -H "Authorization: Bearer TOKEN_XXX"

# POST request (if you have write permissions)
curl -X POST http://localhost:3000/api/companies \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN_XXX" \
  -d '{...}'
```

## View API Documentation

Visit the OpenAPI documentation at:
```
http://localhost:3000/api
```

This will show all available endpoints, including the new API token management endpoints under the "API Tokens" tag.

## Troubleshooting

### "Unauthorized" error
- Make sure you're including the `Authorization: Bearer TOKEN` header
- Verify the token hasn't expired or been deactivated
- Check that the token is valid (not corrupted)

### "Forbidden - Insufficient permissions" error
- Verify the token has the required permission for the endpoint
- Check the permission value matches the endpoint prefix (e.g., `companies` for `/api/companies/*`)

### Token not found
- Make sure you saved the token value when creating it (it's only shown once)
- Check the token ID vs token value - use the token value (the long hex string) in the Authorization header

### Migration errors
- Make sure the database is running: `docker-compose up`
- Run migrations: `npm run prisma migrate dev`
- Generate Prisma client: `npx prisma generate`
