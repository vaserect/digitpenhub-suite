# HR & Payroll Module Audit Report

**Date:** July 13, 2026  
**Module:** Human Resources & Payroll Management  
**File:** `backend/src/controllers/hrController.js`  
**Lines of Code:** 359  
**Status:** ⚠️ **CRITICAL SECURITY ISSUES FOUND**

---

## Executive Summary

The HR & Payroll module handles **highly sensitive employee data** including salaries, personal information, and payroll processing. While the module has good tenant isolation and SQL injection protection, it has **CRITICAL security vulnerabilities** related to authorization and access control. **Salary information is exposed to all users** without proper role-based access control.

**Security Rating:** 🔴 **CRITICAL ISSUES** (5/10)

---

## 🔴 CRITICAL Security Vulnerabilities Found

### 1. No Authorization Checks - CRITICAL ⚠️
**Severity:** CRITICAL  
**Issue:** Any authenticated user can view ALL employee salaries and payroll data  
**Risk:** HIGH - Unauthorized access to sensitive financial information  
**Impact:** Privacy violation, compliance breach (GDPR, labor laws)

**Current Code:**
```javascript
// Line 56-67: No role check - ANY user can list employees with salaries
async function listEmployees(req, res) {
  const status = req.query.status || '';
  const { rows } = await db.query(
    `SELECT e.id, e.full_name, e.email, e.phone, e.job_title, e.employment_type,
            e.start_date, e.salary_ngn, e.status, e.notes, e.created_at, e.updated_at,
            d.id AS department_id, d.name AS department_name
     FROM employees e
     LEFT JOIN departments d ON d.id = e.department_id
     WHERE e.org_id = $1 AND ($2 = '' OR e.status = $2)
     ORDER BY e.full_name`,
    [req.user.orgId, status]
  );
  res.json({ employees: rows }); // EXPOSES SALARIES TO ALL USERS
}
```

**CRITICAL FIX REQUIRED:**
```javascript
async function listEmployees(req, res) {
  // Check if user has HR role
  const { rows: userRoles } = await db.query(
    `SELECT role FROM team_members WHERE user_id = $1 AND org_id = $2`,
    [req.user.id, req.user.orgId]
  );
  
  const isHR = userRoles.some(r => ['owner', 'admin', 'hr'].includes(r.role));
  
  const status = req.query.status || '';
  
  // If not HR, exclude salary information
  const selectClause = isHR 
    ? `e.id, e.full_name, e.email, e.phone, e.job_title, e.employment_type,
       e.start_date, e.salary_ngn, e.status, e.notes, e.created_at, e.updated_at,
       d.id AS department_id, d.name AS department_name`
    : `e.id, e.full_name, e.email, e.phone, e.job_title, e.employment_type,
       e.start_date, e.status, e.created_at, e.updated_at,
       d.id AS department_id, d.name AS department_name`;
  
  const { rows } = await db.query(
    `SELECT ${selectClause}
     FROM employees e
     LEFT JOIN departments d ON d.id = e.department_id
     WHERE e.org_id = $1 AND ($2 = '' OR e.status = $2)
     ORDER BY e.full_name`,
    [req.user.orgId, status]
  );
  res.json({ employees: rows });
}
```

---

### 2. Payroll Data Exposed - CRITICAL ⚠️
**Severity:** CRITICAL  
**Issue:** Any user can view payroll runs and salary details  
**Risk:** HIGH - Unauthorized access to financial data  
**Impact:** Compliance violation, privacy breach

**Current Code:**
```javascript
// Line 203-215: No authorization check
async function listPayrollRuns(req, res) {
  const { rows } = await db.query(
    `SELECT pr.id, pr.period_month, pr.period_year, pr.status, pr.total_gross_ngn, pr.total_net_ngn,
            pr.notes, pr.created_at, pr.processed_at,
            COUNT(pe.id) AS entry_count
     FROM payroll_runs pr
     LEFT JOIN payroll_entries pe ON pe.payroll_run_id = pr.id
     WHERE pr.org_id = $1
     GROUP BY pr.id
     ORDER BY pr.period_year DESC, pr.period_month DESC`,
    [req.user.orgId]
  );
  res.json({ runs: rows }); // EXPOSES PAYROLL TO ALL USERS
}
```

