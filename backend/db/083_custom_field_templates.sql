-- Custom Fields Engine: Field Templates (Phase 3)
-- Pre-built field sets for common industries and use cases

CREATE TABLE IF NOT EXISTS custom_field_templates (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  description       TEXT,
  category          TEXT NOT NULL, -- 'crm', 'sales', 'hr', 'real_estate', 'healthcare', etc.
  record_type       TEXT NOT NULL, -- Which record type this template applies to
  is_system         BOOLEAN NOT NULL DEFAULT false, -- System templates can't be deleted
  fields            JSONB NOT NULL DEFAULT '[]', -- Array of field definitions
  usage_count       INT NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_custom_field_templates_category 
ON custom_field_templates(category, record_type);

CREATE INDEX IF NOT EXISTS idx_custom_field_templates_system 
ON custom_field_templates(is_system) WHERE is_system = true;

-- Seed system templates
INSERT INTO custom_field_templates (name, description, category, record_type, is_system, fields) VALUES
-- CRM / Sales Templates
('Real Estate Contact Fields', 'Essential fields for real estate contacts including property preferences and budget', 'real_estate', 'crm_contact', true, '[
  {"key": "property_type", "label": "Property Type", "fieldType": "select", "options": ["House", "Apartment", "Condo", "Land", "Commercial"], "required": false},
  {"key": "budget_min", "label": "Budget Min", "fieldType": "currency", "currencyCode": "USD", "required": false},
  {"key": "budget_max", "label": "Budget Max", "fieldType": "currency", "currencyCode": "USD", "required": false},
  {"key": "preferred_location", "label": "Preferred Location", "fieldType": "location", "required": false},
  {"key": "bedrooms", "label": "Bedrooms", "fieldType": "number", "required": false},
  {"key": "move_in_date", "label": "Move-in Date", "fieldType": "date", "required": false}
]'),

('E-commerce Customer Fields', 'Track customer preferences and purchase behavior', 'ecommerce', 'crm_contact', true, '[
  {"key": "customer_tier", "label": "Customer Tier", "fieldType": "select", "options": ["Bronze", "Silver", "Gold", "Platinum"], "required": false},
  {"key": "lifetime_value", "label": "Lifetime Value", "fieldType": "currency", "currencyCode": "USD", "required": false},
  {"key": "preferred_categories", "label": "Preferred Categories", "fieldType": "multiselect", "options": ["Electronics", "Fashion", "Home", "Sports", "Books"], "required": false},
  {"key": "loyalty_points", "label": "Loyalty Points", "fieldType": "number", "required": false},
  {"key": "referral_code", "label": "Referral Code", "fieldType": "text", "required": false}
]'),

('Healthcare Patient Fields', 'Essential patient information for healthcare providers', 'healthcare', 'crm_contact', true, '[
  {"key": "blood_type", "label": "Blood Type", "fieldType": "select", "options": ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"], "required": false},
  {"key": "allergies", "label": "Allergies", "fieldType": "text", "required": false},
  {"key": "emergency_contact", "label": "Emergency Contact", "fieldType": "phone", "required": true},
  {"key": "insurance_provider", "label": "Insurance Provider", "fieldType": "text", "required": false},
  {"key": "last_visit", "label": "Last Visit", "fieldType": "date", "required": false}
]'),

('SaaS Customer Fields', 'Track SaaS customer engagement and health', 'saas', 'crm_contact', true, '[
  {"key": "account_health", "label": "Account Health", "fieldType": "rating", "minValue": 1, "maxValue": 5, "required": false},
  {"key": "product_adoption", "label": "Product Adoption", "fieldType": "progress", "minValue": 0, "maxValue": 100, "required": false},
  {"key": "mrr", "label": "Monthly Recurring Revenue", "fieldType": "currency", "currencyCode": "USD", "required": false},
  {"key": "contract_end_date", "label": "Contract End Date", "fieldType": "date", "required": false},
  {"key": "primary_use_case", "label": "Primary Use Case", "fieldType": "text", "required": false}
]'),

-- HR Templates
('Employee Onboarding Fields', 'Essential fields for new employee onboarding', 'hr', 'hr_employee', true, '[
  {"key": "start_date", "label": "Start Date", "fieldType": "date", "required": true},
  {"key": "department", "label": "Department", "fieldType": "select", "options": ["Engineering", "Sales", "Marketing", "HR", "Finance", "Operations"], "required": true},
  {"key": "manager", "label": "Manager", "fieldType": "text", "required": true},
  {"key": "office_location", "label": "Office Location", "fieldType": "location", "required": false},
  {"key": "equipment_issued", "label": "Equipment Issued", "fieldType": "multiselect", "options": ["Laptop", "Monitor", "Keyboard", "Mouse", "Headset", "Phone"], "required": false},
  {"key": "onboarding_progress", "label": "Onboarding Progress", "fieldType": "progress", "minValue": 0, "maxValue": 100, "required": false}
]'),

('Performance Review Fields', 'Track employee performance and goals', 'hr', 'hr_employee', true, '[
  {"key": "performance_rating", "label": "Performance Rating", "fieldType": "rating", "minValue": 1, "maxValue": 5, "required": false},
  {"key": "last_review_date", "label": "Last Review Date", "fieldType": "date", "required": false},
  {"key": "next_review_date", "label": "Next Review Date", "fieldType": "date", "required": false},
  {"key": "goals_met", "label": "Goals Met", "fieldType": "progress", "minValue": 0, "maxValue": 100, "required": false},
  {"key": "promotion_eligible", "label": "Promotion Eligible", "fieldType": "checkbox", "required": false}
]'),

-- Education Templates
('Student Enrollment Fields', 'Track student information and enrollment details', 'education', 'student', true, '[
  {"key": "grade_level", "label": "Grade Level", "fieldType": "select", "options": ["K", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"], "required": true},
  {"key": "enrollment_date", "label": "Enrollment Date", "fieldType": "date", "required": true},
  {"key": "parent_email", "label": "Parent Email", "fieldType": "email", "required": true},
  {"key": "parent_phone", "label": "Parent Phone", "fieldType": "phone", "required": true},
  {"key": "special_needs", "label": "Special Needs", "fieldType": "text", "required": false},
  {"key": "gpa", "label": "GPA", "fieldType": "number", "required": false}
]'),

-- Project Management Templates
('Project Tracking Fields', 'Essential fields for project management', 'project_management', 'project', true, '[
  {"key": "project_status", "label": "Project Status", "fieldType": "select", "options": ["Planning", "In Progress", "On Hold", "Completed", "Cancelled"], "required": true},
  {"key": "completion_percentage", "label": "Completion %", "fieldType": "progress", "minValue": 0, "maxValue": 100, "required": false},
  {"key": "budget", "label": "Budget", "fieldType": "currency", "currencyCode": "USD", "required": false},
  {"key": "deadline", "label": "Deadline", "fieldType": "date", "required": false},
  {"key": "priority", "label": "Priority", "fieldType": "rating", "minValue": 1, "maxValue": 5, "required": false},
  {"key": "project_url", "label": "Project URL", "fieldType": "url", "required": false}
]'),

-- Inventory Templates
('Product Inventory Fields', 'Track product inventory and details', 'inventory', 'inventory_item', true, '[
  {"key": "sku", "label": "SKU", "fieldType": "text", "required": true},
  {"key": "cost_price", "label": "Cost Price", "fieldType": "currency", "currencyCode": "USD", "required": false},
  {"key": "selling_price", "label": "Selling Price", "fieldType": "currency", "currencyCode": "USD", "required": false},
  {"key": "reorder_level", "label": "Reorder Level", "fieldType": "number", "required": false},
  {"key": "supplier_url", "label": "Supplier URL", "fieldType": "url", "required": false},
  {"key": "warehouse_location", "label": "Warehouse Location", "fieldType": "location", "required": false}
]'),

-- Invoice Templates
('Invoice Custom Fields', 'Additional invoice tracking fields', 'finance', 'invoice', true, '[
  {"key": "po_number", "label": "PO Number", "fieldType": "text", "required": false},
  {"key": "payment_terms", "label": "Payment Terms", "fieldType": "select", "options": ["Net 15", "Net 30", "Net 60", "Due on Receipt"], "required": false},
  {"key": "discount_percent", "label": "Discount %", "fieldType": "percent", "required": false},
  {"key": "tax_rate", "label": "Tax Rate %", "fieldType": "percent", "required": false},
  {"key": "payment_url", "label": "Payment URL", "fieldType": "url", "required": false}
]'),

-- Task Management Templates
('Task Priority Fields', 'Enhanced task tracking and prioritization', 'productivity', 'task', true, '[
  {"key": "priority_score", "label": "Priority Score", "fieldType": "rating", "minValue": 1, "maxValue": 5, "required": false},
  {"key": "effort_estimate", "label": "Effort Estimate (hours)", "fieldType": "number", "required": false},
  {"key": "completion_rate", "label": "Completion Rate", "fieldType": "progress", "minValue": 0, "maxValue": 100, "required": false},
  {"key": "blocked_by", "label": "Blocked By", "fieldType": "text", "required": false},
  {"key": "related_url", "label": "Related URL", "fieldType": "url", "required": false}
]'),

-- Legal Templates
('Legal Case Fields', 'Track legal case information', 'legal', 'crm_contact', true, '[
  {"key": "case_number", "label": "Case Number", "fieldType": "text", "required": true},
  {"key": "case_type", "label": "Case Type", "fieldType": "select", "options": ["Civil", "Criminal", "Family", "Corporate", "IP"], "required": true},
  {"key": "court_date", "label": "Court Date", "fieldType": "date", "required": false},
  {"key": "case_value", "label": "Case Value", "fieldType": "currency", "currencyCode": "USD", "required": false},
  {"key": "case_status", "label": "Case Status", "fieldType": "select", "options": ["Open", "In Progress", "Settled", "Closed"], "required": false}
]'),

-- Nonprofit Templates
('Donor Management Fields', 'Track donor information and contributions', 'nonprofit', 'crm_contact', true, '[
  {"key": "donor_level", "label": "Donor Level", "fieldType": "select", "options": ["Bronze", "Silver", "Gold", "Platinum", "Diamond"], "required": false},
  {"key": "total_donated", "label": "Total Donated", "fieldType": "currency", "currencyCode": "USD", "required": false},
  {"key": "last_donation_date", "label": "Last Donation Date", "fieldType": "date", "required": false},
  {"key": "recurring_donor", "label": "Recurring Donor", "fieldType": "checkbox", "required": false},
  {"key": "preferred_cause", "label": "Preferred Cause", "fieldType": "text", "required": false}
]'),

-- Hospitality Templates
('Guest Management Fields', 'Track guest preferences and stays', 'hospitality', 'crm_contact', true, '[
  {"key": "guest_rating", "label": "Guest Rating", "fieldType": "rating", "minValue": 1, "maxValue": 5, "required": false},
  {"key": "room_preference", "label": "Room Preference", "fieldType": "select", "options": ["Single", "Double", "Suite", "Penthouse"], "required": false},
  {"key": "loyalty_tier", "label": "Loyalty Tier", "fieldType": "select", "options": ["Member", "Silver", "Gold", "Platinum"], "required": false},
  {"key": "special_requests", "label": "Special Requests", "fieldType": "text", "required": false},
  {"key": "last_stay_date", "label": "Last Stay Date", "fieldType": "date", "required": false}
]'),

-- Manufacturing Templates
('Quality Control Fields', 'Track product quality and inspections', 'manufacturing', 'inventory_item', true, '[
  {"key": "quality_score", "label": "Quality Score", "fieldType": "rating", "minValue": 1, "maxValue": 5, "required": false},
  {"key": "inspection_date", "label": "Inspection Date", "fieldType": "date", "required": false},
  {"key": "defect_rate", "label": "Defect Rate %", "fieldType": "percent", "required": false},
  {"key": "batch_number", "label": "Batch Number", "fieldType": "text", "required": false},
  {"key": "inspector_name", "label": "Inspector Name", "fieldType": "text", "required": false}
]')
ON CONFLICT DO NOTHING;

COMMENT ON TABLE custom_field_templates IS 'Pre-built field templates for common industries and use cases';
COMMENT ON COLUMN custom_field_templates.fields IS 'Array of field definition objects matching custom_field_definitions structure';
COMMENT ON COLUMN custom_field_templates.usage_count IS 'Number of times this template has been applied';
