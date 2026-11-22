from fastapi import FastAPI, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field, HttpUrl
from typing import Optional, Literal
from fastapi.middleware.cors import CORSMiddleware

from database import SessionLocal
from database import engine, Base
import models

app = FastAPI(title="Job Application Tracker")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {
        "message": "Welcome to Job Application Tracker!"
    }

Base.metadata.create_all(bind=engine)


# Database session dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Request data validation
class JobCreate(BaseModel):
    company: str = Field(min_length=2, max_length=100)
    role: str = Field(min_length=2, max_length=100)

    status: Literal[
        "Applied",
        "Interview",
        "Rejected",
        "Offered"
    ] = "Applied"

    job_link: Optional[HttpUrl] = None

class JobResponse(BaseModel):
    id: int
    company: str
    role: str
    status: str
    job_link: Optional[HttpUrl] = None

    model_config = {"from_attributes": True}

# Create a job application
@app.post("/jobs", response_model=JobResponse)
def create_job(job: JobCreate, db: Session = Depends(get_db)):
    new_job = models.JobApplication(
        company=job.company,
        role=job.role,
        status=job.status,
        job_link=str(job.job_link) if job.job_link else None
    )

    db.add(new_job)
    db.commit()
    db.refresh(new_job)

    return new_job


# Get all job applications
@app.get("/jobs", response_model=list[JobResponse])
def get_jobs(
    status: Optional[str] = None,
    company: Optional[str] = None,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(models.JobApplication)

    if status:
        query = query.filter(
            models.JobApplication.status == status
        )

    if company:
        query = query.filter(
            models.JobApplication.company.ilike(f"%{company}%")
        )

    return query.offset(skip).limit(limit).all()

@app.get("/jobs/stats")
def get_job_stats(db: Session = Depends(get_db)):
    total_jobs = db.query(models.JobApplication).count()

    applied = db.query(models.JobApplication).filter(
        models.JobApplication.status == "Applied"
    ).count()

    interviews = db.query(models.JobApplication).filter(
        models.JobApplication.status == "Interview"
    ).count()

    rejected = db.query(models.JobApplication).filter(
        models.JobApplication.status == "Rejected"
    ).count()

    offered = db.query(models.JobApplication).filter(
        models.JobApplication.status == "Offered"
    ).count()

    return {
        "total_applications": total_jobs,
        "applied": applied,
        "interviews": interviews,
        "rejected": rejected,
        "offers": offered
    }

# Get a job application by ID
@app.get("/jobs/{job_id}", response_model=JobResponse)
def get_job(job_id: int, db: Session = Depends(get_db)):
    job = db.query(models.JobApplication).filter(
        models.JobApplication.id == job_id
    ).first()

    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")

    return job

@app.put("/jobs/{job_id}", response_model=JobResponse)
def update_job(
    job_id: int,
    updated_data: JobCreate,
    db: Session = Depends(get_db)
):
    job = db.query(models.JobApplication).filter(
        models.JobApplication.id == job_id
    ).first()

    if job is None:
        raise HTTPException(
            status_code=404,
            detail="Job not found"
        )

    job.company = updated_data.company
    job.role = updated_data.role
    job.status = updated_data.status
    job.job_link = (
    str(updated_data.job_link)
    if updated_data.job_link
    else None
)

    db.commit()
    db.refresh(job)

    return job

@app.delete("/jobs/{job_id}")
def delete_job(
    job_id: int,
    db: Session = Depends(get_db)
):
    job = db.query(models.JobApplication).filter(
        models.JobApplication.id == job_id
    ).first()

    if job is None:
        raise HTTPException(
            status_code=404,
            detail="Job not found"
        )

    db.delete(job)
    db.commit()

    return {
        "message": "Job application deleted successfully"
    }

