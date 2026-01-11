import Link from "next/link";

interface Props {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export default function BotonPrimario({ href, children, className = "" }: Props) {
  return (
    <Link 
      href={href} 
      className={`bg-colegio-blue text-white px-5 py-2.5 rounded flex items-center gap-2 text-sm font-semibold hover:bg-opacity-90 transition-all shadow-md w-fit ${className}`}
    >
      {children}
      <span className="text-lg">→</span>
    </Link>
  );
}