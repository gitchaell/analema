def calculate_solar_noon(name, lat, lon, offset_hours):
    central_meridian = abs(offset_hours) * 15
    diff_deg = abs(lon) - central_meridian
    diff_minutes = diff_deg * 4
    noon_minutes = 12 * 60 + diff_minutes
    hours = int(noon_minutes // 60)
    minutes = int(noon_minutes % 60)
    return f"{name}: {hours:02d}:{minutes:02d} (Offset UTC{offset_hours}, Lon {lon})"

locations = [
    ("Englewood Beach, FL", 26.9184, -82.3568, -5),
    ("Ojai, CA", 34.4480, -119.2430, -8),
    ("Peaks Island, ME", 43.6570, -70.1962, -5),
    ("Prescott, AZ", 34.5400, -112.4685, -7),
    ("Fountain Hills, AZ", 33.6117, -111.7174, -7),
    ("Phoenix, AZ", 33.4484, -112.0740, -7)
]

for loc in locations:
    print(calculate_solar_noon(*loc))
