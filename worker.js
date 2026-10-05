const ANALYZE_SYSTEM_PROMPT = `你是一位资深的计算机科学教授，同时也是一位精通语言学和文学的学者。你的学生是一位英语老师，她使用AI工具（如OpenDevin/Claude）生成了一个项目代码，但她看不懂代码的结构和逻辑。
你的任务是：阅读并分析她上传的项目代码，为她编写一份"交互式学术教材（Study Guide）"。

你的核心教学理念（借鉴自 codebase-to-course）：
1. **Show, Don't Tell（视觉化教学）**：尽量少用长篇大论（每段不超过3句话）。多用对比、列表、对话等形式。
2. **Metaphors First（类比优先）**：引入每个技术概念时，必须先用英语教学、语法、文学或学校管理相关的类比来解释。且**不要重复使用同一个类比**（例如不要所有东西都比作餐厅）。
3. **Code ↔ English Translations（代码翻译）**：解释代码时，不要只泛泛而谈。请精确提取一小段核心代码，并逐行用大白话翻译它的作用。
4. **Learn by Tracing（顺藤摸瓜）**：从用户最熟悉的一个操作（比如"点击保存按钮"）开始，追踪数据是如何在代码中流动的。
5. **Application Quizzes（实战测验）**：在每个章节末尾，提供1-2个"情景应用题"（例如："如果学生反馈页面加载很慢，你应该去哪个文件排查？"），而不是死记硬背的填空题。

为了实现交互式排版，请在 Markdown 中使用以下特殊标记（前端会将其渲染为特殊组件）：

- **代码翻译块**：
:::translation
\`\`\`javascript
// 这里放真实代码片段
\`\`\`
***
这里放对应的通俗易懂的英文/中文大白话翻译。
:::

- **组件对话（Group Chat）**（用来解释模块间如何通信）：
:::chat
前端(Student): 老师，我想提交作业（发送请求）。
后端(Teacher): 收到了，让我检查一下格式（数据验证）。
数据库(Archive): 好的，我已经把这份作业归档了（存入数据库）。
:::

- **术语解释（Glossary Tooltip）**：
遇到专业术语时，请使用这种格式：[专业术语]{这里写一句通俗的解释}。例如：[API]{就像是餐厅的服务员，负责把你的点单传达给厨房}。

请理清代码的模块结构、数据流向，并解释核心逻辑。最后，告诉她如果想修改某个具体功能，应该去哪个文件修改。

请以JSON数组的格式输出，包含4-6个章节（Chapters）。每个章节必须包含以下字段：
- id: 章节的英文ID（如 "architecture", "data-flow"）
- title: 章节标题（如 "第一章：项目架构（The Syllabus）"）
- description: 简短的章节描述
- content: 章节的详细内容，使用Markdown格式。在Markdown中，请务必使用上述的特殊标记（:::translation, :::chat, [术语]{解释}）来增强互动性。

请严格遵守JSON格式。注意：content字段中的换行请用\\n表示，双引号请用\\"转义。不要输出任何其他内容（不要使用\`\`\`json包裹，直接输出JSON数组）。`;

const CHAT_SYSTEM_PROMPT = `你是一个耐心、专业的AI编程导师。你的学生是一位英语老师，她正在学习如何读懂和修改AI生成的代码。

你的核心教学理念（借鉴自 codebase-to-course）：
1. **Show, Don't Tell（视觉化教学）**：尽量少用长篇大论（每段不超过3句话）。多用对比、列表、对话等形式。
2. **Metaphors First（类比优先）**：引入每个技术概念时，必须先用英语教学、语法、文学或学校管理相关的类比来解释。且**不要重复使用同一个类比**。
3. **Code ↔ English Translations（代码翻译）**：解释代码时，不要只泛泛而谈。请精确提取一小段核心代码，并逐行用大白话翻译它的作用。
4. **Learn by Tracing（顺藤摸瓜）**：从用户最熟悉的一个操作（比如"点击保存按钮"）开始，追踪数据是如何在代码中流动的。
5. **Application Quizzes（实战测验）**：在每个章节末尾，提供1-2个"情景应用题"，而不是死记硬背的填空题。

请使用 Markdown 格式输出。为了实现交互式排版，请使用以下特殊标记：

- **代码翻译块**：
:::translation
\`\`\`javascript
// 这里放真实代码片段
\`\`\`
***
这里放对应的通俗易懂的英文/中文大白话翻译。
:::

- **组件对话（Group Chat）**：
:::chat
前端(Student): 老师，我想提交作业（发送请求）。
后端(Teacher): 收到了，让我检查一下格式（数据验证）。
数据库(Archive): 好的，我已经把这份作业归档了（存入数据库）。
:::

- **术语解释（Glossary）**：
遇到专业术语时，请使用这种格式：[专业术语]{这里写一句通俗的解释}。`;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Free Model Studio quotas shown in the owner's console, earliest expiry first.
// Keep these dates explicit so an expired free quota is never used accidentally.
const FREE_MODELS = [
  { id: 'deepseek-v4-flash-0731', expiresAt: '2026-10-31T23:59:59+08:00', options: { enable_thinking: false } },
  { id: 'deepseek-v4-pro-0813', expiresAt: '2026-11-13T23:59:59+08:00', options: { enable_thinking: false } },
  { id: 'qwen3.8-27b', expiresAt: '2026-11-18T23:59:59+08:00', options: { enable_thinking: false } },
  { id: 'kimi-k3', expiresAt: '2026-11-18T23:59:59+08:00', options: { enable_thinking: false } },
  { id: 'glm-5.3', expiresAt: '2026-11-23T23:59:59+08:00', options: { reasoning_effort: 'low' } },
  { id: 'qwen3.8-flash', expiresAt: '2026-11-25T23:59:59+08:00', options: { enable_thinking: false } },
  { id: 'qwen3.8-max-0902', expiresAt: '2026-12-01T23:59:59+08:00', options: { enable_thinking: false } },
  { id: 'deepseek-v4.1-flash', expiresAt: '2026-12-13T23:59:59+08:00', options: { enable_thinking: false } },
];
const CHAT_TIMEOUT_MS = 45000;
const ANALYZE_TIMEOUT_MS = 120000;

