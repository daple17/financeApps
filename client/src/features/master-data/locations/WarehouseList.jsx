import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Building2 } from 'lucide-react';
import { masterDataService } from '../../../services/masterDataService';
import { Card } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import TableActionMenu from '../../../components/ui/TableActionMenu';

export default function WarehouseList() {
  const navigate = useNavigate();
  const [warehouses, setWarehouses] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [search, setSearch] = useState('');
  const [filterCountry, setFilterCountry] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const data = await masterDataService.getAllCountries({ status: 'ACTIVE' });
        setCountries(data);
      } catch (err) {
        console.error('Failed to load countries');
      }
    };
    fetchCountries();
  }, []);

  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        setLoading(true);
        const data = await masterDataService.getAllWarehouses({
          search,
          country_id: filterCountry,
          warehouse_type: filterType,
          status: filterStatus
        });
        setWarehouses(data);
      } catch (err) {
        setError(err.message || 'Gagal memuat data');
      } finally {
        setLoading(false);
      }
    };
    
    const timer = setTimeout(() => {
      fetchWarehouses();
    }, 300);
    
    return () => clearTimeout(timer);
  }, [search, filterCountry, filterType, filterStatus]);

  const summary = {
    total: warehouses.length,
    active: warehouses.filter(w => w.status === 'ACTIVE').length
  };

  const getTypeColor = (type) => {
    switch(type) {
      case 'OWN': return 'text-sky-400 bg-sky-500/10 border-sky-500/20';
      case 'CUSTOMER': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'VENDOR': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'PUBLIC': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      case 'BONDED': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-800 rounded-xl border border-slate-700">
            <Building2 className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Warehouse</h1>
            <p className="text-sm text-slate-400">Kelola master data gudang</p>
          </div>
        </div>
        <Button 
          onClick={() => navigate('/master-data/warehouses/create')}
          className="bg-sky-500 hover:bg-sky-400 text-white border-transparent"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah Warehouse
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-slate-800/50">
          <div className="text-sm text-slate-400 font-medium mb-1 uppercase">TOTAL WAREHOUSE</div>
          <div className="text-2xl font-bold text-white">{summary.total}</div>
        </Card>
        <Card className="p-4 bg-slate-800/50 border-emerald-500/20">
          <div className="text-sm text-emerald-400 font-medium mb-1 uppercase">ACTIVE WAREHOUSE</div>
          <div className="text-2xl font-bold text-white">{summary.active}</div>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card className="p-4 bg-slate-900/50">
        <div className="flex flex-col md:flex-row gap-4 flex-wrap">
          <div className="flex-1 relative min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari code, name, city..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-sky-500 transition-colors"
            />
          </div>
          
          <select 
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-sky-500"
            value={filterCountry}
            onChange={(e) => setFilterCountry(e.target.value)}
          >
            <option value="">Semua Negara</option>
            {countries.map(c => (
              <option key={c.id} value={c.id}>{c.country_name}</option>
            ))}
          </select>

          <select 
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-sky-500"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">Semua Tipe</option>
            <option value="OWN">Own (Milik Sendiri)</option>
            <option value="CUSTOMER">Customer</option>
            <option value="VENDOR">Vendor</option>
            <option value="PUBLIC">Public</option>
            <option value="BONDED">Bonded (Berikat)</option>
            <option value="OTHER">Other</option>
          </select>

          <select 
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-sky-500"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">Semua Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </Card>

      {/* List */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/50 border-b border-slate-800">
                <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider rounded-tl-xl w-32">CODE</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">WAREHOUSE NAME</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">TYPE</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">CITY / COUNTRY</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">OWNER</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider w-24">STATUS</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right w-24">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 rounded-full border-2 border-sky-500 border-t-transparent animate-spin"></div>
                      Memuat data...
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr><td colSpan="7" className="p-8 text-center text-rose-400">{error}</td></tr>
              ) : warehouses.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-12 text-center">
                    <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <div className="text-slate-300 font-medium">Data Tidak Ditemukan</div>
                    <div className="text-sm text-slate-500 mt-1">Belum ada master data warehouse atau kriteria pencarian tidak cocok.</div>
                  </td>
                </tr>
              ) : (
                warehouses.map((wh) => (
                  <tr key={wh.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm text-sky-400">{wh.warehouse_code}</span>
                    </td>
                    <td className="px-4 py-3 font-medium text-white">
                      {wh.warehouse_name}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${getTypeColor(wh.warehouse_type)}`}>
                        {wh.warehouse_type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-white">{wh.city || '-'}</div>
                      <div className="text-xs text-slate-500">{wh.country_name}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">
                      {wh.business_partner_name || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                        wh.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}>
                        {wh.status === 'ACTIVE' ? 'Aktif' : 'Non-aktif'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <TableActionMenu
                        onEdit={() => navigate(`/master-data/warehouses/${wh.id}/edit`)}
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
