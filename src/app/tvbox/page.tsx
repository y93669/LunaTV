'use client';

import { AlertTriangle, Monitor, Shield, Smartphone, Tv, Activity } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import PageLayout from '@/components/PageLayout';

interface SecurityConfig {
  enableAuth: boolean;
  token: string;
  enableIpWhitelist: boolean;
  allowedIPs: string[];
  enableRateLimit: boolean;
  rateLimit: number;
}

interface DiagnosisResult {
  spider?: string;
  spiderPrivate?: boolean;
  spiderReachable?: boolean;
  spiderStatus?: number;
  spiderSizeKB?: number;
  spiderLastModified?: string;
  contentLength?: string;
  lastModified?: string;
  spider_url?: string;
  spider_md5?: string;
  spider_cached?: boolean;
  spider_real_size?: number;
  spider_tried?: number;
  spider_success?: boolean;
  spider_backup?: string;
  spider_candidates?: string[];
  status?: number;
  contentType?: string;
  hasJson?: boolean;
  sitesCount?: number;
  livesCount?: number;
  parsesCount?: number;
  privateApis?: number;
  configUrl?: string;
  issues?: string[];
  pass?: boolean;
  error?: string;
}

export default function TVBoxConfigPage() {
  const [copied, setCopied] = useState(false);
  const [format, setFormat] = useState<'json' | 'base64'>('json');
  const [configMode, setConfigMode] = useState<'standard' | 'safe' | 'fast' | 'yingshicang'>('standard');
  const [securityConfig, setSecurityConfig] = useState<SecurityConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [diagnosing, setDiagnosing] = useState(false);
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnosisResult | null>(null);

  // 获取安全配置（使用普通用户可访问的接口）
  const fetchSecurityConfig = useCallback(async () => {
    try {
      const response = await fetch('/api/tvbox-config');
      if (response.ok) {
        const data = await response.json();
        setSecurityConfig(data.securityConfig || null);
      }
    } catch (error) {
      console.error('获取安全配置失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSecurityConfig();
  }, [fetchSecurityConfig]);

  const getConfigUrl = useCallback(() => {
    if (typeof window === 'undefined') return '';
    const baseUrl = window.location.origin;
    const params = new URLSearchParams();

    params.append('format', format);

    // 如果启用了Token验证，自动添加token参数
    if (securityConfig?.enableAuth && securityConfig.token) {
      params.append('token', securityConfig.token);
    }

    // 添加配置模式参数
    if (configMode !== 'standard') {
      params.append('mode', configMode);
    }

    return `${baseUrl}/api/tvbox?${params.toString()}`;
  }, [format, configMode, securityConfig]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getConfigUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Copy failed silently
    }
  };

  const handleDiagnose = async () => {
    setDiagnosing(true);
    setDiagnosisResult(null);
    try {
      const params = new URLSearchParams();
      if (securityConfig?.enableAuth && securityConfig.token) {
        params.append('token', securityConfig.token);
      }
      const response = await fetch(`/api/tvbox/diagnose?${params.toString()}`);
      const data = await response.json();
      setDiagnosisResult(data);
    } catch (error) {
      setDiagnosisResult({ error: '诊断失败，请稍后重试' });
    } finally {
      setDiagnosing(false);
    }
  };

  return (
    <PageLayout activePath="/tvbox">
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        {/* 页面标题 */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <Tv className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                TVBox 配置
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                将 蓝果TV 的视频源导入到 TVBox 应用中使用
              </p>
            </div>
          </div>
        </div>

        {/* 安全状态提示 */}
        {!loading && securityConfig && (
          <div className="mb-6">
            {(securityConfig.enableAuth || securityConfig.enableIpWhitelist || securityConfig.enableRateLimit) ? (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-green-800 dark:text-green-200 mb-1">
                      🔒 已启用安全配置
                    </h3>
                    <div className="text-sm text-green-700 dark:text-green-300 space-y-1">
                      {securityConfig.enableAuth && (
                        <p>• Token验证：已启用（URL已自动包含token）</p>
                      )}
                      {securityConfig.enableIpWhitelist && (
                        <p>• IP白名单：已启用（限制 {securityConfig.allowedIPs.length} 个IP访问）</p>
                      )}
                      {securityConfig.enableRateLimit && (
                        <p>• 频率限制：每分钟最多 {securityConfig.rateLimit} 次请求</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
                      ⚠️ 安全提醒
                    </h3>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      当前未启用任何安全配置，任何人都可以访问您的TVBox配置。建议在管理后台启用安全选项。
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 配置链接卡片 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            🔗 配置链接
          </h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              格式类型
            </label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as 'json' | 'base64')}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="json">JSON 格式（推荐）</option>
              <option value="base64">Base64 格式</option>
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {format === 'json'
                ? '标准的 JSON 配置文件，便于调试和查看'
                : '编码后的配置，适合某些特殊环境'}
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              配置模式
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <label className="flex items-center cursor-pointer p-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors">
                <input
                  type="radio"
                  name="configMode"
                  value="standard"
                  checked={configMode === 'standard'}
                  onChange={(e) => setConfigMode(e.target.value as 'standard' | 'safe' | 'fast' | 'yingshicang')}
                  className="mr-2 w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <div className="text-sm">
                  <span className="font-medium text-gray-900 dark:text-white block">标准模式</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">完整配置</span>
                </div>
              </label>
              <label className="flex items-center cursor-pointer p-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors">
                <input
                  type="radio"
                  name="configMode"
                  value="safe"
                  checked={configMode === 'safe'}
                  onChange={(e) => setConfigMode(e.target.value as 'standard' | 'safe' | 'fast' | 'yingshicang')}
                  className="mr-2 w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <div className="text-sm">
                  <span className="font-medium text-gray-900 dark:text-white block">精简模式</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">提高兼容</span>
                </div>
              </label>
              <label className="flex items-center cursor-pointer p-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-green-500 dark:hover:border-green-400 transition-colors">
                <input
                  type="radio"
                  name="configMode"
                  value="fast"
                  checked={configMode === 'fast'}
                  onChange={(e) => setConfigMode(e.target.value as 'standard' | 'safe' | 'fast' | 'yingshicang')}
                  className="mr-2 w-4 h-4 text-green-600 focus:ring-green-500"
                />
                <div className="text-sm">
                  <span className="font-medium text-gray-900 dark:text-white block">快速模式</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">优化切换</span>
                </div>
              </label>
              <label className="flex items-center cursor-pointer p-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors">
                <input
                  type="radio"
                  name="configMode"
                  value="yingshicang"
                  checked={configMode === 'yingshicang'}
                  onChange={(e) => setConfigMode(e.target.value as 'standard' | 'safe' | 'fast' | 'yingshicang')}
                  className="mr-2 w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <div className="text-sm">
                  <span className="font-medium text-gray-900 dark:text-white block">影视仓</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">专用优化</span>
                </div>
              </label>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {configMode === 'standard'
                ? '包含完整配置（IJK优化、广告过滤、DoH等），推荐使用'
                : configMode === 'safe'
                ? '仅包含核心配置，遇到TVBox兼容性问题时使用'
                : configMode === 'fast'
                ? '⚡ 优化源切换速度，减少卡顿和SSL错误，适合频繁切换源的用户'
                : '专为影视仓优化，包含播放规则和兼容性修复'}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="text"
              readOnly
              value={getConfigUrl()}
              className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm focus:outline-none"
            />
            <button
              onClick={handleCopy}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${copied
                  ? 'bg-green-500 hover:bg-green-600 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
                } transform hover:scale-105`}
            >
              {copied ? '✓ 已复制' : '复制'}
            </button>
          </div>
        </div>

        {/* 查看配置按钮 */}
        <div className="mb-6 flex justify-center">
          <a
            href="https://qunbao.xyz/tvbox"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105"
          >
            点击此处下载TVBOX
          </a>
        </div>

        {/* 使用说明 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            📋 使用说明
          </h2>

          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400 font-bold text-sm">
                1
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  获取配置链接
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  复制上方的配置链接，支持 JSON 和 Base64 两种格式。
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400 font-bold text-sm">
                2
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  导入 TVBox
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  打开 TVBox 应用，进入设置 → 配置地址，粘贴复制的链接并确认导入。
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400 font-bold text-sm">
                3
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  开始使用
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  配置导入成功后，即可在 TVBox 中浏览和观看 蓝果TV 的视频内容。
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 支持功能 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            ✨ 支持功能
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Monitor className="w-4 h-4" />
                视频功能
              </h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 ml-6">
                <li>• 自动同步 蓝果TV 的所有视频源</li>
                <li>• 支持搜索和快速搜索</li>
                <li>• 支持分类筛选</li>
                <li>• 内置视频解析接口</li>
                <li>• 广告过滤规则</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Smartphone className="w-4 h-4" />
                兼容性
              </h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 ml-6">
                <li>• 完全兼容 TVBox 及衍生应用</li>
                <li>• 支持 Android TV、手机、平板</li>
                <li>• 配置实时更新</li>
                <li>• CORS 跨域支持</li>
                <li>• 配置即时生效</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 技术细节 */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-700">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            🛠️ 技术细节
          </h2>

          <div className="grid md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">API 端点</h4>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 font-mono text-xs">
                GET /api/tvbox?format=json<br />
                GET /api/tvbox?format=base64<br />
                {securityConfig?.enableAuth && (
                  <>GET /api/tvbox?format=json&token=***<br /></>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">更新机制</h4>
              <ul className="text-gray-600 dark:text-gray-400 space-y-1">
                <li>• 配置变更即时生效</li>
                <li>• 无缓存延迟</li>
                <li>• 支持手动刷新</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 注意事项 */}
        <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
          <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
            ⚠️ 注意事项
          </h3>
          <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
            <li>• 确保 TVBox 设备能够访问 蓝果TV 服务器</li>
            <li>• 建议使用 HTTPS 协议确保安全性</li>
            <li>• 配置修改后即时生效，无需等待缓存刷新</li>
            <li>• 解析效果取决于原始视频源的可用性</li>
            {securityConfig?.enableAuth && (
              <li>• 配置链接包含访问token，请勿泄露给他人</li>
            )}
            {securityConfig?.enableIpWhitelist && (
              <li>• IP白名单限制下，只有授权IP可以访问配置</li>
            )}
            {securityConfig?.enableRateLimit && (
              <li>• 频率限制可能影响频繁刷新，属于正常现象</li>
            )}
          </ul>
        </div>

        {/* 诊断功能 */}
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                🔍 配置诊断
              </h2>
            </div>
            <button
              onClick={handleDiagnose}
              disabled={diagnosing}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
            >
              {diagnosing ? '诊断中...' : '开始诊断'}
            </button>
          </div>

          {diagnosisResult && (
            <div className="space-y-4">
              {diagnosisResult.error ? (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                  <p className="text-red-700 dark:text-red-300">{diagnosisResult.error}</p>
                </div>
              ) : (
                <>
                  {/* Spider JAR 状态 */}
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Spider JAR:</h3>
                    <div className="font-mono text-xs text-gray-600 dark:text-gray-300 break-all mb-2">
                      {diagnosisResult.spider}
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {diagnosisResult.spiderPrivate === false && (
                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">
                          ✓ Spider 是公网地址
                        </span>
                      )}
                      {diagnosisResult.spiderReachable !== undefined && (
                        diagnosisResult.spiderReachable ? (
                          <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">
                            ✓ Spider 可访问 {diagnosisResult.spiderStatus && `(状态码: ${diagnosisResult.spiderStatus})`}
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded">
                            ✗ Spider 不可访问 {diagnosisResult.spiderStatus && `(状态码: ${diagnosisResult.spiderStatus})`}
                          </span>
                        )
                      )}
                      {diagnosisResult.spiderSizeKB !== undefined && (
                        <span className={`px-2 py-1 rounded ${
                          diagnosisResult.spiderSizeKB < 50
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                            : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                        }`}>
                          {diagnosisResult.spiderSizeKB < 50 ? '⚠' : '✓'} 文件大小: {diagnosisResult.spiderSizeKB}KB
                        </span>
                      )}
                    </div>
                    {diagnosisResult.spiderLastModified && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        最后修改: {new Date(diagnosisResult.spiderLastModified).toLocaleString('zh-CN')}
                      </p>
                    )}
                  </div>

                  {/* Spider Jar 状态 */}
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Spider Jar 状态:</h3>
                    <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                      <li>• 来源: {diagnosisResult.spider_url || 'unknown'}</li>
                      <li>• MD5: {diagnosisResult.spider_md5 || 'unknown'}</li>
                      <li>• 缓存: {diagnosisResult.spider_cached ? '✓ 是' : '✗ 否（实时下载）'}</li>
                      <li>• 真实大小: {diagnosisResult.spider_real_size ? `${Math.round(diagnosisResult.spider_real_size / 1024)}KB` : 'unknown'}</li>
                      <li>• 尝试次数: {diagnosisResult.spider_tried || 0}</li>
                      <li>• 状态: {diagnosisResult.spider_success ? '✓ 成功' : '✗ 降级（使用fallback jar）'}</li>
                    </ul>
                  </div>

                  {/* 备用代理地址 */}
                  {diagnosisResult.spider_backup && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">备用代理地址:</h3>
                      <p className="font-mono text-xs text-blue-700 dark:text-blue-300 break-all">
                        {diagnosisResult.spider_backup}
                      </p>
                    </div>
                  )}

                  {/* 配置统计信息 */}
                  {(diagnosisResult.sitesCount !== undefined || diagnosisResult.livesCount !== undefined) && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">配置统计:</h3>
                      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-300">
                        {diagnosisResult.sitesCount !== undefined && (
                          <>
                            <div>影视源数量:</div>
                            <div className="text-gray-900 dark:text-gray-100">{diagnosisResult.sitesCount}</div>
                          </>
                        )}
                        {diagnosisResult.livesCount !== undefined && (
                          <>
                            <div>直播源数量:</div>
                            <div className="text-gray-900 dark:text-gray-100">{diagnosisResult.livesCount}</div>
                          </>
                        )}
                        {diagnosisResult.parsesCount !== undefined && (
                          <>
                            <div>解析源数量:</div>
                            <div className="text-gray-900 dark:text-gray-100">{diagnosisResult.parsesCount}</div>
                          </>
                        )}
                        {diagnosisResult.privateApis !== undefined && (
                          <>
                            <div>私网API数量:</div>
                            <div className={diagnosisResult.privateApis > 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'}>
                              {diagnosisResult.privateApis}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 候选列表 */}
                  {diagnosisResult.spider_candidates && diagnosisResult.spider_candidates.length > 0 && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Spider JAR 候选列表:</h3>
                      <div className="space-y-1">
                        {diagnosisResult.spider_candidates.map((candidate, idx) => (
                          <div key={idx} className="font-mono text-xs text-gray-600 dark:text-gray-400 break-all">
                            {idx + 1}. {candidate}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 问题列表 */}
                  {diagnosisResult.issues && diagnosisResult.issues.length > 0 && (
                    <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg">
                      <h3 className="font-semibold text-orange-800 dark:text-orange-300 mb-2">发现以下问题:</h3>
                      <ul className="text-sm text-orange-700 dark:text-orange-300 space-y-1">
                        {diagnosisResult.issues.map((issue, idx) => (
                          <li key={idx}>• {issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {!diagnosisResult && !diagnosing && (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              点击 "开始诊断" 检查 TVBox 配置的健康状态
            </p>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
