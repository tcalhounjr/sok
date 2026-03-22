import { StatusDot } from '../ui/StatusDot';

type ShiftType = 'EMERGENT TOPIC' | 'SENTIMENT SHIFT' | 'ANOMALY DETECTED';
type BorderColor = 'border-secondary' | 'border-tertiary' | 'border-error';

interface NarrativeShiftCardProps {
  type: ShiftType;
  title: string;
  body: string;
  time: string;
  live?: boolean;
}

const TYPE_COLOR: Record<ShiftType, { border: BorderColor; text: string }> = {
  'EMERGENT TOPIC':   { border: 'border-secondary', text: 'text-secondary' },
  'SENTIMENT SHIFT':  { border: 'border-tertiary',  text: 'text-tertiary'  },
  'ANOMALY DETECTED': { border: 'border-error',     text: 'text-error'     },
};

export function NarrativeShiftCard({ type, title, body, time, live = false }: NarrativeShiftCardProps) {
  const { border, text } = TYPE_COLOR[type];
  return (
    <div className={`card p-5 border-l-2 ${border}`}>
      <div className="flex items-center justify-between mb-2">
        <p className={`overline ${text}`}>{type}</p>
        <div className="flex items-center gap-1.5">
          {live && <StatusDot status="active" pulse />}
          <span className="text-label-sm text-on_surface_variant font-body">{time}</span>
        </div>
      </div>
      <h4 className="font-display font-semibold text-on_surface text-sm mb-2">{title}</h4>
      <p className="text-body-sm text-on_surface_variant font-body line-clamp-3">{body}</p>
    </div>
  );
}
