from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Watchlist(Base):
    """Tracks a route the user wants price-drop alerts for.

    Note: stores source/destination directly rather than a routes_id FK —
    the V2 blueprint's `routes` table is deferred until Phase 5's price
    history job needs to aggregate by route; not needed for CRUD yet.
    """

    __tablename__ = "watchlists"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    source_city: Mapped[str] = mapped_column(String(50), nullable=False)
    destination_city: Mapped[str] = mapped_column(String(50), nullable=False)
    target_price: Mapped[float] = mapped_column(Float, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )

    user = relationship("User", back_populates="watchlists")
