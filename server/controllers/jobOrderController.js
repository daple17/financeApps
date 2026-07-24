const JobOrderModel = require('../models/jobOrderModel');
const { JOB_ORDER_TYPES, JOB_ORDER_STATUSES, STATUS_TRANSITIONS } = require('../utils/constants');

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
        return res.status(400).json({ 
          status: 'error', 
          message: `Field berikut wajib diisi untuk status CONFIRMED: ${missing.join(', ')}`
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
        return res.status(400).json({ 
          status: 'error', 
          message: `Field berikut wajib diisi untuk status CONFIRMED: ${missing.join(', ')}`
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
