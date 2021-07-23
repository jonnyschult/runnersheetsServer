# RunnerSheets - Backend

## App Description

RunnerSheets is an ongoing project meant to be a data hub, integrating activities stored on various platforms. As of now, it is integrated with Strava and Fitbit. The app also allows one to share data with other users via the club option, and it allows coaches to collate the data from their team members without sharing that data between peers.

### Features

- Oauth integration with Strava and Fitbit
- Full User CRUD
- Team data sharing with a coach or coaches
- Club peer to peer data sharing
- Chartjs data visualization
- Manual activity adder

This project is hosted on Heroku

[Demo for RunnerSheets](https://runnersheetsclient.herokuapp.com)

## Frontend

Go to [GitHub-RunnerSheetsClient](https://github.com/jonnyschult/runnersheetsClient) and follow the instructions in the README

## Backend

The backend is a node + Express server connected to a Postgres database written in TypeScript and SQL.

**_Running this app locally will not allow you to use the Strava and Fitbit funcationality to add activities to your profile. But there is a demo button to auto generate sample data. More on that below. To see how Strava and Fitbit integrate, please use the deployed link above._**

### Requirements

- Node
- Nodemon (could avoid if you change the dev script)
- psql/Postgres
- npm or yarn

## Server and Database Setup

1. Connect to psql as the postgres superuser. On Ubuntu, the command is: `sudo -u postgres psql postgres`.
2. Copy and paste the contents of the database.pgsql file in this repository. It will create the Database, connect you to that database, and the create all the tables, types, etc.
3. Create .env. Make sure you add your password to the DATABASE_URL file with the following variables:

   - PORT = 8800
   - JWT_SECRET = asupersecret
   - FITBIT_SECRET = whatever
   - FITBIT_ID = whatever
   - FITBIT_CALLBACK = http://localhost:3000/fitbit
   - FITBIT_BASE64 = whatever
   - DATABASE_URL = postgres://postgres:**PASSWORD**@localhost:5432/runnersheets
   - STRAVA_ID = Whatever
   - STRAVA_SECRET = Whatever
   - STRAVA_CALLBACK = http://localhost:3000/strava
   - DEMO_PASS = testpass

Install dependencies: `npm install` or `yarn install`

### Start server

- `npm run dev` or `yarn dev`

## Using RunnerSheets

1. Follow the instruction on the frontend's README to start the browser client.
2. Once it is running, press the "+Yourself or Sign In" button and register a user. With the user registered, the app should automatically redirect you to the athlete's landing page.
3. Click on the "Create Demo Data" button in the "Add Activities" container at the bottom right of the browser screen. This button is only available when the app is running on localhost.
4. Type in "testpass" for the password and press the "Generate Activites" button. **If you put a different value for the DEMO_PASS .env variable, you'll have to use that instead**.

This should generate about a years worth of runs assuming moderate running ability. It will also create 3 clubs, two of which you are a members, one of which you are the chair person. You have different permissions depending on which role you have. To populate those clubs, the demo button also adds about a years worth of runs for each user in those clubs. You can see this by clicking through the clubs page. I didn't bother populating the coaches page because it is very similar to the clubs page, except only the coach can see the activities.
From here, you do whatever you want. You can update user info, change password, delete user, etc. You can also log in as the other generated users. You can find their emails on the club page. All of their passwords are "testpass".
Couple final notes. As mentioned above, the Strava and Fitbit integration won't work, because you'd need my seceret keys, and I'm not sharing. Second, the UX/UI is a bit clunky, but adequate for testing out the functionality. If/when I redesign this app, it will be smoother.

Contact me: jonathon.schult@gmail.com
