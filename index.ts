// 导入依赖
import ollama from 'ollama'

const user_input = await console[Symbol.asyncIterator]()

while (true) {
    // 处理用户输入
    process.stdout.write('\nyou: ')
    const { value, done } = await user_input.next()

    // 调用模型
    const response = await ollama.chat({
        model: 'qwen3.5:2b',
        messages: [{ role: 'user', content: (value as string).trim() }],
    })

    // 打印模型回复
    console.log(`llm: ${response.message.content}`)
}
