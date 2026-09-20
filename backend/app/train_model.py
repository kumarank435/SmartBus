import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error
import joblib
import os

# Make results reproducible
np.random.seed(42)

# Number of training samples
n_samples = 2000

# Generate synthetic bus data
distance = np.random.uniform(0.5, 15, n_samples)
speed = np.random.uniform(10, 50, n_samples)
traffic_level = np.random.randint(0, 3, n_samples)
stops_remaining = np.random.randint(0, 10, n_samples)
time_of_day = np.random.uniform(6, 23, n_samples)

# Traffic multiplier
traffic_multiplier = np.where(
    traffic_level == 0, 1.0,
    np.where(traffic_level == 1, 1.3, 1.8)
)

# Calculate realistic ETA
eta = (
    (distance / speed) * 60 * traffic_multiplier
    + stops_remaining * 0.8
    + np.random.normal(0, 0.5, n_samples)
)

# Prevent negative ETA
eta = np.maximum(eta, 1)

# Create dataframe
data = pd.DataFrame({
    "distance": distance,
    "speed": speed,
    "traffic_level": traffic_level,
    "stops_remaining": stops_remaining,
    "time_of_day": time_of_day,
    "eta": eta
})

# Save dataset
os.makedirs("data", exist_ok=True)
data.to_csv("data/bus_data.csv", index=False)

# Features and target
X = data[
    [
        "distance",
        "speed",
        "traffic_level",
        "stops_remaining",
        "time_of_day"
    ]
]

y = data["eta"]

# Split dataset
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42
)

# Train Random Forest model
model = RandomForestRegressor(
    n_estimators=100,
    random_state=42
)

model.fit(X_train, y_train)

# Evaluate model
predictions = model.predict(X_test)

mae = mean_absolute_error(y_test, predictions)

print(f"Model trained successfully!")
print(f"Mean Absolute Error: {mae:.2f} minutes")

# Save model
os.makedirs("app/ml", exist_ok=True)

joblib.dump(
    model,
    "app/ml/eta_model.pkl"
)

print("Model saved to app/ml/eta_model.pkl")
print("Dataset saved to data/bus_data.csv")