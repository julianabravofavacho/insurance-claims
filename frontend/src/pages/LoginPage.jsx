import { useState } from 'react'
import { Alert, Button, Card, Container, PasswordInput, Stack, Text, TextInput, Title } from '@mantine/core'
import { IconAlertCircle, IconLock, IconShieldCheck } from '@tabler/icons-react'
import { login } from '../services/authService'

export function LoginPage({ onLogin }) {
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
    setApiError('')
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
      const session = await login({
        email: form.email.trim(),
        password: form.password,
      })
      onLogin(session)
    } catch (error) {
      setApiError(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="login-page">
      <Container size={420}>
        <Card className="login-card" shadow="xl" radius="xl" padding="xl">
          <form onSubmit={handleSubmit}>
            <Stack gap="lg">
              <Stack gap="xs" align="center">
                <div className="login-icon">
                  <IconShieldCheck size={34} />
                </div>
                <Text size="xs" fw={800} tt="uppercase" c="blue.7" lts={1}>
                  Insurance Claims
                </Text>
                <Title order={1} ta="center">
                  Acesse sua conta
                </Title>
                <Text c="dimmed" ta="center">
                  Entre para gerenciar os sinistros cadastrados.
                </Text>
              </Stack>

              {apiError && (
                <Alert color="red" icon={<IconAlertCircle size={18} />} title="Não foi possível entrar">
                  {apiError}
                </Alert>
              )}

              <TextInput
                label="E-mail"
                placeholder="seu.email@empresa.com"
                value={form.email}
                error={errors.email}
                onChange={(event) => updateField('email', event.currentTarget.value)}
                autoComplete="email"
                required
              />

              <PasswordInput
                label="Senha"
                placeholder="Informe sua senha"
                value={form.password}
                error={errors.password}
                leftSection={<IconLock size={16} />}
                onChange={(event) => updateField('password', event.currentTarget.value)}
                autoComplete="current-password"
                required
              />

              <Button type="submit" size="md" loading={submitting} fullWidth>
                Entrar
              </Button>
            </Stack>
          </form>
        </Card>
      </Container>
    </main>
  )
}

function validate(form) {
  const errors = {}

  if (!form.email.trim()) {
    errors.email = 'Informe o e-mail.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = 'Informe um e-mail válido.'
  }

  if (!form.password) {
    errors.password = 'Informe a senha.'
  }

  return errors
}
