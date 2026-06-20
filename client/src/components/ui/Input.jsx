export default function Input({ label, error, className = '', ...props }) {
  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      {props.type === 'textarea' ? (
        <textarea
          className={`form-input ${error ? 'error' : ''} ${className}`}
          {...{ ...props, type: undefined }}
        />
      ) : props.type === 'select' ? (
        <select
          className={`form-input ${error ? 'error' : ''} ${className}`}
          {...{ ...props, type: undefined }}
        >
          {props.children}
        </select>
      ) : (
        <input
          className={`form-input ${error ? 'error' : ''} ${className}`}
          {...props}
        />
      )}
      {error && <div className="form-error">{error}</div>}
    </div>
  );
}
