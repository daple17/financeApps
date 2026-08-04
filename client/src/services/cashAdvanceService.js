import api from './api';

export const getCashAdvances = async (params) => {
  const response = await api.get('cash-advances', { params });
  return response.data;
};

export const getCashAdvanceById = async (id) => {
  const response = await api.get(`cash-advances/${id}`);
  return response.data;
};

export const createCashAdvance = async (data) => {
  const response = await api.post('cash-advances', data);
  return response.data;
};

export const updateCashAdvance = async (id, data) => {
  const response = await api.put(`cash-advances/${id}`, data);
  return response.data;
};

export const deleteCashAdvance = async (id) => {
  const response = await api.delete(`cash-advances/${id}`);
  return response.data;
};

export const submitCashAdvance = async (id) => {
  const response = await api.post(`cash-advances/${id}/submit`);
  return response.data;
};
