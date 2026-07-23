import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ShieldCheck, RefreshCw, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { Card, CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';

const PERMISSION_GROUPS = [
  {
    module: 'Dashboard & Global',
    permissions: [
      { id: 'dashboard.read', label: 'Melihat Dashboard' },
      { id: '*', label: 'Super Admin (Semua Akses)' },
    ]
  },
  {
    module: 'Chart of Accounts (COA)',
    permissions: [
      { id: 'coa.read', label: 'Melihat COA' },
      { id: 'coa.create', label: 'Membuat COA' },
      { id: 'coa.update', label: 'Mengubah COA' },
      { id: 'coa.delete', label: 'Menghapus COA' },
    ]
  },
  {
    module: 'Transaksi',
    permissions: [
      { id: 'transactions.read', label: 'Melihat Transaksi' },
      { id: 'transactions.create', label: 'Membuat Transaksi' },
      { id: 'transactions.update', label: 'Mengubah Transaksi' },
      { id: 'transactions.delete', label: 'Menghapus Transaksi' },
    ]
  },
  {
    module: 'Persetujuan (Approvals)',
    permissions: [
      { id: 'approvals.read', label: 'Melihat Persetujuan' },
      { id: 'approvals.approve', label: 'Setujui/Tolak Transaksi' },
    ]
  },
  {
    module: 'Anggaran & Laporan',
    permissions: [
      { id: 'budgets.read', label: 'Melihat Anggaran' },
      { id: 'budgets.manage', label: 'Mengelola Anggaran' },
      { id: 'reports.read', label: 'Melihat Laporan' },
    ]
  },
  {
    module: 'Administrator',
    permissions: [
      { id: 'users.read', label: 'Melihat Pengguna' },
      { id: 'users.create', label: 'Membuat Pengguna' },
      { id: 'users.update', label: 'Mengubah Pengguna' },
      { id: 'users.delete', label: 'Menghapus Pengguna' },
      { id: 'roles.read', label: 'Melihat Role' },
      { id: 'roles.create', label: 'Membuat Role' },
      { id: 'roles.update', label: 'Mengubah Role' },
      { id: 'roles.delete', label: 'Menghapus Role' },
    ]
  }
];

const getPermissionLabel = (permId) => {
  if (permId === '*') return 'Semua Akses (*)';
  for (const group of PERMISSION_GROUPS) {
    const found = group.permissions.find(p => p.id === permId);
    if (found) return found.label;
  }
  
  if (permId.endsWith('.*')) {
    const module = permId.split('.')[0];
    const moduleNames = {
      coa: 'COA', transactions: 'Transaksi', approvals: 'Persetujuan',
      budgets: 'Anggaran', reports: 'Laporan', users: 'Pengguna', roles: 'Role'
    };
    if (moduleNames[module]) return `Kelola Semua ${moduleNames[module]}`;
  }

  return permId;
};


export default function RoleManagementPage() {
  const [roles, setRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { showSuccess, showError } = useToast();
  const { hasPermission } = useAuth();

  const fetchRoles = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/roles');
      if (res.data.status === 'success') {
        setRoles(res.data.data);
      }
    } catch (err) {
      showError('Gagal memuat daftar role');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingRole(null);
    setFormData({ name: '', description: '', permissions: [] });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description || '',
      permissions: role.permissions ? (typeof role.permissions === 'string' ? JSON.parse(role.permissions) : role.permissions) : [],
    });
    setIsModalOpen(true);
  };

  const handlePermissionToggle = (permissionId) => {
    setFormData((prev) => {
      const hasPerm = prev.permissions.includes(permissionId);
      if (hasPerm) {
        return { ...prev, permissions: prev.permissions.filter((p) => p !== permissionId) };
      } else {
        return { ...prev, permissions: [...prev.permissions, permissionId] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingRole) {
        await api.put(`/roles/${editingRole.id}`, formData);
        showSuccess('Role berhasil diperbarui');
      } else {
        await api.post('/roles', formData);
        showSuccess('Role baru berhasil ditambahkan');
      }
      setIsModalOpen(false);
      fetchRoles();
    } catch (err) {
      showError(err.response?.data?.message || 'Gagal menyimpan role');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus role ${name}?`)) return;
    try {
      await api.delete(`/roles/${id}`);
      showSuccess('Role berhasil dihapus');
      fetchRoles();
    } catch (err) {
      showError(err.response?.data?.message || 'Gagal menghapus role');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-sky-400" />
            Role Management
          </h1>
          <p className="text-sm text-slate-400 mt-1">Kelola peran dan hak akses pengguna dalam aplikasi.</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchRoles} isLoading={isLoading}>
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          {hasPermission('roles.*') && (
            <Button variant="primary" size="sm" onClick={handleOpenCreateModal}>
              <Plus className="w-4 h-4" />
              Tambah Role
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader
          title="Daftar Role Terdaftar"
          subtitle={`Total ${roles.length} role dalam sistem`}
        />

        {isLoading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Memuat data role...</div>
        ) : roles.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">Belum ada role terdaftar.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/80 text-xs uppercase text-slate-400 border-b border-slate-700">
                <tr>
                  <th className="py-3 px-4">Nama Role</th>
                  <th className="py-3 px-4">Deskripsi</th>
                  <th className="py-3 px-4">Hak Akses</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {roles.map((role) => {
                  let perms = [];
                  try {
                    perms = typeof role.permissions === 'string' ? JSON.parse(role.permissions) : (role.permissions || []);
                  } catch (e) {
                    perms = [];
                  }
                  
                  return (
                    <tr key={role.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-bold text-sky-400">{role.name}</td>
                      <td className="py-3 px-4 text-slate-400">{role.description}</td>
                      <td className="py-3 px-4 text-xs text-slate-500">
                        {perms.includes('*') ? (
                          <span className="px-2 py-1 rounded bg-sky-500/20 text-sky-400">Semua Akses (*)</span>
                        ) : (
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {perms.slice(0, 3).map(p => (
                              <span key={p} className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                                {getPermissionLabel(p)}
                              </span>
                            ))}
                            {perms.length > 3 && (
                              <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400">
                                +{perms.length - 3} lainnya
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        {hasPermission('roles.*') && (
                          <>
                            <button
                              onClick={() => handleOpenEditModal(role)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-slate-800 transition"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(role.id, role.name)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRole ? 'Edit Role' : 'Tambah Role Baru'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nama Role"
            placeholder="Misal: Supervisor"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Input
            label="Deskripsi"
            placeholder="Penjelasan singkat peran ini"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
            <label className="text-sm font-medium text-slate-300">Konfigurasi Hak Akses (Permissions)</label>
            <div className="max-h-[340px] overflow-y-auto pr-2 space-y-4">
              {PERMISSION_GROUPS.map((group) => (
                <div key={group.module} className="bg-slate-900 rounded-xl border border-slate-800 p-4">
                  <h4 className="text-sm font-semibold text-white mb-3 border-b border-slate-800 pb-2">
                    {group.module}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {group.permissions.map((perm) => (
                      <label key={perm.id} className="flex items-start gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          className="mt-1 w-4 h-4 rounded border-slate-700 text-sky-500 focus:ring-sky-500/20 bg-slate-800"
                          checked={formData.permissions.includes(perm.id)}
                          onChange={() => handlePermissionToggle(perm.id)}
                        />
                        <div className="flex flex-col mt-0.5">
                          <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                            {perm.label}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              <CheckCircle2 className="w-4 h-4" />
              Simpan Role
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
