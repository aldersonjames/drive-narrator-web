# Database Schema: Drive Narrator Voice-First Companion

**Branch**: `001-drive-narrator-voice-first` | **Date**: 2025-10-04

## Overview

This document defines the database schema for the Drive Narrator voice-first companion app. The schema supports voice-first interaction, location-aware storytelling, and drive session management.

## Database Technology

- **Development**: SQLite (file-based)
- **Production**: PostgreSQL (cloud-hosted)
- **Migrations**: Knex.js
- **ORM**: Knex.js query builder
- **Caching**: Redis

## Schema Design Principles

1. **Normalization**: 3NF compliance with strategic denormalization for performance
2. **Extensibility**: Flexible schema design for future features
3. **Performance**: Optimized indexes and query patterns
4. **Privacy**: Built-in data protection and retention policies
5. **Scalability**: Horizontal scaling considerations

## Core Tables

### users
Stores user profile information and preferences.

```sql
CREATE TABLE users (
  profile_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assistant_voice_id VARCHAR(50) NOT NULL,
  narrator_voice_id VARCHAR(50) NOT NULL,
  narration_persona_id VARCHAR(50) NOT NULL,
  narration_accent_id VARCHAR(50) NOT NULL,
  interest_tags JSONB NOT NULL DEFAULT '[]',
  alert_minutes INTEGER NOT NULL DEFAULT 5 CHECK (alert_minutes >= 1 AND alert_minutes <= 25),
  detour_preference VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (detour_preference IN ('none', 'short', 'medium', 'long')),
  background_music BOOLEAN NOT NULL DEFAULT false,
  new_discovery_alerts BOOLEAN NOT NULL DEFAULT true,
  approaching_poi_alerts BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_updated_at ON users(updated_at);
CREATE INDEX idx_users_interest_tags ON users USING GIN(interest_tags);
CREATE INDEX idx_users_metadata ON users USING GIN(metadata);

-- Triggers
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_users_updated_at();
```

### drive_sessions
Stores drive session information and metadata.

```sql
CREATE TABLE drive_sessions (
  drive_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES users(profile_id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'archived', 'cancelled')),
  origin_latitude DECIMAL(10, 8),
  origin_longitude DECIMAL(11, 8),
  origin_address TEXT,
  destination_latitude DECIMAL(10, 8),
  destination_longitude DECIMAL(11, 8),
  destination_address TEXT,
  total_distance DECIMAL(10, 2) DEFAULT 0,
  total_duration INTEGER DEFAULT 0, -- in minutes
  settings JSONB NOT NULL DEFAULT '{}',
  statistics JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_drive_sessions_profile_id ON drive_sessions(profile_id);
CREATE INDEX idx_drive_sessions_start_time ON drive_sessions(start_time);
CREATE INDEX idx_drive_sessions_status ON drive_sessions(status);
CREATE INDEX idx_drive_sessions_origin ON drive_sessions(origin_latitude, origin_longitude);
CREATE INDEX idx_drive_sessions_destination ON drive_sessions(destination_latitude, destination_longitude);
CREATE INDEX idx_drive_sessions_settings ON drive_sessions USING GIN(settings);
CREATE INDEX idx_drive_sessions_statistics ON drive_sessions USING GIN(statistics);

-- Triggers
CREATE TRIGGER trigger_drive_sessions_updated_at
  BEFORE UPDATE ON drive_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_users_updated_at();
```

### conversation_turns
Stores individual conversation turns within drive sessions.

```sql
CREATE TABLE conversation_turns (
  turn_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drive_id UUID NOT NULL REFERENCES drive_sessions(drive_id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('traveler', 'assistant', 'narrator')),
  voice_id VARCHAR(50),
  text TEXT NOT NULL,
  audio_url TEXT,
  audio_duration INTEGER, -- in seconds
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  synopsis TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  context JSONB NOT NULL DEFAULT '{}'
);

-- Indexes
CREATE INDEX idx_conversation_turns_drive_id ON conversation_turns(drive_id);
CREATE INDEX idx_conversation_turns_timestamp ON conversation_turns(timestamp);
CREATE INDEX idx_conversation_turns_role ON conversation_turns(role);
CREATE INDEX idx_conversation_turns_voice_id ON conversation_turns(voice_id);
CREATE INDEX idx_conversation_turns_metadata ON conversation_turns USING GIN(metadata);
CREATE INDEX idx_conversation_turns_context ON conversation_turns USING GIN(context);

-- Full-text search
CREATE INDEX idx_conversation_turns_text_search ON conversation_turns USING GIN(to_tsvector('english', text));
```

