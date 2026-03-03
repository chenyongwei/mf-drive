import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import type { Team } from '../../types/auth';
import { Dialog } from '../common';
import { useToast } from '../common';
import { fetchTeamsSafely } from './teamFetch';

export function WorkspaceSwitcher() {
  const { currentWorkspace, currentTeamId, currentTeam, switchWorkspace: authSwitchWorkspace } = useAuth();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);

  // Load teams when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadTeams();
    }
  }, [isOpen]);

  const loadTeams = async () => {
    setIsLoading(true);
    setTeams(await fetchTeamsSafely());
    setIsLoading(false);
  };

  const handleSwitchWorkspace = async (workspaceType: 'personal' | 'team', teamId?: number) => {
    setIsLoading(true);
    try {
      await authSwitchWorkspace(workspaceType, teamId);
      success(`已切换到${workspaceType === 'personal' ? '个人' : '团队'}工作空间`);
      setIsOpen(false);
      // Refresh page to reload data with new workspace context
      navigate(0);
    } catch (err: any) {
      showError(err.response?.data?.error || '切换工作空间失败');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-left"
      >
        <div className={`w-2 h-2 rounded-full ${currentWorkspace === 'personal' ? 'bg-green-500' : 'bg-indigo-500'}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {currentWorkspace === 'personal' ? '个人工作空间' : currentTeam?.name || '团队'}
          </p>
          {currentWorkspace === 'team' && currentTeam && (
            <p className="text-xs text-gray-500">团队代码: {currentTeam.teamCode}</p>
          )}
        </div>
      </button>

      {/* Dialog */}
      <Dialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="切换工作空间"
        size="sm"
      >
        <div className="space-y-2">
          {/* Personal Workspace */}
          <button
            onClick={() => handleSwitchWorkspace('personal')}
            disabled={isLoading}
            className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-colors text-left ${
              currentWorkspace === 'personal'
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">个人工作空间</p>
              <p className="text-xs text-gray-500">仅供您个人使用</p>
            </div>
            {currentWorkspace === 'personal' && (
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>

          {/* Teams Section */}
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-900">团队</h3>
              {/* Create Team Button - can be added later */}
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : teams.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="text-sm">还没有团队</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {teams.map((team) => (
                  <button
                    key={team.id}
                    onClick={() => handleSwitchWorkspace('team', team.id)}
                    disabled={isLoading}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-colors text-left ${
                      currentWorkspace === 'team' && currentTeamId === team.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{team.name}</p>
                      <p className="text-xs text-gray-500">代码: {team.teamCode}</p>
                    </div>
                    {currentWorkspace === 'team' && currentTeamId === team.id && (
                      <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </Dialog>
    </>
  );
}
