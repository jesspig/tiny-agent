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

you: 1+1=？
llm: 1+1=2

you: 2+2=？
llm: 2+2=4

you:
```
