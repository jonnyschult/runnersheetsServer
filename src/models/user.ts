export class User {
  constructor(
    public email: string,
    public firstName: string,
    public lastName: string,
    public DOB: string,
    public isPremium: boolean,
    public isCoach: boolean,
    public fitbitRefresh?: string,
    public heightInInches?:number, 
    public weightInPounds?:number, 
    public created_at?: string,
    public updated_at?: string,
    public id?: number,
    public password?: string,
    public passwordhash?: string
  ) {}
}
