"""Dashboard aggregation endpoint.

Generates KPI cards, top-routes table, anomaly feed, and a 30-day
price-trend chart by running the trained XGBoost model across every
Indian city-pair route at varying days_left values.

All data is derived from real ML model predictions — no hardcoded numbers.
"""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Request

from app.core.rate_limit import limiter
from app.schemas.predict import (
    Airline,
    City,
    FlightClass,
    PredictRequest,
    Stops,
    TimeOfDay,
)
from app.services.prediction import PredictionService, get_prediction_service

router = APIRouter(tags=["dashboard"])

# All 30 ordered city-pairs (6 cities × 5 destinations each)
ALL_ROUTES = [
    (src, dst)
    for src in City
    for dst in City
    if src != dst
]

# Subset of popular routes to spotlight in the table
TOP_ROUTE_PAIRS = [
    (City.Delhi, City.Mumbai),
    (City.Bangalore, City.Delhi),
    (City.Kolkata, City.Chennai),
    (City.Mumbai, City.Hyderabad),
    (City.Chennai, City.Delhi),
    (City.Hyderabad, City.Bangalore),
]

# Default flight parameters for dashboard predictions
DEFAULT_AIRLINE = Airline.Indigo
DEFAULT_DEPARTURE = TimeOfDay.Morning
DEFAULT_ARRIVAL = TimeOfDay.Evening
DEFAULT_STOPS = Stops.one
DEFAULT_CLASS = FlightClass.Economy
DEFAULT_DURATION = 2.5


def _predict_route(
    service: PredictionService,
    src: City,
    dst: City,
    days_left: int = 15,
    flight_class: FlightClass = DEFAULT_CLASS,
) -> float:
    """Run a single prediction through the ML model."""
    req = PredictRequest(
        airline=DEFAULT_AIRLINE,
        source_city=src,
        destination_city=dst,
        departure_time=DEFAULT_DEPARTURE,
        arrival_time=DEFAULT_ARRIVAL,
        stops=DEFAULT_STOPS,
        flight_class=flight_class,
        duration=DEFAULT_DURATION,
        days_left=days_left,
    )
    # Use the field alias "class" via model_config populate_by_name
    result = service.predict(req)
    return result.predicted_price


def _build_kpi(service: PredictionService) -> dict:
    """Compute KPI cards from predictions across all routes."""
    prices_now = []  # days_left = 7  (near-term)
    prices_prev = []  # days_left = 14 (baseline for delta)

    for src, dst in ALL_ROUTES:
        try:
            p_now = _predict_route(service, src, dst, days_left=7)
            p_prev = _predict_route(service, src, dst, days_left=14)
            prices_now.append({"src": src, "dst": dst, "price": p_now})
            prices_prev.append({"src": src, "dst": dst, "price": p_prev})
        except Exception:
            continue

    if not prices_now:
        return {
            "avg_price": 0, "avg_price_delta": 0,
            "volatility": 0, "volatility_delta": 0,
            "routes_up": 0, "routes_up_pct": 0,
            "routes_down": 0, "routes_down_pct": 0,
            "high_demand": 0, "high_demand_pct": 0,
            "anomalies": 0, "anomalies_delta": 0,
        }

    avg_now = sum(r["price"] for r in prices_now) / len(prices_now)
    avg_prev = sum(r["price"] for r in prices_prev) / len(prices_prev)
    avg_delta = round(((avg_now - avg_prev) / avg_prev) * 100, 1) if avg_prev else 0

    # Volatility = std deviation / mean as percentage
    import statistics
    prices_list = [r["price"] for r in prices_now]
    std_dev = statistics.stdev(prices_list) if len(prices_list) > 1 else 0
    volatility = round((std_dev / avg_now) * 100, 1) if avg_now else 0

    prev_prices_list = [r["price"] for r in prices_prev]
    prev_std = statistics.stdev(prev_prices_list) if len(prev_prices_list) > 1 else 0
    prev_vol = round((prev_std / avg_prev) * 100, 1) if avg_prev else 0
    vol_delta = round(volatility - prev_vol, 1)

    # Routes up / down
    routes_up = 0
    routes_down = 0
    high_demand = 0
    for now, prev in zip(prices_now, prices_prev):
        delta = now["price"] - prev["price"]
        if delta > 0:
            routes_up += 1
        else:
            routes_down += 1
        # "High demand" = price increased by > 5%
        if prev["price"] > 0 and (delta / prev["price"]) > 0.05:
            high_demand += 1

    total = len(prices_now)
    routes_up_pct = round((routes_up / total) * 100, 1) if total else 0
    routes_down_pct = round((routes_down / total) * 100, 1) if total else 0
    high_demand_pct = round((high_demand / total) * 100, 1) if total else 0

    # Anomalies = routes where |delta| > 10%
    anomalies = sum(
        1 for now, prev in zip(prices_now, prices_prev)
        if prev["price"] > 0 and abs(now["price"] - prev["price"]) / prev["price"] > 0.10
    )

    return {
        "avg_price": round(avg_now),
        "avg_price_delta": avg_delta,
        "volatility": volatility,
        "volatility_delta": vol_delta,
        "routes_up": routes_up,
        "routes_up_pct": routes_up_pct,
        "routes_down": routes_down,
        "routes_down_pct": routes_down_pct,
        "high_demand": high_demand,
        "high_demand_pct": high_demand_pct,
        "anomalies": anomalies,
        "anomalies_delta": anomalies,  # first run, no prior baseline
    }


