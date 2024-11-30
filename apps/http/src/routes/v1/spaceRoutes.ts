import { Router } from "express";
import {
  addSpaceElementSchema,
  createSpaceSchema,
  deleteSpaceElementSchema,
} from "../../types";
import client from "@repo/db/client";
import { userMiddleware } from "../../middleware/userMiddleware";

export const spaceRouter = Router();

spaceRouter.post("/", userMiddleware, async (req, res) => {
  const input = createSpaceSchema.safeParse(req.body);
  if (!input.success) {
    res.status(400).json({ error: "Please Provide a valid inputs" });
    return;
  }
  //check if the mapId exists if not just create an empty space with the specified dimention
  if (!input.data.mapId) {
    const space = await client.space.create({
      data: {
        name: input.data.name,
        width: parseInt(input.data.dimensions.split("x")[0]),
        height: parseInt(input.data.dimensions.split("x")[1]),
        creatorId: req.userId!,
      },
    });
    res.json({ spaceId: space.id });
    return;
  }
  //check if the mapId is valid
  const map = await client.map.findFirst({
    where: {
      id: input.data.mapId,
    },
    select: {
      mapElements: true,
      width: true,
      height: true,
    },
  });
  //return 400 if the map is not found
  if (!map) {
    res.status(400).json({ error: "Map not found" });
    return;
  }
  let space = await client.$transaction(async () => {
    const space = await client.space.create({
      data: {
        name: input.data.name,
        width: map.width,
        height: map.height,
        creatorId: req.userId!,
      },
    });

    await client.spaceElements.createMany({
      data: map.mapElements.map((e) => ({
        spaceId: space.id,
        elementId: e.elementId,
        x: e.x!,
        y: e.y!,
      })),
    });

    return space;
  });
  console.log("space crated");
  res.json({ spaceId: space.id });
});

//delete elements in the space
spaceRouter.delete("/element", userMiddleware, async (req, res) => {
  const input = deleteSpaceElementSchema.safeParse(req.body);
  if (!input.success) {
    res.status(400).json({ error: "Please Provide a valid inputs" });
    return;
  }
  const spaceElement = await client.spaceElements.findFirst({
    where: {
      id: input.data.id,
    },
    include: {
      space: true,
    },
  });
  if (
    !spaceElement?.space.creatorId ||
    spaceElement.space.creatorId !== req.userId
  ) {
    res.status(403).json({ error: "Unauthorized" });
    return;
  }
  await client.spaceElements.delete({
    where: {
      id: input.data.id,
    },
  });
  res.json({ message: "Element deleted" });
});

//delete space
spaceRouter.delete("/:spaceId", userMiddleware, async (req, res) => {
  const space = await client.space.findUnique({
    where: {
      id: req.params.spaceId,
    },
    select: {
      creatorId: true,
    },
  });
  if (!space) {
    res.status(400).json({ error: "Space not found" });
    return;
  }

  if (space.creatorId !== req.userId) {
    console.log("code should reach here");
    res.status(403).json({ error: "Unauthorized" });
    return;
  }

  await client.space.delete({
    where: {
      id: req.params.spaceId,
    },
  });
  res.json({ message: "Space deleted" });
});
//get all spaces of the user
spaceRouter.get("/all", userMiddleware, async (req, res) => {
  const userSpaces = await client.space.findMany({
    where: {
      creatorId: req.userId!,
    },
  });
  const spaces = userSpaces.map((space) => ({
    id: space.id,
    name: space.name,
    thumbnail: space.thumbnail,
    dimensions: `${space.width}x${space.height}`,
  }));
  res.json({
    spaces,
  });
});
//get space details
spaceRouter.get("/:spaceId", async (req, res) => {
  const space = await client.space.findUnique({
    where: {
      id: req.params.spaceId,
    },
    include: {
      elements: {
        include: {
          element: true,
        },
      },
    },
  });

  if (!space) {
    res.status(400).json({ message: "Space not found" });
    return;
  }

  res.json({
    dimensions: `${space.width}x${space.height}`,
    elements: space.elements.map((e) => ({
      id: e.id,
      element: {
        id: e.element.id,
        imageUrl: e.element.imageUrl,
        width: e.element.width,
        height: e.element.height,
        static: e.element.static,
      },
      x: e.x,
      y: e.y,
    })),
  });
});
//add element to the space]]]]]

spaceRouter.post("/element", userMiddleware, async (req, res) => {
  const input = addSpaceElementSchema.safeParse(req.body);
  if (!input.success) {
    res.status(400).json({ error: "Please Provide a valid inputs" });
    return;
  }
  const space = await client.space.findUnique({
    where: {
      id: input.data.spaceId,
      creatorId: req.userId!,
    },
    select: {
      width: true,
      height: true,
    },
  });
  if (!space) {
    res.status(400).json({ message: "Space not found" });
    return;
  }

  if (input.data.x > space.width || input.data.y > space.height) {
    res.status(400).json({ message: "Point is outside of the boundary" });
    return;
  }
  await client.spaceElements.create({
    data: {
      spaceId: input.data.spaceId,
      elementId: input.data.elementId,
      x: input.data.x,
      y: input.data.y,
    },
  });

  res.json({ message: "Element added" });
});
