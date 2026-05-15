-- AssetZentri Partner Portal Seed Data

-- Clear existing data
TRUNCATE deal_comments, checklist_steps, team_members, collateral_items, collateral_folders, deals, users, partners RESTART IDENTITY CASCADE;

-- Partners
INSERT INTO partners (id, name, tier, country, psm, joined_date, contact_name, contact_email, contact_phone, is_custom) VALUES
('p1', 'Northwave Technologies', 'Gold', 'United Kingdom', 'Riya Chen', '2026-03-12', 'Alex Morgan', 'alex@northwave-tech.com', '+44 20 7946 0320', FALSE),
('p2', 'Atlas IT Group', 'Gold', 'United States', 'Daniel Reyes', '2025-09-04', 'Maya Holloway', 'maya.h@atlasit.com', '+1 415 555 0198', FALSE),
('p3', 'Helvetia Cloud Partners', 'Silver', 'Switzerland', 'Aanya Patel', '2025-11-18', 'Lukas Fischer', 'lukas.f@helvetiacloud.ch', '+41 44 555 0192', FALSE),
('p4', 'Pacific Rim Tech', 'Silver', 'Singapore', 'Aanya Patel', '2026-01-07', 'Wei-Lin Tan', 'wtan@pacificrimtech.sg', '+65 6555 0147', FALSE),
('p5', 'Lumen Consulting', 'Bronze', 'India', 'Vikram Singh', '2026-04-01', 'Anjali Krishnan', 'anjali.k@lumenconsulting.in', '+91 98 5555 0173', FALSE);

-- Users (passwords are bcrypt of 'password')
INSERT INTO users (email, password_hash, name, role, persona, partner_id) VALUES
('alex@northwave-tech.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Alex Morgan', 'Partner Admin', 'partner', 'p1'),
('ops@vistrive.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Riya Chen', 'Vistrive Partner Ops', 'admin', NULL);

-- Deals for p1 (Northwave Technologies)
INSERT INTO deals (deal_id, partner_id, company, country, contact, email, phone, devices, tier, close_date, stage, source, notes, registered_date, protection_days) VALUES
('DR-1042', 'p1', 'Northwind Industries', 'United Kingdom', 'Sarah Bellweather', 'sarah.b@northwind.co.uk', '+44 20 7946 0501', 320, 'Standard', '2026-07-31', 'Qualified', 'Direct', 'IT refresh cycle starting Q3. Decision by end of July.', '2026-03-15', 78),
('DR-1056', 'p1', 'Helio Robotics', 'Germany', 'Markus Weiss', 'm.weiss@heliorobotics.de', '+49 89 5555 0247', 180, 'Standard', '2026-08-15', 'Demo', 'Event', 'Met at Hamburg Tech Expo. Strong interest in automated discovery.', '2026-03-29', 73),
('DR-1071', 'p1', 'Coastline Health', 'United Kingdom', 'Dr. Priya Ramachandran', 'p.ramachandran@coastlinehealth.nhs.uk', '+44 117 496 0835', 850, 'Premium', '2026-09-30', 'Proposal', 'Referral', 'NHS trust with strict compliance needs. Requires DSPT alignment.', '2026-04-12', 58),
('DR-1089', 'p1', 'Apex Manufacturing', 'United States', 'James O''Brien', 'jobrien@apexmfg.com', '+1 312 555 0289', 240, 'Standard', '2026-05-01', 'Won', 'Direct', 'Closed and live. Reference customer confirmed.', '2026-04-28', 0);

