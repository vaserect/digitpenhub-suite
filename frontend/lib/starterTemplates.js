function isoDate(offsetDays = 0) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

function leadField(id, type, label, placeholder, extra = {}) {
  return { id, type, label, placeholder, ...extra };
}

function formField(id, type, label, extra = {}) {
  return { id, type, label, ...extra };
}

export function getInvoiceStarterTemplates() {
  return [
    {
      id: 'monthly-retainer',
      category: 'Services',
      name: 'Monthly retainer invoice',
      description: 'A clean starting point for recurring service work with one fixed fee and a support add-on.',
      highlights: ['Net 7 due date', 'Service-focused line items', 'Short recurring-scope note'],
      draft: {
        status: 'draft',
        issueDate: isoDate(),
        dueDate: isoDate(7),
        taxRate: '7.5',
        notes: 'This invoice covers the agreed monthly service retainer and approved support work completed during this billing cycle.',
      },
      items: [
        { description: 'Monthly strategy and support retainer', quantity: 1, unitPrice: 250000 },
        { description: 'Reporting and stakeholder review meeting', quantity: 1, unitPrice: 35000 },
      ],
    },
    {
      id: 'project-milestone',
      category: 'Projects',
      name: 'Project milestone invoice',
      description: 'Useful for agencies or consultants billing approved stages of a larger project.',
      highlights: ['Milestone-based structure', 'Net 14 due date', 'Separate QA and revision line'],
      draft: {
        status: 'draft',
        issueDate: isoDate(),
        dueDate: isoDate(14),
        taxRate: '7.5',
        notes: 'Invoice for the current approved project milestone. Remaining milestones will be billed separately as they are completed.',
      },
      items: [
        { description: 'Discovery and UX workshop milestone', quantity: 1, unitPrice: 120000 },
        { description: 'Homepage and key page design milestone', quantity: 1, unitPrice: 180000 },
        { description: 'QA and revision round', quantity: 1, unitPrice: 45000 },
      ],
    },
    {
      id: 'product-delivery',
      category: 'Products',
      name: 'Product delivery invoice',
      description: 'Built for physical goods or stocked items with quantity-driven pricing.',
      highlights: ['Multi-unit product line', 'Shipping included', 'Short delivery note'],
      draft: {
        status: 'draft',
        issueDate: isoDate(),
        dueDate: isoDate(3),
        taxRate: '7.5',
        notes: 'Please confirm receipt once the order arrives so payment status can be updated immediately.',
      },
      items: [
        { description: 'Premium starter kit', quantity: 12, unitPrice: 18000 },
        { description: 'Delivery and handling', quantity: 1, unitPrice: 12000 },
      ],
    },
    {
      id: 'deposit-request',
      category: 'Projects',
      name: 'Deposit request invoice',
      description: 'A simple deposit-first invoice for reserving capacity before work begins.',
      highlights: ['Zero-tax deposit request', '5-day due date', 'Single clear billing line'],
      draft: {
        status: 'draft',
        issueDate: isoDate(),
        dueDate: isoDate(5),
        taxRate: '0',
        notes: 'A signed approval and deposit payment secure the project start date. The remaining balance will be invoiced against later milestones.',
      },
      items: [
        { description: '50% project deposit', quantity: 1, unitPrice: 300000 },
      ],
    },
  ];
}

