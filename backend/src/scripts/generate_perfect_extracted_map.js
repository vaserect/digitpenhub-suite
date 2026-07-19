const fs = require('fs');
const path = require('path');
const { CATEGORIES, slugify } = require('../../db/categories.data');

const appDir = '/home/suite.digitpenhub.com/digitpenhub-suite/frontend/app';

// Find all Next.js page paths
function findPageDirs(dir, base = '') {
  let results = [];
  const list = fs.readdirSync(dir);
  
  if (list.includes('page.jsx') || list.includes('page.js')) {
    results.push(base || '/');
  }

  for (const name of list) {
    const fullPath = path.join(dir, name);
    if (fs.lstatSync(fullPath).isDirectory() && name !== 'api' && name !== 'components' && !name.startsWith('[')) {
      results = results.concat(findPageDirs(fullPath, base ? `${base}/${name}` : name));
    }
  }
  return results;
}

function generateMap() {
  const physicalPages = findPageDirs(appDir);
  const mapping = {};

  for (const cat of CATEGORIES) {
    for (const modName of cat.modules) {
      const slug = slugify(modName);

      // Check direct root-level page folder
      if (physicalPages.includes(slug)) {
        mapping[slug] = `/${slug}`;
      }
      // Check modules/ nested page folder
      else if (physicalPages.includes(`modules/${slug}`)) {
        mapping[slug] = `/modules/${slug}`;
      }
      // Check for structural inconsistencies (special mappings)
      else if (slug === 'project-management' && physicalPages.includes('project-management')) {
        mapping[slug] = '/project-management';
      }
      else if (slug === 'project-management' && physicalPages.includes('pm')) {
        mapping[slug] = '/pm';
      }
      else if (slug === 'task-management' && physicalPages.includes('tasks')) {
        mapping[slug] = '/tasks';
      }
      else if (slug === 'invoices' && physicalPages.includes('billing-invoices')) {
        mapping[slug] = '/billing-invoices';
      }
      else if (slug === 'document-management' && physicalPages.includes('documents')) {
        mapping[slug] = '/documents';
      }
      else if (slug === 'appointment-booking' && physicalPages.includes('appointments')) {
        mapping[slug] = '/appointments';
      }
      else if (slug === 'affiliate-system' && physicalPages.includes('affiliates')) {
        mapping[slug] = '/affiliates';
      }
      else if (slug === 'referral-program' && physicalPages.includes('referrals')) {
        mapping[slug] = '/referrals';
      }
      else if (slug === 'certificate-generator' && physicalPages.includes('certificates')) {
        mapping[slug] = '/certificates';
      }
      else if (slug === 'color-palette-generator' && physicalPages.includes('color-palettes')) {
        mapping[slug] = '/color-palettes';
      }
      else if (slug === 'digital-asset-management-dam' && physicalPages.includes('digital-asset-management')) {
        mapping[slug] = '/digital-asset-management';
      }
      // If a physical page was found under a folder matching one of the other aliases
      else {
        // Look for any physical page route that ends in /slug or is slug
        const matchingPage = physicalPages.find(p => p === slug || p.endsWith('/' + slug));
        if (matchingPage) {
          mapping[slug] = '/' + matchingPage;
        }
      }
    }
  }

  // Add any explicitly known manual mappings if they are not caught
  if (physicalPages.includes('quiz-builder') && !mapping['quiz-builder']) {
    mapping['quiz-builder'] = '/quiz-builder';
  }
  if (physicalPages.includes('survey-builder') && !mapping['survey-builder']) {
    mapping['survey-builder'] = '/survey-builder';
  }
  if (physicalPages.includes('qr-code-generator') && !mapping['qr-code-generator']) {
    mapping['qr-code-generator'] = '/qr-code-generator';
  }
  if (physicalPages.includes('popup-builder') && !mapping['popup-builder']) {
    mapping['popup-builder'] = '/popup-builder';
  }
  if (physicalPages.includes('link-in-bio') && !mapping['link-in-bio']) {
    mapping['link-in-bio'] = '/link-in-bio';
  }
  if (physicalPages.includes('digital-business-cards') && !mapping['digital-business-cards']) {
    mapping['digital-business-cards'] = '/digital-business-cards';
  }

  console.log('=== GENERATED PERFECT EXTRACTED MAP ===\n');
  console.log(JSON.stringify(mapping, null, 2));
}

generateMap();
