import LandingHero from "@/components/landing/LandingHero";
import LandingNavbar from "@/components/landing/LandingNavbar";

export default function PublicLandingPage() {
  return (
    <div className="landing-shell">
      <LandingNavbar />
      <LandingHero />
    </div>
  );
}

