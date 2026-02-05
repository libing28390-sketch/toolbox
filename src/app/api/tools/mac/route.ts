import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { mac } = await req.json();
    
    if (!mac) {
      return NextResponse.json({ error: 'MAC address is required' }, { status: 400 });
    }

    // Use macvendors.com API (Free, rate limited)
    const response = await fetch(`https://api.macvendors.com/${mac}`);
    
    if (!response.ok) {
      return NextResponse.json({ error: 'Vendor not found or API error' }, { status: 404 });
    }

    const vendor = await response.text();
    return NextResponse.json({ vendor });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'MAC lookup failed' }, { status: 500 });
  }
}
