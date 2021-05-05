"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Team = void 0;
class Team {
    constructor(teamname, id, created_at, updated_at) {
        this.teamname = teamname;
        this.id = id;
        this.created_at = created_at;
        this.updated_at = updated_at;
    }
}
exports.Team = Team;
