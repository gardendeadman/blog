'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Users, Eye, RefreshCw, ExternalLink } from 'lucide-react';

interface DayData {
  date: string;   // "MM/DD"
  views: number;
  visitors: number;
}

interface PathData {
  path: string;
  views: number;
  visitors: number;
}

interface Overview {
  todayViews: number;
  totalViews: number;
  todayVisitors: number;
  totalVisitors: number;
}

const DAYS = 14; // 최근 N일

function kstDateStr(offsetDays = 0): string {
  // Intl 기반 KST 날짜 계산 — 서버/클라이언트 환경 무관
  const d = new Date(Date.now() - offsetDays * 86400000);
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(d); // "YYYY-MM-DD"
}

export default function AnalyticsSection() {
  const supabase = createClient();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [chart, setChart] = useState<DayData[]>([]);
  const [paths, setPaths] = useState<PathData[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<7 | 14 | 30>(14);

  const load = useCallback(async (days: number) => {
    setLoading(true);
    try {
      const since = `${kstDateStr(days - 1)}T00:00:00+09:00`;
      const todayStart = `${kstDateStr(0)}T00:00:00+09:00`;

      // Fetch all rows in range (limit 5000 for safety)
      const { data: rows } = await supabase
        .from('page_views')
        .select('path, visitor_id, created_at')
        .gte('created_at', since)
        .order('created_at', { ascending: true })
        .limit(5000);

      if (!rows) { setLoading(false); return; }

      // Overview counts
      const todayRows = rows.filter(r => r.created_at >= todayStart);
      setOverview({
        todayViews: todayRows.length,
        totalViews: rows.length,
        todayVisitors: new Set(todayRows.map(r => r.visitor_id).filter(Boolean)).size,
        totalVisitors: new Set(rows.map(r => r.visitor_id).filter(Boolean)).size,
      });

      // Build daily chart data
      const dayMap: Record<string, { views: number; visitors: Set<string> }> = {};
      for (let i = days - 1; i >= 0; i--) {
        const key = kstDateStr(i);
        dayMap[key] = { views: 0, visitors: new Set() };
      }
      rows.forEach(r => {
        const key = new Date(new Date(r.created_at).getTime() + 9 * 60 * 60 * 1000)
          .toISOString().slice(0, 10);
        if (dayMap[key]) {
          dayMap[key].views++;
          if (r.visitor_id) dayMap[key].visitors.add(r.visitor_id);
        }
      });
      setChart(
        Object.entries(dayMap).map(([date, d]) => ({
          date: date.slice(5).replace('-', '/'), // "MM/DD"
          views: d.views,
          visitors: d.visitors.size,
        }))
      );

      // Path stats
      const pathMap: Record<string, { views: number; visitors: Set<string> }> = {};
      rows.forEach(r => {
        if (!pathMap[r.path]) pathMap[r.path] = { views: 0, visitors: new Set() };
        pathMap[r.path].views++;
        if (r.visitor_id) pathMap[r.path].visitors.add(r.visitor_id);
      });
      setPaths(
        Object.entries(pathMap)
          .map(([path, d]) => ({ path, views: d.views, visitors: d.visitors.size }))
          .sort((a, b) => b.views - a.views)
          .slice(0, 20)
      );
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(range); }, [range, load]);

  const card: React.CSSProperties = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    padding: '28px',
    marginBottom: '20px',
  };

  const StatCard = ({ label, value, sub, icon }: { label: string; value: number; sub?: string; icon: React.ReactNode }) => (
    <div style={{ flex: 1, minWidth: '120px', background: 'var(--bg-secondary)', borderRadius: '10px', padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
        {icon} {label}
      </div>
      <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text)', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
        {value.toLocaleString()}
      </div>
      {sub && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>{sub}</div>}
    </div>
  );

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 14px', fontSize: '0.8rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <div style={{ fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>{label}</div>
        {payload.map((p: any) => (
          <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: p.color }} />
            <span style={{ textTransform: 'capitalize' }}>{p.name}:</span>
            <span style={{ fontWeight: 600, color: 'var(--text)' }}>{p.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={card}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', fontWeight: 600, color: 'var(--text)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={18} style={{ color: 'var(--accent)' }} />
            Analytics
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Visitor and page view statistics</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Range selector */}
          <div style={{ display: 'flex', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '3px' }}>
            {([7, 14, 30] as const).map(d => (
              <button
                key={d}
                onClick={() => setRange(d)}
                style={{ padding: '4px 10px', borderRadius: '5px', border: 'none', background: range === d ? 'var(--accent)' : 'transparent', color: range === d ? 'white' : 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-pretendard)', transition: 'all 0.15s ease' }}
              >
                {d}d
              </button>
            ))}
          </div>
          <button
            onClick={() => load(range)}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'var(--font-pretendard)' }}
          >
            <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Loading...
        </div>
      ) : (
        <>
          {/* Overview stats */}
          {overview && (
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
              <StatCard label="Today Visitors" value={overview.todayVisitors} icon={<Users size={11} />} />
              <StatCard label="Total Visitors" value={overview.totalVisitors} sub={`last ${range} days`} icon={<Users size={11} />} />
              <StatCard label="Today Views" value={overview.todayViews} icon={<Eye size={11} />} />
              <StatCard label="Total Views" value={overview.totalViews} sub={`last ${range} days`} icon={<Eye size={11} />} />
            </div>
          )}

          {/* Chart */}
          {chart.length > 0 && (
            <div style={{ marginBottom: '28px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
                Daily Trend
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chart} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="views" name="views" stroke="var(--accent)" strokeWidth={2} fill="url(#colorViews)" dot={false} activeDot={{ r: 4 }} />
                  <Area type="monotone" dataKey="visitors" name="visitors" stroke="#6366f1" strokeWidth={2} fill="url(#colorVisitors)" dot={false} activeDot={{ r: 4 }} />
                </AreaChart>
              </ResponsiveContainer>
              {/* Legend */}
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '8px' }}>
                {[{ color: 'var(--accent)', label: 'Page Views' }, { color: '#6366f1', label: 'Unique Visitors' }].map(l => (
                  <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span style={{ display: 'inline-block', width: '10px', height: '3px', borderRadius: '2px', background: l.color }} />
                    {l.label}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Path breakdown */}
          {paths.length > 0 && (
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
                Top Pages
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {/* Header row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 72px 72px', gap: '8px', padding: '6px 10px', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <span>Path</span>
                  <span style={{ textAlign: 'right' }}>Views</span>
                  <span style={{ textAlign: 'right' }}>Visitors</span>
                </div>
                {paths.map((p, i) => {
                  const maxViews = paths[0]?.views || 1;
                  const pct = (p.views / maxViews) * 100;
                  return (
                    <div
                      key={p.path}
                      style={{ display: 'grid', gridTemplateColumns: '1fr 72px 72px', gap: '8px', padding: '8px 10px', borderRadius: '6px', background: i % 2 === 0 ? 'var(--bg-secondary)' : 'transparent', position: 'relative', overflow: 'hidden', alignItems: 'center' }}
                    >
                      {/* Bar background */}
                      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`, background: 'var(--accent)', opacity: 0.06, borderRadius: '6px', pointerEvents: 'none' }} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', position: 'relative' }}>
                        <ExternalLink size={11} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                        <span style={{ fontSize: '0.8rem', color: 'var(--text)', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.path}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)', textAlign: 'right', position: 'relative', fontVariantNumeric: 'tabular-nums' }}>
                        {p.views.toLocaleString()}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'right', position: 'relative', fontVariantNumeric: 'tabular-nums' }}>
                        {p.visitors.toLocaleString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {chart.length === 0 && paths.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              No data yet. Visit some pages to start tracking.
            </div>
          )}
        </>
      )}
    </div>
  );
}
