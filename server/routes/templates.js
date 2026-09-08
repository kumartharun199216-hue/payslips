const express = require('express');
const router = express.Router();
const { db, logAudit } = require('../db');
const { authenticateToken } = require('../middleware/auth');

// 1. GET ALL TEMPLATES
router.get('/templates', (req, res) => {
  try {
    const templates = db.prepare('SELECT * FROM payslip_templates ORDER BY is_default DESC, id ASC').all();
    res.json(templates);
  } catch (err) {
    res.status(500).json({ error: `Failed to fetch templates: ${err.message}` });
  }
});

// 2. GET SINGLE TEMPLATE
router.get('/templates/:id', (req, res) => {
  try {
    const template = db.prepare('SELECT * FROM payslip_templates WHERE id = ? OR slug = ?').get(req.params.id, req.params.id);
    if (!template) {
      return res.status(404).json({ error: 'Payslip template not found' });
    }
    res.json(template);
  } catch (err) {
    res.status(500).json({ error: `Failed to fetch template: ${err.message}` });
  }
});

// 3. CREATE NEW TEMPLATE
router.post('/templates', authenticateToken, (req, res) => {
  try {
    const {
      name,
      description = '',
      theme_color = '#0f172a',
      accent_color = '#2563eb',
      layout_type = 'modern',
      header_style = 'split',
      show_company_logo = 1,
      show_bank_details = 1,
      show_statutory_ids = 1,
      show_attendance = 1,
      show_signature_block = 1,
      watermark_text = '',
      footer_notes = 'This is a computer-generated payslip and does not require a physical signature.',
      is_default = 0,
      layout_config_json = null
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Template name is required' });
    }

    const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString().slice(-4);

    if (is_default) {
      db.prepare('UPDATE payslip_templates SET is_default = 0').run();
    }

    const layoutJsonStr = typeof layout_config_json === 'object' && layout_config_json !== null 
      ? JSON.stringify(layout_config_json) 
      : (layout_config_json || null);

    const info = db.prepare(`
      INSERT INTO payslip_templates (
        name, slug, description, is_default, theme_color, accent_color,
        layout_type, header_style, show_company_logo, show_bank_details,
        show_statutory_ids, show_attendance, show_signature_block, watermark_text, footer_notes,
        layout_config_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      name.trim(), slug, description.trim(), is_default ? 1 : 0,
      theme_color, accent_color, layout_type, header_style,
      show_company_logo ? 1 : 0, show_bank_details ? 1 : 0,
      show_statutory_ids ? 1 : 0, show_attendance ? 1 : 0,
      show_signature_block ? 1 : 0, watermark_text.trim(), footer_notes.trim(),
      layoutJsonStr
    );

    const created = db.prepare('SELECT * FROM payslip_templates WHERE id = ?').get(info.lastInsertRowid);
    logAudit(req.user?.id || 1, req.user?.name || 'User', 'Create Template', 'PayslipTemplate', created.id, `Created template "${created.name}"`);

    res.status(201).json({
      message: 'Payslip template created successfully',
      template: created
    });
  } catch (err) {
    res.status(500).json({ error: `Failed to create template: ${err.message}` });
  }
});

// 4. UPDATE TEMPLATE
router.put('/templates/:id', authenticateToken, (req, res) => {
  try {
    const templateId = req.params.id;
    const existing = db.prepare('SELECT * FROM payslip_templates WHERE id = ?').get(templateId);
    if (!existing) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const {
      name = existing.name,
      description = existing.description,
      theme_color = existing.theme_color,
      accent_color = existing.accent_color,
      layout_type = existing.layout_type,
      header_style = existing.header_style,
      show_company_logo = existing.show_company_logo,
      show_bank_details = existing.show_bank_details,
      show_statutory_ids = existing.show_statutory_ids,
      show_attendance = existing.show_attendance,
      show_signature_block = existing.show_signature_block,
      watermark_text = existing.watermark_text,
      footer_notes = existing.footer_notes,
      is_default = existing.is_default,
      layout_config_json = existing.layout_config_json
    } = req.body;

    if (is_default && !existing.is_default) {
      db.prepare('UPDATE payslip_templates SET is_default = 0').run();
    }

    const layoutJsonStr = typeof layout_config_json === 'object' && layout_config_json !== null 
      ? JSON.stringify(layout_config_json) 
      : (layout_config_json !== undefined ? layout_config_json : existing.layout_config_json);

    db.prepare(`
      UPDATE payslip_templates SET
        name = ?, description = ?, theme_color = ?, accent_color = ?,
        layout_type = ?, header_style = ?, show_company_logo = ?,
        show_bank_details = ?, show_statutory_ids = ?, show_attendance = ?,
        show_signature_block = ?, watermark_text = ?, footer_notes = ?,
        is_default = ?, layout_config_json = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      name, description, theme_color, accent_color,
      layout_type, header_style, show_company_logo ? 1 : 0,
      show_bank_details ? 1 : 0, show_statutory_ids ? 1 : 0,
      show_attendance ? 1 : 0, show_signature_block ? 1 : 0,
      watermark_text, footer_notes, is_default ? 1 : 0, layoutJsonStr,
      templateId
    );

    const updated = db.prepare('SELECT * FROM payslip_templates WHERE id = ?').get(templateId);
    logAudit(req.user?.id || 1, req.user?.name || 'User', 'Update Template', 'PayslipTemplate', updated.id, `Updated template "${updated.name}"`);

    res.json({
      message: 'Template updated successfully',
      template: updated
    });
  } catch (err) {
    res.status(500).json({ error: `Failed to update template: ${err.message}` });
  }
});

// 5. SET DEFAULT TEMPLATE
router.post('/templates/:id/set-default', authenticateToken, (req, res) => {
  try {
    const templateId = req.params.id;
    const existing = db.prepare('SELECT * FROM payslip_templates WHERE id = ?').get(templateId);
    if (!existing) {
      return res.status(404).json({ error: 'Template not found' });
    }

    db.prepare('UPDATE payslip_templates SET is_default = 0').run();
    db.prepare('UPDATE payslip_templates SET is_default = 1 WHERE id = ?').run(templateId);

    res.json({
      message: `Template "${existing.name}" is now set as the default payslip template.`
    });
  } catch (err) {
    res.status(500).json({ error: `Failed to set default template: ${err.message}` });
  }
});

// 6. DELETE TEMPLATE
router.delete('/templates/:id', authenticateToken, (req, res) => {
  try {
    const templateId = req.params.id;
    const existing = db.prepare('SELECT * FROM payslip_templates WHERE id = ?').get(templateId);
    if (!existing) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const totalCount = db.prepare('SELECT COUNT(*) as count FROM payslip_templates').get().count;
    if (totalCount <= 1) {
      return res.status(400).json({ error: 'Cannot delete the only remaining template.' });
    }

    if (existing.is_default) {
      const nextDefault = db.prepare('SELECT id FROM payslip_templates WHERE id != ? LIMIT 1').get(templateId);
      if (nextDefault) {
        db.prepare('UPDATE payslip_templates SET is_default = 1 WHERE id = ?').run(nextDefault.id);
      }
    }

    db.prepare('DELETE FROM payslip_templates WHERE id = ?').run(templateId);
    logAudit(req.user?.id || 1, req.user?.name || 'User', 'Delete Template', 'PayslipTemplate', templateId, `Deleted template "${existing.name}"`);

    res.json({ message: `Template "${existing.name}" deleted successfully.` });
  } catch (err) {
    res.status(500).json({ error: `Failed to delete template: ${err.message}` });
  }
});

module.exports = router;
