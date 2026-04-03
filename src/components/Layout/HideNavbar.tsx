"use client";

import { useEffect } from "react";
import { useNavbar } from "@/components/Layout/NavbarContext";

interface HideNavbarProps {
  showOnUnmount?: boolean;
}

export function HideNavbar({ showOnUnmount = true }: HideNavbarProps) {
  const { setShowNavbar } = useNavbar();

  useEffect(() => {
    setShowNavbar(false);

    return () => {
      if (showOnUnmount) {
        setShowNavbar(true);
      }
    };
  }, [setShowNavbar, showOnUnmount]);

  return null;
}
