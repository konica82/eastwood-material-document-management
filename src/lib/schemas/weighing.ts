import { z } from 'zod';
export const WeighInSchema = z.object({
  cargoId: z.string().min(1),
  dlc_ngay_can_vao: z.string().datetime({ message: 'Thời gian cân vào không hợp lệ' }),
  dlc_can_vao: z.number().positive('Trọng lượng phải lớn hơn 0'),
});
export const WeighOutSchema = z.object({
  dlc_ngay_can_ra: z.string().datetime({ message: 'Thời gian cân ra không hợp lệ' }),
  dlc_can_ra: z.number().positive('Trọng lượng phải lớn hơn 0'),
});
