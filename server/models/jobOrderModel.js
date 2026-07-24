const db = require('../config/db');

class JobOrderModel {
  /**
   * Generate Job Order Number: JO-YYYYMM-XXXX
   * Uses FOR UPDATE to lock rows safely if inside transaction.
   */
  static async generateJobOrderNumber(connection, jobDate) {
    const dateObj = new Date(jobDate);
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const prefix = `JO-${year}${month}-`;

    const query = `
      SELECT job_order_number 
      FROM job_orders 
      WHERE job_order_number LIKE ? 
      ORDER BY id DESC LIMIT 1
      FOR UPDATE
    `;
    const [rows] = await connection.query(query, [`${prefix}%`]);

    let sequence = 1;
    if (rows.length > 0) {
      const lastNumber = rows[0].job_order_number;
      const lastSequence = parseInt(lastNumber.split('-')[2], 10);
      if (!isNaN(lastSequence)) {
        sequence = lastSequence + 1;
      }
    }

    const paddedSequence = String(sequence).padStart(4, '0');
    return `${prefix}${paddedSequence}`;
  }

  /**
   * Insert a new Job Order and log activity
   */
  static async create(data, userId) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const jobOrderNumber = await this.generateJobOrderNumber(connection, data.job_date);

      const insertQuery = `
        INSERT INTO job_orders (
          job_order_number, job_date, job_order_type,
          customer_id, customer_contact_id,
          customer_name, customer_reference, customer_pic, customer_phone,
          service_type, service_type_id,
          pickup_location_type, pickup_reference_id, pickup_location, pickup_address, pickup_date,
          delivery_location_type, delivery_reference_id, delivery_location, delivery_address, delivery_target_date,
          cargo_type, cargo_description, cargo_quantity, cargo_unit, cargo_unit_id, cargo_weight, cargo_volume,
          vehicle_type_requirement, vehicle_type_id, vehicle_quantity,
          special_instruction, internal_notes,
          job_status,
          created_by
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )
      `;

      const [result] = await connection.query(insertQuery, [
        jobOrderNumber, data.job_date, data.job_order_type || null,
        data.customer_id || null, data.customer_contact_id || null,
        data.customer_name || null, data.customer_reference || null, data.customer_pic || null, data.customer_phone || null,
        data.service_type || null, data.service_type_id || null,
        data.pickup_location_type || null, data.pickup_reference_id || null, data.pickup_location || null, data.pickup_address || null, data.pickup_date || null,
        data.delivery_location_type || null, data.delivery_reference_id || null, data.delivery_location || null, data.delivery_address || null, data.delivery_target_date || null,
        data.cargo_type || null, data.cargo_description || null, data.cargo_quantity || null, data.cargo_unit || null, data.cargo_unit_id || null, data.cargo_weight || null, data.cargo_volume || null,
        data.vehicle_type_requirement || null, data.vehicle_type_id || null, data.vehicle_quantity || null,
        data.special_instruction || null, data.internal_notes || null,
        data.job_status || 'DRAFT',
        userId
      ]);

      const jobOrderId = result.insertId;

