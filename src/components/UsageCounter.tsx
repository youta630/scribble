'use client';

import { useState, useEffect, useCallback } from 'react';
import { UsageManager } from '@/lib/usage';

interface UsageCounterProps {
  onLimitReached: () => void;
  onUsageUpdate: (count: number) => void;
}

export default function UsageCounter({ onLimitReached, onUsageUpdate }: UsageCounterProps) {
  const [usageCount, setUsageCount] = useState(0);
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const FREE_LIMIT = 999;

  // 初期化：使用回数とプレミアムステータスを取得
  useEffect(() => {
    const initializeUsage = async () => {
      try {
        // 使用回数を取得
        const usage = await UsageManager.getUsageCount();
        setUsageCount(usage.count);
        onUsageUpdate(usage.count);

        // プレミアムステータスを確認
        const premium = await UsageManager.isPremiumUser();
        setIsPremium(premium);

        if (usage.isLimitReached && !premium) {
          onLimitReached();
        }
      } catch (error) {
        console.error('Failed to initialize usage:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeUsage();
  }, [onLimitReached, onUsageUpdate]);

  // 使用回数をインクリメント
  const incrementUsage = useCallback(async () => {
    if (isPremium) {
      // プレミアムユーザーは制限なし
      return;
    }

    try {
      const usage = await UsageManager.incrementUsage();
      setUsageCount(usage.count);
      onUsageUpdate(usage.count);
      
      if (usage.isLimitReached) {
        onLimitReached();
      }
    } catch (error) {
      console.error('Failed to increment usage:', error);
    }
  }, [isPremium, onUsageUpdate, onLimitReached]);

  useEffect(() => {
    // グローバル関数として公開（page.tsxから呼ばれる）
    (window as any).incrementSummaryUsage = incrementUsage;
  }, [incrementUsage]);

  // アップグレード処理
  const handleUpgrade = async () => {
    setIsLoading(true);

    try {
      const userId = UsageManager.getUserId();
      
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          email: undefined, // 必要に応じてユーザーのメールアドレスを取得
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();
      
      if (url) {
        // Stripe Checkoutページにリダイレクト
        window.location.href = url;
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      alert('Failed to start checkout process. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center">
        <div className="inline-block px-3 py-1 bg-gray-100 rounded-full">
          <p className="text-xs text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // サブスクリプション管理処理
  const handleManageSubscription = async () => {
    try {
      const userId = UsageManager.getUserId();
      
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error('Failed to create portal session');
      }

      const { url } = await response.json();
      
      if (url) {
        // Stripe Portalページにリダイレクト
        window.location.href = url;
      }
    } catch (error) {
      console.error('Portal error:', error);
      alert('Failed to open subscription management. Please try again.');
    }
  };

  // プレミアムユーザーの場合
  if (isPremium) {
    return (
      <div className="text-center space-y-2">
        <div className="inline-block px-3 py-1 bg-green-100 rounded-full">
          <p className="text-xs text-green-600">
            ✓ Premium: Unlimited summaries
          </p>
        </div>
        <button
          onClick={handleManageSubscription}
          className="text-xs text-gray-700 hover:text-gray-900 underline transition-colors"
        >
          Manage subscription
        </button>
      </div>
    );
  }

  const remainingCount = Math.max(0, FREE_LIMIT - usageCount);
  const isLimitReached = usageCount >= FREE_LIMIT;

  return (
    <div className="text-center">
      {!isLimitReached ? (
        <div className="inline-block px-3 py-1 bg-gray-100 rounded-full">
          <p className="text-xs text-gray-900">
            Free: {remainingCount}/{FREE_LIMIT} remaining
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-900">
            You&apos;ve used all {FREE_LIMIT} free summaries
          </p>
          <button
            className="bg-black text-white px-6 py-2 rounded-lg text-sm hover:bg-gray-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            onClick={handleUpgrade}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Upgrade to Unlimited ($10/month)'}
          </button>
        </div>
      )}
    </div>
  );
}