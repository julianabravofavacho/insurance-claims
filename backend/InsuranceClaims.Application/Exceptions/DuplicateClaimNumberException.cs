namespace InsuranceClaims.Application.Exceptions;

public sealed class DuplicateClaimNumberException : Exception
{
    public DuplicateClaimNumberException()
        : base("Já existe um sinistro com este número.")
    {
    }
}
