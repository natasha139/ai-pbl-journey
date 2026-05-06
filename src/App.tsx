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
