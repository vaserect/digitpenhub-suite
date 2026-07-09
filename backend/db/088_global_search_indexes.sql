-- Global Search — full-text search indexes. Uses EXECUTE inside DO blocks so
-- missing tables/columns don't cause parse-time errors.

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='full_name') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_search_contacts ON contacts USING gin(to_tsvector(''english'', coalesce(full_name,'''') || '' '' || coalesce(company,'''') || '' '' || coalesce(email,'''')))';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='invoice_number') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_search_invoices ON invoices USING gin(to_tsvector(''english'', coalesce(invoice_number,'''') || '' '' || coalesce(notes,'''')))';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='name') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_search_projects ON projects USING gin(to_tsvector(''english'', coalesce(name,'''')))';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='title') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_search_tasks ON tasks USING gin(to_tsvector(''english'', coalesce(title,'''')))';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pages' AND column_name='title') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_search_pages ON pages USING gin(to_tsvector(''english'', coalesce(title,'''') || '' '' || coalesce(meta_description,'''')))';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documents' AND column_name='name') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_search_documents ON documents USING gin(to_tsvector(''english'', coalesce(name,'''')))';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notes' AND column_name='title') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_search_notes ON notes USING gin(to_tsvector(''english'', coalesce(title,'''') || '' '' || coalesce(content,'''')))';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='lead_forms') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_search_leadforms ON lead_forms USING gin(to_tsvector(''english'', coalesce(name,'''')))';
  END IF;
END $$;
