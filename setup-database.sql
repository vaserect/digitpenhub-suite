-- Database Setup Script for Digitpen Hub
-- Run this with: psql -U postgres -f setup-database.sql

-- Drop existing database if it exists
DROP DATABASE IF EXISTS digitpenhub;

-- Create database
CREATE DATABASE digitpenhub;

-- Create user (ignore error if already exists)
DO
$$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'digitpenhub') THEN
      CREATE USER digitpenhub WITH PASSWORD 'digitpenhub';
   END IF;
END
$$;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE digitpenhub TO digitpenhub;

-- Connect to the database
\c digitpenhub

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO digitpenhub;

-- Confirm setup
SELECT 'Database setup complete!' AS status;
