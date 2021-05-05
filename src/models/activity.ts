export class Activity {
  constructor(
    public email: string,
    public date: number,
    public meters: number,
    public durationSecs: number,
    public userId: number,
    public elevationMeters?: number,
    public avgHR?: number,
    public maxHR?: number,
    public description?: string,
    public stravaId?: number,
    public garminId?: number,
    public fitbitId?: number,
    public created_at?: string,
    public updated_at?: string,
    public id?: number
  ) {}
}
