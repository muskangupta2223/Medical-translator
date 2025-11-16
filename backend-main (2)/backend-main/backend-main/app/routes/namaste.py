from fastapi import APIRouter, Query
import pandas as pd
from app.models import CodeSystem, CodeSystemConcept

router = APIRouter()

namaste_df = pd.read_csv("app/data/namaste_mock_data.csv")

@router.get("/namaste/search")
def search_namaste(query: str = Query(..., min_length=1)):
    """Autocomplete search for NAMASTE terms by code or vice-versa"""
    query_lower = query.lower()
    results = namaste_df[namaste_df['display'].str.contains(query_lower, case=False, na=False) |
                         namaste_df['code'].str.contains(query_lower, case=False, na=False)]
    concepts = [
        CodeSystemConcept(
            code = row['code'],
            display = row['display'],
            definition = row.get('definition', None)
        )
        for _, row, in results.iterrows()
    ]
    return {"resourceType": "CodeSystem", "concepts": concepts}