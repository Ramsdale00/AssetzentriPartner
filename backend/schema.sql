-- AssetZentri Partner Portal Schema

CREATE TABLE IF NOT EXISTS partners (
  id VARCHAR(10) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  tier VARCHAR(20) NOT NULL CHECK (tier IN ('Gold', 'Silver', 'Bronze')),
  country VARCHAR(100) NOT NULL,
  psm VARCHAR(255),
  joined_date DATE,
  contact_name VARCHAR(255),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  is_custom BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(100) NOT NULL,
  persona VARCHAR(20) NOT NULL CHECK (persona IN ('partner', 'admin')),
  partner_id VARCHAR(10) REFERENCES partners(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS deals (
  id SERIAL PRIMARY KEY,
  deal_id VARCHAR(20) UNIQUE NOT NULL,
  partner_id VARCHAR(10) REFERENCES partners(id),
  company VARCHAR(255) NOT NULL,
  country VARCHAR(100),
  contact VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  devices INTEGER NOT NULL DEFAULT 0,
  tier VARCHAR(20) NOT NULL DEFAULT 'Standard' CHECK (tier IN ('Standard', 'Premium')),
  close_date DATE,
  stage VARCHAR(50) NOT NULL DEFAULT 'Registered' CHECK (stage IN ('Registered', 'Qualified', 'Demo', 'Proposal', 'Legal', 'Won', 'Lost')),
  source VARCHAR(100) DEFAULT 'Direct',
  notes TEXT,
  registered_date DATE DEFAULT CURRENT_DATE,
  protection_days INTEGER DEFAULT 90,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS deal_comments (
  id SERIAL PRIMARY KEY,
  deal_id VARCHAR(20) REFERENCES deals(deal_id),
  author VARCHAR(255) NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS checklist_steps (
  id SERIAL PRIMARY KEY,
  partner_id VARCHAR(10) REFERENCES partners(id),
  step_number INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  done BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(partner_id, step_number)
);

CREATE TABLE IF NOT EXISTS team_members (
  id SERIAL PRIMARY KEY,
  partner_id VARCHAR(10) REFERENCES partners(id),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'Seller' CHECK (role IN ('Admin', 'Seller', 'Read-Only')),
  status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Invited')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS collateral_folders (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS collateral_items (
  id SERIAL PRIMARY KEY,
  folder_id INTEGER REFERENCES collateral_folders(id),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL,
  size VARCHAR(20),
  updated_label VARCHAR(100),
  must_read BOOLEAN DEFAULT FALSE,
  must_read_note TEXT
);
