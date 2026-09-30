import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Badge,
  Container,
  Group,
  Paper,
  SimpleGrid,
  Skeleton,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core'
import { IconAlertCircle, IconChartBar, IconClock, IconCurrencyDollar, IconFileAnalytics } from '@tabler/icons-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { StatusBadge } from '../components/StatusBadge'
import { getClaimsDashboard } from '../services/claimsService'
import { claimStatusLabels, formatCurrency, formatDate } from '../utils/formatters'

const STATUS_COLORS = {
  Open: '#228be6',
  UnderAnalysis: '#f59f00',
  Approved: '#2f9e44',
  Rejected: '#e03131',
  Closed: '#64748b',
}

export function DashboardPage() {
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      setDashboard(await getClaimsDashboard())
    } catch (exception) {
      setError(exception.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const chartData = useMemo(() => buildChartData(dashboard), [dashboard])

  return (
    <Container className="content" size="xl">
      <Stack gap="xl">
          <Group className="page-title" justify="space-between" align="flex-end">
            <Stack gap={6}>
              <Text size="xs" fw={800} tt="uppercase" c="dimmed" lts={0.8}>
                Visão gerencial
              </Text>
              <Title order={1}>Dashboard</Title>
              <Text c="dimmed">Acompanhe os principais indicadores da carteira de sinistros.</Text>
            </Stack>
          </Group>

          {error && (
            <Alert color="red" icon={<IconAlertCircle size={18} />} title="Não foi possível carregar o dashboard">
              {error}
            </Alert>
          )}

          {loading && <DashboardSkeleton />}

          {!loading && dashboard && dashboard.totalClaims === 0 && <EmptyDashboard />}

          {!loading && dashboard && dashboard.totalClaims > 0 && (
            <>
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 5 }} spacing="md">
                <KpiCard
                  icon={<IconFileAnalytics size={22} />}
                  label="Total de sinistros"
                  value={dashboard.totalClaims}
                />
                <KpiCard label="Em aberto" value={dashboard.openClaims} accent="blue" />
                <KpiCard label="Em análise" value={dashboard.underAnalysisClaims} accent="yellow" />
                <KpiCard
                  icon={<IconCurrencyDollar size={22} />}
                  label="Valor estimado"
                  value={formatCurrency(dashboard.totalEstimatedAmount)}
                />
                <KpiCard label="Ticket médio" value={formatCurrency(dashboard.averageEstimatedAmount)} />
              </SimpleGrid>

              <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="md">
                <ChartCard title="Distribuição por status" description="Quantidade de sinistros em cada etapa.">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={chartData.status} dataKey="count" nameKey="label" innerRadius={70} outerRadius={105}>
                        {chartData.status.map((item) => (
                          <Cell key={item.status} fill={item.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name) => [value, name]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <Group gap="xs">
                    {chartData.status.map((item) => (
                      <Badge key={item.status} color={item.badgeColor} variant="light">
                        {item.label}: {item.count}
                      </Badge>
                    ))}
                  </Group>
                </ChartCard>

                <ChartCard title="Sinistros por tipo" description="Principais categorias registradas.">
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={chartData.types} margin={{ top: 12, right: 16, left: 0, bottom: 42 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="claimType" angle={-22} textAnchor="end" interval={0} height={70} />
                      <YAxis allowDecimals={false} />
                      <Tooltip formatter={(value) => [value, 'Sinistros']} />
                      <Bar dataKey="count" fill="#228be6" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              </SimpleGrid>

              <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="md">
                <ChartCard title="Ocorrências por mês" description="Evolução mensal pela data da ocorrência.">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData.months} margin={{ top: 12, right: 16, left: 0, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="label" />
                      <YAxis allowDecimals={false} />
                      <Tooltip formatter={(value) => [value, 'Sinistros']} />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#1c63b8"
                        strokeWidth={3}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartCard>

                <RecentClaimsCard claims={dashboard.recentClaims} />
              </SimpleGrid>
            </>
          )}
      </Stack>
    </Container>
  )
}

function KpiCard({ icon, label, value, accent = 'blue' }) {
  return (
    <Paper className="summary-card dashboard-kpi" withBorder shadow="xs" radius="lg" p="lg">
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <Stack gap={4}>
          <Text size="xs" fw={800} tt="uppercase" c="dimmed" lts={0.7}>
            {label}
          </Text>
          <Text component="strong" size="xl" fw={900}>
            {value}
          </Text>
        </Stack>
        <div className={`dashboard-kpi-icon dashboard-kpi-icon-${accent}`}>
          {icon ?? <IconChartBar size={22} />}
        </div>
      </Group>
    </Paper>
  )
}

function ChartCard({ title, description, children }) {
  return (
    <Paper className="dashboard-card" withBorder shadow="xs" radius="lg" p="lg">
      <Stack gap="md">
        <Stack gap={2}>
          <Title order={3}>{title}</Title>
          <Text size="sm" c="dimmed">
            {description}
          </Text>
        </Stack>
        {children}
      </Stack>
    </Paper>
  )
}

function RecentClaimsCard({ claims }) {
  return (
    <Paper className="dashboard-card" withBorder shadow="xs" radius="lg">
      <Group className="dashboard-card-header" justify="space-between">
        <Stack gap={2}>
          <Title order={3}>Últimos sinistros</Title>
          <Text size="sm" c="dimmed">
            Registros mais recentes da carteira.
          </Text>
        </Stack>
        <IconClock size={22} color="#64748b" />
      </Group>

      <Table verticalSpacing="sm" horizontalSpacing="lg">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Número</Table.Th>
            <Table.Th>Segurado</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th ta="right">Valor</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {claims.map((claim) => (
            <Table.Tr key={claim.id}>
              <Table.Td>
                <Text fw={800}>{claim.claimNumber}</Text>
                <Text size="xs" c="dimmed">
                  {formatDate(claim.occurrenceDate)}
                </Text>
              </Table.Td>
              <Table.Td>{claim.insuredName}</Table.Td>
              <Table.Td>
                <StatusBadge status={claim.status} />
              </Table.Td>
              <Table.Td ta="right">
                <Text fw={700}>{formatCurrency(claim.estimatedAmount)}</Text>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Paper>
  )
}

function DashboardSkeleton() {
  return (
    <Stack gap="md">
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 5 }} spacing="md">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} height={108} radius="lg" />
        ))}
      </SimpleGrid>
      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="md">
        <Skeleton height={380} radius="lg" />
        <Skeleton height={380} radius="lg" />
      </SimpleGrid>
    </Stack>
  )
}

function EmptyDashboard() {
  return (
    <Paper className="dashboard-card" withBorder shadow="xs" radius="lg" p="xl">
      <Stack align="center" gap="sm">
        <div className="empty-state-icon">
          <IconFileAnalytics size={28} />
        </div>
        <Title order={3}>Dashboard sem dados</Title>
        <Text c="dimmed" ta="center">
          Cadastre sinistros para visualizar indicadores e gráficos da carteira.
        </Text>
      </Stack>
    </Paper>
  )
}

function buildChartData(dashboard) {
  if (!dashboard) {
    return { status: [], types: [], months: [] }
  }

  return {
    status: dashboard.claimsByStatus.map((item) => ({
      ...item,
      label: claimStatusLabels[item.status] ?? item.status,
      color: STATUS_COLORS[item.status] ?? '#64748b',
      badgeColor: getBadgeColor(item.status),
    })),
    types: dashboard.claimsByType,
    months: dashboard.claimsByMonth.map((item) => ({
      ...item,
      label: `${String(item.month).padStart(2, '0')}/${item.year}`,
    })),
  }
}

function getBadgeColor(status) {
  const colors = {
    Open: 'blue',
    UnderAnalysis: 'yellow',
    Approved: 'green',
    Rejected: 'red',
    Closed: 'gray',
  }

  return colors[status] ?? 'gray'
}

