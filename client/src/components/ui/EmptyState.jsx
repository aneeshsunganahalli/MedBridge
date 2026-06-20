import Button from './Button';

export default function EmptyState({ icon = '📋', title, message, actionLabel, onAction }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <div className="empty-state-title">{title}</div>
      {message && <div className="empty-state-text">{message}</div>}
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction}>{actionLabel}</Button>
      )}
    </div>
  );
}
