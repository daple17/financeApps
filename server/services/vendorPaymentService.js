const db = require('../config/db');
const VendorPaymentModel = require('../models/vendorPaymentModel');
const VendorInvoiceModel = require('../models/vendorInvoiceModel');
const CoaModel = require('../models/coaModel');
const SystemAccountMappingModel = require('../models/systemAccountMappingModel');
const TransactionService = require('./transactionService');

class VendorPaymentService {
  static async previewPayment(invoiceId, cashAccountId) {
    // 1. Get and Validate Invoice
    const invoice = await VendorInvoiceModel.findById(invoiceId);
    if (!invoice) throw Object.assign(new Error('Vendor Invoice tidak ditemukan'), { statusCode: 404 });
    if (invoice.status !== 'POSTED') throw Object.assign(new Error('Hanya invoice berstatus POSTED yang dapat dibayar'), { statusCode: 409 });
    if (!invoice.transaction_id) throw Object.assign(new Error('Invoice tidak memiliki transaksi liability yang POSTED'), { statusCode: 409 });

    // 2. Validate existing payment allocations
    const allocations = await VendorPaymentModel.getAllocationsByInvoiceId(invoiceId);
    const hasPostedPayment = allocations.some(a => a.payment_status === 'POSTED');
    if (hasPostedPayment) throw Object.assign(new Error('Invoice ini sudah memiliki pembayaran yang POSTED'), { statusCode: 409 });

    // 3. Resolve AP Account
    const apAccount = await SystemAccountMappingModel.resolveAccount('ACCOUNTS_PAYABLE');
    if (!apAccount || !apAccount.is_active || apAccount.type !== 'LIABILITY') {
      throw Object.assign(new Error('Akun Hutang (Accounts Payable) tidak valid untuk diposting'), { statusCode: 400 });
    }

    // 4. Validate Cash/Bank Account
    const cashAccount = await CoaModel.findById(cashAccountId);
    if (!cashAccount) throw Object.assign(new Error('Akun Kas/Bank tidak ditemukan'), { statusCode: 404 });
    if (!cashAccount.is_active || cashAccount.type !== 'ASSET') {
      throw Object.assign(new Error('Akun Kas/Bank tidak valid untuk diposting atau bukan akun ASSET'), { statusCode: 400 });
    }

    // 5. Generate Preview Journal
    const amount = Number(invoice.total_amount);
    const journalEntries = [
      {
        accountId: apAccount.id,
        accountCode: apAccount.code,
        accountName: apAccount.name,
        type: 'DEBIT',
        amount: amount,
        description: `Pelunasan Hutang - ${invoice.ap_invoice_no}`
      },
      {
        accountId: cashAccount.id,
        accountCode: cashAccount.code,
        accountName: cashAccount.name,
        type: 'CREDIT',
        amount: amount,
        description: `Pembayaran Vendor - ${invoice.ap_invoice_no}`
      }
    ];

    return {
      invoice,
      apAccount,
      cashAccount,
      journalEntries,
      totalAmount: amount
    };
  }

  static async createPayment(data, userId) {
    const { invoiceId, cashAccountId, paymentDate, notes } = data;
    
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Lock Invoice FOR UPDATE
      const invoice = await VendorInvoiceModel.findByIdWithLock(invoiceId, connection);
      if (!invoice) throw Object.assign(new Error('Vendor Invoice tidak ditemukan'), { statusCode: 404 });
      if (invoice.status !== 'POSTED') throw Object.assign(new Error('Hanya invoice berstatus POSTED yang dapat dibayar'), { statusCode: 409 });
      if (!invoice.transaction_id) throw Object.assign(new Error('Invoice tidak memiliki transaksi liability yang POSTED'), { statusCode: 409 });

      // 2. Validate existing payment allocations under lock
      const allocations = await VendorPaymentModel.getAllocationsByInvoiceId(invoiceId, connection);
      const hasPostedPayment = allocations.some(a => a.payment_status === 'POSTED');
      if (hasPostedPayment) throw Object.assign(new Error('Invoice ini sudah memiliki pembayaran yang POSTED'), { statusCode: 409 });

      // 3. Resolve AP Account
      const apAccount = await SystemAccountMappingModel.resolveAccount('ACCOUNTS_PAYABLE');
      if (!apAccount || !apAccount.is_active || apAccount.type !== 'LIABILITY') {
        throw Object.assign(new Error('Akun Hutang (Accounts Payable) tidak valid untuk diposting'), { statusCode: 400 });
      }

      // 4. Validate Cash/Bank Account
      const cashAccount = await CoaModel.findById(cashAccountId, connection);
      if (!cashAccount) throw Object.assign(new Error('Akun Kas/Bank tidak ditemukan'), { statusCode: 404 });
      if (!cashAccount.is_active || cashAccount.type !== 'ASSET') {
        throw Object.assign(new Error('Akun Kas/Bank tidak valid untuk diposting atau bukan akun ASSET'), { statusCode: 400 });
      }

      // 5. Generate Payment No
      const paymentNo = await VendorPaymentModel.generateSequenceNumber(connection);
      const amount = Number(invoice.total_amount);

      // 6. Create vendor_payments record
      const paymentId = await VendorPaymentModel.create({
        payment_no: paymentNo,
        payment_date: paymentDate,
        vendor_id: invoice.vendor_id,
        cash_account_id: cashAccountId,
        total_amount: amount,
        notes: notes || `Payment for Invoice ${invoice.ap_invoice_no}`,
        status: 'POSTED', // directly posted
        transaction_id: null,
        created_by: userId
      }, connection);

      // 7. Create vendor_payment_allocations record
      await VendorPaymentModel.createAllocation({
        vendor_payment_id: paymentId,
        vendor_invoice_id: invoiceId,
        allocated_amount: amount
      }, connection);

      // 8. Create Finance Transaction
      const journalEntries = [
        {
          accountId: apAccount.id,
          type: 'DEBIT',
          amount: amount,
          description: `Pelunasan Hutang - ${invoice.ap_invoice_no}`
        },
        {
          accountId: cashAccount.id,
          type: 'CREDIT',
          amount: amount,
          description: `Pembayaran Vendor - ${invoice.ap_invoice_no}`
        }
      ];

      const transactionData = {
        date: paymentDate,
        type: 'JOURNAL',
        description: `Payment ${paymentNo} for Vendor Invoice ${invoice.ap_invoice_no}`,
        amount: amount,
        journalEntries: journalEntries
      };
      
      const sourceData = {
        sourceType: 'VENDOR_PAYMENT',
        sourceId: paymentId,
        sourceNumber: paymentNo
      };

      const transactionId = await TransactionService.createTransaction(transactionData, userId, connection, true, sourceData);

      // 9. Update Payment with Transaction ID
      await connection.query(`UPDATE vendor_payments SET transaction_id = ? WHERE id = ?`, [transactionId, paymentId]);

      // 10. Update Invoice to PAID
      await VendorInvoiceModel.updateStatus(invoiceId, 'PAID', userId, { paid: true }, connection);

      await connection.commit();
      
      return {
        paymentId,
        paymentNo,
        transactionId
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async getPayments(filters = {}) {
    return await VendorPaymentModel.findAll(filters);
  }

  static async getPaymentById(id) {
    const payment = await VendorPaymentModel.findById(id);
    if (!payment) return null;
    const allocations = await VendorPaymentModel.getAllocationsByPaymentId(id);
    return { ...payment, allocations };
  }
}

module.exports = VendorPaymentService;
