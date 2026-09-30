export const claimStatusOptions = [
  { value: 'Open', label: 'Aberto' },
  { value: 'UnderAnalysis', label: 'Em análise' },
  { value: 'Approved', label: 'Aprovado' },
  { value: 'Rejected', label: 'Rejeitado' },
  { value: 'Closed', label: 'Finalizado' },
]

export const claimStatusLabels = claimStatusOptions.reduce((labels, status) => {
  labels[status.value] = status.label
  return labels
}, {})

export function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value || 0))
}

export function formatDate(value) {
  if (!value) {
    return '-'
  }

  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(value))
}

export function toInputDate(value) {
  if (!value) {
    return ''
  }

  return value.slice(0, 10)
}
