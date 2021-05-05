export class TeamRoster {
  constructor(
    public role: string,
    public teamId: number,
    public userId: number,
    public id?: number,
    public created_at?: string,
    public updated_at?: string
  ) {}
}
