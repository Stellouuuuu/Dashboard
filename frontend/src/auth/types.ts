/** Forme consommée par ProfilePage/AppLayout — reflète directement `RealUser` (PATCH /auth/profile réel). */
export interface PublicUser {
  id: string;
  name: string;
  email: string;
  confirmed: boolean;
  role: 'user' | 'admin';
  createdAt: string;
}
