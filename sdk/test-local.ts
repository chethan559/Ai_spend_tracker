import { AISpendTracker } from './src/index'

const tracker = new AISpendTracker('ast_5083b5ac-7f40-4805-b951-966d727f8cf1', {
  endpoint: 'http://localhost:3001'
})

tracker.initOpenAI(process.env.OPENAI_API_KEY!)

async function test() {
  console.log('Making tracked API call...')

  const result = await tracker.openai.chat({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: 'Say hello in 5 words' }],
  }, {
    metadata: {
      feature: 'sdk-test',
      userId: 'test-user',
      environment: 'development'
    }
  }) as { choices: { message: { content: string } }[] }

  console.log('Response:', result.choices[0].message.content)
  console.log('Check your dashboard — a new event should appear!')
}

test().catch(console.error)