export function getQuoteStarterTemplates() {
  return [
    {
      id: 'website-redesign',
      category: 'Creative & Web',
      name: 'Website redesign proposal',
      description: 'A practical quote structure for scoped redesign work with discovery, design, and handoff.',
      highlights: ['Three staged deliverables', '14-day validity', 'Client-ready proposal note'],
      draft: {
        discount: '0',
        taxRate: '7.5',
        validUntil: isoDate(14),
        notes: 'This quotation covers strategy, design, and handoff. Copywriting, hosting, and third-party licenses are excluded unless listed above.',
      },
      items: [
        { description: 'Discovery workshop and content plan', qty: 1, unitPrice: 125000 },
        { description: 'Website UI design for up to 6 pages', qty: 1, unitPrice: 240000 },
        { description: 'Development handoff and launch support', qty: 1, unitPrice: 135000 },
      ],
    },
    {
      id: 'social-media-retainer',
      category: 'Marketing',
      name: 'Monthly marketing retainer proposal',
      description: 'A recurring-services quote for businesses buying ongoing campaign support.',
      highlights: ['Retainer pricing', 'Add-on line items', 'Best for recurring work'],
      draft: {
        discount: '0',
        taxRate: '7.5',
        validUntil: isoDate(10),
        notes: 'This quotation assumes one monthly planning session, weekly execution, and a single approval round per deliverable.',
      },
      items: [
        { description: 'Monthly content strategy and planning', qty: 1, unitPrice: 85000 },
        { description: '12 social posts with design support', qty: 1, unitPrice: 140000 },
        { description: 'Campaign reporting and optimization', qty: 1, unitPrice: 55000 },
      ],
    },
    {
      id: 'event-photography',
      category: 'Events',
      name: 'Event coverage proposal',
      description: 'A tidy package for half-day events, live coverage, and edited delivery.',
      highlights: ['Event package structure', 'Coverage + editing split', 'Useful for weddings or corporate events'],
      draft: {
        discount: '0',
        taxRate: '0',
        validUntil: isoDate(7),
        notes: 'Travel outside the city, rush delivery, and printed albums can be added as separate options once event details are confirmed.',
      },
      items: [
        { description: 'Half-day event photography coverage', qty: 1, unitPrice: 180000 },
        { description: 'Edited highlight gallery delivery', qty: 1, unitPrice: 45000 },
        { description: 'On-site assistant coverage', qty: 1, unitPrice: 35000 },
      ],
    },
    {
      id: 'training-workshop',
      category: 'Training',
      name: 'Team workshop proposal',
      description: 'A straightforward quote for instructor-led corporate sessions with follow-up materials.',
      highlights: ['Workshop day rate', 'Materials line included', 'Good for HR or enablement teams'],
      draft: {
        discount: '0',
        taxRate: '7.5',
        validUntil: isoDate(21),
        notes: 'Pricing includes the live workshop, facilitator prep, and digital take-home materials for the participating team.',
      },
      items: [
        { description: 'Full-day facilitation session', qty: 1, unitPrice: 220000 },
        { description: 'Participant workbook and templates', qty: 15, unitPrice: 6000 },
        { description: 'Post-session action summary', qty: 1, unitPrice: 30000 },
      ],
    },
  ];
}

export function getLeadFormStarterTemplates() {
  return [
    {
      id: 'contact-us',
      category: 'Contact',
      name: 'General contact form',
      description: 'A simple website contact form for questions, support, or partnership requests.',
      highlights: ['Name, email, phone, message', 'Inquiry type dropdown', 'Good default for contact pages'],
      draft: {
        name: 'General Contact Form',
        thankYouMessage: 'Thanks for reaching out. We will get back to you shortly.',
        fields: [
          leadField('full_name', 'text', 'Full name', 'Jane Doe', { required: true }),
          leadField('email_address', 'email', 'Email address', 'jane@example.com', { required: true }),
          leadField('phone_number', 'phone', 'Phone number', '+234...', { required: false }),
          leadField('inquiry_type', 'select', 'What can we help with?', '', { required: true, options: ['General question', 'Support', 'Partnership', 'Pricing'] }),
          leadField('message', 'textarea', 'Message', 'Tell us what you need...', { required: true }),
        ],
      },
    },
    {
      id: 'quote-request',
      category: 'Sales',
      name: 'Quote request form',
      description: 'A stronger starting point for collecting budget and scope before sending a proposal.',
      highlights: ['Service selection', 'Budget range', 'Timeline prompt'],
      draft: {
        name: 'Quote Request Form',
        thankYouMessage: 'Thanks. We will review your request and send a tailored quote.',
        fields: [
          leadField('full_name', 'text', 'Full name', 'Jane Doe', { required: true }),
          leadField('business_name', 'text', 'Business name', 'Acme Studio', { required: false }),
          leadField('email_address', 'email', 'Email address', 'jane@example.com', { required: true }),
          leadField('phone_number', 'phone', 'Phone number', '+234...', { required: false }),
          leadField('service_needed', 'select', 'Service needed', '', { required: true, options: ['Website design', 'Branding', 'Marketing support', 'Training'] }),
          leadField('budget_range', 'select', 'Estimated budget', '', { required: true, options: ['Under ₦250,000', '₦250,000 - ₦500,000', '₦500,000 - ₦1,000,000', 'Above ₦1,000,000'] }),
          leadField('timeline', 'select', 'Preferred timeline', '', { required: true, options: ['ASAP', 'Within 2 weeks', 'This month', 'Next quarter'] }),
          leadField('project_details', 'textarea', 'Project details', 'Share the outcome you need, any references, and deadlines.', { required: true }),
        ],
      },
    },
    {
      id: 'demo-request',
      category: 'Sales',
      name: 'Demo request form',
      description: 'Useful for SaaS or product teams that need a bit of qualification before booking a meeting.',
      highlights: ['Company + team size', 'Use case capture', 'Sales-ready intake'],
      draft: {
        name: 'Demo Request Form',
        thankYouMessage: 'Thanks. We will reach out with a demo time that fits your team.',
        fields: [
          leadField('full_name', 'text', 'Full name', 'Jane Doe', { required: true }),
          leadField('work_email', 'email', 'Work email', 'jane@company.com', { required: true }),
          leadField('company_name', 'text', 'Company name', 'Company Ltd', { required: true }),
          leadField('team_size', 'select', 'Team size', '', { required: true, options: ['1-5', '6-20', '21-50', '51-200', '200+'] }),
          leadField('primary_use_case', 'textarea', 'Primary use case', 'What problem are you trying to solve?', { required: true }),
        ],
      },
    },
    {
      id: 'event-inquiry',
      category: 'Events',
      name: 'Event inquiry form',
      description: 'A practical intake form for venues, planners, or event vendors.',
      highlights: ['Event date + type', 'Guest count', 'Follow-up message included'],
      draft: {
        name: 'Event Inquiry Form',
        thankYouMessage: 'Thanks for your inquiry. We will confirm availability and next steps shortly.',
        fields: [
          leadField('contact_name', 'text', 'Contact name', 'Jane Doe', { required: true }),
          leadField('email_address', 'email', 'Email address', 'jane@example.com', { required: true }),
          leadField('phone_number', 'phone', 'Phone number', '+234...', { required: true }),
          leadField('event_type', 'select', 'Event type', '', { required: true, options: ['Wedding', 'Corporate event', 'Birthday', 'Private dinner', 'Other'] }),
          leadField('event_date', 'text', 'Preferred event date', 'e.g. 14 August 2026', { required: true }),
          leadField('guest_count', 'select', 'Estimated guests', '', { required: true, options: ['Under 30', '30-75', '76-150', '151+'] }),
          leadField('event_notes', 'textarea', 'Tell us more', 'Share your venue, style, or any special requests.', { required: false }),
        ],
      },
    },
  ];
}

