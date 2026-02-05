import ipaddr from 'ipaddr.js';
import { UAParser } from 'ua-parser-js';

export interface SubnetResult {
  ip: string;
  cidr: number;
  type: 'IPv4' | 'IPv6';
  networkAddress: string;
  broadcastAddress?: string; // Only for IPv4
  subnetMask: string;
  firstUsable?: string;
  lastUsable?: string;
  totalHosts: string;
  usableHosts: string;
}

export const networkTools = {
  calculateSubnet(input: string): SubnetResult {
    // 1. Parse Input (support "IP" or "IP/CIDR")
    const parts = input.trim().split('/');
    let ipStr = parts[0];
    let cidrStr = parts[1];

    if (!ipaddr.isValid(ipStr)) {
      throw new Error('Invalid IP Address');
    }

    const addr = ipaddr.parse(ipStr);
    const type = addr.kind() === 'ipv4' ? 'IPv4' : 'IPv6';
    let cidr = cidrStr ? parseInt(cidrStr, 10) : (type === 'IPv4' ? 24 : 64);

    // Validate CIDR
    if (type === 'IPv4') {
      if (isNaN(cidr) || cidr < 0 || cidr > 32) cidr = 24; // default
    } else {
      if (isNaN(cidr) || cidr < 0 || cidr > 128) cidr = 64; // default
    }

    if (type === 'IPv4') {
      return calculateIPv4(addr as ipaddr.IPv4, cidr);
    } else {
      return calculateIPv6(addr as ipaddr.IPv6, cidr);
    }
  },

  async lookupIp(ip: string, lang: string = 'en') {
    const response = await fetch('/api/tools/ip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ip, lang }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'IP Lookup failed');
    }
    return response.json();
  },

  async lookupWhois(domain: string) {
    const response = await fetch('/api/tools/whois', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'WHOIS Lookup failed');
    }
    return response.json();
  },

  async lookupDns(domain: string) {
    const response = await fetch('/api/tools/dns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'DNS Lookup failed');
    }
    return response.json();
  },

  async lookupMac(mac: string) {
    const response = await fetch('/api/tools/mac', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mac }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'MAC Lookup failed');
    }
    return response.json();
  },

  async checkSsl(domain: string) {
    const response = await fetch('/api/tools/ssl', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'SSL Check failed');
    }
    return response.json();
  },

  async checkHeaders(url: string) {
    const response = await fetch('/api/tools/headers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Headers Check failed');
    }
    return response.json();
  },

  parseUserAgent(ua: string) {
    const parser = new UAParser(ua);
    return parser.getResult();
  },

  calculateCidrSplit(input: string): string[] {
    const parts = input.trim().split('/');
    if (parts.length !== 2) throw new Error('Invalid CIDR format (e.g. 192.168.1.0/24)');
    
    const ip = parts[0];
    const cidr = parseInt(parts[1], 10);

    if (!ipaddr.isValid(ip)) throw new Error('Invalid IP address');
    const addr = ipaddr.parse(ip);

    if (addr.kind() === 'ipv4') {
      if (cidr >= 32) throw new Error('Cannot split /32');
      const newCidr = cidr + 1;
      
      // First subnet is the original network address
      const net1 = ipaddr.IPv4.networkAddressFromCIDR(input);
      
      // Second subnet is network + size/2
      // size = 2^(32-cidr)
      // half size = 2^(32-cidr-1) = 2^(32-newCidr)
      const increment = Math.pow(2, 32 - newCidr);
      
      const net1Bytes = net1.toByteArray();
      let net2Val = (net1Bytes[0] << 24) | (net1Bytes[1] << 16) | (net1Bytes[2] << 8) | net1Bytes[3];
      // Need unsigned shift
      net2Val = (net2Val + increment) >>> 0;
      
      const net2Bytes = [
        (net2Val >>> 24) & 0xFF,
        (net2Val >>> 16) & 0xFF,
        (net2Val >>> 8) & 0xFF,
        net2Val & 0xFF
      ];
      
      const net2 = new ipaddr.IPv4(net2Bytes);
      
      return [
        `${net1.toString()}/${newCidr}`,
        `${net2.toString()}/${newCidr}`
      ];
    } else {
      // IPv6 split
      if (cidr >= 128) throw new Error('Cannot split /128');
      const newCidr = cidr + 1;
      // IPv6 math is hard with JS numbers. Just return text for now.
      return [`IPv6 split not fully supported yet`];
    }
  }
};

