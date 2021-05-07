export class User {
  constructor(
    public email: string,
    public first_name: string,
    public last_name: string,
    public date_of_birth: string,
    public premium_user: boolean,
    public coach: boolean,
    public fitbit_refresh?: string,
    public strava_refresh?: string,
    public garmin_refresh?: string,
    public height_inches?: number,
    public weight_pounds?: number,
    public created_at?: string,
    public updated_at?: string,
    public id?: number,
    public password?: string,
    public passwordhash?: string
  ) {}
}