### pois
Stores point of interest information.

```sql
CREATE TABLE pois (
  poi_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,
  categories JSONB NOT NULL DEFAULT '[]',
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  relevance DECIMAL(3, 2) DEFAULT 0.5 CHECK (relevance >= 0 AND relevance <= 1),
  summary TEXT,
  narration_preview TEXT,
  attribution JSONB NOT NULL DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_pois_category ON pois(category);
CREATE INDEX idx_pois_categories ON pois USING GIN(categories);
CREATE INDEX idx_pois_location ON pois(latitude, longitude);
CREATE INDEX idx_pois_relevance ON pois(relevance);
CREATE INDEX idx_pois_attribution ON pois USING GIN(attribution);
CREATE INDEX idx_pois_metadata ON pois USING GIN(metadata);

-- Spatial index for location queries
CREATE INDEX idx_pois_location_spatial ON pois USING GIST(ST_Point(longitude, latitude));

-- Full-text search
CREATE INDEX idx_pois_name_search ON pois USING GIN(to_tsvector('english', name));
CREATE INDEX idx_pois_description_search ON pois USING GIN(to_tsvector('english', description));
```

### poi_alerts
Stores POI alerts triggered during drive sessions.

```sql
CREATE TABLE poi_alerts (
  alert_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drive_id UUID NOT NULL REFERENCES drive_sessions(drive_id) ON DELETE CASCADE,
  poi_id UUID NOT NULL REFERENCES pois(poi_id) ON DELETE CASCADE,
  trigger_time TIMESTAMP WITH TIME ZONE NOT NULL,
  alert_minutes INTEGER NOT NULL CHECK (alert_minutes >= 1 AND alert_minutes <= 25),
  distance DECIMAL(10, 2) NOT NULL, -- in miles
  eta INTEGER NOT NULL, -- in minutes
  story_content JSONB NOT NULL DEFAULT '{}',
  voice_settings JSONB NOT NULL DEFAULT '{}',
  user_response JSONB,
  status VARCHAR(20) NOT NULL DEFAULT 'triggered' CHECK (status IN ('triggered', 'delivered', 'acknowledged', 'skipped', 'favorited', 'expired')),
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_poi_alerts_drive_id ON poi_alerts(drive_id);
CREATE INDEX idx_poi_alerts_poi_id ON poi_alerts(poi_id);
CREATE INDEX idx_poi_alerts_trigger_time ON poi_alerts(trigger_time);
CREATE INDEX idx_poi_alerts_status ON poi_alerts(status);
CREATE INDEX idx_poi_alerts_story_content ON poi_alerts USING GIN(story_content);
CREATE INDEX idx_poi_alerts_voice_settings ON poi_alerts USING GIN(voice_settings);
CREATE INDEX idx_poi_alerts_user_response ON poi_alerts USING GIN(user_response);
CREATE INDEX idx_poi_alerts_metadata ON poi_alerts USING GIN(metadata);

-- Triggers
CREATE TRIGGER trigger_poi_alerts_updated_at
  BEFORE UPDATE ON poi_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_users_updated_at();
```

### drive_media
Stores media files associated with drive sessions.

```sql
CREATE TABLE drive_media (
  media_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drive_id UUID NOT NULL REFERENCES drive_sessions(drive_id) ON DELETE CASCADE,
  poi_id UUID REFERENCES pois(poi_id) ON DELETE SET NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('image', 'audio', 'video')),
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_drive_media_drive_id ON drive_media(drive_id);
CREATE INDEX idx_drive_media_poi_id ON drive_media(poi_id);
CREATE INDEX idx_drive_media_type ON drive_media(type);
CREATE INDEX idx_drive_media_created_at ON drive_media(created_at);
CREATE INDEX idx_drive_media_metadata ON drive_media USING GIN(metadata);
```

## Supporting Tables

### user_favorites
Stores user's favorite POIs.