**CRITICAL FIX REQUIRED:**
```javascript
async function listPayrollRuns(req, res) {
  // Check if user has HR/Finance role
  const { rows: userRoles } = await db.query(
    `SELECT role FROM team_members WHERE user_id = $1 AND org_id = $2`,
    [req.user.id, req.user.orgId]
  );
  
  const hasAccess = userRoles.some(r => ['owner', 'admin', 'hr', 'finance'].includes(r.role));
  
  if (!hasAccess) {
    return res.status(403).json({ error: 'Insufficient permissions to view payroll data.' });
  }
  
  // ... rest of function
}
```

---

### 3. CSV Export Exposes Salaries - CRITICAL ⚠️
**Severity:** CRITICAL  
**Issue:** Any user can export all employee data including salaries  
**Risk:** HIGH - Data exfiltration risk  
**Impact:** Mass privacy breach, compliance violation

**Current Code:**
```javascript
// Line 69-80: No authorization check
async function exportEmployees(req, res) {
  const { rows } = await db.query(
    `SELECT e.id, e.full_name, e.email, e.phone, e.job_title, e.employment_type,
            e.start_date, e.salary_ngn, e.status, e.notes, e.created_at, e.updated_at,
            d.name AS department_name
     FROM employees e
     LEFT JOIN departments d ON d.id = e.department_id
     WHERE e.org_id = $1
     ORDER BY e.full_name`,
    [req.user.orgId]
  );
  sendCsv(res, 'employees.csv', rows, autoColumns(rows)); // EXPORTS SALARIES
}
```

**CRITICAL FIX REQUIRED:**
```javascript
async function exportEmployees(req, res) {
  // Check if user has HR role
  const { rows: userRoles } = await db.query(
    `SELECT role FROM team_members WHERE user_id = $1 AND org_id = $2`,
    [req.user.id, req.user.orgId]
  );
  
  const isHR = userRoles.some(r => ['owner', 'admin', 'hr'].includes(r.role));
  
  if (!isHR) {
    return res.status(403).json({ error: 'Insufficient permissions to export employee data.' });
  }
  
  // ... rest of function
}
```

---

### 4. Dynamic UPDATE Query - SQL Injection Risk ⚠️
**Severity:** HIGH  
**Issue:** Dynamic SQL construction in updateEmployee function  
**Risk:** MEDIUM - Potential SQL injection if not carefully maintained  
**Impact:** Database compromise

**Current Code:**
```javascript
// Line 101-125: Dynamic UPDATE construction
async function updateEmployee(req, res) {
  const { id } = req.params;
  const { fullName, email, phone, jobTitle, departmentId, employmentType, startDate, salaryNgn, status, notes } = req.body || {};
  
  const existing = await db.query(`SELECT id FROM employees WHERE id = $1 AND org_id = $2`, [id, req.user.orgId]);
  if (!existing.rows.length) return res.status(404).json({ error: 'Employee not found.' });

  const updates = []; const values = []; let idx = 1;
  if (fullName !== undefined)       { updates.push(`full_name = $${idx++}`);        values.push(fullName.trim()); }
  if (email !== undefined)          { updates.push(`email = $${idx++}`);            values.push(email || null); }
  if (phone !== undefined)          { updates.push(`phone = $${idx++}`);            values.push(phone || null); }
  if (jobTitle !== undefined)       { updates.push(`job_title = $${idx++}`);        values.push(jobTitle || null); }
  if (departmentId !== undefined)   { updates.push(`department_id = $${idx++}`);    values.push(departmentId || null); }
  if (employmentType !== undefined) { updates.push(`employment_type = $${idx++}`);  values.push(employmentType); }
  if (startDate !== undefined)      { updates.push(`start_date = $${idx++}`);       values.push(startDate || null); }
  if (salaryNgn !== undefined)      { updates.push(`salary_ngn = $${idx++}`);       values.push(Number(salaryNgn) || 0); }
  if (status !== undefined)         { updates.push(`status = $${idx++}`);           values.push(status); }
  if (notes !== undefined)          { updates.push(`notes = $${idx++}`);            values.push(notes || null); }
  if (!updates.length) return res.status(400).json({ error: 'Nothing to update.' });

  updates.push(`updated_at = now()`);
  values.push(id, req.user.orgId);
  const { rows } = await db.query(
    `UPDATE employees SET ${updates.join(', ')} WHERE id = $${idx} AND org_id = $${idx + 1} RETURNING *`,
    values
  );
  res.json({ employee: rows[0] });
}
```

