using InsuranceClaims.Domain.Enums;

namespace InsuranceClaims.Application.DTOs;

public sealed record ClaimResponse(
    Guid Id,
    string ClaimNumber,
    string PolicyNumber,
    string InsuredName,
    string InsuredDocument,
    int ClaimTypeId,
    string ClaimType,
    DateTime OccurrenceDate,
    decimal EstimatedAmount,
    string Description,
    ClaimStatus Status,
    DateTime CreatedAt,
    DateTime? UpdatedAt);
