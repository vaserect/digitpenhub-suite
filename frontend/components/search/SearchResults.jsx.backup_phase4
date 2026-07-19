'use client';

import { useRouter } from 'next/navigation';
import { 
  Users, FileText, CheckSquare, Briefcase, Mail, 
  ShoppingCart, Calendar, FolderOpen, DollarSign, Package,
  FileSpreadsheet, Clock, MessageSquare, BookOpen, Settings
} from 'lucide-react';

/**
 * SearchResults Component
 * 
 * Displays search results grouped by entity type.
 * Shows result count, key fields, and allows navigation to entities.
 * 
 * Features:
 * - Grouped by entity type
 * - Entity-specific icons
 * - Result highlighting
 * - Click to navigate
 * - Pagination support
 * - Empty state handling
 */

// Entity type to icon mapping
const ENTITY_ICONS = {
  'contact': Users,
  'crm': Users,
  'lead': Users,
  'task': CheckSquare,
  'project': Briefcase,
  'invoice': FileText,
  'quote': FileSpreadsheet,
  'email': Mail,
  'order': ShoppingCart,
  'product': Package,
  'event': Calendar,
  'document': FolderOpen,
  'expense': DollarSign,
  'timesheet': Clock,
  'ticket': MessageSquare,
  'course': BookOpen,
  'setting': Settings,
};

// Entity type to route mapping
const ENTITY_ROUTES = {
  'contact': '/crm',
  'crm': '/crm',
  'lead': '/lead-generation',
  'task': '/tasks',
  'project': '/project-management',
  'invoice': '/billing-invoices',
  'quote': '/quotations',
  'email': '/email-marketing',
  'order': '/marketplace',
  'product': '/inventory',
  'event': '/calendar',
  'document': '/document-management',
  'expense': '/expenses',
  'timesheet': '/time-tracking',
  'ticket': '/help-desk',
  'course': '/education',
};

// Entity type display names
const ENTITY_NAMES = {
  'contact': 'Contacts',
  'crm': 'CRM',
  'lead': 'Leads',
  'task': 'Tasks',
  'project': 'Projects',
  'invoice': 'Invoices',
  'quote': 'Quotes',
  'email': 'Emails',
  'order': 'Orders',
  'product': 'Products',
  'event': 'Events',
  'document': 'Documents',
  'expense': 'Expenses',
  'timesheet': 'Timesheets',
  'ticket': 'Tickets',
  'course': 'Courses',
};

function highlightText(text, query) {
  if (!query || !text) return text;
  
  const parts = text.split(new RegExp(`(${query})`, 'gi'));
  return parts.map((part, i) => 
    part.toLowerCase() === query.toLowerCase() 
      ? <mark key={i}>{part}</mark> 
      : part
  );
}

function SearchResultItem({ result, query, onClick }) {
  const Icon = ENTITY_ICONS[result.entity_type] || FileText;
  const entityName = ENTITY_NAMES[result.entity_type] || result.entity_type;

  return (
    <button
      onClick={() => onClick(result)}
      className="search-result-item"
    >
      <div className="search-result-icon">
        <Icon size={18} />
      </div>
      <div className="search-result-content">
        <div className="search-result-title">
          {highlightText(result.title, query)}
        </div>
        {result.content && (
          <div className="search-result-description">
            {highlightText(result.content.substring(0, 120), query)}
            {result.content.length > 120 && '...'}
          </div>
        )}
        <div className="search-result-meta">
          <span className="search-result-type">{entityName}</span>
          {result.metadata?.created_at && (
            <>
              <span className="search-result-separator">•</span>
              <span className="search-result-date">
                {new Date(result.metadata.created_at).toLocaleDateString()}
              </span>
            </>
          )}
        </div>
      </div>
    </button>
  );
}

export default function SearchResults({ results, query, onResultClick }) {
  const router = useRouter();

  if (!results || !results.results || results.results.length === 0) {
    return null;
  }

  // Group results by entity type
  const groupedResults = results.results.reduce((acc, result) => {
    const type = result.entity_type || 'other';
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(result);
    return acc;
  }, {});

  const handleResultClick = (result) => {
    // Navigate to the entity's detail page
    const baseRoute = ENTITY_ROUTES[result.entity_type];
    if (baseRoute && result.entity_id) {
      router.push(`${baseRoute}/${result.entity_id}`);
    } else if (baseRoute) {
      router.push(baseRoute);
    }
    onResultClick?.(result);
  };

  return (
    <div className="search-results">
      <div className="search-results-header">
        <h3 className="search-results-title">
          {results.total} {results.total === 1 ? 'result' : 'results'} found
        </h3>
      </div>

      <div className="search-results-groups">
        {Object.entries(groupedResults).map(([entityType, items]) => {
          const Icon = ENTITY_ICONS[entityType] || FileText;
          const entityName = ENTITY_NAMES[entityType] || entityType;

          return (
            <div key={entityType} className="search-results-group">
              <div className="search-results-group-header">
                <Icon size={16} />
                <h4 className="search-results-group-title">
                  {entityName}
                </h4>
                <span className="search-results-group-count">
                  {items.length}
                </span>
              </div>
              <div className="search-results-group-items">
                {items.map((result) => (
                  <SearchResultItem
                    key={`${result.entity_type}-${result.entity_id}`}
                    result={result}
                    query={query}
                    onClick={handleResultClick}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {results.total > results.results.length && (
        <div className="search-results-footer">
          <p className="search-results-more">
            Showing {results.results.length} of {results.total} results
          </p>
        </div>
      )}
    </div>
  );
}
