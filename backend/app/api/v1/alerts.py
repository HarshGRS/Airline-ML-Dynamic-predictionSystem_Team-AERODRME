from typing import List
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(tags=["alerts"])

class Alert(BaseModel):
    id: str
    type: str
    source: str
    destination: str
    description: str
    value: str
    timestamp: str

# Static demo data for the Alerts Center
ALERTS_DATA = [
    {
        "id": "1",
        "type": "PRICE_SPIKE",
        "source": "JFK",
        "destination": "LAX",
        "description": "Forecast spike +42% over baseline window.",
        "value": "+42%",
        "timestamp": "13:22 UTC"
    },
    {
        "id": "2",
        "type": "PRICE_DROP",
        "source": "CDG",
        "destination": "JFK",
        "description": "Significant price drop, below 30-day floor.",
        "value": "-28%",
        "timestamp": "12:21 UTC"
    },
    {
        "id": "3",
        "type": "VOLATILITY",
        "source": "SFO",
        "destination": "NRT",
        "description": "Volatility above normal threshold (sigma 1.8x).",
        "value": "+15%",
        "timestamp": "10:31 UTC"
    },
    {
        "id": "4",
        "type": "DEMAND_SURGE",
        "source": "LAX",
        "destination": "HND",
        "description": "Booking volume up 35% in the last hour.",
        "value": "+35%",
        "timestamp": "09:58 UTC"
    },
    {
        "id": "5",
        "type": "PRICE_DROP",
        "source": "GRU",
        "destination": "MAD",
        "description": "Below expected range; possible promo activity.",
        "value": "-22%",
        "timestamp": "08:41 UTC"
    }
]

@router.get("/alerts", response_model=List[Alert])
def get_alerts():
    return ALERTS_DATA
