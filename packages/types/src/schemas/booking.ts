import { z } from "zod";

export const deliveryStopSchema = z.object({
  address: z.string().min(1, "Address is required"),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  contactName: z.string().min(1, "Contact name is required"),
  contactPhone: z.string().regex(/^\+\d{10,15}$/, "Invalid phone number"),
  notes: z.string().default(""),
});

export const loadDetailsSchema = z
  .object({
    loadType: z.enum(["food", "parcel", "document", "other"]),
    loadDescription: z.string().min(1, "Description is required"),
    isHighValue: z.boolean().default(false),
    declaredValueKobo: z.number().positive().nullable().default(null),
  })
  .refine(
    (data) => !data.isHighValue || data.declaredValueKobo !== null,
    {
      message: "Declared value is required for high-value items",
      path: ["declaredValueKobo"],
    }
  );

export const createOrderSchema = z.object({
  pickup: deliveryStopSchema,
  dropoff: deliveryStopSchema,
  loadType: z.enum(["food", "parcel", "document", "other"]),
  loadDescription: z.string().min(1, "Description is required"),
  isHighValue: z.boolean().default(false),
  declaredValueKobo: z.number().positive().nullable().default(null),
  isMultiStop: z.boolean().default(false),
  extraStops: z.array(deliveryStopSchema).default([]),
  isScheduled: z.boolean().default(false),
  scheduledPickupAt: z.date().nullable().default(null),
  riderId: z.string().min(1, "Select a rider"),
  riderTier: z.enum(["standard", "premium", "express"]),
  promoCode: z.string().nullable().default(null),
});

export type DeliveryStopInput = z.infer<typeof deliveryStopSchema>;
export type LoadDetailsInput = z.infer<typeof loadDetailsSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
