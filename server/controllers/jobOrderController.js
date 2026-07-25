const JobOrderModel = require('../models/jobOrderModel');
const OperationCostModel = require('../models/operationCostModel');
const { JOB_ORDER_TYPES, JOB_ORDER_STATUSES, STATUS_TRANSITIONS } = require('../utils/constants');

const fieldLabels = {
  job_order_type: 'Tipe Job Order',
  customer_name: 'Nama Customer',
  service_type: 'Jenis Layanan',
  pickup_location: 'Nama Lokasi Pickup',
  pickup_address: 'Alamat Pickup',
  pickup_date: 'Jadwal Pickup',
  delivery_location: 'Nama Lokasi Tujuan',
  delivery_address: 'Alamat Tujuan',
  delivery_target_date: 'Target Delivery'
};

/**
 * Create a new Job Order
 */
exports.createJobOrder = async (req, res, next) => {
  try {
    const jobData = req.body;
    const userId = req.user.id; // From auth middleware

    // Basic Validation
    if (!jobData.job_date) {
      return res.status(400).json({ status: 'error', message: 'Tanggal Job Order (job_date) wajib diisi' });
    }

    const allowedTypes = Object.values(JOB_ORDER_TYPES);
    if (jobData.job_order_type && !allowedTypes.includes(jobData.job_order_type)) {
      return res.status(400).json({ status: 'error', message: 'Tipe Job Order tidak valid' });
    }

    if (jobData.job_status === JOB_ORDER_STATUSES.CONFIRMED) {
      const requiredFields = [
        'customer_name', 'service_type', 
        'pickup_location', 'pickup_address', 'pickup_date',
        'delivery_location', 'delivery_address', 'delivery_target_date'
      ];
      if (!jobData.job_order_type) {
        requiredFields.push('job_order_type');
      }
      
      const missing = requiredFields.filter(field => !jobData[field]);
      if (missing.length > 0) {
        const missingLabels = missing.map(f => fieldLabels[f] || f);
        return res.status(400).json({ 
          status: 'error', 
          message: `Field berikut wajib diisi untuk status CONFIRMED: ${missingLabels.join(', ')}`
        });
      }
    }

    const jobOrderId = await JobOrderModel.create(jobData, userId);
    
    // Fetch the newly created Job Order to return the generated number
    const newJobOrder = await JobOrderModel.findById(jobOrderId);

    res.status(201).json({
      status: 'success',
      message: 'Job Order berhasil dibuat',
      data: newJobOrder
    });
  } catch (error) {
    console.error('[JobOrder Controller - Create]:', error);
    next(error);
  }
};

/**
 * Get Job Order List
 */
exports.getJobOrders = async (req, res, next) => {
  try {
    const { search, status, type, startDate, endDate, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const [result, summary] = await Promise.all([
      JobOrderModel.findAll({
        search,
        status,
        type,
        startDate,
        endDate,
        limit: parseInt(limit),
        offset
      }),
      JobOrderModel.getSummaryCounts({
        search,
        type,
        startDate,
        endDate
      })
    ]);

    res.status(200).json({
      status: 'success',
      data: result.data,
      meta: {
        total: result.total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(result.total / limit),
        summary
      }
    });
  } catch (error) {
    console.error('[JobOrder Controller - Get List]:', error);
    next(error);
  }
};

/**
 * Get Job Order Detail by ID
 */
exports.getJobOrderDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const jobOrder = await JobOrderModel.findById(id);

    if (!jobOrder) {
      return res.status(404).json({
        status: 'error',
        message: 'Job Order tidak ditemukan'
      });
    }

    res.status(200).json({
      status: 'success',
      data: jobOrder
    });
  } catch (error) {
    console.error('[JobOrder Controller - Get Detail]:', error);
    next(error);
  }
};

/**
 * Update Job Order
 */
