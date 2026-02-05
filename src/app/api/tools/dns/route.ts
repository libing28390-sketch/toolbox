import { NextRequest, NextResponse } from 'next/server';
import dns from 'dns';
import util from 'util';

const resolveAny = util.promisify(dns.resolveAny);

export async function POST(req: NextRequest) {
  try {
    const { domain } = await req.json();
    
    if (!domain) {
      return NextResponse.json({ error: 'Domain is required' }, { status: 400 });
    }

    // resolveAny gives most records but not all (e.g. sometimes misses TXT depending on server).
    // Let's try resolveAny first.
    
    const records = await resolveAny(domain);
    return NextResponse.json({ records });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'DNS lookup failed' }, { status: 500 });
  }
}
