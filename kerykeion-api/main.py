from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Optional
from pathlib import Path
from kerykeion import AstrologicalSubjectFactory
from kerykeion.chart_data_factory import ChartDataFactory
from kerykeion.charts.chart_drawer import ChartDrawer
import json
import os
from dotenv import load_dotenv

# Import services
from services.palm_service import PalmService
from services.astrology_ai_service import astrology_ai_service

# Load environment variables
load_dotenv(dotenv_path="../.env")

app = FastAPI(title="Astrology (Kerykeion) API")

# Initialize PalmService
# Note: GEMINI_API_KEY is loaded from .env
palm_service = PalmService(
    model_path="results/best_model.pth", 
    api_key=os.getenv("GEMINI_API_KEY")
)

PALM_ERROR_STATUS: Dict[str, int] = {
    "PALM_INPUT_INVALID": 400,
    "PALM_QUALITY_LOW": 422,
    "PALM_ANALYSIS_TIMEOUT": 504,
    "PALM_BACKEND_UNAVAILABLE": 503,
}

# Load Interpretations
INTERPRETATION_FILE = Path(__file__).parent / "data" / "interpretations.json"
try:
    with open(INTERPRETATION_FILE, "r", encoding="utf-8") as f:
        interpretations = json.load(f)
except Exception:
    interpretations = {"planets": {}, "signs": {}, "houses": {}, "aspects": {}}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class BirthDataRequest(BaseModel):
    name: str = "User"
    year: int
    month: int
    day: int
    hour: int
    minute: int
    city: Optional[str] = "Seoul"
    nation: Optional[str] = "KR"
    lng: Optional[float] = 126.9780
    lat: Optional[float] = 37.5665
    tz_str: Optional[str] = "Asia/Seoul"

@app.get("/")
def read_root():
    return {"message": "Kerykeion Astrology API is running"}

def map_interpretations(planet_name, sign_name, house_num=None, aspect_type=None):
    # Mapping helper
    p_data = interpretations.get("planets", {}).get(planet_name, {})
    s_data = interpretations.get("signs", {}).get(sign_name, {})
    return p_data, s_data

