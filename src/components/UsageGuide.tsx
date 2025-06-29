export default function UsageGuide() {
  return (
    <div className="max-w-md mx-auto space-y-6">
      <h3 className="text-lg font-light text-gray-700 mb-6">How to Use</h3>
      
      <div className="space-y-4 text-sm text-gray-600">
        <div className="flex items-start space-x-3">
          <span className="bg-gray-900 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">1</span>
          <div>
            <p className="font-medium text-gray-900">Open ChatGPT webpage</p>
            <p>Click the shared link to open ChatGPT page</p>
          </div>
        </div>
        
        <div className="flex items-start space-x-3">
          <span className="bg-gray-900 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">2</span>
          <div>
            <p className="font-medium text-gray-900">Select all and copy</p>
            <p>
              <kbd className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">Cmd + A</kbd> to select all → 
              <kbd className="bg-gray-100 px-1.5 py-0.5 rounded text-xs ml-1">Cmd + C</kbd> to copy
            </p>
          </div>
        </div>
        
        <div className="flex items-start space-x-3">
          <span className="bg-gray-900 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">3</span>
          <div>
            <p className="font-medium text-gray-900">Paste and summarize</p>
            <p>Paste into the input field above and click &quot;Summarize&quot;</p>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-50 rounded-lg p-4 mt-6">
        <p className="text-xs text-gray-500">
          <span className="font-medium">💡 Tip:</span>
          Don&apos;t worry about extra content like sidebars. AI will automatically extract only the chat conversation.
        </p>
      </div>
    </div>
  );
}