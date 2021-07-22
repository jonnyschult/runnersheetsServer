"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Team = void 0;
class Team {
    constructor(team_name, role, id, created_at, updated_at) {
        this.team_name = team_name;
        this.role = role;
        this.id = id;
        this.created_at = created_at;
        this.updated_at = updated_at;
    }
}
exports.Team = Team;
