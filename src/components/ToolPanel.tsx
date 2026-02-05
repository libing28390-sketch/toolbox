'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useState } from 'react';
import { Copy, Download, Trash2 } from 'lucide-react';
import { Tool } from '@/data/tools';
import { codeTools, encodingTools, timeTools, colorTools, textTools } from '@/lib/tools';
import { networkTools } from '@/lib/network-tools';

interface ToolPanelProps {
  tool: Tool;
}

export default function ToolPanel({ tool }: ToolPanelProps) {
  const t = useTranslations();
  const locale = useLocale();
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleConvert = async () => {
    setError('');
    setCopied(false);
    setIsLoading(true);
    
    try {
      let result = '';
      
      switch (tool.id) {
        case 'json-formatter':
          result = codeTools.formatJSON(input);
          break;
        case 'xml-formatter':
          result = codeTools.formatXML(input);
          break;
        case 'url-encode':
          result = encodingTools.urlEncode(input);
          break;
        case 'base64':
          result = input.includes('+') || input.includes('/') || input.includes('=')
            ? encodingTools.base64Decode(input)
            : encodingTools.base64Encode(input);
          break;
        case 'timestamp':
          result = codeTools.formatJSON(input) // 作为占位符
          result = encodingTools.urlEncode(input);
          break;
        case 'case-converter':
          result = textTools.toUpperCase(input); // 可以增加更多选项
          break;
        case 'word-count':
          result = `字数: ${textTools.charCount(input)}\n词数: ${textTools.wordCount(input)}`;
          break;
        case 'color-converter':
          if (input.startsWith('#')) {
            result = colorTools.hexToRgb(input);
          } else if (input.includes('rgb')) {
            result = colorTools.rgbToHex(input);
          }
          break;
        case 'ip-subnet-calculator':
          const info = networkTools.calculateSubnet(input);
          result = [
            `Type: ${info.type}`,
            `CIDR: /${info.cidr}`,
            `Network: ${info.networkAddress}`,
            `Mask: ${info.subnetMask}`,
            info.broadcastAddress ? `Broadcast: ${info.broadcastAddress}` : null,
            `Range: ${info.firstUsable || 'N/A'} - ${info.lastUsable || 'N/A'}`,
            `Total Hosts: ${info.totalHosts}`,
            `Usable Hosts: ${info.usableHosts}`
          ].filter(Boolean).join('\n');
          break;
        case 'ip-lookup':
          const ipData = await networkTools.lookupIp(input, locale);
          result = `IP: ${ipData.query}
Country: ${ipData.country} (${ipData.countryCode})
Region: ${ipData.regionName} (${ipData.region})
City: ${ipData.city}
ZIP: ${ipData.zip}
Coordinates: ${ipData.lat}, ${ipData.lon}
Timezone: ${ipData.timezone}
ISP: ${ipData.isp}
Organization: ${ipData.org}
AS: ${ipData.as}`;
          break;
        case 'whois':
          const whoisData = await networkTools.lookupWhois(input);
          result = whoisData.data;
          break;
        case 'dns-lookup':
          const dnsData = await networkTools.lookupDns(input);
          result = JSON.stringify(dnsData, null, 2);
          break;
        case 'mac-lookup':
          const macData = await networkTools.lookupMac(input);
          result = `Vendor: ${macData.vendor}`;
          break;
        case 'ua-parser':
          const uaString = input.trim() || navigator.userAgent;
          const uaData = networkTools.parseUserAgent(uaString);
          result = `Browser: ${uaData.browser.name || 'Unknown'} ${uaData.browser.version || ''}
OS: ${uaData.os.name || 'Unknown'} ${uaData.os.version || ''}
Device: ${uaData.device.vendor || 'PC'} ${uaData.device.model || ''} ${uaData.device.type || ''}
CPU: ${uaData.cpu.architecture || 'Unknown'}
Engine: ${uaData.engine.name || ''} ${uaData.engine.version || ''}`;
          break;
        case 'ssl-checker':
          const sslData = await networkTools.checkSsl(input);
          result = `Subject: ${sslData.subject.CN || JSON.stringify(sslData.subject)}
Issuer: ${sslData.issuer.CN || JSON.stringify(sslData.issuer)}
Valid From: ${sslData.valid_from}
Valid To: ${sslData.valid_to}
Days Remaining: ${sslData.days_remaining}
Protocol: ${sslData.protocol}
Cipher: ${sslData.cipher.name}`;
          break;
        case 'http-headers':
          const headersData = await networkTools.checkHeaders(input);
          result = `Status: ${headersData.status} ${headersData.statusText}

Headers:
${Object.entries(headersData.headers).map(([k, v]) => `${k}: ${v}`).join('\n')}`;
          break;
        case 'cidr-calc':
          const subnets = networkTools.calculateCidrSplit(input);
          result = `Split Result (Next Level):
${subnets.join('\n')}`;
          break;
        default:
          result = '此工具即将推出';
      }
      
      setOutput(result);
    } catch (err: any) {
      setError(err.message || '发生错误');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setError('');
  };

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-xl overflow-hidden">
      <div className="p-6 border-b border-slate-800 flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="text-3xl">{tool.icon}</span> 
            {t(tool.nameKey as any)}
          </h2>
          <p className="text-slate-400 text-sm mt-1 ml-1">{t(tool.categoryKey as any)}</p>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="flex flex-col space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t('buttons.convert')}
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 min-h-[300px] bg-slate-950 text-slate-200 rounded-lg p-4 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent font-mono text-sm resize-none"
              placeholder={
                 tool.id === 'ip-subnet-calculator' || tool.id === 'cidr-calc'
                   ? "Enter IP/CIDR (e.g., 192.168.1.1/24)" 
                   : tool.id === 'mac-lookup'
                   ? "Enter MAC Address (e.g., 00:1A:2B:3C:4D:5E)"
                   : tool.id === 'ua-parser'
                   ? "Paste User-Agent String (leave empty to analyze your current browser)"
                   : tool.id === 'ssl-checker' || tool.id === 'http-headers' || tool.id === 'whois' || tool.id === 'dns-lookup'
                   ? "Enter Domain or URL (e.g., google.com)"
                   : "Paste your content here..."
               }
            />
          </div>

          <div className="flex flex-col space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Output
              </label>
              {output && (
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded transition-colors"
                >
                  {copied ? <span className="text-green-400">Copied!</span> : <><Copy size={12} /> Copy</>}
                </button>
              )}
            </div>
            <div className="flex-1 min-h-[300px] bg-slate-950 text-slate-200 rounded-lg p-4 border border-slate-800 font-mono text-sm overflow-auto relative group">
              {error ? (
                <div className="text-red-400">{error}</div>
              ) : (
                output || <span className="text-slate-600 italic">Result will appear here...</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            onClick={handleClear}
            className="px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Trash2 size={16} />
            Clear
          </button>
          <button
            onClick={handleConvert}
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:text-slate-400 disabled:cursor-not-allowed text-white rounded-lg text-sm font-bold shadow-lg shadow-blue-900/20 transition-all transform active:scale-95 flex items-center gap-2"
          >
            {isLoading ? 'Running...' : 'Run Tool'}
          </button>
        </div>
      </div>
    </div>
  );
}