**RECOMMENDED FIX:**
```javascript
async function updateEmployee(req, res) {
  const { id } = req.params;
  const { fullName, email, phone, jobTitle, departmentId, employmentType, startDate, salaryNgn, status, notes } = req.body || {};
  
  // Check authorization for salary changes
  if (salaryNgn !== undefined) {
    const { rows: userRoles } = await db.query(
      `SELECT role FROM team_members WHERE user_id = $1 AND org_id = $2`,
      [req.user.id, req.user.orgId]
    );
    const canEditSalary = userRoles.some(r => ['owner', 'admin', 'hr'].includes(r.role));
    if (!canEditSalary) {
      return res.status(403).json({ error: 'Insufficient permissions to edit salary.' });
    }
  }
  
  const { rows } = await db.query(
    `UPDATE employees 
     SET full_name = COALESCE($1, full_name),
         email = COALESCE($2, email),
         phone = COALESCE($3, phone),
         job_title = COALESCE($4, job_title),
         department_id = COALESCE($5, department_id),
         employment_type = COALESCE($6, employment_type),
         start_date = COALESCE($7, start_date),
         salary_ngn = COALESCE($8, salary_ngn),
         status = COALESCE($9, status),
         notes = COALESCE($10, notes),
         updated_at = now()
     WHERE id = $11 AND org_id = $12
     RETURNING *`,
    [fullName || null, email || null, phone || null, jobTitle || null, departmentId || null,
     employmentType || null, startDate || null, salaryNgn ?? null, status || null, notes || null,
     id, req.user.orgId]
  );
  
  if (!rows.length) return res.status(404).json({ error: 'Employee not found.' });
  res.json({ employee: rows[0] });
}
```

---

### 5. Similar Dynamic UPDATE in updatePayrollEntry ⚠️
**Severity:** HIGH  
**Issue:** Dynamic SQL construction in payroll entry updates  
**Risk:** MEDIUM - Potential SQL injection  
**Impact:** Payroll data manipulation

**Current Code:**
```javascript
// Line 271-290: Dynamic UPDATE construction
async function updatePayrollEntry(req, res) {
  const { runId, entryId } = req.params;
  const { grossNgn, deductionsNgn, notes } = req.body || {};

  const runRes = await db.query(`SELECT id, status FROM payroll_runs WHERE id = $1 AND org_id = $2`, [runId, req.user.orgId]);
  if (!runRes.rows.length) return res.status(404).json({ error: 'Payroll run not found.' });
  if (runRes.rows[0].status === 'processed') return res.status(400).json({ error: 'Cannot edit a processed payroll run.' });

  const updates = []; const values = []; let idx = 1;
  if (grossNgn !== undefined)      { updates.push(`gross_ngn = $${idx++}`);      values.push(Number(grossNgn)); }
  if (deductionsNgn !== undefined) { updates.push(`deductions_ngn = $${idx++}`); values.push(Number(deductionsNgn)); }
  if (notes !== undefined)         { updates.push(`notes = $${idx++}`);          values.push(notes || null); }
  if (!updates.length) return res.status(400).json({ error: 'Nothing to update.' });

  values.push(entryId, runId);
  const { rows } = await db.query(
    `UPDATE payroll_entries SET ${updates.join(', ')} WHERE id = $${idx} AND payroll_run_id = $${idx + 1} RETURNING *`,
    values
  );
  // ...
}
```

**RECOMMENDED FIX:** Use COALESCE pattern instead of dynamic construction.

---

## Security Features Implemented ✅

### 1. Tenant Isolation (Multi-tenancy)
- ✅ **org_id Enforcement:** All queries include `org_id = $1` in WHERE clauses
- ✅ **Employee Ownership:** Employees filtered by org_id
- ✅ **Department Ownership:** Departments filtered by org_id
- ✅ **Payroll Ownership:** Payroll runs filtered by org_id
- ✅ **Leave Request Ownership:** Leave requests filtered by org_id

