from fastapi import APIRouter

router = APIRouter()

@router.get("/test")
def test_icd():
    return {"message": "ICD route working"}
