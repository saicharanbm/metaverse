import { User } from "./User";
export class RoomManager {
  //map of rooms containing space id as key and array of all the users in that perticular room as values.
  rooms: Map<string, User[]> = new Map<string, User[]>();
  static instance: RoomManager = new RoomManager();
  private constructor() {}
  static getInstance() {
    if (!RoomManager.instance) {
      RoomManager.instance = new RoomManager();
    }
    return RoomManager.instance;
  }
  //remove user from a space
  removeUserFromSpace(spaceId: string, user: User) {
    const users = this.rooms.get(spaceId);
    if (users) {
      this.rooms.set(
        spaceId,
        users.filter((u) => u.id !== user.id)
      );
    }
  }
  addUserToSpace(spaceId: string, user: User) {
    const users = this.rooms.get(spaceId);
    if (users) {
      this.rooms.set(spaceId, [...users, user]);
    } else {
      this.rooms.set(spaceId, [user]);
    }
  }
  broadcastMessage(spaceId: string, message: any, user: User) {
    const users = this.rooms.get(spaceId);
    if (users) {
      users.forEach((u) => {
        if (u.id !== user.id) {
          u.sendMessage(message);
        }
      });
    }
  }
}
