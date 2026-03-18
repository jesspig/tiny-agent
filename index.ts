// 导入依赖
import ollama from 'ollama'

// 调用模型
const response = await ollama.chat({
    model: 'qwen3.5:2b',
    messages: [{ role: 'user', content: '你好' }],
})

// 打印模型回复
console.log(response.message.content)