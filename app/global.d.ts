import { User } from "./src/shared/interfaces/database.interface";

// filepath: /path/to/global.d.ts
export {};

declare global {
  interface Window {
    db: {
      user: {
        fetchUser: (id: number) => Promise<User>;
        fetchUsers: () => Promise<User[]>;
        updateUser: (user: Partial<User>) => Promise<any>;
      };
    };
  }
}