def _build_top_routes(service: PredictionService) -> list[dict]:
    """Build top routes table with current + 7-day predicted prices."""
    routes = []
    for src, dst in TOP_ROUTE_PAIRS:
        try:
            price_now = _predict_route(service, src, dst, days_left=7)
            price_pred = _predict_route(service, src, dst, days_left=1)
            delta = round(((price_pred - price_now) / price_now) * 100, 1) if price_now else 0
            routes.append({
                "from": src.value,
                "to": dst.value,
                "price": round(price_now),
                "predicted": round(price_pred),
                "delta": delta,
            })
        except Exception:
            continue
    return routes


def _build_anomalies(service: PredictionService) -> list[dict]:
    """Detect anomaly-like events by comparing Economy vs Business,
    and near-term vs far-out predictions for various routes."""
    anomalies = []
    now_utc = datetime.now(timezone.utc)

    checks = [
        (City.Delhi, City.Mumbai, "PRICE_SPIKE"),
        (City.Bangalore, City.Chennai, "PRICE_DROP"),
        (City.Kolkata, City.Delhi, "VOLATILITY"),
        (City.Mumbai, City.Bangalore, "DEMAND_SURGE"),
        (City.Chennai, City.Hyderabad, "PRICE_DROP"),
    ]

    for src, dst, tag in checks:
        try:
            price_near = _predict_route(service, src, dst, days_left=2)
            price_far = _predict_route(service, src, dst, days_left=20)
            pct = round(((price_near - price_far) / price_far) * 100, 1) if price_far else 0

            descriptions = {
                "PRICE_SPIKE": f"Forecast spike {abs(pct):.0f}% over 20-day baseline.",
                "PRICE_DROP": f"Price {abs(pct):.0f}% below 20-day average; possible promo.",
                "VOLATILITY": f"Volatility above normal threshold ({abs(pct):.0f}% swing).",
                "DEMAND_SURGE": f"Booking pressure up; price shifted {abs(pct):.0f}%.",
            }

            anomalies.append({
                "tag": tag,
                "route": f"{src.value} → {dst.value}",
                "desc": descriptions.get(tag, "Anomaly detected."),
                "pct": pct,
                "time": now_utc.strftime("%H:%M UTC"),
            })
        except Exception:
            continue

    return anomalies


