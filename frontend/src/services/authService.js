const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5169'
const AUTH_ENDPOINT = `${API_BASE_URL}/api/auth`
const SESSION_STORAGE_KEY = 'insuranceClaims.auth'

export async function login(credentials) {
  const response = await fetch(`${AUTH_ENDPOINT}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  })

  const contentType = response.headers.get('content-type') || ''
  const data = contentType.includes('application/json') ? await response.json() : null

  if (!response.ok) {
    throw new Error(getAuthErrorMessage(data, response.status))
  }

  saveSession(data)
  return data
}

export async function changePassword(payload) {
  const token = getAccessToken()
  const response = await fetch(`${AUTH_ENDPOINT}/change-password`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  })

  if (response.status === 204) {
    return
  }

  const contentType = response.headers.get('content-type') || ''
  const data = contentType.includes('application/json') ? await response.json() : null

  if (response.status === 401) {
    throw new Error('Senha atual inválida.')
  }

  if (!response.ok) {
    throw new Error(getAuthErrorMessage(data, response.status))
  }
}

export function getSession() {
  const rawSession = sessionStorage.getItem(SESSION_STORAGE_KEY)

  if (!rawSession) {
    return null
  }

  try {
    const session = JSON.parse(rawSession)
    if (!session?.accessToken || isExpired(session.expiresAt)) {
      clearSession()
      return null
    }

    return session
  } catch {
    clearSession()
    return null
  }
}

export function getAccessToken() {
  return getSession()?.accessToken ?? null
}

export function saveSession(session) {
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
}

export function clearSession() {
  sessionStorage.removeItem(SESSION_STORAGE_KEY)
}

export function notifyUnauthorized() {
  clearSession()
  window.dispatchEvent(new CustomEvent('auth:unauthorized'))
}

function isExpired(expiresAt) {
  if (!expiresAt) {
    return true
  }

  return new Date(expiresAt).getTime() <= Date.now()
}

function getAuthErrorMessage(data, status) {
  if (status === 401) {
    return 'E-mail ou senha inválidos.'
  }

  if (data?.errors) {
    return Object.values(data.errors).flat().join(' ')
  }

  if (data?.detail) {
    return data.detail
  }

  if (data?.title) {
    return data.title
  }

  return 'Não foi possível realizar o login. Tente novamente.'
}
