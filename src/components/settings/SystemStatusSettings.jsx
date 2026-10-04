import React, { useState, useEffect, useCallback } from 'react';
import {
  FiActivity,
  FiRefreshCw,
  FiCheckCircle,
  FiAlertTriangle,
  FiXCircle,
  FiExternalLink,
  FiServer,
  FiShoppingBag,
  FiGlobe,
  FiClock,
  FiCpu,
  FiWifi
} from 'react-icons/fi';

const STOREFRONT_URL = import.meta.env.VITE_FRONTEND_URL || import.meta.env.VITE_STOREFRONT_URL || 'http://localhost:3000';
const VENDOR_URL = import.meta.env.VITE_VENDOR_URL || 'http://localhost:5174';
const BACKEND_BASE = import.meta.env.VITE_BACKEND_URL || (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : '') || 'http://localhost:5000';
const BACKEND_URL = `${BACKEND_BASE.replace(/\/+$/, '')}/health`;

const DEFAULT_TARGETS = [
  {
    id: 'storefront',
    name: 'Customer Storefront',
    type: 'Next.js App',
    defaultUrl: STOREFRONT_URL,
    description: 'Public eCommerce customer portal, catalogue, and checkout engine',
    icon: FiShoppingBag,
    color: 'emerald',
  },
  {
    id: 'vendor',
    name: 'Merchant / Vendor Portal',
    type: 'Vite React App',
    defaultUrl: VENDOR_URL,
    description: 'Merchant dashboard for product catalog, inventory, and order fulfillment',
    icon: FiGlobe,
    color: 'blue',
  },
  {
    id: 'backend',
    name: 'Backend Core API',
    type: 'Express REST API',
    defaultUrl: BACKEND_URL,
    description: 'Central database, authentication, vendor management, and payment processor',
    icon: FiServer,
    color: 'purple',
  },
];

