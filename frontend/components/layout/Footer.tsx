// File: components/layout/Footer.tsx

export default function Footer() {
  return (
    <footer className="border-t border-[#E2E8F0] bg-white px-4 py-4 sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col items-center justify-between gap-2 text-sm text-[#475569] sm:flex-row">
        <p>
          &copy; {new Date().getFullYear()} ProMat
          <span className="font-medium text-[#1E40AF]">DB</span>. All rights
          reserved.
        </p>
        <p className="text-xs text-[#94A3B8]">
          Professional Bioinformatics Platform
        </p>
      </div>
    </footer>
  );
}