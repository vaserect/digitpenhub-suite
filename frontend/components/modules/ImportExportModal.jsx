'use client';

import { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Download, Upload, FileJson, FileSpreadsheet } from 'lucide-react';

export default function ImportExportModal({ 
  isOpen, 
  onClose, 
  recordType,
  onImportComplete 
}) {
  const [activeTab, setActiveTab] = useState('export');
  const [exportFormat, setExportFormat] = useState('json');
  const [importFile, setImportFile] = useState(null);
  const [importFormat, setImportFormat] = useState('json');
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await fetch(
        `/api/custom-fields/export?recordType=${recordType}&format=${exportFormat}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `custom-fields-${recordType}-${Date.now()}.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed: ' + error.message);
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async () => {
    if (!importFile) return;

    setImporting(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('file', importFile);
      formData.append('recordType', recordType);
      formData.append('format', importFormat);

      const response = await fetch('/api/custom-fields/import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Import failed');
      }

      setImportResult(result);
      if (onImportComplete) {
        onImportComplete(result);
      }
    } catch (error) {
      console.error('Import error:', error);
      setImportResult({
        success: false,
        error: error.message,
      });
    } finally {
      setImporting(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportFile(file);
      // Auto-detect format from file extension
      if (file.name.endsWith('.json')) {
        setImportFormat('json');
      } else if (file.name.endsWith('.csv')) {
        setImportFormat('csv');
      }
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Import/Export Custom Fields">
      <div style={{ minWidth: 500 }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '1px solid var(--border)' }}>
          <button
            onClick={() => setActiveTab('export')}
            style={{
              padding: '8px 16px',
              border: 0,
              background: 'transparent',
              cursor: 'pointer',
              borderBottom: activeTab === 'export' ? '2px solid var(--primary)' : '2px solid transparent',
              fontWeight: activeTab === 'export' ? 600 : 400,
            }}
          >
            <Download size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
            Export
          </button>
          <button
            onClick={() => setActiveTab('import')}
            style={{
              padding: '8px 16px',
              border: 0,
              background: 'transparent',
              cursor: 'pointer',
              borderBottom: activeTab === 'import' ? '2px solid var(--primary)' : '2px solid transparent',
              fontWeight: activeTab === 'import' ? 600 : 400,
            }}
          >
            <Upload size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
            Import
          </button>
        </div>

        {/* Export Tab */}
        {activeTab === 'export' && (
          <div>
            <p style={{ marginBottom: 16, color: 'var(--text-muted)' }}>
              Export all custom field definitions for <strong>{recordType}</strong> records.
            </p>

            <div className="field">
              <label className="field-label">Export Format</label>
              <div style={{ display: 'flex', gap: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    value="json"
                    checked={exportFormat === 'json'}
                    onChange={(e) => setExportFormat(e.target.value)}
                  />
                  <FileJson size={16} />
                  JSON
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    value="csv"
                    checked={exportFormat === 'csv'}
                    onChange={(e) => setExportFormat(e.target.value)}
                  />
                  <FileSpreadsheet size={16} />
                  CSV
                </label>
              </div>
            </div>

            <div style={{ marginTop: 20, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleExport} disabled={exporting}>
                {exporting ? 'Exporting...' : 'Export Fields'}
              </Button>
            </div>
          </div>
        )}

        {/* Import Tab */}
        {activeTab === 'import' && (
          <div>
            <p style={{ marginBottom: 16, color: 'var(--text-muted)' }}>
              Import custom field definitions from a JSON or CSV file.
            </p>

            <div className="field">
              <label className="field-label">Select File</label>
              <input
                type="file"
                accept=".json,.csv"
                onChange={handleFileChange}
                style={{
                  padding: 8,
                  border: '1px solid var(--border)',
                  borderRadius: 4,
                  width: '100%',
                }}
              />
            </div>

            {importFile && (
              <div style={{ marginTop: 12, padding: 12, background: 'var(--bg-secondary)', borderRadius: 6 }}>
                <div style={{ fontSize: '0.875rem' }}>
                  <strong>File:</strong> {importFile.name}
                </div>
                <div style={{ fontSize: '0.875rem', marginTop: 4 }}>
                  <strong>Size:</strong> {(importFile.size / 1024).toFixed(2)} KB
                </div>
                <div style={{ fontSize: '0.875rem', marginTop: 4 }}>
                  <strong>Format:</strong> {importFormat.toUpperCase()}
                </div>
              </div>
            )}

            {importResult && (
              <div
                style={{
                  marginTop: 16,
                  padding: 12,
                  borderRadius: 6,
                  background: importResult.success ? 'var(--success-bg)' : 'var(--error-bg)',
                  border: `1px solid ${importResult.success ? 'var(--success)' : 'var(--error)'}`,
                }}
              >
                {importResult.success ? (
                  <>
                    <div style={{ fontWeight: 600, marginBottom: 8 }}>Import Successful!</div>
                    <div style={{ fontSize: '0.875rem' }}>
                      Imported {importResult.imported} field(s)
                      {importResult.skipped > 0 && `, skipped ${importResult.skipped}`}
                      {importResult.updated > 0 && `, updated ${importResult.updated}`}
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontWeight: 600, marginBottom: 8 }}>Import Failed</div>
                    <div style={{ fontSize: '0.875rem' }}>{importResult.error}</div>
                  </>
                )}
              </div>
            )}

            <div style={{ marginTop: 20, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleImport} disabled={!importFile || importing}>
                {importing ? 'Importing...' : 'Import Fields'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
