import type { Condition } from '@/lib/types';
import { CONDITION_META } from '@/lib/utils';

export function ConditionBadge({ condition }: { condition: Condition }) {
  const { label, color } = CONDITION_META[condition];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
      style={{
        // Text is pulled 40% toward the page text colour (darker in light mode, lighter in
        // dark mode) so it passes WCAG AA on its own tinted background.
        color: `color-mix(in srgb, ${color} 60%, var(--foreground))`,
        background: `color-mix(in srgb, ${color} 12%, transparent)`,
      }}
    >
      <span className="size-1.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
