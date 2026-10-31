from bson import ObjectId

from news import personalization
from news.tests.test_personalization import article as ranking_article
from news.tests.test_personalization import profile

CITY = ObjectId("670000000000000000000011")
COUNTRY = ObjectId("670000000000000000000012")
OTHER_COUNTRY = ObjectId("670000000000000000000013")
LOCATIONS = [
    {"_id": CITY, "countryCode": "GT", "level": "city"},
    {"_id": COUNTRY, "countryCode": "GT", "level": "country"},
    {"_id": OTHER_COUNTRY, "countryCode": "MX", "level": "country"},
]


def article(*args, **kwargs):
    return ranking_article(*args, **kwargs) | {"status": "published"}


def test_territory_coverage_ignores_topic_preferences_and_the_fifty_article_limit():
    focused = profile(
        location=CITY, topics=["tecnologia"], interests=[("tecnologia", 1)]
    )
    local = article("local", level="city", location_ids=[CITY])
    national = article("national", days_ago=1, location_ids=[COUNTRY], topics=["salud"])
    international = article(
        "world", days_ago=2, level="international", topics=["seguridad"]
    )
    documents = [local, national, international] + [
        article(
            f"affinity-{i}",
            days_ago=3,
            topics=["tecnologia"],
            level="city",
            location_ids=[CITY],
        )
        for i in range(60)
    ]
    coverage = personalization.select_coverage(documents, focused, LOCATIONS)
    assert coverage == {
        "local": local,
        "national": national,
        "international": international,
    }


def test_coverage_excludes_drafts_and_reports_missing_territory_instead_of_inventing_it():
    draft = article("draft", level="international") | {"status": "draft"}
    mexico = article("mexico", location_ids=[OTHER_COUNTRY])
    coverage = personalization.select_coverage(
        [draft, mexico], profile(location=CITY), LOCATIONS
    )
    assert coverage == {"local": None, "national": None, "international": None}


def test_country_selection_does_not_mislabel_national_news_as_local():
    national = article("national", location_ids=[COUNTRY])
    coverage = personalization.select_coverage(
        [national], profile(location=COUNTRY), LOCATIONS
    )
    assert coverage["local"] is None
    assert coverage["national"] == national