      // Handle Export Details
      if (data.job_order_type === 'EXPORT' && data.export_details) {
        const ed = data.export_details;
        const exportQuery = `
          INSERT INTO export_details (
            job_order_id, customs_document_type, customs_document_other,
            aju_number, invoice_number, shipper,
            bl_number, bl_date, hbl_number, hbl_date, si_do_number, si_do_date,
            eta_date, etd_date, planned_delivery_date, vessel, warehouse, party_volume_type,
            container_20_qty, container_40_qty, container_45_qty, container_ot_qty, container_fr_qty,
            tonnage, volume_m3, quantity, unit
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        await connection.query(exportQuery, [
          jobOrderId, ed.customs_document_type || null, ed.customs_document_other || null,
          ed.aju_number || null, ed.invoice_number || null, ed.shipper || null,
          ed.bl_number || null, ed.bl_date || null, ed.hbl_number || null, ed.hbl_date || null, ed.si_do_number || null, ed.si_do_date || null,
          ed.eta_date || null, ed.etd_date || null, ed.planned_delivery_date || null, ed.vessel || null, ed.warehouse || null, ed.party_volume_type || null,
          ed.container_20_qty || 0, ed.container_40_qty || 0, ed.container_45_qty || 0, ed.container_ot_qty || 0, ed.container_fr_qty || 0,
          ed.tonnage || null, ed.volume_m3 || null, ed.quantity || null, ed.unit || null
        ]);
      }

      // Handle Import Details
      if (data.job_order_type === 'IMPORT' && data.import_details) {
        const imp = data.import_details;
        const importQuery = `
          INSERT INTO import_details (
            job_order_id, customs_document_type, customs_document_other,
            aju_number, invoice_number, shipper,
            bl_number, bl_date, hbl_number, hbl_date, do_number, do_date,
            eta_date, planned_delivery_date, vessel, warehouse, party_volume_type,
            container_20_qty, container_40_qty, container_45_qty, container_ot_qty, container_fr_qty
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        await connection.query(importQuery, [
          jobOrderId, imp.customs_document_type || null, imp.customs_document_other || null,
          imp.aju_number || null, imp.invoice_number || null, imp.shipper || null,
          imp.bl_number || null, imp.bl_date || null, imp.hbl_number || null, imp.hbl_date || null, imp.do_number || null, imp.do_date || null,
          imp.eta_date || null, imp.planned_delivery_date || null, imp.vessel || null, imp.warehouse || null, imp.party_volume_type || null,
          imp.container_20_qty || 0, imp.container_40_qty || 0, imp.container_45_qty || 0, imp.container_ot_qty || 0, imp.container_fr_qty || 0
        ]);
      }

      // Handle Trucking Details
      if (data.job_order_type === 'TRUCKING' && data.trucking_details) {
        const trk = data.trucking_details;
        const truckingQuery = `
          INSERT INTO trucking_details (
            job_order_id, bl_number, bl_date, si_do_number, si_do_date,
            vessel, planned_delivery_date, party_volume_type,
            weight, volume, quantity, unit
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        await connection.query(truckingQuery, [
          jobOrderId, trk.bl_number || null, trk.bl_date || null, trk.si_do_number || null, trk.si_do_date || null,
          trk.vessel || null, trk.planned_delivery_date || null, trk.party_volume_type || null,
          trk.weight || null, trk.volume || null, trk.quantity || null, trk.unit || null
        ]);

        if (trk.party_volume_type === 'FCL' && Array.isArray(trk.containers) && trk.containers.length > 0) {
          const containerData = trk.containers.map(c => [
            jobOrderId, c.type || '', c.type_id || null, c.quantity || 1
          ]);
          const containerQuery = `
            INSERT INTO trucking_containers (job_order_id, container_type, container_type_id, quantity)
            VALUES ?
          `;
          await connection.query(containerQuery, [containerData]);
        }
      }

      // Handle Project Details
      if (data.job_order_type === 'PROJECT' && data.project_details) {
        const proj = data.project_details;
        const projectQuery = `
          INSERT INTO project_details (
            job_order_id, si_do_number, si_do_date, planned_delivery_date,
            project_name, project_site, site_pic_name, site_pic_phone
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        await connection.query(projectQuery, [
          jobOrderId, proj.si_do_number || null, proj.si_do_date || null, proj.planned_delivery_date || null,
          proj.project_name || null, proj.project_site || null, proj.site_pic_name || null, proj.site_pic_phone || null
        ]);
      }

      // Log Activity
      const activityQuery = `
        INSERT INTO job_order_activities (job_order_id, activity_type, description, performed_by, source)
        VALUES (?, ?, ?, ?, ?)
      `;
      await connection.query(activityQuery, [
        jobOrderId,
        'JOB_CREATED',
        'Job Order dibuat',
        userId,
        'WEB'
      ]);

      await connection.commit();
      return jobOrderId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Get list of Job Orders with pagination and filters
   */
  static async findAll({ search, status, type, startDate, endDate, limit = 20, offset = 0 }) {
    let query = `
      SELECT 
        j.*,
        u.name AS created_by_name,
        COALESCE(bp.partner_name, j.customer_name) AS display_customer_name,
        COALESCE(st.name, j.service_type) AS display_service_type,
        COALESCE(cu.name, j.cargo_unit) AS display_cargo_unit,
        COALESCE(vt.name, j.vehicle_type_requirement) AS display_vehicle_type,
        ed.bl_number AS export_bl_number, ed.si_do_number AS export_si_number, ed.vessel AS export_vessel, ed.eta_date AS export_eta, ed.etd_date AS export_etd, ed.planned_delivery_date AS export_planned,
        imp.bl_number AS import_bl_number, imp.do_number AS import_do_number, imp.vessel AS import_vessel, imp.eta_date AS import_eta, imp.planned_delivery_date AS import_planned,
        trk.bl_number AS trucking_bl_number, trk.si_do_number AS trucking_si_do_number, trk.vessel AS trucking_vessel, trk.planned_delivery_date AS trucking_planned,
        proj.si_do_number AS project_si_do_number, proj.planned_delivery_date AS project_planned
      FROM job_orders j
      JOIN users u ON j.created_by = u.id
      LEFT JOIN business_partners bp ON j.customer_id = bp.id
      LEFT JOIN service_types st ON j.service_type_id = st.id
      LEFT JOIN cargo_units cu ON j.cargo_unit_id = cu.id
      LEFT JOIN vehicle_types vt ON j.vehicle_type_id = vt.id
      LEFT JOIN export_details ed ON j.id = ed.job_order_id
      LEFT JOIN import_details imp ON j.id = imp.job_order_id
      LEFT JOIN trucking_details trk ON j.id = trk.job_order_id
      LEFT JOIN project_details proj ON j.id = proj.job_order_id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND (j.job_order_number LIKE ? OR j.customer_name LIKE ? OR bp.partner_name LIKE ? OR j.pickup_location LIKE ? OR j.delivery_location LIKE ?)`;
      const searchWildcard = `%${search}%`;
      params.push(searchWildcard, searchWildcard, searchWildcard, searchWildcard, searchWildcard);
    }

    if (status) {
      query += ` AND j.job_status = ?`;
      params.push(status);
    }

    // Add type filter
    if (type) {
      query += ` AND j.job_order_type = ?`;
      params.push(type);
    }

    if (startDate && endDate) {
      query += ` AND j.job_date BETWEEN ? AND ?`;
      params.push(startDate, endDate);
    }

    query += ` ORDER BY j.created_at DESC, j.id DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const [rows] = await db.query(query, params);

    const mappedRows = rows.map(row => {
      const { 
        export_bl_number, export_si_number, export_vessel, export_eta, export_etd, export_planned,
        import_bl_number, import_do_number, import_vessel, import_eta, import_planned,
        trucking_bl_number, trucking_si_do_number, trucking_vessel, trucking_planned,
        project_si_do_number, project_planned,
        display_customer_name, display_service_type, display_cargo_unit, display_vehicle_type,
        ...job
      } = row;
      
      job.customer_name = display_customer_name || job.customer_name;
      
      if (job.job_order_type === 'EXPORT') {
        job.export_detail = {
          bl_number: export_bl_number,
          si_do_number: export_si_number,
          vessel: export_vessel,
          eta_date: export_eta,
          etd_date: export_etd,
          planned_delivery_date: export_planned
        };
      } else if (job.job_order_type === 'IMPORT') {
        job.import_detail = {
          bl_number: import_bl_number,
          do_number: import_do_number,
          vessel: import_vessel,
          eta_date: import_eta,
          planned_delivery_date: import_planned
        };
      } else if (job.job_order_type === 'TRUCKING') {
        job.trucking_detail = {
          bl_number: trucking_bl_number,
          si_do_number: trucking_si_do_number,
          vessel: trucking_vessel,
          planned_delivery_date: trucking_planned
        };
      } else if (job.job_order_type === 'PROJECT') {
        job.project_detail = {
          si_do_number: project_si_do_number,
          planned_delivery_date: project_planned
        };
      }
      
      return job;
    });

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM job_orders j WHERE 1=1`;
    const countParams = [];
    
    if (search) {
      countQuery += ` AND (j.job_order_number LIKE ? OR j.customer_name LIKE ? OR j.pickup_location LIKE ? OR j.delivery_location LIKE ?)`;
      const searchWildcard = `%${search}%`;
      countParams.push(searchWildcard, searchWildcard, searchWildcard, searchWildcard);
    }
    if (status) { countQuery += ` AND j.job_status = ?`; countParams.push(status); }
    if (type) { countQuery += ` AND j.job_order_type = ?`; countParams.push(type); }
    if (startDate && endDate) { countQuery += ` AND j.job_date BETWEEN ? AND ?`; countParams.push(startDate, endDate); }
    
    const [countRows] = await db.query(countQuery, countParams);

    return {
      data: mappedRows,
      total: countRows[0].total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    };
  }

  /**
   * Get summary counts for Job Orders (ignoring status filter, but keeping others)
   */
  static async getSummaryCounts({ search, type, startDate, endDate }) {
    let query = `
      SELECT 
        COUNT(*) as total_jobs,
        SUM(CASE WHEN job_status = 'IN_PROGRESS' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN job_status = 'COMPLETED' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN job_status = 'DRAFT' THEN 1 ELSE 0 END) as draft
      FROM job_orders j
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND (j.job_order_number LIKE ? OR j.customer_name LIKE ? OR j.pickup_location LIKE ? OR j.delivery_location LIKE ? OR j.customer_id IN (SELECT id FROM business_partners WHERE partner_name LIKE ?))`;
      const searchWildcard = `%${search}%`;
      params.push(searchWildcard, searchWildcard, searchWildcard, searchWildcard, searchWildcard);
    }
    
    if (type) {
      query += ` AND j.job_order_type = ?`;
      params.push(type);
    }

    if (startDate && endDate) {
      query += ` AND j.job_date BETWEEN ? AND ?`;
      params.push(startDate, endDate);
    }

    const [rows] = await db.query(query, params);
    
    return {
      total: parseInt(rows[0].total_jobs || 0),
      in_progress: parseInt(rows[0].in_progress || 0),
      completed: parseInt(rows[0].completed || 0),
      draft: parseInt(rows[0].draft || 0)
    };
  }

