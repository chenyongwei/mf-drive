import { getTeams } from '../../services/teamService';
import type { Team } from '../../types/auth';

export async function fetchTeamsSafely(): Promise<Team[]> {
  try {
    return await getTeams();
  } catch (error) {
    console.error('Failed to load teams:', error);
    return [];
  }
}
