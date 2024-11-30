import { v4 as uuidv4 } from "uuid";
import { WebSocket } from "ws";
import jwt, { JwtPayload } from "jsonwebtoken";
import client from "@repo/db/client";
import { RoomManager } from "./RoomManager";

uuidv4();
export class User {
  public id: string;
  public spaceId?: string;
  public userId?: string;
  public ws: WebSocket;
  public x: number;
  public y: number;
  constructor(ws: WebSocket) {
    this.id = uuidv4();
    this.ws = ws;
    this.x = 0;
    this.y = 0;
    this.handleRequests();
  }

  handleRequests() {
    //User sends 2 types of message join and move when he joins the room we need to check if he has access to the room or not.
    //approve the request only when he has access to the room.

    this.ws.on("message", async (request) => {
      const data = JSON.parse(request.toString());
      switch (data.type) {
        case "join":
          const { spaceId, token } = data.payload;
          //verify the token
          if (!process.env.JWT_SECRET)
            throw new Error("JWT_SECRET environment variable is not set");
          const userId = (
            jwt.verify(token, process.env.JWT_SECRET) as JwtPayload
          ).userId;
          //check if the userId exists, if not close the websocket connection.
          if (!userId) {
            this.ws.close();
            return;
          }
          this.userId = userId;
          //check if the space exists
          const space = await client.space.findFirst({
            where: {
              id: spaceId,
            },
            select: {
              elements: true,
              width: true,
              height: true,
            },
          });
          if (!space) {
            this.ws.close();
            return;
          }
          this.spaceId = spaceId;
          //add user to the room manager
          RoomManager.getInstance().addUserToSpace(spaceId, this);
          this.x = Math.floor(Math.random() * space.width);
          this.y = Math.floor(Math.random() * space.height);
          this.sendMessage({
            type: "space-joined",
            payload: {
              spawn: {
                x: this.x,
                y: this.y,
              },
              users: RoomManager.getInstance()
                .rooms.get(spaceId)
                ?.filter((x) => x.id !== this.id)
                ?.map((u) => ({ id: u.id })),
            },
          });
          //broadcast user joined message to all the users in the room
          RoomManager.getInstance().broadcastMessage(
            spaceId,
            {
              type: "user-joined",
              payload: {
                userId: this.userId,
                x: this.x,
                y: this.y,
              },
            },
            this
          );
          break;
        case "move":
          // verify the movement is valid
          const xCoordinate = data.payload.x;
          const yCoordinate = data.payload.y;
          //user should only move 1 unit either in x axis or y axis
          const xDistance = Math.abs(xCoordinate - this.x);
          const yDistance = Math.abs(yCoordinate - this.y);
          if (
            (xDistance == 1 && yDistance == 0) ||
            (xDistance == 0 && yDistance == 1)
          ) {
            this.x = xCoordinate;
            this.y = yCoordinate;
            RoomManager.getInstance().broadcastMessage(
              this.spaceId!,
              {
                type: "movement",
                payload: {
                  x: this.x,
                  y: this.y,
                },
              },
              this
            );
            return;
          }
          //if the movement is not valid reject the movement and send the current position
          this.sendMessage({
            type: "movement-rejected",
            payload: {
              x: this.x,
              y: this.y,
            },
          });
          break;
      }
    });
  }

  destroy() {
    //remove the user record from room manager and broadcast that the user has left to all the users in the room.
    RoomManager.getInstance().broadcastMessage(
      this.spaceId!,
      {
        type: "user-left",
        payload: {
          userId: this.userId,
        },
      },
      this
    );
    RoomManager.getInstance().removeUserFromSpace(this.spaceId!, this);

    //close the websocket
    this.ws.close();
  }
  sendMessage(message: any) {
    this.ws.send(JSON.stringify(message));
  }
}
