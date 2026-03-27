import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Skeleton } from '../ui/Skeleton';
import type { DailyVolume } from '../../types';

interface VolumeChartProps {
  data: DailyVolume[];
  loading: boolean;
  onBarClick?: (date: string) => void;
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-sm p-3 shadow-float border border-surface_bright/20">
      <p className="overline text-on_surface_variant mb-1">{label}</p>
      <p className="text-secondary text-body-sm font-body">{payload[0]?.value} articles</p>
    </div>
  );
}

export function VolumeChart({ data, loading, onBarClick }: VolumeChartProps) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-display font-semibold text-on_surface text-sm">Coverage Volume Over Time</h3>
          <p className="overline text-on_surface_variant mt-0.5">HISTORICAL MENTIONS VS FORECAST</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-label-sm font-body text-secondary">
            <span className="w-2 h-2 rounded-full bg-secondary" /> Active
          </span>
          <span className="flex items-center gap-1.5 text-label-sm font-body text-on_surface_variant">
            <span className="w-2 h-2 rounded-full bg-surface_variant" /> Baseline
          </span>
        </div>
      </div>
      {loading ? (
        <Skeleton className="h-40" />
      ) : (
        <ResponsiveContainer width="100%" height={160}>
          <BarChart
            data={data}
            barSize={18}
            onClick={onBarClick ? (e) => {
              const entry = e?.activePayload?.[0]?.payload as DailyVolume | undefined;
              if (entry && entry.volume > 0) onBarClick(entry.date);
            } : undefined}
          >
            <XAxis
              dataKey="date"
              tick={{ fill: '#9aa3b8', fontSize: 10, fontFamily: 'Inter' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={d =>
                new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              }
            />
            <Tooltip content={<ChartTooltip />} />
            <Bar dataKey="volume" radius={[2, 2, 0, 0]}>
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.volume > 0 ? '#4edea3' : '#222a3d'}
                  style={{ cursor: onBarClick && entry.volume > 0 ? 'pointer' : 'default' }}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
