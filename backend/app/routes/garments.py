from fastapi import APIRouter
from app.utils.gender_garments import get_garments_for_gender

router = APIRouter()

@router.get("/")
def garments(gender: str):
    return get_garments_for_gender(gender)