export class Team {
  constructor(
    public team_name: string,
    public role: string,
    public id?: number,
    public created_at?: string,
    public updated_at?: string
  ) {}
}
