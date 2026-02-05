'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useState, useEffect } from 'react';
import { Copy, Download, Trash2, Sparkles } from 'lucide-react';
import { Tool } from '@/data/tools';
import { codeTools, encodingTools, timeTools, colorTools, textTools, dataTools } from '@/lib/tools';
import { networkTools } from '@/lib/network-tools';

interface ToolPanelProps {
  tool: Tool;
}

const TOOL_EXAMPLES: Record<string, string> = {
  'json-formatter': '{\n  "name": "Toolbox",\n  "version": 1,\n  "features": ["formatter", "converter"]\n}',
  'xml-formatter': '<root><child id="1">Hello</child><child id="2">World</child></root>',
  'code-prettify': 'function hello(name){console.log("Hello "+name);return true;}',
  'code-minify': 'function hello(name) {\n  console.log("Hello " + name);\n  return true;\n}',
  'url-encode': 'https://example.com/search?q=hello world&lang=zh-CN',
  'base64': 'Hello World',
  'md5': 'Hello World',
  'sha': 'Hello World',
  'uuid': '', // No input needed
  'timestamp': '1707123456',
  'timezone': '2023-01-01 12:00:00',
  'countdown': '2025-01-01',
  'case-converter': 'Hello World',
  'simplified-chinese': '憂鬱的臺灣烏龜',
  'emoji-converter': 'I :love: coding! :rocket:',
  'word-count': 'Hello world! This is a simple word count test.',
  'density-analysis': 'apple banana apple orange banana apple',
  'repeat-check': 'apple\nbanana\napple\norange\nbanana',
  'regex': '^\\d+$\n12345\nabc\n67890',
  'extract-replace': '\\d+\nNUMBER\nOrder #12345: Item #67890',
  'csv-to-json': 'Name,Age,City\nAlice,30,New York\nBob,25,Los Angeles',
  'excel-preview': 'Name,Age,City\nAlice,30,New York\nBob,25,Los Angeles',
  'markdown-editor': '# Hello Markdown\n\n- Item 1\n- Item 2\n\n**Bold Text**',
  'mock-data': 'user',
  'api-tester': 'https://jsonplaceholder.typicode.com/todos/1',
  'json-tree': '{"a":1, "b": [2,3]}',
  'data-analysis': '10, 20, 5, 40, 15',
  'random-generator': '32',
  'color-converter': '#3b82f6',
  'color-palette': '#3b82f6',
  'contrast-check': '#ffffff\n#000000',
  'ip-subnet-calculator': '192.168.1.0/24',
  'ip-lookup': '8.8.8.8',
  'whois': 'google.com',
  'dns-lookup': 'google.com',
  'mac-lookup': '00:1A:2B:3C:4D:5E',
  'ua-parser': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'ssl-checker': 'google.com',
  'http-headers': 'https://google.com',
  'cidr-calc': '192.168.0.0/16',
};