-- Deals for p2 (Atlas IT Group)
INSERT INTO deals (deal_id, partner_id, company, country, contact, email, devices, tier, close_date, stage, source, notes, registered_date, protection_days) VALUES
('DR-1018', 'p2', 'Pioneer Logistics', 'United States', 'Rachel Kim', 'rkim@pioneerlogistics.com', 420, 'Standard', '2025-12-01', 'Won', 'Direct', 'Closed. 3-year contract signed.', '2025-10-02', 0),
('DR-1029', 'p2', 'Sterling Financial', 'United States', 'Tom Waverly', 't.waverly@sterlingfin.com', 600, 'Premium', '2026-01-15', 'Won', 'Referral', 'Closed. Annual prepay.', '2025-11-10', 0),
('DR-1051', 'p2', 'Cobalt Engineering', 'United States', 'Lisa Park', 'lpark@cobalteng.com', 280, 'Standard', '2026-08-01', 'Proposal', 'Direct', 'Final pricing discussion ongoing.', '2026-02-14', 42),
('DR-1063', 'p2', 'Brightwater Foods', 'United States', 'Marcus Chen', 'mchen@brightwaterfoods.com', 190, 'Standard', '2026-08-30', 'Demo', 'Event', 'Demo scheduled for next week.', '2026-03-22', 67),
('DR-1078', 'p2', 'Vertex BioPharma', 'United States', 'Dr. Sarah Goldstein', 'sgoldstein@vertexbio.com', 950, 'Premium', '2026-09-15', 'Qualified', 'Inbound', 'Large enterprise, complex procurement.', '2026-04-10', 84);

-- Deals for p3 (Helvetia Cloud Partners)
INSERT INTO deals (deal_id, partner_id, company, country, contact, email, devices, tier, close_date, stage, source, notes, registered_date, protection_days) VALUES
('DR-1037', 'p3', 'Alpine Insurance Group', 'Switzerland', 'Heinrich Müller', 'h.muller@alpineinsurance.ch', 340, 'Premium', '2026-08-15', 'Legal', 'Direct', 'Legal review in progress. Expected close Q3.', '2026-02-01', 51),
('DR-1062', 'p3', 'Genevoise Watchworks', 'Switzerland', 'Isabelle Rochat', 'i.rochat@genevoiseww.ch', 140, 'Standard', '2026-08-31', 'Demo', 'Referral', 'Luxury brand, bespoke requirements.', '2026-03-18', 68);

-- Deals for p4 (Pacific Rim Tech)
INSERT INTO deals (deal_id, partner_id, company, country, contact, email, devices, tier, close_date, stage, source, notes, registered_date, protection_days) VALUES
('DR-1074', 'p4', 'Marina Bay Logistics', 'Singapore', 'Kevin Lim', 'klim@marinabaylogistics.sg', 220, 'Standard', '2026-08-31', 'Qualified', 'Direct', 'Initial scoping call done. RFP expected.', '2026-04-05', 71);

-- Deal comments
INSERT INTO deal_comments (deal_id, author, text, created_at) VALUES
('DR-1042', 'Vistrive AE', 'Discovery call went well. Confirmed budget signed off in Q3.', '2026-03-20 14:32:00'),
('DR-1071', 'You', 'Customer asked about kill switch feature — confirmed Premium includes it.', '2026-04-15 10:15:00'),
('DR-1071', 'Vistrive AE', 'Sending updated proposal with annual prepay discount tomorrow.', '2026-04-16 16:45:00'),
('DR-1089', 'Vistrive AE', 'Contract signed. First invoice issued.', '2026-04-29 09:00:00');

-- Checklist steps for p1 (5/8 done)
INSERT INTO checklist_steps (partner_id, step_number, title, description, done) VALUES
('p1', 1, 'Complete company profile', 'Fill in your company details, logo, and contact information in the partner profile section.', TRUE),
('p1', 2, 'Upload company logo', 'Upload a high-resolution version of your company logo for co-branded materials.', TRUE),
('p1', 3, 'Accept Partner Agreement', 'Review and digitally sign the AssetZentri Partner Programme Agreement.', TRUE),
('p1', 4, 'Add team members', 'Invite your sales team to the partner portal so they can access resources and register deals.', TRUE),
('p1', 5, 'Watch product demo video', 'Complete the 45-minute AssetZentri platform walkthrough to understand core features and positioning.', TRUE),
('p1', 6, 'Download and review sales kit', 'Access the Sales Playbook, battlecards, and pricing guide from the Product Collaterals section.', FALSE),
('p1', 7, 'Pass partner knowledge check', 'Complete the 20-question online assessment to demonstrate platform knowledge. Minimum score: 80%.', FALSE),
('p1', 8, 'Submit territory plan', 'Submit your 90-day go-to-market plan including target verticals, pipeline targets, and key prospects.', FALSE);

