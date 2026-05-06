import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3456;

  app.use(express.json({ limit: '50mb' }));

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/analyze", async (req, res) => {
    try {
      const { files } = req.body;
      const apiKey = process.env.QWEN_API_KEY;
      
      if (!apiKey) {
        return res.status(500).json({ error: "QWEN_API_KEY is not configured in environment variables." });
      }

      // Format files for the prompt
      const fileContext = files.map((f: any) => `--- ${f.path} ---\n${f.content}`).join('\n\n');

      const prompt = `
你是一位资深的计算机科学教授，同时也是一位精通语言学和文学的学者。你的学生是一位英语老师，她使用AI工具（如OpenDevin/Claude）生成了一个项目代码，但她看不懂代码的结构和逻辑。
你的任务是：阅读并分析她上传的项目代码，为她编写一份“交互式学术教材（Study Guide）”。

你的核心教学理念（借鉴自 codebase-to-course）：
1. **Show, Don't Tell（视觉化教学）**：尽量少用长篇大论（每段不超过3句话）。多用对比、列表、对话等形式。
2. **Metaphors First（类比优先）**：引入每个技术概念时，必须先用英语教学、语法、文学或学校管理相关的类比来解释。且**不要重复使用同一个类比**（例如不要所有东西都比作餐厅）。
3. **Code ↔ English Translations（代码翻译）**：解释代码时，不要只泛泛而谈。请精确提取一小段核心代码，并逐行用大白话翻译它的作用。
4. **Learn by Tracing（顺藤摸瓜）**：从用户最熟悉的一个操作（比如“点击保存按钮”）开始，追踪数据是如何在代码中流动的。
5. **Application Quizzes（实战测验）**：在每个章节末尾，提供1-2个“情景应用题”（例如：“如果学生反馈页面加载很慢，你应该去哪个文件排查？”），而不是死记硬背的填空题。

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

以下是项目代码：
${fileContext}

请严格遵守JSON格式。注意：content字段中的换行请用\\n表示，双引号请用\\"转义。不要输出任何其他内容（不要使用\`\`\`json包裹，直接输出JSON数组）。
`;

      const response = await fetch("https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "qwen-plus",
          messages: [
            {
              role: "user",
              content: prompt
            }
          ]
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Qwen API error: ${errorData}`);
      }

      const data = await response.json();
      let jsonStr = data.choices[0].message.content;
      
      // Clean up markdown formatting if Qwen still adds it
      jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      // Try to parse, with fallback repair
      let chapters;
      try {
        chapters = JSON.parse(jsonStr);
      } catch (parseErr) {
        console.error("JSON parse failed, attempting repair...");
        // Common fixes: unescaped newlines in strings, trailing commas
        let repaired = jsonStr
          .replace(/\n/g, '\\n')           // escape literal newlines
          .replace(/\r/g, '\\r')           // escape carriage returns
          .replace(/\t/g, '\\t')           // escape tabs
          .replace(/,\s*([}\]])/g, '$1');  // remove trailing commas
        
        try {
          chapters = JSON.parse(repaired);
        } catch (e2) {
          // Last resort: try to extract JSON array from the response
          const arrayMatch = jsonStr.match(/\[[\s\S]*\]/);
          if (arrayMatch) {
            try {
              // Re-escape within the extracted array
              let extracted = arrayMatch[0];
              chapters = JSON.parse(extracted);
            } catch (e3) {
              console.error("All JSON repair attempts failed");
              console.error("Raw response (first 2000 chars):", jsonStr.slice(0, 2000));
              throw new Error("AI 返回的内容格式有误，请重试。如果问题持续，尝试上传更小的项目。");
            }
          } else {
            throw new Error("AI 返回的内容不是有效的 JSON 数组，请重试。");
          }
        }
      }
      
      res.json({ chapters });
    } catch (error: any) {
      console.error("Analyze API Error:", error);
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });

  app.post("/api/chat", async (req, res) => {
    try {
      const { messages, files } = req.body;
      const apiKey = process.env.QWEN_API_KEY;
      
      if (!apiKey) {
        return res.status(500).json({ error: "QWEN_API_KEY is not configured in environment variables." });
      }

      let systemPrompt = `你是一个耐心、专业的AI编程导师。你的学生是一位英语老师，她正在学习如何读懂和修改AI生成的代码。

你的核心教学理念（借鉴自 codebase-to-course）：
1. **Show, Don't Tell（视觉化教学）**：尽量少用长篇大论（每段不超过3句话）。多用对比、列表、对话等形式。
2. **Metaphors First（类比优先）**：引入每个技术概念时，必须先用英语教学、语法、文学或学校管理相关的类比来解释。且**不要重复使用同一个类比**。
3. **Code ↔ English Translations（代码翻译）**：解释代码时，不要只泛泛而谈。请精确提取一小段核心代码，并逐行用大白话翻译它的作用。
4. **Learn by Tracing（顺藤摸瓜）**：从用户最熟悉的一个操作（比如“点击保存按钮”）开始，追踪数据是如何在代码中流动的。
5. **Application Quizzes（实战测验）**：在每个章节末尾，提供1-2个“情景应用题”（例如：“如果学生反馈页面加载很慢，你应该去哪个文件排查？”），而不是死记硬背的填空题。

请使用 Markdown 格式输出。为了实现交互式排版，请使用以下特殊标记（前端会将其渲染为特殊组件）：

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

- **术语解释（Glossary）**：
遇到专业术语时，请使用这种格式：[专业术语]{这里写一句通俗的解释}。例如：[API]{就像是餐厅的服务员，负责把你的点单传达给厨房}。

请基于用户上传的代码，生成一份结构清晰、引人入胜的交互式教材。`;

      if (files && files.length > 0) {
        const fileContext = files.map((f: any) => `--- ${f.path} ---\n${f.content}`).join('\n\n');
        systemPrompt += `\n\n以下是学生当前正在学习的项目代码，请基于这些代码回答她的问题：\n${fileContext}`;
      }

      const response = await fetch("https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "qwen-plus",
          messages: [
            {
              role: "system",
              content: systemPrompt
            },
            ...messages
          ]
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Qwen API error: ${errorData}`);
      }

      const data = await response.json();
      res.json({ text: data.choices[0].message.content });
    } catch (error: any) {
      console.error("Chat API Error:", error);
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
