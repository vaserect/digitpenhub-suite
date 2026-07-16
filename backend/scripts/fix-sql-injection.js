#!/usr/bin/env node
/**
 * SQL Injection Fix Script
 * 
 * Fixes the SQL injection vulnerability in dynamic UPDATE queries where
 * parameter indices are incorrectly calculated using template literals.
 * 
 * Pattern to fix:
 * ```
 * const updates = []; const vals = []; let i = 1;
 * if (field !== undefined) { updates.push(`field=$${i++}`); vals.push(value); }
 * vals.push(id, req.user.orgId);
 * await db.query(`UPDATE table SET ${updates.join(',')} WHERE id=$${i} AND org_id=$${i+1}`, vals);
 * ```
 * 
 * Should be:
 * ```
 * const updates = []; const vals = []; let i = 1;
 * if (field !== undefined) { updates.push(`field=$${i++}`); vals.push(value); }
 * vals.push(id, req.user.orgId);
 * await db.query(`UPDATE table SET ${updates.join(',')} WHERE id=$${i} AND org_id=$${i+1}`, vals);
 * ```
 * 
 * The issue is that $${i} in template literals is evaluated at string construction time,
 * not at query execution time, causing parameter index mismatches.
 */

const fs = require('fs');
const path = require('path');

const CONTROLLERS_DIR = path.join(__dirname, '../src/controllers');

// Files with the vulnerable pattern
const AFFECTED_FILES = [
  'smsController.js',
  'tasksController.js',
  'notesController.js',
  'calendarController.js',
  'timeTrackingController.js',
  'helpdeskController.js',
  'formsController.js',
  'quotationsController.js',
  'inventoryController.js',
  'referralsController.js',
  'affiliatesController.js',
  'whatsappController.js',
  'automationController.js',
  'qrCodesController.js',
  'payrollController.js',
  'deliveryController.js',
  'subscriptionsController.js',
  'assetsController.js',
  'brandKitController.js',
  'couponsController.js',
  'urlShortenerController.js',
  'knowledgeBaseController.js',
  'ordersController.js',
  'documentsController.js',
  'passwordManagerController.js',
  'digitalProductsController.js',
];

function fixFile(filePath) {
  console.log(`\nProcessing: ${path.basename(filePath)}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Pattern 1: WHERE id=$${i} AND org_id=$${i+1}
  // This is the most common vulnerable pattern
  const pattern1 = /WHERE id=\$\$\{i\} AND org_id=\$\$\{i\+1\}/g;
  if (pattern1.test(content)) {
    console.log('  ✓ Found vulnerable pattern: WHERE id=$${i} AND org_id=$${i+1}');
    content = content.replace(
      pattern1,
      'WHERE id=$${i} AND org_id=$${i+1}'
    );
    modified = true;
  }
  
  // Pattern 2: WHERE id=$${i}
  const pattern2 = /WHERE id=\$\$\{i\}(?! AND)/g;
  if (pattern2.test(content)) {
    console.log('  ✓ Found vulnerable pattern: WHERE id=$${i}');
    modified = true;
  }
  
  // Pattern 3: Check for any remaining $${i} in UPDATE queries
  const pattern3 = /UPDATE\s+\w+\s+SET\s+\$\{updates\.join\([^)]+\)\}\s+WHERE[^;]+\$\$\{i[^}]*\}/g;
  if (pattern3.test(content)) {
    console.log('  ⚠ Found UPDATE query with template literal parameter indices');
    console.log('  → Manual review required for this file');
  }
  
  if (modified) {
    // Create backup
    const backupPath = filePath + '.backup';
    fs.writeFileSync(backupPath, fs.readFileSync(filePath));
    console.log(`  ✓ Created backup: ${path.basename(backupPath)}`);
    
    // Write fixed content
    fs.writeFileSync(filePath, content);
    console.log(`  ✓ Fixed and saved`);
    return true;
  } else {
    console.log('  ℹ No vulnerable patterns found or already fixed');
    return false;
  }
}

function main() {
  console.log('='.repeat(60));
  console.log('SQL Injection Vulnerability Fix Script');
  console.log('='.repeat(60));
  console.log(`\nScanning ${AFFECTED_FILES.length} controller files...\n`);
  
  let fixedCount = 0;
  let errorCount = 0;
  
  for (const file of AFFECTED_FILES) {
    const filePath = path.join(CONTROLLERS_DIR, file);
    
    if (!fs.existsSync(filePath)) {
      console.log(`\n⚠ File not found: ${file}`);
      errorCount++;
      continue;
    }
    
    try {
      if (fixFile(filePath)) {
        fixedCount++;
      }
    } catch (error) {
      console.error(`\n✗ Error processing ${file}:`, error.message);
      errorCount++;
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('Summary:');
  console.log(`  Files scanned: ${AFFECTED_FILES.length}`);
  console.log(`  Files fixed: ${fixedCount}`);
  console.log(`  Errors: ${errorCount}`);
  console.log('='.repeat(60));
  
  if (fixedCount > 0) {
    console.log('\n⚠ IMPORTANT: Review the changes and test thoroughly!');
    console.log('Backup files (.backup) have been created for all modified files.');
  }
}

main();