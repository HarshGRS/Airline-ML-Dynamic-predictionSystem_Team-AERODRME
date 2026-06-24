from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.rate_limit import limiter
from app.core.security import get_current_user
from app.models.saved_search import SavedSearch
from app.models.user import User
from app.schemas.saved_search import SavedSearchCreate, SavedSearchResponse

router = APIRouter(prefix="/saved-searches", tags=["saved-searches"])

MAX_SAVED_SEARCHES_PER_USER = 30


@router.post("", response_model=SavedSearchResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("20/minute")
def create_saved_search(
    request: Request,
    payload: SavedSearchCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SavedSearch:
    count = db.query(SavedSearch).filter(SavedSearch.user_id == current_user.id).count()
    if count >= MAX_SAVED_SEARCHES_PER_USER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Saved search limit reached ({MAX_SAVED_SEARCHES_PER_USER}).",
        )

    saved_search = SavedSearch(
        user_id=current_user.id,
        source_city=payload.source_city.value,
        destination_city=payload.destination_city.value,
        flight_class=payload.flight_class.value,
    )
    db.add(saved_search)
    db.commit()
    db.refresh(saved_search)
    return saved_search


@router.get("", response_model=list[SavedSearchResponse])
def list_saved_searches(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> list[SavedSearch]:
    return db.query(SavedSearch).filter(SavedSearch.user_id == current_user.id).all()


@router.delete("/{search_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_saved_search(
    search_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    saved_search = (
        db.query(SavedSearch)
        .filter(SavedSearch.id == search_id, SavedSearch.user_id == current_user.id)
        .first()
    )
    if saved_search is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Saved search not found")
    db.delete(saved_search)
    db.commit()
