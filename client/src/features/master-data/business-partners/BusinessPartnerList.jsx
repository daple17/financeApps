import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, Search, Filter, Briefcase, Users, UserCheck } from 'lucide-react';
import { masterDataService } from '../../../services/masterDataService';
import { Card } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import TableActionMenu from '../../../components/ui/TableActionMenu';

export default function BusinessPartnerList({ defaultRole = null, title = 'Business Partner', icon: Icon = Briefcase }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState(defaultRole || '');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    // Reset filters if the route changes (e.g. going from Customer to Vendor)
    setFilterRole(defaultRole || '');
    setSearch('');
    setFilterStatus('');
  }, [location.pathname, defaultRole]);

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        setLoading(true);
        const data = await masterDataService.getAllBusinessPartners({
          search,
          role: filterRole,
          status: filterStatus
        });
        setPartners(data);
      } catch (err) {
        setError(err.message || 'Gagal memuat data');
      } finally {
        setLoading(false);
      }
    };
    
    // Debounce search slightly
    const timer = setTimeout(() => {
      fetchPartners();
    }, 300);
    
    return () => clearTimeout(timer);
  }, [search, filterRole, filterStatus]);

  const summary = {
    total: partners.length,
    customer: partners.filter(p => p.roles?.includes('CUSTOMER')).length,
    vendor: partners.filter(p => p.roles?.includes('VENDOR')).length,
    active: partners.filter(p => p.status === 'ACTIVE').length
  };

  const getRoleBadgeColor = (role) => {
    switch(role) {
      case 'CUSTOMER': return 'bg-sky-500/20 text-sky-400 border-sky-500/30';
      case 'VENDOR': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'SHIPPER': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-800 rounded-xl border border-slate-700">
            <Icon className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{title}</h1>
            <p className="text-sm text-slate-400">Kelola data {title.toLowerCase()} perusahaan</p>
          </div>
        </div>
        <Button 
          onClick={() => {
            const path = location.pathname.includes('/customers') ? '/master-data/customers/create' 
                       : location.pathname.includes('/vendors') ? '/master-data/vendors/create'
                       : '/master-data/business-partners/create';
            navigate(path);
          }}
          className="bg-sky-500 hover:bg-sky-400 text-white border-transparent"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah {title}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-slate-800/50">
          <div className="text-sm text-slate-400 font-medium mb-1 uppercase">TOTAL {title}</div>
          <div className="text-2xl font-bold text-white">{summary.total}</div>
        </Card>
        {!defaultRole && (
          <>
            <Card className="p-4 bg-sky-900/10 border-sky-500/20">
              <div className="text-sm text-sky-400 font-medium mb-1">CUSTOMER</div>
              <div className="text-2xl font-bold text-white">{summary.customer}</div>
            </Card>
            <Card className="p-4 bg-orange-900/10 border-orange-500/20">
              <div className="text-sm text-orange-400 font-medium mb-1">VENDOR</div>
              <div className="text-2xl font-bold text-white">{summary.vendor}</div>
            </Card>
          </>
        )}
        <Card className="p-4 bg-slate-800/50 border-emerald-500/20">
          <div className="text-sm text-emerald-400 font-medium mb-1 uppercase">ACTIVE {title}</div>
          <div className="text-2xl font-bold text-white">{summary.active}</div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              icon={Search}
              placeholder="Cari kode, nama, atau kota..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {!defaultRole && (
            <div className="w-full md:w-48">
              <select
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500"
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
              >
                <option value="">Semua Role</option>
                <option value="CUSTOMER">Customer</option>
                <option value="VENDOR">Vendor</option>
                <option value="SHIPPER">Shipper</option>
                <option value="SHIPPING_AGENT">Shipping Agent</option>
                <option value="SHIPPING_COMPANY">Shipping Company</option>
              </select>
            </div>
          )}
          <div className="w-full md:w-48">
            <select
              className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">Semua Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/50 border-b border-slate-800">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider rounded-tl-xl w-32">
                  CODE
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {defaultRole ? `${title} NAME` : 'PARTNER NAME'}
                </th>
                {!defaultRole && (
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider w-40">
                    ROLE
                  </th>
                )}
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  CITY
                </th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Primary Contact</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider w-24">Status</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right w-24">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-400">Memuat data...</td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-rose-400">{error}</td>
                </tr>
              ) : partners.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-400">Tidak ada data ditemukan</td>
                </tr>
              ) : (
                partners.map((partner) => (
                  <tr key={partner.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm text-sky-400">{partner.partner_code}</span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-white">
                      {partner.partner_name}
                    </td>
                    {!defaultRole && (
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          {partner.roles?.map(role => (
                            <span key={role} className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getRoleBadgeColor(role)}`}>
                              {role.replace('_', ' ')}
                            </span>
                          ))}
                        </div>
                      </td>
                    )}
                    <td className="px-4 py-3 text-sm text-slate-400">
                      {partner.city || '-'}
                    </td>
                    <td className="px-4 py-3">
                      {partner.primary_contact ? (
                        <div>
                          <div className="font-medium text-slate-300 text-sm">{partner.primary_contact.name}</div>
                          {partner.primary_contact.phone && <div className="text-xs text-slate-500">{partner.primary_contact.phone}</div>}
                        </div>
                      ) : (
                        <span className="text-slate-500 italic text-sm">Tidak ada</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                        partner.status === 'ACTIVE' 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}>
                        {partner.status === 'ACTIVE' ? 'Aktif' : 'Non-aktif'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <TableActionMenu
                        onEdit={() => navigate(`/master-data/business-partners/${partner.id}/edit`)}
                      />
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
