export default function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Analyzing...
        </h3>
        <p className="text-sm text-gray-600">
          Summarizing and structuring your chat conversation
        </p>
      </div>
    </div>
  );
}