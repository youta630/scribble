import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

// データディレクトリのパス
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

// データディレクトリとファイルの初期化
async function ensureDataFile() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    
    try {
      await fs.access(PREMIUM_FILE);
    } catch {
      // ファイルが存在しない場合は空のJSONで初期化
      await fs.writeFile(PREMIUM_FILE, JSON.stringify({}, null, 2));
    }
  } catch (error) {
    console.error('Failed to ensure premium data file:', error);
  }
}

// プレミアムデータを読み込み
async function readPremiumData(): Promise<PremiumData> {
  try {
    await ensureDataFile();
    const data = await fs.readFile(PREMIUM_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to read premium data:', error);
    return {};
  }
}

// プレミアムデータを保存
async function writePremiumData(data: PremiumData): Promise<void> {
  try {
    await ensureDataFile();
    await fs.writeFile(PREMIUM_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Failed to write premium data:', error);
    throw error;
  }
}

// GET: プレミアムステータスを取得
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('X-User-ID');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const premiumData = await readPremiumData();
    const userPremium = premiumData[userId];

    // プレミアムでない、または期限切れの場合
    if (!userPremium || !userPremium.isPremium) {
      return NextResponse.json({
        isPremium: false,
        subscribedAt: null,
        expiresAt: null
      });
    }

    // 期限チェック（expiresAtが設定されている場合）
    if (userPremium.expiresAt) {
      const now = new Date();
      const expiresAt = new Date(userPremium.expiresAt);
      
      if (now > expiresAt) {
        // 期限切れの場合、プレミアムステータスを無効化
        premiumData[userId].isPremium = false;
        await writePremiumData(premiumData);
        
        return NextResponse.json({
          isPremium: false,
          subscribedAt: userPremium.subscribedAt,
          expiresAt: userPremium.expiresAt,
          expired: true
        });
      }
    }

    return NextResponse.json({
      isPremium: userPremium.isPremium,
      subscribedAt: userPremium.subscribedAt,
      expiresAt: userPremium.expiresAt || null
    });
  } catch (error) {
    console.error('GET /api/premium error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: プレミアムステータスを設定（Stripe Webhook用）
export async function POST(request: NextRequest) {
  try {
    const { userId, isPremium, stripeCustomerId, stripeSubscriptionId } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const premiumData = await readPremiumData();
    const now = new Date().toISOString();
    
    premiumData[userId] = {
      isPremium,
      subscribedAt: isPremium ? now : (premiumData[userId]?.subscribedAt || now),
      stripeCustomerId: stripeCustomerId || premiumData[userId]?.stripeCustomerId,
      stripeSubscriptionId: stripeSubscriptionId || premiumData[userId]?.stripeSubscriptionId,
      ...(isPremium ? {} : { expiresAt: now }) // プレミアム解除時に終了日を設定
    };

    await writePremiumData(premiumData);

    return NextResponse.json({
      success: true,
      isPremium: premiumData[userId].isPremium,
      subscribedAt: premiumData[userId].subscribedAt
    });
  } catch (error) {
    console.error('POST /api/premium error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}