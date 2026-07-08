import sys

path = "/home/suite.digitpenhub.com/digitpenhub-suite/frontend/app/admin/page.jsx"
with open(path, "r") as f:
    src = f.read()

# 1. Add state variables after the Payments state block
anchor1 = """  // Payments
  const [payments, setPayments] = useState([]);
  const [payTotal, setPayTotal] = useState(0);
"""
insert1 = anchor1 + """
  // Feature Flags
  const [flags, setFlags] = useState([]);
  const [flagKeyInput, setFlagKeyInput] = useState('');
  const [flagNameInput, setFlagNameInput] = useState('');
  const [flagDescInput, setFlagDescInput] = useState('');
  const [creatingFlag, setCreatingFlag] = useState(false);
  const [flagErr, setFlagErr] = useState('');
  const [expandedFlagKey, setExpandedFlagKey] = useState(null);
  const [flagOverrides, setFlagOverrides] = useState([]);
  const [overrideOrgId, setOverrideOrgId] = useState('');
  const [overrideEnabled, setOverrideEnabled] = useState(true);
  const [overrideWorking, setOverrideWorking] = useState(false);
"""
assert src.count(anchor1) == 1, "anchor1 not found or not unique"
src = src.replace(anchor1, insert1)

# 2. Add loadFlags + related functions before switchTab
anchor2 = """  const loadPayments = useCallback(() => {
    apiFetch('/api/v1/admin/payments?limit=50')
      .then((d) => { setPayments(d.payments || []); setPayTotal(d.total || 0); })
      .catch(() => {});
  }, []);
"""
insert2 = anchor2 + """
  function loadFlags() {
    apiFetch('/api/v1/admin/feature-flags').then((d) => setFlags(d.flags || [])).catch(() => {});
  }

  async function createFlag() {
    if (!flagKeyInput.trim() || !flagNameInput.trim()) {
      setFlagErr('Key and name are required.');
      return;
    }
    setCreatingFlag(true);
    setFlagErr('');
    try {
      await apiFetch('/api/v1/admin/feature-flags', {
        method: 'POST',
        body: JSON.stringify({ key: flagKeyInput.trim(), name: flagNameInput.trim(), description: flagDescInput.trim() }),
      });
      setFlagKeyInput(''); setFlagNameInput(''); setFlagDescInput('');
      loadFlags();
    } catch (err) {
      setFlagErr(err.message || 'Failed to create flag.');
    } finally {
      setCreatingFlag(false);
    }
  }

  async function toggleFlagGlobal(flag) {
    await apiFetch(`/api/v1/admin/feature-flags/${flag.key}`, {
      method: 'PATCH',
      body: JSON.stringify({ enabled: !flag.is_global_enabled }),
    });
    loadFlags();
  }

  async function deleteFlag(key) {
    if (!window.confirm(`Delete the "${key}" flag? This also removes all its org overrides.`)) return;
    await apiFetch(`/api/v1/admin/feature-flags/${key}`, { method: 'DELETE' });
    if (expandedFlagKey === key) setExpandedFlagKey(null);
    loadFlags();
  }

  function toggleOverridesPanel(key) {
    if (expandedFlagKey === key) {
      setExpandedFlagKey(null);
      return;
    }
    setExpandedFlagKey(key);
    setOverrideOrgId('');
    apiFetch(`/api/v1/admin/feature-flags/${key}/overrides`).then((d) => setFlagOverrides(d.overrides || [])).catch(() => setFlagOverrides([]));
  }

  async function addOverride(key) {
    if (!overrideOrgId.trim()) return;
    setOverrideWorking(true);
    try {
      await apiFetch(`/api/v1/admin/feature-flags/${key}/overrides`, {
        method: 'POST',
        body: JSON.stringify({ orgId: overrideOrgId.trim(), enabled: overrideEnabled }),
      });
      setOverrideOrgId('');
      const d = await apiFetch(`/api/v1/admin/feature-flags/${key}/overrides`);
      setFlagOverrides(d.overrides || []);
      loadFlags();
    } catch (err) {
      alert(err.message || 'Failed to add override.');
    } finally {
      setOverrideWorking(false);
    }
  }

  async function removeOverride(key, orgId) {
    await apiFetch(`/api/v1/admin/feature-flags/${key}/overrides/${orgId}`, { method: 'DELETE' });
    const d = await apiFetch(`/api/v1/admin/feature-flags/${key}/overrides`);
    setFlagOverrides(d.overrides || []);
    loadFlags();
  }
"""
assert src.count(anchor2) == 1, "anchor2 not found or not unique"
src = src.replace(anchor2, insert2)

# 3. Wire into switchTab
anchor3 = "    if (t === 'audit' && auditEntries.length === 0) loadAuditLog();\n  }"
insert3 = "    if (t === 'audit' && auditEntries.length === 0) loadAuditLog();\n    if (t === 'flags' && flags.length === 0) loadFlags();\n  }"
assert src.count(anchor3) == 1, "anchor3 not found or not unique"
src = src.replace(anchor3, insert3)

# 4. Add to tabs array
anchor4 = "    ? ['orgs', 'users', 'plans', 'payments', 'content', 'admins', 'audit']"
insert4 = "    ? ['orgs', 'users', 'plans', 'payments', 'flags', 'content', 'admins', 'audit']"
assert src.count(anchor4) == 1, "anchor4 not found or not unique"
src = src.replace(anchor4, insert4)

