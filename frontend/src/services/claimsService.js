import { getAccessToken, notifyUnauthorized } from './authService'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5169'
const CLAIMS_ENDPOINT = `${API_BASE_URL}/api/claims`
const CLAIM_TYPES_ENDPOINT = `${API_BASE_URL}/api/claim-types`

async function request(url, options = {}) {
  let response

  try {
    const token = getAccessToken()
    response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
      ...options,
    })
  } catch {
    throw new Error(`Não foi possível conectar à API. Verifique se o backend está disponível em ${API_BASE_URL}.`)
  }

  if (response.status === 204) {
    return null
  }

  const contentType = response.headers.get('content-type') || ''
  const data = contentType.includes('application/json') ? await response.json() : null

  if (response.status === 401) {
    notifyUnauthorized()
    throw new Error('Sua sessão expirou. Faça login novamente.')
  }

  if (!response.ok) {
    throw new Error(getApiErrorMessage(data, response.status))
  }

  return data
}

function getApiErrorMessage(data, status) {
  if (data?.errors) {
    return Object.values(data.errors).flat().join(' ')
  }

  if (data?.detail) {
    return data.detail
  }

  if (data?.title) {
    return data.title
  }

  return `Não foi possível concluir a operação. Código ${status}.`
}

export function getClaims({ pageNumber = 1, pageSize = 10, filters = {} } = {}) {
  const params = new URLSearchParams()
  params.set('pageNumber', String(pageNumber))
  params.set('pageSize', String(pageSize))

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      params.set(key, String(value).trim())
    }
  })

  return request(`${CLAIMS_ENDPOINT}?${params}`)
}

export function getClaimsDashboard() {
  return request(`${CLAIMS_ENDPOINT}/dashboard`)
}

export function getClaimTypes() {
  return request(CLAIM_TYPES_ENDPOINT)
}

export function createClaim(claim) {
  return request(CLAIMS_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify(claim),
  })
}

export function updateClaim(id, claim) {
  return request(`${CLAIMS_ENDPOINT}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(claim),
  })
}

export function deleteClaim(id) {
  return request(`${CLAIMS_ENDPOINT}/${id}`, {
    method: 'DELETE',
  })
}
