from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import namaste, icd, mapping, abha  # ← Add abha import

from app.database import engine
from app import models

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="NAMASTE ↔ ICD11 FHIR API")

# Add CORS middleware to allow frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to the NAMASTE ↔ ICD11 FHIR API"}

app.include_router(namaste.router, prefix="/namaste", tags=["NAMASTE"])
app.include_router(icd.router, prefix="/icd", tags=["ICD-11"])
app.include_router(mapping.router, prefix="/mapping", tags=["Mapping"])
app.include_router(abha.router, prefix="/abha", tags=["ABHA"])       # ← Include ABHA routes

