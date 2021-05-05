"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeamRoster = void 0;
class TeamRoster {
    constructor(role, teamId, userId, id, created_at, updated_at) {
        this.role = role;
        this.teamId = teamId;
        this.userId = userId;
        this.id = id;
        this.created_at = created_at;
        this.updated_at = updated_at;
    }
}
exports.TeamRoster = TeamRoster;
