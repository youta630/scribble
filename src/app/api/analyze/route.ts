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
        console.log('Starting markdown parsing...');
        console.log('Markdown preview:', markdown.substring(0, 500));
        
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
                console.log(`Saved section ${currentSection}:`, content.substring(0, 100));
              }
            }
            
            // 新しいセクションを開始
            const sectionTitle = trimmedLine.replace('## ', '').toLowerCase();
            console.log('Found section title:', sectionTitle);
            
            if (sectionTitle.includes('subject') || sectionTitle.includes('主題') || sectionTitle.includes('テーマ') || sectionTitle.includes('課題')) {
              currentSection = 'subject';
            } else if (sectionTitle.includes('background') || sectionTitle.includes('背景') || sectionTitle.includes('経緯') || sectionTitle.includes('きっかけ')) {
              currentSection = 'background';
            } else if (sectionTitle.includes('hypothesis') || sectionTitle.includes('仮説') || sectionTitle.includes('動機') || sectionTitle.includes('想定')) {
              currentSection = 'hypothesis';
            } else if (sectionTitle.includes('analysis') || sectionTitle.includes('分析') || sectionTitle.includes('検討') || sectionTitle.includes('考察')) {
              currentSection = 'analysis';
            } else if (sectionTitle.includes('decision') || sectionTitle.includes('決定') || sectionTitle.includes('結論') || sectionTitle.includes('判断')) {
              currentSection = 'decision';
            } else if (sectionTitle.includes('development') || sectionTitle.includes('発展') || sectionTitle.includes('応用') || sectionTitle.includes('展開')) {
              currentSection = 'development';
            } else if (sectionTitle.includes('insights') || sectionTitle.includes('洞察') || sectionTitle.includes('気付き') || sectionTitle.includes('学び')) {
              currentSection = 'insights';
            } else if (sectionTitle.includes('output') || sectionTitle.includes('成果') || sectionTitle.includes('結果') || sectionTitle.includes('アウトプット')) {
              currentSection = 'output';
            } else {
              currentSection = '';
            }
            console.log('Set current section to:', currentSection);
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
            console.log(`Saved final section ${currentSection}:`, content.substring(0, 100));
          }
        }

        console.log('Final sections:', {
          subject: sections.subject ? sections.subject.substring(0, 50) + '...' : 'EMPTY',
          background: sections.background ? sections.background.substring(0, 50) + '...' : 'EMPTY',
          analysis: sections.analysis ? sections.analysis.substring(0, 50) + '...' : 'EMPTY'
        });

        return sections;
      };

      const parsedResult = parseMarkdownToSummary(markdownContent);
      console.log('Parsed result sample:', {
        subject: parsedResult.subject ? 'HAS CONTENT' : 'EMPTY',
        background: parsedResult.background ? 'HAS CONTENT' : 'EMPTY'
      });
      
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