const db = require('../db');

async function getKit(req, res) {
  const { rows } = await db.query(`SELECT * FROM brand_kits WHERE org_id=$1 ORDER BY created_at LIMIT 1`, [req.user.orgId]);
  res.json({ kit: rows[0] || null });
}

async function saveKit(req, res) {
  const existing = await db.query(`SELECT id FROM brand_kits WHERE org_id=$1 LIMIT 1`, [req.user.orgId]);
  const { name, primaryColor, secondaryColor, accentColor, backgroundColor, textColor, primaryFont, secondaryFont, logoUrl, faviconUrl, tagline, website, extraColors, extraFonts, socialLinks } = req.body || {};

  if (existing.rows.length) {
    const id = existing.rows[0].id;
    const updates=[]; const vals=[]; let i=1;
    const fields = { name, primaryColor, secondaryColor, accentColor, backgroundColor, textColor, primaryFont, secondaryFont, logoUrl, faviconUrl, tagline, website };
    const colMap = { name:'name', primaryColor:'primary_color', secondaryColor:'secondary_color', accentColor:'accent_color', backgroundColor:'background_color', textColor:'text_color', primaryFont:'primary_font', secondaryFont:'secondary_font', logoUrl:'logo_url', faviconUrl:'favicon_url', tagline:'tagline', website:'website' };
    Object.entries(fields).forEach(([k,v]) => { if (v!==undefined){ updates.push(`${colMap[k]}=$${i++}`); vals.push(v||null); }});
    if (extraColors!==undefined){updates.push(`extra_colors=$${i++}`); vals.push(JSON.stringify(extraColors||[]));}
    if (extraFonts !==undefined){updates.push(`extra_fonts=$${i++}`);  vals.push(JSON.stringify(extraFonts||[]));}
    if (socialLinks!==undefined){updates.push(`social_links=$${i++}`); vals.push(JSON.stringify(socialLinks||{}));}
    updates.push('updated_at=NOW()');
    vals.push(id);
    const { rows } = await db.query(`UPDATE brand_kits SET ${updates.join(',')} WHERE id=$${i} RETURNING *`, vals);
    return res.json({ kit: rows[0] });
  }

  const { rows } = await db.query(
    `INSERT INTO brand_kits (org_id,name,primary_color,secondary_color,accent_color,background_color,text_color,primary_font,secondary_font,logo_url,favicon_url,tagline,website,extra_colors,extra_fonts,social_links)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`,
    [req.user.orgId, name||'Default Brand Kit', primaryColor||'#2563eb', secondaryColor||'#64748b', accentColor||'#f59e0b', backgroundColor||'#ffffff', textColor||'#1e293b', primaryFont||'Inter', secondaryFont||'Inter', logoUrl||null, faviconUrl||null, tagline||null, website||null, JSON.stringify(extraColors||[]), JSON.stringify(extraFonts||[]), JSON.stringify(socialLinks||{})]
  );
  res.status(201).json({ kit: rows[0] });
}

module.exports = { getKit, saveKit };
