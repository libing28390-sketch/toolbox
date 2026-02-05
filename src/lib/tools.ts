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
      let formatted = '';
      let indent = '';
      const indentStr = '  ';

      for (let i = 0; i < xml.length; i++) {
        const char = xml[i];
        const nextChar = xml[i + 1];

        if (char === '<') {
          if (xml[i + 1] === '/') {
            indent = indent.slice(0, -indentStr.length);
          }
          formatted += '\n' + indent + '<';
        } else if (char === '>') {
          formatted += '>';
          if (nextChar !== '<' && nextChar !== '/') {
            // 文本内容，不添加新行
          } else if (xml.substring(i + 1, i + 2) !== '/') {
            if (xml[i + 1] !== '<' || !xml.substring(i + 1, i + 2).match(/^<!|^\?/)) {
              indent += indentStr;
            }
          }
        } else {
          formatted += char;
        }
      }
      return formatted.trim();
    } catch (e) {
      throw new Error('Invalid XML');
    }
  },
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
};

// 文本工具函数
export const textTools = {
  toUpperCase: (input: string): string => input.toUpperCase(),
  toLowerCase: (input: string): string => input.toLowerCase(),
  
  wordCount: (input: string): number => {
    return input.trim().split(/\s+/).filter(w => w.length > 0).length;
  },

  charCount: (input: string): number => {
    return input.length;
  },
};
