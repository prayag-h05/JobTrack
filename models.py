from sqlalchemy import Column, Integer, String
from database import Base


class JobApplication(Base):
    __tablename__ = "job_applications"

    id = Column(Integer, primary_key=True, index=True)
    company = Column(String(100), nullable=False)
    role = Column(String(100), nullable=False)
    status = Column(String(50), default="Applied")
    job_link = Column(String(255), nullable=True)