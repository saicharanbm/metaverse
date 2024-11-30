import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// // Extend the Request interface to add a custom userId property
// interface AuthenticatedRequest extends Request {
//   userId: string;
// }

export const adminMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.split(" ")[1];

  if (!token || !process.env.JWT_SECRET) {
    res.status(403).json({ error: "Unauthorized" });
    return;
  }

  try {
    const tokenData = jwt.verify(token, process.env.JWT_SECRET) as {
      role: string;
      userId: string;
    };
    //only pass the request if the role is admin
    if (tokenData.role === "Admin") {
      req.userId = tokenData.userId;
      next();
    } else {
      res.status(403).json({ error: "Unauthorized" });
      return;
    }
  } catch (error) {
    res.status(403).json({ error: "Unauthorized" });
    return;
  }
};
