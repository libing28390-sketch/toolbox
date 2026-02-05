import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { ip, lang } = await req.json();
    
    // If no IP provided, use the request's IP? 
    // But usually user wants to lookup a specific IP.
    // If input is empty, maybe return current IP info?
    
    const target = ip ? ip.trim() : '';
    const langParam = lang === 'zh' ? 'zh-CN' : 'en';
    
    // Use ip-api.com (Free tier, limited to 45 requests/minute)
    // Note: ip-api.com is HTTP only for free tier, but we are on server side, so it's fine.
    const response = await fetch(`http://ip-api.com/json/${target}?lang=${langParam}&fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query`);
    const data = await response.json();

    if (data.status === 'fail') {
      return NextResponse.json({ error: data.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch IP info' }, { status: 500 });
  }
}
