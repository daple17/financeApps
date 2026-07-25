const db = require('../config/db');
const OperationModel = require('./operationModel');

class DocumentModel {
  static async getByOperation(operationId) {
    const [rows] = await db.query(`
      SELECT d.*, u.name as uploaded_by_name 
      FROM operation_documents d
      LEFT JOIN users u ON d.uploaded_by = u.id
      WHERE d.operation_id = ?
      ORDER BY d.uploaded_at DESC
    `, [operationId]);
    return rows;
  }

  static async getByJobOrder(jobOrderId) {
    const [rows] = await db.query(`
      SELECT d.*, u.name as uploaded_by_name, o.operation_no
      FROM operation_documents d
      JOIN operations o ON d.operation_id = o.id
      LEFT JOIN users u ON d.uploaded_by = u.id
      WHERE o.job_order_id = ?
      ORDER BY d.uploaded_at DESC
    `, [jobOrderId]);
    return rows;
  }

  static async createDocument(data) {
    const [result] = await db.query(`
      INSERT INTO operation_documents (
        operation_id, document_type, document_number, document_date, 
        file_name, file_path, mime_type, file_size, notes, uploaded_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      data.operation_id, data.document_type, data.document_number || null, data.document_date || null,
      data.file_name, data.file_path, data.mime_type, data.file_size, data.notes || null, data.uploaded_by
    ]);

    await OperationModel.logEvent(
      db, data.operation_id, 'DOCUMENT_UPLOADED', data.uploaded_by,
      `Uploaded document: ${data.document_type} (${data.file_name})`
    );

    return result.insertId;
  }

  static async deleteDocument(id, operationId, userId) {
    // Basic verification
    const [rows] = await db.query('SELECT * FROM operation_documents WHERE id = ? AND operation_id = ?', [id, operationId]);
    if (rows.length === 0) throw new Error('Document not found');
    const doc = rows[0];

    // Delete
    await db.query('DELETE FROM operation_documents WHERE id = ?', [id]);
    await OperationModel.logEvent(
      db, operationId, 'DOCUMENT_DELETED', userId,
      `Deleted document: ${doc.document_type} (${doc.file_name})`
    );
    return true;
  }
}

module.exports = DocumentModel;