@app.post("/api/chart/birth")
def generate_birth_chart(req: BirthDataRequest):
    try:
        # 1. Create subject
        subject = AstrologicalSubjectFactory.from_birth_data(
            req.name, 
            req.year, 
            req.month, 
            req.day, 
            req.hour, 
            req.minute, 
            lng=req.lng, 
            lat=req.lat, 
            tz_str=req.tz_str, 
            online=False # Use offline calculation
        )

        # 2. Extract Data (Raw)
        subject_data = json.loads(subject.model_dump_json())
        
        # 3. Pre-compute chart data and extract detailed stats
        chart_data = ChartDataFactory.create_natal_chart_data(subject)
        
        # 4. Generate SVG Visualization
        chart_drawer = ChartDrawer(chart_data=chart_data, remove_css_variables=True)
        svg_content = chart_drawer.make_svg()

        # Build Enriched Result object
        # Process planets
        planet_list = []
        for p in chart_data.planets_list:
            p_dict = p.model_dump()
            p_data, s_data = map_interpretations(p.name, p.sign)
            
            planet_list.append({
                "name": p.name,
                "nameKo": p_data.get("ko", p.name),
                "sign": p.sign,
                "signKo": s_data.get("ko", p.sign),
                "element": s_data.get("element", p.element),
                "quality": s_data.get("quality", p.quality),
                "house": getattr(p, "house", None) or subject_data.get(p.name.lower(), {}).get("house", 0) if p.name.lower() in subject_data else 0,
                "degree": p.position,
                "retrograde": p.retrograde,
                "interpretation": f"행성 자체의 의미: {p_data.get('desc', '')}. 이곳에서는 {s_data.get('desc', '')} 기운을 발휘합니다."
            })
        
        # Big 3 Summary
        def get_planet(name):
            return next((x for x in planet_list if x["name"] == name), {})
        
        asc = getattr(subject, "first_house", None)
        asc_sign = asc.sign if asc else "Aries"
        _, asc_s_data = map_interpretations("Ascendant", asc_sign)
        
        big3 = {
            "sun": get_planet("Sun"),
            "moon": get_planet("Moon"),
            "rising": {
                "sign": asc_sign,
                "signKo": asc_s_data.get("ko", asc_sign),
                "element": asc_s_data.get("element", "Fire"),
                "quality": asc_s_data.get("quality", "Cardinal"),
                "degree": asc.position if asc else 0,
                "interpretation": f"{asc_s_data.get('desc', '')} 특징이 첫인상으로 드러납니다."
            }
        }
        
        # Element & Quality Distribution
        e_dist = {"fire": 0, "earth": 0, "air": 0, "water": 0}
        q_dist = {"cardinal": 0, "fixed": 0, "mutable": 0}
        for p in planet_list:
            el = p.get("element", "").lower()
            qu = p.get("quality", "").lower()
            if el in e_dist: e_dist[el] += 1
            if qu in q_dist: q_dist[qu] += 1
            
        # Houses
        house_list = []
        for idx, h in enumerate(chart_data.houses_list):
            h_data = interpretations.get("houses", {}).get(str(idx+1), {})
            _, hs_data = map_interpretations("House", h.sign)
            house_list.append({
                "number": idx + 1,
                "sign": h.sign,
                "signKo": hs_data.get("ko", h.sign),
                "degree": h.position,
                "theme": h_data.get("theme", ""),
                "themeDescription": h_data.get("desc", "")
            })
            
        # Aspects
        aspect_list = []
        for a in chart_data.aspects_list:
            if a.aspect not in ["Conjunction", "Sextile", "Square", "Trine", "Opposition"]:
                continue
            a_data = interpretations.get("aspects", {}).get(a.aspect, {})
            p1_data, _ = map_interpretations(a.p1_name, "Aries")
            p2_data, _ = map_interpretations(a.p2_name, "Aries")
            
            aspect_list.append({
                "planet1": a.p1_name,
                "planet2": a.p2_name,
                "planet1Ko": p1_data.get("ko", a.p1_name),
                "planet2Ko": p2_data.get("ko", a.p2_name),
                "aspectType": a.aspect,
                "aspectTypeKo": a_data.get("ko", a.aspect),
                "orb": float(a.orb),
                "influence": a_data.get("influence", "neutral"),
                "interpretation": a_data.get("desc", "")
            })

        return {
            "success": True,
            "data": subject_data, # Return old format for fallback
            "big3": big3,
            "planets": planet_list,
            "houses": house_list,
            "aspects": aspect_list,
            "elementDistribution": e_dist,
            "qualityDistribution": q_dist,
            "chartSvg": svg_content
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

def _raise_palm_error(error_obj):
    if isinstance(error_obj, dict):
        code = error_obj.get("code", "PALM_BACKEND_UNAVAILABLE")
        message = error_obj.get("message", "Palm analysis failed.")
        quality = error_obj.get("quality")
    else:
        code = "PALM_BACKEND_UNAVAILABLE"
        message = str(error_obj)
        quality = None

    detail = {
        "code": code,
        "message": message,
    }
    if quality is not None:
        detail["quality"] = quality

    raise HTTPException(status_code=PALM_ERROR_STATUS.get(code, 503), detail=detail)


async def _analyze_palm_payload(file: UploadFile):
    try:
        contents = await file.read()
        result = palm_service.analyze_palm(contents)
        if isinstance(result, dict) and "error" in result:
            _raise_palm_error(result["error"])
        return {
            "success": True,
            "result": result,
        }
    except HTTPException:
        raise
    except Exception:
        _raise_palm_error({"code": "PALM_BACKEND_UNAVAILABLE", "message": "Palm service failed unexpectedly."})


@app.post("/api/palm-analyze")
async def analyze_palm_legacy(file: UploadFile = File(...)):
    return await _analyze_palm_payload(file)


@app.post("/api/palm/analyze")
async def analyze_palm(file: UploadFile = File(...)):
    return await _analyze_palm_payload(file)


@app.get("/api/palm-health")
def palm_health():
    return {
        "success": True,
        "status": palm_service.health_status(),
    }

class SynastryRequest(BaseModel):
    p1: BirthDataRequest
    p2: BirthDataRequest

@app.post("/api/chart/synastry")
def generate_synastry_chart(req: SynastryRequest):
    try:
        sub1 = AstrologicalSubjectFactory.from_birth_data(
            req.p1.name, req.p1.year, req.p1.month, req.p1.day, req.p1.hour, req.p1.minute, 
            lng=req.p1.lng, lat=req.p1.lat, tz_str=req.p1.tz_str, online=False
        )
        sub2 = AstrologicalSubjectFactory.from_birth_data(
            req.p2.name, req.p2.year, req.p2.month, req.p2.day, req.p2.hour, req.p2.minute, 
            lng=req.p2.lng, lat=req.p2.lat, tz_str=req.p2.tz_str, online=False
        )

        try:
            from kerykeion.charts.synastry_chart_drawer import SynastryChartDrawer
            chart_data = ChartDataFactory.create_synastry_chart_data(sub1, sub2)
            drawer = SynastryChartDrawer(chart_data=chart_data, remove_css_variables=True)
            svg_content = drawer.make_svg()
            aspects_list = chart_data.aspects_list # Has p1_name, p2_name, aspect, orb
        except Exception:
            # Fallback for older kerykeion versions
            from kerykeion import SynastryAspects
            try:
                from kerykeion.charts.synastry_chart import SynastryChart
                chart = SynastryChart(sub1, sub2, remove_css_variables=True)
                svg_content = chart.make_svg()
            except Exception:
                svg_content = ""
            SynAspects = SynastryAspects(sub1, sub2)
            aspects_list = SynAspects.get_relevant_aspects()

        # Convert aspects to dicts
        mapped_aspects = []
        for a in aspects_list:
            aspect_name = getattr(a, 'aspect', getattr(a, 'name', ''))
            if aspect_name not in ["Conjunction", "Sextile", "Square", "Trine", "Opposition"]:
                continue
            
            p1_name = getattr(a, 'p1_name', 'Unknown')
            p2_name = getattr(a, 'p2_name', 'Unknown')
            
            a_data = interpretations.get("aspects", {}).get(aspect_name, {})
            p1_data, _ = map_interpretations(p1_name, "Aries")
            p2_data, _ = map_interpretations(p2_name, "Aries")
            
            orb = float(getattr(a, 'orb', 0.0))
            
            mapped_aspects.append({
                "planet1": p1_name,
                "planet2": p2_name,
                "planet1Ko": p1_data.get("ko", p1_name),
                "planet2Ko": p2_data.get("ko", p2_name),
                "aspectType": aspect_name,
                "aspectTypeKo": a_data.get("ko", aspect_name),
                "orb": orb,
                "influence": a_data.get("influence", "neutral"),
                "interpretation": a_data.get("desc", "")
            })

        # Basic scores
        positive = sum(1 for a in mapped_aspects if a["influence"] == "positive")
        negative = sum(1 for a in mapped_aspects if a["influence"] == "negative")
        total = max(1, len(mapped_aspects))
        score = int((positive / total) * 100)

        return {
            "success": True,
            "data": {
                "score": score,
                "summary": f"{req.p1.name}님과 {req.p2.name}님의 궁합은 전반적으로 {'매우 좋습니다' if score>70 else '노력이 필요합니다.'}",
                "positiveCount": positive,
                "negativeCount": negative,
            },
            "aspects": mapped_aspects,
            "chartSvg": svg_content
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# ---------- Pydantic Models for AI ----------

class BirthAIRequest(BaseModel):
    name: str
    big3: dict

class SynastryAIRequest(BaseModel):
    p1_name: str
    p2_name: str
    score: int
    positive_count: int
    negative_count: int
    aspects: list

class TransitAIRequest(BaseModel):
    name: str
    transits: list

class CalendarAIRequest(BaseModel):
    year: int
    month: int

class SunSignRequest(BaseModel):
    sign: str

# ---------- Today's Horoscope (Sun Sign) API Endpoint ----------

@app.post("/api/chart/today")
def generate_today_horoscope(req: SunSignRequest):
    try:
        report = astrology_ai_service.generate_daily_horoscope(req.sign)
        return {
            "success": True,
            "data": {
                "sign": req.sign,
                "horoscope": report
            }
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# ---------- Transit API Endpoint ----------

@app.post("/api/chart/transit")
def generate_transit_chart(req: BirthDataRequest):
    try:
        from datetime import datetime
        now = datetime.now()
        
        # User's natal chart
        natal = AstrologicalSubjectFactory.from_birth_data(
            req.name, req.year, req.month, req.day, req.hour, req.minute, 
            lng=req.lng, lat=req.lat, tz_str=req.tz_str, online=False
        )
        
        # Today's chart at same location
        transit = AstrologicalSubjectFactory.from_birth_data(
            "오늘의 우주", now.year, now.month, now.day, now.hour, now.minute, 
            lng=req.lng, lat=req.lat, tz_str=req.tz_str, online=False
        )

        try:
            from kerykeion.charts.synastry_chart_drawer import SynastryChartDrawer
            chart_data = ChartDataFactory.create_synastry_chart_data(natal, transit)
            drawer = SynastryChartDrawer(chart_data=chart_data, remove_css_variables=True)
            svg_content = drawer.make_svg()
            aspects_list = chart_data.aspects_list
        except Exception:
            from kerykeion import SynastryAspects
            SynAspects = SynastryAspects(natal, transit)
            aspects_list = SynAspects.get_relevant_aspects()
            try:
                from kerykeion.charts.synastry_chart import SynastryChart
                chart = SynastryChart(natal, transit, remove_css_variables=True)
                svg_content = chart.make_svg()
            except Exception:
                svg_content = ""

        # Find significant transits (focusing on outer planets or important aspects)
        mapped_transits = []
        for a in aspects_list:
            aspect_name = getattr(a, 'aspect', getattr(a, 'name', ''))
            if aspect_name not in ["Conjunction", "Sextile", "Square", "Trine", "Opposition"]:
                continue
            
            p1_name = getattr(a, 'p1_name', 'Unknown') # Natal
            p2_name = getattr(a, 'p2_name', 'Unknown') # Transit
            
            p1_data, _ = map_interpretations(p1_name, "Aries")
            p2_data, _ = map_interpretations(p2_name, "Aries")
            a_data = interpretations.get("aspects", {}).get(aspect_name, {})
            
            orb = float(getattr(a, 'orb', 0.0))
            if orb > 5.0: # Keep tight orbs for daily transit
                continue
                
            mapped_transits.append({
                "natalPlanet": p1_name,
                "transitPlanet": p2_name,
                "natalKo": p1_data.get("ko", p1_name),
                "transitKo": p2_data.get("ko", p2_name),
                "aspectType": aspect_name,
                "aspectTypeKo": a_data.get("ko", aspect_name),
                "influence": a_data.get("influence", "neutral"),
                "interpretation": f"현재 우주를 지나는 {p2_data.get('ko', p2_name)} 에너지가 당신의 타고난 {p1_data.get('ko', p1_name)}에 {a_data.get('ko', aspect_name)} 각도로 영향을 미치고 있습니다. {a_data.get('desc', '')}"
            })

        summary = "오늘 우주의 기운이 당신의 타고난 별자리와 강하게 상호작용하고 있습니다."
        if any(t["influence"] == "negative" for t in mapped_transits):
            summary = "오늘은 다소 긴장된 별의 흐름이 보입니다. 무리한 결정은 잠시 미루세요."
        elif any(t["influence"] == "positive" for t in mapped_transits):
            summary = "조화와 긍정의 기운이 가득한 특별한 하루입니다. 새로운 도전을 하기에 좋아요!"

        return {
            "success": True,
            "data": {
                "summary": summary,
                "date": now.strftime("%Y년 %m월 %d일")
            },
            "transits": mapped_transits,
            "chartSvg": svg_content
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# ---------- AI Interpretation API Endpoints ----------

@app.post("/api/chart/ai/birth")
def generate_birth_ai(req: BirthAIRequest):
    try:
        report = astrology_ai_service.generate_natal_reading(req.name, req.big3)
        return {"success": True, "report": report}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chart/ai/synastry")
def generate_synastry_ai(req: SynastryAIRequest):
    try:
        report = astrology_ai_service.generate_synastry_reading(
            req.p1_name, req.p2_name, req.score, req.positive_count, req.negative_count, req.aspects
        )
        return {"success": True, "report": report}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chart/ai/transit")
def generate_transit_ai(req: TransitAIRequest):
    try:
        report = astrology_ai_service.generate_transit_reading(req.name, req.transits)
        return {"success": True, "report": report}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chart/ai/calendar")
def generate_calendar_ai(req: CalendarAIRequest):
    try:
        report = astrology_ai_service.generate_cosmic_calendar(req.year, req.month)
        return {"success": True, "report": report}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
