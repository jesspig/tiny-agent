# tiny-agent

通过 5 个渐进式步骤，从零构建一个能够执行命令的 ReAct Agent

## 项目概述

本项目演示了如何基于 ReAct（Reasoning + Acting）模式构建一个命令行 Agent，这个 Agent 能够理解用户任务、通过 XML 标签与外界交互、执行系统命令并返回最终结果

| 特性 | 说明 |
| ------ | ------ |
| **技术栈** | Bun + TypeScript + OpenAI SDK |
| **模型接口** | Ollama（本地部署，兼容 OpenAI API） |
| **运行方式** | 命令行交互 |
| **架构模式** | ReAct 循环 |

## 前提条件

- **Bun** v1.0+ ([安装指南](https://bun.sh))
- **Ollama** ([安装指南](https://ollama.com))
- **Ollama 模型** qwen3.5:2b

```bash
# 安装依赖
bun install

# 拉取模型
ollama pull qwen3.5:2b

# 启动 Ollama 服务（后台运行）
ollama serve
```

## 项目结构

```plaintext
mini-agent/
├── index.ts          # 唯一入口文件，完整 Agent 实现
├── package.json      # 依赖配置
└── tsconfig.json     # TypeScript 配置
```

## 快速开始

```bash
bun run ./index.ts
```

---

## Step 1: 调用模型

创建 `index.ts`，验证模型连接是否正常

```ts
import OpenAI from 'openai'

const client = new OpenAI({
    baseURL: 'http://127.0.0.1:11434/v1',
    apiKey: 'ollama',
})

const response = await client.chat.completions.create({
    model: 'qwen3.5:2b',
    messages: [{ role: 'user', content: '你好' }],
})

console.log(response.choices[0]?.message.content)
```

**运行结果：**

```plaintext
你好！有什么我可以帮你的吗？比如需要信息查询、写作帮助，还是其他需求？😊
```

---

## Step 2: 处理用户输入

添加交互式输入循环，支持持续对话

```ts
import OpenAI from 'openai'

const client = new OpenAI({
    baseURL: 'http://127.0.0.1:11434/v1',
    apiKey: 'ollama',
})

const user_input = await console[Symbol.asyncIterator]()

while (true) {
    process.stdout.write('\nyou: ')
    const { value } = await user_input.next()

    const response = await client.chat.completions.create({
        model: 'qwen3.5:2b',
        messages: [{ role: 'user', content: value.trim() }],
    })

    console.log(`llm: ${response.choices[0]?.message.content}`)
}
```

**运行结果：**

```plaintext
you: 你好
你好！很高兴为你服务。有什么我可以帮助你的吗？或者你有其他问题想问？
```

---

## Step 3: 保存对话历史

引入 `messages` 数组保存对话上下文，实现多轮对话

```ts
import OpenAI from 'openai'
import type { ChatCompletionMessageParam } from 'openai/resources'

const client = new OpenAI({
    baseURL: 'http://127.0.0.1:11434/v1',
    apiKey: 'ollama',
})

const user_input = await console[Symbol.asyncIterator]()
const messages: ChatCompletionMessageParam[] = []

while (true) {
    process.stdout.write('\nyou: ')
    const { value } = await user_input.next()

    messages.push({ role: 'user', content: value.trim() })

    const response = await client.chat.completions.create({
        model: 'qwen3.5:2b',
        messages: messages,
        reasoning_effort: 'low',
    })

    const content = response.choices[0]?.message.content ?? ''
    messages.push({ role: 'assistant', content })

    console.log(`llm: ${content}`)
}
```

**运行结果：**

测试多轮对话的上下文保持

```plaintext
you: 1+1=？
llm: $1+1=2$

you: 再+1
llm: $2 + 1 = 3$所以结果是：**3**。
```

---

## Step 4: 实现 ReAct 循环

完成 Agent 构建，通过系统提示词定义 Agent 行为规则，支持执行系统命令

```ts
import { $ } from 'bun'
import OpenAI from 'openai'
import type { ChatCompletionMessageParam } from 'openai/resources'

const client = new OpenAI({
    baseURL: 'http://127.0.0.1:11434/v1',
    apiKey: 'ollama',
})

const user_input = await console[Symbol.asyncIterator]()
const messages: ChatCompletionMessageParam[] = []

messages.push({
    role: 'system',
    content: `你的目标是完成用户的任务，你必须选择以下的其中一个XML格式进行回复，**一次且仅能输出一个标签**：
- <thought>思考内容</thought>: 先思考要做什么
- <command>命令内容</command>: 需要执行系统命令时输出
- <observation>系统返回结果</observation>: 系统返回的结果，不能自己生成
- <answer>总结内容</answer>: 任务完成时输出总结

重要规则：
1. 每次只能输出一个标签
2. 执行任何命令前，必须先输出 <thought> 标签
3. 禁止自己生成 <observation> 标签

示例：
user: <task>查看当前目录</task>
assistant: <thought>我需要查看当前目录路径</thought>
assistant: <command>pwd</command>`,
})

while (true) {
    process.stdout.write('\nyou: ')
    const { value } = await user_input.next()

    messages.push({ role: 'user', content: `<task>${value.trim()}</task>` })

    console.log('\n------- ReAct Start -------')

    while (true) {
        const response = await client.chat.completions.create({
            model: 'qwen3.5:2b',
            messages: messages,
            reasoning_effort: 'low',
        })

        const content = response.choices[0]?.message.content ?? ''
        messages.push({ role: 'assistant', content })

        const thought = content.match(/<thought>([\s\S]*?)<\/thought>/)?.[1]?.trim()
        const command = content.match(/<command>([\s\S]*?)<\/command>/)?.[1]?.trim()
        const answer = content.match(/<answer>([\s\S]*?)<\/answer>/)?.[1]?.trim()

        if (thought) {
            console.log(`thought:> ${thought}`)
            continue
        }

        if (command) {
            console.log(`command:> ${command}`)
            try {
                const result = await $`bash -c ${command}`.text()
                messages.push({ role: 'user', content: `<observation>${result}</observation>` })
                console.log(`observation:> ${result}`)
            } catch (error) {
                messages.push({ role: 'user', content: `<observation>${error}</observation>` })
                console.log(`observation:> ${error}`)
            }
            continue
        }

        if (answer) {
            console.log('\n------- ReAct End -------')
            console.log(`answer:> ${answer}`)
            break
        }
    }
}
```

**运行结果：**

~~~plaintext
you: 帮我创建一个 hello.txt 文件并写入 hello world

------- ReAct Start -------
command:> echo "Hello World" > hello.txt
observation:> 

------- ReAct End -------
answer:> 已成功创建 hello.txt 文件，其中包含以下内容：
```
Hello World
```
文件路径为：hello.txt
~~~