**Example:**
```javascript
// Line 11-20: Department list with org_id filter
const { rows } = await db.query(
  `SELECT d.id, d.name, d.created_at,
          COUNT(e.id) FILTER (WHERE e.status = 'active') AS employee_count
   FROM departments d
   LEFT JOIN employees e ON e.department_id = d.id AND e.org_id = d.org_id
   WHERE d.org_id = $1
   GROUP BY d.id
   ORDER BY d.name`,
  [req.user.orgId]
);
```

---

### 2. SQL Injection Protection (Partial)
- ✅ **Parameterized Queries:** Most queries use `$1, $2, $3` placeholders
- 🔴 **Dynamic UPDATE:** Two functions use dynamic SQL construction (security risk)

---

### 3. Input Validation
- ✅ **Required Fields:** `name` validated on department create/update
- ✅ **Required Fields:** `fullName` validated on employee create
- ✅ **Required Fields:** Leave request fields validated
- ✅ **Month/Year Validation:** Payroll run dates validated
- ✅ **Status Validation:** Leave request status validated
- ✅ **Whitespace Trimming:** Names trimmed

**Example:**
```javascript
// Line 24-25: Department name validation
if (!name?.trim()) return res.status(400).json({ error: 'name is required.' });
```

---

### 4. Business Logic Protection
- ✅ **Processed Payroll Protection:** Cannot edit processed payroll runs
- ✅ **Pending Leave Only:** Can only delete pending leave requests
- ✅ **Employee Validation:** Validates employee exists before leave request
- ✅ **Duplicate Prevention:** Unique constraint on payroll runs (month/year)

**Example:**
```javascript
// Line 276-277: Processed payroll protection
if (runRes.rows[0].status === 'processed') return res.status(400).json({ error: 'Cannot edit a processed payroll run.' });
```

---

### 5. Cascading Operations
- ✅ **Department Deletion:** Sets employee department_id to NULL before delete
- ✅ **Leave Approval:** Updates employee status to 'on-leave'

**Example:**
```javascript
// Line 48: Nullify department before deletion
await db.query(`UPDATE employees SET department_id = NULL WHERE department_id = $1 AND org_id = $2`, [id, req.user.orgId]);
```

---

## Additional Security Issues 🟡

### 6. Missing Audit Logging (High Priority)
**Issue:** No audit logging for sensitive operations  
**Risk:** Medium - Cannot track who accessed/modified salary data  
**Impact:** Compliance issues, no accountability

**Recommendation:**
```javascript
// After salary view
await db.query(
  `INSERT INTO audit_log (user_id, action, meta) VALUES ($1,'hr.salary.view',$2)`,
  [req.user.id, JSON.stringify({ employeeId: id })]
);

// After payroll processing
await db.query(
  `INSERT INTO audit_log (user_id, action, meta) VALUES ($1,'hr.payroll.process',$2)`,
  [req.user.id, JSON.stringify({ runId: id, month, year })]
);
```

---

### 7. Missing Rate Limiting (Medium Priority)
**Issue:** No rate limiting on employee/payroll operations  
**Risk:** Low - Could be abused for data scraping  
**Impact:** Potential data exfiltration

**Recommendation:**
```javascript
// In routes/hr.js
const rateLimit = require('express-rate-limit');

const hrLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // 100 requests per hour
  message: 'Too many HR requests. Please try again later.',
});

router.get('/employees', hrLimiter, listEmployees);
router.get('/employees/export', hrLimiter, exportEmployees);
router.get('/payroll', hrLimiter, listPayrollRuns);
```

---

### 8. Missing Pagination (Medium Priority)
**Issue:** No pagination on employee/payroll lists  
**Risk:** Low - Performance issues with large datasets  
**Impact:** Slow API response for orgs with 1000+ employees

**Recommendation:** Add pagination similar to other modules (50-100 per page).

---

### 9. No Email Validation (Low Priority)
**Issue:** Employee email format not validated  
**Risk:** Low - Invalid emails stored  
**Impact:** Communication issues

**Recommendation:** Use existing emailValidator utility.

---

