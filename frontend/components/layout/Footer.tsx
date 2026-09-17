// File: components/layout/Footer.tsx

export default function Footer() {
  return (
    <footer className="border-t border-[var(--color-border-soft)] bg-[var(--color-surface)] px-4 py-5 transition-colors duration-300 sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col items-center justify-between gap-2 text-sm text-[var(--color-text-secondary)] sm:flex-row">
        <p>
          &copy; {new Date().getFullYear()} ProMat
          <span className="font-semibold text-[var(--color-primary)]">DB</span>. All
          rights reserved.
        </p>
        <p className="text-xs text-[var(--color-text-muted)]">
          Protein Biomaterial Interaction Database
        </p>
      </div>
    </footer>
  );
}