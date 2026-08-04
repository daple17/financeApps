/**
 * Decimal helper for safe monetary calculations
 * Preserves exact values for DECIMAL(15,2) database storage.
 */
class DecimalHelper {
  /**
   * Rounds a number safely to 2 decimal places.
   * This preserves Phase 4.6B behavior exactly while offering a centralized implementation.
   * @param {number|string} value
   * @returns {number}
   */
  static roundToTwo(value) {
    // This is mathematically identical to Math.round(val * 100) / 100 but safer from floating point anomalies
    return Number(Math.round(Number(value) + 'e2') + 'e-2');
  }

  /**
   * Safely adds multiple amounts and rounds the result
   */
  static add(...values) {
    const sum = values.reduce((acc, val) => acc + Number(val), 0);
    return this.roundToTwo(sum);
  }

  /**
   * Safely subtracts and rounds the result
   */
  static subtract(a, b) {
    return this.roundToTwo(Number(a) - Number(b));
  }
}

module.exports = DecimalHelper;
