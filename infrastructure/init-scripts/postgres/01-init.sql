-- PostgreSQL initialization script for FilOps
-- This script runs automatically when the container is first created

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Create schemas
CREATE SCHEMA IF NOT EXISTS filops;

-- Set search path
ALTER DATABASE filops SET search_path TO filops, public;

-- Grant permissions
GRANT ALL PRIVILEGES ON SCHEMA filops TO filops;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA filops TO filops;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA filops TO filops;

-- Log initialization
DO $$
BEGIN
  RAISE NOTICE 'FilOps PostgreSQL database initialized successfully';
END $$;
