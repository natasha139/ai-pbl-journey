import React from 'react';
import { CheckCircle2, BookOpen, ArrowLeft } from 'lucide-react';
import { Chapter } from '../types';

interface SidebarProps {
  chapters: Chapter[];
  currentChapterId: string;
  onSelectChapter: (id: string) => void;
  completedTasks: string[];
  onBackToHome?: () => void;
  projectName?: string;
}

export function Sidebar({ chapters, currentChapterId, onSelectChapter, completedTasks, onBackToHome, projectName }: SidebarProps) {
  const getModuleProgress = (chapterId: string) => {
    // For now, just a simple toggle if the chapter is marked as completed
    const isCompleted = completedTasks.includes(chapterId);
    return isCompleted ? 100 : 0;
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 h-screen flex flex-col overflow-y-auto">
      <div className="p-6 border-b border-gray-200">
        {onBackToHome && (
          <button onClick={onBackToHome} className="flex items-center gap-1 text-xs text-gray-400 hover:text-indigo-600 transition mb-3">
            <ArrowLeft size={12} /> 返回首页
          </button>
        )}
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <span className="bg-indigo-600 text-white p-1.5 rounded-lg">AI</span>
          Syllabus
        </h1>
        <p className="text-sm text-gray-500 mt-2">{projectName || 'Interactive Codebase Guide'}</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {chapters.map((chapter) => {
          const isActive = currentChapterId === chapter.id;
          const progress = getModuleProgress(chapter.id);
          const isFullyCompleted = progress === 100;

          return (
            <button
              key={chapter.id}
              onClick={() => onSelectChapter(chapter.id)}
              className={`w-full text-left p-4 rounded-xl transition-all duration-200 flex flex-col gap-3 relative overflow-hidden group
                ${isActive 
                  ? 'bg-indigo-50 border-indigo-200 border shadow-sm' 
                  : 'hover:bg-gray-50 border border-transparent'
                }
              `}
            >
              <div className="flex items-start gap-3 relative z-10">
                <div className={`p-2 rounded-lg shrink-0 ${isActive ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'}`}>
                  <BookOpen size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className={`font-medium truncate ${isActive ? 'text-indigo-900' : 'text-gray-900'}`}>
                      {chapter.title}
                    </h3>
                    {isFullyCompleted && (
                      <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                    )}
                  </div>
                  <p className={`text-xs mt-1 line-clamp-2 ${isActive ? 'text-indigo-700/70' : 'text-gray-500'}`}>
                    {chapter.description}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1 relative z-10">
                <div 
                  className={`h-1.5 rounded-full transition-all duration-500 ${isFullyCompleted ? 'bg-green-500' : 'bg-indigo-500'}`}
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </button>
          );
        })}
      </nav>
      
      <div className="p-6 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 font-medium">Reading Progress</span>
          <span className="text-indigo-600 font-bold">
            {chapters.length > 0 ? Math.round((completedTasks.length / chapters.length) * 100) : 0}%
          </span>
        </div>
      </div>
    </div>
  );
}
