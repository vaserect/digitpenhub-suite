-- Form Templates: starter forms for the Form Builder module

CREATE TABLE IF NOT EXISTS form_templates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category      TEXT NOT NULL,
  name          TEXT NOT NULL,
  description   TEXT,
  fields_json   JSONB NOT NULL DEFAULT '[]',
  sort_order    INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO form_templates (category, name, description, fields_json, sort_order) VALUES
('Contact', 'Simple Contact Form', 'Basic name, email, message contact form.', '[
  {"id":"fld_name","type":"text","label":"Full name","placeholder":"Your name","required":true},
  {"id":"fld_email","type":"email","label":"Email address","placeholder":"your@email.com","required":true},
  {"id":"fld_phone","type":"phone","label":"Phone number","placeholder":"+234...","required":false},
  {"id":"fld_msg","type":"textarea","label":"Message","placeholder":"How can we help you?","required":true}
]'::jsonb, 0),
('Contact', 'Support Ticket Form', 'Customer support intake form with priority selection.', '[
  {"id":"fld_st_name","type":"text","label":"Your name","placeholder":"","required":true},
  {"id":"fld_st_email","type":"email","label":"Email address","placeholder":"","required":true},
  {"id":"fld_st_subject","type":"text","label":"Subject","placeholder":"Brief summary of the issue","required":true},
  {"id":"fld_st_cat","type":"select","label":"Category","placeholder":"","options":["Billing","Technical","Account","Feature request","Other"],"required":true},
  {"id":"fld_st_priority","type":"select","label":"Priority","placeholder":"","options":["Low","Medium","High","Urgent"],"required":true},
  {"id":"fld_st_desc","type":"textarea","label":"Description","placeholder":"Please describe the issue in detail","required":true}
]'::jsonb, 1),
('Lead Generation', 'Quote Request Form', 'Capture sales-ready leads requesting a quote.', '[
  {"id":"fld_qr_name","type":"text","label":"Full name","placeholder":"","required":true},
  {"id":"fld_qr_company","type":"text","label":"Company name","placeholder":"","required":true},
  {"id":"fld_qr_email","type":"email","label":"Work email","placeholder":"","required":true},
  {"id":"fld_qr_phone","type":"phone","label":"Phone number","placeholder":"","required":false},
  {"id":"fld_qr_service","type":"select","label":"Service needed","placeholder":"","options":["Consulting","Development","Design","Marketing","Other"],"required":true},
  {"id":"fld_qr_budget","type":"select","label":"Budget range","placeholder":"","options":["Under ₦500k","₦500k–₦2M","₦2M–₦5M","₦5M+"],"required":false},
  {"id":"fld_qr_desc","type":"textarea","label":"Tell us about your project","placeholder":"","required":true}
]'::jsonb, 2),
('Lead Generation', 'Demo Request Form', 'Schedule a product demo or walkthrough.', '[
  {"id":"fld_dr_name","type":"text","label":"Full name","placeholder":"","required":true},
  {"id":"fld_dr_email","type":"email","label":"Work email","placeholder":"","required":true},
  {"id":"fld_dr_company","type":"text","label":"Company name","placeholder":"","required":true},
  {"id":"fld_dr_size","type":"select","label":"Team size","placeholder":"","options":["Just me","2–5","6–20","21–50","50+"],"required":false},
  {"id":"fld_dr_interest","type":"select","label":"Most interested in","placeholder":"","options":["CRM","Marketing","AI tools","Website builder","Analytics","Everything"],"required":true},
  {"id":"fld_dr_date","type":"text","label":"Preferred date","placeholder":"e.g. Monday morning","required":false}
]'::jsonb, 3),
('Event Registration', 'Webinar Registration Form', 'Register attendees for a live webinar.', '[
  {"id":"fld_wr_name","type":"text","label":"Full name","placeholder":"","required":true},
  {"id":"fld_wr_email","type":"email","label":"Email address","placeholder":"","required":true},
  {"id":"fld_wr_company","type":"text","label":"Company","placeholder":"","required":false},
  {"id":"fld_wr_role","type":"text","label":"Job title","placeholder":"","required":false},
  {"id":"fld_wr_question","type":"textarea","label":"Questions for the speaker","placeholder":"Optional — submit a question in advance","required":false}
]'::jsonb, 4),
('Event Registration', 'Event Registration Form', 'Register for a workshop, conference, or meetup.', '[
  {"id":"fld_er_name","type":"text","label":"Full name","placeholder":"","required":true},
  {"id":"fld_er_email","type":"email","label":"Email address","placeholder":"","required":true},
  {"id":"fld_er_phone","type":"phone","label":"Phone number","placeholder":"","required":false},
  {"id":"fld_er_company","type":"text","label":"Company or organization","placeholder":"","required":false},
  {"id":"fld_er_diet","type":"select","label":"Dietary requirements","placeholder":"","options":["None","Vegetarian","Vegan","Gluten-free","Other"],"required":false}
]'::jsonb, 5),
('Survey & Feedback', 'Customer Satisfaction Survey', 'Post-service NPS-style feedback form.', '[
  {"id":"fld_cs_score","type":"select","label":"How would you rate your experience?","placeholder":"","options":["1 — Very poor","2","3","4","5 — Excellent"],"required":true},
  {"id":"fld_cs_improve","type":"textarea","label":"What could we improve?","placeholder":"","required":false},
  {"id":"fld_cs_recommend","type":"select","label":"Would you recommend us to a friend?","placeholder":"","options":["Definitely","Probably","Not sure","Probably not","Definitely not"],"required":true},
  {"id":"fld_cs_name","type":"text","label":"Your name (optional)","placeholder":"","required":false}
]'::jsonb, 6),
('Survey & Feedback', 'Net Promoter Score (NPS) Survey', 'Simple single-question NPS survey with follow-up.', '[
  {"id":"fld_nps_score","type":"select","label":"How likely are you to recommend us to a friend or colleague?","placeholder":"","options":["0 — Not at all likely","1","2","3","4","5","6","7","8","9","10 — Extremely likely"],"required":true},
  {"id":"fld_nps_reason","type":"textarea","label":"What is the main reason for your score?","placeholder":"","required":false}
]'::jsonb, 7),
('Job Application', 'Job Application Form', 'Standard job application with resume upload field.', '[
  {"id":"fld_ja_name","type":"text","label":"Full name","placeholder":"","required":true},
  {"id":"fld_ja_email","type":"email","label":"Email address","placeholder":"","required":true},
  {"id":"fld_ja_phone","type":"phone","label":"Phone number","placeholder":"","required":true},
  {"id":"fld_ja_role","type":"text","label":"Position applying for","placeholder":"","required":true},
  {"id":"fld_ja_exp","type":"textarea","label":"Relevant experience","placeholder":"Brief summary of your relevant background","required":true},
  {"id":"fld_ja_link","type":"text","label":"Portfolio or LinkedIn URL","placeholder":"https://","required":false}
]'::jsonb, 8),
('Booking Request', 'Consultation Booking Form', 'Book a free consultation or discovery call.', '[
  {"id":"fld_cb_name","type":"text","label":"Full name","placeholder":"","required":true},
  {"id":"fld_cb_email","type":"email","label":"Email address","placeholder":"","required":true},
  {"id":"fld_cb_phone","type":"phone","label":"Phone number","placeholder":"","required":false},
  {"id":"fld_cb_service","type":"select","label":"Service interested in","placeholder":"","options":["Business consulting","Marketing","Web development","Design","Other"],"required":true},
  {"id":"fld_cb_date","type":"text","label":"Preferred date and time","placeholder":"e.g. Tuesday afternoon","required":false},
  {"id":"fld_cb_note","type":"textarea","label":"Anything you would like us to prepare?","placeholder":"","required":false}
]'::jsonb, 9),
('Enrollment', 'Newsletter Signup Form', 'Simple email capture for newsletter subscriptions.', '[
  {"id":"fld_ns_name","type":"text","label":"First name","placeholder":"","required":true},
  {"id":"fld_ns_email","type":"email","label":"Email address","placeholder":"","required":true},
  {"id":"fld_ns_interest","type":"select","label":"Areas of interest","placeholder":"","options":["Product updates","Tips & tutorials","Industry news","Offers & promotions"],"required":false}
]'::jsonb, 10),
('Enrollment', 'Waitlist Signup Form', 'Capture interest for a product or service launch.', '[
  {"id":"fld_wl_name","type":"text","label":"Full name","placeholder":"","required":true},
  {"id":"fld_wl_email","type":"email","label":"Email address","placeholder":"","required":true},
  {"id":"fld_wl_company","type":"text","label":"Company","placeholder":"","required":false},
  {"id":"fld_wl_role","type":"text","label":"Job title","placeholder":"","required":false},
  {"id":"fld_wl_hear","type":"select","label":"How did you hear about us?","placeholder":"","options":["Social media","Search","Friend or colleague","Blog","Podcast","Other"],"required":false}
]'::jsonb, 11),
('Intake', 'Patient Intake Form', 'Medical or dental new-patient intake form.', '[
  {"id":"fld_pi_name","type":"text","label":"Full name","placeholder":"","required":true},
  {"id":"fld_pi_dob","type":"text","label":"Date of birth","placeholder":"DD/MM/YYYY","required":true},
  {"id":"fld_pi_email","type":"email","label":"Email address","placeholder":"","required":true},
  {"id":"fld_pi_phone","type":"phone","label":"Phone number","placeholder":"","required":true},
  {"id":"fld_pi_address","type":"text","label":"Home address","placeholder":"","required":false},
  {"id":"fld_pi_reason","type":"textarea","label":"Reason for visit","placeholder":"Please describe your symptoms or reason for the appointment","required":true},
  {"id":"fld_pi_medications","type":"textarea","label":"Current medications","placeholder":"List any medications you are currently taking","required":false},
  {"id":"fld_pi_consent","type":"checkbox","label":"Consent","placeholder":"I consent to the collection and use of my health information for treatment purposes"}
]'::jsonb, 12),
('Intake', 'Client Onboarding Form', 'New client information collection form.', '[
  {"id":"fld_co_name","type":"text","label":"Full name","placeholder":"","required":true},
  {"id":"fld_co_company","type":"text","label":"Company name","placeholder":"","required":true},
  {"id":"fld_co_email","type":"email","label":"Work email","placeholder":"","required":true},
  {"id":"fld_co_phone","type":"phone","label":"Phone number","placeholder":"","required":false},
  {"id":"fld_co_website","type":"text","label":"Website URL","placeholder":"https://","required":false},
  {"id":"fld_co_scope","type":"textarea","label":"Project scope","placeholder":"Brief description of the work to be done","required":true},
  {"id":"fld_co_timing","type":"text","label":"Expected timeline","placeholder":"","required":false}
]'::jsonb, 13),
('Enrollment', 'Course Enrollment Form', 'Enroll students in a course or program.', '[
  {"id":"fld_ce_name","type":"text","label":"Full name","placeholder":"","required":true},
  {"id":"fld_ce_email","type":"email","label":"Email address","placeholder":"","required":true},
  {"id":"fld_ce_phone","type":"phone","label":"Phone number","placeholder":"","required":true},
  {"id":"fld_ce_course","type":"select","label":"Course selecting","placeholder":"","options":["Beginner","Intermediate","Advanced","Masterclass"],"required":true},
  {"id":"fld_ce_exp","type":"textarea","label":"Prior experience","placeholder":"Do you have any previous experience in this area?","required":false}
]'::jsonb, 14)
ON CONFLICT DO NOTHING;
