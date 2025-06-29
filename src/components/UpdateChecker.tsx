'use client';

import { useEffect, useState } from 'react';

interface UpdateInfo {
  available: boolean;
  version?: string;
  notes?: string;
}

export default function UpdateChecker() {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo>({ available: false });
  const [checking, setChecking] = useState(false);
  const [installing, setInstalling] = useState(false);

  const checkForUpdates = async () => {
    setChecking(true);
    
    try {
      // Check if we're in Tauri environment
      if (typeof window !== 'undefined' && (window as any).__TAURI__) {
        const { check } = await import('@tauri-apps/plugin-updater');
        
        const update = await check();
        
        if (update?.available) {
          setUpdateInfo({
            available: true,
            version: update.version,
            notes: update.body || 'New version available'
          });
        } else {
          setUpdateInfo({ available: false });
        }
      } else {
        // Web版では定期的に GitHub Releases をチェック
        const response = await fetch('https://api.github.com/repos/{{GITHUB_USERNAME}}/scribble/releases/latest');
        const release = await response.json();
        
        // 現在のバージョンと比較（仮実装）
        const currentVersion = '0.1.0'; // 実際は動的に取得
        if (release.tag_name !== `v${currentVersion}`) {
          setUpdateInfo({
            available: true,
            version: release.tag_name,
            notes: release.body || 'New version available'
          });
        }
      }
    } catch (error) {
      console.error('Failed to check for updates:', error);
    } finally {
      setChecking(false);
    }
  };

  const installUpdate = async () => {
    if (!updateInfo.available) return;
    
    setInstalling(true);
    
    try {
      if (typeof window !== 'undefined' && (window as any).__TAURI__) {
        const { check } = await import('@tauri-apps/plugin-updater');
        const { relaunch } = await import('@tauri-apps/plugin-process');
        
        const update = await check();
        
        if (update?.available) {
          await update.downloadAndInstall();
          await relaunch();
        }
      }
    } catch (error) {
      console.error('Failed to install update:', error);
    } finally {
      setInstalling(false);
    }
  };

  // Check for updates on mount
  useEffect(() => {
    checkForUpdates();
  }, []);

  if (!updateInfo.available) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 border border-gray-700 text-white p-4 rounded-lg shadow-2xl max-w-sm backdrop-blur-sm">
      <div className="flex items-start gap-3">
        <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
        <div className="flex-1">
          <h3 className="font-medium text-white">Update Available</h3>
          <p className="text-sm text-gray-300 mt-1">
            Version {updateInfo.version} is ready to install
          </p>
          {updateInfo.notes && (
            <p className="text-xs text-gray-400 mt-2 line-clamp-2">{updateInfo.notes}</p>
          )}
        </div>
        <button
          onClick={installUpdate}
          disabled={installing}
          className="bg-white text-black px-3 py-1.5 rounded-md text-sm font-medium hover:bg-gray-100 disabled:opacity-50 transition-colors flex-shrink-0"
        >
          {installing ? (
            <span className="flex items-center gap-1">
              <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Installing
            </span>
          ) : (
            'Update'
          )}
        </button>
      </div>
    </div>
  );
}