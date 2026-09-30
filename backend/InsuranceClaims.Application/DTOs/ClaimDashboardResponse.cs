using InsuranceClaims.Domain.Enums;

namespace InsuranceClaims.Application.DTOs;

public sealed record ClaimDashboardResponse(
    int TotalClaims,
    int OpenClaims,
    int UnderAnalysisClaims,
    int ApprovedClaims,
    int RejectedClaims,
    int ClosedClaims,
    decimal TotalEstimatedAmount,
    decimal AverageEstimatedAmount,
    IReadOnlyList<ClaimStatusSummaryResponse> ClaimsByStatus,
    IReadOnlyList<ClaimTypeSummaryResponse> ClaimsByType,
    IReadOnlyList<ClaimMonthlySummaryResponse> ClaimsByMonth,
    IReadOnlyList<RecentClaimResponse> RecentClaims);

public sealed record ClaimStatusSummaryResponse(
    ClaimStatus Status,
    int Count,
    decimal EstimatedAmount);

public sealed record ClaimTypeSummaryResponse(
    string ClaimType,
    int Count,
    decimal EstimatedAmount);

public sealed record ClaimMonthlySummaryResponse(
    int Year,
    int Month,
    int Count,
    decimal EstimatedAmount);

public sealed record RecentClaimResponse(
    Guid Id,
    string ClaimNumber,
    string InsuredName,
    int ClaimTypeId,
    string ClaimType,
    ClaimStatus Status,
    DateTime OccurrenceDate,
    decimal EstimatedAmount);
