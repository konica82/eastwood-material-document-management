import { z } from 'zod';

export const PatchSupplierSchema = z.object({
  ten: z.string().min(1, 'Tên không được để trống').optional(),
  cccd_mst: z.string().min(1).optional(),
  so_dien_thoai: z.string().optional(),
  nguoi_dai_dien: z.string().optional(),
  dia_chi: z.string().min(1).optional(),
  chung_chi: z.string().optional(),
});

export const PatchSecondarySupplierSchema = z.object({
  ten: z.string().min(1).optional(),
  cccd_mst: z.string().min(1).optional(),
  so_dien_thoai: z.string().optional(),
  co_phan_phan_tram: z.number().min(0).max(100).optional(),
});
