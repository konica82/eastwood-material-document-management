import { z } from 'zod';
export const PatchDriverSchema = z.object({
  ten: z.string().min(1).optional(),
  so_dien_thoai: z.string().optional(),
  gplx: z.string().optional(),
  hang_gplx: z.enum(['B2', 'C', 'E', 'FC']).optional(),
  han_gplx: z.string().optional(),
  trang_thai_tai_xe: z.enum(['active', 'expiring', 'suspended', 'pending']).optional(),
});