  /**
   * Get single Job Order details with activities
   */
  static async findById(id) {
    const query = `
      SELECT 
        j.*,
        u.name AS created_by_name,
        up.name AS updated_by_name,
        COALESCE(bp.partner_name, j.customer_name) AS display_customer_name,
        bpc.name AS display_customer_pic,
        bpc.phone AS display_customer_phone,
        COALESCE(st.name, j.service_type) AS display_service_type,
        COALESCE(cu.name, j.cargo_unit) AS display_cargo_unit,
        COALESCE(vt.name, j.vehicle_type_requirement) AS display_vehicle_type
      FROM job_orders j
      JOIN users u ON j.created_by = u.id
      LEFT JOIN users up ON j.updated_by = up.id
      LEFT JOIN business_partners bp ON j.customer_id = bp.id
      LEFT JOIN business_partner_contacts bpc ON j.customer_contact_id = bpc.id
      LEFT JOIN service_types st ON j.service_type_id = st.id
      LEFT JOIN cargo_units cu ON j.cargo_unit_id = cu.id
      LEFT JOIN vehicle_types vt ON j.vehicle_type_id = vt.id
      WHERE j.id = ?
    `;
    const [rows] = await db.query(query, [id]);
    if (rows.length === 0) return null;

    const jobOrder = rows[0];
    
    // Merge master data displays into the legacy fields for uniform frontend usage
    if (jobOrder.display_customer_name) jobOrder.customer_name = jobOrder.display_customer_name;
    if (jobOrder.display_customer_pic) jobOrder.customer_pic = jobOrder.display_customer_pic;
    if (jobOrder.display_customer_phone) jobOrder.customer_phone = jobOrder.display_customer_phone;
    if (jobOrder.display_service_type) jobOrder.service_type = jobOrder.display_service_type;
    if (jobOrder.display_cargo_unit) jobOrder.cargo_unit = jobOrder.display_cargo_unit;
    if (jobOrder.display_vehicle_type) jobOrder.vehicle_type_requirement = jobOrder.display_vehicle_type;
    
    delete jobOrder.display_customer_name;
    delete jobOrder.display_customer_pic;
    delete jobOrder.display_customer_phone;
    delete jobOrder.display_service_type;
    delete jobOrder.display_cargo_unit;
    delete jobOrder.display_vehicle_type;

    // Fetch export details if type is EXPORT
    if (jobOrder.job_order_type === 'EXPORT') {
      const exportQuery = `SELECT * FROM export_details WHERE job_order_id = ?`;
      const [exportRows] = await db.query(exportQuery, [id]);
      if (exportRows.length > 0) {
        jobOrder.export_details = exportRows[0];
      }
    }

    // Fetch import details if type is IMPORT
    if (jobOrder.job_order_type === 'IMPORT') {
      const importQuery = `SELECT * FROM import_details WHERE job_order_id = ?`;
      const [importRows] = await db.query(importQuery, [id]);
      if (importRows.length > 0) {
        jobOrder.import_details = importRows[0];
      }
    }

    // Fetch trucking details if type is TRUCKING
    if (jobOrder.job_order_type === 'TRUCKING') {
      const truckingQuery = `SELECT * FROM trucking_details WHERE job_order_id = ?`;
      const [truckingRows] = await db.query(truckingQuery, [id]);
      if (truckingRows.length > 0) {
        jobOrder.trucking_details = truckingRows[0];
        
        // Fetch containers
        const containersQuery = `
          SELECT 
            COALESCE(ct.code, tc.container_type) as type, 
            COALESCE(ct.id, tc.container_type_id) as type_id,
            tc.quantity 
          FROM trucking_containers tc
          LEFT JOIN container_types ct ON tc.container_type_id = ct.id
          WHERE tc.job_order_id = ? 
          ORDER BY tc.id ASC
        `;
        const [containerRows] = await db.query(containersQuery, [id]);
        jobOrder.trucking_details.containers = containerRows;
      }
    }

    // Fetch project details if type is PROJECT
    if (jobOrder.job_order_type === 'PROJECT') {
      const projectQuery = `SELECT * FROM project_details WHERE job_order_id = ?`;
      const [projectRows] = await db.query(projectQuery, [id]);
      if (projectRows.length > 0) {
        jobOrder.project_details = projectRows[0];
      }
    }

    // Fetch activities
    const activityQuery = `
      SELECT 
        a.*,
        u.name AS performed_by_name
      FROM job_order_activities a
      LEFT JOIN users u ON a.performed_by = u.id
      WHERE a.job_order_id = ?
      ORDER BY a.created_at DESC
    `;
    const [activityRows] = await db.query(activityQuery, [id]);

    return {
      ...jobOrder,
      activities: activityRows
    };
  }

