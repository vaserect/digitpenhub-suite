#!/usr/bin/env node
/**
 * Automated SQL Injection Fix for Dynamic UPDATE Queries
 * 
 * This script fixes a critical SQL injection vulnerability where parameter
 * indices in template literals are evaluated at string construction time
 * instead of being properly calculated based on the values array length.
 * 
 * VULNERABLE PATTERN:
 * ```javascript
 * const updates = []; const vals = []; let i = 1;
 * if (field !== undefined) { updates.push(`field=$${i++}`); vals.push(value); }
 * vals.push(id, req.user.orgId);
 * await db.query(`UPDATE table SET ${updates.join(',')} WHERE id=$${i} AND org_id=$${i+1}`, vals);
 * ```
 * 
 * FIXED PATTERN:
 * ```javascript
 * const updates = []; const vals = []; let i = 1;
 * if (field !== undefined) { updates.push(`field=$${i++}`); vals.push(value); }
 * vals.push(id, req.user.orgId);
 * const idParam = i;
 * const orgParam = i + 1;
 * await db.query(`UPDATE table SET ${updates.join(',')} WHERE id=$${idParam} AND org_id=$${orgParam}`, vals);
 * ```
 */

const fs = require('fs');
const path = require('path');

const CONTROLLERS_DIR = path.join(__dirname, '../src/controllers');

function fixDynamicUpdateQuery(content) {
  let modified = false;
  
  // Pattern: WHERE id=$${i} AND org_id=$${i+1}
  // This needs to be fixed by capturing i before the template literal
  const regex = /(\s+vals\.push\(id,\s*req\.user\.orgId\);)\s*\n\s*(const\s*\{\s*rows\s*\}\s*=\s*await\s+db\.query\(`UPDATE\s+\w+\s+SET\s+\$\{updates\.join\([^)]+\)\}\s+WHERE\s+id=\$\$\{i\}\s+AND\s+org_id=\$\$\{i\+1\})/g;
  
  const fixed = content.replace(regex, (match, pushLine, queryLine) => {
    modified = true;
    return `${pushLine}\n  const idParam = i;\n  const orgParam = i + 1;\n  ${queryLine.replace('id=$${i}', 'id=$$${idParam}').replace('org_id=$${i+1}', 'org_id=$$${orgParam}')}`;
  });
  
  return { content: fixed, modified };
}

function processFile(filePath) {
  const fileName = path.basename(filePath);
  console.log(`\nProcessing: ${fileName}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Check if file has the vulnerable pattern
  if (!content.includes('WHERE id=$${i} AND org_id=$${i+1}')) {
    console.log('  ℹ No vulnerable pattern found');
    return false;
  }
  
  const { content: fixed, modified } = fixDynamicUpdateQuery(content);
  
  if (modified) {
    // Create backup
    const backupPath = filePath + '.backup';
    fs.writeFileSync(backupPath, content);
    console.log(`  ✓ Created backup: ${path.basename(backupPath)}`);
    
    // Write fixed content
    fs.writeFileSync(filePath, fixed);
    console.log(`  ✓ Fixed SQL injection vulnerability`);
    return true;
  }
  
  return false;
}

function scanDirectory(dir) {
  const files = fs.readdirSync(dir);
  const jsFiles = files.filter(f => f.endsWith('.js') && f.endsWith('Controller.js'));
  return jsFiles.map(f => path.join(dir, f));
}

function main() {
  console.log('='.repeat(70));
  console.log('SQL Injection Fix: Dynamic UPDATE Query Parameter Indices');
  console.log('='.repeat(70));
  
  const controllerFiles = scanDirectory(CONTROLLERS_DIR);
  console.log(`\nFound ${controllerFiles.length} controller files\n`);
  
  let fixedCount = 0;
  let errorCount = 0;
  const fixedFiles = [];
  
  for (const filePath of controllerFiles) {
    try {
      if (processFile(filePath)) {
        fixedCount++;
        fixedFiles.push(path.basename(filePath));
      }
    } catch (error) {
      console.error(`\n✗ Error processing ${path.basename(filePath)}:`, error.message);
      errorCount++;
    }
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('Summary:');
  console.log(`  Files scanned: ${controllerFiles.length}`);
  console.log(`  Files fixed: ${fixedCount}`);
  console.log(`  Errors: ${errorCount}`);
  console.log('='.repeat(70));
  
  if (fixedCount > 0) {
    console.log('\nFixed files:');
    fixedFiles.forEach(f => console.log(`  - ${f}`));
    console.log('\n⚠ IMPORTANT: Review changes and test thoroughly!');
    console.log('Backup files (.backup) created for all modified files.');
  }
}

main();