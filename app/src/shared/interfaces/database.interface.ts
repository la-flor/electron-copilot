export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  create_time: string;
  update_time: string;
  delete_time: string | null;
  dark: number;
}
