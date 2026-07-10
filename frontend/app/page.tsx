import DashboardLayout from "@/components/layout/DashboardLayout";
import StatCard from "@/components/ui/StatCard";

const STAT_LABELS = [
  "Total Proteins",
  "Total Biomaterials",
  "Total Interactions",
  "Imported Proteins",
] as const;

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="max-w-5xl">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Welcome to ProMatDB
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Protein–Biomaterial Interaction Database
        </p>

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STAT_LABELS.map((label) => (
            <StatCard key={label} label={label} />
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}