class OperationNotSupportedInManagedSaas(Exception):
    """
    Raised when an RPC endpoint is invoked on a managed-SaaS deployment
    where the operation does not apply (e.g. password mutation, local
    user creation). The frontend additionally hides the corresponding
    UI controls; this exception is the defense-in-depth backstop.
    """

    def __init__(self, operation):
        self.operation = operation
        super().__init__(
            f"Operation '{operation}' is not supported on a managed-SaaS "
            f"deployment of Mathesar."
        )
