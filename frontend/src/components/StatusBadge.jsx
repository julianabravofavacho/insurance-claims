import { Badge } from '@mantine/core'
import { claimStatusLabels } from '../utils/formatters'

const statusColors = {
  Open: 'blue',
  UnderAnalysis: 'yellow',
  Approved: 'green',
  Rejected: 'red',
  Closed: 'gray',
}

export function StatusBadge({ status }) {
  return (
    <Badge color={statusColors[status] || 'gray'} variant="light" radius="sm">
      {claimStatusLabels[status] || status}
    </Badge>
  )
}