export function getSurveyFormStarterTemplates() {
  return [
    {
      id: 'customer-feedback',
      category: 'Feedback',
      name: 'Customer feedback survey',
      description: 'A post-purchase or post-service survey with one simple branch for unhappy respondents.',
      highlights: ['Rating + recommend question', 'Conditional improvement field', 'Good for support or delivery follow-ups'],
      draft: {
        name: 'Customer Feedback Survey',
        description: 'Collect quick feedback after a service or purchase.',
        status: 'active',
        submitMessage: 'Thanks for the feedback. We appreciate you taking the time.',
        fields: [
          formField('full_name', 'text', 'Full name', { required: false }),
          formField('email_address', 'email', 'Email address', { required: false }),
          formField('overall_rating', 'select', 'How would you rate your experience?', {
            required: true,
            options: ['5 - Excellent', '4 - Good', '3 - Average', '2 - Poor', '1 - Very Poor'],
          }),
          formField('what_worked_well', 'textarea', 'What worked well?', { required: true }),
          formField('would_recommend', 'radio', 'Would you recommend us?', {
            required: true,
            options: ['Yes', 'No'],
          }),
          formField('improvement_needed', 'textarea', 'What should we improve?', {
            required: false,
            showIf: { fieldId: 'would_recommend', value: 'No' },
          }),
        ],
      },
    },
    {
      id: 'event-registration',
      category: 'Events',
      name: 'Event registration form',
      description: 'A compact registration flow for workshops, webinars, or in-person events.',
      highlights: ['Attendance mode branch', 'Dietary request field', 'Great default for mixed virtual/in-person events'],
      draft: {
        name: 'Event Registration Form',
        description: 'Register attendees and capture their format preference.',
        status: 'active',
        submitMessage: 'You are registered. We will email the next steps shortly.',
        fields: [
          formField('full_name', 'text', 'Full name', { required: true }),
          formField('email_address', 'email', 'Email address', { required: true }),
          formField('phone_number', 'phone', 'Phone number', { required: false }),
          formField('attendance_mode', 'radio', 'How will you attend?', {
            required: true,
            options: ['In person', 'Virtual'],
          }),
          formField('organization', 'text', 'Organization', { required: false }),
          formField('dietary_requirements', 'textarea', 'Dietary requirements', {
            required: false,
            showIf: { fieldId: 'attendance_mode', value: 'In person' },
          }),
          formField('questions', 'textarea', 'Questions for the host', { required: false }),
        ],
      },
    },
    {
      id: 'consultation-intake',
      category: 'Sales',
      name: 'Consultation intake form',
      description: 'A stronger lead-qualification template for service businesses before a discovery call.',
      highlights: ['Goal + team context', 'Callback branch', 'Good for consultants and agencies'],
      draft: {
        name: 'Consultation Intake Form',
        description: 'Gather context before a discovery call or sales consultation.',
        status: 'active',
        submitMessage: 'Thanks. We will review your answers and reach out with the best next step.',
        fields: [
          formField('full_name', 'text', 'Full name', { required: true }),
          formField('email_address', 'email', 'Email address', { required: true }),
          formField('company_name', 'text', 'Company name', { required: false }),
          formField('team_size', 'select', 'Team size', {
            required: true,
            options: ['Solo', '2-5', '6-20', '21-50', '51+'],
          }),
          formField('primary_goal', 'textarea', 'What are you trying to achieve?', { required: true }),
          formField('needs_callback', 'radio', 'Would you like a callback?', {
            required: true,
            options: ['Yes', 'No'],
          }),
          formField('callback_number', 'phone', 'Best callback number', {
            required: false,
            showIf: { fieldId: 'needs_callback', value: 'Yes' },
          }),
        ],
      },
    },
    {
      id: 'application-form',
      category: 'Applications',
      name: 'Program application form',
      description: 'A reusable application flow for cohorts, grants, internships, or volunteer programs.',
      highlights: ['Motivation questions', 'Availability date', 'Structured application intake'],
      draft: {
        name: 'Program Application Form',
        description: 'Collect structured applications for your next cohort or opportunity.',
        status: 'draft',
        submitMessage: 'Thanks for applying. We will review your submission and contact you soon.',
        fields: [
          formField('full_name', 'text', 'Full name', { required: true }),
          formField('email_address', 'email', 'Email address', { required: true }),
          formField('phone_number', 'phone', 'Phone number', { required: false }),
          formField('current_role', 'text', 'Current role or occupation', { required: true }),
          formField('why_apply', 'textarea', 'Why are you applying?', { required: true }),
          formField('availability_date', 'date', 'When can you start?', { required: true }),
        ],
      },
    },
  ];
}

