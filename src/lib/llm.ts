import { GoogleGenerativeAI } from '@google/generative-ai';

const getApiKey = (): string => {
  const apiKey = process.env.GEMINI_API_KEY || '';
  console.log('API Key check:', apiKey ? `Found (${apiKey.substring(0, 10)}...)` : 'NOT FOUND');
  return apiKey;
};

const genAI = new GoogleGenerativeAI(getApiKey());

export async function summarizeText(inputText: string): Promise<string> {
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.5-flash',
    generationConfig: {
      maxOutputTokens: 8192,
    }
  });

  // Detect the primary language of the input text
  const detectLanguage = (text: string): string => {
    const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/;
    const koreanRegex = /[\u3131-\uD79D]/;
    const chineseRegex = /[\u4E00-\u9FFF]/;
    
    if (japaneseRegex.test(text)) return 'ja';
    if (koreanRegex.test(text)) return 'ko';
    if (chineseRegex.test(text)) return 'zh';
    return 'en';
  };

  const language = detectLanguage(inputText);

  
const prompt = `
You are a structured AI that transforms user conversations into "thought assets."

Your task:
Read the following conversation log and extract only the essential, structured thinking from it.

Text:
${inputText}

Instructions:
- Organize the conversation using the 8-label thinking framework described below  
- Remove casual conversation, greetings, off-topic remarks, and social pleasantries  
- Use reasoning to infer implied intent or emotion when helpful  
- Do NOT simply copy/paste: summarize, rephrase, or compress with clarity  
- Do NOT force all categories to be filled — leave as "" if not applicable  
- Output categories in logical or chronological order (not fixed)  
- Use numbering (1., 2., etc.) for multiple items within a category  
- If the chat produces concrete artefacts (file tree, code, specs), treat them as **Output** when accepted, or as **Analysis** while still under discussion  
- Prefix AI-generated ideas or statements with **[AI]** (🤖).  
  Optionally prefix user-origin ideas with **[User]** (🧑).  
- Do NOT output JSON, code-blocks, or any template text below — return clean Markdown only

### 🔍 AI-Suggestion & Perspective-Shift Rules
1. **AI-Suggestion extraction**  
   - Quote or paraphrase an AI reply as an **[AI]** bullet when it  
     a) shifts the user’s viewpoint,  
     b) clarifies or reframes a hypothesis, or  
     c) triggers a decision point.  
2. **Quote vs. paraphrase**  
   - If one or two lines convey the point, quote directly.  
   - If three or more consecutive AI replies form one logical progression, compress them into a single summarized bullet.  
3. **Detect perspective shifts / tacit insights**  
   - When the user reacts with cues like *“Oh, that makes sense,” “Aha,” “I hadn’t seen it that way,”* mark the preceding AI reply as an **[AI] Suggestion** and record the shift itself under **Insights**.  
4. **Placement (mode A)**  
   - Insert each **[AI]** bullet inside the relevant category (Hypothesis, Analysis, Decision, Insights, etc.). Do not create a standalone section.

⚠️ Category-Specific Guidelines  
For every category, mark transformational AI responses with **[AI]** so the reader sees how the AI guided the thinking.

(subject)  
- Capture the central purpose or theme of the conversation.  
- Do NOT just extract keywords — think: *“What was this conversation really about?”*

(background)  
- Include context from earlier or adjacent messages if needed.  
- Answer: *“Why did this conversation start?”* or *“What prompted it?”*

(hypothesis)  
- Include assumptions, motivations, questions, even emotional triggers.  
- Early, vague, or feeling-based hypotheses are acceptable.

(analysis)  
- Include all meaningful exploration, ideation, technical discussions, trial/error.  
- If a **file tree / code snippet / tech-stack** is proposed *but not yet adopted*, place it here.

(decision)  
- Only include if something was clearly decided.  
- If undecided or paused, leave blank or write “Deferred.”

(development)  
- Future-looking ideas, spin-offs, or thoughts for reuse in another context.  
- Treat this as the **parking lot**; once adopted, promote the item to Decision (summary) and Output (details).

(insights)  
- Realizations, learnings, or emotional takeaways.  
- Include perspective shifts; tag those induced by AI with **[AI]**.

(output)  
- Tangible output: files written, decisions made, tasks assigned, code written, diagrams generated, etc.  
- If the conversation agreed to adopt a specific file tree, tech stack, or code block, place the full snippet or a link here.

Output Format:  
Return ONLY a Markdown document using the 8-category framework.  
Use H2 headings (## Subject, ## Background, …), keep categories non-empty only, and present them in logical or chronological order.

Respond in ${language === 'ja' ? 'Japanese' : language === 'en' ? 'English' : 'the same language as the input'}.
`;
  try {
    console.log('Sending prompt to Gemini API...');
    console.log('Input length:', inputText.length);
    console.log('API Key available:', !!process.env.GEMINI_API_KEY);
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('Received response from Gemini API');
    console.log('Response length:', text.length);
    console.log('Response preview:', text.substring(0, 200));

    // Markdownコンテンツをそのまま返す
    return text.trim();

  } catch (error) {
    console.error('LLM analysis error:', error);
    
    // フォールバック: エラーメッセージをMarkdown形式で返す
    return `# Error

An error occurred during thought analysis.

**Error Details:** ${error instanceof Error ? error.message : 'Unknown error'}

Please try again or check your input.`;
  }
}