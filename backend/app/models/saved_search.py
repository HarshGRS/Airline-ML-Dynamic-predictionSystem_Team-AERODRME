from datetime import date, datetime, timezone

from sqlalchemy import Date, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class SavedSearch(Base):
    """A saved Predict-page query — enough fields to re-run /predict without
    the user re-entering anything, not just a bookmarked route pair.
    """

    __tablename__ = "saved_searches"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    source_city: Mapped[str] = mapped_column(String(50), nullable=False)
    destination_city: Mapped[str] = mapped_column(String(50), nullable=False)
    flight_class: Mapped[str] = mapped_column(String(20), default="Economy", nullable=False)
    airline: Mapped[str] = mapped_column(String(20), nullable=False)
    departure_time: Mapped[str] = mapped_column(String(20), nullable=False)
    arrival_time: Mapped[str] = mapped_column(String(20), nullable=False)
    stops: Mapped[str] = mapped_column(String(20), nullable=False)
    departure_date: Mapped[date] = mapped_column(Date, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )

    user = relationship("User", back_populates="saved_searches")
