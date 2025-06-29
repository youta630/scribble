'use client';

import { useState, useEffect } from 'react';
import { fileSystemManager } from '@/lib/fileSystem';

export default function BrowserSupportInfo() {
  const [supportInfo, setSupportInfo] = useState<{
    supported: boolean;
    browser: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    const info = fileSystemManager.getBrowserSupportInfo();
    setSupportInfo(info);
  }, []);

  if (!supportInfo) return null;

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm border border-gray-100">
      <p className="text-xs font-medium text-gray-900 whitespace-nowrap">
        {supportInfo.browser} {supportInfo.supported ? '✓' : '•'} ファイル保存{supportInfo.supported ? '対応' : '非対応'}
      </p>
    </div>
  );
}