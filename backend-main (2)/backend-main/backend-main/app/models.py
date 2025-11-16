from sqlalchemy import Column, String, Integer
from app.database import Base
from pydantic import BaseModel
from typing import List, Optional

# SQLAlchemy ORM model for User (e.g., ABHA user)
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)

# Pydantic models for API serialization and validation

class CodeSystemConcept(BaseModel):
    code: str
    display: str
    definition: Optional[str] = None

class CodeSystem(BaseModel):
    resourceType: str = "CodeSystem"
    id: str
    name: str
    concept: List[CodeSystemConcept]

class ConceptMapMapping(BaseModel):
    source_code: str
    target_code: str
    relationship: str
    snomed_ct_code: str
    loinc_code: str

class ConceptMap(BaseModel):
    resourceType: str = "ConceptMap"
    id: str
    name: str
    mappings: List[ConceptMapMapping]

class ABHAUser(BaseModel):
    abha_id: str
    name: str
    email: str
    phone: str
    dob: str
    gender: str
    address: str
    created_at: str

class ABHALogin(BaseModel):
    abha_id: str
    phone: str

class ABHALoginResponse(BaseModel):
    message: str
    abha_user: Optional[ABHAUser] = None
    access_token: Optional[str] = None

class TranslationHistory(BaseModel):
    id: str
    abha_id: str
    source_system: str
    source_code: str
    target_system: str
    target_code: str
    snomed_ct_code: str
    loinc_code: str
    timestamp: str
