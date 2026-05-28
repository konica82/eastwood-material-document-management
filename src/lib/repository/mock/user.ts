import type { User } from '../../../types/index';
import type { UserRepository } from '../types';

// Single source of truth for the mock session.
// Replace with a real auth/session lookup in Step 6.
const MOCK_USER: User = {
  id: 'mock-user-1',
  email: 'thuan.ho@congtylamsan.vn',
  name: 'Thuận Hồ',
  role: 'Manager',
  plants: [
    { plantId: 'NMQM', role: 'Manager' },
    { plantId: 'NMXH', role: 'User' },
    { plantId: 'NMCT', role: 'User' },
  ],
  defaultPlantId: 'NMQM',
};

export const mockUserRepository: UserRepository = {
  async getCurrentUser(): Promise<User> {
    return { ...MOCK_USER, plants: MOCK_USER.plants.map(p => ({ ...p })) };
  },
};
