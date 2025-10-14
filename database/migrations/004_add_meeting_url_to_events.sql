-- Migration: Add meeting_url field to events table for online meetings
-- This enables automatic Jitsi Meet link generation for online events

ALTER TABLE events ADD COLUMN IF NOT EXISTS meeting_url TEXT;

-- Create index for faster queries when filtering online events
CREATE INDEX IF NOT EXISTS idx_events_meeting_url ON events(meeting_url) WHERE meeting_url IS NOT NULL;

COMMENT ON COLUMN events.meeting_url IS 'URL da reunião online (Jitsi Meet) quando event_type = online';
