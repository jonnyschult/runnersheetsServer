"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Activity = void 0;
class Activity {
    constructor(email, date, meters, durationSecs, userId, elevationMeters, avgHR, maxHR, description, stravaId, garminId, fitbitId, created_at, updated_at, id) {
        this.email = email;
        this.date = date;
        this.meters = meters;
        this.durationSecs = durationSecs;
        this.userId = userId;
        this.elevationMeters = elevationMeters;
        this.avgHR = avgHR;
        this.maxHR = maxHR;
        this.description = description;
        this.stravaId = stravaId;
        this.garminId = garminId;
        this.fitbitId = fitbitId;
        this.created_at = created_at;
        this.updated_at = updated_at;
        this.id = id;
    }
}
exports.Activity = Activity;
