# Chat Summary - Thought Asset Analyzer

## 🎯 Project Overview
**"Transform conversations into thought assets"**

A structured AI application that analyzes conversations and transforms them into organized thought assets using an 8-category framework. Features Xcode-like 3-pane interface with local file system storage.

## 📋 Current Features

### 🔰 Input Function
- **Target**: Any conversation text (ChatGPT, Claude, etc.)
- **Usage**: Copy/paste conversation content into input field
- **Language Support**: Auto-detects input language (Japanese, English, Chinese, Korean)
- **UI**: Clean, minimal single-input form

### 🧾 Output Function - 8-Category Thought Asset Format
- **Format**: Structured display + Markdown export + Local file storage
- **8 Categories**:
  - 🎯 **Subject**: Main theme/topic of the conversation
  - 📋 **Background**: Why this conversation started, problem awareness
  - 💭 **Hypothesis & Motivation**: User's assumptions, starting thoughts
  - 🔍 **Analysis**: Brainstormed content, comparisons, deep dives
  - ✅ **Decision**: Final thoughts, conclusions, actions to take
  - 🚀 **Development**: Applications to other areas, derivative ideas
  - 💡 **Insights**: Changes in thinking, self-understanding, emotions
  - 📤 **Output**: Actions taken or deliverables generated

### 📁 File System Integration
- **Storage**: Local folder selection using File System Access API
- **Persistence**: Summaries saved as individual .md files
- **Fallback**: localStorage + download for unsupported browsers
- **Format**: `YYYY-MM-DD-{id}.md` filename pattern
- **Metadata**: `summaries.json` for indexing and quick access

### 🎨 Xcode-like Interface
- **3-Pane Layout**: Left sidebar (file tree) + Center (editor) + Right (preview)
- **View Modes**: Summary view ↔ Markdown view toggle
- **Preview Panel**: Expandable markdown preview on right side
- **Top Toolbar**: View controls, download, folder settings, help

## 🧱 Technical Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI**: Xcode-inspired 3-pane developer tool interface

### Backend
- **API**: Next.js API Routes
- **LLM**: Gemini 2.5 Flash API
- **Prompt**: English-based with multi-language output support
- **Storage**: File System Access API + localStorage fallback

### Key Components
- **Main Page**: 3-pane layout with initialization logic
- **SummarySidebar**: Left panel file tree-like summary browser
- **SummaryOutput**: Center panel structured 8-category display
- **MarkdownPreview**: Right panel raw markdown preview
- **FolderSelector**: Modal for initial folder setup
- **FileSystemManager**: Local file operations handler

## 🎨 UI/UX Design

### Current Interface (Xcode-like 3-Pane)
```
┌─────────────────────────────────────────────────────────────┐
│ [≡] Summaries    [Summary|Markdown] [→] [↓] [📁] [?]         │
├─────────────────────────────────────────────────────────────┤
│ [Sidebar]     │ Main Content        │ [Markdown Preview]    │
│ 📄 2025-06-27 │ 🎯 Subject          │ # Thought Asset       │
│ 📄 2025-06-26 │ 📋 Background       │ ## 🎯 Subject        │
│ 📄 2025-06-25 │ 💭 Hypothesis       │ Main theme...         │
│              │ 🔍 Analysis         │                       │
│              │ ✅ Decision         │ ## 📋 Background     │
│              │ 🚀 Development      │ Context...            │
│              │ 💡 Insights         │                       │
│              │ 📤 Output           │                       │
└─────────────────────────────────────────────────────────────┘
```

### Features
- **Collapsible Sidebar**: File tree-like summary browser
- **View Mode Toggle**: Summary ↔ Markdown view
- **Expandable Preview**: Right panel markdown preview
- **Folder Management**: Change storage location anytime
- **Usage Limits**: 3 free summaries, then upgrade prompt
- **Language Detection**: Auto-responds in input language

