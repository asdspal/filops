-- TimescaleDB initialization script for FilOps metrics
-- This script runs automatically when the container is first created

-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create schemas
CREATE SCHEMA IF NOT EXISTS metrics;

-- Set search path
ALTER DATABASE filops_metrics SET search_path TO metrics, public;

-- Grant permissions
GRANT ALL PRIVILEGES ON SCHEMA metrics TO filops;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA metrics TO filops;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA metrics TO filops;

-- Log initialization
DO $$
BEGIN
  RAISE NOTICE 'FilOps TimescaleDB database initialized successfully';
END $$;
