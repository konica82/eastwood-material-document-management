import { z } from 'zod';

export const CargoStatusSchema = z.enum(['Chờ lượt', 'Đang xử lý', 'Hoàn thành', 'Hủy lượt']);

export const UpdateCargoStatusSchema = z.object({
  status: CargoStatusSchema,
  ly_do_huy: z.string().optional(),
}).refine(
  data => data.status !== 'Hủy lượt' || (data.ly_do_huy && data.ly_do_huy.trim().length > 0),
  { message: 'Lý do hủy là bắt buộc khi hủy lượt', path: ['ly_do_huy'] }
);

export const CreateCargoSchema = z.object({
  so_xe: z.string().min(1, 'Biển số xe không được để trống'),
  loai_xe: z.enum(['Xe tải', 'Máy cày', 'Đầu kéo']).nullable().default(null),
  tai_xe_id: z.string().min(1),
  nguyen_lieu_id: z.string().min(1),
  nha_cung_cap_id: z.string().min(1),
  nha_cung_cap_phu_id: z.string().nullable().default(null),
  plot_id: z.string().nullable().default(null),
  ghi_chu: z.string().nullable().default(null),
  trang_thai: CargoStatusSchema.optional().default('Chờ lượt'),
  hsls_hoan_thanh: z.boolean().optional().default(false),
  nha_may: z.string().min(1),
  ly_do_huy: z.string().nullable().default(null),
  phieu_can_id: z.string().nullable().default(null),
});

export const PatchCargoSchema = z.object({
  so_xe: z.string().min(1).optional(),
  loai_xe: z.enum(['Xe tải', 'Máy cày', 'Đầu kéo']).nullable().optional(),
  ghi_chu: z.string().nullable().optional(),
  hsls_hoan_thanh: z.boolean().optional(),
  plot_id: z.string().nullable().optional(),
  nha_cung_cap_phu_id: z.string().nullable().optional(),
});
