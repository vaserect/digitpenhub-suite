CREATE INDEX IF NOT EXISTS idx_search_contacts ON contacts USING gin(to_tsvector('english', coalesce(full_name,'') || ' ' || coalesce(company,'') || ' ' || coalesce(email,'')));
CREATE INDEX IF NOT EXISTS idx_search_invoices ON invoices USING gin(to_tsvector('english', coalesce(invoice_number,'') || ' ' || coalesce(notes,'')));
CREATE INDEX IF NOT EXISTS idx_search_projects ON projects USING gin(to_tsvector('english', coalesce(name,'')));
CREATE INDEX IF NOT EXISTS idx_search_tasks ON tasks USING gin(to_tsvector('english', coalesce(title,'')));
CREATE INDEX IF NOT EXISTS idx_search_pages ON pages USING gin(to_tsvector('english', coalesce(title,'') || ' ' || coalesce(meta_description,'')));
CREATE INDEX IF NOT EXISTS idx_search_documents ON documents USING gin(to_tsvector('english', coalesce(name,'')));
CREATE INDEX IF NOT EXISTS idx_search_notes ON notes USING gin(to_tsvector('english', coalesce(title,'') || ' ' || coalesce(content,'')));
CREATE INDEX IF NOT EXISTS idx_search_leadforms ON lead_forms USING gin(to_tsvector('english', coalesce(name,'')));
