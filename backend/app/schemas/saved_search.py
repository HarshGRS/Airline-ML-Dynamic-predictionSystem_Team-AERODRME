from datetime import datetime

from pydantic import BaseModel, Field, field_validator

from app.schemas.predict import City, FlightClass


class SavedSearchCreate(BaseModel):
    source_city: City
    destination_city: City
    flight_class: FlightClass = Field(default=FlightClass.Economy)

    @field_validator("destination_city")
    @classmethod
    def destination_must_differ_from_source(cls, v: City, info) -> City:
        source = info.data.get("source_city")
        if source is not None and v == source:
            raise ValueError("destination_city must differ from source_city")
        return v


class SavedSearchResponse(BaseModel):
    id: int
    source_city: str
    destination_city: str
    flight_class: str
    created_at: datetime

    model_config = {"from_attributes": True}