```sql
CREATE TABLE user_favorites (
  favorite_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES users(profile_id) ON DELETE CASCADE,
  poi_id UUID NOT NULL REFERENCES pois(poi_id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(profile_id, poi_id)
);

-- Indexes
CREATE INDEX idx_user_favorites_profile_id ON user_favorites(profile_id);
CREATE INDEX idx_user_favorites_poi_id ON user_favorites(poi_id);
CREATE INDEX idx_user_favorites_created_at ON user_favorites(created_at);
```

### voice_presets
Stores available voice, persona, and accent options.

```sql
CREATE TABLE voice_presets (
  preset_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(20) NOT NULL CHECK (type IN ('voice', 'persona', 'accent')),
  preset_id VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  characteristics JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(type, preset_id)
);

-- Indexes
CREATE INDEX idx_voice_presets_type ON voice_presets(type);
CREATE INDEX idx_voice_presets_preset_id ON voice_presets(preset_id);
CREATE INDEX idx_voice_presets_is_active ON voice_presets(is_active);
CREATE INDEX idx_voice_presets_characteristics ON voice_presets USING GIN(characteristics);
```

### system_settings
Stores system-wide configuration settings.

```sql
CREATE TABLE system_settings (
  setting_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  is_encrypted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_system_settings_key ON system_settings(key);
CREATE INDEX idx_system_settings_value ON system_settings USING GIN(value);
```

## Views

### active_drives
View of currently active drive sessions.

```sql
CREATE VIEW active_drives AS
SELECT 
  ds.drive_id,
  ds.profile_id,
  u.assistant_voice_id,
  u.narrator_voice_id,
  u.narration_persona_id,
  u.narration_accent_id,
  ds.start_time,
  ds.total_distance,
  ds.total_duration,
  ds.settings
FROM drive_sessions ds
JOIN users u ON ds.profile_id = u.profile_id
WHERE ds.status = 'active';
```

### user_drive_statistics
View of user drive statistics.

```sql
CREATE VIEW user_drive_statistics AS
SELECT 
  u.profile_id,
  COUNT(ds.drive_id) as total_drives,
  COALESCE(SUM(ds.total_duration), 0) as total_duration,
  COALESCE(SUM(ds.total_distance), 0) as total_distance,
  COALESCE(AVG(ds.total_duration), 0) as avg_duration,
  MAX(ds.start_time) as last_drive_date
FROM users u
LEFT JOIN drive_sessions ds ON u.profile_id = ds.profile_id
GROUP BY u.profile_id;
```

### poi_engagement_stats
View of POI engagement statistics.

```sql
CREATE VIEW poi_engagement_stats AS
SELECT 
  pa.poi_id,
  p.name as poi_name,
  p.category,
  COUNT(pa.alert_id) as total_alerts,
  COUNT(CASE WHEN pa.status = 'acknowledged' THEN 1 END) as acknowledged_count,
  COUNT(CASE WHEN pa.status = 'skipped' THEN 1 END) as skipped_count,
  COUNT(CASE WHEN pa.status = 'favorited' THEN 1 END) as favorited_count,
  ROUND(
    COUNT(CASE WHEN pa.status = 'acknowledged' THEN 1 END)::DECIMAL / 
    NULLIF(COUNT(pa.alert_id), 0) * 100, 2
  ) as engagement_rate
FROM poi_alerts pa
JOIN pois p ON pa.poi_id = p.poi_id
GROUP BY pa.poi_id, p.name, p.category;
```

## Functions

### Calculate Distance
Function to calculate distance between two points.

```sql
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 DECIMAL(10, 8),
  lon1 DECIMAL(11, 8),
  lat2 DECIMAL(10, 8),
  lon2 DECIMAL(11, 8)
) RETURNS DECIMAL(10, 2) AS $$
BEGIN
  RETURN ST_Distance(
    ST_Point(lon1, lat1)::geography,
    ST_Point(lon2, lat2)::geography
  ) / 1609.344; -- Convert meters to miles
END;
$$ LANGUAGE plpgsql;
```

### Find Nearby POIs
Function to find POIs within a given radius.

