from enum import Enum

from pydantic import BaseModel, Field, field_validator


class Airline(str, Enum):
    AirAsia = "AirAsia"
    Air_India = "Air_India"
    GO_FIRST = "GO_FIRST"
    Indigo = "Indigo"
    SpiceJet = "SpiceJet"
    Vistara = "Vistara"


class City(str, Enum):
    Bangalore = "Bangalore"
    Chennai = "Chennai"
    Delhi = "Delhi"
    Hyderabad = "Hyderabad"
    Kolkata = "Kolkata"
    Mumbai = "Mumbai"


class TimeOfDay(str, Enum):
    Afternoon = "Afternoon"
    Early_Morning = "Early_Morning"
    Evening = "Evening"
    Late_Night = "Late_Night"
    Morning = "Morning"
    Night = "Night"


class Stops(str, Enum):
    zero = "zero"
    one = "one"
    two_or_more = "two_or_more"


class FlightClass(str, Enum):
    Economy = "Economy"
    Business = "Business"


class PredictRequest(BaseModel):
    airline: Airline
    source_city: City
    destination_city: City
    departure_time: TimeOfDay
    arrival_time: TimeOfDay
    stops: Stops
    flight_class: FlightClass = Field(alias="class")
    duration: float = Field(gt=0, le=60, description="Flight duration in hours")
    days_left: int = Field(ge=1, le=49, description="Days between search and departure")

    model_config = {"populate_by_name": True}

    @field_validator("destination_city")
    @classmethod
    def destination_must_differ_from_source(cls, v: City, info) -> City:
        source = info.data.get("source_city")
        if source is not None and v == source:
            raise ValueError("destination_city must differ from source_city")
        return v


class PredictResponse(BaseModel):
    predicted_price: float
    currency: str = "INR"
    confidence_low: float
    confidence_high: float
    model_version: str
    out_of_distribution: bool
