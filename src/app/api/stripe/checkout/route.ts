import { NextRequest, NextResponse } from 'next/server';
import { StripeManager } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { userId, email } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const stripeManager = new StripeManager();

    // カスタマーを作成または取得
    const customerId = await stripeManager.createOrGetCustomer(userId, email);
    if (!customerId) {
      return NextResponse.json(
        { error: 'Failed to create customer' },
        { status: 500 }
      );
    }

    // サクセスとキャンセルURL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const successUrl = `${baseUrl}?payment=success`;
    const cancelUrl = `${baseUrl}?payment=cancelled`;

    // Checkoutセッションを作成
    const { sessionId, url } = await stripeManager.createCheckoutSession(
      userId,
      customerId,
      successUrl,
      cancelUrl
    );

    if (!sessionId || !url) {
      return NextResponse.json(
        { error: 'Failed to create checkout session' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      sessionId,
      url,
      customerId
    });
  } catch (error) {
    console.error('Checkout session creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}