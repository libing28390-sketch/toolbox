import * as OpenCC from 'opencc-js';
import CryptoJS from 'crypto-js';
import { v4 as uuidv4 } from 'uuid';
import { marked } from 'marked';

// 代码工具函数
export const codeTools = {
  formatJSON: (input: string): string => {
    try {
      const parsed = JSON.parse(input);
      return JSON.stringify(parsed, null, 2);
    } catch (e) {
      throw new Error('Invalid JSON');
    }
  },

  minifyJSON: (input: string): string => {
    try {
      const parsed = JSON.parse(input);
      return JSON.stringify(parsed);
    } catch (e) {
      throw new Error('Invalid JSON');
    }
  },

  formatXML: (input: string): string => {
    try {
      let xml = input.trim();
      // Simple regex-based formatter (can be improved)
      let formatted = '';
      let indent = 0;
      const tab = '  ';
      xml.split(/>\s*</).forEach(function(node) {
          if (node.match( /^\/\w/ )) indent -= 1;
          formatted += new Array(indent + 1).join(tab) + '<' + node + '>\r\n';
          if (node.match( /^<?\w[^>]*[^\/]$/ )) indent += 1;
      });
      return formatted.substring(1, formatted.length-3);
    } catch (e) {
      throw new Error('Invalid XML');
    }
  },

  async formatCode(code: string, language: string = 'javascript') {
    const response = await fetch('/api/tools/code/format', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, language }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Formatting failed');
    }
    const data = await response.json();
    return data.result;
  },

  async minifyCode(code: string) {
    const response = await fetch('/api/tools/code/minify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Minification failed');
    }
    const data = await response.json();
    return data.result;
  }
};

// 编码工具函数
export const encodingTools = {
  urlEncode: (input: string): string => {
    return encodeURIComponent(input);
  },

  urlDecode: (input: string): string => {
    return decodeURIComponent(input);
  },

  base64Encode: (input: string): string => {
    return btoa(unescape(encodeURIComponent(input)));
  },

  base64Decode: (input: string): string => {
    return decodeURIComponent(escape(atob(input)));
  },

  md5: (input: string): string => {
    return CryptoJS.MD5(input).toString();
  },

  sha: (input: string): string => {
    return CryptoJS.SHA256(input).toString();
  },

  uuid: (): string => {
    return uuidv4();
  },
};

// 时间工具函数
export const timeTools = {
  timestampToDate: (timestamp: number | string): string => {
    const num = typeof timestamp === 'string' ? parseInt(timestamp) : timestamp;
    if (isNaN(num)) return 'Invalid timestamp';
    const ms = num.toString().length === 10 ? num * 1000 : num;
    return new Date(ms).toISOString();
  },

  dateToTimestamp: (date: string): string => {
    const time = new Date(date).getTime();
    if (isNaN(time)) return 'Invalid date';
    return (time / 1000).toString();
  },

  getCurrentTimestamp: (): string => {
    return Math.floor(Date.now() / 1000).toString();
  },

  convertTimezone: (input: string, fromTz: string, toTz: string): string => {
    try {
      // Input format: YYYY-MM-DD HH:mm:ss
      // This is a simple implementation. For robust timezone handling, date-fns-tz or dayjs is recommended.
      // Here we simulate by just showing the time with offset if possible or using simple Date.
      // Since we don't have a heavy library, we'll return a placeholder message or basic UTC conversion.
      const date = new Date(input);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return `UTC: ${date.toISOString()}\nLocal: ${date.toLocaleString()}`;
    } catch (e) {
      return 'Error converting timezone';
    }
  },

  calcCountdown: (targetDate: string): string => {
    const target = new Date(targetDate).getTime();
    const now = Date.now();
    const diff = target - now;

    if (isNaN(target)) return 'Invalid Date';
    if (diff < 0) return 'Date passed';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  }
};

// 颜色工具函数
export const colorTools = {
  hexToRgb: (hex: string): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return 'Invalid HEX';
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    return `rgb(${r}, ${g}, ${b})`;
  },

  rgbToHex: (rgb: string): string => {
    const match = rgb.match(/\d+/g);
    if (!match || match.length !== 3) return 'Invalid RGB';
    const hex = (x: string) => {
      const num = parseInt(x);
      return num < 16 ? '0' + num.toString(16) : num.toString(16);
    };
    return '#' + hex(match[0]) + hex(match[1]) + hex(match[2]);
  },

  generatePalette: (baseColor: string): string => {
    // Simple logic: lighter and darker variants
    // Assume input is HEX
    return `Base: ${baseColor}\n(Palette generation requires more complex logic, returning placeholder)`;
  },

  checkContrast: (color1: string, color2: string): string => {
    return `Contrast check between ${color1} and ${color2}: (Calculation logic pending)`;
  }
};

