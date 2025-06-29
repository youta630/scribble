// Stripe課金システム統合

import Stripe from 'stripe';

// サーバーサイド用Stripe初期化
export function getStripe(): Stripe | null {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('STRIPE_SECRET_KEY is not configured');
    return null;
  }

  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

// フロントエンド用Stripe設定
export function getStripePublishableKey(): string {
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
}

// 商品設定
export const STRIPE_CONFIG = {
  PREMIUM_PRICE_ID: process.env.STRIPE_PREMIUM_PRICE_ID || 'price_1XXXXXXX',
  PREMIUM_MONTHLY_PRICE: 10, // $10/month
  CURRENCY: 'usd',
  TRIAL_PERIOD_DAYS: 0, // 無料トライアルなし
};

// Stripeカスタマー管理
export class StripeManager {
  private stripe: Stripe | null;

  constructor() {
    this.stripe = getStripe();
  }

  // カスタマーを作成または取得
  async createOrGetCustomer(userId: string, email?: string): Promise<string | null> {
    if (!this.stripe) return null;

    try {
      // 既存のカスタマーを検索（metadataでフィルタリングは後で行う）
      const existingCustomers = await this.stripe.customers.list({
        limit: 100, // 多めに取得してmetadataで絞り込み
      });

      // metadataでuserIdが一致するカスタマーを探す
      const matchingCustomer = existingCustomers.data.find(customer => 
        customer.metadata?.userId === userId
      );

      if (matchingCustomer) {
        return matchingCustomer.id;
      }

      // 新しいカスタマーを作成
      const customer = await this.stripe.customers.create({
        email,
        metadata: { userId },
      });

      return customer.id;
    } catch (error) {
      console.error('Error creating/getting customer:', error);
      return null;
    }
  }

  // サブスクリプション作成用のCheckoutセッションを作成
  async createCheckoutSession(
    userId: string,
    customerId: string,
    successUrl: string,
    cancelUrl: string
  ): Promise<{ sessionId: string | null; url: string | null }> {
    if (!this.stripe) return { sessionId: null, url: null };

    try {
      const session = await this.stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: STRIPE_CONFIG.PREMIUM_PRICE_ID,
            quantity: 1,
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          userId,
        },
        subscription_data: {
          metadata: {
            userId,
          },
        },
      });

      return {
        sessionId: session.id,
        url: session.url,
      };
    } catch (error) {
      console.error('Error creating checkout session:', error);
      return { sessionId: null, url: null };
    }
  }

  // カスタマーポータルセッションを作成（サブスクリプション管理用）
  async createPortalSession(
    customerId: string,
    returnUrl: string
  ): Promise<string | null> {
    if (!this.stripe) return null;

    try {
      const session = await this.stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });

      return session.url;
    } catch (error) {
      console.error('Error creating portal session:', error);
      return null;
    }
  }

  // サブスクリプションステータスを取得
  async getSubscriptionStatus(customerId: string): Promise<{
    isActive: boolean;
    subscriptionId: string | null;
    currentPeriodEnd: Date | null;
  }> {
    if (!this.stripe) {
      return { isActive: false, subscriptionId: null, currentPeriodEnd: null };
    }

    try {
      const subscriptions = await this.stripe.subscriptions.list({
        customer: customerId,
        status: 'active',
        limit: 1,
      });

      if (subscriptions.data.length > 0) {
        const subscription = subscriptions.data[0];
        return {
          isActive: true,
          subscriptionId: subscription.id,
          currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
        };
      }

      return { isActive: false, subscriptionId: null, currentPeriodEnd: null };
    } catch (error) {
      console.error('Error getting subscription status:', error);
      return { isActive: false, subscriptionId: null, currentPeriodEnd: null };
    }
  }

  // Webhookイベントを検証
  verifyWebhookSignature(payload: string, signature: string): Stripe.Event | null {
    if (!this.stripe || !process.env.STRIPE_WEBHOOK_SECRET) return null;

    try {
      return this.stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (error) {
      console.error('Webhook verification failed:', error);
      return null;
    }
  }
}