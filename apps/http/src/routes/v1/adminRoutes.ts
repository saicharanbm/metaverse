import { Router } from "express";
import {
  createElementSchema,
  createAvatarSchema,
  createMapSchema,
  UpdateElementSchema,
} from "../../types";
import client from "@repo/db/client";
import { adminMiddleware } from "../../middleware/adminMiddleware";

export const adminRouter = Router();
adminRouter.use(adminMiddleware);
//create an element
adminRouter.post("/element", async (req, res) => {
  const input = createElementSchema.safeParse(req.body);
  if (!input.success) {
    res.status(400).json({ error: "Please Provide a valid inputs" });
    return;
  }
  try {
    const element = await client.elements.create({
      data: {
        imageUrl: input.data.imageUrl,
        width: input.data.width,
        height: input.data.height,
        static: input.data.static,
      },
    });
    res.json({
      id: element.id,
    });
  } catch (error) {
    res.status(400).json({ error: "Something went wrong" });
  }
});

adminRouter.put("/element/:elementId", (req, res) => {
  const input = UpdateElementSchema.safeParse(req.body);
  if (!input.success) {
    res.status(400).json({ error: "Please Provide a valid inputs" });

    return;
  }
  client.elements.update({
    where: {
      id: req.params.elementId,
    },
    data: {
      imageUrl: input.data.imageUrl,
    },
  });
  res.json({ message: "Element updated" });
});
//create an avatar
adminRouter.post("/avatar", async (req, res) => {
  const input = createAvatarSchema.safeParse(req.body);
  if (!input.success) {
    res.status(400).json({ error: "Please Provide a valid inputs" });
    return;
  }
  try {
    const avatar = await client.avatar.create({
      data: {
        imageUrl: input.data.imageUrl,
        name: input.data.name,
      },
    });
    res.json({
      avatarId: avatar.id,
    });
  } catch (error) {
    res.status(400).json({ error: "Something went wrong" });
  }
});

//create map
adminRouter.post("/map", async (req, res) => {
  const input = createMapSchema.safeParse(req.body);
  if (!input.success) {
    res.status(400).json({ error: "Please Provide a valid inputs" });
    return;
  }
  try {
    const map = await client.map.create({
      data: {
        name: input.data.name,
        width: parseInt(input.data.dimensions.split("x")[0]),
        height: parseInt(input.data.dimensions.split("x")[1]),
        thumbnail: input.data.thumbnail,
        mapElements: {
          create: input.data.defaultElements.map((element) => ({
            elementId: element.elementId,
            x: element.x,
            y: element.y,
          })),
        },
      },
    });
    res.json({ id: map.id });
  } catch (error) {
    res.status(400).json({ error: "Something went wrong" });
  }
});
