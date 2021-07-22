"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
class User {
    constructor(email, first_name, last_name, date_of_birth, premium_user, coach, fitbit_refresh, strava_refresh, garmin_refresh, height_inches, weight_pounds, created_at, updated_at, id, password, passwordhash) {
        this.email = email;
        this.first_name = first_name;
        this.last_name = last_name;
        this.date_of_birth = date_of_birth;
        this.premium_user = premium_user;
        this.coach = coach;
        this.fitbit_refresh = fitbit_refresh;
        this.strava_refresh = strava_refresh;
        this.garmin_refresh = garmin_refresh;
        this.height_inches = height_inches;
        this.weight_pounds = weight_pounds;
        this.created_at = created_at;
        this.updated_at = updated_at;
        this.id = id;
        this.password = password;
        this.passwordhash = passwordhash;
    }
}
exports.User = User;
