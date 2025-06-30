import { ThoughtSummary, generateMarkdownText } from './types';

// File System Access API の型定義
declare global {
  interface Window {
    showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>;
  }
}

export interface FileSystemManager {
  selectFolder: () => Promise<boolean>;
  saveSummary: (summary: ThoughtSummary) => Promise<boolean>;
  loadSummaries: () => Promise<ThoughtSummary[]>;
  deleteSummary: (id: string) => Promise<boolean>;
  hasFolder: () => boolean;
  getFolderName: () => string | null;
  generateMarkdownContent: (summary: ThoughtSummary) => string;
  isFileSystemAccessSupported: () => boolean;
  getBrowserSupportInfo: () => { supported: boolean; browser: string; message: string };
}

class LocalFileSystemManager implements FileSystemManager {
  private directoryHandle: FileSystemDirectoryHandle | null = null;
  private readonly STORAGE_KEY = 'chat-summary-directory';
  private readonly FOLDER_NAME_KEY = 'chat-summary-folder-name';

  constructor() {
    this.loadDirectoryHandle();
  }

  private async loadDirectoryHandle() {
    if (typeof window === 'undefined' || !window.showDirectoryPicker) return;
    
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        // Note: File System Access API directory handles cannot be restored across sessions
        // We rely on localStorage for folder name persistence
        console.log('Directory handle cannot be restored across sessions due to browser security');
      }
    } catch (error) {
      console.log('Could not restore directory handle');
    }
  }

  async selectFolder(): Promise<boolean> {
    if (typeof window === 'undefined' || !window.showDirectoryPicker) {
      if (typeof window !== 'undefined') {
        // より親切なメッセージに変更
        alert('フォルダ選択はChrome/Edge 86+で利用可能です。ファイルはダウンロードされます。');
      }
      return false;
    }

    try {
      this.directoryHandle = await (window as any).showDirectoryPicker({
        mode: 'readwrite'
      });
      localStorage.setItem(this.STORAGE_KEY, 'selected');
      localStorage.setItem(this.FOLDER_NAME_KEY, this.directoryHandle?.name || '');
      return true;
    } catch (error) {
      if ((error as any).name === 'AbortError') {
        console.log('Folder selection cancelled by user');
      } else {
        console.error('Folder selection failed:', error);
      }
      return false;
    }
  }

  hasFolder(): boolean {
    if (this.directoryHandle !== null) {
      return true;
    }
    if (typeof window !== 'undefined') {
      const hasStoredFolder = localStorage.getItem(this.STORAGE_KEY) === 'selected';
      const hasStoredName = localStorage.getItem(this.FOLDER_NAME_KEY) !== null;
      return hasStoredFolder && hasStoredName;
    }
    return false;
  }

  getFolderName(): string | null {
    if (this.directoryHandle) {
      return this.directoryHandle.name;
    }
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.FOLDER_NAME_KEY);
    }
    return null;
  }

  async saveSummary(summary: ThoughtSummary): Promise<boolean> {
    if (!this.directoryHandle) {
      return this.fallbackSave(summary);
    }

    try {
      const date = new Date(summary.createdAt).toISOString().split('T')[0];
      const fileName = `${date}-${summary.id}.md`;
      
      const markdown = generateMarkdownText(summary);
      
      const fileHandle = await this.directoryHandle.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(markdown);
      await writable.close();

      // メタデータも保存
      await this.saveMetadata(summary);
      
      return true;
    } catch (error) {
      console.error('Failed to save summary:', error);
      return this.fallbackSave(summary);
    }
  }

  private async saveMetadata(summary: ThoughtSummary) {
    if (!this.directoryHandle) return;

    try {
      const metaHandle = await this.directoryHandle.getFileHandle('summaries.json', { create: true });
      const existingMeta = await this.readMetadata();
      
      const updated = existingMeta.filter(s => s.id !== summary.id);
      updated.unshift({
        id: summary.id,
        createdAt: summary.createdAt.toISOString(),
        mainTheme: summary.subject || 'Untitled'
      });

      const writable = await metaHandle.createWritable();
      await writable.write(JSON.stringify(updated, null, 2));
      await writable.close();
    } catch (error) {
      console.error('Failed to save metadata:', error);
    }
  }

  private async readMetadata(): Promise<Array<{id: string, createdAt: string, mainTheme: string}>> {
    if (!this.directoryHandle) return [];

    try {
      const metaHandle = await this.directoryHandle.getFileHandle('summaries.json');
      const file = await metaHandle.getFile();
      const content = await file.text();
      return JSON.parse(content);
    } catch (error) {
      return [];
    }
  }

  async loadSummaries(): Promise<ThoughtSummary[]> {
    if (!this.directoryHandle) {
      return this.loadFromLocalStorage();
    }

    try {
      const summaries: ThoughtSummary[] = [];
      const metadata = await this.readMetadata();

      for (const meta of metadata) {
        try {
          const date = meta.createdAt.split('T')[0];
          const fileName = `${date}-${meta.id}.md`;
          const fileHandle = await this.directoryHandle.getFileHandle(fileName);
          const file = await fileHandle.getFile();
          const content = await file.text();
          
          const summary = this.parseMarkdown(content, meta.id, new Date(meta.createdAt));
          if (summary) {
            summaries.push(summary);
          }
        } catch (error) {
          console.error(`Failed to load summary ${meta.id}:`, error);
        }
      }

      return summaries;
    } catch (error) {
      console.error('Failed to load summaries:', error);
      return this.loadFromLocalStorage();
    }
  }

  async deleteSummary(id: string): Promise<boolean> {
    if (!this.directoryHandle) return false;

    try {
      const metadata = await this.readMetadata();
      const meta = metadata.find(m => m.id === id);
      if (!meta) return false;

      const date = meta.createdAt.split('T')[0];
      const fileName = `${date}-${id}.md`;
      
      await this.directoryHandle.removeEntry(fileName);
      
      // メタデータも更新
      const updated = metadata.filter(m => m.id !== id);
      const metaHandle = await this.directoryHandle.getFileHandle('summaries.json', { create: true });
      const writable = await metaHandle.createWritable();
      await writable.write(JSON.stringify(updated, null, 2));
      await writable.close();

      return true;
    } catch (error) {
      console.error('Failed to delete summary:', error);
      return false;
    }
  }

  private fallbackSave(summary: ThoughtSummary): boolean {
    // ブラウザ非対応時はダウンロード方式（改善版）
    const markdown = generateMarkdownText(summary);
    const date = new Date(summary.createdAt).toISOString().split('T')[0];
    const fileName = `${date}-${summary.id}.md`;
    
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    
    // クリーンアップを少し遅延
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
    
    // LocalStorageにも保存
    this.saveToLocalStorage(summary);
    return true;
  }

  private saveToLocalStorage(summary: ThoughtSummary) {
    if (typeof window === 'undefined') return;
    
    const stored = JSON.parse(localStorage.getItem('chat-summaries') || '[]');
    const updated = stored.filter((s: any) => s.id !== summary.id);
    updated.unshift({
      ...summary,
      createdAt: summary.createdAt.toISOString()
    });
    localStorage.setItem('chat-summaries', JSON.stringify(updated));
  }

  private loadFromLocalStorage(): ThoughtSummary[] {
    if (typeof window === 'undefined') return [];
    
    try {
      const stored = JSON.parse(localStorage.getItem('chat-summaries') || '[]');
      return stored.map((s: any) => ({
        ...s,
        createdAt: new Date(s.createdAt)
      }));
    } catch (error) {
      return [];
    }
  }


  private parseMarkdown(content: string, id: string, createdAt: Date): ThoughtSummary | null {
    try {
      const sections = content.split('## ');
      
      const getSection = (title: string) => {
        const section = sections.find(s => s.startsWith(title));
        return section ? section.split('\n').slice(1).join('\n').trim() : '';
      };

      const subjectSection = getSection('🎯 Subject');
      const backgroundSection = getSection('📋 Background');
      const hypothesisSection = getSection('💭 Hypothesis & Motivation');
      const analysisSection = getSection('🔍 Analysis');
      const decisionSection = getSection('✅ Decision');
      const developmentSection = getSection('🚀 Development');
      const insightsSection = getSection('💡 Insights');
      const outputSection = getSection('📤 Output');

      return {
        id,
        createdAt,
        subject: subjectSection,
        background: backgroundSection,
        hypothesis: hypothesisSection,
        analysis: analysisSection,
        decision: decisionSection.split('---')[0].trim(),
        development: developmentSection,
        insights: insightsSection,
        output: outputSection.split('---')[0].trim()
      };
    } catch (error) {
      console.error('Failed to parse markdown:', error);
      return null;
    }
  }

  generateMarkdownContent(summary: ThoughtSummary): string {
    return generateMarkdownText(summary);
  }

  isFileSystemAccessSupported(): boolean {
    return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
  }

  getBrowserSupportInfo(): { supported: boolean; browser: string; message: string } {
    if (typeof window === 'undefined') {
      return { supported: false, browser: 'Unknown', message: 'サーバーサイドレンダリング中' };
    }

    const userAgent = navigator.userAgent;
    let browser = 'Unknown';
    let supported = false;
    let message = '';

    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
      browser = 'Chrome';
      const match = userAgent.match(/Chrome\/(\d+)/);
      const version = match ? parseInt(match[1]) : 0;
      supported = version >= 86 && this.isFileSystemAccessSupported();
      message = supported 
        ? 'フォルダ選択機能が利用可能です' 
        : `Chrome ${version} - バージョン86以上が必要です`;
    } else if (userAgent.includes('Edg')) {
      browser = 'Edge';
      const match = userAgent.match(/Edg\/(\d+)/);
      const version = match ? parseInt(match[1]) : 0;
      supported = version >= 86 && this.isFileSystemAccessSupported();
      message = supported 
        ? 'フォルダ選択機能が利用可能です' 
        : `Edge ${version} - バージョン86以上が必要です`;
    } else if (userAgent.includes('Firefox')) {
      browser = 'Firefox';
      supported = false;
      message = 'Firefoxは未対応です。ファイルはダウンロードされます';
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      browser = 'Safari';
      supported = false;
      message = 'Safariは未対応です。ファイルはダウンロードされます';
    } else {
      supported = this.isFileSystemAccessSupported();
      message = supported 
        ? 'フォルダ選択機能が利用可能です' 
        : 'このブラウザは未対応です。ファイルはダウンロードされます';
    }

    return { supported, browser, message };
  }
}

export const fileSystemManager = new LocalFileSystemManager();