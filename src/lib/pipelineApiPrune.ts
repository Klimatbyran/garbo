import pipelineApiConfig from '../config/pipelineApi'

type PruneRunsRequest = {
  companyName?: string
  threadId?: string
}

/**
 * Fire-and-forget Redis run pruning via pipeline-api.
 * Never throws — failures are logged only.
 */
export function requestPipelineRunPrune(payload: PruneRunsRequest): void {
  const baseUrl = pipelineApiConfig.baseUrl
  const token = pipelineApiConfig.internalServiceToken

  if (!baseUrl || !token) {
    return
  }

  const url = `${baseUrl}/api/internal/prune-runs`
  void fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-internal-service-token': token,
    },
    body: JSON.stringify({
      companyName: payload.companyName,
      threadId: payload.threadId,
    }),
  })
    .then(async (response) => {
      if (!response.ok) {
        const text = await response.text().catch(() => '')
        console.error('[pipelineApiPrune] prune request failed', {
          status: response.status,
          body: text,
        })
      }
    })
    .catch((error) => {
      console.error('[pipelineApiPrune] prune request error', error)
    })
}