  /**
   * Update Job Order
   */
  static async update(id, data, userId) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Get current JO to check status changes and type changes
      const [currentRows] = await connection.query(`SELECT job_status, job_order_type FROM job_orders WHERE id = ? FOR UPDATE`, [id]);
      if (currentRows.length === 0) throw new Error('Job Order tidak ditemukan');
      const currentStatus = currentRows[0].job_status;
      const currentType = currentRows[0].job_order_type;

      const updateQuery = `
        UPDATE job_orders SET
          job_date = ?, job_order_type = ?,
          customer_id = ?, customer_contact_id = ?,
          customer_name = ?, customer_reference = ?, customer_pic = ?, customer_phone = ?,
          service_type = ?, service_type_id = ?,
          pickup_location_type = ?, pickup_reference_id = ?, pickup_location = ?, pickup_address = ?, pickup_date = ?,
          delivery_location_type = ?, delivery_reference_id = ?, delivery_location = ?, delivery_address = ?, delivery_target_date = ?,
          cargo_type = ?, cargo_description = ?, cargo_quantity = ?, cargo_unit = ?, cargo_unit_id = ?, cargo_weight = ?, cargo_volume = ?,
          vehicle_type_requirement = ?, vehicle_type_id = ?, vehicle_quantity = ?,
          special_instruction = ?, internal_notes = ?,
          job_status = ?,
          updated_by = ?
        WHERE id = ?
      `;

