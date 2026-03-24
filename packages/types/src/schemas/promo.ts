import { z } from "zod";

export const applyPromoSchema = z.object({
  code: z.string().min(3, "Promo code must be at least 3 characters").toUpperCase(),
});

export type ApplyPromoInput = z.infer<typeof applyPromoSchema>;
