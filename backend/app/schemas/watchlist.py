from datetime import datetime

from pydantic import BaseModel, Field, field_validator

from app.schemas.predict import City


class WatchlistCreate(BaseModel):
    source_city: City
    destination_city: City
    target_price: float = Field(gt=0, le=200_000)

    @field_validator("destination_city")
    @classmethod
    def destination_must_differ_from_source(cls, v: City, info) -> City:
        source = info.data.get("source_city")
        if source is not None and v == source:
            raise ValueError("destination_city must differ from source_city")
        return v


class WatchlistResponse(BaseModel):
    id: int
    source_city: str
    destination_city: str
    target_price: float
    created_at: datetime

    model_config = {"from_attributes": True}
