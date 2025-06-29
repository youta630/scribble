// ショートカットキー機能とフォーカス管理

export class ShortcutManager {
  private static inputRef: HTMLTextAreaElement | null = null;

  // 入力フィールドのrefを登録
  static registerInputRef(ref: HTMLTextAreaElement | null) {
    this.inputRef = ref;
  }

  // ウィンドウフォーカス時に入力フィールドにフォーカス
  static handleWindowFocus() {
    setTimeout(() => {
      if (this.inputRef) {
        this.inputRef.focus();
        this.inputRef.select(); // 既存のテキストを選択
      }
    }, 100); // 少し遅延させて確実にフォーカス
  }

  // Webアプリでショートカットイベントを設定
  static async setupWebShortcuts() {
    if (typeof window === 'undefined') return;
    
    // ウィンドウフォーカスイベントリスナー
    window.addEventListener('focus', this.handleWindowFocus);
    
    // アプリケーションがアクティブになった時のイベント
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.handleWindowFocus();
      }
    });

    // キーボードショートカットを設定
    document.addEventListener('keydown', (event) => {
      // Cmd+K (Mac) / Ctrl+K (Windows/Linux) で入力フィールドにフォーカス
      const isShortcut = (event.metaKey || event.ctrlKey) && event.key === 'k';
      
      if (isShortcut) {
        event.preventDefault();
        this.handleWindowFocus();
      }
    });

    console.log('Web shortcuts initialized');
  }

  // 新しいサマリーを開始するトリガー
  private static triggerNewSummary() {
    // フォーカスを入力フィールドに移す
    this.handleWindowFocus();
    
    // 既存のコンテンツをクリア（必要に応じて）
    if (this.inputRef) {
      this.inputRef.value = '';
      this.inputRef.focus();
    }
    
    // ページのサマリー開始関数があれば呼び出し
    if (typeof (window as any).startNewSummary === 'function') {
      (window as any).startNewSummary();
    }
  }


  // クリーンアップ
  static cleanup() {
    window.removeEventListener('focus', this.handleWindowFocus);
    this.inputRef = null;
  }
}