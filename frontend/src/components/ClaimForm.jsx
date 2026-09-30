import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Divider,
  Group,
  NumberInput,
  Select,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core'
import { IconAlertCircle, IconDeviceFloppy, IconX } from '@tabler/icons-react'
import {
  formatInsuredDocument,
  isValidInsuredDocument,
  normalizeInsuredDocument,
} from '../utils/documentUtils'
import { claimStatusOptions, toInputDate } from '../utils/formatters'

const emptyForm = {
  claimNumber: '',
  policyNumber: '',
  insuredName: '',
  insuredDocument: '',
  claimTypeId: '',
  occurrenceDate: '',
  estimatedAmount: '',
  description: '',
  status: 'Open',
}

const requiredFieldNames = [
  'claimNumber',
  'policyNumber',
  'insuredName',
  'insuredDocument',
  'claimTypeId',
  'occurrenceDate',
  'estimatedAmount',
  'description',
]

export function createFormState(claim) {
  if (!claim) {
    return emptyForm
  }

  return {
    claimNumber: claim.claimNumber || '',
    policyNumber: claim.policyNumber || '',
    insuredName: claim.insuredName || '',
    insuredDocument: formatInsuredDocument(claim.insuredDocument),
    claimTypeId: claim.claimTypeId ? String(claim.claimTypeId) : '',
    occurrenceDate: toInputDate(claim.occurrenceDate),
    estimatedAmount: claim.estimatedAmount ?? '',
    description: claim.description || '',
    status: claim.status || 'Open',
  }
}

