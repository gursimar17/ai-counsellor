"""AI Counsellor using Google Gemini 2026 SDK."""
import json
import re
from typing import Optional, List, Any

# Updated import
from google import genai
from google.genai import types
from sqlalchemy.orm import Session

from config import settings
from models.profile import Profile
from models.university import UniversityShortlist
from models.todo import Todo
from models.chat import ChatMessage
from services.stage import get_stage, get_stage_label

# Initialize the global client - it picks up GEMINI_API_KEY from env automatically
client = genai.Client(api_key=settings.gemini_api_key)

def _profile_context(profile: Optional[Profile]) -> str:
    if not profile:
        return "No profile yet; user is just starting their application planning."
    
    # Format exams from JSON field
    exams_text = ""
    if profile.exams:
        exam_parts = []
        for exam in profile.exams:
            if isinstance(exam, dict):
                name = exam.get("name", "")
                status = exam.get("status", "")
                if name and status:
                    exam_parts.append(f"{name} ({status})")
            elif hasattr(exam, 'name') and hasattr(exam, 'status'):
                exam_parts.append(f"{exam.name} ({exam.status})")
        exams_text = ", ".join(exam_parts) if exam_parts else "No exams recorded yet"
    
    # Build context with only available information
    context_parts = []
    
    # Academic background
    if profile.current_education_level or profile.degree_major or profile.graduation_year or profile.gpa:
        academic = "Academic: "
        academic_info = []
        if profile.current_education_level:
            academic_info.append(profile.current_education_level)
        if profile.degree_major:
            academic_info.append(profile.degree_major)
        if profile.graduation_year:
            academic_info.append(f"grad year {profile.graduation_year}")
        if profile.gpa:
            academic_info.append(f"GPA {profile.gpa}")
        context_parts.append(academic + ", ".join(academic_info) + ".")
    
    # Study goal
    if profile.intended_degree or profile.field_of_study or profile.target_intake_year:
        study_goal = "Study goal: "
        study_info = []
        if profile.intended_degree:
            study_info.append(profile.intended_degree)
        if profile.field_of_study:
            study_info.append(f"in {profile.field_of_study}")
        if profile.target_intake_year:
            study_info.append(f"intake {profile.target_intake_year}")
        context_parts.append(study_goal + " ".join(study_info) + ".")
    
    # Preferred countries
    if profile.preferred_countries:
        context_parts.append(f"Preferred countries: {', '.join(profile.preferred_countries)}.")
    
    # Budget
    if profile.budget_min or profile.budget_max or profile.funding_plan:
        budget_info = "Budget: "
        budget_parts = []
        if profile.budget_min or profile.budget_max:
            min_val = profile.budget_min or "?"
            max_val = profile.budget_max or "?"
            budget_parts.append(f"{min_val}–{max_val} per year")
        if profile.funding_plan:
            budget_parts.append(f"funding: {profile.funding_plan}")
        context_parts.append(budget_info + ", ".join(budget_parts) + ".")
    
    # Exams
    if exams_text:
        context_parts.append(f"Exams: {exams_text}.")
    
    # SOP status
    if profile.sop_status:
        context_parts.append(f"SOP status: {profile.sop_status}.")
    
    return "\n".join(context_parts) if context_parts else "User has not filled out profile details yet. Guide them through building a strong profile."

def _shortlist_context(shortlists: List[UniversityShortlist]) -> str:
    if not shortlists:
        return "No universities shortlisted yet."
    lines = []
    for s in shortlists:
        lines.append(f"- {s.name} ({s.country}) category={s.category} locked={s.locked}")
    return "\n".join(lines)

