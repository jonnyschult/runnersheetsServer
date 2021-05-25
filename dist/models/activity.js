"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Activity {
    constructor(email, date, distance_meters, duration_seconds, user_id, elevation_meters, avg_hr, max_hr, description, strava_id, garmin_id, fitbit_id, created_at, updated_at, id) {
        this.email = email;
        this.date = date;
        this.distance_meters = distance_meters;
        this.duration_seconds = duration_seconds;
        this.user_id = user_id;
        this.elevation_meters = elevation_meters;
        this.avg_hr = avg_hr;
        this.max_hr = max_hr;
        this.description = description;
        this.strava_id = strava_id;
        this.garmin_id = garmin_id;
        this.fitbit_id = fitbit_id;
        this.created_at = created_at;
        this.updated_at = updated_at;
        this.id = id;
    }
}
exports.Activity = Activity;
