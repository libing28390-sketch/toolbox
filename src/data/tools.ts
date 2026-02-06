export interface Tool {
  id: string;
  nameKey: string;
  categoryKey: string;
  icon: string;
  href?: string;
}

export const toolsData: Tool[][] = [
  // Code Tools
  [
    { id: 'json-visualizer', nameKey: 'tools.jsonVisualizer', categoryKey: 'categories.codeTools', icon: '🕸️', href: '/tools/json-visualizer' },
    { id: 'git-rescue', nameKey: 'tools.gitRescue', categoryKey: 'categories.codeTools', icon: '🚑', href: '/tools/git-rescue' },
    { id: 'nginx-config-generator', nameKey: 'tools.nginxConfigGenerator', categoryKey: 'categories.codeTools', icon: '⚙️', href: '/tools/nginx-config-generator' },
    { id: 'docker-compose-visualizer', nameKey: 'tools.dockerComposeVisualizer', categoryKey: 'categories.codeTools', icon: '🐳', href: '/tools/docker-compose-visualizer' },
    { id: 'cron-timeline', nameKey: 'tools.cronTimeline', categoryKey: 'categories.codeTools', icon: '⏳', href: '/tools/cron-timeline' },
    { id: 'og-image', nameKey: 'tools.ogImage', categoryKey: 'categories.imageTools', icon: '🖼️', href: '/tools/og-image' },
    { id: 'json-formatter', nameKey: 'tools.jsonFormatter', categoryKey: 'categories.codeTools', icon: '{}' },
    { id: 'xml-formatter', nameKey: 'tools.xmlFormatter', categoryKey: 'categories.codeTools', icon: '<>' },
    { id: 'code-prettify', nameKey: 'tools.codePrettify', categoryKey: 'categories.codeTools', icon: '✨' },
    { id: 'code-minify', nameKey: 'tools.codeMinify', categoryKey: 'categories.codeTools', icon: '⚡' },
  ],
  // Encoding Tools
  [
    { id: 'url-encode', nameKey: 'tools.urlEncode', categoryKey: 'categories.encodingTools', icon: '🔗' },
    { id: 'base64', nameKey: 'tools.base64', categoryKey: 'categories.encodingTools', icon: '📝' },
    { id: 'md5', nameKey: 'tools.md5', categoryKey: 'categories.encodingTools', icon: '#️⃣' },
    { id: 'sha', nameKey: 'tools.sha', categoryKey: 'categories.encodingTools', icon: '🔐' },
    { id: 'uuid', nameKey: 'tools.uuid', categoryKey: 'categories.encodingTools', icon: '🆔' },
  ],
  // Time Tools
  [
    { id: 'timestamp', nameKey: 'tools.timestamp', categoryKey: 'categories.timeTools', icon: '⏰' },
    { id: 'timezone', nameKey: 'tools.timezone', categoryKey: 'categories.timeTools', icon: '🌍' },
    { id: 'countdown', nameKey: 'tools.countdown', categoryKey: 'categories.timeTools', icon: '📊' },
  ],
  // Color Tools
  [
    { id: 'color-converter', nameKey: 'tools.colorConverter', categoryKey: 'categories.colorTools', icon: '🎨' },
    { id: 'color-palette', nameKey: 'tools.colorPalette', categoryKey: 'categories.colorTools', icon: '🖌️' },
    { id: 'contrast-check', nameKey: 'tools.contrastCheck', categoryKey: 'categories.colorTools', icon: '👁️' },
  ],
  // Text Tools
  [
    { id: 'case-converter', nameKey: 'tools.caseConverter', categoryKey: 'categories.textTools', icon: 'Aa' },
    { id: 'simplified-chinese', nameKey: 'tools.simplifiedChinese', categoryKey: 'categories.textTools', icon: '中' },
    { id: 'emoji-converter', nameKey: 'tools.emojiConverter', categoryKey: 'categories.textTools', icon: '😀' },
    { id: 'word-count', nameKey: 'tools.wordCount', categoryKey: 'categories.textTools', icon: '📄' },
    { id: 'density-analysis', nameKey: 'tools.densityAnalysis', categoryKey: 'categories.textTools', icon: '📊' },
    { id: 'repeat-check', nameKey: 'tools.repeatCheck', categoryKey: 'categories.textTools', icon: '🔍' },
    { id: 'regex', nameKey: 'tools.regex', categoryKey: 'categories.textTools', icon: '.*' },
    { id: 'extract-replace', nameKey: 'tools.extractReplace', categoryKey: 'categories.textTools', icon: '🔄' },
  ],
  // Data Processing
  [
    { id: 'csv-to-json', nameKey: 'tools.csvToJson', categoryKey: 'categories.dataProcessing', icon: '📈' },
    { id: 'excel-preview', nameKey: 'tools.excelPreview', categoryKey: 'categories.dataProcessing', icon: '📊' },
    { id: 'markdown-editor', nameKey: 'tools.markdownEditor', categoryKey: 'categories.dataProcessing', icon: '📝' },
    { id: 'mock-data', nameKey: 'tools.mockData', categoryKey: 'categories.dataProcessing', icon: '🎲' },
    { id: 'random-generator', nameKey: 'tools.randomGenerator', categoryKey: 'categories.dataProcessing', icon: '🎯' },
    { id: 'api-tester', nameKey: 'tools.apiTester', categoryKey: 'categories.dataProcessing', icon: '🧪' },
    { id: 'json-tree', nameKey: 'tools.jsonTree', categoryKey: 'categories.dataProcessing', icon: '🌳' },
    { id: 'data-analysis', nameKey: 'tools.dataAnalysis', categoryKey: 'categories.dataProcessing', icon: '📉' },
  ],
  // Network Tools
  [
    { id: 'subnet-visualizer', nameKey: 'tools.subnetVisualizer', categoryKey: 'categories.networkTools', icon: '🗺️', href: '/tools/subnet-visualizer' },
    { id: 'ip-subnet-calculator', nameKey: 'tools.ipSubnetCalculator', categoryKey: 'categories.networkTools', icon: '🔢' },
    { id: 'ip-lookup', nameKey: 'tools.ipLookup', categoryKey: 'categories.networkTools', icon: '🌐' },
    { id: 'whois', nameKey: 'tools.whois', categoryKey: 'categories.networkTools', icon: '📋' },
    { id: 'dns-lookup', nameKey: 'tools.dnsLookup', categoryKey: 'categories.networkTools', icon: '🔎' },
    { id: 'mac-lookup', nameKey: 'tools.macLookup', categoryKey: 'categories.networkTools', icon: '🏷️' },
    { id: 'ua-parser', nameKey: 'tools.uaParser', categoryKey: 'categories.networkTools', icon: '🖥️' },
    { id: 'ssl-checker', nameKey: 'tools.sslChecker', categoryKey: 'categories.networkTools', icon: '🔒' },
    { id: 'http-headers', nameKey: 'tools.httpHeaders', categoryKey: 'categories.networkTools', icon: '📑' },
    { id: 'cidr-calc', nameKey: 'tools.cidrCalc', categoryKey: 'categories.networkTools', icon: '🧮' },
  ],
];
