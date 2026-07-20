from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.rate_limit import limiter
from app.core.security import get_current_user
from app.models.user import User
from app.models.watchlist import Watchlist
from app.schemas.watchlist import WatchlistCreate, WatchlistResponse

router = APIRouter(prefix="/watchlists", tags=["watchlists"])

MAX_WATCHLISTS_PER_USER = 20


@router.post("", response_model=WatchlistResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("20/minute")
def create_watchlist(
    request: Request,
    payload: WatchlistCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Watchlist:
    count = db.query(Watchlist).filter(Watchlist.user_id == current_user.id).count()
    if count >= MAX_WATCHLISTS_PER_USER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Watchlist limit reached ({MAX_WATCHLISTS_PER_USER}). Delete one before adding another.",
        )

    watchlist = Watchlist(
        user_id=current_user.id,
        source_city=payload.source_city.value,
        destination_city=payload.destination_city.value,
        target_price=payload.target_price,
    )
    db.add(watchlist)
    db.commit()
    db.refresh(watchlist)
    return watchlist


@router.get("", response_model=list[WatchlistResponse])
def list_watchlists(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> list[Watchlist]:
    return db.query(Watchlist).filter(Watchlist.user_id == current_user.id).all()


@router.delete("/{watchlist_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_watchlist(
    watchlist_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    watchlist = (
        db.query(Watchlist)
        .filter(Watchlist.id == watchlist_id, Watchlist.user_id == current_user.id)
        .first()
    )
    if watchlist is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Watchlist not found")
    db.delete(watchlist)
    db.commit()
