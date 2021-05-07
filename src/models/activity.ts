export class Activity {
  constructor(
    public email: string,
    public date: Date,
    public distance_meters: number,
    public duration_seconds: number,
    public user_id: number,
    public elevation_meters?: number,
    public avg_hr?: number,
    public max_hr?: number,
    public description?: string,
    public strava_id?: number,
    public garmin_id?: number,
    public fitbit_id?: number,
    public created_at?: string,
    public updated_at?: string,
    public id?: number
  ) {}
}
