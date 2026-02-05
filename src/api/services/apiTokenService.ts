import { prisma } from '../../lib/prisma'
import { ApiToken } from '@prisma/client'
import { randomBytes } from 'node:crypto'

class ApiTokenService {
  /**
   * Generate a secure random token
   */
  private generateToken(): string {
    return randomBytes(32).toString('hex')
  }

  /**
   * Create a new API token
   */
  async createToken(
    name: string,
    permissions: string[],
    expiresAt?: Date,
  ): Promise<{ token: string; apiToken: ApiToken }> {
    const token = this.generateToken()
    const apiToken = await prisma.apiToken.create({
      data: {
        token,
        name,
        permissions,
        expiresAt,
        active: true,
      },
    })

    return { token, apiToken }
  }

  /**
   * Verify and get API token by token string
   */
  async verifyToken(token: string): Promise<ApiToken | null> {
    const apiToken = await prisma.apiToken.findUnique({
      where: { token },
    })

    if (!apiToken) {
      return null
    }

    // Check if token is active
    if (!apiToken.active) {
      return null
    }

    // Check if token has expired
    if (apiToken.expiresAt && apiToken.expiresAt < new Date()) {
      return null
    }

    return apiToken
  }

  /**
   * Check if a token has permission to access a given endpoint
   * @param permissions Array of permission strings (e.g., ["companies", "municipalities"])
   * @param endpointPath The endpoint path (e.g., "/api/companies" or "/api/companies/123")
   */
  hasPermission(permissions: string[], endpointPath: string): boolean {
    // Normalize the path - remove leading/trailing slashes and convert to lowercase
    const normalizedPath = endpointPath.toLowerCase().replace(/^\/|\/$/g, '')
    
    // Check if any permission matches the endpoint
    // A permission "companies" should match "/api/companies" and "/api/companies/*"
    return permissions.some((permission) => {
      const normalizedPermission = permission.toLowerCase()
      // Check if the path starts with the permission (e.g., "api/companies" starts with "companies")
      // Or if the permission is exactly "api/companies" and the path starts with it
      return (
        normalizedPath.startsWith(`api/${normalizedPermission}`) ||
        normalizedPath === `api/${normalizedPermission}` ||
        normalizedPath.startsWith(normalizedPermission)
      )
    })
  }

  /**
   * Get all API tokens
   */
  async getAllTokens(): Promise<ApiToken[]> {
    return prisma.apiToken.findMany({
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * Get API token by ID
   */
  async getTokenById(id: string): Promise<ApiToken | null> {
    return prisma.apiToken.findUnique({
      where: { id },
    })
  }

  /**
   * Update API token
   */
  async updateToken(
    id: string,
    data: {
      name?: string
      permissions?: string[]
      expiresAt?: Date | null
      active?: boolean
    },
  ): Promise<ApiToken> {
    return prisma.apiToken.update({
      where: { id },
      data,
    })
  }

  /**
   * Delete API token
   */
  async deleteToken(id: string): Promise<void> {
    await prisma.apiToken.delete({
      where: { id },
    })
  }
}

export const apiTokenService = new ApiTokenService()
