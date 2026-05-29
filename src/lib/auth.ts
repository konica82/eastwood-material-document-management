/**
 * Auth placeholder — returns a mock session user.
 * Replace with real NextAuth session lookup in Phase 2.
 */

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: 'User' | 'Manager' | 'Admin';
  plants: Array<{ plantId: string; role: 'User' | 'Manager' | 'Admin' }>;
}

export async function getSessionUser(): Promise<SessionUser> {
  // TODO: Phase 2 — replace with: const session = await auth(); return session?.user ?? null;
  return {
    id: 'mock-user-1',
    email: 'admin@eastwood.vn',
    name: 'Admin',
    role: 'Admin',
    plants: [
      { plantId: 'NMQM', role: 'Admin' },
      { plantId: 'NMXH', role: 'Admin' },
      { plantId: 'NMCT', role: 'Admin' },
    ],
  };
}

export function hasPlantAccess(user: SessionUser, plantId: string): boolean {
  return user.role === 'Admin' || user.plants.some(p => p.plantId === plantId);
}

export function getPlantRole(user: SessionUser, plantId: string): 'User' | 'Manager' | 'Admin' | null {
  if (user.role === 'Admin') return 'Admin';
  return user.plants.find(p => p.plantId === plantId)?.role ?? null;
}