function calculateIPv4(addr: ipaddr.IPv4, cidr: number): SubnetResult {
  const mask = ipaddr.IPv4.subnetMaskFromPrefixLength(cidr);
  const network = ipaddr.IPv4.networkAddressFromCIDR(addr.toString() + '/' + cidr);
  
  // Calculate broadcast: network OR (NOT mask)
  // ipaddr.js doesn't expose bitwise easily for broadcast, but we can compute it.
  // Or easier: use broadcastAddress from CIDR if available? No.
  
  // Let's implement broadcast manually
  const netBytes = network.toByteArray();
  const maskBytes = mask.toByteArray();
  const broadcastBytes = [];
  for (let i = 0; i < 4; i++) {
    // broadcast = network | (~mask & 0xFF)
    broadcastBytes.push(netBytes[i] | (~maskBytes[i] & 0xFF));
  }
  const broadcastAddr = new ipaddr.IPv4(broadcastBytes);

  // Usable range
  let firstUsable = null;
  let lastUsable = null;
  let totalHosts = Math.pow(2, 32 - cidr);
  let usableHosts = totalHosts - 2;

  if (cidr === 31) {
    usableHosts = 0; // PtP links often treated differently, but strictly speaking 0 usable in standard subnetting unless /31 specific
    // RFC 3021 allows /31 usage
    usableHosts = 2;
    firstUsable = network.toString();
    lastUsable = broadcastAddr.toString();
  } else if (cidr === 32) {
    usableHosts = 1;
    firstUsable = network.toString();
    lastUsable = network.toString();
  } else {
    // First usable = network + 1
    const firstBytes = [...netBytes];
    firstBytes[3]++;
    for(let i=3; i>0; i--) {
      if(firstBytes[i] > 255) {
        firstBytes[i] = 0;
        firstBytes[i-1]++;
      }
    }
    firstUsable = new ipaddr.IPv4(firstBytes).toString();

    // Last usable = broadcast - 1
    const lastBytes = [...broadcastBytes];
    lastBytes[3]--;
    for(let i=3; i>0; i--) {
      if(lastBytes[i] < 0) {
        lastBytes[i] = 255;
        lastBytes[i-1]--;
      }
    }
    lastUsable = new ipaddr.IPv4(lastBytes).toString();
    
    if (usableHosts < 0) usableHosts = 0;
  }

  return {
    ip: addr.toString(),
    cidr,
    type: 'IPv4',
    networkAddress: network.toString(),
    broadcastAddress: broadcastAddr.toString(),
    subnetMask: mask.toString(),
    firstUsable: firstUsable || undefined,
    lastUsable: lastUsable || undefined,
    totalHosts: totalHosts.toLocaleString(),
    usableHosts: usableHosts.toLocaleString()
  };
}

function calculateIPv6(addr: ipaddr.IPv6, cidr: number): SubnetResult {
  // IPv6 calculation is more complex due to big numbers.
  // ipaddr.js gives us the parts.
  
  // Network Address
  // We need to mask the address manually
  // Construct mask bytes
  // CIDR / 8 gives full bytes
  const maskBytes = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    const bitOffset = i * 8;
    if (cidr >= bitOffset + 8) {
      maskBytes[i] = 0xFF;
    } else if (cidr > bitOffset) {
      const remaining = cidr - bitOffset;
      maskBytes[i] = (0xFF << (8 - remaining)) & 0xFF;
    } else {
      maskBytes[i] = 0x00;
    }
  }

  const addrBytes = addr.toByteArray();
  const netBytes = [];
  for(let i=0; i<16; i++) {
    netBytes.push(addrBytes[i] & maskBytes[i]);
  }
  
  // Convert back to IPv6
  // ipaddr.IPv6 constructor takes array of 16-bit parts, but toByteArray returns 8-bit?
  // No, toByteArray returns 8-bit array (16 bytes).
  // But constructor takes 8x 16-bit parts.
  
  // Wait, let's check ipaddr.js docs or types.
  // ipaddr.IPv6(parts: number[], zoneId?: string)
  // parts is 8 * 16-bit integers.
  
  const to16Bit = (bytes: number[]) => {
    const parts = [];
    for(let i=0; i<16; i+=2) {
      parts.push((bytes[i] << 8) | bytes[i+1]);
    }
    return parts;
  };

  const networkAddr = new ipaddr.IPv6(to16Bit(netBytes));
  
  // Calculate hosts
  // 2^(128 - cidr)
  // Use BigInt
  const hostBits = BigInt(128 - cidr);
  const totalHosts = BigInt(2) ** hostBits;
  
  // First/Last is just Network ... Network + total - 1
  // Displaying full IPv6 range is usually too long.
  // Just return Network/Prefix
  
  return {
    ip: addr.toString(),
    cidr,
    type: 'IPv6',
    networkAddress: networkAddr.toString(),
    subnetMask: `/${cidr}`, // IPv6 usually just uses /CIDR
    totalHosts: totalHosts.toString(), // Might be huge
    usableHosts: (totalHosts > BigInt(1) ? totalHosts - BigInt(1) : BigInt(1)).toString() // Roughly
  };
}
