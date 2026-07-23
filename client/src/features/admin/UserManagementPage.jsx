import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Users, RefreshCw, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { Card, CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    email: '',
    nip: '',
    phone_number: '',
    role_id: '',
    password: '',
    is_active: true
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { showSuccess, showError } = useToast();
  const { hasPermission } = useAuth();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [usersRes, rolesRes] = await Promise.all([
        api.get('/users'),
        api.get('/roles')
      ]);
      if (usersRes.data.status === 'success') setUsers(usersRes.data.data);
      if (rolesRes.data.status === 'success') setRoles(rolesRes.data.data);
    } catch (err) {
      showError('Gagal memuat data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      name: '',
      email: '',
      nip: '',
      phone_number: '',
      role_id: roles.length > 0 ? roles[0].id : '',
      password: '',
      is_active: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      name: user.name,
      email: user.email,
      nip: user.nip || '',
      phone_number: user.phone_number || '',
      role_id: user.role_id,
      password: '', // Kosongkan password saat edit, hanya diisi jika ingin diubah
      is_active: user.is_active === 1 || user.is_active === true
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingUser) {
        // Jika edit, jangan kirim password jika kosong
        const payload = { ...formData };
        if (!payload.password) delete payload.password;
        await api.put(`/users/${editingUser.id}`, payload);
        showSuccess('User berhasil diperbarui');
      } else {
        await api.post('/users', formData);
        showSuccess('User baru berhasil ditambahkan');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      showError(err.response?.data?.message || 'Gagal menyimpan user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus user ${name}?`)) return;
    try {
      await api.delete(`/users/${id}`);
      showSuccess('User berhasil dihapus');
      fetchData();
    } catch (err) {
      showError(err.response?.data?.message || 'Gagal menghapus user');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-sky-400" />
            User Management
          </h1>
          <p className="text-sm text-slate-400 mt-1">Kelola akun pengguna, info personal, dan role mereka.</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} isLoading={isLoading}>
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          {hasPermission('users.*') && (
            <Button variant="primary" size="sm" onClick={handleOpenCreateModal}>
              <Plus className="w-4 h-4" />
              Tambah User
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader
          title="Daftar Pengguna"
          subtitle={`Total ${users.length} pengguna terdaftar`}
        />

        {isLoading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Memuat data user...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">Belum ada user.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/80 text-xs uppercase text-slate-400 border-b border-slate-700">
                <tr>
                  <th className="py-3 px-4">Info User</th>
                  <th className="py-3 px-4">Kontak / NIP</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-sky-400">{u.username}</div>
                      <div className="text-xs text-slate-400">{u.name}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-slate-300">{u.email}</div>
                      <div className="text-xs text-slate-500">
                        {u.nip ? `NIP: ${u.nip}` : 'NIP: -'} | {u.phone_number ? `HP: ${u.phone_number}` : 'HP: -'}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300 text-xs">
                        {u.role_name}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {(u.is_active === 1 || u.is_active === true) ? (
                        <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 text-xs">Aktif</span>
                      ) : (
                        <span className="px-2 py-1 rounded bg-rose-500/20 text-rose-400 text-xs">Nonaktif</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      {hasPermission('users.*') && (
                        <>
                          <button
                            onClick={() => handleOpenEditModal(u)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-slate-800 transition"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(u.id, u.username)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? 'Edit User' : 'Tambah User Baru'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={<span>Username <span className="text-rose-500">*</span></span>}
              placeholder="Misal: jdoe"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
            />
            <Input
              label="Nama Lengkap"
              placeholder="Misal: John Doe"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Email"
              type="email"
              placeholder="john@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            <Input
              label="NIP"
              placeholder="Nomor Induk Pegawai"
              value={formData.nip}
              onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nomor HP"
              placeholder="Misal: 08123456789"
              value={formData.phone_number}
              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
            />
            
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-300">Role <span className="text-rose-500">*</span></label>
              <select
                className="bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
                value={formData.role_id}
                onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
                required
              >
                <option value="" disabled>Pilih Role</option>
                {roles.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800">
            <Input
              label={editingUser ? "Password Baru (Biarkan kosong jika tidak diubah)" : <span>Password <span className="text-rose-500">*</span></span>}
              type="password"
              placeholder="Minimal 6 karakter"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required={!editingUser}
            />
          </div>

          <div className="flex items-center gap-2 mt-4">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 rounded border-slate-700 text-sky-500 focus:ring-sky-500/20 bg-slate-800"
            />
            <label htmlFor="is_active" className="text-sm text-slate-300 cursor-pointer">
              Akun Aktif (Dapat login)
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              <CheckCircle2 className="w-4 h-4" />
              Simpan User
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