-- Checklist steps for p2 (8/8 done)
INSERT INTO checklist_steps (partner_id, step_number, title, description, done) VALUES
('p2', 1, 'Complete company profile', 'Fill in your company details, logo, and contact information in the partner profile section.', TRUE),
('p2', 2, 'Upload company logo', 'Upload a high-resolution version of your company logo for co-branded materials.', TRUE),
('p2', 3, 'Accept Partner Agreement', 'Review and digitally sign the AssetZentri Partner Programme Agreement.', TRUE),
('p2', 4, 'Add team members', 'Invite your sales team to the partner portal so they can access resources and register deals.', TRUE),
('p2', 5, 'Watch product demo video', 'Complete the 45-minute AssetZentri platform walkthrough to understand core features and positioning.', TRUE),
('p2', 6, 'Download and review sales kit', 'Access the Sales Playbook, battlecards, and pricing guide from the Product Collaterals section.', TRUE),
('p2', 7, 'Pass partner knowledge check', 'Complete the 20-question online assessment to demonstrate platform knowledge. Minimum score: 80%.', TRUE),
('p2', 8, 'Submit territory plan', 'Submit your 90-day go-to-market plan including target verticals, pipeline targets, and key prospects.', TRUE);

-- Checklist steps for p3 (8/8 done)
INSERT INTO checklist_steps (partner_id, step_number, title, description, done) VALUES
('p3', 1, 'Complete company profile', 'Fill in your company details, logo, and contact information in the partner profile section.', TRUE),
('p3', 2, 'Upload company logo', 'Upload a high-resolution version of your company logo for co-branded materials.', TRUE),
('p3', 3, 'Accept Partner Agreement', 'Review and digitally sign the AssetZentri Partner Programme Agreement.', TRUE),
('p3', 4, 'Add team members', 'Invite your sales team to the partner portal so they can access resources and register deals.', TRUE),
('p3', 5, 'Watch product demo video', 'Complete the 45-minute AssetZentri platform walkthrough to understand core features and positioning.', TRUE),
('p3', 6, 'Download and review sales kit', 'Access the Sales Playbook, battlecards, and pricing guide from the Product Collaterals section.', TRUE),
('p3', 7, 'Pass partner knowledge check', 'Complete the 20-question online assessment to demonstrate platform knowledge. Minimum score: 80%.', TRUE),
('p3', 8, 'Submit territory plan', 'Submit your 90-day go-to-market plan including target verticals, pipeline targets, and key prospects.', TRUE);

-- Checklist steps for p4 (6/8 done)
INSERT INTO checklist_steps (partner_id, step_number, title, description, done) VALUES
('p4', 1, 'Complete company profile', 'Fill in your company details, logo, and contact information in the partner profile section.', TRUE),
('p4', 2, 'Upload company logo', 'Upload a high-resolution version of your company logo for co-branded materials.', TRUE),
('p4', 3, 'Accept Partner Agreement', 'Review and digitally sign the AssetZentri Partner Programme Agreement.', TRUE),
('p4', 4, 'Add team members', 'Invite your sales team to the partner portal so they can access resources and register deals.', TRUE),
('p4', 5, 'Watch product demo video', 'Complete the 45-minute AssetZentri platform walkthrough to understand core features and positioning.', TRUE),
('p4', 6, 'Download and review sales kit', 'Access the Sales Playbook, battlecards, and pricing guide from the Product Collaterals section.', TRUE),
('p4', 7, 'Pass partner knowledge check', 'Complete the 20-question online assessment to demonstrate platform knowledge. Minimum score: 80%.', FALSE),
('p4', 8, 'Submit territory plan', 'Submit your 90-day go-to-market plan including target verticals, pipeline targets, and key prospects.', FALSE);

