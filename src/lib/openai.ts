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

/** Default chat model. Luna rejects `temperature` at its default reasoning effort. */
export const PRIMARY_CHAT_MODEL = 'gpt-6-luna'

const FALLBACK_TEMPERATURE = 0.1
const MAX_COMPLETION_TOKENS = 16384

const openai = new OpenAI({
  apiKey: openaiConfig.apiKey,
})

/**
 * Luna (and other GPT-6 reasoning models at non-`none` effort) reject
 * `temperature`. Older chat models still take it; send 0.1 only for those.
 */
const samplingFor = (model: string): { temperature?: number } =>
  model === PRIMARY_CHAT_MODEL ? {} : { temperature: FALLBACK_TEMPERATURE }

const ask = async (
  messages: ChatCompletionMessageParam[],
  options?: RequestOptions & { response_format?: ResponseFormatJSONSchema }
) => {
  const response = await openai.chat.completions.create({
    messages: messages.filter((m) => m.content),
    model: PRIMARY_CHAT_MODEL,
    max_completion_tokens: MAX_COMPLETION_TOKENS,
    ...samplingFor(PRIMARY_CHAT_MODEL),
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

  const base = {
    messages: messages.filter((m) => m.content),
    stream: true as const,
    max_completion_tokens: MAX_COMPLETION_TOKENS,
    response_format: options.response_format,
    ...safeOpenAIOptions,
  }

  // Only the request is retried: a context-window error comes back before any
  // chunk is streamed, so onParagraph has not been called yet.
  const { result: stream, model } = await withContextWindowFallback<
    Stream<ChatCompletionChunk>
  >(
    (model) =>
      openai.chat.completions.create({
        ...base,
        model,
        ...samplingFor(model),
      } satisfies ChatCompletionCreateParamsStreaming),
    PRIMARY_CHAT_MODEL,
    openaiConfig.contextFallbackModel,
    (error) =>
      console.warn(
        `askStream: input too long for ${PRIMARY_CHAT_MODEL}, retrying once on ${openaiConfig.contextFallbackModel}:`,
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
