'use client';

import { ThoughtSummary } from '@/lib/types';

interface SummarySidebarProps {
  summaries: ThoughtSummary[];
  selectedSummary: ThoughtSummary | null;
  onSelectSummary: (summary: ThoughtSummary) => void;
  expanded: boolean;
  onToggleExpanded: () => void;
  onExportSummary: (summary: ThoughtSummary) => void;
}

export default function SummarySidebar({ 
  summaries, 
  selectedSummary, 
  onSelectSummary,
  expanded,
  onToggleExpanded,
  onExportSummary
}: SummarySidebarProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const truncateText = (text: string, maxLength: number = 50) => {
    if (!text) return 'Untitled';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <>
      {/* Toggle Button - Always visible */}
      <div className={`fixed top-4 z-20 transition-all duration-300 ${expanded ? 'left-4' : 'left-4'}`}>
        <button
          onClick={onToggleExpanded}
          className="w-10 h-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors shadow-md"
          title={expanded ? "Hide summaries" : "Show summaries"}
        >
          <svg 
            className={`w-5 h-5 text-gray-600 transition-transform ${expanded ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Sidebar */}
      <div className={`${expanded ? 'w-80' : 'w-0'} bg-gray-50 border-r border-gray-200 h-screen overflow-hidden transition-all duration-300 ease-in-out`}>
        <div className="w-80 p-4">
          {/* Top margin for toggle button space */}
          <div className="mt-16"></div>


        {/* Summaries List */}
        <div className="space-y-2">
          {summaries.length === 0 ? (
            <div className="text-center py-8 text-gray-900 text-sm">
              No summaries yet
            </div>
          ) : (
            summaries.map((summary) => (
              <div
                key={summary.id}
                className={`group p-3 rounded-lg transition-colors ${
                  selectedSummary?.id === summary.id
                    ? 'bg-white border border-gray-200 shadow-sm'
                    : 'hover:bg-gray-100'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div 
                    className="flex-1 cursor-pointer"
                    onClick={() => onSelectSummary(summary)}
                  >
                    <p className="text-xs text-gray-600">
                      {summary.createdAt ? formatDate(summary.createdAt) : 'Unknown date'}
                    </p>
                    <h3 className="font-medium text-gray-900 text-sm leading-tight">
                      {truncateText(summary.title || summary.subject || 'Untitled')}
                    </h3>
                  </div>
                  
                  {/* Save Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onExportSummary(summary);
                    }}
                    className="opacity-0 group-hover:opacity-100 ml-2 p-1.5 text-gray-400 hover:text-gray-600 transition-all"
                    title="Download this summary"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        </div>
      </div>
    </>
  );
}