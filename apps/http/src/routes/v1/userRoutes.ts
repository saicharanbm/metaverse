import { Router } from "express";
import client from "@repo/db/client";
import { UpdateMetaDataSchema } from "../../types";
import { userMiddleware } from "../../middleware/userMiddleware";

export const userRouter = Router();

userRouter.post("/metadata", userMiddleware, async (req, res) => {
  const input = UpdateMetaDataSchema.safeParse(req.body);
  if (!input.success) {
    res.status(400).json({ error: "Please Provide a valid inputs" });
    return;
  }
  try {
    await client.user.update({
      where: {
        id: req.userId,
      },
      data: {
        avatarId: input.data.avatarId,
      },
    });
    res.json({
      message: "Updated user metadata",
    });
  } catch (error) {
    res.status(400).json({ error: "Something went wrong" });
  }
});

userRouter.get("/metadata/bulk", async (req, res) => {
  //get all the user ids from the query if there isnt any then use an empty array
  const userIdString = (req.query.ids ?? "[]") as string;
  //remove the [] and split the ids
  const userIds = userIdString.slice(1, userIdString.length - 1).split(",");
  console.log(userIds);
  const metadata = await client.user.findMany({
    where: {
      id: {
        in: userIds,
      },
    },
    select: {
      avatar: true,
      id: true,
    },
  });
  const avatars = metadata.map((data) => ({
    userId: data.id,
    imageUrl: data.avatar?.imageUrl,
  }));

  res.json({
    avatars,
  });
});
