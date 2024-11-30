import e from "express";
import z from "zod";
export const SignUpSchema = z.object({
  username: z.string(),
  password: z.string().min(5).max(15),
  type: z.enum(["user", "admin"]),
});

export const SignInSchema = z.object({
  username: z.string(),
  password: z.string().min(5).max(15),
});

export const createElementSchema = z.object({
  imageUrl: z.string(),
  width: z.number().min(1),
  height: z.number().min(1),
  static: z.boolean(),
});
export const createAvatarSchema = z.object({
  imageUrl: z.string(),
  name: z.string(),
});
export const createMapSchema = z.object({
  thumbnail: z.string(),
  dimensions: z.string().regex(/^[0-9]{1,4}x[0-9]{1,4}$/),
  name: z.string(),
  defaultElements: z.array(
    z.object({
      elementId: z.string(),
      x: z.number(),
      y: z.number(),
    })
  ),
});

export const UpdateElementSchema = z.object({
  imageUrl: z.string(),
});
export const UpdateMetaDataSchema = z.object({
  avatarId: z.string(),
});

export const createSpaceSchema = z.object({
  name: z.string(),
  dimensions: z.string().regex(/^[0-9]{1,5}x[0-9]{1,5}$/),
  mapId: z.string().optional(),
});

export const deleteSpaceElementSchema = z.object({
  id: z.string(),
});

export const addSpaceElementSchema = z.object({
  elementId: z.string(),
  spaceId: z.string(),
  x: z.number().min(1),
  y: z.number().min(1),
});

declare global {
  namespace Express {
    export interface Request {
      role?: "Admin" | "User";
      userId?: string;
    }
  }
}