export default function ToolPanel({ tool }: ToolPanelProps) {
  const t = useTranslations();
  const locale = useLocale();
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setInput('');
    setOutput('');
    setError('');
  }, [tool.id]);

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
        case 'code-prettify':
          result = await codeTools.formatCode(input);
          break;
        case 'code-minify':
          result = await codeTools.minifyCode(input);
          break;
        case 'url-encode':
          result = encodingTools.urlEncode(input);
          break;
        case 'base64':
          result = input.includes('+') || input.includes('/') || input.includes('=')
            ? encodingTools.base64Decode(input)
            : encodingTools.base64Encode(input);
          break;
        case 'md5':
          result = encodingTools.md5(input);
          break;
        case 'sha':
          result = encodingTools.sha(input);
          break;
        case 'uuid':
          result = encodingTools.uuid();
          break;
        case 'timestamp':
          if (!input.trim()) {
            result = `Current Timestamp: ${timeTools.getCurrentTimestamp()}`;
          } else if (/^\d+$/.test(input.trim())) {
            result = timeTools.timestampToDate(input.trim());
          } else {
            result = timeTools.dateToTimestamp(input);
          }
          break;
        case 'timezone':
          result = timeTools.convertTimezone(input, 'UTC', 'Local');
          break;
        case 'countdown':
          result = timeTools.calcCountdown(input);
          break;
        case 'case-converter':
          result = textTools.toUpperCase(input); // Default to Upper, can add toggle later
          break;
        case 'simplified-chinese':
          // Heuristic: check if input looks traditional (hard), or just provide toggle.
          // For now, let's assume S2T default, or maybe provide buttons.
          // Let's do S2T for now.
          result = await textTools.convertChinese(input, 's2t');
          break;
        case 'emoji-converter':
          result = textTools.convertEmoji(input);
          break;
        case 'word-count':
          result = `Characters: ${textTools.charCount(input)}\nWords: ${textTools.wordCount(input)}`;
          break;
        case 'density-analysis':
          result = textTools.analyzeDensity(input);
          break;
        case 'repeat-check':
          result = textTools.removeDuplicates(input);
          break;
        case 'regex':
          // Regex tool needs 2 inputs (text + regex). 
          // We can parse the input as "REGEX\n---\nTEXT" or just simple text for now.
          // Let's assume input first line is regex.
          const firstLine = input.split('\n')[0];
          const rest = input.substring(firstLine.length + 1);
          result = textTools.testRegex(rest, firstLine);
          break;
        case 'extract-replace':
           // Needs 3 parts: Regex, Replace, Text.
           // Format: /regex/replace/text...
           // Or just assume: Line 1 = Regex, Line 2 = Replace, Rest = Text
           const lines = input.split('\n');
           if (lines.length < 3) {
             result = "Error: Input format should be:\nRegex Pattern\nReplacement String\nText to process...";
           } else {
             const rRegex = lines[0];
             const rReplace = lines[1];
             const rText = input.substring(lines[0].length + lines[1].length + 2);
             result = textTools.extractReplace(rText, rRegex, rReplace);
           }
           break;
        case 'csv-to-json':
          result = dataTools.csvToJson(input);
          break;
        case 'excel-preview':
          // Re-use CSV logic for text-based preview
          result = dataTools.csvToJson(input);
          break;
        case 'markdown-editor':
          result = await dataTools.markdownToHtml(input);
          break;
        case 'mock-data':
          result = dataTools.mockData(input);
          break;
        case 'api-tester':
          try {
            const res = await fetch(input);
            const data = await res.json();
            result = JSON.stringify(data, null, 2);
          } catch (e: any) {
            result = `API Error: ${e.message}`;
          }
          break;
        case 'json-tree':
          result = codeTools.formatJSON(input);
          break;
        case 'data-analysis':
          result = dataTools.analyzeData(input);
          break;
        case 'random-generator':
          result = dataTools.generateRandom(input ? parseInt(input) : 16);
          break;
        case 'color-converter':
          if (input.startsWith('#')) {
            result = colorTools.hexToRgb(input);
          } else if (input.includes('rgb')) {
            result = colorTools.rgbToHex(input);
          }
          break;
        case 'color-palette':
          result = colorTools.generatePalette(input);
          break;
        case 'contrast-check':
          const colors = input.split('\n');
          if (colors.length >= 2) {
            result = colorTools.checkContrast(colors[0], colors[1]);
          } else {
            result = 'Please enter two colors (one per line)';
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

  const loadExample = () => {
    const example = TOOL_EXAMPLES[tool.id];
    if (example) {
      setInput(example);
      setError('');
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 backdrop-blur-sm rounded-xl border border-zinc-200 dark:border-white/10 shadow-xl overflow-hidden flex flex-col h-full animate-in fade-in zoom-in-95 duration-300">
      <div className="p-6 border-b border-zinc-200 dark:border-white/10 flex justify-between items-start flex-shrink-0 bg-zinc-50/50 dark:bg-zinc-900/50">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
            <span className="text-3xl p-2 bg-white dark:bg-zinc-950 rounded-lg text-blue-600 dark:text-blue-500 border border-zinc-200 dark:border-white/5 shadow-sm">{tool.icon}</span> 
            {t(tool.nameKey as any)}
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1 ml-14">{t(tool.categoryKey as any)}</p>
        </div>
      </div>

      <div className="p-6 space-y-6 flex-1 flex flex-col overflow-hidden bg-white dark:bg-zinc-900">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
          <div className="flex flex-col space-y-2 h-full">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                {t('buttons.convert')}
              </label>
              {TOOL_EXAMPLES[tool.id] && (
                <button
                  onClick={loadExample}
                  className="flex items-center gap-1.5 text-xs bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-blue-600 dark:text-blue-400 px-2 py-1 rounded transition-colors border border-zinc-200 dark:border-white/10"
                >
                  <Sparkles size={12} /> Load Example
                </button>
              )}
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 w-full bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-200 rounded-lg p-4 border border-zinc-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 font-mono text-sm resize-y min-h-[400px] placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
              placeholder={
                  tool.id === 'ip-subnet-calculator' || tool.id === 'cidr-calc'
                    ? "Enter IP/CIDR (e.g., 192.168.1.1/24)" 
                    : tool.id === 'mac-lookup'
                    ? "Enter MAC Address (e.g., 00:1A:2B:3C:4D:5E)"
                    : tool.id === 'ua-parser'
                    ? "Paste User-Agent String (leave empty to analyze your current browser)"
                    : tool.id === 'ssl-checker' || tool.id === 'http-headers' || tool.id === 'whois' || tool.id === 'dns-lookup'
                    ? "Enter Domain or URL (e.g., google.com)"
                    : tool.id === 'regex'
                    ? "Enter Regex on Line 1\nThen content to test..."
                    : tool.id === 'extract-replace'
                    ? "Line 1: Regex Pattern\nLine 2: Replacement\nLine 3+: Text content..."
                    : tool.id === 'csv-to-json' || tool.id === 'excel-preview'
                    ? "Paste CSV content here..."
                    : tool.id === 'markdown-editor'
                    ? "Enter Markdown content..."
                    : tool.id === 'random-generator'
                    ? "Enter length (default 16)"
                    : tool.id === 'emoji-converter'
                    ? "Enter text with shortcodes (e.g. :smile:)"
                    : tool.id === 'contrast-check'
                    ? "Enter two colors (hex/rgb), one per line"
                    : tool.id === 'data-analysis'
                    ? "Enter numbers separated by comma or space"
                    : tool.id === 'api-tester'
                    ? "Enter API URL (e.g. https://api.example.com/data)"
                    : "Paste your content here..."
                }
            />
          </div>

          <div className="flex flex-col space-y-2 h-full">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Output
              </label>
              {output && (
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-xs bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 px-2 py-1 rounded transition-colors border border-zinc-200 dark:border-white/10"
                >
                  {copied ? <span className="text-green-500 dark:text-green-400">Copied!</span> : <><Copy size={12} /> Copy</>}
                </button>
              )}
            </div>
            <div className="flex-1 w-full bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-200 rounded-lg p-4 border border-zinc-200 dark:border-white/10 font-mono text-sm overflow-auto relative group resize-y min-h-[400px] whitespace-pre-wrap">
              {error ? (
                <div className="text-red-500 dark:text-red-400">{error}</div>
              ) : (
                output || <span className="text-zinc-400 dark:text-zinc-600 italic">Result will appear here...</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-white/10 flex-shrink-0">
          <button
            onClick={handleClear}
            className="px-4 py-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Trash2 size={16} />
            Clear
          </button>
          <button
            onClick={handleConvert}
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:text-zinc-500 disabled:cursor-not-allowed text-white rounded-lg text-sm font-bold shadow-lg shadow-blue-500/20 transition-all transform active:scale-95 flex items-center gap-2"
          >
            {isLoading ? 'Running...' : 'Run Tool'}
          </button>
        </div>
      </div>
    </div>
  );
}
