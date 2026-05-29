import { z } from 'zod';
export const PatchPlotSchema = z.object({
  LandTitle: z.string().min(1).optional(),
  TreeSpecies: z.string().min(1).optional(),
  DeforestationRiskStatus: z.enum(['Thấp', 'Trung bình', 'Cao']).optional(),
  certificate: z.string().nullable().optional(),
  cert_id: z.string().nullable().optional(),
  AreaHa: z.number().positive().optional(),
});
