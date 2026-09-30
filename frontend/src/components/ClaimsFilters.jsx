import { useEffect, useState } from 'react'
import { Button, Group, NumberInput, Paper, Select, SimpleGrid, TextInput } from '@mantine/core'
import { IconFilter, IconSearch, IconX } from '@tabler/icons-react'
import { claimStatusOptions } from '../utils/formatters'

const emptyFilters = {
  searchTerm: '',
  status: '',
  claimType: '',
  occurrenceDateFrom: '',
  occurrenceDateTo: '',
  estimatedAmountMin: '',
  estimatedAmountMax: '',
}

export function ClaimsFilters({ filters, onApply, onClear }) {
  const [draftFilters, setDraftFilters] = useState(filters)
  const [advancedOpen, setAdvancedOpen] = useState(false)

  useEffect(() => {
    setDraftFilters(filters)
  }, [filters])

  function updateFilter(name, value) {
    setDraftFilters((current) => ({ ...current, [name]: value ?? '' }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    onApply(draftFilters)
  }

  function handleClear() {
    setDraftFilters(emptyFilters)
    onClear()
  }

  return (
    <Paper component="form" className="claims-filters" withBorder radius="lg" shadow="xs" onSubmit={handleSubmit}>
      <Group align="flex-end">
        <TextInput
          className="claims-search"
          label="Buscar"
          placeholder="Número, apólice, segurado ou CPF/CNPJ"
          leftSection={<IconSearch size={16} />}
          value={draftFilters.searchTerm}
          onChange={(event) => updateFilter('searchTerm', event.currentTarget.value)}
        />
        <Select
          className="claims-status-filter"
          label="Status"
          placeholder="Todos"
          data={claimStatusOptions}
          value={draftFilters.status || null}
          onChange={(value) => updateFilter('status', value || '')}
          clearable
        />
        <Button type="submit" leftSection={<IconFilter size={16} />}>
          Aplicar filtros
        </Button>
        <Button
          type="button"
          variant="default"
          aria-expanded={advancedOpen}
          onClick={() => setAdvancedOpen((value) => !value)}
        >
          {advancedOpen ? 'Menos filtros' : 'Mais filtros'}
        </Button>
        <Button type="button" variant="subtle" color="gray" leftSection={<IconX size={16} />} onClick={handleClear}>
          Limpar
        </Button>
      </Group>

      {advancedOpen && (
        <SimpleGrid className="claims-advanced-filters" cols={{ base: 1, sm: 2, md: 5 }} spacing="md">
          <TextInput
            label="Tipo"
            placeholder="Ex.: colisão"
            value={draftFilters.claimType}
            onChange={(event) => updateFilter('claimType', event.currentTarget.value)}
          />
          <TextInput
            label="Ocorrência de"
            type="date"
            value={draftFilters.occurrenceDateFrom}
            onChange={(event) => updateFilter('occurrenceDateFrom', event.currentTarget.value)}
          />
          <TextInput
            label="Ocorrência até"
            type="date"
            value={draftFilters.occurrenceDateTo}
            onChange={(event) => updateFilter('occurrenceDateTo', event.currentTarget.value)}
          />
          <NumberInput
            label="Valor mínimo"
            min={0}
            decimalScale={2}
            decimalSeparator=","
            thousandSeparator="."
            value={draftFilters.estimatedAmountMin}
            onChange={(value) => updateFilter('estimatedAmountMin', value)}
          />
          <NumberInput
            label="Valor máximo"
            min={0}
            decimalScale={2}
            decimalSeparator=","
            thousandSeparator="."
            value={draftFilters.estimatedAmountMax}
            onChange={(value) => updateFilter('estimatedAmountMax', value)}
          />
        </SimpleGrid>
      )}
    </Paper>
  )
}

export { emptyFilters }
