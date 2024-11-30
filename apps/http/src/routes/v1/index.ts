import { Router } from "express";
import { userRouter } from "./userRoutes";
import { spaceRouter } from "./spaceRoutes";
import { adminRouter } from "./adminRoutes";
import { SignInSchema, SignUpSchema } from "../../types";
import client from "@repo/db/client";
import jwt from "jsonwebtoken";
import { hash, compare } from "../../Scrypt";
// import bcrypt from "bcrypt";

export const router = Router();

router.post("/signup", async (req, res) => {
  console.log(req.body);
  //validate the request body
  const input = SignUpSchema.safeParse(req.body);
  if (!input.success) {
    res.status(400).json({ error: "Please Provide a valid inputs" });
    return;
  }
  //generate salt of 10 rounds
  // const salt = await bcrypt.genSalt(10);
  const hashedPassword = await hash(input.data?.password);
  try {
    const user = await client.user.create({
      data: {
        username: input.data.username,
        password: hashedPassword,
        role: input.data.type === "admin" ? "Admin" : "User",
      },
    });
    res.json({
      userId: user.id,
    });
  } catch (e) {
    res.status(400).json({ error: "User with this username already exists" });
  }
});
router.post("/signin", async (req, res) => {
  console.log(req.body);
  const input = SignInSchema.safeParse(req.body);
  if (!input.success) {
    res.status(400).json({ error: "Please Provide a valid inputs" });
    return;
  }
  //check if the user exists
  try {
    const user = await client.user.findUnique({
      where: {
        username: input.data.username,
      },
    });
    if (!user) {
      res
        .status(403)
        .json({ error: "User with this username does not exist." });
      return;
    }
    //verify password
    const isPasswordValid = await compare(input.data.password, user.password);
    if (!isPasswordValid) {
      res.status(403).json({ error: "Password is not valid." });
      return;
    }
    // throw an error when the JWT_SECRET is not present in .env
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET environment variable is not set");
    }
    //generate a jwt token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET
    );
    console.log(token);
    res.json({ userId: user.id, token });
  } catch (error) {
    res.status(400).json({ error: "Something went wrong" });
  }
});

router.get("/avatars", async (req, res) => {
  //get all the avatars
  try {
    const avatarsData = await client.avatar.findMany();
    const avatars = avatarsData.map((data) => ({
      id: data.id,
      imageUrl: data.imageUrl,
      name: data.name,
    }));
    res.json({ avatars });
  } catch (error) {
    res.status(400).json({ error: "Something went wrong." });
  }
});
router.get("/elements", async (req, res) => {
  //get all the avatars
  try {
    const elementsData = await client.elements.findMany();
    const elements = elementsData.map((data) => ({
      id: data.id,
      imageUrl: data.imageUrl,
      width: data.width,
      height: data.height,
      static: data.static,
    }));
    res.json({ elements });
  } catch (error) {
    res.status(400).json({ error: "Something went wrong." });
  }
});

router.use("/user", userRouter);
router.use("/space", spaceRouter);
router.use("/admin", adminRouter);
