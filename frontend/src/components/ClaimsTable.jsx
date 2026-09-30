import {
  ActionIcon,
  Button,
  Card,
  Center,
  Group,
  Menu,
  Paper,
  Pagination,
  ScrollArea,
  Skeleton,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core'
import { IconDotsVertical, IconEdit, IconPlus, IconSearch, IconTrash, IconX } from '@tabler/icons-react'
import { formatCurrency, formatDate } from '../utils/formatters'
import { StatusBadge } from './StatusBadge'

export function ClaimsTable({
  claims,
  hasActiveFilters,
  loading,
  pagination,
  onCreate,
  onEdit,
  onDelete,
  onClearFilters,
  onPageChange,
}) {
  return (
    <Paper className="claims-panel" withBorder shadow="sm" radius="lg">
      <Group className="claims-panel-header" justify="space-between" align="center">
        <Stack gap={2}>
          <Text size="xs" fw={800} tt="uppercase" c="dimmed" lts={0.8}>
            Carteira
          </Text>
          <Title order={2}>Sinistros registrados</Title>
        </Stack>
        <Text size="sm" fw={700} c="dimmed">
          {pagination.totalCount} registro{pagination.totalCount === 1 ? '' : 's'}
        </Text>
      </Group>

      {loading && <LoadingState />}
      {!loading && claims.length === 0 && hasActiveFilters && <NoResultsState onClearFilters={onClearFilters} />}
      {!loading && claims.length === 0 && !hasActiveFilters && <EmptyState onCreate={onCreate} />}
      {!loading && claims.length > 0 && (
        <>
          <ScrollArea>
            <Table className="claims-table" verticalSpacing="md" horizontalSpacing="lg" highlightOnHover striped>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Número</Table.Th>
                  <Table.Th>Apólice</Table.Th>
                  <Table.Th>Segurado</Table.Th>
                  <Table.Th>Tipo</Table.Th>
                  <Table.Th>Data da Ocorrência</Table.Th>
                  <Table.Th ta="right">Valor Estimado</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th ta="right">Ações</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {claims.map((claim) => (
                  <Table.Tr key={claim.id}>
                    <Table.Td>
                      <Text fw={800}>
                        {claim.claimNumber}
                      </Text>
                    </Table.Td>
                    <Table.Td>{claim.policyNumber}</Table.Td>
                    <Table.Td>{claim.insuredName}</Table.Td>
                    <Table.Td>{claim.claimType}</Table.Td>
                    <Table.Td>{formatDate(claim.occurrenceDate)}</Table.Td>
                    <Table.Td ta="right">
                      <Text fw={700}>{formatCurrency(claim.estimatedAmount)}</Text>
                    </Table.Td>
                    <Table.Td>
                      <StatusBadge status={claim.status} />
                    </Table.Td>
                    <Table.Td ta="right">
                      <Menu shadow="md" width={160} position="bottom-end">
                        <Menu.Target>
                          <ActionIcon variant="subtle" color="gray" aria-label="Ações do sinistro">
                            <IconDotsVertical size={18} />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item leftSection={<IconEdit size={16} />} onClick={() => onEdit(claim)}>
                            Editar
                          </Menu.Item>
                          <Menu.Item
                            color="red"
                            leftSection={<IconTrash size={16} />}
                            onClick={() => onDelete(claim)}
                          >
                            Excluir
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </ScrollArea>
          {pagination.totalPages > 1 && (
            <Group className="claims-pagination" justify="space-between">
              <Text size="sm" c="dimmed">
                Página {pagination.pageNumber} de {pagination.totalPages}
              </Text>
              <Pagination value={pagination.pageNumber} total={pagination.totalPages} onChange={onPageChange} />
            </Group>
          )}
        </>
      )}
    </Paper>
  )
}

function NoResultsState({ onClearFilters }) {
  return (
    <Center p="xl">
      <Card className="empty-state-card" radius="lg" padding="xl">
        <Stack align="center" gap="sm">
          <div className="empty-state-icon empty-state-icon-muted">
            <IconSearch size={28} />
          </div>
          <Title order={3}>Nenhum registro encontrado</Title>
          <Text c="dimmed" ta="center">
            Não encontramos sinistros para os filtros informados.
          </Text>
          <Button variant="default" leftSection={<IconX size={16} />} onClick={onClearFilters}>
            Limpar filtros
          </Button>
        </Stack>
      </Card>
    </Center>
  )
}

function LoadingState() {
  return (
    <Stack p="xl" gap="sm">
      <Skeleton height={18} radius="sm" />
      <Skeleton height={18} radius="sm" width="85%" />
      <Skeleton height={18} radius="sm" width="70%" />
    </Stack>
  )
}

function EmptyState({ onCreate }) {
  return (
    <Center p="xl">
      <Card className="empty-state-card" radius="lg" padding="xl">
        <Stack align="center" gap="sm">
          <div className="empty-state-icon">
            <IconPlus size={28} />
          </div>
          <Title order={3}>Nenhum sinistro cadastrado</Title>
          <Text c="dimmed" ta="center">
            Cadastre o primeiro sinistro para iniciar o acompanhamento da carteira.
          </Text>
          <Button leftSection={<IconPlus size={16} />} onClick={onCreate}>
            Novo Sinistro
          </Button>
        </Stack>
      </Card>
    </Center>
  )
}

