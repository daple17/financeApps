import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, User } from 'lucide-react';
import { masterDataService } from '../../../services/masterDataService';
import { Card } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import TableActionMenu from '../../../components/ui/TableActionMenu';

export default function DriverList() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const data = await masterDataService.getDrivers({
          search,
          status: filterStatus
        });
        setItems(data.data || []);
      } catch (err) {
        setError(err.message || 'Gagal memuat data');
      } finally {
        setLoading(false);
      }
    };
    
    const timer = setTimeout(() => {
      fetchItems();
    }, 300);
    
    return () => clearTimeout(timer);
  }, [search, filterStatus]);

  const summary = {
    total: items.length,
    active: items.filter(p => p.status === 'ACTIVE').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-800 rounded-xl border border-slate-700">
            <User className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Driver</h1>
            <p className="text-sm text-slate-400">Kelola sumber daya operasional pengemudi</p>
          </div>
        </div>
        <Button 
          onClick={() => navigate('/master-data/drivers/create')}
          className="bg-sky-500 hover:bg-sky-400 text-white border-transparent"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah Driver
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-slate-800/50">
          <div className="text-sm text-slate-400 font-medium mb-1 uppercase">TOTAL DRIVER</div>
          <div className="text-2xl font-bold text-white">{summary.total}</div>
        </Card>
        <Card className="p-4 bg-slate-800/50 border-emerald-500/20">
          <div className="text-sm text-emerald-400 font-medium mb-1 uppercase">ACTIVE DRIVER</div>
          <div className="text-2xl font-bold text-white">{summary.active}</div>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card className="p-4 bg-slate-900/50">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari kode, nama, telepon..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-sky-500 transition-colors"
            />
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <select 
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-sky-500 flex-1 md:w-32"
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

      {/* List */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/50 border-b border-slate-800">
                <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider rounded-tl-xl">
                  CODE
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  DRIVER NAME
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  PHONE
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  LICENSE TYPE
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  EMPLOYMENT TYPE
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">
                  STATUS
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">
                  AVAILABILITY
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right rounded-tr-xl">
                  ACTION
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 rounded-full border-2 border-sky-500 border-t-transparent animate-spin"></div>
                      Memuat data...
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-rose-400">
                    {error}
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-12 text-center">
                    <User className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <div className="text-slate-300 font-medium">Data Tidak Ditemukan</div>
                    <div className="text-sm text-slate-500 mt-1">Belum ada data atau kriteria pencarian tidak cocok.</div>
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm text-sky-400">{item.driver_code}</span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-white">
                      {item.driver_name}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400">
                      {item.phone_number || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400">
                      {item.license_type || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400">
                      {item.employment_type === 'INTERNAL' ? 'Internal' : 'External / Freelance'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                        item.status === 'ACTIVE' 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}>
                        {item.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                        item.availability === 'AVAILABLE'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : item.availability === 'ASSIGNED'
                          ? 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                          : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                      }`}>
                        {item.availability}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <TableActionMenu
                        onEdit={() => navigate(`/master-data/drivers/${item.id}/edit`)}
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
