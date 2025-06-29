# 🧠 Chat要約メモアプリ

**「AIとの会話を、思考資産に。」**

ChatGPTの共有リンクから対話内容を要約・構造化し、思考ログとして保存・活用するアプリケーション。

## ✨ 主な機能

- 📥 **ChatGPT共有リンク解析**: `https://chat.openai.com/share/xxxxx` 形式のリンクから対話を抽出
- 🧠 **思考構造化**: AI（Gemini）による対話内容の要約・分類
- 📊 **6つの観点での分析**:
  - 🧠 思考の主題
  - 💡 発展したアイデア
  - 🔀 迷ったポイント
  - 🎯 最終的な結論
  - 🔁 次のアクション
  - 🕒 会話のストーリー
- 📝 **Markdownエクスポート**: 分析結果をMarkdown形式でダウンロード
- ✏️ **編集機能**: 生成された要約を後から編集可能
- 🔗 **複数リンク対応**: 関連するチャットの関連性・矛盾点も分析

## 🚀 セットアップ

### 必要な環境
- Node.js 18.0以上
- npm または yarn

### インストール

1. リポジトリをクローン
```bash
git clone <repository-url>
cd scribble
```

2. 依存関係をインストール
```bash
npm install
```

3. 環境変数を設定
```bash
cp .env.local.example .env.local
```

`.env.local` ファイルを編集してGemini API キーを設定:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

4. 開発サーバーを起動
```bash
npm run dev
```

アプリケーションは `http://localhost:3000` で起動します。

## 📁 プロジェクト構造

```
scribble/
├── src/
│   ├── app/
│   │   ├── page.tsx          # メイン画面
│   │   ├── layout.tsx        # レイアウト
│   │   ├── globals.css       # グローバルスタイル
│   │   └── api/
│   │       └── analyze/route.ts  # 分析API
│   ├── components/
│   │   ├── UrlInput.tsx      # URL入力フォーム
│   │   ├── SummaryOutput.tsx # 要約結果表示
│   │   └── LoadingSpinner.tsx # ローディング
│   ├── lib/
│   │   ├── scraper.ts        # スクレイピング処理
│   │   ├── llm.ts           # LLM処理
│   │   └── types.ts         # TypeScript型定義
│   └── utils/
│       └── markdown.ts       # Markdown変換
├── claude.md                 # 詳細仕様書
├── package.json
└── README.md
```

## 🛠️ 使い方

1. **ChatGPT共有リンクを取得**
   - ChatGPTで対話を行った後、共有リンクを作成
   - リンクをコピー

2. **アプリでリンクを入力**
   - URL入力フォームにリンクを貼り付け
   - 複数のリンクがある場合は改行で区切って入力

3. **要約実行**
   - 「要約実行」ボタンをクリック
   - AIが対話内容を分析・構造化

4. **結果の確認・編集**
   - 生成された思考ログを確認
   - 必要に応じて編集モードで修正

5. **エクスポート**
   - 「Markdown出力」ボタンでファイルをダウンロード

## 🔧 技術スタック

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Scraping**: Puppeteer
- **AI**: Google Gemini API
- **Deployment**: Vercel対応

## ⚙️ API仕様

### POST /api/analyze

ChatGPT共有リンクを分析して思考ログを生成

**Request Body:**
```json
{
  "urls": ["https://chat.openai.com/share/xxxxx"],
  "multipleMode": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "mainTheme": "思考の主題",
    "developedIdeas": ["アイデア1", "アイデア2"],
    "hesitationPoints": ["迷い1", "迷い2"],
    "finalConclusion": "最終結論",
    "nextActions": ["アクション1", "アクション2"],
    "conversationStory": "会話のストーリー"
  }
}
```

## 🚧 開発ステータス

### ✅ 完了
- [x] Next.jsプロジェクトセットアップ
- [x] 基本UI実装
- [x] ChatGPT共有リンクスクレイピング
- [x] Gemini API統合
- [x] 基本要約機能

### 🔄 開発中
- [ ] 複数リンク関連性分析
- [ ] エラーハンドリング強化
- [ ] UI/UX改善

### 📋 今後の予定
- [ ] データ永続化
- [ ] 検索・フィルタ機能
- [ ] スマホアプリ化
- [ ] 多ユーザー対応

## 🤝 貢献

プルリクエストやイシューの報告を歓迎します。

## 📄 ライセンス

MIT License

## 📞 サポート

ご質問やサポートが必要な場合は、イシューを作成してください。