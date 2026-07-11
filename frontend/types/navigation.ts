// File: types/navigation.ts

import { LucideIcon } from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface NavigationConfig {
  items: NavItem[];
}