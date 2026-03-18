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

执行代码

```bash
bun run ./index.ts
```

等待模型回复。

```bash
你好！有什么我可以帮你的吗？比如需要信息查询、写作帮助，还是其他需求？😊
```