## 📁 Project Structure

```
scribble/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Main 3-pane application
│   │   ├── layout.tsx            # Root layout
│   │   └── api/
│   │       └── analyze/route.ts  # LLM processing API
│   ├── components/
│   │   ├── SummarySidebar.tsx    # Left panel file browser
│   │   ├── SummaryOutput.tsx     # Center panel 8-category display
│   │   ├── MarkdownPreview.tsx   # Right panel preview
│   │   ├── FolderSelector.tsx    # Folder selection modal
│   │   ├── UrlInput.tsx          # Text input form
│   │   ├── UsageCounter.tsx      # Usage tracking
│   │   ├── UsageGuide.tsx        # How-to instructions
│   │   └── LoadingSpinner.tsx    # Loading indicator
│   └── lib/
│       ├── llm.ts               # Gemini API + language detection
│       ├── fileSystem.ts        # File System Access API manager
│       └── types.ts             # 8-category TypeScript definitions
└── package.json
```

## 🔧 Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Type checking
npm run type-check

# Linting
npm run lint
```

## 💰 Business Model
- **Free Tier**: 3 summaries
- **Paid Tier**: Unlimited summaries for $10/month
- **Target**: Knowledge workers who want to organize thought processes

## 📊 Implementation Status

### ✅ Completed Features
1. **8-Category Thought Asset Framework**: Subject, Background, Hypothesis, Analysis, Decision, Development, Insights, Output
2. **Multi-language Support**: Auto-detects input language, responds accordingly
3. **Xcode-like 3-Pane Interface**: Sidebar + Editor + Preview layout
4. **Local File System Storage**: Folder selection with File System Access API
5. **Markdown Generation**: Export to .md files with proper formatting
6. **Fallback Storage**: localStorage + download for unsupported browsers
7. **View Mode Toggle**: Summary display ↔ Raw markdown view
8. **Expandable Preview**: Right panel for markdown preview
9. **Folder Management**: Change storage location anytime
10. **Usage Limits**: 3 free summaries with upgrade prompt

### 🚀 How to Use
1. **First Run**: Select folder for saving summaries (or skip for browser storage)
2. **Create Analysis**: Paste conversation text → Click "Summarize"
3. **Auto-save**: Summary automatically saved as .md file in selected folder
4. **Browse**: Use left sidebar to select and view saved summaries
5. **View Modes**: Toggle between structured view and raw markdown
6. **Preview**: Expand right panel for markdown preview
7. **Export**: Download individual summaries as .md files
8. **Manage**: Change storage folder anytime via toolbar

### 🎯 User Flow
1. **Setup**: Choose storage folder or use browser storage
2. **Input**: Paste conversation content (any language)
3. **Process**: LLM analyzes and structures into 8 categories
4. **Save**: Auto-saved to selected folder as .md file
5. **Browse**: Navigate summaries via left sidebar
6. **Review**: View in structured format or raw markdown
7. **Export**: Download or access files directly from folder

### 💡 Key Design Decisions
- **8-Category Framework**: Comprehensive thought asset structure
- **English LLM Prompt**: Better consistency, with multi-language output
- **Local File Storage**: Privacy-first, no server dependency
- **Xcode-like Interface**: Familiar developer tool experience
- **Auto-save**: Reduces friction, maintains thought flow
- **File System API**: Direct folder access, true persistence
- **Graceful Fallback**: Works on all browsers with localStorage

### 🔄 Data Migration
- **Old Format**: 6-category (mainTheme, developedIdeas, hesitationPoints, finalConclusion, nextActions, conversationStory)
- **New Format**: 8-category (subject, background, hypothesis, analysis, decision, development, insights, output)
- **Compatibility**: File system handles both formats via markdown parsing

---

**Status**: Production Ready - Thought Asset Version
**Last Updated**: 2025-06-27
**Version**: 3.0 (8-Category Thought Asset + File System + Xcode Interface)