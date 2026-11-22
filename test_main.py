import pytest

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from main import app, get_db
from database import Base
import models
client = TestClient(app)

test_engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)

TestingSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=test_engine
)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_test_database():
    Base.metadata.create_all(bind=test_engine)

    yield

    Base.metadata.drop_all(bind=test_engine)


def test_home():
    response = client.get("/")

    assert response.status_code == 200
    assert response.json() == {
        "message": "Welcome to Job Application Tracker!"
    }


def test_get_jobs():
    response = client.get("/jobs")

    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_job_stats():
    response = client.get("/jobs/stats")

    assert response.status_code == 200

    data = response.json()

    assert "total_applications" in data
    assert "applied" in data
    assert "interviews" in data
    assert "rejected" in data
    assert "offers" in data

def test_create_job():
    response = client.post(
        "/jobs",
        json={
            "company": "Test Company",
            "role": "Python Developer",
            "status": "Applied",
            "job_link": "https://example.com/jobs/123"
        }
    )

    assert response.status_code == 200
    data = response.json()

    assert data["company"] == "Test Company"
    assert data["role"] == "Python Developer"
    assert data["status"] == "Applied"
    assert "id" in data


def test_delete_job():
    create_response = client.post(
        "/jobs",
        json={
            "company": "Delete Test Company",
            "role": "Backend Developer",
            "status": "Applied"
        }
    )

    job_id = create_response.json()["id"]

    delete_response = client.delete(f"/jobs/{job_id}")

    assert delete_response.status_code == 200

    get_response = client.get(f"/jobs/{job_id}")

    assert get_response.status_code == 404

def test_create_job_with_invalid_data():
    response = client.post(
        "/jobs",
        json={
            "company": "T",
            "role": "Python Developer",
            "status": "Applied"
        }
    )

    assert response.status_code == 422


def test_get_nonexistent_job():
    response = client.get("/jobs/99999")

    assert response.status_code == 404
    assert response.json() == {
        "detail": "Job not found"
    }