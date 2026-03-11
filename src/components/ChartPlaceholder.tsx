interface ChartPlaceholderProps {
  title?: string;
  subtitle?: string;
  className?: string;
}

export default function ChartPlaceholder({
  title,
  subtitle,
  className = "",
}: ChartPlaceholderProps) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-[#0f2235]/75 p-5 shadow-[0_18px_45px_-28px_rgba(0,0,0,0.85)] backdrop-blur-sm ${className}`}
    >
      {title && <p className="text-lg font-semibold text-[#fff7eb]">{title}</p>}
      {subtitle && <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-300">{subtitle}</p>}

      <div className="mt-5 flex h-44 items-end gap-2 rounded-xl border border-white/10 bg-[#081625]/70 p-4">
        {[36, 58, 44, 73, 62, 88, 67].map((value, index) => (
          <div
            key={`${value}-${index}`}
            className="flex-1 rounded-sm bg-gradient-to-t from-[#14b8a6] to-[#f97316] opacity-85"
            style={{ height: `${value}%` }}
          />
        ))}
      </div>
    </div>
  );
}
