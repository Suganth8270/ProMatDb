interface Card3DLayerProps {
  children: React.ReactNode;
  /** translateZ in px — higher values float further out of the card plane. */
  depth?: number;
  className?: string;
}

export default function Card3DLayer({
  children,
  depth = 24,
  className = "",
}: Card3DLayerProps) {
  return (
    <div
      className={`card3d__layer ${className}`}
      style={{ ["--layer-z" as string]: `${depth}px` }}
    >
      {children}
    </div>
  );
}