# tiny-agent

逐步构建一个简单的 Agent

## Step 0: 安装依赖

```bash
bun add ollama
```

## Step 1: 调用模型

首先编写一个简单的代码片段，调用模型并打印回复。

<details>
<summary>点击这里展开查看代码</summary>

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

</details>

## Step 2: 处理用户输入

改造代码，添加用户输入处理逻辑

<details>
<summary>点击这里展开查看代码</summary>

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

</details>

## Step 3: 保存对话历史

改造代码，添加对话历史保存逻辑

<details>
<summary>点击这里展开查看代码</summary>

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

</details>

## Step 4: 增加思考模式

继续改造代码，增加 ReAct (Reasoning + Acting) 循环

<details>
<summary>点击这里展开查看代码</summary>

```ts
// 导入依赖
import { $ } from 'bun'
import ollama, { type ChatResponse } from 'ollama'

const user_input = await console[Symbol.asyncIterator]()
const messages = [] // 存储用户输入和模型回复

// 添加系统提示
messages.push({
    role: 'system', content: `你的目标是完成用户的任务。你必须选择以下的其中一个XML格式进行回复，**一次且仅能输出一个标签**：
- <thought>思考内容</thought>: 先思考要做什么
- <command>命令内容</command>: 需要执行系统命令时输出，内容为纯命令（例如 "echo hello"）
- <observation>系统返回结果</observation>: 系统返回的结果，不能自己生成
- <answer>总结内容</answer>: 任务完成时输出总结

重要规则：
1. **每次只能输出一个标签，严禁在同一回复中包含多个标签。**
2. 执行任何命令前，必须先输出 <thought> 标签思考要做什么。
3. 如果你认为需要执行命令，则必须输出 <command> 标签
4. 禁止自己生成 <observation> 标签，这是系统返回的结果。
5. 如果任务已完成，输出 <answer> 标签总结结果。

示例：
user: <task>查看当前目录所在路径</task>
assistant: <thought>我需要查看当前目录所在路径</thought>
assistant: <command>pwd</command>
shell: <observation>/workspaces/tiny-agent</observation>
assistant: <answer>当前目录所在路径为：/workspaces/tiny-agent</answer>
`
})

while (true) {
    // 获取用户输入
    process.stdout.write('\nyou: ')
    const { value }: { value: string } = await user_input.next()

    // 将用户输入的任务添加到消息列表
    messages.push({ role: 'user', content: `<task>${value.trim()}</task>` })

    // 开始 ReAct 循环
    console.log('\n-------ReAct Start-------')
    while (true) {
        // 调用模型
        const response: ChatResponse = await ollama.chat({
            model: 'qwen3.5:2b',
            messages: messages,
            think: false, // 禁用思考模式
        })

        // 将模型回复添加到消息列表
        const content = response.message.content
        messages.push({ role: 'assistant', content: content })

        const thought = content.match(/<thought>([\s\S]*?)<\/thought>/)?.[1]?.trim() // 提取思考内容
        const command = content.match(/<command>([\s\S]*?)<\/command>/)?.[1]?.trim() // 提取命令
        const answer = content.match(/<answer>([\s\S]*?)<\/answer>/)?.[1]?.trim() // 提取总结

        // 思考要做什么
        if (thought) {
            console.log(`thought:> ${thought}`)
            continue // 有思考内容时，继续循环让模型基于思考内容继续回复
        }

        // 执行命令
        if (command) {
            console.log(`command:> ${command}`) // 打印命令
            try {
                const result = await $`bash -c ${command}`.text()
                messages.push({ role: 'user', content: `<observation>${result}</observation>` }) // 将执行结果添加到消息列表
                console.log(`observation:> ${result}`) // 打印执行结果
            } catch (error) {
                messages.push({ role: 'user', content: `<observation>命令执行失败：${error}</observation>` })
                console.log(`observation:> ${error}`) // 打印执行失败信息
            }
            continue // 有命令执行时，继续循环让模型根据 observation 决定下一步
        }

        // 总结任务
        if (answer) {
            console.log('\n-------ReAct End-------')
            console.log(`answer:> ${answer}`)
            break
        }
    }

}
```
启动脚本

```bash
bun run ./index.ts
```

测试 ReAct 循环是否成功执行任务

~~~bash
you: 帮我创建一个 hello.txt 文件并写入 hello world

-------ReAct Start-------
command:> echo "Hello World" > hello.txt
observation:> 

-------ReAct End-------
answer:> 已成功创建 hello.txt 文件，其中包含以下内容：
```
Hello World
```
文件路径为：hello.txt
~~~

</details>
