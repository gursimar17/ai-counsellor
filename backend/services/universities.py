"""Fetch universities from Hipolabs API and enrich with cost/acceptance logic."""
import httpx
from typing import List, Optional

HIPOLABS_URL = "http://universities.hipolabs.com/search"

# Average annual tuition in INR for different countries
COUNTRY_COSTS = {
    "United States": 3000000,  # ~$36,000 USD
    "United Kingdom": 2500000,  # ~£20,000
    "Canada": 1800000,  # CAD $25,000
    "Australia": 2000000,  # AUD $30,000
    "Germany": 600000,  # Low tuition
    "Netherlands": 1200000,  # €12,000-15,000
    "Singapore": 1600000,  # SGD $25,000-30,000
    "India": 200000,  # Lower cost
    "Ireland": 1500000,  # €12,000
}

# Acceptance rates by country (simplified percentages)
COUNTRY_ACCEPTANCE = {
    "United States": 35,
    "United Kingdom": 40,
    "Canada": 50,
    "Australia": 55,
    "Germany": 75,
    "Netherlands": 70,
    "Singapore": 30,
    "India": 80,
    "Ireland": 65,
}


async def fetch_universities(country: Optional[str] = None, name: Optional[str] = None) -> List[dict]:
    params = {}
    if country:
        params["country"] = country
    if name:
        params["name"] = name
    
    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(30.0)) as client:
            print(f"[DEBUG] Fetching universities with params: {params}")
            r = await client.get(HIPOLABS_URL, params=params or None)
            r.raise_for_status()
            data = r.json()
            print(f"[DEBUG] Received {len(data)} universities from API for {country}")
    except Exception as e:
        print(f"[DEBUG] Error fetching from Hipolabs API: {e}. Returning empty list.")
        return []  # Graceful fallback on API error
    
    # Limit for prototype
    out = []
    seen = set()
    for u in (data or [])[:80]:
        name_val = (u.get("name") or "").strip()
        country_val = (u.get("country") or "").strip()
        key = (name_val, country_val)
        if key in seen or not name_val:
            continue
        seen.add(key)
        
        # Get actual costs and acceptance rates
        cost_inr = COUNTRY_COSTS.get(country_val, 1000000)  # Default to 10 lakhs
        acceptance_pct = COUNTRY_ACCEPTANCE.get(country_val, 50)  # Default to 50%
        
        out.append({
            "name": name_val,
            "country": country_val,
            "domain": u.get("domains", [None])[0] if u.get("domains") else None,
            "web_page": u.get("web_pages", [None])[0] if u.get("web_pages") else None,
            "cost_level": f"₹{cost_inr:,.0f}",  # Format with rupee symbol
            "acceptance_chance": f"{acceptance_pct}%",
            "fit_reason": f"Matches preferred country ({country_val}). Average annual tuition: ₹{cost_inr:,.0f}.",
            "risks": f"Acceptance rate approximately {acceptance_pct}%. Ensure strong profile and SOP.",
        })
    return out


def _cost_level(country: str) -> str:
    # Kept for backward compatibility, returns actual cost now
    return f"₹{COUNTRY_COSTS.get(country, 1000000):,.0f}"


def _acceptance_level(country: str, name: str) -> str:
    # Kept for backward compatibility, returns percentage
    return f"{COUNTRY_ACCEPTANCE.get(country, 50)}%"