def build_system_prompt(profile: Optional[Profile], shortlists: List[UniversityShortlist], stage: int) -> str:
    stage_label = get_stage_label(stage)
    return f"""You are an AI Counsellor for study-abroad. You guide students from profile building to university shortlisting and application prep.
Current user stage: {stage} – {stage_label}.

User profile:
{_profile_context(profile)}

Shortlisted/locked universities:
{_shortlist_context(shortlists)}

CRITICAL: When recommending universities with shortlist_add action, ALWAYS include COMPLETE details with ACTUAL UNIVERSITY-SPECIFIC DATA:
- name: Full official university name (e.g., "Massachusetts Institute of Technology")
- country: Country name (e.g., "United States")
- domain: University domain (e.g., "mit.edu") - research and provide actual domain
- web_page: Full website URL (e.g., "https://www.mit.edu") - ALWAYS include this
- category: dream, target, or safe (based on user's profile strength vs university difficulty)
- cost_level: RESEARCH THE ACTUAL UNIVERSITY TUITION in rupees per year (e.g., "₹32,50,000" for MIT, "₹8,50,000" for TU Munich). Search for specific university annual costs. Use country averages ONLY as fallback if specific data cannot be found.
- acceptance_chance: RESEARCH THE ACTUAL UNIVERSITY ADMISSION RATE as percentage (e.g., "3.3%" for MIT, "6.2%" for Stanford). Search for real acceptance/admission rates. Use country averages ONLY as fallback if specific data cannot be found.
- fit_reason: 2-3 sentences explaining why this specific university matches the user's goals, profile, and preferred countries
- risks: Key challenges with specific details (e.g., "Highly competitive with 3.3% acceptance rate. Requires 170+ GRE, strong TOEFL (110+), excellent SOP, publications/research experience.")

IMPORTANT - RESEARCH ACTUAL UNIVERSITY DATA FIRST:
For EVERY university you recommend, you MUST:
1. Research the specific annual tuition cost for that university
2. Research the specific admission/acceptance rate for that university
3. Provide university-specific data, NOT generic country averages
4. Only use country defaults below if you cannot find specific university data

DEFAULT COST REFERENCE (Annual Tuition in INR - Use ONLY if specific university data unavailable):
- United States: ₹30,00,000 (~$36,000)
- United Kingdom: ₹25,00,000 (~£20,000)
- Canada: ₹18,00,000 (CAD $25,000)
- Australia: ₹20,00,000 (AUD $30,000)
- Germany: ₹6,00,000 (very low tuition)
- Netherlands: ₹12,00,000 (€12,000-15,000)
- Singapore: ₹16,00,000 (SGD $25,000-30,000)
- India: ₹2,00,000 (domestic rates)
- Ireland: ₹15,00,000 (€12,000)

DEFAULT ACCEPTANCE RATE REFERENCE (Approximate % - Use ONLY if specific university data unavailable):
- United States: 35%
- United Kingdom: 40%
- Canada: 50%
- Australia: 55%
- Germany: 75%
- Netherlands: 70%
- Singapore: 30%
- India: 80%
- Ireland: 65%

IMPORTANT INSTRUCTIONS:
1. RESEARCH FIRST: For each university, search for actual cost and acceptance rate - provide university-specific values.
2. FALLBACK ONLY: Use country defaults ONLY if you cannot find specific university data.
3. EXAMPLES: If recommending Stanford, search for Stanford's actual tuition (not USA average). If recommending TU Munich, search for TUM's actual tuition (not Germany average).
4. ALWAYS include web_page URL (full website URL starting with https://)
5. Never use placeholder values - provide specific, researched details or note if data unavailable.
6. Valid action types: shortlist_add, lock, todo_add.
7. You can have text before and after the ACTIONS block.
8. Always provide helpful advice and guidance in your response.

ACTIONS FORMAT:
ACTIONS: [{{JSON_ARRAY_HERE}}]

EXAMPLE 1 - MIT (ACTUAL SPECIFIC UNIVERSITY DATA - Research conducted):
ACTIONS: [{{"type": "shortlist_add", "name": "Massachusetts Institute of Technology", "country": "United States", "domain": "mit.edu", "web_page": "https://www.mit.edu", "category": "dream", "cost_level": "₹32,50,000", "acceptance_chance": "3.3%", "fit_reason": "World-leading institution in computer science and AI/ML research. Exceptional faculty and cutting-edge laboratories. Perfect match for your MS CS aspirations and research interest.", "risks": "Extremely competitive with 3.3% acceptance rate. Requires 170+ GRE, TOEFL 110+, strong publications or research experience, exceptional letters of recommendation, and compelling SOP."}}]

EXAMPLE 2 - TU MUNICH (ACTUAL SPECIFIC UNIVERSITY DATA - Research conducted):
ACTIONS: [{{"type": "shortlist_add", "name": "Technical University of Munich (TUM)", "country": "Germany", "domain": "tum.de", "web_page": "https://www.tum.de/en/", "category": "target", "cost_level": "₹8,50,000", "acceptance_chance": "22%", "fit_reason": "Top-ranked European university for engineering and computer science. Much lower cost than US/UK while maintaining world-class education. Strong industry partnerships and excellent placement record.", "risks": "Some programs taught in German - ensure English-taught tracks. Moderate competition (22% acceptance). Requires strong academic background and minimum B2 German proficiency for some programs."}}]

EXAMPLE 3 - UNIVERSITY OF TORONTO (ACTUAL SPECIFIC UNIVERSITY DATA - Research conducted):
ACTIONS: [{{"type": "shortlist_add", "name": "University of Toronto", "country": "Canada", "domain": "utoronto.ca", "web_page": "https://www.utoronto.ca", "category": "target", "cost_level": "₹19,50,000", "acceptance_chance": "15%", "fit_reason": "Canada's leading university with excellent CS programs. More affordable than US while maintaining top-tier quality. Good balance of competitiveness and value. Strong tech industry connections.", "risks": "Competitive admission (15% acceptance). Requires strong GRE/GMAT and TOEFL. Canadian student visa requirements apply. Program-specific GPA and test score cutoffs may apply."}}]

You must:
- Answer based on their profile and stage.
- Recommend universities matching their preferred countries and intended degree.
- Research actual university-specific costs and acceptance rates for each recommendation.
- Classify as Dream (reach), Target (fit), or Safe (likely accept) based on user's profile.
- Use researched costs in rupees and acceptance as percentages (not country averages alone).
- Always include complete web_page URLs.
- Explain strengths and gaps when relevant.
- Suggest next steps and required preparation.
- Include complete university details in every shortlist_add action.

Allowed ACTIONS: shortlist_add (all fields required including web_page), lock (shortlist_id), todo_add (title required, others optional)."""

