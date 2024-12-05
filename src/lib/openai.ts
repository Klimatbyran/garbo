import { assert } from 'console'
import OpenAI from 'openai'
import { ChatCompletionMessageParam } from 'openai/resources'
import openaiConfig from '../config/openai'

const openai = new OpenAI({
  apiKey: openaiConfig.apiKey,
})

const ask = async (messages: ChatCompletionMessageParam[], options?: any) => {
  const response = await openai.chat.completions.create({
    messages: messages.filter((m) => m.content),
    model: 'gpt-4o',
    temperature: 0.1,
    stream: false,
    ...options,
  })

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

const askStream = async (
  messages: ChatCompletionMessageParam[],
  // TODO: Improve type for options to match OpenAI
  // options?: OpenAI.RequestOptions & {
  //   onParagraph?: (response: string, paragraph: string) => void
  // }
  options: any
) => {
  const { onParagraph, ...openAIOptions } = options
  const stream = await openai.chat.completions.create({
    messages: messages.filter((m) => m.content),
    model: 'gpt-4o-2024-08-06',
    temperature: 0.1,
    stream: true,
    max_tokens: 4096,
    response_format: {
      type: 'json_object',
    },
    ...openAIOptions,
  })

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

  return response
}

export { openai, ask, askPrompt, askStream }
