import { assert } from 'console'
import OpenAI from 'openai'
import type {
  ChatCompletionAssistantMessageParam,
  ChatCompletionChunk,
  ChatCompletionCreateParamsNonStreaming,
  ChatCompletionCreateParamsStreaming,
  ChatCompletionMessageParam,
  ChatCompletionSystemMessageParam,
  ChatCompletionUserMessageParam,
  ResponseFormatJSONSchema,
} from 'openai/resources'
import openaiConfig from '../config/openai'
import type { Stream } from 'openai/streaming'

type RequestOptions = OpenAI.RequestOptions

const openai = new OpenAI({
  apiKey: openaiConfig.apiKey,
})

const ask = async (
  messages: ChatCompletionMessageParam[],
  options?: RequestOptions & { response_format?: ResponseFormatJSONSchema }
) => {
  const response = await openai.chat.completions.create({
    messages: messages.filter((m) => m.content),
    model: 'gpt-4o',
    max_completion_tokens: 16384,
    temperature: 0.1,
    stream: false,
    ...options,
  } as ChatCompletionCreateParamsNonStreaming)

  return response.choices[0].message.content ?? ''
}

const askPrompt = async (prompt: string, context: string) => {
  assert(prompt, 'Prompt is required')
  assert(context, 'Context is required')
  return await ask([
    {
      role: 'system',
      content: 'You are a friendly expert. Be concise and accurate.',
    },
    { role: 'user', content: prompt },
    { role: 'assistant', content: 'Sure! Just send me the context?' },
    { role: 'user', content: context },
  ])
}

type AskStreamMessages = (
  | ChatCompletionSystemMessageParam
  | ChatCompletionUserMessageParam
  | ChatCompletionAssistantMessageParam
)[]

type AskStreamOptions = RequestOptions & {
  onParagraph?: (response: string, paragraph: string) => void
} & { response_format?: ResponseFormatJSONSchema }

/**
 * True when OpenAI rejected a request because the messages, plus room for the
 * requested completion, do not fit the model's context window. Duck-typed on
 * the SDK's `APIError` fields.
 */
const isContextWindowError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') return false
  const { status, code, message } = error as {
    status?: unknown
    code?: unknown
    message?: unknown
  }
  if (status !== 400) return false
  return (
    code === 'context_length_exceeded' ||
    (typeof message === 'string' && /maximum context length/i.test(message))
  )
}

/**
 * Runs `run` on the primary model. When that fails on the context window and a
 * different fallback model is set, runs it once more on the fallback model.
 * Any other error from the primary call is rethrown unchanged. If the input
 * does not fit the fallback either, the fallback's context-window error is
 * rethrown; any other fallback error is wrapped so the job's failure reason
 * says that the input was too long for the primary model.
 */
const withContextWindowFallback = async <T>(
  run: (model: string) => Promise<T>,
  primaryModel: string,
  fallbackModel: string | null,
  onFallback: (error: unknown) => void
): Promise<{ result: T; model: string }> => {
  try {
    return { result: await run(primaryModel), model: primaryModel }
  } catch (error) {
    if (
      !fallbackModel ||
      fallbackModel === primaryModel ||
      !isContextWindowError(error)
    ) {
      throw error
    }
    onFallback(error)
    try {
      return { result: await run(fallbackModel), model: fallbackModel }
    } catch (fallbackError) {
      if (isContextWindowError(fallbackError)) throw fallbackError
      const reason =
        fallbackError instanceof Error
          ? fallbackError.message
          : String(fallbackError)
      throw new Error(
        `Input too long for ${primaryModel}, and the retry on ${fallbackModel} failed: ${reason}`,
        { cause: fallbackError }
      )
    }
  }
}

/**
 * Same as `askStream`, but also returns the model that answered. When the
 * input is too long for the primary model, the call is retried once on
 * `openaiConfig.contextFallbackModel`.
 */
const askStreamWithModel = async (
  messages: AskStreamMessages,
  options: AskStreamOptions
): Promise<{ response: string; model: string }> => {
  const { stream: _, ...safeOpenAIOptions } = options

  const config = {
    messages: messages.filter((m) => m.content),
    model: 'gpt-4o-2024-08-06',
    temperature: 0.1,
    stream: true,
    max_tokens: 16384,
    response_format: options.response_format,
    ...safeOpenAIOptions,
  } satisfies ChatCompletionCreateParamsStreaming

  // Only the request is retried: a context-window error comes back before any
  // chunk is streamed, so onParagraph has not been called yet.
  const { result: stream, model } = await withContextWindowFallback<
    Stream<ChatCompletionChunk>
  >(
    (model) => openai.chat.completions.create({ ...config, model }),
    config.model,
    openaiConfig.contextFallbackModel,
    (error) =>
      console.warn(
        `askStream: input too long for ${config.model}, retrying once on ${openaiConfig.contextFallbackModel}:`,
        error instanceof Error ? error.message : error
      )
  )

  let response = ''
  let paragraph = ''
  for await (const part of stream) {
    const chunk = part.choices[0]?.delta?.content || ''
    response += chunk
    paragraph += chunk
    if (options?.onParagraph && chunk.includes('\n')) {
      options?.onParagraph(response, paragraph)
      paragraph = ''
    }
  }
  // send the rest if there is any
  if (options?.onParagraph && paragraph)
    options?.onParagraph(response, paragraph)

  return { response, model }
}

const askStream = async (
  messages: AskStreamMessages,
  options: AskStreamOptions
) => (await askStreamWithModel(messages, options)).response

export { openai, ask, askPrompt, askStream, askStreamWithModel }
