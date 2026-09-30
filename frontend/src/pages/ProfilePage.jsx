import { useState } from 'react'
import { Alert, Button, Container, Group, Paper, PasswordInput, SimpleGrid, Stack, Text, TextInput, Title } from '@mantine/core'
import { IconAlertCircle, IconCheck, IconDeviceFloppy, IconLock } from '@tabler/icons-react'
import { changePassword } from '../services/authService'

const emptyForm = {
  currentPassword: '',
  newPassword: '',
  confirmNewPassword: '',
}

const passwordRequirementsMessage =
  'A senha deve ter pelo menos 8 caracteres, incluindo letra maiúscula, letra minúscula, número e caractere especial.'

export function ProfilePage({ user }) {
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [feedback, setFeedback] = useState({ type: '', message: '' })
  const [submitting, setSubmitting] = useState(false)

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
    setFeedback({ type: '', message: '' })
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const validationErrors = validate(form)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) {
      return
    }

    try {
      setSubmitting(true)
      await changePassword(form)
      setForm(emptyForm)
      setFeedback({ type: 'success', message: 'Senha alterada com sucesso.' })
    } catch (error) {
      setFeedback({ type: 'error', message: error.message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Container className="content" size="lg">
      <Stack gap="xl">
        <Stack gap={6}>
          <Text size="xs" fw={800} tt="uppercase" c="dimmed" lts={0.8}>
            Conta
          </Text>
          <Title order={1}>Meu Perfil</Title>
          <Text c="dimmed">Consulte seus dados de acesso e altere sua senha atual.</Text>
        </Stack>

        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
          <Paper className="profile-card" withBorder shadow="xs" radius="lg" p="lg">
            <Stack gap="md">
              <Group gap="sm">
                <div className="profile-icon">
                  <IconLock size={22} />
                </div>
                <Stack gap={0}>
                  <Title order={3}>Dados do usuário</Title>
                  <Text size="sm" c="dimmed">
                    Informações da sessão autenticada.
                  </Text>
                </Stack>
              </Group>

              <TextInput label="Nome" value={user?.name || ''} readOnly />
              <TextInput label="E-mail" value={user?.email || ''} readOnly />
            </Stack>
          </Paper>

          <Paper component="form" className="profile-card" withBorder shadow="xs" radius="lg" p="lg" onSubmit={handleSubmit}>
            <Stack gap="md">
              <Stack gap={2}>
                <Title order={3}>Alterar senha</Title>
                <Text size="sm" c="dimmed">
                  Informe a senha atual para definir uma nova senha.
                </Text>
              </Stack>

              {feedback.message && (
                <Alert
                  color={feedback.type === 'success' ? 'green' : 'red'}
                  icon={feedback.type === 'success' ? <IconCheck size={18} /> : <IconAlertCircle size={18} />}
                >
                  {feedback.message}
                </Alert>
              )}

              <PasswordInput
                label="Senha atual"
                value={form.currentPassword}
                error={errors.currentPassword}
                onChange={(event) => updateField('currentPassword', event.currentTarget.value)}
                autoComplete="current-password"
                required
              />
              <PasswordInput
                label="Nova senha"
                description="Mínimo de 8 caracteres, com maiúscula, minúscula, número e caractere especial."
                value={form.newPassword}
                error={errors.newPassword}
                onChange={(event) => updateField('newPassword', event.currentTarget.value)}
                autoComplete="new-password"
                required
              />
              <PasswordInput
                label="Confirmar nova senha"
                value={form.confirmNewPassword}
                error={errors.confirmNewPassword}
                onChange={(event) => updateField('confirmNewPassword', event.currentTarget.value)}
                autoComplete="new-password"
                required
              />

              <Button type="submit" leftSection={<IconDeviceFloppy size={16} />} loading={submitting}>
                Salvar nova senha
              </Button>
            </Stack>
          </Paper>
        </SimpleGrid>
      </Stack>
    </Container>
  )
}

function validate(form) {
  const errors = {}

  if (!form.currentPassword) {
    errors.currentPassword = 'Informe a senha atual.'
  }

  if (!form.newPassword) {
    errors.newPassword = 'Informe a nova senha.'
  } else if (!isStrongPassword(form.newPassword)) {
    errors.newPassword = passwordRequirementsMessage
  }

  if (!form.confirmNewPassword) {
    errors.confirmNewPassword = 'Confirme a nova senha.'
  } else if (form.confirmNewPassword !== form.newPassword) {
    errors.confirmNewPassword = 'A confirmação não confere.'
  }

  if (form.currentPassword && form.currentPassword === form.newPassword) {
    errors.newPassword = 'A nova senha deve ser diferente da senha atual.'
  }

  return errors
}

function isStrongPassword(password) {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  )
}
