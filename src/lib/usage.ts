// UUID生成とサーバーサイド使用回数管理

export class UsageManager {
  private static readonly USER_ID_KEY = 'chat-summary-user-id';
  private static readonly USAGE_CACHE_KEY = 'chat-summary-usage-cache';
  private static readonly FREE_LIMIT = 999;

  // ユーザーIDを取得または生成
  static getUserId(): string {
    if (typeof window === 'undefined') return '';
    
    let userId = localStorage.getItem(this.USER_ID_KEY);
    if (!userId) {
      userId = this.generateUUID();
      localStorage.setItem(this.USER_ID_KEY, userId);
    }
    return userId;
  }

  // UUID生成
  private static generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // サーバーから使用回数を取得
  static async getUsageCount(): Promise<{ count: number; limit: number; isLimitReached: boolean }> {
    const userId = this.getUserId();
    if (!userId) {
      return { count: 0, limit: this.FREE_LIMIT, isLimitReached: false };
    }

    try {
      const response = await fetch('/api/usage', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': userId,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch usage');
      }

      const data = await response.json();
      
      // キャッシュに保存
      if (typeof window !== 'undefined') {
        localStorage.setItem(this.USAGE_CACHE_KEY, JSON.stringify({
          count: data.count,
          timestamp: Date.now()
        }));
      }

      return {
        count: data.count,
        limit: this.FREE_LIMIT,
        isLimitReached: data.count >= this.FREE_LIMIT
      };
    } catch (error) {
      console.error('Failed to get usage count:', error);
      
      // フォールバック：キャッシュから読み取り
      return this.getCachedUsage();
    }
  }

  // 使用回数をインクリメント
  static async incrementUsage(): Promise<{ count: number; limit: number; isLimitReached: boolean }> {
    const userId = this.getUserId();
    if (!userId) {
      throw new Error('User ID not available');
    }

    try {
      const response = await fetch('/api/usage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': userId,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to increment usage');
      }

      const data = await response.json();
      
      // キャッシュを更新
      if (typeof window !== 'undefined') {
        localStorage.setItem(this.USAGE_CACHE_KEY, JSON.stringify({
          count: data.count,
          timestamp: Date.now()
        }));
      }

      return {
        count: data.count,
        limit: this.FREE_LIMIT,
        isLimitReached: data.count >= this.FREE_LIMIT
      };
    } catch (error) {
      console.error('Failed to increment usage:', error);
      throw error;
    }
  }

  // キャッシュされた使用回数を取得（フォールバック用）
  private static getCachedUsage(): { count: number; limit: number; isLimitReached: boolean } {
    if (typeof window === 'undefined') {
      return { count: 0, limit: this.FREE_LIMIT, isLimitReached: false };
    }

    try {
      const cached = localStorage.getItem(this.USAGE_CACHE_KEY);
      if (cached) {
        const { count, timestamp } = JSON.parse(cached);
        // 24時間以内のキャッシュのみ有効
        if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
          return {
            count: count || 0,
            limit: this.FREE_LIMIT,
            isLimitReached: (count || 0) >= this.FREE_LIMIT
          };
        }
      }
    } catch (error) {
      console.error('Failed to read cached usage:', error);
    }

    return { count: 0, limit: this.FREE_LIMIT, isLimitReached: false };
  }

  // プレミアムユーザーかどうかチェック
  static async isPremiumUser(): Promise<boolean> {
    const userId = this.getUserId();
    if (!userId) return false;

    try {
      const response = await fetch('/api/premium', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': userId,
        },
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.isPremium || false;
    } catch (error) {
      console.error('Failed to check premium status:', error);
      return false;
    }
  }
}