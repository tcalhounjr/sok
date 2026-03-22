interface CollaboratorAvatarsProps {
  initials?: string[];
  overflow?: number;
}

export function CollaboratorAvatars({
  initials = ['A', 'B', 'C'],
  overflow = 3,
}: CollaboratorAvatarsProps) {
  return (
    <div className="flex -space-x-2">
      {initials.map((l, i) => (
        <div
          key={i}
          className="w-6 h-6 rounded-full bg-gradient-primary flex items-center justify-center border border-surface_container_low"
        >
          <span
            className="text-on_primary font-display font-bold"
            style={{ fontSize: '8px' }}
          >
            {l}
          </span>
        </div>
      ))}
      {overflow > 0 && (
        <div className="w-6 h-6 rounded-full bg-surface_container_high flex items-center justify-center border border-surface_container_low">
          <span className="text-on_surface_variant font-body" style={{ fontSize: '8px' }}>
            +{overflow}
          </span>
        </div>
      )}
    </div>
  );
}
