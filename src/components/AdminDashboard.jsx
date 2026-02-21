import React, { useState, useEffect } from 'react';
import { BASE_URL } from '../api/client';

export default function AdminDashboard({ adminKey, onExit }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [days, setDays] = useState(30);

  const fetchData = async (numDays) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/api/analytics/summary?days=${numDays}`, {
        headers: { 'x-admin-key': adminKey }
      });
      if (!res.ok) {
        throw new Error(res.status === 401 ? 'Invalid admin key' : 'Failed to fetch');
      }
      setData(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(days);
  }, [days]);

  const maxViews = data ? Math.max(...data.dailyViews.map(d => parseInt(d.count)), 1) : 1;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Keto Hunter Analytics</h1>
          <div className="flex items-center gap-4">
            <select
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value))}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
            >
              <option value={7}>Last 7 days</option>
              <option value={14}>Last 14 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
            <button
              onClick={onExit}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition"
            >
              Exit Admin
            </button>
          </div>
        </div>

        {loading && (
          <div className="text-center py-20 text-gray-400">Loading analytics...</div>
        )}

        {error && (
          <div className="text-center py-20 text-red-400">{error}</div>
        )}

        {data && !loading && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard label="Page Views" value={data.totalPageViews} />
              <StatCard label="Unique Sessions" value={data.uniqueSessions} />
              <StatCard label="Total Searches" value={data.totalSearches} />
              <StatCard
                label="Search Rate"
                value={data.uniqueSessions > 0
                  ? `${Math.round((data.totalSearches / data.uniqueSessions) * 100)}%`
                  : '0%'}
              />
            </div>

            {/* Daily Views Chart */}
            <div className="bg-gray-800 rounded-xl p-6 mb-8">
              <h2 className="text-lg font-bold mb-4">Daily Page Views</h2>
              {data.dailyViews.length === 0 ? (
                <p className="text-gray-500 text-sm">No data yet</p>
              ) : (
                <div className="flex items-end gap-1 h-40">
                  {data.dailyViews.map((day) => (
                    <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group relative">
                      <div
                        className="w-full bg-orange-500 rounded-t min-h-[2px] transition-all hover:bg-orange-400"
                        style={{ height: `${(parseInt(day.count) / maxViews) * 100}%` }}
                      />
                      <div className="absolute -top-8 bg-gray-700 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                        {new Date(day.date).toLocaleDateString()}: {day.count}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Grid */}
            <div className="grid md:grid-cols-3 gap-6">
              {/* Top Searches */}
              <div className="bg-gray-800 rounded-xl p-6">
                <h2 className="text-lg font-bold mb-4">Top Search Queries</h2>
                {data.topSearchQueries.length === 0 ? (
                  <p className="text-gray-500 text-sm">No searches yet</p>
                ) : (
                  <ul className="space-y-2">
                    {data.topSearchQueries.map((q, i) => (
                      <li key={i} className="flex justify-between text-sm">
                        <span className="text-gray-300 truncate mr-2">{q.query || '(no query)'}</span>
                        <span className="text-orange-400 font-mono">{q.count}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Top Locations */}
              <div className="bg-gray-800 rounded-xl p-6">
                <h2 className="text-lg font-bold mb-4">Top Locations</h2>
                {data.topLocations.length === 0 ? (
                  <p className="text-gray-500 text-sm">No location data yet</p>
                ) : (
                  <ul className="space-y-2">
                    {data.topLocations.map((loc, i) => (
                      <li key={i} className="flex justify-between text-sm">
                        <span className="text-gray-300 truncate mr-2">{loc.location}</span>
                        <span className="text-orange-400 font-mono">{loc.count}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Device Breakdown */}
              <div className="bg-gray-800 rounded-xl p-6">
                <h2 className="text-lg font-bold mb-4">Devices</h2>
                {data.deviceBreakdown.length === 0 ? (
                  <p className="text-gray-500 text-sm">No device data yet</p>
                ) : (
                  <ul className="space-y-3">
                    {data.deviceBreakdown.map((d, i) => {
                      const total = data.deviceBreakdown.reduce((s, x) => s + parseInt(x.count), 0);
                      const pct = Math.round((parseInt(d.count) / total) * 100);
                      return (
                        <li key={i}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-300 capitalize">{d.device}</span>
                            <span className="text-orange-400">{pct}%</span>
                          </div>
                          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-orange-500 rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="bg-gray-800 rounded-xl p-4">
      <p className="text-gray-400 text-sm mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
