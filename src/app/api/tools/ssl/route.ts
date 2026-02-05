import { NextRequest, NextResponse } from 'next/server';
import tls from 'tls';
import { URL } from 'url';

export async function POST(req: NextRequest) {
  try {
    const { domain } = await req.json();
    
    if (!domain) {
      return NextResponse.json({ error: 'Domain is required' }, { status: 400 });
    }

    // Ensure protocol
    let hostname = domain;
    if (domain.startsWith('http://') || domain.startsWith('https://')) {
      try {
        hostname = new URL(domain).hostname;
      } catch (e) {
        return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
      }
    }

    const result = await new Promise<any>((resolve, reject) => {
      const socket = tls.connect({
        host: hostname,
        port: 443,
        servername: hostname, // SNI support
        rejectUnauthorized: false // We just want to check, not fail on self-signed
      }, () => {
        const cert = socket.getPeerCertificate(true); // true for detailed info
        socket.end();
        
        if (!cert || Object.keys(cert).length === 0) {
          reject(new Error('No certificate found'));
          return;
        }

        resolve({
          subject: cert.subject,
          issuer: cert.issuer,
          valid_from: cert.valid_from,
          valid_to: cert.valid_to,
          days_remaining: Math.floor((new Date(cert.valid_to).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
          protocol: socket.getProtocol(),
          cipher: socket.getCipher(),
          san: cert.subjectaltname
        });
      });

      socket.on('error', (err) => {
        reject(err);
      });
      
      // Timeout
      socket.setTimeout(5000, () => {
        socket.destroy();
        reject(new Error('Connection timed out'));
      });
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'SSL check failed' }, { status: 500 });
  }
}
