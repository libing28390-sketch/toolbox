'use client';

import React, { useState, useEffect } from 'react';
import { Copy, Download, RefreshCw, Server, Shield, Globe, Folder, ArrowRightLeft, Settings, ChevronDown, ChevronUp, Lock, Zap, HardDrive } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

export default function NginxConfigGenerator() {
  const t = useTranslations();
  
  // Form State
  const [domain, setDomain] = useState('example.com');
  const [root, setRoot] = useState('/var/www/html');
  const [proxyPass, setProxyPass] = useState('http://localhost:3000');
  const [useSsl, setUseSsl] = useState(false);
  const [isSpa, setIsSpa] = useState(false);
  
  // Advanced Settings State
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [useGzip, setUseGzip] = useState(true);
  const [useSecurity, setUseSecurity] = useState(true);
  const [maxUploadSize, setMaxUploadSize] = useState('10M');

  const [generatedConfig, setGeneratedConfig] = useState('');
  const [copied, setCopied] = useState(false);

  // Generate Config
  useEffect(() => {
    let config = `server {
    listen 80;
    server_name ${domain};
`;

    if (useSsl) {
        config += `
    # Redirect HTTP to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ${domain};

    ssl_certificate /etc/letsencrypt/live/${domain}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${domain}/privkey.pem;
    
    # Recommended SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
`;
    }

    // Basic Settings
    config += `
    # Basic Settings
    client_max_body_size ${maxUploadSize};
`;

    // Security Headers
    if (useSecurity) {
        config += `
    # Security Headers
    server_tokens off;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    # add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always; # Uncomment if you know what you are doing
`;
        if (useSsl) {
             config += `    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
`;
        }
    }

    // Gzip Compression
    if (useGzip) {
        config += `
    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 10240;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml application/json application/javascript application/xml+rss application/atom+xml image/svg+xml;
    gzip_disable "MSIE [1-6]\\.";
`;
    }

    if (proxyPass) {
        // When proxy_pass is set, root is typically not needed for / location, 
        // but we keep it global or just ignore it in location block. 
        // Best practice: if proxy, don't use root in location /.
    } else {
        config += `
    # Root Directory
    root ${root};
    index index.html index.htm index.nginx-debian.html;
`;
    }

    config += `
    # Logging
    access_log /var/log/nginx/${domain}.access.log;
    error_log /var/log/nginx/${domain}.error.log;

    location / {
`;

    if (proxyPass) {
         config += `        # Proxy Pass
        proxy_pass ${proxyPass};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
`;
    } else if (isSpa) {
        config += `        # SPA Support
        try_files $uri $uri/ /index.html;
`;
    } else {
        config += `        try_files $uri $uri/ =404;
`;
    }

    config += `    }
`;

    if (!proxyPass) {
        config += `    
    # Cache static files
    location ~* \\.(jpg|jpeg|png|gif|ico|css|js)$ {
        expires 7d;
        access_log off;
    }
`;
    }

    config += `}`;

    setGeneratedConfig(config);
  }, [domain, root, proxyPass, useSsl, isSpa, useGzip, useSecurity, maxUploadSize]);

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedConfig);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([generatedConfig], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${domain}.conf`;
    a.click();
  };

  return (
    <div className="flex h-[calc(100vh-64px)] w-full bg-[#09090b] text-white overflow-hidden font-sans">
      {/* Left Pane: Form */}
      <div className="w-1/3 min-w-[350px] h-full border-r border-white/10 flex flex-col bg-[#09090b] z-10 shadow-xl overflow-y-auto">
        <div className="p-6 border-b border-white/10 bg-[#09090b]">
          <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <Server className="text-blue-500" />
            Nginx Config Generator
          </h2>
          <p className="text-zinc-400 text-sm mt-1">Configure your server block settings</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Domain */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
              <Globe size={16} /> Domain Name
            </label>
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="w-full bg-[#18181b] border border-white/10 rounded-lg px-4 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder:text-zinc-600"
              placeholder="example.com"
            />
          </div>

          {/* Root Directory */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
              <Folder size={16} /> Root Directory
            </label>
            <input
              type="text"
              value={root}
              onChange={(e) => setRoot(e.target.value)}
              className="w-full bg-[#18181b] border border-white/10 rounded-lg px-4 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder:text-zinc-600"
              placeholder="/var/www/html"
            />
          </div>

          {/* Proxy Pass */}
          <div className="space-y-2">
             <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                <ArrowRightLeft size={16} /> Proxy Pass
                </label>
                <span className="text-[10px] text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded border border-white/5">Optional</span>
             </div>
            <input
              type="text"
              value={proxyPass}
              onChange={(e) => setProxyPass(e.target.value)}
              className="w-full bg-[#18181b] border border-white/10 rounded-lg px-4 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder:text-zinc-600"
              placeholder="http://localhost:3000"
            />
             <p className="text-xs text-zinc-500">Overrides root directory serving if set.</p>
          </div>

          {/* Toggles */}
          <div className="space-y-4 pt-4 border-t border-white/10">
            <label className="flex items-center justify-between p-3 rounded-lg bg-[#18181b] border border-white/5 hover:border-white/10 transition-colors cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-md transition-colors", useSsl ? "bg-green-500/20 text-green-400" : "bg-zinc-800 text-zinc-500")}>
                    <Shield size={18} />
                </div>
                <div>
                    <div className="text-sm font-medium text-zinc-200">Enable HTTPS (SSL)</div>
                    <div className="text-xs text-zinc-500">Generate 443 block & redirects</div>
                </div>
              </div>
              <input 
                type="checkbox" 
                checked={useSsl} 
                onChange={(e) => setUseSsl(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-600 text-blue-600 focus:ring-blue-500 bg-zinc-900"
              />
            </label>

            <label className={cn(
                "flex items-center justify-between p-3 rounded-lg bg-[#18181b] border border-white/5 transition-colors cursor-pointer group",
                proxyPass ? "opacity-50 cursor-not-allowed" : "hover:border-white/10"
            )}>
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-md transition-colors", isSpa && !proxyPass ? "bg-purple-500/20 text-purple-400" : "bg-zinc-800 text-zinc-500")}>
                    <RefreshCw size={18} />
                </div>
                <div>
                    <div className="text-sm font-medium text-zinc-200">Single Page App</div>
                    <div className="text-xs text-zinc-500">
                        {proxyPass ? 'Routing handled by backend in Proxy mode' : 'Add try_files for React/Vue'}
                    </div>
                </div>
              </div>
              <input 
                type="checkbox" 
                checked={isSpa && !proxyPass} 
                onChange={(e) => setIsSpa(e.target.checked)}
                disabled={!!proxyPass}
                className="w-4 h-4 rounded border-zinc-600 text-blue-600 focus:ring-blue-500 bg-zinc-900 disabled:opacity-50"
              />
            </label>
          </div>

          {/* Advanced Settings */}
          <div className="border border-white/10 rounded-xl overflow-hidden bg-[#18181b]/50">
            <button
                onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                className="w-full flex items-center justify-between p-4 bg-[#18181b] hover:bg-[#202024] transition-colors"
            >
                <div className="flex items-center gap-2 text-sm font-medium text-zinc-200">
                    <Settings size={16} className="text-blue-500" />
                    Advanced Settings
                </div>
                {isAdvancedOpen ? <ChevronUp size={16} className="text-zinc-500" /> : <ChevronDown size={16} className="text-zinc-500" />}
            </button>
            
            {isAdvancedOpen && (
                <div className="p-4 space-y-4 bg-[#18181b]/30 border-t border-white/10">
                    {/* Gzip */}
                    <label className="flex items-center justify-between cursor-pointer group">
                        <div className="flex items-center gap-3">
                            <div className={cn("p-1.5 rounded-md transition-colors", useGzip ? "bg-orange-500/20 text-orange-400" : "bg-zinc-800 text-zinc-500")}>
                                <Zap size={16} />
                            </div>
                            <span className="text-sm text-zinc-300">Gzip Compression</span>
                        </div>
                        <input 
                            type="checkbox" 
                            checked={useGzip} 
                            onChange={(e) => setUseGzip(e.target.checked)}
                            className="w-4 h-4 rounded border-zinc-600 text-blue-600 focus:ring-blue-500 bg-zinc-900"
                        />
                    </label>

                    {/* Security Headers */}
                    <label className="flex items-center justify-between cursor-pointer group">
                        <div className="flex items-center gap-3">
                            <div className={cn("p-1.5 rounded-md transition-colors", useSecurity ? "bg-red-500/20 text-red-400" : "bg-zinc-800 text-zinc-500")}>
                                <Lock size={16} />
                            </div>
                            <span className="text-sm text-zinc-300">Security Headers</span>
                        </div>
                        <input 
                            type="checkbox" 
                            checked={useSecurity} 
                            onChange={(e) => setUseSecurity(e.target.checked)}
                            className="w-4 h-4 rounded border-zinc-600 text-blue-600 focus:ring-blue-500 bg-zinc-900"
                        />
                    </label>

                    {/* Max Upload Size */}
                    <div className="pt-2">
                        <label className="text-xs font-medium text-zinc-400 flex items-center gap-2 mb-2">
                            <HardDrive size={14} /> Max Upload Size
                        </label>
                        <input
                            type="text"
                            value={maxUploadSize}
                            onChange={(e) => setMaxUploadSize(e.target.value)}
                            className="w-full bg-[#09090b] border border-white/10 rounded px-3 py-1.5 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 placeholder:text-zinc-600"
                            placeholder="10M"
                        />
                    </div>
                </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Pane: Code Output */}
      <div className="flex-1 h-full bg-[#0c0c0e] flex flex-col relative">
         <div className="absolute top-4 right-4 flex gap-2 z-10">
            <button
               onClick={handleCopy}
               className="flex items-center gap-2 px-3 py-2 bg-[#18181b] hover:bg-[#27272a] text-zinc-200 border border-white/10 rounded-lg shadow-lg transition-colors text-xs font-medium"
             >
               <Copy size={14} />
               {copied ? 'Copied!' : 'Copy'}
             </button>
             <button
               onClick={handleDownload}
               className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white border border-blue-500/50 rounded-lg shadow-lg shadow-blue-900/20 transition-all text-xs font-medium"
             >
               <Download size={14} />
               Download
             </button>
         </div>
         
         <div className="flex-1 overflow-auto p-8">
            <pre className="font-mono text-sm text-zinc-300 leading-relaxed">
                <code>{generatedConfig}</code>
            </pre>
         </div>
      </div>
    </div>
  );
}
