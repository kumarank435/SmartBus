from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import os
from datetime import datetime

from app.simulator.bus_simulator import bus_simulator


# ==========================================================
# FASTAPI APPLICATION
# ==========================================================

app = FastAPI(
    title="SmartBus API",
    description="Real-time bus tracking and ML-based ETA prediction",
    version="1.0.0"
)


# ==========================================================
# CORS
# ==========================================================

app.add_middleware(
    CORSMiddleware,

   allow_origins=[
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://localhost",
    "capacitor://localhost",
    "https://smartbus-7jgp.onrender.com"
],
    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],
)


# ==========================================================
# LOAD ML MODEL
# ==========================================================

MODEL_PATH = os.path.join(
    os.path.dirname(__file__),
    "ml",
    "eta_model.pkl"
)

model = joblib.load(MODEL_PATH)


# ==========================================================
# DEMO USERS
# ==========================================================

USERS = {

    "admin": {
        "password": "admin123",
        "role": "admin",
        "name": "SmartBus Administrator"
    },

    "passenger": {
        "password": "1234",
        "role": "passenger",
        "name": "Passenger"
    }

}


# ==========================================================
# REQUEST MODELS
# ==========================================================

class ETARequest(BaseModel):

    distance_km: float

    speed_kmh: float

    traffic_level: int

    stops_remaining: int

    time_of_day: float


class LoginRequest(BaseModel):

    username: str

    password: str


# ==========================================================
# HOME
# ==========================================================

@app.get("/")
def home():

    return {
        "message": "SmartBus API is running!"
    }


# ==========================================================
# LOGIN
# ==========================================================

@app.post("/api/login")
def login(request: LoginRequest):

    username = request.username

    password = request.password


    # ------------------------------------------------------
    # Check username
    # ------------------------------------------------------

    if username not in USERS:

        return {
            "success": False,
            "message": "Invalid username or password"
        }


    user = USERS[username]


    # ------------------------------------------------------
    # Check password
    # ------------------------------------------------------

    if user["password"] != password:

        return {
            "success": False,
            "message": "Invalid username or password"
        }


    # ------------------------------------------------------
    # Successful login
    # ------------------------------------------------------

    return {

        "success": True,

        "message": "Login successful",

        "username": username,

        "name": user["name"],

        "role": user["role"]

    }


# ==========================================================
# ML ETA PREDICTION
# ==========================================================

@app.post("/api/eta")
def predict_eta(request: ETARequest):

    features = [[

        request.distance_km,

        request.speed_kmh,

        request.traffic_level,

        request.stops_remaining,

        request.time_of_day

    ]]


    prediction = model.predict(features)[0]


    return {

        "distance_km":
            request.distance_km,

        "speed_kmh":
            request.speed_kmh,

        "traffic_level":
            request.traffic_level,

        "stops_remaining":
            request.stops_remaining,

        "eta_minutes":
            round(
                float(prediction),
                2
            )

    }


# ==========================================================
# LIVE BUS DATA
# ==========================================================

@app.get("/api/bus/live")
def get_live_bus():

    # ------------------------------------------------------
    # Get simulated live bus data
    # ------------------------------------------------------

    bus_data = bus_simulator.update()


    # ------------------------------------------------------
    # Prepare ML input
    # ------------------------------------------------------

    features = [[

        bus_data[
            "distance_to_destination_km"
        ],

        bus_data[
            "speed_kmh"
        ],

        bus_data[
            "traffic_level"
        ],

        bus_data[
            "stops_remaining"
        ],

        datetime.now().hour

    ]]


    # ------------------------------------------------------
    # Predict ETA
    # ------------------------------------------------------

    eta = model.predict(features)[0]


    bus_data["eta_minutes"] = round(
        float(eta),
        2
    )


    return bus_data


# ==========================================================
# ADMIN DASHBOARD
# ==========================================================

@app.get("/api/admin/dashboard")
def admin_dashboard():

    # ------------------------------------------------------
    # Get current bus data
    # ------------------------------------------------------

    bus_data = bus_simulator.update()


    # ------------------------------------------------------
    # ML ETA
    # ------------------------------------------------------

    features = [[

        bus_data[
            "distance_to_destination_km"
        ],

        bus_data[
            "speed_kmh"
        ],

        bus_data[
            "traffic_level"
        ],

        bus_data[
            "stops_remaining"
        ],

        datetime.now().hour

    ]]


    eta = model.predict(features)[0]


    bus_data["eta_minutes"] = round(
        float(eta),
        2
    )


    # ------------------------------------------------------
    # Traffic description
    # ------------------------------------------------------

    traffic_level = bus_data[
        "traffic_level"
    ]


    if traffic_level == 0:

        traffic_status = "Low"

    elif traffic_level == 1:

        traffic_status = "Moderate"

    else:

        traffic_status = "Heavy"


    # ------------------------------------------------------
    # Admin dashboard response
    # ------------------------------------------------------

    return {

        "dashboard": {

            "total_buses": 1,

            "active_buses": 1,

            "route_status": "Active",

            "system_status": "Operational",

            "traffic_status":
                traffic_status

        },

        "bus": bus_data,

        "last_updated":
            datetime.now().isoformat()

    }