# runnersheetsServer

<!-- prettier-ignore -->
Overview: 
    The server allows users to create an account, add activities, create teams, and assign roles for team members. Activities, teams, and users are CRUD compliant. As RunnerSheets is targeted to run coaching, the logic of the data manipulation and structure enabled by the server is focused around three user roles: athelete, coach, and manager. One can be a user without being on a team and thus not have one of these roles. In that case, users can only interact and have their data interacted with by themselves, or create a team. If a user creates a team, they are automatically assigned the role of manager, as each team needs a manager to control team roles and settings. Once the team has been created, the manager can add athletes, coaches and other managers. They can update the team name, members, and remove the team. Also, they have all the privileges that the coach role has. Coaches can add or remove athletes and get individual athlete or all athletes' activities if they belong to the same team as the coach. Athletes have no access to others information and simply belong to a team. Teams and athlete/coaches/managers are connected to each other through a junction table titled TeamRosters. Users and activities are connected through a user hasMany association. These associations enable coaches/manager to get all athlete activities. 
Validations: 
    There are three validation middlewares. 
    1. userValidation:
        Function: Takes in a token, decodes it and finds the associated user via jwt and sequelize methods. If found, it calls the next method to pass the decoded information into the next server process.
        Use: Sufficient for access to the activityContorller route and delete/update user functions in userController. Necessary for managerController and coachController routes.
    2. coachValidation:
        Function: Takes user info decoded from userValidation and searches TeamRosters for a match between req.user.id and userId. If found, it checks the role. If role is manager OR coach, it calls the next method and allows the server to execute it's next process. 
        Use: Sufficient to grant access to the coachController route. 
    3. managerValidation: 
        Function: Takes user info decoded from userValidation and searches TeamRosters for a match between req.user.id and userId. If found, it checks the role. If role is manager, it calls the next method and allows the server to execute it's next process. 
        Use: Sufficient to grant access to the managerController route. 
Controllers:
    There are five route controllers. * = userValidation required, ** = coachValidation required, *** = managerValidation required.
    1. userController:
        Use: Enables user registration, login, user information updating* and user deletion*.
        Routes: ~/user
            POST /register			        => Registers new user account
            POST /login			            => Logs in a user
            PUT/updatePassword		        => Updates password *
            PUT/updateUser			        => Update User Info *
            DELETE/removeUser		        => Delete user *
    2. activityController*: 
        Use: Enables users to create, get, update and delete activities (runs). 
        Routes: ~/activity
            POST/create			            => Create user activity 
            GET /getActivities	/id		    => Get all activities for specific user
            PUT/update			            => Update Activity
            DELETE/removeActivity	        => Delete activity
    3. teamController*:
        Use: Enables users to create a team and auto assigns that user to a manager role for the team.
        Routes: ~/team
            POST /create			        => Create team
    4. coachController**:
        Use: Enables users with the coach role to add athletes to their team, view all athletes, view single athlete or all team athletes' activities, and delete athlete.
        Routes: ~/coach 
            POST /addAthlete		        => Add athlete to team (via TeamRoster through table)
            GET /getAtheletes		        => Get all athletes on a specific team
            GET /coachTeams                      => Get all teams associated with a coach or manager
            GET /getTeamActivities/:id	    => Get all activities for all athletes on a team
            GET /getAthleteActivities/:id	=> Get all activities for a specific athlete
            DELETE/removeAthlete		    => Delete athlete from team
    5. managerController***: 
        Use: Enables users with the manager role to add coaches and managers to their team, update coach/manager roles, delete coaches and managers, and remove team.
        Routes: ~/manager
            Managers: ~/manager ***			
            POST /addCoach			        => Add coach or manager to team
            GET /getAtheletes/:id		    => Get all coaches/managers for a team
            PUT /updateTeam			        => Update team name
            PUT /updateCoach		        => Update role of coach or manager
            DELETE /removeCoach		        => Delete coach or manager from team
            DELETE /removeTeam		        => Delete team 
Models: 
    There are four models for four tables. All by default have id (except teamRosters), createdAt and updatedAt columns. * = allowNull: true
    1. user:
        Use: Provides a model for the user table which stores user information
        Columns: email, firstName, lastName, passwordHash, heightInInches*, weightInPounds*, age*, isPremium, isCoach
        Association: user has many activities and user belongs to many teams
    2. acitivity:
        Use: Provides a model for the activity tables which stores user activity details
        Columns: date, meters, durationSecs, elevationMeters*, avgHR*, maxHR*, description*, strava_id*, userId
        Association: activity belongs to user.
    3. team: 
        Use: Provides a model for the team table which stores minimal information about a team.
        Columns: teamName
        Association: team belongs to many users
    4. teamRosters:
        Use: Provides a junction table for the many-to-many relation between teams and users
        Columns: role, teamId, userId
        Association: Is the junction table for the many to many relation between users and teams.
