export default function Button({ children, variant = 'primary', size, className = '', loading, ...props }) {
  const cls = [
    'btn',
    `btn-${variant}`,
    size === 'sm' ? 'btn-sm' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button className={cls} disabled={loading || props.disabled} {...props}>
      {loading ? '...' : children}
    </button>
  );
}
