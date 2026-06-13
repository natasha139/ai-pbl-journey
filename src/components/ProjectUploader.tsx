import React, { useState, useRef } from 'react';
import { Upload, FolderOpen, FileCode, Loader2, BookOpen, AlertTriangle, Clock, Trash2 } from 'lucide-react';
import { ProjectFile } from '../types';
import { WORKER_URL } from '../config';

interface CachedProject {
  name: string;
  chapters: any[];
  files: ProjectFile[];
  completedTasks: string[];
  savedAt: string;
}

interface ProjectUploaderProps {
  onAnalyzeComplete: (chapters: any[], files: ProjectFile[], name?: string) => void;
  cachedProjects?: CachedProject[];
  onLoadCached?: (project: CachedProject) => void;
  onDeleteCached?: (name: string) => void;
  onExportAll?: () => void;
  onImportAll?: (file: File) => void;
}

export function ProjectUploader({ onAnalyzeComplete, cachedProjects = [], onLoadCached, onDeleteCached, onExportAll, onImportAll }: ProjectUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isReadingFiles, setIsReadingFiles] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{ files: number, estimatedTokens: number } | null>(null);
  const [pendingFiles, setPendingFiles] = useState<ProjectFile[] | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [tokenLimit, setTokenLimit] = useState(100000);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputSingleRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  // Rough estimation: 1 token ≈ 4 characters for English/Code, 1 token ≈ 1.5 characters for Chinese
  const estimateTokens = (text: string) => {
    return Math.ceil(text.length / 3.5);
  };

  const isIgnored = (path: string, name: string) => {
    const normalizedPath = '/' + path + '/';
    const ignoredDirs = [
      '/node_modules/', '/.git/', '/dist/', '/build/', '/.next/', '/out/', '/coverage/',
      '/.vscode/', '/.idea/', '/_site/', '/vendor/', '/tmp/', '/temp/', '/.cache/',
      '/__pycache__/', '/.pytest_cache/', '/target/', '/bin/', '/obj/',
      '/public/images/', '/public/assets/'
    ];
    if (ignoredDirs.some(dir => normalizedPath.includes(dir))) return true;

    const ignoredFiles = [
      '.DS_Store', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml',
      'Cargo.lock', 'Gemfile.lock', 'composer.lock', 'mix.lock', 'poetry.lock',
      '.env', '.pem', '.key', '.crt', '.sqlite', '.db'
    ];
    if (ignoredFiles.some(file => name === file || name.endsWith('.log'))) return true;

    return false;
  };

  const isBinaryFile = async (file: File) => {
    const binaryExtensions = [
      '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp', '.avif',
      '.mp4', '.mp3', '.wav', '.ogg', '.webm',
      '.woff', '.woff2', '.ttf', '.eot', '.otf',
      '.pdf', '.zip', '.tar', '.gz', '.rar', '.7z',
      '.exe', '.dll', '.so', '.dylib', '.class', '.pyc', '.jar'
    ];
    if (binaryExtensions.some(ext => file.name.toLowerCase().endsWith(ext))) return true;

    // Read first 4KB to check for null bytes
    const chunk = file.slice(0, 4096);
    const buffer = await chunk.arrayBuffer();
    const view = new Uint8Array(buffer);
    for (let i = 0; i < view.length; i++) {
      if (view[i] === 0) {
        return true;
      }
    }
    return false;
  };

  const processFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    
    setIsReadingFiles(true);
    setError(null);
    setStats(null);
    setPendingFiles(null);
    setIsConfirmed(false);

    const projectFiles: ProjectFile[] = [];

    try {
      let totalTokens = 0;

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        
        // Basic filtering
        if (isIgnored(file.webkitRelativePath, file.name)) {
          continue;
        }

        // Only read text-based files (basic check)
        if (file.size > 1024 * 500) continue; // Skip files > 500KB
        
        // Check for binary files
        if (await isBinaryFile(file)) {
          continue;
        }
        
        const text = await file.text();
        
        // Final fallback check just in case
        if (text.includes('\u0000')) continue;

        totalTokens += estimateTokens(text);

        projectFiles.push({
          path: file.webkitRelativePath,
          content: text
        });
      }

      if (projectFiles.length === 0) {
        throw new Error("No valid code files found in the selected folder.");
      }

      setStats({ files: projectFiles.length, estimatedTokens: totalTokens });
      setPendingFiles(projectFiles);

      // Token limit check (user-configurable)
      if (totalTokens > tokenLimit) {
        setError(`安全拦截：您上传了 ${projectFiles.length} 个文件，预估消耗约 ${totalTokens.toLocaleString()} 个 Token，超过了设定的 ${tokenLimit.toLocaleString()} Token 限制。\n\n请调高 Token 上限，或移除一些不必要的大文件后重试。`);
      }

    } catch (err: any) {
      console.error("Upload Error:", err);
      setError(err.message || "An error occurred while analyzing the project.");
    } finally {
      setIsReadingFiles(false);
      setIsDragging(false);
    }
  };

  const startAnalysis = async () => {
    if (!pendingFiles) return;
    
    setIsAnalyzing(true);
    setError(null);

    try {
      // Send to backend for analysis
      const response = await fetch(`${WORKER_URL}/api/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ files: pendingFiles })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to analyze project');
      }

      const data = await response.json();
      const projectName = pendingFiles[0]?.path?.split('/')[0] || 'Untitled';
      onAnalyzeComplete(data.chapters, pendingFiles, projectName);

    } catch (err: any) {
      console.error("Analysis Error:", err);
      setError(err.message || "An error occurred while analyzing the project.");
      setIsAnalyzing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
       processFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
  };

  const handleSingleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsReadingFiles(true);
    setError(null);
    setStats(null);
    setPendingFiles(null);
    setIsConfirmed(false);

    try {
      const projectFiles: ProjectFile[] = [];
      let totalTokens = 0;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 1024 * 500) continue;
        const text = await file.text();
        if (text.includes('\u0000')) continue;
        totalTokens += estimateTokens(text);
        projectFiles.push({ path: file.name, content: text });
      }

      if (projectFiles.length === 0) throw new Error('No valid files found.');

      setStats({ files: projectFiles.length, estimatedTokens: totalTokens });
      setPendingFiles(projectFiles);

      if (totalTokens > tokenLimit) {
        setError(`安全拦截：预估消耗约 ${totalTokens.toLocaleString()} 个 Token，超过了设定的 ${tokenLimit.toLocaleString()} Token 限制。`);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setIsReadingFiles(false);
      e.target.value = '';
    }
  };

  const resetUploader = () => {
    setPendingFiles(null);
    setStats(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full text-center space-y-8">
        
        <div className="space-y-4">
          <div className="inline-flex items-center justify-center p-4 bg-indigo-100 rounded-full text-indigo-600 mb-4">
            <BookOpen size={48} />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
            Codebase Syllabus Generator
          </h1>
          <p className="text-xl text-gray-600 max-w-xl mx-auto">
            Upload an AI-generated project folder, and I will generate an interactive, academic study guide tailored for English teachers.
          </p>
        </div>

        {/* Token Limit Slider */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 max-w-md mx-auto w-full">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-gray-700">⚙️ Token 上限</span>
            <span className="text-sm font-bold text-indigo-600">{tokenLimit.toLocaleString()}</span>
          </div>
          <input
            type="range"
            min="10000"
            max="500000"
            step="10000"
            value={tokenLimit}
            onChange={(e) => setTokenLimit(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>10K</span>
            <span>100K</span>
            <span>250K</span>
            <span>500K</span>
          </div>
        </div>

        {/* Cached Projects */}
        {cachedProjects.length > 0 ? (
          <div className="max-w-2xl mx-auto w-full">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold text-gray-500 flex items-center gap-2">
                <Clock size={14} /> 已缓存的项目（点击继续学习）
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => importInputRef.current?.click()}
                  className="text-xs text-green-500 hover:text-green-700 border border-green-200 hover:border-green-400 px-3 py-1 rounded-lg transition-colors"
                >
                  ↑ 导入备份
                </button>
                <button
                  onClick={onExportAll}
                  className="text-xs text-indigo-500 hover:text-indigo-700 border border-indigo-200 hover:border-indigo-400 px-3 py-1 rounded-lg transition-colors"
                >
                  ↓ 导出备份
                </button>
              </div>
              <input
                ref={importInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onImportAll?.(file);
                  e.target.value = '';
                }}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {cachedProjects.map((p) => (
                <div
                  key={p.name}
                  onClick={() => onLoadCached?.(p)}
                  className="bg-white border border-gray-200 rounded-xl p-4 cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all group"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-gray-800 text-sm">{p.name}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {p.chapters.length} 章节 · {p.completedTasks?.length || 0} 已完成
                      </div>
                      <div className="text-xs text-gray-300 mt-0.5">
                        {new Date(p.savedAt).toLocaleDateString('zh-CN')}
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeleteCached?.(p.name); }}
                      className="text-gray-300 hover:text-red-400 transition opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto w-full text-center">
            <button
              onClick={() => importInputRef.current?.click()}
              className="text-sm text-green-500 hover:text-green-700 border border-green-200 hover:border-green-400 px-4 py-2 rounded-lg transition-colors"
            >
              ↑ 从备份文件恢复项目
            </button>
            <input
              ref={importInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onImportAll?.(file);
                e.target.value = '';
              }}
            />
          </div>
        )}

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative overflow-hidden rounded-3xl border-2 transition-all duration-300
            ${(!isAnalyzing && !isReadingFiles && !pendingFiles) ? 'border-dashed' : 'border-solid'}
            ${isDragging ? 'border-indigo-500 bg-indigo-50 scale-[1.02]' : 'border-gray-300 bg-white'}
            ${(isAnalyzing || isReadingFiles) ? 'pointer-events-none opacity-80' : ''}
          `}
        >
          <div className="p-16 flex flex-col items-center justify-center space-y-6">
            {isReadingFiles ? (
              <>
                <div className="relative">
                  <div className="absolute inset-0 bg-indigo-100 rounded-full animate-ping opacity-75"></div>
                  <div className="relative bg-indigo-600 text-white p-4 rounded-full">
                    <Loader2 size={32} className="animate-spin" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-gray-900">Reading Local Files...</h3>
                  <p className="text-gray-500">Scanning directory and estimating tokens.</p>
                </div>
              </>
            ) : isAnalyzing ? (
              <>
                <div className="relative">
                  <div className="absolute inset-0 bg-indigo-100 rounded-full animate-ping opacity-75"></div>
                  <div className="relative bg-indigo-600 text-white p-4 rounded-full">
                    <Loader2 size={32} className="animate-spin" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-gray-900">Analyzing Project...</h3>
                  {stats ? (
                    <p className="text-indigo-600 font-medium">
                      Reading {stats.files} files (~{stats.estimatedTokens.toLocaleString()} tokens)
                    </p>
                  ) : (
                    <p className="text-gray-500">Reading code, mapping data flows, and writing the syllabus.</p>
                  )}
                </div>
              </>
            ) : pendingFiles && stats ? (
              <div className="w-full max-w-md mx-auto space-y-6">
                <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
                  <h3 className="text-xl font-bold text-indigo-900 mb-4">Ready to Analyze</h3>
                  <div className="space-y-3 text-left">
                    <div className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm">
                      <span className="text-gray-600 font-medium">Files Found:</span>
                      <span className="text-gray-900 font-bold">{stats.files}</span>
                    </div>
                    <div className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm">
                      <span className="text-gray-600 font-medium">Estimated Tokens:</span>
                      <span className={`font-bold ${stats.estimatedTokens > tokenLimit ? 'text-red-600' : 'text-indigo-600'}`}>
                        ~{stats.estimatedTokens.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  
                  {!error && (
                    <div className="mt-6 flex items-start gap-3 text-left">
                      <input
                        type="checkbox"
                        id="confirm-analysis"
                        checked={isConfirmed}
                        onChange={(e) => setIsConfirmed(e.target.checked)}
                        className="mt-1 w-4 h-4 text-indigo-600 bg-white border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <label htmlFor="confirm-analysis" className="text-sm text-gray-700 cursor-pointer select-none" onClick={(e) => e.stopPropagation()}>
                        I have reviewed the file count and estimated tokens, and I want to proceed with the analysis.
                      </label>
                    </div>
                  )}
                </div>

                {!error && (
                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={(e) => { e.stopPropagation(); resetUploader(); }}
                      className="px-6 py-3 rounded-xl font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); startAnalysis(); }}
                      disabled={!isConfirmed}
                      className={`px-6 py-3 rounded-xl font-medium text-white transition-all shadow-md
                        ${isConfirmed 
                          ? 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg' 
                          : 'bg-indigo-300 cursor-not-allowed'
                        }
                      `}
                    >
                      Start Analysis
                    </button>
                  </div>
                )}
                
                {error && (
                  <div className="flex justify-center mt-4">
                    <button
                      onClick={(e) => { e.stopPropagation(); resetUploader(); }}
                      className="px-6 py-3 rounded-xl font-medium text-white bg-gray-900 hover:bg-gray-800 transition-colors shadow-md"
                    >
                      Try Another Folder
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="space-y-2 text-center">
                  <p className="text-xl font-semibold text-gray-900">选择要学习的内容</p>
                  <p className="text-gray-500 text-sm">或直接拖拽文件/文件夹到这里</p>
                </div>
                <div className="flex gap-4 mt-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center gap-3 px-8 py-6 bg-indigo-50 hover:bg-indigo-100 border-2 border-indigo-200 hover:border-indigo-400 rounded-2xl transition-all cursor-pointer"
                  >
                    <FolderOpen size={32} className="text-indigo-500" />
                    <div className="text-center">
                      <div className="font-semibold text-indigo-700 text-sm">上传项目文件夹</div>
                      <div className="text-xs text-indigo-400 mt-0.5">整个代码项目</div>
                    </div>
                  </button>
                  <button
                    onClick={() => fileInputSingleRef.current?.click()}
                    className="flex flex-col items-center gap-3 px-8 py-6 bg-violet-50 hover:bg-violet-100 border-2 border-violet-200 hover:border-violet-400 rounded-2xl transition-all cursor-pointer"
                  >
                    <FileCode size={32} className="text-violet-500" />
                    <div className="text-center">
                      <div className="font-semibold text-violet-700 text-sm">上传 HTML 文件</div>
                      <div className="text-xs text-violet-400 mt-0.5">单个或多个 .html</div>
                    </div>
                  </button>
                </div>
                <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-2 rounded-full text-sm mt-2">
                  <AlertTriangle size={16} />
                  <span>大项目建议只上传 src 文件夹以节省 Token</span>
                </div>
              </>
            )}
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            className="hidden"
            // @ts-ignore
            webkitdirectory=""
            directory=""
            multiple
          />
          <input
            type="file"
            ref={fileInputSingleRef}
            onChange={handleSingleFileChange}
            className="hidden"
            accept=".html,.htm,.js,.ts,.tsx,.jsx,.css,.md"
            multiple
          />
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-6 rounded-2xl border border-red-200 text-sm whitespace-pre-wrap text-left shadow-sm flex gap-4">
            <div className="shrink-0 mt-0.5">
              <AlertTriangle className="text-red-500" size={24} />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-red-800 mb-2">Upload Failed</h4>
              <p className="leading-relaxed">{error}</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
