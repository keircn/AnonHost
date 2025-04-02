export interface UserMenuProps {
  session: {
    user?: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      admin?: boolean;
    };
  };
}