def parse_actions(text: str) -> List[dict]:
    # Look for ACTIONS: [...] anywhere in the response, not just at the end
    match = re.search(r"ACTIONS:\s*(\[.*\])", text, re.DOTALL)
    if not match:
        print(f"[DEBUG] No ACTIONS found in response")
        return []
    try:
        actions_json = match.group(1)
        print(f"[DEBUG] Parsed ACTIONS: {actions_json}")
        return json.loads(actions_json)
    except json.JSONDecodeError as e:
        print(f"[DEBUG] Failed to parse ACTIONS JSON: {e}. Raw: {match.group(1)}")
        return []

def strip_actions_from_response(text: str) -> str:
    # Remove the ACTIONS: [...] block from anywhere in the response
    return re.sub(r"\s*ACTIONS:\s*\[.*?\]\s*", "", text, flags=re.DOTALL).strip()

def get_chat_history_for_sdk(db: Session, user_id: str, limit: int = 20) -> List[types.Content]:
    rows = (
        db.query(ChatMessage)
        .filter(ChatMessage.user_id == user_id)
        .order_by(ChatMessage.created_at.desc())
        .limit(limit)
        .all()
    )
    # The new SDK uses types.Content objects
    history = []
    for r in reversed(rows):
        role = "user" if r.role == "user" else "model"
        history.append(types.Content(role=role, parts=[types.Part.from_text(text=r.content)]))
    return history

def invoke_counsellor(
    db: Session,
    user_id: str,
    user_message: str,
    profile: Optional[Profile],
    shortlists: List[UniversityShortlist],
) -> tuple[str, List[dict]]:
    stage = get_stage(profile, len(shortlists), sum(1 for s in shortlists if s.locked))
    system_instruction = build_system_prompt(profile, shortlists, stage)
    
    # 1. Fetch history in new format
    history = get_chat_history_for_sdk(db, user_id)
    
    # 2. Add current message to history for this request
    history.append(types.Content(role="user", parts=[types.Part.from_text(text=user_message)]))

    try:
        # 3. Use the unified generate_content method
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=history,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.7
            )
        )
        
        response_text = (response.text or "").strip()
        print(f"[DEBUG] Full AI response:\n{response_text}\n")
        actions = parse_actions(response_text)
        response_text = strip_actions_from_response(response_text)
        return response_text, actions

    except Exception as e:
        print(f"Gemini API Error: {e}")
        return "I'm having trouble connecting to my AI core. Please try again in a moment.", []