      await connection.query(updateQuery, [
        data.job_date, data.job_order_type || null,
        data.customer_id || null, data.customer_contact_id || null,
        data.customer_name || null, data.customer_reference || null, data.customer_pic || null, data.customer_phone || null,
        data.service_type || null, data.service_type_id || null,
        data.pickup_location_type || null, data.pickup_reference_id || null, data.pickup_location || null, data.pickup_address || null, data.pickup_date || null,
        data.delivery_location_type || null, data.delivery_reference_id || null, data.delivery_location || null, data.delivery_address || null, data.delivery_target_date || null,
        data.cargo_type || null, data.cargo_description || null, data.cargo_quantity || null, data.cargo_unit || null, data.cargo_unit_id || null, data.cargo_weight || null, data.cargo_volume || null,
        data.vehicle_type_requirement || null, data.vehicle_type_id || null, data.vehicle_quantity || null,
        data.special_instruction || null, data.internal_notes || null,
        data.job_status || currentStatus,
        userId,
        id
      ]);

      // Handle Extension Type Integrity (Clean up stale extensions on type switch)
      if (data.job_order_type && data.job_order_type !== currentType) {
        if (currentType === 'IMPORT') {
          await connection.query(`DELETE FROM import_details WHERE job_order_id = ?`, [id]);
        } else if (currentType === 'EXPORT') {
          await connection.query(`DELETE FROM export_details WHERE job_order_id = ?`, [id]);
        } else if (currentType === 'TRUCKING') {
          await connection.query(`DELETE FROM trucking_details WHERE job_order_id = ?`, [id]);
          await connection.query(`DELETE FROM trucking_containers WHERE job_order_id = ?`, [id]);
        } else if (currentType === 'PROJECT') {
          await connection.query(`DELETE FROM project_details WHERE job_order_id = ?`, [id]);
        }
      }

