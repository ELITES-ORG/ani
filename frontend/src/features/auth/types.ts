import type { CurrentUser } from '@contracts/me';

export type { CurrentUser };

export interface Credentials {
  username: string;
  password: string;
}

export interface RegistrationDetails extends Credentials {
  fullName: string;
  phone: string;
  email?: string;
}
