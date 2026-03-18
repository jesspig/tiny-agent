// 导入依赖
import ollama, { type ChatResponse } from 'ollama'

const user_input = await console[Symbol.asyncIterator]()
const messages = [] // 存储用户输入和模型回复

while (true) {
    // 获取用户输入
    process.stdout.write('\nyou: ')
    const { value }: { value: string } = await user_input.next()

    // 将用户输入添加到消息列表
    messages.push({ role: 'user', content: value.trim() })

    // 调用模型
    const response: ChatResponse = await ollama.chat({
        model: 'qwen3.5:2b',
        messages: messages,
        think: false, // 禁用思考模式
    })

    const content = response.message.content
    // 将模型回复添加到消息列表
    messages.push({ role: 'assistant', content: content })

    // 打印模型回复
    console.log(`llm: ${content}`)
}
