'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Copy, Download, Trash2 } from 'lucide-react';
import { Tool } from '@/data/tools';
import { codeTools, encodingTools, timeTools, colorTools, textTools } from '@/lib/tools';

interface ToolPanelProps {
  tool: Tool;
}

export default function ToolPanel({ tool }: ToolPanelProps) {
  const t = useTranslations();
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleConvert = () => {
    setError('');
    setCopied(false);
    
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
        default:
          result = '此工具即将推出';
      }
      
      setOutput(result);
    } catch (err: any) {
      setError(err.message || '发生错误');
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
    <div className="bg-slate-700 rounded-lg p-6 space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">
          {tool.icon} {t(tool.nameKey as any)}
        </h2>
        <p className="text-slate-400 text-sm">{t(tool.categoryKey as any)}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-2">
            {t('buttons.convert')}
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full h-64 bg-slate-800 text-white rounded p-3 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            placeholder="输入内容..."
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-2">
            输出结果
          </label>
          <textarea
            value={output}
            readOnly
            className="w-full h-64 bg-slate-800 text-slate-300 rounded p-3 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            placeholder="转换结果..."
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleConvert}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors"
        >
          {t('buttons.convert')}
        </button>
        
        <button
          onClick={handleCopy}
          disabled={!output}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white font-semibold py-2 px-4 rounded transition-colors"
        >
          <Copy size={18} />
          {copied ? '✓ 已复制' : t('buttons.copy')}
        </button>

        <button
          onClick={handleClear}
          className="flex items-center gap-2 bg-slate-600 hover:bg-slate-700 text-white font-semibold py-2 px-4 rounded transition-colors"
        >
          <Trash2 size={18} />
          {t('buttons.clear')}
        </button>
      </div>
    </div>
  );
}
