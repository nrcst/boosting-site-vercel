import { z } from "zod";

export const orderIdSchema = z
  .string()
  .trim()
  .min(4, "Order ID is required")
  .max(32, "Order ID is too long")
  .regex(/^[a-zA-Z0-9_-]+$/, "Invalid Order ID");

export const orderStatusSchema = z.enum(["pending", "in_progress", "done"]);

export const createOrderSchema = z.object({
  order_id: orderIdSchema,
  ign: z.string().trim().optional().nullable(),
  customer_name: z.string().trim().optional().nullable(),
  uid: z.string().trim().optional().nullable(),
  game_type: z.string().trim().optional().nullable(),
  service_type: z.string().trim().optional().nullable(),
  start_date: z.string().trim().optional().nullable(),
  due_date: z.string().trim().optional().nullable(),
  status: orderStatusSchema.default("pending"),
  profile_screenshot_url: z.string().url().optional().nullable(),
});

export const updateOrderSchema = createOrderSchema.partial().extend({
  status: orderStatusSchema.optional(),
});

export const createSessionSchema = z.object({
  order_id: z.string().uuid(),
  session_date: z.string().trim(),
  summary: z.string().trim().optional().nullable(),
  images: z
    .array(
      z.object({
        image_url: z.string().url(),
        order_index: z.number().int().min(0),
      })
    )
    .optional(),
});

export const updateSessionSchema = z.object({
  session_date: z.string().trim().optional(),
  summary: z.string().trim().optional().nullable(),
  images: z
    .array(
      z.object({
        image_url: z.string().url(),
        order_index: z.number().int().min(0),
      })
    )
    .optional(),
});

export const adminOrderIdSchema = z.string().uuid();

export const adminLoginSchema = z.object({
  password: z.string().min(6),
});
