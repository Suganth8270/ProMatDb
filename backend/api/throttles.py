from rest_framework.throttling import ScopedRateThrottle


class DockingSubmitThrottle(ScopedRateThrottle):
    scope = "docking_submit"


class DockingStatusThrottle(ScopedRateThrottle):
    scope = "docking_status"


class WorkerHealthThrottle(ScopedRateThrottle):
    scope = "worker_health"


class ArtifactReadThrottle(ScopedRateThrottle):
    scope = "artifact_read"


class BiomaterialMutationThrottle(ScopedRateThrottle):
    scope = "biomaterial_mutation"


class ProteinMutationThrottle(ScopedRateThrottle):
    scope = "protein_mutation"
