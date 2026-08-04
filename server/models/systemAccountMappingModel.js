const db = require('../config/db');

class SystemAccountMappingModel {
  /**
   * Resolve an account by its system mapping key.
   * @param {string} mappingKey e.g. 'OPERATIONAL_ADVANCE_CLEARING'
   * @returns {Object|null} The resolved account or null if not mapped/found.
   */
  static async resolveAccount(mappingKey) {
    const query = `
      SELECT a.* 
      FROM accounts a
      JOIN system_account_mappings sam ON a.id = sam.account_id
      WHERE sam.mapping_key = ?
    `;
    const [rows] = await db.query(query, [mappingKey]);
    return rows[0] || null;
  }
}

module.exports = SystemAccountMappingModel;