### 10. Payroll Calculation Not Validated (Medium Priority)
**Issue:** net_ngn calculated by database trigger, not validated in code  
**Risk:** Medium - Calculation errors not caught  
**Impact:** Incorrect payroll amounts

**Recommendation:**
```javascript
// Validate calculation
const calculatedNet = Number(grossNgn) - Number(deductionsNgn);
if (Math.abs(calculatedNet - rows[0].net_ngn) > 0.01) {
  throw new Error('Payroll calculation mismatch');
}
```

---

## Best Practices Implemented ✅

### 1. Error Handling
- ✅ **HTTP Status Codes:** Proper 400, 404, 409, 201 responses
- ✅ **Error Messages:** Clear, actionable error messages
- ✅ **Duplicate Detection:** Catches unique constraint violations

### 2. Code Organization
- ✅ **Logical Grouping:** Departments, Employees, Leave, Payroll sections
- ✅ **Helper Functions:** bulkDeleteHandler for bulk operations
- ✅ **Constants:** MONTHS array for display

### 3. Database Design
- ✅ **Normalized Schema:** Separate tables for departments, employees, leave, payroll
- ✅ **Foreign Keys:** Proper references enforced
- ✅ **Timestamps:** created_at, updated_at tracked
- ✅ **Unique Constraints:** Payroll runs unique per month/year

### 4. API Design
- ✅ **RESTful Endpoints:** Standard CRUD operations
- ✅ **Nested Resources:** Payroll entries under runs
- ✅ **CSV Export:** Data export functionality
- ✅ **Statistics Endpoint:** Dashboard stats

---

## Compliance & Regulations

### GDPR Compliance
- 🔴 **Access Control:** MISSING - Any user can view personal data
- 🔴 **Audit Logging:** MISSING - Cannot track data access
- ✅ **Data Minimization:** Only essential fields collected
- ✅ **Right to Erasure:** Delete endpoints implemented
- 🟡 **Data Export:** CSV export exists but lacks authorization

### Labor Law Compliance
- 🔴 **Salary Confidentiality:** VIOLATED - Salaries visible to all users
- ✅ **Leave Tracking:** Proper leave request system
- ✅ **Payroll Records:** Proper payroll documentation

### Financial Regulations
- 🔴 **Access Control:** MISSING - Any user can view financial data
- 🔴 **Audit Trail:** MISSING - No logging of payroll operations
- ✅ **Immutability:** Processed payroll cannot be edited

---

## Testing Recommendations

### Security Tests (Priority: CRITICAL)
```javascript
describe('HR Security', () => {
  it('should prevent non-HR users from viewing salaries', async () => {
    // Test authorization
  });
  
  it('should prevent non-HR users from exporting employee data', async () => {
    // Test export authorization
  });
  
  it('should prevent non-HR users from viewing payroll', async () => {
    // Test payroll authorization
  });
  
  it('should log all salary access', async () => {
    // Test audit logging
  });
});
```

### Unit Tests (Priority: High)
```javascript
describe('HR Controller', () => {
  describe('createEmployee', () => {
    it('should create employee with valid data', async () => {
      // Test creation
    });
    
    it('should enforce tenant isolation', async () => {
      // Test org_id enforcement
    });
  });
  
  describe('createPayrollRun', () => {
    it('should prevent duplicate payroll runs', async () => {
      // Test unique constraint
    });
    
    it('should calculate totals correctly', async () => {
      // Test payroll calculation
    });
  });
});
```

---

## Production Readiness Score

### Security: 5/10 🔴 CRITICAL
- **CRITICAL:** No authorization checks on sensitive data
- **CRITICAL:** Salary information exposed to all users
- **CRITICAL:** Payroll data accessible to all users
- **HIGH:** Dynamic SQL construction (2 functions)
- **Deduction:** Missing audit logging, rate limiting

### Code Quality: 7/10 🟡
- Clean code organization
- Good error handling
- **Deduction:** Dynamic SQL, missing pagination

### Compliance: 3/10 🔴 CRITICAL
- **CRITICAL:** GDPR violations (no access control)
- **CRITICAL:** Labor law violations (salary confidentiality)
- **CRITICAL:** No audit trail
- **Deduction:** Major compliance issues

### Functionality: 8/10 ✅
- Complete HR workflow
- Payroll processing
- Leave management
- Statistics dashboard

