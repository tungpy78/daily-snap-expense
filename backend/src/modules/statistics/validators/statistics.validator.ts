import { z } from 'zod';

export const statisticsQuerySchema = {
  query: z.object({
    month: z.preprocess(
      (val) => {
        if (val === undefined || val === null || val === '') {
          return undefined;
        }
        const parsed = Number(val);
        return isNaN(parsed) ? val : parsed;
      },
      z
        .number({ invalid_type_error: 'Tháng phải là số.' })
        .int('Tháng phải là số nguyên.')
        .min(1, 'Tháng phải từ 1 đến 12.')
        .max(12, 'Tháng phải từ 1 đến 12.')
        .optional(),
    ),
    year: z.preprocess(
      (val) => {
        if (val === undefined || val === null || val === '') {
          return undefined;
        }
        const parsed = Number(val);
        return isNaN(parsed) ? val : parsed;
      },
      z
        .number({ invalid_type_error: 'Năm phải là số.' })
        .int('Năm phải là số nguyên.')
        .min(1970, 'Năm phải từ 1970 đến 2100.')
        .max(2100, 'Năm phải từ 1970 đến 2100.')
        .optional(),
    ),
  }),
};
