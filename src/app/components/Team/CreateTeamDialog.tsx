import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, Button, FormInput } from '../common';
import { createTeam } from '../../services/teamService';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../common';
import type { Team } from '../../types/auth';

const createTeamSchema = z.object({
  name: z.string().min(1, '请输入团队名称').min(2, '团队名称至少需要2个字符').max(50, '团队名称最多50个字符'),
});

type CreateTeamFormData = z.infer<typeof createTeamSchema>;

interface CreateTeamDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onTeamCreated?: (team: Team) => void;
}

export function CreateTeamDialog({ isOpen, onClose, onTeamCreated }: CreateTeamDialogProps) {
  const { switchWorkspace } = useAuth();
  const { success, error: showError } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdTeam, setCreatedTeam] = useState<Team | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateTeamFormData>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: { name: '' },
  });

  const onSubmit = async (data: CreateTeamFormData) => {
    setIsSubmitting(true);
    try {
      const team = await createTeam({ name: data.name });
      setCreatedTeam(team);
      success('团队创建成功');
      onTeamCreated?.(team);

      // Auto-switch to new team after a short delay
      setTimeout(async () => {
        try {
          await switchWorkspace('team', team.id);
          success('已切换到新团队');
          handleClose();
          // Refresh page to load new workspace context
          window.location.reload();
        } catch (err) {
          console.error('Failed to switch workspace:', err);
        }
      }, 1500);
    } catch (err: any) {
      showError(err.response?.data?.error || '创建团队失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    setCreatedTeam(null);
    onClose();
  };

  return (
    <Dialog isOpen={isOpen} onClose={handleClose} title="创建团队" size="sm">
      {!createdTeam ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Description */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-blue-800">
              创建一个团队来与成员协作。团队创建后，您将获得唯一的团队代码，可以邀请其他成员加入。
            </p>
          </div>

          {/* Team Name */}
          <FormInput
            label="团队名称"
            type="text"
            placeholder="例如：设计团队、开发团队"
            error={errors.name?.message}
            required
            {...register('name')}
          />

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              取消
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              创建团队
            </Button>
          </div>
        </form>
      ) : (
        /* Success State */
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900">团队创建成功!</h3>
            <p className="text-sm text-gray-600 mt-1">正在切换到新团队...</p>
          </div>

          {/* Team Code Display */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-1">团队代码</p>
            <div className="flex items-center justify-center gap-2">
              <code className="text-lg font-mono font-bold text-indigo-600">
                {createdTeam.teamCode}
              </code>
              <button
                onClick={() => navigator.clipboard.writeText(createdTeam.teamCode)}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
                title="复制团队代码"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">分享此代码邀请成员加入团队</p>
          </div>
        </div>
      )}
    </Dialog>
  );
}
