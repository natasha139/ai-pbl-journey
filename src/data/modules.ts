import { Code2, BookOpen, Cloud, Globe, Smartphone } from 'lucide-react';

export const MODULES = [
  {
    id: 'ai-coding',
    title: '1. AI辅助编程基础',
    description: '学习如何使用AI工具（如Gemini）来生成代码、解决问题。',
    icon: Code2,
    content: `
      <div class="space-y-4">
        <h3 class="text-xl font-semibold">什么是AI辅助编程？</h3>
        <p class="text-gray-600">AI辅助编程是指利用大型语言模型（LLM）来帮助你编写、调试和优化代码。你不需要记住所有的语法，只需要清晰地表达你的需求。</p>
        
        <h4 class="font-medium mt-6">核心技巧：Prompt Engineering (提示词工程)</h4>
        <ul class="list-disc pl-5 space-y-2 text-gray-600">
          <li><strong>明确目标：</strong> 告诉AI你要做什么，例如 "写一个React组件"。</li>
          <li><strong>提供上下文：</strong> 给出相关的技术栈或已有代码，例如 "使用Tailwind CSS和TypeScript"。</li>
          <li><strong>分步进行：</strong> 不要一次性要求一个庞大的系统，拆分成小模块。</li>
        </ul>

        <div class="bg-blue-50 p-4 rounded-lg mt-6 border border-blue-100">
          <h4 class="font-medium text-blue-800 flex items-center gap-2">
            💡 实践任务
          </h4>
          <p class="text-blue-700 mt-2 text-sm">
            在右侧的AI导师聊天框中，尝试输入：<br/>
            <code class="bg-white px-2 py-1 rounded mt-2 inline-block">请帮我用HTML和Tailwind CSS写一个简单的个人主页，包含头像、名字和一段简介。</code>
          </p>
        </div>
      </div>
    `,
    tasks: [
      { id: 'task-1-1', title: '了解Prompt基本结构' },
      { id: 'task-1-2', title: '使用AI生成一段简单的HTML/CSS代码' },
      { id: 'task-1-3', title: '在本地运行生成的代码' }
    ]
  },
  {
    id: 'read-code',
    title: '2. 读懂代码与架构',
    description: '学会让AI帮你解释复杂的代码片段和项目架构。',
    icon: BookOpen,
    content: `
      <div class="space-y-4">
        <h3 class="text-xl font-semibold">如何读懂陌生的代码？</h3>
        <p class="text-gray-600">阅读代码是程序员日常工作中最重要的一部分。遇到看不懂的代码，AI是你最好的老师。</p>
        
        <h4 class="font-medium mt-6">让AI解释代码的技巧</h4>
        <ul class="list-disc pl-5 space-y-2 text-gray-600">
          <li><strong>逐行解释：</strong> 粘贴代码并要求 "请逐行解释这段代码的作用"。</li>
          <li><strong>总结功能：</strong> 询问 "这个函数/组件的核心逻辑是什么？"。</li>
          <li><strong>概念解析：</strong> 遇到不懂的API或语法，直接问 "React中的useEffect是做什么的？"。</li>
        </ul>

        <div class="bg-indigo-50 p-4 rounded-lg mt-6 border border-indigo-100">
          <h4 class="font-medium text-indigo-800 flex items-center gap-2">
            💡 实践任务
          </h4>
          <p class="text-indigo-700 mt-2 text-sm">
            找一段你看不懂的JavaScript代码，粘贴给右侧的AI导师，并附上：<br/>
            <code class="bg-white px-2 py-1 rounded mt-2 inline-block">请用通俗易懂的语言，帮我解释一下这段代码的逻辑。</code>
          </p>
        </div>
      </div>
    `,
    tasks: [
      { id: 'task-2-1', title: '找一段开源代码让AI解释' },
      { id: 'task-2-2', title: '理解代码中的变量和函数作用' },
      { id: 'task-2-3', title: '尝试修改代码并观察结果' }
    ]
  },
  {
    id: 'cloudflare-pages',
    title: '3. 部署到 Cloudflare Pages',
    description: '将你的静态网站免费部署到全球CDN上。',
    icon: Cloud,
    content: `
      <div class="space-y-4">
        <h3 class="text-xl font-semibold">什么是 Cloudflare Pages？</h3>
        <p class="text-gray-600">Cloudflare Pages 是一个 JAMstack 平台，供前端开发人员协作和部署网站。它提供免费、快速且安全的全球托管。</p>
        
        <h4 class="font-medium mt-6">部署步骤</h4>
        <ol class="list-decimal pl-5 space-y-2 text-gray-600">
          <li>将你的代码推送到 <strong>GitHub</strong> 仓库。</li>
          <li>登录 Cloudflare 控制台，选择 <strong>Pages</strong>。</li>
          <li>点击 <strong>Connect to Git</strong>，选择你的仓库。</li>
          <li>配置构建命令（如 <code>npm run build</code>）和输出目录（如 <code>dist</code>）。</li>
          <li>点击 <strong>Save and Deploy</strong>。</li>
        </ol>

        <div class="bg-green-50 p-4 rounded-lg mt-6 border border-green-100">
          <h4 class="font-medium text-green-800 flex items-center gap-2">
            💡 实践任务
          </h4>
          <p class="text-green-700 mt-2 text-sm">
            如果你在部署过程中遇到报错，把报错信息复制给AI导师：<br/>
            <code class="bg-white px-2 py-1 rounded mt-2 inline-block">我在部署Cloudflare Pages时遇到了这个错误：[粘贴报错]，请帮我分析原因并提供解决方案。</code>
          </p>
        </div>
      </div>
    `,
    tasks: [
      { id: 'task-3-1', title: '注册 GitHub 和 Cloudflare 账号' },
      { id: 'task-3-2', title: '将本地代码推送到 GitHub' },
      { id: 'task-3-3', title: '在 Cloudflare Pages 完成首次部署' }
    ]
  },
  {
    id: 'domain-setup',
    title: '4. 购买与配置域名',
    description: '为你的网站绑定一个专属的自定义域名。',
    icon: Globe,
    content: `
      <div class="space-y-4">
        <h3 class="text-xl font-semibold">为什么要买域名？</h3>
        <p class="text-gray-600">域名是你在互联网上的门牌号。虽然 Cloudflare Pages 会提供一个免费的 <code>.pages.dev</code> 子域名，但拥有自己的域名显得更专业。</p>
        
        <h4 class="font-medium mt-6">购买与配置流程</h4>
        <ul class="list-disc pl-5 space-y-2 text-gray-600">
          <li><strong>选择注册商：</strong> 推荐使用 NameSilo, Cloudflare Registrar 或 GoDaddy。</li>
          <li><strong>修改 NameServer：</strong> 将域名的 NameServer 指向 Cloudflare，以便使用其强大的 DNS 和 CDN 服务。</li>
          <li><strong>绑定 Pages：</strong> 在 Cloudflare Pages 的 "Custom Domains" 设置中，添加你购买的域名。</li>
        </ul>

        <div class="bg-amber-50 p-4 rounded-lg mt-6 border border-amber-100">
          <h4 class="font-medium text-amber-800 flex items-center gap-2">
            💡 实践任务
          </h4>
          <p class="text-amber-700 mt-2 text-sm">
            如果你不知道如何配置 DNS 解析，可以问AI导师：<br/>
            <code class="bg-white px-2 py-1 rounded mt-2 inline-block">我在NameSilo买了一个域名，如何将它的DNS解析托管到Cloudflare？请给出详细步骤。</code>
          </p>
        </div>
      </div>
    `,
    tasks: [
      { id: 'task-4-1', title: '在域名注册商购买一个域名' },
      { id: 'task-4-2', title: '将域名的 DNS 托管到 Cloudflare' },
      { id: 'task-4-3', title: '在 Cloudflare Pages 中绑定自定义域名' }
    ]
  },
  {
    id: 'mini-program',
    title: '5. 落地小程序',
    description: '将你的Web应用转化为微信/支付宝小程序。',
    icon: Smartphone,
    content: `
      <div class="space-y-4">
        <h3 class="text-xl font-semibold">从小程序开始</h3>
        <p class="text-gray-600">小程序是国内非常重要的流量入口。借助跨端框架（如 Taro 或 Uni-app），你可以用类似 React/Vue 的语法开发小程序。</p>
        
        <h4 class="font-medium mt-6">技术选型建议</h4>
        <ul class="list-disc pl-5 space-y-2 text-gray-600">
          <li><strong>Taro：</strong> 如果你熟悉 React，推荐使用 Taro。</li>
          <li><strong>Uni-app：</strong> 如果你熟悉 Vue，推荐使用 Uni-app。</li>
          <li><strong>原生开发：</strong> 如果项目简单且只针对微信，可以直接使用微信原生语法。</li>
        </ul>

        <div class="bg-rose-50 p-4 rounded-lg mt-6 border border-rose-100">
          <h4 class="font-medium text-rose-800 flex items-center gap-2">
            💡 实践任务
          </h4>
          <p class="text-rose-700 mt-2 text-sm">
            让AI帮你生成小程序的初始化代码：<br/>
            <code class="bg-white px-2 py-1 rounded mt-2 inline-block">我想用Taro(React)开发一个微信小程序，请帮我写一个包含列表展示和详情跳转的基础页面结构。</code>
          </p>
        </div>
      </div>
    `,
    tasks: [
      { id: 'task-5-1', title: '注册微信小程序开发者账号' },
      { id: 'task-5-2', title: '安装微信开发者工具' },
      { id: 'task-5-3', title: '使用跨端框架初始化项目并运行' }
    ]
  }
];
