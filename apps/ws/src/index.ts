import { WebSocketServer } from "ws";
import { User } from "./User";
import "dotenv/config";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is not set");
}
console.log(process.env.JWT_SECRET);

const wss = new WebSocketServer({ port: 3001 }, () =>
  console.log("websocket server started")
);

wss.on("connection", function connection(ws) {
  let user = new User(ws);
  ws.on("error", console.error);

  ws.on("close", () => {
    user?.destroy();
  });
});
