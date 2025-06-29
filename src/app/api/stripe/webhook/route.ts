import { NextRequest, NextResponse } from 'next/server';
import { StripeManager } from '@/lib/stripe';
import { promises as fs } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

// プレミアムデータファイルのパス
const DATA_DIR = path.join(process.cwd(), 'data');
const PREMIUM_FILE = path.join(DATA_DIR, 'premium.json');

interface PremiumData {
  [userId: string]: {
    isPremium: boolean;
    subscribedAt: string;
    expiresAt?: string;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
  };
}

// プレミアムデータを読み込み
async function readPremiumData(): Promise<PremiumData> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const data = await fs.readFile(PREMIUM_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
}

// プレミアムデータを保存
async function writePremiumData(data: PremiumData): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(PREMIUM_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Failed to write premium data:', error);
    throw error;
  }
}

// プレミアムステータスを更新
async function updatePremiumStatus(
  userId: string,
  isPremium: boolean,
  stripeCustomerId?: string,
  stripeSubscriptionId?: string
): Promise<void> {
  const premiumData = await readPremiumData();
  const now = new Date().toISOString();

  premiumData[userId] = {
    isPremium,
    subscribedAt: isPremium ? now : (premiumData[userId]?.subscribedAt || now),
    stripeCustomerId: stripeCustomerId || premiumData[userId]?.stripeCustomerId,
    stripeSubscriptionId: stripeSubscriptionId || premiumData[userId]?.stripeSubscriptionId,
    ...(isPremium ? {} : { expiresAt: now }),
  };

  await writePremiumData(premiumData);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    const stripeManager = new StripeManager();
    const event = stripeManager.verifyWebhookSignature(body, signature);

    if (!event) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    console.log('Received Stripe webhook:', event.type);

    // イベントタイプごとの処理
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        
        if (userId && session.mode === 'subscription') {
          await updatePremiumStatus(
            userId,
            true,
            session.customer as string,
            session.subscription as string
          );
          console.log(`Premium activated for user: ${userId}`);
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const userId = subscription.metadata?.userId;
        
        if (userId) {
          const isActive = subscription.status === 'active';
          await updatePremiumStatus(
            userId,
            isActive,
            subscription.customer as string,
            subscription.id
          );
          console.log(`Subscription ${isActive ? 'activated' : 'updated'} for user: ${userId}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const userId = subscription.metadata?.userId;
        
        if (userId) {
          await updatePremiumStatus(
            userId,
            false,
            subscription.customer as string,
            subscription.id
          );
          console.log(`Premium deactivated for user: ${userId}`);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const subscriptionId = (invoice as any).subscription;
        
        if (subscriptionId) {
          // 支払い失敗時の処理（必要に応じて）
          console.log(`Payment failed for subscription: ${subscriptionId}`);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}