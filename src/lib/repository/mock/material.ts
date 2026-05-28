import type { Material } from '../../../types/index';
import type { MaterialRepository } from '../types';

const SEED: Material[] = [
  { id: 'mat-01', ten: 'Keo lai',    ten_khoa_hoc: 'Acacia hybrid',          image: null },
  { id: 'mat-02', ten: 'Cao su',     ten_khoa_hoc: 'Hevea brasiliensis',      image: null },
  { id: 'mat-03', ten: 'Điều',       ten_khoa_hoc: 'Anacardium occidentale',  image: null },
  { id: 'mat-04', ten: 'Tràm nước',  ten_khoa_hoc: 'Melaleuca cajuputi',      image: null },
  { id: 'mat-05', ten: 'Bạch đàn',   ten_khoa_hoc: 'Eucalyptus urophylla',   image: null },
  { id: 'mat-06', ten: 'Mùn cưa',    ten_khoa_hoc: 'Sawdust (phụ phẩm)',      image: null },
  { id: 'mat-07', ten: 'Dăm gỗ keo', ten_khoa_hoc: 'Acacia wood chips',      image: null },
];

// Module-level store — persists across re-renders, resets on server restart.
const store = new Map<string, Material>(SEED.map(m => [m.id, { ...m }]));

export const mockMaterialRepository: MaterialRepository = {
  async list(_plantId: string): Promise<Material[]> {
    return Array.from(store.values());
  },

  async get(_plantId: string, id: string): Promise<Material | null> {
    return store.get(id) ?? null;
  },

  async update(_plantId: string, id: string, patch: Partial<Material>): Promise<Material> {
    const existing = store.get(id);
    if (!existing) throw new Error(`Nguyên liệu "${id}" không tìm thấy`);
    const updated: Material = { ...existing, ...patch, id };
    store.set(id, updated);
    return updated;
  },
};