export function ClaimForm({ claim, claimTypes, onSubmit, onCancel, submitting }) {
  const isEditing = Boolean(claim)
  const [formData, setFormData] = useState(() => createFormState(claim))
  const [validationError, setValidationError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    setFormData(createFormState(claim))
    setValidationError('')
    setSubmitted(false)
  }, [claim])

  function updateField(name, value) {
    setFormData((current) => ({ ...current, [name]: value }))
  }

  function updateInsuredDocument(value) {
    setFormData((current) => ({ ...current, insuredDocument: formatInsuredDocument(value) }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    setSubmitted(true)
    const error = validateForm(formData)

    if (error) {
      setValidationError(error)
      return
    }

    setValidationError('')
    setSubmitted(false)
    onSubmit(buildPayload(formData, isEditing))
  }

  const claimTypeOptions = claimTypes.map((claimType) => ({
    value: String(claimType.id),
    label: claimType.name,
  }))

  return (
    <Box component="form" className="claim-form" onSubmit={handleSubmit}>
      <Box className="claim-form-header">
        <Stack gap={4}>
          <Text size="xs" fw={800} tt="uppercase" c="dimmed" lts={0.8}>
            {isEditing ? 'Edição' : 'Cadastro'}
          </Text>
          <Title order={2}>{isEditing ? 'Editar sinistro' : 'Novo sinistro'}</Title>
        </Stack>
        <Button
          type="button"
          variant="subtle"
          color="gray"
          leftSection={<IconX size={16} />}
          onClick={onCancel}
          disabled={submitting}
        >
          Fechar
        </Button>
      </Box>

      <Stack className="claim-form-body" gap="xl">
        {validationError && (
          <Alert color="red" icon={<IconAlertCircle size={18} />} role="alert">
            {validationError}
          </Alert>
        )}

        <FormSection title="Dados do sinistro">
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            <TextInput
              label="Número"
              withAsterisk
              value={formData.claimNumber}
              onChange={(event) => updateField('claimNumber', event.currentTarget.value)}
              error={hasFieldError('claimNumber', formData, submitted)}
              autoFocus
            />
            <TextInput
              label="Apólice"
              withAsterisk
              value={formData.policyNumber}
              onChange={(event) => updateField('policyNumber', event.currentTarget.value)}
              error={hasFieldError('policyNumber', formData, submitted)}
            />
            <Select
              label="Tipo"
              withAsterisk
              placeholder="Selecione"
              data={claimTypeOptions}
              value={formData.claimTypeId || null}
              onChange={(value) => updateField('claimTypeId', value || '')}
              error={hasFieldError('claimTypeId', formData, submitted)}
              disabled={claimTypeOptions.length === 0}
              searchable
            />
            <TextInput
              label="Data da ocorrência"
              type="date"
              withAsterisk
              value={formData.occurrenceDate}
              onChange={(event) => updateField('occurrenceDate', event.currentTarget.value)}
              error={hasFieldError('occurrenceDate', formData, submitted)}
            />
            <NumberInput
              label="Valor estimado"
              withAsterisk
              min={0}
              decimalScale={2}
              decimalSeparator=","
              thousandSeparator="."
              value={formData.estimatedAmount}
              onChange={(value) => updateField('estimatedAmount', value)}
              error={hasFieldError('estimatedAmount', formData, submitted)}
            />
            {isEditing && (
              <Select
                label="Status"
                data={claimStatusOptions}
                value={formData.status}
                onChange={(value) => updateField('status', value || 'Open')}
                allowDeselect={false}
              />
            )}
          </SimpleGrid>
        </FormSection>

        <FormSection title="Segurado">
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            <TextInput
              label="Nome"
              withAsterisk
              value={formData.insuredName}
              onChange={(event) => updateField('insuredName', event.currentTarget.value)}
              error={hasFieldError('insuredName', formData, submitted)}
            />
            <TextInput
              label="CPF/CNPJ do segurado"
              withAsterisk
              value={formData.insuredDocument}
              onChange={(event) => updateInsuredDocument(event.currentTarget.value)}
              error={getInsuredDocumentError(formData, submitted)}
            />
          </SimpleGrid>
        </FormSection>

        <FormSection title="Detalhes">
          <Textarea
            label="Descrição"
            withAsterisk
            autosize
            minRows={5}
            maxRows={8}
            maxLength={2000}
            value={formData.description}
            onChange={(event) => updateField('description', event.currentTarget.value)}
            error={hasFieldError('description', formData, submitted)}
          />
        </FormSection>
      </Stack>

      <Group className="claim-form-actions" justify="flex-end">
        <Button type="button" variant="default" onClick={onCancel} disabled={submitting}>
          Cancelar
        </Button>
        <Button type="submit" leftSection={<IconDeviceFloppy size={16} />} loading={submitting}>
          Salvar sinistro
        </Button>
      </Group>
    </Box>
  )
}

function FormSection({ title, children }) {
  return (
    <Stack gap="md">
      <Group gap="sm">
        <Text fw={800}>
          {title}
        </Text>
        <Divider className="form-section-divider" />
      </Group>
      {children}
    </Stack>
  )
}

function hasFieldError(fieldName, formData, submitted) {
  return submitted && isRequiredFieldEmpty(formData[fieldName])
}

function getInsuredDocumentError(formData, submitted) {
  if (!submitted) {
    return false
  }

  if (isRequiredFieldEmpty(formData.insuredDocument)) {
    return true
  }

  return isValidInsuredDocument(formData.insuredDocument)
    ? false
    : 'Informe um CPF ou CNPJ válido.'
}

function isRequiredFieldEmpty(value) {
  return String(value).trim() === ''
}

function validateForm(formData) {
  if (requiredFieldNames.some((fieldName) => isRequiredFieldEmpty(formData[fieldName]))) {
    return 'Preencha os campos obrigatórios.'
  }

  if (!isValidInsuredDocument(formData.insuredDocument)) {
    return 'Informe um CPF ou CNPJ válido.'
  }

  if (Number(formData.estimatedAmount) < 0) {
    return 'O valor estimado não pode ser negativo.'
  }

  const occurrenceDate = new Date(`${formData.occurrenceDate}T00:00:00`)
  const today = new Date()
  today.setHours(23, 59, 59, 999)

  if (occurrenceDate > today) {
    return 'A data da ocorrência não pode ser futura.'
  }

  return ''
}

function buildPayload(formData, isEditing) {
  const payload = {
    claimNumber: formData.claimNumber.trim(),
    policyNumber: formData.policyNumber.trim(),
    insuredName: formData.insuredName.trim(),
    insuredDocument: normalizeInsuredDocument(formData.insuredDocument),
    claimTypeId: Number(formData.claimTypeId),
    occurrenceDate: formData.occurrenceDate,
    estimatedAmount: Number(formData.estimatedAmount),
    description: formData.description.trim(),
  }

  if (isEditing) {
    payload.status = formData.status
  }

  return payload
}