-- Checklist steps for p5 (4/8 done)
INSERT INTO checklist_steps (partner_id, step_number, title, description, done) VALUES
('p5', 1, 'Complete company profile', 'Fill in your company details, logo, and contact information in the partner profile section.', TRUE),
('p5', 2, 'Upload company logo', 'Upload a high-resolution version of your company logo for co-branded materials.', TRUE),
('p5', 3, 'Accept Partner Agreement', 'Review and digitally sign the AssetZentri Partner Programme Agreement.', TRUE),
('p5', 4, 'Add team members', 'Invite your sales team to the partner portal so they can access resources and register deals.', TRUE),
('p5', 5, 'Watch product demo video', 'Complete the 45-minute AssetZentri platform walkthrough to understand core features and positioning.', FALSE),
('p5', 6, 'Download and review sales kit', 'Access the Sales Playbook, battlecards, and pricing guide from the Product Collaterals section.', FALSE),
('p5', 7, 'Pass partner knowledge check', 'Complete the 20-question online assessment to demonstrate platform knowledge. Minimum score: 80%.', FALSE),
('p5', 8, 'Submit territory plan', 'Submit your 90-day go-to-market plan including target verticals, pipeline targets, and key prospects.', FALSE);

-- Team members for p1 (Northwave Technologies)
INSERT INTO team_members (partner_id, name, email, role, status) VALUES
('p1', 'Alex Morgan', 'alex@northwave-tech.com', 'Admin', 'Active'),
('p1', 'Priya Sharma', 'priya@northwave-tech.com', 'Seller', 'Active'),
('p1', 'James Okonkwo', 'james@northwave-tech.com', 'Seller', 'Active'),
('p1', 'Mei Tanaka', 'mei@northwave-tech.com', 'Read-Only', 'Invited');

-- Team members for p2 (Atlas IT Group)
INSERT INTO team_members (partner_id, name, email, role, status) VALUES
('p2', 'Maya Holloway', 'maya.h@atlasit.com', 'Admin', 'Active'),
('p2', 'Devon Park', 'devon.p@atlasit.com', 'Seller', 'Active'),
('p2', 'Sara Linden', 'sara.l@atlasit.com', 'Seller', 'Active'),
('p2', 'Carlos Beck', 'carlos.b@atlasit.com', 'Seller', 'Active'),
('p2', 'Tara Wu', 'tara.w@atlasit.com', 'Seller', 'Active'),
('p2', 'Brendan Liu', 'brendan.l@atlasit.com', 'Seller', 'Invited'),
('p2', 'Ana Faria', 'ana.f@atlasit.com', 'Read-Only', 'Active');

-- Team members for p3 (Helvetia Cloud Partners)
INSERT INTO team_members (partner_id, name, email, role, status) VALUES
('p3', 'Lukas Fischer', 'lukas.f@helvetiacloud.ch', 'Admin', 'Active'),
('p3', 'Sofia Brunner', 'sofia.b@helvetiacloud.ch', 'Seller', 'Active'),
('p3', 'Hans Vogel', 'hans.v@helvetiacloud.ch', 'Seller', 'Active'),
('p3', 'Lara Keller', 'lara.k@helvetiacloud.ch', 'Read-Only', 'Active');

-- Team members for p4 (Pacific Rim Tech)
INSERT INTO team_members (partner_id, name, email, role, status) VALUES
('p4', 'Wei-Lin Tan', 'wtan@pacificrimtech.sg', 'Admin', 'Active'),
('p4', 'Arjun Mehta', 'arjun.m@pacificrimtech.sg', 'Seller', 'Active'),
('p4', 'Hiroshi Sato', 'hiroshi.s@pacificrimtech.sg', 'Seller', 'Invited');

