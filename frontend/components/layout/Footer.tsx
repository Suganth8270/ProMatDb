// File: components/layout/Footer.tsx

export default function Footer() {
  return (
    <footer className="border-t border-[#E2E8F0] bg-white px-4 py-4 sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col items-center justify-between gap-2 text-sm text-slate-500 sm:flex-row">
        <p>
          &copy; {new Date().getFullYear()} ProMat
          <span className="bg-gradient-to-r from-[#0F766E] to-[#06B6D4] bg-clip-text font-medium text-transparent">
            DB
          </span>
          . All rights reserved.
        </p>
        <p className="text-xs text-slate-400">
          Professional Bioinformatics Platform
        </p>
      </div>
    </footer>
  );
}