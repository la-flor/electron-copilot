// filepath: /path/to/global.d.ts
export {};

declare global {
  interface Window {
    db: {
      user: {
        fetchUser: (id: number) => Promise<any>;
        fetchUsers: () => Promise<any>;
      };
    };
  }
}
