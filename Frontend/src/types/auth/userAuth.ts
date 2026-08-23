export interface loginInput {
  username: string;
  password: string;
}

export type role = 'ADMIN' | 'JUDGE';

export type UserDTO = {
  id: number;
  name: string;
  username: string;
  role: role;
};

export interface loginResponse {
  data: {
    user: UserDTO;
  };
  message: string;
}

export type user = {
  user: UserDTO;
};
