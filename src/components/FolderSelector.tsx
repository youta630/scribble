'use client';

import { useState } from 'react';
import { fileSystemManager } from '@/lib/fileSystem';

interface FolderSelectorProps {
  onFolderSelected: () => void;
  onSkip: () => void;
}

export default function FolderSelector({ onFolderSelected, onSkip }: FolderSelectorProps) {
  const [isSelecting, setIsSelecting] = useState(false);

  const handleSelectFolder = async () => {
    setIsSelecting(true);
    
    try {
      const success = await fileSystemManager.selectFolder();
      if (success) {
        onFolderSelected();
      } else {
        // User cancelled or browser doesn't support it
        console.log('Folder selection cancelled or not supported');
      }
    } catch (error) {
      console.log('Folder selection cancelled');
    } finally {
      setIsSelecting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md mx-4 shadow-xl">
        <div className="text-center">
          {/* Icon */}
          <div className="w-16 h-16 mx-auto mb-6 bg-gray-100 rounded-lg flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-5l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </div>

          <h2 className="text-xl font-medium text-gray-900 mb-3">
            Choose Storage Location
          </h2>
          
          <p className="text-gray-600 text-sm mb-6 leading-relaxed">
            Select a folder where your chat summaries will be saved as Markdown files. 
            This keeps your data private and accessible on your device.
          </p>

          <div className="space-y-3">
            <button
              onClick={handleSelectFolder}
              disabled={isSelecting}
              className="w-full px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isSelecting ? 'Opening folder selector...' : 'Select Folder'}
            </button>
            
            <button
              onClick={onSkip}
              disabled={isSelecting}
              className="w-full px-4 py-3 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              Skip (Use browser storage)
            </button>
          </div>

          <div className="mt-4 text-xs text-gray-500">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2z" clipRule="evenodd" />
              </svg>
              <span>Your data stays on your device</span>
            </div>
            <p>Compatible with Chrome, Edge, and recent browsers</p>
          </div>
        </div>
      </div>
    </div>
  );
}