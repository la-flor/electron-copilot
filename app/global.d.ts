// filepath: /path/to/global.d.ts
export {};

declare global {
  interface Window {
    db: {
      user: {
        fetchUser: (id: number) => Promise<any>;
        fetchUsers: () => Promise<any>;
        updateUser: (user: Partial<import("../src/shared/interfaces/database.interface").User>) => Promise<any>;
      };
    };
  }
}
