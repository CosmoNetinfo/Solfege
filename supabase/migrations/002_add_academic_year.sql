-- Add current_academic_year column to schools
ALTER TABLE schools 
ADD COLUMN IF NOT EXISTS current_academic_year TEXT DEFAULT '2024-2025';
