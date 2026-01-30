"""Simple profile strength logic (can be replaced by AI)."""
from typing import Optional


def strength_academics(gpa: Optional[str], degree_major: Optional[str]) -> str:
    if not gpa and not degree_major:
        return "Weak"
    if not gpa:
        return "Average"
    try:
        g = float(str(gpa).replace("%", "").strip())
        if g >= 80 or (g >= 3.5 and g <= 4):
            return "Strong"
        if g >= 60 or (g >= 2.5 and g <= 4):
            return "Average"
    except (ValueError, TypeError):
        pass
    return "Weak"


def strength_exams(exams: Optional[list]) -> str:
    """Compute exam readiness from exams list: [{name, status}, ...].
    Status strings containing 'ready'/'completed' count as completed; 'in progress' as in-progress.
    """
    if not exams:
        return "Not started"
    completed = 0
    in_progress = 0
    for ex in exams:
        status = (ex.get("status") if isinstance(ex, dict) else str(ex)) or ""
        s = status.lower()
        if "ready" in s or "completed" in s:
            completed += 1
        elif "progress" in s or "in progress" in s:
            in_progress += 1

    if completed >= 2:
        return "Completed"
    if completed >= 1 or in_progress >= 1:
        return "In progress"
    return "Not started"


def strength_sop(sop_status: Optional[str]) -> str:
    if not sop_status:
        return "Not started"
    s = (sop_status or "").lower()
    if "ready" in s:
        return "Ready"
    if "draft" in s:
        return "Draft"
    return "Not started"
