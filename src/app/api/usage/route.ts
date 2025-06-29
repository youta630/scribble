import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

// データディレクトリのパス
const DATA_DIR = path.join(process.cwd(), 'data');
const USAGE_FILE = path.join(DATA_DIR, 'usage.json');

interface UsageData {
  [userId: string]: {
    count: number;
    firstUsed: string;
    lastUsed: string;
  };
}

// データディレクトリとファイルの初期化
async function ensureDataFile() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    
    try {
      await fs.access(USAGE_FILE);
    } catch {
      // ファイルが存在しない場合は空のJSONで初期化
      await fs.writeFile(USAGE_FILE, JSON.stringify({}, null, 2));
    }
  } catch (error) {
    console.error('Failed to ensure data file:', error);
  }
}

// 使用データを読み込み
async function readUsageData(): Promise<UsageData> {
  try {
    await ensureDataFile();
    const data = await fs.readFile(USAGE_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to read usage data:', error);
    return {};
  }
}

// 使用データを保存
async function writeUsageData(data: UsageData): Promise<void> {
  try {
    await ensureDataFile();
    await fs.writeFile(USAGE_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Failed to write usage data:', error);
    throw error;
  }
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
      limit: 3,
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
      limit: 3,
      isLimitReached: usageData[userId].count >= 3
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