      // Handle Export Details update
      if (data.job_order_type === 'EXPORT' && data.export_details) {
        const ed = data.export_details;
        const exportQuery = `
          INSERT INTO export_details (
            job_order_id, customs_document_type, customs_document_other,
            aju_number, invoice_number, shipper,
            bl_number, bl_date, hbl_number, hbl_date, si_do_number, si_do_date,
            eta_date, etd_date, planned_delivery_date, vessel, warehouse, party_volume_type,
            container_20_qty, container_40_qty, container_45_qty, container_ot_qty, container_fr_qty,
            tonnage, volume_m3, quantity, unit
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            customs_document_type = VALUES(customs_document_type), customs_document_other = VALUES(customs_document_other),
            aju_number = VALUES(aju_number), invoice_number = VALUES(invoice_number), shipper = VALUES(shipper),
            bl_number = VALUES(bl_number), bl_date = VALUES(bl_date), hbl_number = VALUES(hbl_number), hbl_date = VALUES(hbl_date),
            si_do_number = VALUES(si_do_number), si_do_date = VALUES(si_do_date),
            eta_date = VALUES(eta_date), etd_date = VALUES(etd_date), planned_delivery_date = VALUES(planned_delivery_date),
            vessel = VALUES(vessel), warehouse = VALUES(warehouse), party_volume_type = VALUES(party_volume_type),
            container_20_qty = VALUES(container_20_qty), container_40_qty = VALUES(container_40_qty), container_45_qty = VALUES(container_45_qty),
            container_ot_qty = VALUES(container_ot_qty), container_fr_qty = VALUES(container_fr_qty),
            tonnage = VALUES(tonnage), volume_m3 = VALUES(volume_m3), quantity = VALUES(quantity), unit = VALUES(unit)
        `;
        await connection.query(exportQuery, [
          id, ed.customs_document_type || null, ed.customs_document_other || null,
          ed.aju_number || null, ed.invoice_number || null, ed.shipper || null,
          ed.bl_number || null, ed.bl_date || null, ed.hbl_number || null, ed.hbl_date || null, ed.si_do_number || null, ed.si_do_date || null,
          ed.eta_date || null, ed.etd_date || null, ed.planned_delivery_date || null, ed.vessel || null, ed.warehouse || null, ed.party_volume_type || null,
          ed.container_20_qty || 0, ed.container_40_qty || 0, ed.container_45_qty || 0, ed.container_ot_qty || 0, ed.container_fr_qty || 0,
          ed.tonnage || null, ed.volume_m3 || null, ed.quantity || null, ed.unit || null
        ]);
      }

