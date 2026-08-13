export interface loginInput {
  username: string;
  password: string;
}

export interface loginResponse {
  data: {
    user: user;
  };
  message: string;
}

export type role = 'ADMIN' | 'JUDGE';

export type user = {
  user: {
    id: number;
    name: string;
    username: string;
    role: role;
  };
};
