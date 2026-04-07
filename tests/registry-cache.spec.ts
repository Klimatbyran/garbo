import {
  invalidateRegistryCache,
  REGISTRY_DATA_KEY,
  REGISTRY_ETAG_KEY,
} from '../src/api/services/registryCache'
import { jest } from '@jest/globals'

type DeleteFn = (key: string) => Promise<void>
type WarnFn = (msg: string, ...args: unknown[]) => void

describe('invalidateRegistryCache', () => {
  test('deletes both registry:data and registry:etag', async () => {
    const mockDelete: jest.MockedFunction<DeleteFn> = jest
      .fn<DeleteFn>()
      .mockResolvedValue(undefined)

    await invalidateRegistryCache({ delete: mockDelete })

    expect(mockDelete).toHaveBeenCalledWith(REGISTRY_DATA_KEY)
    expect(mockDelete).toHaveBeenCalledWith(REGISTRY_ETAG_KEY)
    expect(mockDelete).toHaveBeenCalledTimes(2)
  })

  test('does not throw when all deletions fail', async () => {
    const mockDelete: jest.MockedFunction<DeleteFn> = jest
      .fn<DeleteFn>()
      .mockRejectedValue(new Error('Redis down'))

    await expect(
      invalidateRegistryCache({ delete: mockDelete })
    ).resolves.toBeUndefined()
  })

  test('does not throw when one deletion fails', async () => {
    const mockDelete: jest.MockedFunction<DeleteFn> = jest
      .fn<DeleteFn>()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('Redis timeout'))

    await expect(
      invalidateRegistryCache({ delete: mockDelete })
    ).resolves.toBeUndefined()
  })

  test('logs a warning for each failed deletion', async () => {
    const mockDelete: jest.MockedFunction<DeleteFn> = jest
      .fn<DeleteFn>()
      .mockRejectedValue(new Error('Redis down'))
    const mockWarn: jest.MockedFunction<WarnFn> = jest.fn<WarnFn>()

    await invalidateRegistryCache({ delete: mockDelete }, { warn: mockWarn })

    // Two keys → two failures → two warnings
    expect(mockWarn).toHaveBeenCalledTimes(2)
    expect(mockWarn).toHaveBeenCalledWith(
      expect.stringContaining('Failed to invalidate registry cache'),
      expect.any(Error)
    )
  })

  test('does not log when all deletions succeed', async () => {
    const mockDelete: jest.MockedFunction<DeleteFn> = jest
      .fn<DeleteFn>()
      .mockResolvedValue(undefined)
    const mockWarn: jest.MockedFunction<WarnFn> = jest.fn<WarnFn>()

    await invalidateRegistryCache({ delete: mockDelete }, { warn: mockWarn })

    expect(mockWarn).not.toHaveBeenCalled()
  })

  test('still deletes both keys even when the first one fails', async () => {
    const mockDelete: jest.MockedFunction<DeleteFn> = jest
      .fn<DeleteFn>()
      .mockRejectedValueOnce(new Error('Redis timeout'))
      .mockResolvedValueOnce(undefined)

    await invalidateRegistryCache({ delete: mockDelete })

    // Promise.allSettled — both are always attempted
    expect(mockDelete).toHaveBeenCalledTimes(2)
  })
})
