const STATUS_MAP = {
  booked: 'blue',
  completed: 'green',
  cancelled: 'red',
  pending: 'amber',
  patient: 'blue',
  doctor: 'green',
};

export default function Badge({ children, variant, status }) {
  const color = variant || STATUS_MAP[status] || 'grey';
  return <span className={`badge badge-${color}`}>{children || status}</span>;
}
