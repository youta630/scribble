'use client';

import { useState, useEffect } from 'react';
import UrlInput from '@/components/UrlInput';
import LoadingSpinner from '@/components/LoadingSpinner';
import UsageGuide from '@/components/UsageGuide';
import UsageCounter from '@/components/UsageCounter';
import SummarySidebar from '@/components/SummarySidebar';
import MarkdownPreview from '@/components/MarkdownPreview';
import FolderSelector from '@/components/FolderSelector';
import BrowserSupportInfo from '@/components/BrowserSupportInfo';
import { ThoughtSummary, generateMarkdownText } from '@/lib/types';
import { fileSystemManager } from '@/lib/fileSystem';
import { backgroundProcessor } from '@/lib/backgroundProcessor';
import { ShortcutManager } from '@/lib/shortcuts';
import { summarizeText } from '@/lib/llm';

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLimitReached, setIsLimitReached] = useState(false);
  const [activePanel, setActivePanel] = useState<'guide' | null>(null);
  const [savedSummaries, setSavedSummaries] = useState<ThoughtSummary[]>([]);
  const [selectedSummary, setSelectedSummary] = useState<ThoughtSummary | null>(null);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [showFolderSelector, setShowFolderSelector] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentFolderName, setCurrentFolderName] = useState<string | null>(null);
  const [showBrowserInfo, setShowBrowserInfo] = useState(false);

  // 初期化
  useEffect(() => {
    const initialize = async () => {
      try {
        // 既存の要約を読み込み
        const summaries = await fileSystemManager.loadSummaries();
        setSavedSummaries(summaries);
        
        // フォルダ名を取得
        const folderName = fileSystemManager.getFolderName();
        setCurrentFolderName(folderName);
        
        // フォルダが選択されていない場合は選択画面を表示
        if (!fileSystemManager.hasFolder() && summaries.length === 0) {
          setShowFolderSelector(true);
        }

        // ショートカットマネージャーを初期化
        await ShortcutManager.setupWebShortcuts();
        
        // グローバル関数を設定（ショートカットから呼ばれる）
        (window as any).startNewSummary = () => {
          setSelectedSummary(null);
          setSidebarExpanded(false);
        };
        
      } catch (error) {
        console.error('Failed to initialize:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    initialize();

    // クリーンアップ
    return () => {
      ShortcutManager.cleanup();
    };
  }, []);

  const handleFolderSelected = async () => {
    setShowFolderSelector(false);
    try {
      const summaries = await fileSystemManager.loadSummaries();
      setSavedSummaries(summaries);
      const folderName = fileSystemManager.getFolderName();
      setCurrentFolderName(folderName);
    } catch (error) {
      console.error('Failed to load summaries after folder selection:', error);
    }
  };

  const handleDirectFolderChange = async () => {
    try {
      const success = await fileSystemManager.selectFolder();
      if (success) {
        const summaries = await fileSystemManager.loadSummaries();
        setSavedSummaries(summaries);
        const folderName = fileSystemManager.getFolderName();
        setCurrentFolderName(folderName);
      }
    } catch (error) {
      console.error('Failed to change folder:', error);
    }
  };

  const handleSkipFolderSelection = () => {
    setShowFolderSelector(false);
  };

  const handleAnalyze = async (text: string) => {
    if (isLimitReached) {
      setError('Free limit reached. Please upgrade your plan.');
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text })
      });

      if (!response.ok) {
        throw new Error('Failed to analyze text');
      }

      const data = await response.json();
      const newSummary: ThoughtSummary = { 
        id: Date.now().toString(), 
        createdAt: new Date(),
        subject: data.subject,
        background: data.background,
        hypothesis: data.hypothesis,
        analysis: data.analysis,
        decision: data.decision,
        development: data.development,
        insights: data.insights,
        output: data.output
      };
      
      // 使用回数をインクリメント
      if (typeof (window as any).incrementSummaryUsage === 'function') {
        (window as any).incrementSummaryUsage();
      }
      
      // ファイルシステムに保存
      const saved = await fileSystemManager.saveSummary(newSummary);
      if (saved) {
        setSavedSummaries(prev => [newSummary, ...prev]);
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
        setSidebarExpanded(true);
        
        // バックグラウンドで自動保存をスケジュール
        const taskId = backgroundProcessor.scheduleSummaryAutoSave(newSummary);
        console.log(`Background save scheduled: ${taskId}`);
        
        // 成功通知をバックグラウンドで送信
        backgroundProcessor.sendNotification(
          'Summary Saved',
          'Your thought asset has been successfully saved'
        );
      } else {
        throw new Error('Failed to save summary');
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLimitReached = () => {
    setIsLimitReached(true);
  };

  const handleUsageUpdate = (count: number) => {
    setIsLimitReached(count >= 3);
  };


  const exportMarkdown = (summary: ThoughtSummary) => {
    const markdown = generateMarkdownText(summary);
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `thought-asset-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSelectSummary = (summary: ThoughtSummary) => {
    setSelectedSummary(summary);
  };


  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Folder Selection Modal */}
      {showFolderSelector && (
        <FolderSelector
          onFolderSelected={handleFolderSelected}
          onSkip={handleSkipFolderSelection}
        />
      )}

      {/* Left Sidebar */}
      <SummarySidebar
        summaries={savedSummaries}
        selectedSummary={selectedSummary}
        onSelectSummary={handleSelectSummary}
        expanded={sidebarExpanded}
        onToggleExpanded={() => setSidebarExpanded(!sidebarExpanded)}
        onFolderChange={handleDirectFolderChange}
        folderName={currentFolderName}
        onExportSummary={exportMarkdown}
      />

      {/* Browser Support Info near toggle button */}
      {showBrowserInfo && (
        <div className="fixed top-4 left-24 z-30">
          <BrowserSupportInfo />
        </div>
      )}
      
      <div 
        className="fixed top-4 left-16 z-20"
        onMouseEnter={() => setShowBrowserInfo(true)}
        onMouseLeave={() => setShowBrowserInfo(false)}
      >
        <div className="w-6 h-6 bg-gray-100 border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors cursor-help">
          <span className="text-xs text-gray-600">i</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative">
        {/* Main Panel */}
        <div className="w-full h-full relative">
          {/* Top Controls */}
          <div className="absolute top-4 right-4 z-10">
            {selectedSummary ? (
              <>
                {/* Back Button */}
                <button
                  onClick={() => setSelectedSummary(null)}
                  className="w-8 h-8 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm"
                  title="Back to summary list"
                >
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              </>
            ) : (
              <div className="relative">
                {/* Help button */}
                <button
                  onClick={() => setActivePanel(activePanel === 'guide' ? null : 'guide')}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors shadow-sm ${
                    activePanel === 'guide' 
                      ? 'bg-gray-800 text-white' 
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                  title="How to use"
                >
                  <span className="text-sm font-medium">?</span>
                </button>
                
                {/* Usage Guide - Show under help button */}
                {activePanel === 'guide' && (
                  <div className="absolute top-10 right-0 z-20 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-80">
                    <UsageGuide />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Notification */}
          {showNotification && (
            <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-30">
              <div className="bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-lg">
                <p className="text-sm text-gray-700">Summary saved</p>
              </div>
            </div>
          )}

          <div className="h-screen overflow-auto">
            {!selectedSummary ? (
              /* Welcome/Input State */
              <div className="max-w-2xl mx-auto py-12 px-8">
                {/* Header with Logo */}
                <div className="text-center mb-12">
                  <div className="mb-6">
                    <div className="w-16 h-16 mx-auto mb-4 bg-black rounded-lg flex items-center justify-center">
                      <div className="w-8 h-8 bg-white rounded transform rotate-45"></div>
                    </div>
                  </div>
                  <h1 className="text-2xl font-light text-gray-900 mb-2">
                    Scribble
                  </h1>
                  <p className="text-gray-900 text-sm">
                    Transform conversations into insights
                  </p>
                </div>

                {/* Usage Counter */}
                <div className="mb-8">
                  <UsageCounter 
                    onLimitReached={handleLimitReached}
                    onUsageUpdate={handleUsageUpdate}
                  />
                </div>


                {/* Input Section */}
                <div className="mb-8">
                  <UrlInput onAnalyze={handleAnalyze} disabled={isLoading || isLimitReached} />
                </div>


                {/* Welcome message when summaries exist */}
                {!isLoading && savedSummaries.length > 0 && !activePanel && (
                  <div className="text-center py-12 text-gray-900">
                    <p className="text-lg">Select a summary from the sidebar to view details</p>
                  </div>
                )}

                {/* Loading */}
                {isLoading && (
                  <div className="text-center py-12">
                    <LoadingSpinner />
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div className="text-center py-4 mb-8">
                    <div className="text-sm text-red-600">
                      {error}
                    </div>
                  </div>
                )}

              </div>
            ) : (
              /* Markdown Display */
              <div className="h-full">
                <MarkdownPreview summary={selectedSummary} />
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}