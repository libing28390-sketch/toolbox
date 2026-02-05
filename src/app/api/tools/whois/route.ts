import { NextRequest, NextResponse } from 'next/server';
import whois from 'whois';

export async function POST(req: NextRequest) {
  try {
    const { domain } = await req.json();
    
    if (!domain) {
      return NextResponse.json({ error: 'Domain is required' }, { status: 400 });
    }

    const result = await new Promise<string>((resolve, reject) => {
      whois.lookup(domain, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });

    return NextResponse.json({ data: result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'WHOIS lookup failed' }, { status: 500 });
  }
}
