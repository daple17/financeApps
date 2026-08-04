const DocumentModel = require('../models/documentModel');
const PodModel = require('../models/podModel');
const storageService = require('../services/storageService');

const documentController = {
  getOperationDocuments: async (req, res) => {
    try {
      const documents = await DocumentModel.getByOperation(req.params.id);
      res.json({ status: 'success', data: documents });
    } catch (error) {
      res.status(500).json({ status: 'error', message: error.message });
    }
  },

  getJobOrderDocuments: async (req, res) => {
    try {
      const documents = await DocumentModel.getByJobOrder(req.params.id);
      res.json({ status: 'success', data: documents });
    } catch (error) {
      res.status(500).json({ status: 'error', message: error.message });
    }
  },

  uploadDocument: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ status: 'error', message: 'No file uploaded' });
      }

      // 1. Process upload using Storage Service
      const filePath = await storageService.uploadFile(req.file);

      const docData = {
        operation_id: req.params.id,
        document_type: req.body.document_type || 'OTHER',
        document_number: req.body.document_number,
        document_date: req.body.document_date,
        file_name: req.file.originalname,
        file_path: filePath,
        mime_type: req.file.mimetype,
        file_size: req.file.size,
        notes: req.body.notes,
        uploaded_by: req.user.id
      };

      const docId = await DocumentModel.createDocument(docData);
      res.status(201).json({ status: 'success', data: { id: docId, ...docData } });
    } catch (error) {
      res.status(500).json({ status: 'error', message: error.message });
    }
  },

  deleteDocument: async (req, res) => {
    try {
      await DocumentModel.deleteDocument(req.params.docId, req.params.id, req.user.id);
      res.json({ status: 'success', message: 'Document deleted successfully' });
    } catch (error) {
      res.status(500).json({ status: 'error', message: error.message });
    }
  },

  getPod: async (req, res) => {
    try {
      const pod = await PodModel.getLatestByOperation(req.params.id);
      res.json({ status: 'success', data: pod });
    } catch (error) {
      res.status(500).json({ status: 'error', message: error.message });
    }
  },

  submitPod: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ status: 'error', message: 'Proof of Delivery evidence file is required' });
      }

      // 1. Save Document Evidence via Storage Service
      const filePath = await storageService.uploadFile(req.file);
      
      const docData = {
        operation_id: req.params.id,
        document_type: 'POD',
        file_name: req.file.originalname,
        file_path: filePath,
        mime_type: req.file.mimetype,
        file_size: req.file.size,
        uploaded_by: req.user.id
      };
      await DocumentModel.createDocument(docData);

      // 2. Save POD Metadata
      const podData = {
        operation_id: req.params.id,
        recipient_name: req.body.recipient_name,
        recipient_company: req.body.recipient_company,
        recipient_phone: req.body.recipient_phone,
        delivery_date: req.body.delivery_date,
        delivery_time: req.body.delivery_time,
        delivery_notes: req.body.delivery_notes,
        received_condition: req.body.received_condition,
        submitted_by: req.user.id
      };

      const podId = await PodModel.submitPod(podData);

      res.status(201).json({ status: 'success', data: { id: podId, ...podData } });
    } catch (error) {
      res.status(500).json({ status: 'error', message: error.message });
    }
  },

  verifyPod: async (req, res) => {
    try {
      const { action, reason } = req.body;
      let podId = req.params.podId || req.body.podId;
      if (!podId) {
        const pod = await PodModel.getLatestByOperation(req.params.id);
        if (!pod) return res.status(404).json({ status: 'error', message: 'POD not found for this operation' });
        podId = pod.id;
      }
      
      if (action === 'VERIFY') {
        await PodModel.verifyPod(podId, req.params.id, req.user.id);
        res.json({ status: 'success', message: 'POD Verified' });
      } else if (action === 'REJECT') {
        if (!reason) return res.status(400).json({ status: 'error', message: 'Rejection reason is required' });
        await PodModel.rejectPod(podId, req.params.id, req.user.id, reason);
        res.json({ status: 'success', message: 'POD Rejected' });
      } else {
        res.status(400).json({ status: 'error', message: 'Invalid action' });
      }
    } catch (error) {
      res.status(500).json({ status: 'error', message: error.message });
    }
  }
};

module.exports = documentController;
