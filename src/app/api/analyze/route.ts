import { NextRequest, NextResponse } from 'next/server';
import { summarizeText } from '@/lib/llm';
import { ApiResponse, extractTitleFromMarkdown } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'No text input provided'
      }, { status: 400 });
    }

    // テキスト要約
    try {
      const markdownContent = await summarizeText(text);
      
      // Markdownテキストから8カテゴリを抽出
      const parseMarkdownToSummary = (markdown: string) => {
        const sections = {
          subject: '',
          background: '',
          hypothesis: '',
          analysis: '',
          decision: '',
          development: '',
          insights: '',
          output: ''
        };

        const lines = markdown.split('\n');
        let currentSection = '';
        let currentContent: string[] = [];

        for (const line of lines) {
          const trimmedLine = line.trim();
          
          // H2見出しをチェック
          if (trimmedLine.startsWith('## ')) {
            // 前のセクションを保存
            if (currentSection && currentContent.length > 0) {
              const content = currentContent.join('\n').trim();
              if (content) {
                (sections as any)[currentSection] = content;
              }
            }
            
            // 新しいセクションを開始
            const sectionTitle = trimmedLine.replace('## ', '').toLowerCase();
            if (sectionTitle.includes('subject') || sectionTitle.includes('主題')) {
              currentSection = 'subject';
            } else if (sectionTitle.includes('background') || sectionTitle.includes('背景')) {
              currentSection = 'background';
            } else if (sectionTitle.includes('hypothesis') || sectionTitle.includes('仮説')) {
              currentSection = 'hypothesis';
            } else if (sectionTitle.includes('analysis') || sectionTitle.includes('分析')) {
              currentSection = 'analysis';
            } else if (sectionTitle.includes('decision') || sectionTitle.includes('決定')) {
              currentSection = 'decision';
            } else if (sectionTitle.includes('development') || sectionTitle.includes('発展')) {
              currentSection = 'development';
            } else if (sectionTitle.includes('insights') || sectionTitle.includes('洞察')) {
              currentSection = 'insights';
            } else if (sectionTitle.includes('output') || sectionTitle.includes('成果')) {
              currentSection = 'output';
            } else {
              currentSection = '';
            }
            currentContent = [];
          } else if (currentSection && trimmedLine) {
            currentContent.push(line);
          }
        }

        // 最後のセクションを保存
        if (currentSection && currentContent.length > 0) {
          const content = currentContent.join('\n').trim();
          if (content) {
            (sections as any)[currentSection] = content;
          }
        }

        return sections;
      };

      const parsedResult = parseMarkdownToSummary(markdownContent);
      
      return NextResponse.json({
        success: true,
        subject: parsedResult.subject || 'Conversation Analysis',
        background: parsedResult.background,
        hypothesis: parsedResult.hypothesis,
        analysis: parsedResult.analysis,
        decision: parsedResult.decision,
        development: parsedResult.development,
        insights: parsedResult.insights,
        output: parsedResult.output
      });
    } catch (error) {
      console.error('Text processing error:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to process text'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Server error occurred'
    }, { status: 500 });
  }
}