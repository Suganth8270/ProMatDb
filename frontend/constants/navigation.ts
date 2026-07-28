import {
  LayoutDashboard,
  Dna,
  TestTube2,
  Link2,
  Download,
  FileCode2,
  Info,
} from "lucide-react";
import type { NavItem } from "@/types/navigation";

export const navigationItems: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Proteins", href: "/proteins", icon: Dna },
  { label: "Biomaterials", href: "/biomaterials", icon: TestTube2 },
  { label: "Interactions", href: "/interactions", icon: Link2 },

  // Import
  { label: "Import Protein", href: "/import-protein", icon: Download },
  { label: "Import FASTA", href: "/import-fasta", icon: FileCode2 },

  { label: "About", href: "/about", icon: Info },
];