# 5. Add to tabLabels
anchor5 = "  const tabLabels = { orgs: 'Organizations', users: 'Users', plans: 'Plans', payments: 'Revenue', content: 'Content', admins: 'Admins', audit: 'Audit Log' };"
insert5 = "  const tabLabels = { orgs: 'Organizations', users: 'Users', plans: 'Plans', payments: 'Revenue', flags: 'Feature Flags', content: 'Content', admins: 'Admins', audit: 'Audit Log' };"
assert src.count(anchor5) == 1, "anchor5 not found or not unique"
src = src.replace(anchor5, insert5)

# 6. Insert the render block before the Payments tab block
anchor6 = """        {/* \u2500\u2500 Payments \u2500\u2500 */}
        {tab === 'payments' && ("""
insert6 = """        {/* \u2500\u2500 Feature Flags \u2500\u2500 */}
        {tab === 'flags' && (
          <div>
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: 16, marginBottom: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 10 }}>New flag</div>
              {flagErr && <div style={{ color: '#dc2626', fontSize: 13, marginBottom: 8 }}>{flagErr}</div>}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div>
                  <Label>Key</Label>
                  <Input value={flagKeyInput} onChange={(e) => setFlagKeyInput(e.target.value)} placeholder="ai-voice-agent" style={{ width: 180 }} />
                </div>
                <div>
                  <Label>Name</Label>
                  <Input value={flagNameInput} onChange={(e) => setFlagNameInput(e.target.value)} placeholder="AI Voice Agent" style={{ width: 200 }} />
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <Label>Description</Label>
                  <Input value={flagDescInput} onChange={(e) => setFlagDescInput(e.target.value)} placeholder="Optional" />
                </div>
                <PrimaryBtn disabled={creatingFlag} onClick={createFlag}>{creatingFlag ? 'Creating\u2026' : '+ Create flag'}</PrimaryBtn>
              </div>
            </div>

            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', fontWeight: 700 }}>Feature Flags</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr>
                    {['Name', 'Key', 'Description', 'Global status', 'Org overrides', ''].map((h) => <TH key={h}>{h}</TH>)}
                  </tr></thead>
                  <tbody>
                    {flags.flatMap((f) => ([
                      <tr key={f.key}>
                        <TD><div style={{ fontWeight: 600 }}>{f.name}</div></TD>
                        <TD mono>{f.key}</TD>
                        <TD>{f.description || '\u2014'}</TD>
                        <TD>{f.is_global_enabled ? <Badge label="Enabled" /> : <Badge label="Disabled" color="#fee2e2" text="#991b1b" />}</TD>
                        <TD>{fmt(f.override_count)}</TD>
                        <TD>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <ActionBtn
                              color={f.is_global_enabled ? '#92400e' : '#065f46'}
                              border={f.is_global_enabled ? '#f59e0b' : '#22c55e'}
                              onClick={() => toggleFlagGlobal(f)}>
                              {f.is_global_enabled ? 'Disable' : 'Enable'}
                            </ActionBtn>
                            <ActionBtn color="#1e40af" border="#93c5fd" onClick={() => toggleOverridesPanel(f.key)}>
                              {expandedFlagKey === f.key ? 'Hide overrides' : 'Overrides'}
                            </ActionBtn>
                            <ActionBtn onClick={() => deleteFlag(f.key)}>Delete</ActionBtn>
                          </div>
                        </TD>
                      </tr>,
                      expandedFlagKey === f.key && (
                        <tr key={f.key + '-overrides'}>
                          <td colSpan={6} style={{ padding: '14px 20px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748b', marginBottom: 8 }}>
                              Per-org overrides
                            </div>
                            <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'flex-end' }}>
                              <div>
                                <Label>Org ID</Label>
                                <Input value={overrideOrgId} onChange={(e) => setOverrideOrgId(e.target.value)} placeholder="org uuid" style={{ width: 260 }} />
                              </div>
                              <div>
                                <Label>State</Label>
                                <Select value={overrideEnabled ? 'on' : 'off'} onChange={(e) => setOverrideEnabled(e.target.value === 'on')}>
                                  <option value="on">Force enabled</option>
                                  <option value="off">Force disabled</option>
                                </Select>
                              </div>
                              <PrimaryBtn disabled={overrideWorking} onClick={() => addOverride(f.key)}>
                                {overrideWorking ? 'Saving\u2026' : 'Add override'}
                              </PrimaryBtn>
                            </div>
                            {flagOverrides.length === 0 && <div style={{ fontSize: 13, color: '#94a3b8' }}>No overrides for this flag.</div>}
                            {flagOverrides.map((o) => (
                              <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid #e2e8f0', fontSize: 13 }}>
                                <div style={{ flex: 1 }}>{o.org_name} <span style={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: 11 }}>({o.org_id})</span></div>
                                {o.enabled ? <Badge label="Forced ON" /> : <Badge label="Forced OFF" color="#fee2e2" text="#991b1b" />}
                                <ActionBtn onClick={() => removeOverride(f.key, o.org_id)}>Remove</ActionBtn>
                              </div>
                            ))}
                          </td>
                        </tr>
                      ),
                    ]))}
                    {flags.length === 0 && <tr><td colSpan={6} style={{ padding: '28px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No feature flags yet.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* \u2500\u2500 Payments \u2500\u2500 */}
        {tab === 'payments' && ("""
assert src.count(anchor6) == 1, "anchor6 not found or not unique"
src = src.replace(anchor6, insert6)

with open(path, "w") as f:
    f.write(src)

print("All 6 patches applied successfully.")