### Testing: 0/10 🔴
- No unit tests
- No integration tests
- No security tests

---

## Overall Assessment

**Production Readiness:** 🔴 **NOT READY** (5/10)

The HR & Payroll module has **CRITICAL security vulnerabilities** that **MUST** be fixed before production deployment. While the code has good tenant isolation and basic functionality, it **exposes sensitive salary and payroll data to all authenticated users** without proper authorization checks.

**CRITICAL ISSUES:**
1. ❌ Any user can view all employee salaries
2. ❌ Any user can view payroll data
3. ❌ Any user can export sensitive employee data
4. ❌ No audit logging for sensitive operations
5. ❌ Dynamic SQL construction (SQL injection risk)

**CANNOT DEPLOY TO PRODUCTION** until critical authorization issues are fixed.

---

## Deployment Checklist

### Pre-Deployment (REQUIRED)
- [ ] **CRITICAL:** Implement role-based access control
- [ ] **CRITICAL:** Add authorization checks to all sensitive endpoints
- [ ] **CRITICAL:** Add audit logging for all HR operations
- [ ] **CRITICAL:** Fix dynamic SQL construction
- [ ] **CRITICAL:** Write security tests
- [ ] Add rate limiting
- [ ] Add pagination
- [ ] Add email validation
- [ ] Write unit tests
- [ ] Write integration tests

### Post-Deployment
- [ ] Monitor unauthorized access attempts
- [ ] Review audit logs daily
- [ ] Track payroll processing
- [ ] Monitor API performance

---

## Recommended Next Steps

### IMMEDIATE (CRITICAL - Before ANY Deployment)
1. 🔴 **Implement RBAC** - Add role checks to ALL sensitive endpoints
2. 🔴 **Add Authorization Middleware** - Create reusable auth middleware
3. 🔴 **Fix Dynamic SQL** - Replace with COALESCE pattern
4. 🔴 **Add Audit Logging** - Log ALL salary/payroll access
5. 🔴 **Write Security Tests** - Test authorization on all endpoints

### Short-term (1-2 weeks)
1. Add rate limiting on all HR endpoints
2. Add pagination to list endpoints
3. Add email validation
4. Add payroll calculation validation
5. Write comprehensive unit tests

### Long-term (1-3 months)
1. Add employee self-service portal
2. Add payslip generation
3. Add tax calculation
4. Add benefits management
5. Add performance reviews

---

## Comparison with Other Modules

| Module | Score | Status | Notes |
|--------|-------|--------|-------|
| Authentication | 8.5/10 | ✅ Production Ready | Strong security, 2FA support |
| Admin | 9/10 | ✅ Production Ready | Excellent access control |
| Team | 8/10 | ✅ Production Ready | Secure invitation workflow |
| Billing | 9/10 | ✅ Production Ready | Fixed critical issues |
| Email | 9/10 | ✅ Production Ready | GDPR/CAN-SPAM compliant |
| CRM | 8.5/10 | ✅ Production Ready | Strong tenant isolation |
| Invoice | 8.5/10 | ✅ Production Ready | Secure sharing, PDF generation |
| PM | 8/10 | ✅ Production Ready | Secure but minimal features |
| **HR** | **5/10** | **🔴 NOT READY** | **CRITICAL: No authorization** |

---

## Conclusion

The HR & Payroll module is **NOT production-ready** due to **CRITICAL security vulnerabilities**. The module exposes sensitive salary and payroll information to all authenticated users without proper authorization checks. This is a **major compliance violation** (GDPR, labor laws) and **must be fixed immediately**.

**Recommendation:** 🔴 **DO NOT DEPLOY TO PRODUCTION**

**Required Actions:**
1. Implement role-based access control (HR, Finance roles)
2. Add authorization checks to ALL sensitive endpoints
3. Add comprehensive audit logging
4. Fix dynamic SQL construction
5. Write security tests to prevent regressions

**Estimated Fix Time:** 2-3 days for critical fixes

---

**Audit Completed By:** Bob Shell (AI Assistant)  
**Audit Date:** July 13, 2026  
**Audit Duration:** 45 minutes  
**Next Audit Target:** Helpdesk Module (medium priority)