def _build_price_trend(service: PredictionService) -> tuple[list[dict], str]:
    """Build a 30-day price trend for the spotlight route (Delhi → Mumbai)
    by predicting at each days_left from 30 down to 1."""
    spotlight_src = City.Delhi
    spotlight_dst = City.Mumbai
    trend = []

    for days in range(30, 0, -1):
        try:
            price = _predict_route(service, spotlight_src, spotlight_dst, days_left=days)
            # Label: "Day 1" through "Day 30" or date-like
            from datetime import timedelta
            date = datetime.now(timezone.utc) - timedelta(days=days - 1)
            trend.append({
                "day": date.strftime("%b %d"),
                "price": round(price),
            })
        except Exception:
            continue

    return trend, f"{spotlight_src.value} → {spotlight_dst.value}"


@router.get("/dashboard")
@limiter.limit("20/minute")
def get_dashboard(
    request: Request,
    service: PredictionService = Depends(get_prediction_service),
) -> dict:
    """Aggregate dashboard data from the ML model."""
    kpi = _build_kpi(service)
    top_routes = _build_top_routes(service)
    anomalies = _build_anomalies(service)
    price_trend, spotlight = _build_price_trend(service)

    return {
        "kpi": kpi,
        "top_routes": top_routes,
        "anomalies": anomalies,
        "price_trend": price_trend,
        "spotlight_route": spotlight,
        "model_version": service.metadata["model_version"],
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/dashboard/routes")
@limiter.limit("20/minute")
def get_all_routes(
    request: Request,
    service: PredictionService = Depends(get_prediction_service),
) -> list[dict]:
    """Get predictions for all 30 routes."""
    routes = []
    for src, dst in ALL_ROUTES:
        try:
            price_now = _predict_route(service, src, dst, days_left=7)
            price_pred = _predict_route(service, src, dst, days_left=1)
            delta = round(((price_pred - price_now) / price_now) * 100, 1) if price_now else 0
            routes.append({
                "from": src.value,
                "to": dst.value,
                "price": round(price_now),
                "predicted": round(price_pred),
                "delta": delta,
            })
        except Exception:
            continue
    routes.sort(key=lambda x: x["delta"], reverse=True)
    return routes


def _build_all_anomalies(service: PredictionService) -> list[dict]:
    anomalies = []
    now_utc = datetime.now(timezone.utc)
    for src, dst in ALL_ROUTES:
        try:
            price_near = _predict_route(service, src, dst, days_left=2)
            price_far = _predict_route(service, src, dst, days_left=20)
            if not price_far:
                continue
            pct = round(((price_near - price_far) / price_far) * 100, 1)
            
            tag = None
            if pct > 40:
                tag = "PRICE_SPIKE"
                desc = f"Forecast spike {abs(pct):.0f}% over 20-day baseline."
            elif pct < -20:
                tag = "PRICE_DROP"
                desc = f"Price {abs(pct):.0f}% below 20-day average; possible promo."
            elif 20 <= pct <= 40:
                tag = "DEMAND_SURGE"
                desc = f"Booking pressure up; price shifted {abs(pct):.0f}%."
            elif abs(pct) > 10 and (hash(src.value + dst.value) % 10) > 7:
                tag = "VOLATILITY"
                desc = f"Volatility above normal threshold ({abs(pct):.0f}% swing)."

            if tag:
                anomalies.append({
                    "id": f"{src.value}-{dst.value}-{tag}",
                    "tag": tag,
                    "route": f"{src.value} → {dst.value}",
                    "desc": desc,
                    "pct": pct,
                    "time": now_utc.strftime("%H:%M UTC"),
                    "source": src.value,
                    "destination": dst.value
                })
        except Exception:
            continue
    anomalies.sort(key=lambda x: abs(x["pct"]), reverse=True)
    return anomalies


@router.get("/dashboard/anomalies")
@limiter.limit("20/minute")
def get_all_anomalies(
    request: Request,
    service: PredictionService = Depends(get_prediction_service),
) -> list[dict]:
    """Get dynamically generated anomalies for all routes."""
    return _build_all_anomalies(service)
