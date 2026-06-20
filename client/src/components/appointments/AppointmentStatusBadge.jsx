import Badge from '../ui/Badge';

export default function AppointmentStatusBadge({ status }) {
  return <Badge status={status}>{status}</Badge>;
}
