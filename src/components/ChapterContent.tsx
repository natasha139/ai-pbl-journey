import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, ChevronRight, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { Chapter } from '../types';

interface ChapterContentProps {
  chapter: Chapter | null;
  completedTasks: string[];
  onToggleTask: (taskId: string) => void;
  onNextChapter: () => void;
  isLastChapter: boolean;
}

const preprocessMarkdown = (text: string) => {
  let processed = text;

  // Glossary Tooltips: [Term]{Definition} -> [Term](tooltip:Definition)
  processed = processed.replace(/\[([^\]]+)\]\{([^}]+)\}/g, '[$1](tooltip:$2)');

  // Translation Blocks
  processed = processed.replace(/:::translation\n([\s\S]*?)\n:::/g, (match, content) => {
    return `\n\`\`\`translation\n${content.trim()}\n\`\`\`\n`;
  });

  // Chat Blocks
  processed = processed.replace(/:::chat\n([\s\S]*?)\n:::/g, (match, content) => {
    return `\n\`\`\`chat\n${content.trim()}\n\`\`\`\n`;
  });

  return processed;
};

export function ChapterContent({ chapter, completedTasks, onToggleTask, onNextChapter, isLastChapter }: ChapterContentProps) {
  const [showToast, setShowToast] = useState(false);

  // Clear toast if chapter changes
  useEffect(() => {
    setShowToast(false);
  }, [chapter?.id]);

  if (!chapter) return null;

  const isCompleted = completedTasks.includes(chapter.id);

  const handleToggle = () => {
    const willComplete = !isCompleted;
    onToggleTask(chapter.id);
    
    if (willComplete) {
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
      }, 3000);
    } else {
      setShowToast(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50/50 p-8 lg:p-12 relative">
      <div className="max-w-4xl mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={chapter.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            {/* Header */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
                  <BookOpen size={28} />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">{chapter.title}</h2>
                  <p className="text-gray-500 mt-1">{chapter.description}</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 prose prose-indigo prose-lg max-w-none">
              <ReactMarkdown
                components={{
                  a: ({ node, href, children, ...props }) => {
                    if (href?.startsWith('tooltip:')) {
                      const definition = decodeURIComponent(href.replace('tooltip:', ''));
                      return (
                        <span className="group relative inline-block border-b-2 border-dashed border-indigo-400 text-indigo-700 cursor-pointer font-medium hover:bg-indigo-50 transition-colors">
                          {children}
                          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-64 p-3 bg-gray-900 text-white text-sm rounded-xl shadow-xl z-50 font-normal leading-relaxed text-center">
                            {definition}
                            <svg className="absolute text-gray-900 h-2 w-full left-0 top-full" x="0px" y="0px" viewBox="0 0 255 255"><polygon className="fill-current" points="0,0 127.5,127.5 255,0"/></svg>
                          </span>
                        </span>
                      );
                    }
                    return <a href={href} {...props}>{children}</a>;
                  },
                  code: ({ node, inline, className, children, ...props }: any) => {
                    const match = /language-(\w+)/.exec(className || '');
                    const language = match ? match[1] : '';
                    
                    if (!inline && language === 'translation') {
                      const content = String(children).replace(/\n$/, '');
                      const parts = content.split('***');
                      const codePart = parts[0]?.trim() || '';
                      const englishPart = parts[1]?.trim() || '';
                      
                      const codeMatch = /```(\w*)\n([\s\S]*?)```/.exec(codePart);
                      const actualCode = codeMatch ? codeMatch[2] : codePart;
                      
                      return (
                        <div className="my-10 flex flex-col lg:flex-row gap-0 rounded-2xl overflow-hidden border border-gray-200 shadow-md not-prose">
                          <div className="lg:w-1/2 bg-[#1E1E2E] p-6 overflow-x-auto">
                            <div className="text-xs text-gray-500 mb-3 uppercase tracking-wider font-semibold">Code</div>
                            <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap leading-relaxed">{actualCode}</pre>
                          </div>
                          <div className="lg:w-1/2 bg-indigo-50/50 p-6 flex flex-col justify-center">
                            <div className="text-xs text-indigo-400 mb-3 uppercase tracking-wider font-semibold">Plain English</div>
                            <div className="prose prose-sm prose-indigo">
                              <ReactMarkdown>{englishPart}</ReactMarkdown>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    
                    if (!inline && language === 'chat') {
                      const content = String(children).replace(/\n$/, '');
                      const lines = content.split('\n');
                      return (
                        <div className="my-10 bg-gray-50/80 rounded-2xl p-6 lg:p-8 border border-gray-200 space-y-4 not-prose shadow-inner">
                          {lines.map((line, i) => {
                            const match = /^([^:]+):\s*(.*)$/.exec(line);
                            if (!match) return <p key={i} className="text-gray-500 text-center text-sm my-4">{line}</p>;
                            const speaker = match[1].trim();
                            const message = match[2].trim();
                            const isStudent = speaker.toLowerCase().includes('student') || speaker.includes('前端') || speaker.includes('用户');
                            
                            return (
                              <div key={i} className={`flex ${isStudent ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] lg:max-w-[75%] rounded-2xl px-5 py-3 shadow-sm ${isStudent ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'}`}>
                                  <div className={`text-xs font-bold mb-1 ${isStudent ? 'text-indigo-200' : 'text-gray-400'}`}>{speaker}</div>
                                  <div className="leading-relaxed">{message}</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    }
                    
                    return (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  }
                }}
              >
                {preprocessMarkdown(chapter.content)}
              </ReactMarkdown>
            </div>

            {/* Tasks / Mark as Read */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <CheckCircle2 className="text-indigo-600" />
                Reading Progress
              </h3>
              <div className="space-y-3">
                <button
                  onClick={handleToggle}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 text-left relative overflow-hidden
                    ${isCompleted 
                      ? 'bg-green-50/50 border-green-200 text-green-900 shadow-sm' 
                      : 'bg-white border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/30'
                    }
                  `}
                >
                  {isCompleted && (
                    <motion.div 
                      layoutId="completed-bg"
                      className="absolute inset-0 bg-green-50/50"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                  <div className={`shrink-0 relative z-10 ${isCompleted ? 'text-green-500' : 'text-gray-300'}`}>
                    {isCompleted ? (
                      <motion.div
                        initial={{ scale: 0, rotate: -45 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      >
                        <CheckCircle2 size={24} />
                      </motion.div>
                    ) : (
                      <Circle size={24} />
                    )}
                  </div>
                  <span className={`flex-1 text-lg font-medium relative z-10 transition-colors duration-300 ${isCompleted ? 'text-green-700' : 'text-gray-700'}`}>
                    {isCompleted ? 'Completed!' : 'Mark Chapter as Read'}
                  </span>
                </button>
              </div>
            </div>

            {/* Next Button */}
            {!isLastChapter && (
              <div className="flex justify-end pt-4 pb-12">
                <button
                  onClick={onNextChapter}
                  className="flex items-center gap-2 px-8 py-4 bg-gray-900 text-white rounded-xl font-medium hover:bg-indigo-600 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
                >
                  Next Chapter
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
            
            {isLastChapter && isCompleted && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 20 }}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-8 text-white text-center shadow-lg mb-12"
              >
                <h3 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
                  🎉 Congratulations!
                </h3>
                <p className="text-indigo-100">
                  You have completed the entire study guide for this codebase. You are now ready to make modifications and build upon it!
                </p>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="fixed bottom-8 right-8 lg:right-12 bg-gray-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 z-50 border border-gray-700"
          >
            <div className="bg-green-500/20 text-green-400 p-1.5 rounded-full">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <p className="font-medium text-sm">Progress Saved</p>
              <p className="text-gray-400 text-xs mt-0.5">Chapter marked as read</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