-- Team members for p5 (Lumen Consulting)
INSERT INTO team_members (partner_id, name, email, role, status) VALUES
('p5', 'Anjali Krishnan', 'anjali.k@lumenconsulting.in', 'Admin', 'Active'),
('p5', 'Rohan Desai', 'rohan.d@lumenconsulting.in', 'Seller', 'Active');

-- Collateral folders
INSERT INTO collateral_folders (name, sort_order) VALUES
('Sales Playbooks', 1),
('Pricing & Tiers', 2),
('Battlecards', 3),
('Technical Documentation', 4),
('Case Studies', 5),
('Brand Assets', 6),
('Demo Resources', 7),
('Recorded Webinars', 8);

-- Collateral items
INSERT INTO collateral_items (folder_id, name, type, size, updated_label, must_read, must_read_note) VALUES
(1, 'ZentriCloud Master Sales Playbook', 'PDF', '8.2 MB', 'Updated Apr 2026', FALSE, NULL),
(1, 'Discovery Question Library', 'PDF', '420 KB', 'Updated Mar 2026', FALSE, NULL),
(1, 'Objection Handling Guide', 'PDF', '1.1 MB', 'Updated Mar 2026', FALSE, NULL),
(2, 'Subscription Tiers — Live One-Pager', 'PDF', '180 KB', 'Updated May 2026', TRUE, 'Q3 pricing refresh'),
(2, 'Pricing Calculator', 'XLSX', '95 KB', 'Updated Apr 2026', FALSE, NULL),
(3, 'Battlecard — ServiceNow ITAM', 'PDF', '320 KB', 'Updated Apr 2026', FALSE, NULL),
(3, 'Battlecard — Snipe-IT', 'PDF', '280 KB', 'Updated Apr 2026', FALSE, NULL),
(3, 'Battlecard — Lansweeper', 'PDF', '290 KB', 'Updated Apr 2026', FALSE, NULL),
(3, 'Battlecard — Flexera', 'PDF', '340 KB', 'Updated Apr 2026', FALSE, NULL),
(3, 'Battlecard — Ivanti Neurons', 'PDF', '310 KB', 'Updated Apr 2026', FALSE, NULL),
(4, 'REST API Reference', 'PDF', '2.4 MB', 'Updated May 2026', FALSE, NULL),
(4, 'Integration Guide — Azure AD / Entra ID', 'PDF', '1.6 MB', 'Updated Apr 2026', FALSE, NULL),
(4, 'Security & Compliance Overview', 'PDF', '1.8 MB', 'Updated Apr 2026', FALSE, NULL),
(5, 'Case Study — Mid-market SaaS', 'PDF', '720 KB', 'Updated Mar 2026', FALSE, NULL),
(5, 'Case Study — Healthcare org HIPAA', 'PDF', '680 KB', 'Updated Mar 2026', FALSE, NULL),
(6, 'AssetZentri logo lockup', 'ZIP', '2.1 MB', 'Updated Jan 2026', FALSE, NULL),
(6, 'Brand Guidelines v3', 'PDF', '4.2 MB', 'Updated Jan 2026', FALSE, NULL),
(7, 'Sandbox Access Guide', 'PDF', '380 KB', 'Updated Apr 2026', FALSE, NULL),
(7, 'Demo Script — Standard Tier', 'PDF', '210 KB', 'Updated Apr 2026', FALSE, NULL),
(7, 'ROI Calculator', 'XLSX', '110 KB', 'Updated Mar 2026', FALSE, NULL),
(8, 'Partner Briefing — AI Governance roadmap', 'MP4', '180 MB', 'Recorded Apr 2026', FALSE, NULL),
(8, 'Q2 Product Update', 'MP4', '210 MB', 'Recorded Mar 2026', FALSE, NULL);
