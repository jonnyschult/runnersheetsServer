export class ClubRoster {
  constructor(
    public role: "athlete"| "vice chairperson"| "chairperson",
    public clubId: number,
    public userId: number,
    public id?: number, 
    public created_at?: string,
    public updated_at?: string,
  ) {}
}