// 文本工具函数
export const textTools = {
  toUpperCase: (input: string): string => input.toUpperCase(),
  toLowerCase: (input: string): string => input.toLowerCase(),

  charCount: (input: string): number => {
    return input.length;
  },

  wordCount: (input: string): number => {
    const clean = input.replace(/[^\w\s\u4e00-\u9fa5]/g, '');
    return clean.trim().split(/\s+/).filter(Boolean).length;
  },

  convertChinese: async (input: string, type: 's2t' | 't2s'): Promise<string> => {
    const converter = OpenCC.Converter({ from: type === 's2t' ? 'cn' : 'hk', to: type === 's2t' ? 'hk' : 'cn' });
    return converter(input);
  },

  convertEmoji: (input: string): string => {
    const map: Record<string, string> = {
      ':smile:': '😀',
      ':laugh:': '😂',
      ':sad:': '😢',
      ':cry:': '😭',
      ':love:': '❤️',
      ':thumbsup:': '👍',
      ':thumbsdown:': '👎',
      ':check:': '✅',
      ':x:': '❌',
      ':fire:': '🔥',
      ':star:': '⭐',
      ':rocket:': '🚀',
    };
    return input.replace(/:[a-z0-9_]+:/g, (match) => map[match] || match);
  },

  analyzeDensity: (input: string): string => {
    const words = input.toLowerCase().match(/\b\w+\b/g) || [];
    const total = words.length;
    if (total === 0) return 'No words found';

    const counts: Record<string, number> = {};
    words.forEach(w => counts[w] = (counts[w] || 0) + 1);

    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20);

    return sorted.map(([word, count]) => {
      const percentage = ((count / total) * 100).toFixed(2);
      return `${word}: ${count} (${percentage}%)`;
    }).join('\n');
  },

  removeDuplicates: (input: string): string => {
    const lines = input.split('\n');
    const unique = new Set(lines);
    return Array.from(unique).join('\n');
  },

  testRegex: (input: string, regexStr: string, flags: string = 'g'): string => {
    try {
      const regex = new RegExp(regexStr, flags);
      const matches = input.match(regex);
      if (!matches) return 'No matches found';
      return `Found ${matches.length} matches:\n` + matches.join('\n');
    } catch (e: any) {
      return `Invalid Regex: ${e.message}`;
    }
  },

  extractReplace: (input: string, regexStr: string, replaceStr: string): string => {
    try {
      const regex = new RegExp(regexStr, 'g');
      return input.replace(regex, replaceStr);
    } catch (e: any) {
      return `Invalid Regex: ${e.message}`;
    }
  }
};

// 数据处理工具函数
export const dataTools = {
  csvToJson: (input: string): string => {
    const lines = input.trim().split('\n');
    if (lines.length < 2) return '[]';
    const headers = lines[0].split(',').map(h => h.trim());
    const result = lines.slice(1).map(line => {
      const values = line.split(',');
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => {
        obj[h] = values[i]?.trim() || '';
      });
      return obj;
    });
    return JSON.stringify(result, null, 2);
  },

  markdownToHtml: async (input: string): Promise<string> => {
    return marked(input);
  },

  generateRandom: (length: number = 16, type: 'string' | 'number' = 'string'): string => {
    if (type === 'number') {
      return Math.floor(Math.random() * Math.pow(10, length)).toString();
    }
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  mockData: (schema: string): string => {
    // Simple mock based on keys
    return JSON.stringify({
      id: 1,
      name: "John Doe",
      email: "john@example.com",
      role: "admin",
      active: true
    }, null, 2);
  },

  analyzeData: (input: string): string => {
    // Expecting number list
    const nums = input.split(/[\s,]+/).map(Number).filter(n => !isNaN(n));
    if (nums.length === 0) return 'No numbers found';
    const min = Math.min(...nums);
    const max = Math.max(...nums);
    const sum = nums.reduce((a, b) => a + b, 0);
    const avg = sum / nums.length;
    return `Count: ${nums.length}\nMin: ${min}\nMax: ${max}\nSum: ${sum}\nAvg: ${avg.toFixed(2)}`;
  }
};
