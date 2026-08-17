import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, Search, Receipt } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getVendorInvoices, getVendorInvoiceDashboard } from '../../../../services/vendorInvoiceService';
import { getBusinessPartners } from '../../../../services/masterDataService';
import { useToast } from '../../../../context/ToastContext';
import { useAuth } from '../../../../context/AuthContext';
import { Card } from '../../../../components/ui/Card';
import Button from '../../../../components/ui/Button';
import Badge from '../../../../components/ui/Badge';
import Input from '../../../../components/ui/Input';
import TableActionMenu from '../../../../components/ui/TableActionMenu';

export default function VendorInvoiceListPage() {
  const [invoices, setInvoices] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [search, setSearch] = useState('');
  const [vendorFilter, setVendorFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const navigate = useNavigate();
  const { showError } = useToast();
  const { hasPermission } = useAuth();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [invRes, dashRes] = await Promise.all([
        getVendorInvoices({ search, vendor_id: vendorFilter, status: statusFilter }),
        getVendorInvoiceDashboard()
      ]);
      if (invRes.status === 'success') {
        setInvoices(invRes.data);
      }
      if (dashRes.status === 'success') {
        setDashboard(dashRes.data);
      }
    } catch (err) {
      showError('Gagal memuat data Vendor Invoice');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVendors = async () => {
    try {
      const res = await getBusinessPartners({ role: 'VENDOR' });
      if (res.status === 'success') {
        setVendors(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  useEffect(() => {
    fetchData();
  }, [search, vendorFilter, statusFilter]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'DRAFT': return <Badge variant="default">Draft</Badge>;
      case 'SUBMITTED': return <Badge variant="warning">Submitted</Badge>;
      case 'APPROVED': return <Badge variant="success">Approved</Badge>;
      case 'REJECTED': return <Badge variant="danger">Rejected</Badge>;
      case 'POSTED': return <Badge variant="primary">Posted</Badge>;
      case 'PARTIALLY_PAID': return <Badge variant="info">Partially Paid</Badge>;
      case 'PAID': return <Badge variant="success">Paid</Badge>;
      case 'CANCELLED': return <Badge variant="default">Cancelled</Badge>;
      case 'VOIDED': return <Badge variant="danger">Voided</Badge>;
      default: return <Badge variant="default">{status}</Badge>;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Receipt className="w-6 h-6 text-sky-400" />
            Vendor Invoices
          </h1>
          <p className="text-slate-400 text-sm mt-1">Kelola tagihan dari vendor (Accounts Payable)</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={fetchData} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {hasPermission('vendor_invoice.create') && (
            <Button variant="primary" onClick={() => navigate('/vendor-invoices/new')}>
              <Plus className="w-4 h-4 mr-2" />
              Buat Invoice
            </Button>
          )}
        </div>
      </div>

      {dashboard && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Card className="p-4 bg-slate-800/50">
            <div className="text-slate-400 text-sm font-medium">Total</div>
            <div className="text-2xl font-bold text-white mt-1">{dashboard.total}</div>
          </Card>
          <Card className="p-4 bg-slate-800/50">
            <div className="text-slate-400 text-sm font-medium">Draft</div>
            <div className="text-2xl font-bold text-slate-300 mt-1">{dashboard.draft}</div>
          </Card>
          <Card className="p-4 bg-slate-800/50">
            <div className="text-slate-400 text-sm font-medium">Submitted</div>
            <div className="text-2xl font-bold text-amber-400 mt-1">{dashboard.submitted}</div>
          </Card>
          <Card className="p-4 bg-slate-800/50">
            <div className="text-slate-400 text-sm font-medium">Approved</div>
            <div className="text-2xl font-bold text-emerald-400 mt-1">{dashboard.approved}</div>
          </Card>
          <Card className="p-4 bg-slate-800/50">
            <div className="text-slate-400 text-sm font-medium">Posted</div>
            <div className="text-2xl font-bold text-sky-400 mt-1">{dashboard.posted}</div>
          </Card>
          <Card className="p-4 bg-slate-800/50">
            <div className="text-slate-400 text-sm font-medium">Paid</div>
            <div className="text-2xl font-bold text-emerald-500 mt-1">{dashboard.paid}</div>
          </Card>
        </div>
      )}

      <Card>
        <div className="p-4 border-b border-slate-700 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Cari No AP, Vendor Invoice, Customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-full"
              />
            </div>
            <div className="flex gap-4 sm:w-auto w-full">
              <select
                value={vendorFilter}
                onChange={(e) => setVendorFilter(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 block w-full p-2.5"
              >
                <option value="">Semua Vendor</option>
                {vendors.map(v => (
                  <option key={v.id} value={v.id}>{v.partner_name}</option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 block w-full p-2.5"
              >
                <option value="">Semua Status</option>
                <option value="DRAFT">Draft</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="APPROVED">Approved</option>
                <option value="POSTED">Posted</option>
                <option value="PAID">Paid</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-300">
            <thead className="text-xs text-slate-400 uppercase bg-slate-800/50 border-b border-slate-700">
              <tr>
                <th className="px-4 py-3 font-medium">AP No</th>
                <th className="px-4 py-3 font-medium">Vendor</th>
                <th className="px-4 py-3 font-medium">Vendor Invoice No</th>
                <th className="px-4 py-3 font-medium">Invoice Date</th>
                <th className="px-4 py-3 font-medium">Due Date</th>
                <th className="px-4 py-3 font-medium text-right">Total</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Memuat data...</span>
                    </div>
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <Receipt className="w-8 h-8 text-slate-500 mb-2" />
                      <p>Tidak ada vendor invoice yang ditemukan</p>
                    </div>
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-slate-700/50 hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-sky-400">{inv.ap_invoice_no}</td>
                    <td className="px-4 py-3">{inv.vendor_name}</td>
                    <td className="px-4 py-3">{inv.vendor_invoice_number}</td>
                    <td className="px-4 py-3">{formatDate(inv.invoice_date)}</td>
                    <td className="px-4 py-3">{formatDate(inv.due_date)}</td>
                    <td className="px-4 py-3 text-right font-medium text-white">{formatCurrency(inv.total_amount)}</td>
                    <td className="px-4 py-3">{getStatusBadge(inv.status)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center">
                        <TableActionMenu
                          onView={() => navigate(`/vendor-invoices/${inv.id}`)}
                          onEdit={inv.status === 'DRAFT' && hasPermission('vendor_invoice.edit') ? () => navigate(`/vendor-invoices/${inv.id}/edit`) : undefined}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
