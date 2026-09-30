const FORMATTING_CHARACTERS_REGEX = /[^a-zA-Z0-9]/g
const DIGITS_ONLY_REGEX = /^\d+$/
const ALPHA_NUMERIC_REGEX = /^[A-Z0-9]+$/
const CPF_LENGTH = 11
const CNPJ_LENGTH = 14

export function normalizeInsuredDocument(value) {
  return String(value || '')
    .trim()
    .replace(FORMATTING_CHARACTERS_REGEX, '')
    .toUpperCase()
    .slice(0, CNPJ_LENGTH)
}

export function isValidInsuredDocument(value) {
  const normalizedValue = normalizeInsuredDocument(value)

  if (DIGITS_ONLY_REGEX.test(normalizedValue)) {
    if (normalizedValue.length === CPF_LENGTH) {
      return isValidCpf(normalizedValue)
    }

    if (normalizedValue.length === CNPJ_LENGTH) {
      return isValidNumericCnpj(normalizedValue)
    }

    return false
  }

  return isValidAlphanumericCnpj(normalizedValue)
}

export function formatInsuredDocument(value) {
  const normalizedValue = normalizeInsuredDocument(value)

  if (DIGITS_ONLY_REGEX.test(normalizedValue) && normalizedValue.length <= CPF_LENGTH) {
    return formatCpf(normalizedValue)
  }

  return formatCnpj(normalizedValue)
}

function formatCpf(value) {
  return value
    .slice(0, CPF_LENGTH)
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4')
}

function formatCnpj(value) {
  return value
    .slice(0, CNPJ_LENGTH)
    .replace(/^([A-Z0-9]{2})([A-Z0-9])/, '$1.$2')
    .replace(/^([A-Z0-9]{2})\.([A-Z0-9]{3})([A-Z0-9])/, '$1.$2.$3')
    .replace(/^([A-Z0-9]{2})\.([A-Z0-9]{3})\.([A-Z0-9]{3})([A-Z0-9])/, '$1.$2.$3/$4')
    .replace(
      /^([A-Z0-9]{2})\.([A-Z0-9]{3})\.([A-Z0-9]{3})\/([A-Z0-9]{4})([A-Z0-9])/,
      '$1.$2.$3/$4-$5',
    )
}

function isValidCpf(value) {
  if (hasRepeatedDigits(value)) {
    return false
  }

  const firstDigit = calculateCpfDigit(value, 9, 10)
  const secondDigit = calculateCpfDigit(value, 10, 11)

  return value[9] === String(firstDigit) && value[10] === String(secondDigit)
}

function isValidNumericCnpj(value) {
  if (hasRepeatedDigits(value)) {
    return false
  }

  const firstDigit = calculateCnpjDigit(value, true)
  const secondDigit = calculateCnpjDigit(value, false)

  return value[12] === String(firstDigit) && value[13] === String(secondDigit)
}

function isValidAlphanumericCnpj(value) {
  return value.length === CNPJ_LENGTH && ALPHA_NUMERIC_REGEX.test(value) && /[A-Z]/.test(value)
}

function hasRepeatedDigits(value) {
  return value.split('').every((character) => character === value[0])
}

function calculateCpfDigit(value, length, initialWeight) {
  let sum = 0

  for (let index = 0; index < length; index += 1) {
    sum += Number(value[index]) * (initialWeight - index)
  }

  const remainder = sum % 11
  return remainder < 2 ? 0 : 11 - remainder
}

function calculateCnpjDigit(value, firstDigit) {
  const weights = firstDigit
    ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]

  const sum = weights.reduce((total, weight, index) => total + Number(value[index]) * weight, 0)
  const remainder = sum % 11

  return remainder < 2 ? 0 : 11 - remainder
}
