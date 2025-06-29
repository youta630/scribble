'use client';

import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        
        {/* Header */}
        <header className="flex items-center justify-between mb-16">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <span className="text-black font-bold text-lg">S</span>
            </div>
            <span className="text-xl font-semibold">Scribble</span>
          </div>
        </header>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          
          {/* Left Column - Content */}
          <div>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
              Transform chat conversations into structured sets of thinking
            </h1>
            
            <p className="text-lg text-gray-300 mb-8 leading-relaxed">
              Summarize your chats with ChatGPT/Claude by organizing them into an easy-to-review set of eight categories. Clarify your thinking process and efficiently save your insights.
            </p>

            {/* Get Started Button */}
            <Link
              href="/app"
              className="w-full bg-white text-black font-medium py-4 px-6 rounded-lg hover:bg-gray-100 transition-colors mb-4 block text-center"
            >
              Get started for free
            </Link>
            
            <div className="flex items-center space-x-1 text-sm text-gray-400">
              <span className="w-4 h-4 bg-white rounded-sm flex items-center justify-center">
                <span className="text-black font-bold text-xs">S</span>
              </span>
              <span>Scribble</span>
            </div>
          </div>

          {/* Right Column - Feature List */}
          <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
            <h3 className="text-lg font-semibold mb-6">Transform conversations into insights</h3>
            
            <div className="space-y-4">
              {[
                { icon: '🎯', title: 'Subject', desc: 'Extract the key theme' },
                { icon: '📋', title: 'Background', desc: 'Understand the context and starting point' },
                { icon: '💭', title: 'Hypothesis', desc: 'Identify the assumptions and initial thinking' },
                { icon: '🔍', title: 'Analysis', desc: 'Break down the discussed solutions' },
                { icon: '✅', title: 'Decision', desc: 'Capture the final thoughts and decisions' },
                { icon: '🚀', title: 'Development', desc: 'Explore applications to other areas' },
                { icon: '💡', title: 'Insights', desc: 'Understand the changes in thinking' },
                { icon: '📤', title: 'Output', desc: 'Record the actions taken or deliverables' }
              ].map((item, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <span className="text-lg">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white">{item.title}</div>
                    <div className="text-sm text-gray-400">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-700">
              <Link 
                href="/app"
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                Read the docs →
              </Link>
            </div>
          </div>

        </div>

        {/* Stats */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center space-x-2 text-sm text-gray-400">
            <span>Free to use</span>
            <span>•</span>
            <span>Web-based</span>
            <span>•</span>
            <span>Privacy focused</span>
          </div>
        </div>

      </div>
    </div>
  );
}