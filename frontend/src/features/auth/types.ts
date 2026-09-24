import type { CurrentUser } from '@contracts/me';

export type { CurrentUser };

export interface Credentials {
  username: string;
  password: string;
}

export interface RegistrationDetails extends Credentials {
  firstName: string;
  middleName?: string;
  lastName: string;
  suffix?: string;
  municipalitySlug: string;
  barangaySlug: string;
  addressDetail: string;
  phone: string;
  email?: string;
}
