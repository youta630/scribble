import { ThoughtSummary, generateMarkdownText } from '@/lib/types';

interface MarkdownPreviewProps {
  summary: ThoughtSummary;
}

export default function MarkdownPreview({ summary }: MarkdownPreviewProps) {
  // 古い形式のサマリーを新形式に変換
  const displayTitle = summary.title || summary.subject || 'Untitled';
  const displayContent = summary.content || generateMarkdownText(summary);
  
  return (
    <div className="h-full bg-white overflow-auto">
      <div className="p-8 max-w-4xl mx-auto">
        <div className="mb-6 pb-4 border-b border-gray-200">
          <h1 className="text-2xl font-light text-gray-900">{displayTitle}</h1>
          <div className="text-sm text-gray-500 mt-2">
            {new Date(summary.createdAt).toLocaleDateString()}
          </div>
        </div>
        
        <div className="prose prose-gray max-w-none">
          <pre className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed font-normal">
            {displayContent}
          </pre>
        </div>
      </div>
    </div>
  );
}