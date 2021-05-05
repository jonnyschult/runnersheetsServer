"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
class User {
    constructor(email, firstName, lastName, DOB, isPremium, isCoach, fitbitRefresh, heightInInches, weightInPounds, created_at, updated_at, id, password, passwordhash) {
        this.email = email;
        this.firstName = firstName;
        this.lastName = lastName;
        this.DOB = DOB;
        this.isPremium = isPremium;
        this.isCoach = isCoach;
        this.fitbitRefresh = fitbitRefresh;
        this.heightInInches = heightInInches;
        this.weightInPounds = weightInPounds;
        this.created_at = created_at;
        this.updated_at = updated_at;
        this.id = id;
        this.password = password;
        this.passwordhash = passwordhash;
    }
}
exports.User = User;
