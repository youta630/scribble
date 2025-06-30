import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface UsageData {
  [userId: string]: {
    count: number;
    firstUsed: string;
    lastUsed: string;
  };
}

// メモリベースのストレージ（開発/デバッグ用）
let memoryUsageData: UsageData = {};

// 使用データを読み込み
async function readUsageData(): Promise<UsageData> {
  return memoryUsageData;
}

// 使用データを保存
async function writeUsageData(data: UsageData): Promise<void> {
  memoryUsageData = data;
}

// GET: 使用回数を取得
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('X-User-ID');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const usageData = await readUsageData();
    const userUsage = usageData[userId];

    return NextResponse.json({
      count: userUsage?.count || 0,
      limit: 999,
      firstUsed: userUsage?.firstUsed || null,
      lastUsed: userUsage?.lastUsed || null
    });
  } catch (error) {
    console.error('GET /api/usage error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: 使用回数をインクリメント
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('X-User-ID');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const usageData = await readUsageData();
    const now = new Date().toISOString();
    
    if (!usageData[userId]) {
      usageData[userId] = {
        count: 0,
        firstUsed: now,
        lastUsed: now
      };
    }

    // 使用回数を増加
    usageData[userId].count += 1;
    usageData[userId].lastUsed = now;

    await writeUsageData(usageData);

    return NextResponse.json({
      count: usageData[userId].count,
      limit: 999,
      isLimitReached: usageData[userId].count >= 999
    });
  } catch (error) {
    console.error('POST /api/usage error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: 使用回数をリセット（開発用）
export async function DELETE(request: NextRequest) {
  try {
    const userId = request.headers.get('X-User-ID');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const usageData = await readUsageData();
    
    if (usageData[userId]) {
      delete usageData[userId];
      await writeUsageData(usageData);
    }

    return NextResponse.json({
      success: true,
      message: 'Usage reset successfully'
    });
  } catch (error) {
    console.error('DELETE /api/usage error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}