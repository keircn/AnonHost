'use client';

import { createContext, useContext, useState } from 'react';

interface NavbarContextType {
  showNavbar: boolean;
  setShowNavbar: (show: boolean) => void;
}

const NavbarContext = createContext<NavbarContextType>({
  showNavbar: true,
  setShowNavbar: () => {},
});

export function NavbarProvider({ children }: { children: React.ReactNode }) {
  const [showNavbar, setShowNavbar] = useState(true);

  return (
    <NavbarContext.Provider value={{ showNavbar, setShowNavbar }}>
      {children}
    </NavbarContext.Provider>
  );
}

export const useNavbar = () => useContext(NavbarContext);