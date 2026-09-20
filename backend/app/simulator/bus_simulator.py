import random
from datetime import datetime


# ==========================================================
# SMARTBUS ROUTE
# ==========================================================

ROUTE = [
    {
        "lat": 13.0827,
        "lng": 80.2707,
        "name": "Stop 1"
    },
    {
        "lat": 13.0855,
        "lng": 80.2685,
        "name": "Stop 2"
    },
    {
        "lat": 13.0890,
        "lng": 80.2660,
        "name": "Stop 3"
    },
    {
        "lat": 13.0925,
        "lng": 80.2635,
        "name": "Stop 4"
    },
    {
        "lat": 13.0960,
        "lng": 80.2610,
        "name": "Stop 5"
    }
]


# ==========================================================
# BUS SIMULATOR
# ==========================================================

class BusSimulator:

    def __init__(self):

        self.position = 0.0

        self.bus_id = "BUS-101"

        self.speed = 28.0


    # ======================================================
    # UPDATE BUS
    # ======================================================

    def update(self):

        # --------------------------------------------------
        # Generate traffic for each route segment
        #
        # 0 = Low
        # 1 = Moderate
        # 2 = Heavy
        # --------------------------------------------------

        segment_traffic = [

            # Segment 1
            random.choices(
                [0, 1, 2],
                weights=[0.55, 0.30, 0.15]
            )[0],

            # Segment 2
            random.choices(
                [0, 1, 2],
                weights=[0.30, 0.45, 0.25]
            )[0],

            # Segment 3
            random.choices(
                [0, 1, 2],
                weights=[0.20, 0.35, 0.45]
            )[0],

            # Segment 4
            random.choices(
                [0, 1, 2],
                weights=[0.50, 0.30, 0.20]
            )[0]
        ]


        # --------------------------------------------------
        # Move bus forward
        # --------------------------------------------------

        self.position += 0.08


        # Restart route after reaching final stop

        if self.position >= len(ROUTE) - 1:

            self.position = 0.0


        # --------------------------------------------------
        # Determine current route segment
        # --------------------------------------------------

        current_segment = int(self.position)

        next_segment = min(
            current_segment + 1,
            len(ROUTE) - 1
        )


        start = ROUTE[current_segment]

        end = ROUTE[next_segment]


        # --------------------------------------------------
        # Position between two stops
        # --------------------------------------------------

        progress = (
            self.position - current_segment
        )


        latitude = (
            start["lat"]
            +
            (
                end["lat"] - start["lat"]
            )
            *
            progress
        )


        longitude = (
            start["lng"]
            +
            (
                end["lng"] - start["lng"]
            )
            *
            progress
        )


        # --------------------------------------------------
        # Current segment traffic
        # --------------------------------------------------

        traffic_level = segment_traffic[
            min(
                current_segment,
                len(segment_traffic) - 1
            )
        ]


        # --------------------------------------------------
        # Traffic name
        # --------------------------------------------------

        traffic_names = {

            0: "Low",

            1: "Moderate",

            2: "Heavy"

        }


        traffic_name = traffic_names[
            traffic_level
        ]


        # --------------------------------------------------
        # Speed based on traffic
        # --------------------------------------------------

        if traffic_level == 0:

            self.speed = random.uniform(
                30,
                40
            )

        elif traffic_level == 1:

            self.speed = random.uniform(
                20,
                30
            )

        else:

            self.speed = random.uniform(
                10,
                20
            )


        # --------------------------------------------------
        # Distance remaining
        # --------------------------------------------------

        remaining_segments = (
            len(ROUTE)
            -
            1
            -
            self.position
        )


        distance_to_destination = max(
            0.5,
            remaining_segments * 1.2
        )


        # --------------------------------------------------
        # Stops remaining
        # --------------------------------------------------

        stops_remaining = max(
            1,
            len(ROUTE) - next_segment
        )


        # --------------------------------------------------
        # Return live bus data
        # --------------------------------------------------

        return {

            "bus_id":
                self.bus_id,

            "latitude":
                round(
                    latitude,
                    6
                ),

            "longitude":
                round(
                    longitude,
                    6
                ),

            "speed_kmh":
                round(
                    self.speed,
                    1
                ),

            "traffic_level":
                traffic_level,

            "traffic":
                traffic_name,

            "distance_to_destination_km":
                round(
                    distance_to_destination,
                    2
                ),

            "next_stop":
                ROUTE[next_segment]["name"],

            "stops_remaining":
                stops_remaining,

            "segment_traffic":
                segment_traffic,

            "current_segment":
                current_segment,

            "timestamp":
                datetime.now().isoformat()

        }


# ==========================================================
# CREATE GLOBAL BUS SIMULATOR
# ==========================================================

bus_simulator = BusSimulator()