      // Handle Import Details update
      if (data.job_order_type === 'IMPORT' && data.import_details) {
        const imp = data.import_details;
        const importQuery = `
          INSERT INTO import_details (
            job_order_id, customs_document_type, customs_document_other,
            aju_number, invoice_number, shipper,
            bl_number, bl_date, hbl_number, hbl_date, do_number, do_date,
            eta_date, planned_delivery_date, vessel, warehouse, party_volume_type,
            container_20_qty, container_40_qty, container_45_qty, container_ot_qty, container_fr_qty
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            customs_document_type = VALUES(customs_document_type), customs_document_other = VALUES(customs_document_other),
            aju_number = VALUES(aju_number), invoice_number = VALUES(invoice_number), shipper = VALUES(shipper),
            bl_number = VALUES(bl_number), bl_date = VALUES(bl_date), hbl_number = VALUES(hbl_number), hbl_date = VALUES(hbl_date),
            do_number = VALUES(do_number), do_date = VALUES(do_date),
            eta_date = VALUES(eta_date), planned_delivery_date = VALUES(planned_delivery_date),
            vessel = VALUES(vessel), warehouse = VALUES(warehouse), party_volume_type = VALUES(party_volume_type),
            container_20_qty = VALUES(container_20_qty), container_40_qty = VALUES(container_40_qty), container_45_qty = VALUES(container_45_qty),
            container_ot_qty = VALUES(container_ot_qty), container_fr_qty = VALUES(container_fr_qty)
        `;
        await connection.query(importQuery, [
          id, imp.customs_document_type || null, imp.customs_document_other || null,
          imp.aju_number || null, imp.invoice_number || null, imp.shipper || null,
          imp.bl_number || null, imp.bl_date || null, imp.hbl_number || null, imp.hbl_date || null, imp.do_number || null, imp.do_date || null,
          imp.eta_date || null, imp.planned_delivery_date || null, imp.vessel || null, imp.warehouse || null, imp.party_volume_type || null,
          imp.container_20_qty || 0, imp.container_40_qty || 0, imp.container_45_qty || 0, imp.container_ot_qty || 0, imp.container_fr_qty || 0
        ]);
      }

      // Handle Trucking Details update
      if (data.job_order_type === 'TRUCKING' && data.trucking_details) {
        const trk = data.trucking_details;
        const truckingQuery = `
          INSERT INTO trucking_details (
            job_order_id, bl_number, bl_date, si_do_number, si_do_date,
            vessel, planned_delivery_date, party_volume_type
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            bl_number = VALUES(bl_number), bl_date = VALUES(bl_date),
            si_do_number = VALUES(si_do_number), si_do_date = VALUES(si_do_date),
            vessel = VALUES(vessel), planned_delivery_date = VALUES(planned_delivery_date),
            party_volume_type = VALUES(party_volume_type)
        `;
        await connection.query(truckingQuery, [
          id, trk.bl_number || null, trk.bl_date || null, trk.si_do_number || null, trk.si_do_date || null,
          trk.vessel || null, trk.planned_delivery_date || null, trk.party_volume_type || null
        ]);

        // Replace all containers
        await connection.query(`DELETE FROM trucking_containers WHERE job_order_id = ?`, [id]);
        
        if (trk.party_volume_type === 'FCL' && Array.isArray(trk.containers) && trk.containers.length > 0) {
          const containerData = trk.containers.map(c => [
            id, c.type || '', c.type_id || null, c.quantity || 1
          ]);
          const containerQuery = `
            INSERT INTO trucking_containers (job_order_id, container_type, container_type_id, quantity)
            VALUES ?
          `;
          await connection.query(containerQuery, [containerData]);
        }
      }

      // Handle Project Details update
      if (data.job_order_type === 'PROJECT' && data.project_details) {
        const proj = data.project_details;
        const projectQuery = `
          INSERT INTO project_details (
            job_order_id, si_do_number, si_do_date, planned_delivery_date,
            project_name, project_site, site_pic_name, site_pic_phone
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            si_do_number = VALUES(si_do_number), si_do_date = VALUES(si_do_date),
            planned_delivery_date = VALUES(planned_delivery_date),
            project_name = VALUES(project_name), project_site = VALUES(project_site),
            site_pic_name = VALUES(site_pic_name), site_pic_phone = VALUES(site_pic_phone)
        `;
        await connection.query(projectQuery, [
          id, proj.si_do_number || null, proj.si_do_date || null, proj.planned_delivery_date || null,
          proj.project_name || null, proj.project_site || null, proj.site_pic_name || null, proj.site_pic_phone || null
        ]);
      }

      // Log Update Activity
      const activities = [];
      activities.push([id, 'JOB_UPDATED', 'Informasi Job Order diperbarui', userId, 'WEB']);
      
      if (data.job_status && data.job_status !== currentStatus) {
        activities.push([id, 'STATUS_CHANGED', `Status Job Order berubah dari ${currentStatus} menjadi ${data.job_status}`, userId, 'WEB']);
      }

      const activityQuery = `
        INSERT INTO job_order_activities (job_order_id, activity_type, description, performed_by, source)
        VALUES ?
      `;
      await connection.query(activityQuery, [activities]);

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = JobOrderModel;
