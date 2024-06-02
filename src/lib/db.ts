import { hash } from "crypto";
import { nanoid } from "nanoid";
import { createStorage } from "unstorage";
import fsLiteDriver from "unstorage/drivers/fs-lite";

type User = {
  id: string;
  username: string;
  passwordHash: string;
};

type Partydown = {
  id: string;
  owner: string;
  title: string;
  content: string;
  shareId?: string;
}

const storage = createStorage({
  driver: fsLiteDriver({
    base: "./.data"
  })
});

storage.setItem("users:data", [{ id: nanoid(), username: "kody", passwordHash: hash('sha256', "twixrox") }]);
storage.setItem("users:counter", 1);

export const db = {
  user: {
    async create({ data }: { data: { username: string; passwordHash: string } }) {
      const [{ value: users }, { value: index }] = await storage.getItems(["users:data", "users:counter"]);

      const user: User = { ...data, id: nanoid() };

      await Promise.all([
        storage.setItem("users:data", [...(users as User[]), user]),
        storage.setItem("users:counter", index as number + 1)
      ]);
      return user;
    },

    async findUnique({ where: { id = undefined, username = undefined } }: { where: { id?: string, username?: string } }) {
      const users = await storage.getItem("users:data") as User[];
      if (username) return users.find(user => user.username === username);
      return users.find(user => user.id === id);
    },

    async getId({ where: { username = undefined } }: { where: { username?: string } }) {
      const users = await storage.getItem("users:data") as User[];
      return users.find(user => user.username === username)?.id;
    }
  },

  partydown: {
    async create({ data }: { data: { owner: string; title?: string; content?: string } }) {
      const [{ value: partydowns }, { value: index }] = await storage.getItems(["partydowns:data", "partydowns:counter"]);

      const partydown: Partydown = { owner: data.owner, title: data.title ?? "Untitled", content: data.content ?? "# New Partydown", id: nanoid() };

      await Promise.all([
        storage.setItem("partydowns:data", [...(partydowns as Partydown[]), partydown]),
        storage.setItem("partydowns:counter", index as number + 1)
      ]);
      return partydown;
    },

    async findUnique({ where: { id = undefined } }: { where: { id?: string } }) {
      const partydowns = await storage.getItem("partydowns:data") as Partydown[];
      return partydowns.find(partydown => partydown.id === id);
    },

    async findMany({ where: { owner = undefined } }: { where: { owner?: string } }) {
      const partydowns = await storage.getItem("partydowns:data") as Partydown[];
      return partydowns.filter(partydown => partydown.owner === owner);
    },

    async update({ where: { id }, data }: { where: { id: string }, data: { title?: string; content?: string } }) {
      const [{ value: partydowns }, { value: index }] = await storage.getItems(["partydowns:data", "partydowns:counter"]);

      const partydown = (partydowns as Partydown[]).find(partydown => partydown.id === id);
      if (!partydown) return null;

      const updatedPartydown = { ...partydown, ...data };

      await storage.setItem("partydowns:data", (partydowns as Partydown[]).map(partydown => partydown.id === id ? updatedPartydown : partydown));
      return updatedPartydown;
    },

    async delete({ where: { id } }: { where: { id: string } }) {
      const [{ value: partydowns }, { value: index }] = await storage.getItems(["partydowns:data", "partydowns:counter"]);

      const partydown = (partydowns as Partydown[]).find(partydown => partydown.id === id);
      if (!partydown) return null;

      await Promise.all([
        storage.setItem("partydowns:data", (partydowns as Partydown[]).filter(partydown => partydown.id !== id)),
        storage.setItem("partydowns:counter", index as number - 1)
      ])
      return partydown;
    },

    async share({ where: { id } }: { where: { id: string } }) {
      const partydowns = await storage.getItem("partydowns:data");

      const partydown = (partydowns as Partydown[]).find(partydown => partydown.id === id);
      if (!partydown) return null;

      const shareId = nanoid();
      const sharedPartydown = { ...partydown, shareId };

      await storage.setItem("partydowns:data", (partydowns as Partydown[]).map(partydown => partydown.id === id ? sharedPartydown : partydown));
      return sharedPartydown;
    },

    async findShared({ where: { shareId = undefined } }: { where: { shareId?: string } }) {
      const partydowns = await storage.getItem("partydowns:data") as Partydown[];
      return partydowns.find(partydown => partydown.shareId === shareId);
    },

    async unshare({ where: { id } }: { where: { id: string } }) {
      const partydowns = await storage.getItem("partydowns:data") as Partydown[];

      const partydown = partydowns.find(partydown => partydown.id === id);
      if (!partydown) return null;

      const unsharedPartydown = { ...partydown, shareId: undefined };

      await storage.setItem("partydowns:data", partydowns.map(partydown => partydown.id === id ? unsharedPartydown : partydown));
      return unsharedPartydown;
    }
  }
};
