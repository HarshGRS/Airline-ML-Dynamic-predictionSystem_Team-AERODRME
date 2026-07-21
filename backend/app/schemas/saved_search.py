from datetime import date, datetime

from pydantic import BaseModel, Field, field_validator

from app.schemas.predict import Airline, City, FlightClass, Stops, TimeOfDay


class SavedSearchCreate(BaseModel):
    source_city: City
    destination_city: City
    flight_class: FlightClass = Field(default=FlightClass.Economy)
    airline: Airline
    departure_time: TimeOfDay
    arrival_time: TimeOfDay
    stops: Stops
    departure_date: date

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
    airline: str
    departure_time: str
    arrival_time: str
    stops: str
    departure_date: date
    created_at: datetime

    model_config = {"from_attributes": True}
