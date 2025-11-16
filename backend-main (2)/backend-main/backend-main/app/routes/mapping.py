# app/routes/mapping.py

from fastapi import APIRouter, Query, Header, Depends, HTTPException
import pandas as pd
from app.models import ConceptMap, ConceptMapMapping
from app.routes.abha import verify_token, save_translation_history_helper  # correct import
from typing import Optional

router = APIRouter()

# Load the combined mapping CSV (with SNOMED CT and LOINC)
map_df = pd.read_csv("app/data/combined_namaste_icd_snomed_loinc.csv")

@router.get("/translate", response_model=ConceptMap)
def translate_code(
    system: str = Query(..., description="Source system (NAM or TM2)"),
    code: str = Query(..., description="Code to translate"),
    save_history: bool = Query(False, description="Whether to save this lookup to user history"),
    authorization: Optional[str] = Header(None, description="Bearer <token> header")
):
    """Bidirectional translational system for NAMASTE, ICD11_TM2, SNOMED CT, and LOINC"""
    system = system.upper().strip()
    code = code.strip()

    if system == "NAM":
        matches = map_df[map_df["source_code"] == code]
    elif system == "TM2":
        matches = map_df[map_df["target_code"] == code]
    else:
        raise HTTPException(status_code=400, detail="Unsupported system. Use NAM or TM2.")

    mappings = []
    for _, row in matches.iterrows():
        # Determine source/target for model fields
        src = row["source_code"] if system == "NAM" else row["target_code"]
        tgt = row["target_code"] if system == "NAM" else row["source_code"]

        mappings.append(
            ConceptMapMapping(
                source_code=src,
                target_code=tgt,
                relationship=row["relationship"],
                snomed_ct_code=str(row["snomed_ct_code"]),
                loinc_code=str(row["loinc_code"]),
            )
        )

    result = ConceptMap(
        resourceType="ConceptMap",
        id="ConceptMap",
        name="NAMASTE-ICD11-SNOMED-LOINC Map",
        mappings=mappings
    )

    # Optionally save history if user provided a valid Bearer token
    if save_history and authorization:
        try:
            abha_id = verify_token(authorization)
            # Save all mappings to history
            for mapping in mappings:
                save_translation_history_helper(
                    translation_data={
                        "source_system": system,
                        "source_code": mapping.source_code,
                        "target_system": "ICD11_TM2" if system == "NAM" else "NAMASTE",
                        "target_code": mapping.target_code,
                        "snomed_ct_code": mapping.snomed_ct_code,
                        "loinc_code": mapping.loinc_code
                    },
                    abha_id=abha_id
                )
        except Exception as e:
            # If token is invalid or saving fails, we ignore to still return the mapping
            print(f"Failed to save history: {e}")
            pass

    return result
