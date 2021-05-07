export class ClubsUsers {
  constructor(
    public role: "athlete" | "vice_chair" | "chair",
    public club_id: number,
    public user_id: number,
    public id?: number,
    public created_at?: string,
    public updated_at?: string
  ) {}
}
