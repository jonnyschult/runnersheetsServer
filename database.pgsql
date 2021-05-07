CREATE DATABASE runnersheets;

\c runnersheets;

CREATE TABLE users(
    id SERIAL, 
    email varchar(50) NOT NULL UNIQUE,
    first_name varchar(30) NOT NULL,
    last_name varchar(30) NOT NULL,
    passwordhash varchar(300) NOT NULL,
    height_inches int,
    weight_pounds int,
    date_of_birth date  NOT NULL,
    premium_user boolean NOT NULL DEFAULT false, 
    coach boolean NOT NULL DEFAULT false,
    fitbit_refresh varchar(255), 
    garmin_refresh varchar(255),
    strava_refresh varchar(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id)
);

CREATE TABLE activities(
    id SERIAL,
    date TIMESTAMPTZ NOT NULL,
    distance_meters DOUBLE PRECISION NOT NULL,
    duration_seconds DOUBLE PRECISION NOT NULL,
    elevation_meters DOUBLE PRECISION,
    avg_hr int,
    max_hr int,
    description TEXT,
    strava_id bigint, 
    fitbit_id bigint,
    garmin_id bigint,
    user_id int,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE teams(
    id SERIAL, 
    team_name varchar(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id)
);

CREATE TABLE clubs(
    id SERIAL,
    club_name varchar(255) NOT NULL, 
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id)
);

CREATE TYPE team_roles AS ENUM ('manager', 'coach', 'athlete');

CREATE TABLE teams_users(
    role team_roles NOT NULL,
    team_id int NOT NULL,
    user_id int NOT NULL, 
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    FOREIGN KEY (team_id) REFERENCES teams (id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TYPE club_roles AS ENUM ('chair', 'vice_chair', 'athlete');

CREATE TABLE clubs_users(
    role club_roles NOT NULL,
    club_id int NOT NULL,
    user_id int NOT NULL, 
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    FOREIGN KEY (club_id) REFERENCES clubs (id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