exports.updateJobOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const jobData = req.body;
    const userId = req.user.id;

    const existingJob = await JobOrderModel.findById(id);
    if (!existingJob) {
      return res.status(404).json({
        status: 'error',
        message: 'Job Order tidak ditemukan'
      });
    }

    const futureStatus = jobData.job_status || existingJob.job_status;
    const currentStatus = existingJob.job_status;

    if (jobData.job_status && jobData.job_status !== currentStatus) {
      const allowedNextStatuses = STATUS_TRANSITIONS[currentStatus] || [];
      if (!allowedNextStatuses.includes(jobData.job_status)) {
        return res.status(400).json({
          status: 'error',
          message: `Transisi status tidak valid. Tidak bisa mengubah status dari ${currentStatus} ke ${jobData.job_status}`
        });
      }
      
      // Cancellation rules
      if (jobData.job_status === JOB_ORDER_STATUSES.CANCELLED) {
        if (['IN_PROGRESS', 'COMPLETED'].includes(currentStatus)) {
          return res.status(400).json({
            status: 'error',
            message: `Job Order dengan status ${currentStatus} tidak dapat dibatalkan secara manual. Batalkan operations terlebih dahulu.`
          });
        }
        
        // Verify no operation has started
        const OperationModel = require('../models/operationModel');
        const ops = await OperationModel.findByJobOrderId(id);
        const EXECUTION_STATUSES = [
          'STARTED', 'ARRIVED_PICKUP', 'PICKED_UP', 'IN_TRANSIT', 
          'ARRIVED_DESTINATION', 'DELIVERED', 'COMPLETED'
        ];
        
        const hasStartedOps = ops.some(op => EXECUTION_STATUSES.includes(op.status));
        if (hasStartedOps) {
          return res.status(400).json({
            status: 'error',
            message: 'Tidak dapat membatalkan Job Order karena ada Operation yang sudah berjalan.'
          });
        }
      }
    }

    // Validation for CONFIRMED
    if (futureStatus === JOB_ORDER_STATUSES.CONFIRMED) {
      const requiredFields = [
        'customer_name', 'service_type', 
        'pickup_location', 'pickup_address', 'pickup_date',
        'delivery_location', 'delivery_address', 'delivery_target_date'
      ];
      if (!jobData.job_order_type && !existingJob.job_order_type) {
        requiredFields.push('job_order_type');
      }
      
      const missing = requiredFields.filter(field => !jobData[field] && !existingJob[field]);
      if (missing.length > 0) {
        const missingLabels = missing.map(f => fieldLabels[f] || f);
        return res.status(400).json({ 
          status: 'error', 
          message: `Field berikut wajib diisi untuk status CONFIRMED: ${missingLabels.join(', ')}`
        });
      }
    }

    const allowedTypes = Object.values(JOB_ORDER_TYPES);
    if (jobData.job_order_type && !allowedTypes.includes(jobData.job_order_type)) {
      return res.status(400).json({ status: 'error', message: 'Tipe Job Order tidak valid' });
    }

    await JobOrderModel.update(id, jobData, userId);

    const updatedJobOrder = await JobOrderModel.findById(id);

    res.status(200).json({
      status: 'success',
      message: 'Job Order berhasil diperbarui',
      data: updatedJobOrder
    });
  } catch (error) {
    console.error('[JobOrder Controller - Update]:', error);
    next(error);
  }
};

exports.getCostSummary = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existingJob = await JobOrderModel.findById(id);
    if (!existingJob) {
      return res.status(404).json({ status: 'error', message: 'Job Order tidak ditemukan' });
    }

    const summaryData = await OperationCostModel.getJobOrderCostSummary(id);
    
    let totalRecordedCost = 0;
    let draftCost = 0;
    let submittedCost = 0;
    let approvedCost = 0;

    summaryData.by_status.forEach(item => {
      const amount = parseFloat(item.total_amount || 0);
      totalRecordedCost += amount;
      if (item.status === 'DRAFT') draftCost += amount;
      if (item.status === 'SUBMITTED') submittedCost += amount;
      if (item.status === 'APPROVED') approvedCost += amount;
    });

    res.json({
      status: 'success',
      data: {
        job_order_id: id,
        total_actual_cost: totalRecordedCost, // BACKWARD COMPATIBILITY
        breakdown: summaryData.by_type,       // BACKWARD COMPATIBILITY
        summary: {
          total_recorded_cost: totalRecordedCost,
          draft_cost: draftCost,
          submitted_cost: submittedCost,
          approved_cost: approvedCost
        },
        by_type: summaryData.by_type,
        by_status: summaryData.by_status,
        by_operation: summaryData.by_operation
      }
    });
  } catch (error) {
    console.error('[JobOrder Controller - getCostSummary]:', error);
    next(error);
  }
};