export default function SystemStatusSettings() {
  const [urls, setUrls] = useState(() => {
    try {
      const saved = localStorage.getItem('jaldibaazi_service_urls');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return {
      storefront: STOREFRONT_URL,
      vendor: VENDOR_URL,
      backend: BACKEND_URL,
    };
  });

  const [statuses, setStatuses] = useState({
    storefront: { status: 'checking', latency: null, lastChecked: null, error: null },
    vendor: { status: 'checking', latency: null, lastChecked: null, error: null },
    backend: { status: 'checking', latency: null, lastChecked: null, error: null },
  });

  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshIntervalSec, setRefreshIntervalSec] = useState(300);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Ping an individual target URL
  const pingService = async (id, targetUrl) => {
    const startTime = performance.now();
    try {
      // Note: For cross-origin dev ports, mode: 'no-cors' allows detecting if port is actively listening
      const res = await fetch(targetUrl, {
        method: 'GET',
        mode: id === 'backend' ? 'cors' : 'no-cors',
        cache: 'no-store',
      });

      const elapsed = Math.round(performance.now() - startTime);
      return {
        status: 'online',
        latency: elapsed,
        lastChecked: new Date().toLocaleTimeString(),
        error: null,
      };
    } catch (err) {
      const elapsed = Math.round(performance.now() - startTime);
      return {
        status: 'offline',
        latency: elapsed,
        lastChecked: new Date().toLocaleTimeString(),
        error: err.message || 'Connection refused or port closed',
      };
    }
  };

  const checkAllServices = useCallback(async () => {
    setIsRefreshing(true);
    const results = {};
    for (const target of DEFAULT_TARGETS) {
      const currentUrl = urls[target.id] || target.defaultUrl;
      results[target.id] = await pingService(target.id, currentUrl);
    }
    setStatuses(results);
    setIsRefreshing(false);
  }, [urls]);

  useEffect(() => {
    checkAllServices();
  }, [checkAllServices]);

  // Periodic heartbeat monitor
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      checkAllServices();
    }, refreshIntervalSec * 1000);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshIntervalSec, checkAllServices]);

  const handleUrlChange = (id, newUrl) => {
    const updated = { ...urls, [id]: newUrl };
    setUrls(updated);
    try {
      localStorage.setItem('jaldibaazi_service_urls', JSON.stringify(updated));
    } catch (e) {
      // ignore
    }
  };

  const onlineCount = Object.values(statuses).filter((s) => s.status === 'online').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Service Health & Live Monitoring
            </h2>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                onlineCount === DEFAULT_TARGETS.length
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : onlineCount > 0
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              {onlineCount}/{DEFAULT_TARGETS.length} Services Operational
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Real-time heartbeat telemetry, uptime monitor, and connectivity verification for Vendor Portal and Storefront.
          </p>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-xs">
            <label className="flex items-center gap-1.5 cursor-pointer font-medium select-none">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>Auto-heartbeat</span>
            </label>
            <select
              value={refreshIntervalSec}
              onChange={(e) => setRefreshIntervalSec(Number(e.target.value))}
              disabled={!autoRefresh}
              className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer disabled:opacity-50"
            >
              <option value={30}>30s</option>
              <option value={60}>1m</option>
              <option value={180}>3m</option>
              <option value={300}>5m</option>
              <option value={600}>10m</option>
            </select>
          </div>

          <button
            type="button"
            onClick={checkAllServices}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition shadow-xs cursor-pointer disabled:opacity-60"
          >
            <FiRefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Pinging...' : 'Check Now'}</span>
          </button>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {DEFAULT_TARGETS.map((target) => {
          const Icon = target.icon;
          const statusInfo = statuses[target.id] || { status: 'checking' };
          const currentUrl = urls[target.id] || target.defaultUrl;
          const isOnline = statusInfo.status === 'online';
          const isChecking = statusInfo.status === 'checking';

          return (
            <div
              key={target.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between space-y-4 transition-all hover:shadow-md"
            >
              <div className="space-y-3">
                {/* Header with Status Pill */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        target.id === 'storefront'
                          ? 'bg-emerald-50 text-emerald-600'
                          : target.id === 'vendor'
                          ? 'bg-blue-50 text-blue-600'
                          : 'bg-purple-50 text-purple-600'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{target.name}</h3>
                      <span className="text-[11px] font-mono text-slate-400">{target.type}</span>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div>
                    {isChecking ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 animate-pulse">
                        <FiRefreshCw className="w-3 h-3 animate-spin" /> Checking
                      </span>
                    ) : isOnline ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        Online & Live
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                        <FiXCircle className="w-3 h-3 text-rose-500" /> Offline
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {target.description}
                </p>

                {/* Telemetry info */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-[11px]">
                  <div className="flex items-center gap-1.5 text-slate-500 font-mono">
                    <FiWifi className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      Latency:{' '}
                      <strong className="text-slate-800">
                        {statusInfo.latency != null ? `${statusInfo.latency}ms` : '—'}
                      </strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500 font-mono justify-end">
                    <FiClock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{statusInfo.lastChecked || 'Pending'}</span>
                  </div>
                </div>

                {/* Endpoint URL Field */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Service Endpoint URL
                  </label>
                  <input
                    type="url"
                    value={currentUrl}
                    onChange={(e) => handleUrlChange(target.id, e.target.value)}
                    className="w-full text-xs font-mono px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                    placeholder={target.defaultUrl}
                  />
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={async () => {
                    const res = await pingService(target.id, currentUrl);
                    setStatuses((prev) => ({ ...prev, [target.id]: res }));
                  }}
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
                >
                  Test Connection
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Documentation & Monitoring Note */}
      <div className="p-4 rounded-xl bg-slate-100/70 border border-slate-200 text-xs text-slate-600 flex items-start gap-3">
        <FiActivity className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-900">How Live Monitoring Operates:</span>{' '}
          The Super Admin control center continuously transmits lightweight heartbeat probes to the configured URLs. If any portal or backend instance goes offline or fails to respond, the status badges reflect offline alerts and latency spikes in real-time.
        </div>
      </div>
    </div>
  );
}