export function getReportStarterTemplates() {
  return [
    {
      id: 'revenue-pulse',
      category: 'Finance',
      module: 'revenue',
      name: 'Monthly revenue pulse',
      description: 'Tracks paid invoice revenue by month so owners can spot momentum and seasonality quickly.',
      highlights: ['12-month revenue trend', 'Invoice count included', 'Best for weekly ops reviews'],
    },
    {
      id: 'expense-watch',
      category: 'Finance',
      module: 'expenses',
      name: 'Expense watch report',
      description: 'Shows monthly spend totals and transaction volume to catch spikes before they turn into budget problems.',
      highlights: ['Month-over-month spend', 'Transaction count', 'Useful for finance check-ins'],
    },
    {
      id: 'lead-funnel',
      category: 'Marketing',
      module: 'leads',
      name: 'Lead funnel snapshot',
      description: 'Summarizes leads by status so sales and marketing can see where prospects are getting stuck.',
      highlights: ['Pipeline status counts', 'Quick demand-health view', 'Good for pipeline meetings'],
    },
    {
      id: 'customer-growth',
      category: 'Growth',
      module: 'customers',
      name: 'Customer growth tracker',
      description: 'Shows how many customers were added each month, which makes retention and growth conversations easier.',
      highlights: ['Monthly customer adds', '12-period trend', 'Simple board-level update'],
    },
    {
      id: 'inventory-value',
      category: 'Operations',
      module: 'inventory',
      name: 'Inventory value snapshot',
      description: 'Breaks down stock count and estimated inventory value by category.',
      highlights: ['Inventory value by category', 'Stock count included', 'Useful for restock planning'],
    },
    {
      id: 'support-workload',
      category: 'Support',
      module: 'helpdesk',
      name: 'Support queue workload',
      description: 'Highlights ticket volume by status and priority so the team can rebalance workload quickly.',
      highlights: ['Status + priority mix', 'Great for support standups', 'Flags queue pressure quickly'],
    },
    {
      id: 'task-balance',
      category: 'Operations',
      module: 'tasks',
      name: 'Task throughput check',
      description: 'A compact view of work-in-progress versus completed tasks across the team.',
      highlights: ['Task status mix', 'Useful for team leads', 'Good weekly delivery pulse'],
    },
  ];
}
