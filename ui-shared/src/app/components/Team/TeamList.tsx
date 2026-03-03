import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { switchWorkspace } from '../../services/teamService';
import { TeamCard } from './TeamCard';
import { CreateTeamDialog } from './CreateTeamDialog';
import { Button } from '../common';
import { useToast } from '../common';
import { fetchTeamsSafely } from './teamFetch';

interface TeamListProps {
  showCreateButton?: boolean;
}

export function TeamList({ showCreateButton = true }: TeamListProps) {
  const { currentWorkspace, currentTeamId } = useAuth();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const [teams, setTeams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    setIsLoading(true);
    setTeams(await fetchTeamsSafely());
    setIsLoading(false);
  };

  const handleSwitchTeam = async (teamId: number) => {
    try {
      await switchWorkspace('team', teamId);
      success('已切换到团队工作空间');
      navigate(0); // Refresh page
    } catch (err: any) {
      showError(err.response?.data?.error || '切换失败');
    }
  };

  const handleTeamCreated = (newTeam: any) => {
    setTeams([...teams, newTeam]);
    setShowCreateDialog(false);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">我的团队</h2>
        {showCreateButton && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowCreateDialog(true)}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            创建团队
          </Button>
        )}
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : teams.length === 0 ? (
        /* Empty State */
        <div className="text-center py-12 px-4 bg-white rounded-lg border border-dashed border-gray-300">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">还没有团队</h3>
          <p className="text-sm text-gray-500 mb-4">创建一个团队与成员协作</p>
          {showCreateButton && (
            <Button variant="primary" size="sm" onClick={() => setShowCreateDialog(true)}>
              创建第一个团队
            </Button>
          )}
        </div>
      ) : (
        /* Team Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              isActive={currentWorkspace === 'team' && currentTeamId === team.id}
              onClick={() => handleSwitchTeam(team.id)}
            />
          ))}
        </div>
      )}

      {/* Create Team Dialog */}
      <CreateTeamDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onTeamCreated={handleTeamCreated}
      />
    </div>
  );
}
