import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Anchor } from 'lucide-react';
import { masterDataService } from '../../../services/masterDataService';
import { Card } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import TableActionMenu from '../../../components/ui/TableActionMenu';

export default function PortList() {
  const navigate = useNavigate();
  const [ports, setPorts] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [search, setSearch] = useState('');
  const [filterCountry, setFilterCountry] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterScope, setFilterScope] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const data = await masterDataService.getAllCountries({ status: 'ACTIVE' });
        setCountries(data);
      } catch (err) {
        console.error('Failed to fetch countries');
      }
    };
    fetchCountries();
  }, []);

  useEffect(() => {
    const fetchPorts = async () => {
      try {
        setLoading(true);
        const data = await masterDataService.getAllPorts({
          search,
          country_id: filterCountry,
          port_type: filterType,
          trade_scope: filterScope,
          status: filterStatus
        });
        setPorts(data);
      } catch (err) {
        setError(err.message || 'Gagal memuat data');
      } finally {
        setLoading(false);
      }
    };
    
    const timer = setTimeout(() => {
      fetchPorts();
    }, 300);
    
    return () => clearTimeout(timer);
  }, [search, filterCountry, filterType, filterScope, filterStatus]);

  const summary = {
    total: ports.length,
    active: ports.filter(p => p.status === 'ACTIVE').length
  };

  const getTypeColor = (type) => {
    switch(type) {
      case 'SEA_PORT': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'AIRPORT': return 'text-sky-400 bg-sky-500/10 border-sky-500/20';
      case 'INLAND_PORT': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-800 rounded-xl border border-slate-700">
            <Anchor className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Port</h1>
            <p className="text-sm text-slate-400">Kelola master data pelabuhan / bandara</p>
          </div>
        </div>
        <Button 
          onClick={() => navigate('/master-data/ports/create')}
          className="bg-sky-500 hover:bg-sky-400 text-white border-transparent"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah Port
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-slate-800/50">
          <div className="text-sm text-slate-400 font-medium mb-1 uppercase">TOTAL PORT</div>
          <div className="text-2xl font-bold text-white">{summary.total}</div>
        </Card>
        <Card className="p-4 bg-slate-800/50 border-emerald-500/20">
          <div className="text-sm text-emerald-400 font-medium mb-1 uppercase">ACTIVE PORT</div>
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
            <option value="SEA_PORT">Sea Port</option>
            <option value="AIRPORT">Airport</option>
            <option value="INLAND_PORT">Inland Port</option>
            <option value="OTHER">Other</option>
          </select>

          <select 
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-sky-500"
            value={filterScope}
            onChange={(e) => setFilterScope(e.target.value)}
          >
            <option value="">Semua Scope</option>
            <option value="INTERNATIONAL">International</option>
            <option value="DOMESTIC">Domestic</option>
            <option value="BOTH">Both</option>
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
                <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">PORT NAME</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">TYPE</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">SCOPE</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">CITY / COUNTRY</th>
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
              ) : ports.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-12 text-center">
                    <Anchor className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <div className="text-slate-300 font-medium">Data Tidak Ditemukan</div>
                    <div className="text-sm text-slate-500 mt-1">Belum ada master data port atau kriteria pencarian tidak cocok.</div>
                  </td>
                </tr>
              ) : (
                ports.map((port) => (
                  <tr key={port.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm text-sky-400">{port.port_code}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-white">{port.port_name}</div>
                      {port.un_locode && <div className="text-xs text-slate-500">UN/LOCODE: {port.un_locode}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${getTypeColor(port.port_type)}`}>
                        {port.port_type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-slate-300">{port.trade_scope}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-white">{port.city || '-'}</div>
                      <div className="text-xs text-slate-500">{port.country_name}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                        port.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}>
                        {port.status === 'ACTIVE' ? 'Aktif' : 'Non-aktif'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <TableActionMenu
                        onEdit={() => navigate(`/master-data/ports/${port.id}/edit`)}
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
