import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChapterContent } from './components/ChapterContent';
import { AIMentor } from './components/AIMentor';
import { ProjectUploader } from './components/ProjectUploader';
import { Chapter, ProjectFile } from './types';

const CACHE_KEY = 'pbl-journey-cache';

interface CachedProject {
  name: string;
  chapters: Chapter[];
  files: ProjectFile[];
  completedTasks: string[];
  savedAt: string;
}

function loadCache(): CachedProject[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveCache(projects: CachedProject[]) {
  localStorage.setItem(CACHE_KEY, JSON.stringify(projects));
}

export default function App() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>([]);
  const [currentChapterId, setCurrentChapterId] = useState<string>('');
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [projectName, setProjectName] = useState<string>('');

  // Save to cache whenever chapters or completedTasks change
  useEffect(() => {
    if (chapters.length > 0 && projectName) {
      const cached = loadCache();
      const idx = cached.findIndex(p => p.name === projectName);
      const entry: CachedProject = {
        name: projectName,
        chapters,
        files: projectFiles,
        completedTasks,
        savedAt: new Date().toISOString()
      };
      if (idx >= 0) cached[idx] = entry;
      else cached.unshift(entry);
      // Keep max 10 projects
      saveCache(cached.slice(0, 10));
    }
  }, [chapters, completedTasks, projectName]);

  const handleAnalyzeComplete = (newChapters: Chapter[], files: ProjectFile[], name?: string) => {
    const pName = name || files[0]?.path?.split('/')[0] || 'Untitled Project';
    setProjectName(pName);
    setChapters(newChapters);
    setProjectFiles(files);
    setCompletedTasks([]);
    if (newChapters.length > 0) {
      setCurrentChapterId(newChapters[0].id);
    }
  };

  const handleLoadCached = (project: CachedProject) => {
    setProjectName(project.name);
    setChapters(project.chapters);
    setProjectFiles(project.files);
    setCompletedTasks(project.completedTasks || []);
    if (project.chapters.length > 0) {
      setCurrentChapterId(project.chapters[0].id);
    }
  };

  const handleDeleteCached = (name: string) => {
    const cached = loadCache().filter(p => p.name !== name);
    saveCache(cached);
  };

  const handleExportAll = () => {
    const data = loadCache();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-pbl-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportAll = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        if (!Array.isArray(imported)) throw new Error('格式不正确');
        const existing = loadCache();
        // merge: imported项目优先，已有同名的跳过
        const merged = [...imported];
        for (const p of existing) {
          if (!merged.find(m => m.name === p.name)) merged.push(p);
        }
        saveCache(merged.slice(0, 10));
        alert(`导入成功！共 ${imported.length} 个项目已恢复。`);
        window.location.reload();
      } catch {
        alert('导入失败：文件格式不正确，请选择正确的备份 JSON 文件。');
      }
    };
    reader.readAsText(file);
  };

  const handleBackToHome = () => {
    setChapters([]);
    setProjectFiles([]);
    setCurrentChapterId('');
    setProjectName('');
  };

  const handleToggleTask = (taskId: string) => {
    setCompletedTasks(prev => 
      prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const handleNextChapter = () => {
    const currentIndex = chapters.findIndex(c => c.id === currentChapterId);
    if (currentIndex < chapters.length - 1) {
      setCurrentChapterId(chapters[currentIndex + 1].id);
    }
  };

  if (chapters.length === 0) {
    return (
      <ProjectUploader
        onAnalyzeComplete={handleAnalyzeComplete}
        cachedProjects={loadCache()}
        onLoadCached={handleLoadCached}
        onDeleteCached={handleDeleteCached}
        onExportAll={handleExportAll}
        onImportAll={handleImportAll}
      />
    );
  }

  const currentIndex = chapters.findIndex(c => c.id === currentChapterId);
  const isLastChapter = currentIndex === chapters.length - 1;
  const currentChapter = chapters.find(c => c.id === currentChapterId) || null;

  return (
    <div className="flex h-screen bg-white font-sans overflow-hidden">
      <Sidebar 
        chapters={chapters}
        currentChapterId={currentChapterId} 
        onSelectChapter={setCurrentChapterId}
        completedTasks={completedTasks}
        onBackToHome={handleBackToHome}
        projectName={projectName}
      />
      
      <ChapterContent 
        chapter={currentChapter}
        completedTasks={completedTasks}
        onToggleTask={handleToggleTask}
        onNextChapter={handleNextChapter}
        isLastChapter={isLastChapter}
      />

      <AIMentor projectFiles={projectFiles} />
    </div>
  );
}