async function readStreamContent(response) {
  if (!response.body) throw new Error('模型没有返回数据流');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let content = '';
  let done = false;
  try {
    while (!done) {
      const next = await reader.read();
      buffer += decoder.decode(next.value || new Uint8Array(), { stream: !next.done });
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (!line.startsWith('data:')) continue;
        const data = line.slice(5).trim();
        if (data === '[DONE]') { done = true; break; }
        if (!data) continue;
        const part = JSON.parse(data);
        if (part.error) throw new Error(part.error.code || '模型返回错误');
        const delta = part.choices?.[0]?.delta?.content;
        if (typeof delta === 'string') content += delta;
      }
      if (next.done) break;
    }
  } finally {
    await reader.cancel().catch(() => {});
  }
  if (!done || !content.trim()) throw new Error('模型输出不完整');
  return content;
}

function parseChapters(content) {
  const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  let chapters;
  try {
    chapters = JSON.parse(jsonStr);
  } catch {
    const match = jsonStr.match(/\[[\s\S]*\]/);
    if (!match) throw new Error('模型返回的章节格式有误');
    chapters = JSON.parse(match[0]);
  }
  if (!Array.isArray(chapters) || chapters.length === 0 ||
      !chapters.every(ch => ch && typeof ch.title === 'string' && typeof ch.content === 'string')) {
    throw new Error('模型返回的章节内容不完整');
  }
  return chapters;
}

async function callQwen(apiKey, messages, { analyze = false } = {}) {
  const availableModels = FREE_MODELS.filter(model => Date.now() <= Date.parse(model.expiresAt));
  if (availableModels.length === 0) {
    throw new Error('免费模型额度均已过期，请更新模型列表。');
  }

  let lastError;
  for (const model of availableModels) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), analyze ? ANALYZE_TIMEOUT_MS : CHAT_TIMEOUT_MS);
    try {
      const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model: model.id, messages, ...model.options, stream: analyze }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const content = analyze
        ? await readStreamContent(response)
        : (await response.json())?.choices?.[0]?.message?.content;
      if (typeof content !== 'string' || !content.trim()) throw new Error('模型返回了空内容');
      return analyze ? parseChapters(content) : content;
    } catch (error) {
      lastError = error;
      // Provider response bodies may contain user material; log only the model and failure code.
      console.warn(`模型 ${model.id} 调用失败，尝试下一个:`, error?.message || error);
    } finally {
      clearTimeout(timeout);
    }
  }
  throw new Error(`所有可用免费模型均调用失败。最后错误：${lastError?.message || '未知错误'}`);
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    const url = new URL(request.url);
    const apiKey = env.QWEN_API_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'QWEN_API_KEY not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      });
    }

    try {
      if (url.pathname === '/api/analyze') {
        const { files } = await request.json();
        const fileContext = files.map(f => `--- ${f.path} ---\n${f.content}`).join('\n\n');

        const chapters = await callQwen(apiKey, [
          { role: 'user', content: ANALYZE_SYSTEM_PROMPT + '\n\n请输出四个章节，每章 content 控制在约 200 至 350 个汉字；保留代码翻译、组件对话、术语解释和一道应用题。务必输出完整有效的 JSON 数组。\n\n以下是项目代码：\n' + fileContext },
        ], { analyze: true });

        return new Response(JSON.stringify({ chapters }), {
          headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
        });
      }

      if (url.pathname === '/api/chat') {
        const { messages, files } = await request.json();

        let systemPrompt = CHAT_SYSTEM_PROMPT;
        if (files && files.length > 0) {
          const fileContext = files.map(f => `--- ${f.path} ---\n${f.content}`).join('\n\n');
          systemPrompt += `\n\n以下是学生当前正在学习的项目代码，请基于这些代码回答她的问题：\n${fileContext}`;
        }

        const text = await callQwen(apiKey, [
          { role: 'system', content: systemPrompt },
          ...messages,
        ]);

        return new Response(JSON.stringify({ text }), {
          headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
        });
      }

      return new Response('Not Found', { status: 404, headers: CORS_HEADERS });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      });
    }
  },
};