```sql
CREATE OR REPLACE FUNCTION find_nearby_pois(
  user_lat DECIMAL(10, 8),
  user_lon DECIMAL(11, 8),
  radius_miles DECIMAL(10, 2),
  limit_count INTEGER DEFAULT 50
) RETURNS TABLE (
  poi_id UUID,
  name VARCHAR(255),
  category VARCHAR(100),
  distance DECIMAL(10, 2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.poi_id,
    p.name,
    p.category,
    calculate_distance(user_lat, user_lon, p.latitude, p.longitude) as distance
  FROM pois p
  WHERE ST_DWithin(
    ST_Point(user_lon, user_lat)::geography,
    ST_Point(p.longitude, p.latitude)::geography,
    radius_miles * 1609.344 -- Convert miles to meters
  )
  ORDER BY distance
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;
```

### Cleanup Old Data
Function to clean up old data based on retention policies.

```sql
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER := 0;
BEGIN
  -- Delete old conversation turns (1 year)
  DELETE FROM conversation_turns 
  WHERE timestamp < NOW() - INTERVAL '1 year';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Delete old POI alerts (6 months)
  DELETE FROM poi_alerts 
  WHERE created_at < NOW() - INTERVAL '6 months';
  
  -- Delete old drive media (1 year)
  DELETE FROM drive_media 
  WHERE created_at < NOW() - INTERVAL '1 year';
  
  -- Archive old completed drives (2 years)
  UPDATE drive_sessions 
  SET status = 'archived'
  WHERE status = 'completed' 
    AND end_time < NOW() - INTERVAL '2 years';
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
```

## Triggers

### Update Timestamps
Trigger to automatically update the updated_at timestamp.

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at column
CREATE TRIGGER trigger_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_drive_sessions_updated_at
  BEFORE UPDATE ON drive_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_poi_alerts_updated_at
  BEFORE UPDATE ON poi_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_voice_presets_updated_at
  BEFORE UPDATE ON voice_presets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_system_settings_updated_at
  BEFORE UPDATE ON system_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## Constraints

### Check Constraints
- Alert minutes must be between 1 and 25
- Detour preference must be valid enum value
- Drive status must be valid enum value
- Conversation role must be valid enum value
- POI relevance must be between 0 and 1
- Media type must be valid enum value

### Foreign Key Constraints
- All foreign keys have proper CASCADE or SET NULL behavior
- Referential integrity maintained across all relationships
- Orphaned records prevented by foreign key constraints

### Unique Constraints
- User profile IDs are unique
- Drive session IDs are unique
- Conversation turn IDs are unique
- POI IDs are unique
- Alert IDs are unique
- Media IDs are unique
- User-POI favorite combinations are unique

## Performance Optimizations

### Indexing Strategy
- Primary keys have clustered indexes
- Foreign keys have non-clustered indexes
- Frequently queried columns have indexes
- JSONB columns have GIN indexes for efficient querying
- Spatial columns have GiST indexes for location queries
- Full-text search columns have GIN indexes

### Query Optimization
- Views for complex queries
- Functions for reusable logic
- Proper JOIN strategies
- Efficient WHERE clauses
- Appropriate LIMIT clauses

### Partitioning Strategy
- Partition conversation_turns by timestamp (monthly)
- Partition poi_alerts by created_at (monthly)
- Partition drive_media by created_at (monthly)
- Use table inheritance for partitioning

## Security Considerations

### Row Level Security
- Users can only access their own data
- Admin users have full access
- API users have limited access
- Proper RLS policies implemented

### Data Encryption
- Sensitive data encrypted at rest
- API keys encrypted in system_settings
- User location data encrypted
- Voice data encrypted

### Access Control
- Database users with minimal privileges
- Application-specific database users
- No direct database access for end users
- Audit logging for all data access

## Backup and Recovery

### Backup Strategy
- Daily full backups
- Hourly incremental backups
- Point-in-time recovery capability
- Cross-region backup replication

### Recovery Procedures
- Documented recovery procedures
- Tested recovery scenarios
- RTO/RPO targets defined
- Automated recovery where possible

## Monitoring and Maintenance

### Performance Monitoring
- Query performance monitoring
- Index usage monitoring
- Connection pool monitoring
- Storage usage monitoring

### Maintenance Tasks
- Regular VACUUM and ANALYZE
- Index maintenance
- Statistics updates
- Data cleanup procedures

### Alerting
- Database performance alerts
- Storage usage alerts
- Connection limit alerts
- Error rate alerts
