interface StatCardProps {
  label: string;
  value?: string | number;
}

export default function StatCard({ label, value = "—" }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm shadow-gray-100">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
    </div>
  );
}