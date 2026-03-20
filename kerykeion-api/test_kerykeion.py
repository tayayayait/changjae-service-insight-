import json
from kerykeion import AstrologicalSubjectFactory
from kerykeion.chart_data_factory import ChartDataFactory

subject = AstrologicalSubjectFactory.from_birth_data(
    "Test User", 
    1990, 
    5, 
    15, 
    14, 
    30, 
    lng=126.9780, 
    lat=37.5665, 
    tz_str="Asia/Seoul", 
    online=False
)

chart_data = ChartDataFactory.create_natal_chart_data(subject)
print("Planets List:", chart_data.planets_list[:2])
# Aspect object structure
aspects = chart_data.aspects_list
print("Aspects Count:", len(aspects))
if len(aspects) > 0:
    print("Example Aspect:", aspects[0])
