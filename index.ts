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
shell: <observation>/workspaces/mini-agent</observation>
assistant: <answer>当前目录所在路径为：/workspaces/mini-agent</answer>
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
