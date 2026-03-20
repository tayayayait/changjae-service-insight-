from kerykeion import AstrologicalSubjectFactory
from kerykeion.charts.synastry_chart import SynastryChart
from kerykeion.synastry_aspects import SynastryAspects

sub1 = AstrologicalSubjectFactory.from_birth_data("Person1", 1990, 5, 15, 14, 30, "Asia/Seoul")
sub2 = AstrologicalSubjectFactory.from_birth_data("Person2", 1992, 8, 20, 10, 0, "Asia/Seoul")

# Test synastry aspects
aspects = SynastryAspects(sub1, sub2)
aspect_list = aspects.get_relevant_aspects()
print("Synastry Aspects Count:", len(aspect_list))

# Test SVG chart Generation
chart = SynastryChart(sub1, sub2, remove_css_variables=True)
svg = chart.make_svg()
print("SVG Generated:", len(svg) > 100)
