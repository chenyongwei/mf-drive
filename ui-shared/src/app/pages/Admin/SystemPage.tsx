/**
 * Admin System Page
 *
 * System monitoring and statistics page
 */

import { useEffect, useState } from 'react';
import { adminStatsApi } from '../../services/adminService';
import { getStorageUsageColor } from './AdminPageShared';

interface StorageUser {
  id: number;
  email: string;
  current_db_size_mb: number;
  size_limit_mb: number;
  usage_percent: number;
}

interface StorageTeam {
  id: number;
  name: string;
  team_code: string;
  current_db_size_mb: number;
  size_limit_mb: number;
  usage_percent: number;
  member_count: number;
}

export default function SystemPage() {
  const [storageStats, setStorageStats] = useState<any>(null);
  const [topUsers, setTopUsers] = useState<StorageUser[]>([]);
  const [topTeams, setTopTeams] = useState<StorageTeam[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const [storageRes, activityRes] = await Promise.all([
        adminStatsApi.getStorageStats(),
        adminStatsApi.getActivity(20),
      ]);

      if (storageRes.success) {
        setStorageStats(storageRes.distribution);
        setTopUsers(storageRes.topUsers);
        setTopTeams(storageRes.topTeams);
      }

      if (activityRes.success) {
        setActivities(activityRes.activities);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load system statistics');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">System Monitoring</h1>
        <button
          onClick={loadStats}
          className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      ) : (
        <>
          {/* Storage Distribution */}
          {storageStats && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">User Databases</h2>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Count:</span>
                    <span className="font-medium">{storageStats.userDatabases?.count || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Used:</span>
                    <span className="font-medium">{Math.round(storageStats.userDatabases?.total_mb || 0)} MB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Limit:</span>
                    <span className="font-medium">{Math.round(storageStats.userDatabases?.limit_mb || 0)} MB</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Team Databases</h2>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Count:</span>
                    <span className="font-medium">{storageStats.teamDatabases?.count || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Used:</span>
                    <span className="font-medium">{Math.round(storageStats.teamDatabases?.total_mb || 0)} MB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Limit:</span>
                    <span className="font-medium">{Math.round(storageStats.teamDatabases?.limit_mb || 0)} MB</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Top Users by Storage */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Users by Storage Usage</h2>
            {topUsers.length === 0 ? (
              <p className="text-gray-500">No data available</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Used</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Limit</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Usage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {topUsers.map((user) => (
                      <tr key={user.id}>
                        <td className="px-4 py-2 text-sm text-gray-900">{user.email}</td>
                        <td className="px-4 py-2 text-sm text-gray-600">{Math.round(user.current_db_size_mb)} MB</td>
                        <td className="px-4 py-2 text-sm text-gray-600">{Math.round(user.size_limit_mb)} MB</td>
                        <td className="px-4 py-2">
                          <span className={`text-xs px-2 py-0.5 rounded ${getStorageUsageColor(user.usage_percent)}`}>
                            {Math.round(user.usage_percent)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Top Teams by Storage */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Teams by Storage Usage</h2>
            {topTeams.length === 0 ? (
              <p className="text-gray-500">No data available</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Team</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Members</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Used</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Usage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {topTeams.map((team) => (
                      <tr key={team.id}>
                        <td className="px-4 py-2 text-sm font-medium text-gray-900">{team.name}</td>
                        <td className="px-4 py-2 text-sm text-gray-500 font-mono">{team.team_code}</td>
                        <td className="px-4 py-2 text-sm text-gray-600">{team.member_count}</td>
                        <td className="px-4 py-2 text-sm text-gray-600">{Math.round(team.current_db_size_mb)} MB</td>
                        <td className="px-4 py-2">
                          <span className={`text-xs px-2 py-0.5 rounded ${getStorageUsageColor(team.usage_percent)}`}>
                            {Math.round(team.usage_percent)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
            {activities.length === 0 ? (
              <p className="text-gray-500">No activity recorded</p>
            ) : (
              <div className="space-y-3">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-start justify-between py-2 border-b border-gray-100 last:border-0">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{activity.action}</span>
                        {activity.resource_type && (
                          <span className="text-sm text-gray-500">
                            on {activity.resource_type} {activity.resource_id}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        by {activity.user_email || 'Unknown'} • {new Date(activity.created_at).toLocaleString()}
                      </div>
                    </div>
                    {activity.ip_address && (
                      <div className="text-xs text-gray-400">{activity.ip_address}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
