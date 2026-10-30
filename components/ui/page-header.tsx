import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  subtitle?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-5 md:mb-8 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        <div className="eyebrow">{eyebrow}</div>
        <h1 className="mt-2 text-[30px] font-semibold leading-[1.1] tracking-[-0.035em] text-ink-1 sm:text-[38px]">{title}</h1>
        {subtitle ? <p className="mt-3 text-[15px] leading-6 text-ink-2">{subtitle}</p> : null}
      </div>
      {children ? <div className="flex flex-wrap items-center gap-2">{children}</div> : null}
    </div>
  );
}
