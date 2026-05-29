import { z } from 'zod';
export const PatchMaterialSchema = z.object({
  ten: z.string().min(1, 'Tên nguyên liệu không được để trống').optional(),
  ten_khoa_hoc: z.string().min(1).optional(),
  image: z.string().nullable().optional(),
});
