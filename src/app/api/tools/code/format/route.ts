import { NextRequest, NextResponse } from 'next/server';
import prettier from 'prettier';

export async function POST(req: NextRequest) {
  try {
    const { code, language = 'javascript' } = await req.json();
    
    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    // Map language to prettier parser
    let parser = 'babel';
    if (language === 'html' || language === 'xml') parser = 'html';
    if (language === 'css') parser = 'css';
    if (language === 'json') parser = 'json';
    if (language === 'markdown') parser = 'markdown';
    if (language === 'typescript') parser = 'typescript';

    const formatted = await prettier.format(code, {
      parser: parser,
      semi: true,
      singleQuote: true,
      trailingComma: 'es5',
    });

    return NextResponse.json({ result: formatted });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Formatting failed' }, { status: 500 });
  }
}
