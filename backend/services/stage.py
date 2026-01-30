"""Compute user stage from profile and shortlist."""
# Stage 1: Building Profile
# Stage 2: Discovering Universities
# Stage 3: Finalizing Universities (has shortlist, no lock)
# Stage 4: Preparing Applications (has at least one locked)


def get_stage(profile, shortlisted_count: int, locked_count: int) -> int:
    if not profile or not profile.onboarding_complete:
        return 1
    if locked_count >= 1:
        return 4
    if shortlisted_count >= 1:
        return 3
    return 2


def get_stage_label(stage: int) -> str:
    return {
        1: "Building Profile",
        2: "Discovering Universities",
        3: "Finalizing Universities",
        4: "Preparing Applications",
    }.get(stage, "Building Profile")
