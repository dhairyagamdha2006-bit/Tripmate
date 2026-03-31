export function SectionHeader({
  label,
  title,
  description
}: {
  label?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-6">
      {label ? <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">{label}</p> : null}
      <h2 className="font-serif text-2xl text-slate-900">{title}</h2>
      {description ? <p className="mt-2 max-w-2xl text-sm text-slate-500">{description}</p> : null}
    </div>
  );
}
