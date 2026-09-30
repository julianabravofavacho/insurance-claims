import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Container, Group, Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core'
import { IconPlus } from '@tabler/icons-react'
import { ClaimDrawer } from '../components/ClaimDrawer'
import { ClaimsFilters, emptyFilters } from '../components/ClaimsFilters'
import { ClaimsTable } from '../components/ClaimsTable'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { Feedback } from '../components/Feedback'
import { createClaim, deleteClaim, getClaims, getClaimTypes, updateClaim } from '../services/claimsService'
import { formatCurrency } from '../utils/formatters'

const PAGE_SIZE = 10

export function ClaimsPage() {
  const [claims, setClaims] = useState([])
  const [pagination, setPagination] = useState({
    pageNumber: 1,
    pageSize: PAGE_SIZE,
    totalCount: 0,
    totalPages: 0,
  })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [editingClaim, setEditingClaim] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [claimToDelete, setClaimToDelete] = useState(null)
  const [feedback, setFeedback] = useState({ message: '', type: 'success' })
  const [filters, setFilters] = useState(emptyFilters)
  const [claimTypes, setClaimTypes] = useState([])

  const loadClaims = useCallback(async (pageNumber = pagination.pageNumber) => {
    try {
      setLoading(true)
      const result = await getClaims({ pageNumber, pageSize: PAGE_SIZE, filters })
      const pagedResult = normalizeClaimsResponse(result, pageNumber)
      setClaims(pagedResult.items)
      setPagination({
        pageNumber: pagedResult.pageNumber,
        pageSize: pagedResult.pageSize,
        totalCount: pagedResult.totalCount,
        totalPages: pagedResult.totalPages,
      })
    } catch (error) {
      showFeedback(error.message, 'error')
    } finally {
      setLoading(false)
    }
  }, [filters, pagination.pageNumber])

  useEffect(() => {
    loadClaims()
  }, [loadClaims])

  useEffect(() => {
    async function loadClaimTypes() {
      try {
        setClaimTypes(await getClaimTypes())
      } catch (error) {
        showFeedback(error.message, 'error')
      }
    }

    loadClaimTypes()
  }, [])

  const summary = useMemo(() => {
    const activeClaims = claims.filter((claim) => claim.status === 'Open' || claim.status === 'UnderAnalysis').length
    const totalEstimatedAmount = claims.reduce((total, claim) => total + Number(claim.estimatedAmount || 0), 0)

    return [
      { label: 'Total de sinistros', value: pagination.totalCount },
      { label: 'Em aberto ou análise nesta página', value: activeClaims },
      { label: 'Valor estimado nesta página', value: formatCurrency(totalEstimatedAmount) },
    ]
  }, [claims, pagination.totalCount])

  const hasActiveFilters = useMemo(
    () => Object.values(filters).some((value) => String(value ?? '').trim() !== ''),
    [filters],
  )

  function handleNewClaim() {
    setEditingClaim(null)
    setShowForm(true)
  }

  function handleEditClaim(claim) {
    setEditingClaim(claim)
    setShowForm(true)
  }

  async function handleSubmit(payload) {
    try {
      setSubmitting(true)

      if (editingClaim) {
        const updatedClaim = await updateClaim(editingClaim.id, payload)
        setClaims((current) => current.map((claim) => (claim.id === updatedClaim.id ? updatedClaim : claim)))
        showFeedback('Sinistro atualizado com sucesso.', 'success')
      } else {
        await createClaim(payload)
        setPagination((current) => ({ ...current, pageNumber: 1 }))
        await loadClaims(1)
        showFeedback('Sinistro cadastrado com sucesso.', 'success')
      }

      closeForm()
    } catch (error) {
      showFeedback(error.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleConfirmDelete() {
    if (!claimToDelete) {
      return
    }

    try {
      setSubmitting(true)
      await deleteClaim(claimToDelete.id)
      await loadClaims()
      showFeedback('Sinistro excluído com sucesso.', 'success')
      setClaimToDelete(null)
    } catch (error) {
      showFeedback(error.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  function closeForm() {
    setShowForm(false)
    setEditingClaim(null)
  }

  function showFeedback(message, type) {
    setFeedback({ message, type })
  }

  const clearFeedback = useCallback(() => {
    setFeedback({ message: '', type: 'success' })
  }, [])

  function handlePageChange(pageNumber) {
    setPagination((current) => ({ ...current, pageNumber }))
  }

  function handleApplyFilters(nextFilters) {
    setFilters(nextFilters)
    setPagination((current) => ({ ...current, pageNumber: 1 }))
  }

  function handleClearFilters() {
    setFilters(emptyFilters)
    setPagination((current) => ({ ...current, pageNumber: 1 }))
  }

  return (
    <>
      <Container className="content" size="xl">
        <Stack gap="xl">
          <Feedback message={feedback.message} type={feedback.type} onClose={clearFeedback} />

          <Group className="page-title" justify="space-between" align="flex-end">
            <Stack gap={6}>
              <Text size="xs" fw={800} tt="uppercase" c="dimmed" lts={0.8}>
                Operação
              </Text>
              <Title order={1}>Gestão de Sinistros</Title>
              <Text c="dimmed">Controle os sinistros cadastrados e acompanhe o status de análise.</Text>
            </Stack>
            <Button size="md" leftSection={<IconPlus size={18} />} onClick={handleNewClaim}>
              Novo Sinistro
            </Button>
          </Group>

          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
            {summary.map((item) => (
              <SummaryCard key={item.label} label={item.label} value={item.value} />
            ))}
          </SimpleGrid>

          <ClaimsFilters filters={filters} onApply={handleApplyFilters} onClear={handleClearFilters} />

          <ClaimsTable
            claims={claims}
            hasActiveFilters={hasActiveFilters}
            loading={loading}
            pagination={pagination}
            onCreate={handleNewClaim}
            onEdit={handleEditClaim}
            onDelete={setClaimToDelete}
            onClearFilters={handleClearFilters}
            onPageChange={handlePageChange}
          />
        </Stack>
      </Container>

      <ClaimDrawer
        claim={editingClaim}
        claimTypes={claimTypes}
        isOpen={showForm}
        onSubmit={handleSubmit}
        onClose={closeForm}
        submitting={submitting}
      />

      <ConfirmDialog
        claim={claimToDelete}
        onCancel={() => setClaimToDelete(null)}
        onConfirm={handleConfirmDelete}
        submitting={submitting}
      />
    </>
  )
}

function SummaryCard({ label, value }) {
  return (
    <Paper className="summary-card" withBorder shadow="xs" radius="lg" p="lg">
      <Text size="xs" fw={800} tt="uppercase" c="dimmed" lts={0.7}>
        {label}
      </Text>
      <Text component="strong" size="xl" fw={900}>
        {value}
      </Text>
    </Paper>
  )
}

function normalizeClaimsResponse(result, pageNumber) {
  if (Array.isArray(result)) {
    return {
      items: result,
      pageNumber,
      pageSize: PAGE_SIZE,
      totalCount: result.length,
      totalPages: result.length > 0 ? 1 : 0,
    }
  }

  return {
    items: result?.items ?? [],
    pageNumber: result?.pageNumber ?? pageNumber,
    pageSize: result?.pageSize ?? PAGE_SIZE,
    totalCount: result?.totalCount ?? 0,
    totalPages: result?.totalPages ?? 0,
  }
}

