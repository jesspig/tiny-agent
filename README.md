# mini-agent

逐步构建一个简单的 Agent

## Step 0: 安装依赖

```bash
bun add ollama
```

## Step 1: 调用模型

首先编写一个简单的代码片段，调用模型并打印回复。

```ts
// 导入依赖
import ollama from 'ollama'

// 调用模型
const response = await ollama.chat({
  model: 'qwen3.5:2b',
  messages: [{ role: 'user', content: '你好' }],
})

// 打印模型回复
console.log(response.message.content)
```

启动脚本

```bash
bun run ./index.ts
```

等待模型回复

```bash
你好！有什么我可以帮你的吗？比如需要信息查询、写作帮助，还是其他需求？😊
```

## Step 2: 处理用户输入

改造代码，添加用户输入处理逻辑

```ts
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
```

启动脚本

```bash
bun run ./index.ts
```

尝试输入一些问题

```bash
you: 你好
你好！很高兴为你服务。有什么我可以帮助你的吗？或者你有其他问题想问？
```

## Step 3: 保存对话历史

改造代码，添加对话历史保存逻辑

```ts
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
```

启动脚本

```bash
bun run ./index.ts
```

测试多轮对话的上下文保持

```bash
you: 1+1=？
llm: $1+1=2$

you: 再+1
llm: $2 + 1 = 3$所以结果是：**3**。
```
