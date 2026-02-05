import { NextRequest, NextResponse } from 'next/server';
import { minify } from 'terser';

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json();
    
    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    // Terser only works for JavaScript
    const result = await minify(code);
    
    if (result.error) {
      throw result.error;
    }

    return NextResponse.json({ result: result.code });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Minification failed' }, { status: 500 });
  }
}
