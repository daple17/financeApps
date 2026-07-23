import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, FolderTree, RefreshCw, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { Card, CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';

export default function CoaPage() {
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'ASSET',
    category: 'Lancar',
    parent_id: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { showSuccess, showError } = useToast();
  const { hasPermission } = useAuth();

  const fetchAccounts = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/coa');
      if (res.data.status === 'success') {
        setAccounts(res.data.data);
      }
    } catch (err) {
      showError('Gagal memuat daftar Chart of Accounts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingAccount(null);
    setFormData({ code: '', name: '', type: 'ASSET', category: 'Lancar', parent_id: '' });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (account) => {
    setEditingAccount(account);
    setFormData({
      code: account.code,
      name: account.name,
      type: account.type,
      category: account.category,
      parent_id: account.parent_id || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingAccount) {
        await api.put(`/coa/${editingAccount.id}`, formData);
        showSuccess('Akun berhasil diperbarui');
      } else {
        await api.post('/coa', formData);
        showSuccess('Akun baru berhasil ditambahkan');
      }
      setIsModalOpen(false);
      fetchAccounts();
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal menyimpan data akun';
      showError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id, code) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus akun ${code}?`)) return;
    try {
      await api.delete(`/coa/${id}`);
      showSuccess('Akun berhasil dihapus');
      fetchAccounts();
    } catch (err) {
      showError(err.response?.data?.message || 'Gagal menghapus akun');
    }
  };

  const getTypeBadgeVariant = (type) => {
    switch (type) {
      case 'ASSET': return 'info';
      case 'LIABILITY': return 'warning';
      case 'EQUITY': return 'default';
      case 'REVENUE': return 'success';
      case 'EXPENSE': return 'danger';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Title & Header Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <FolderTree className="w-6 h-6 text-sky-400" />
            Chart of Accounts (COA)
          </h1>
          <p className="text-sm text-slate-400 mt-1">Struktur hirarki kode akun keuangan organisasi.</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchAccounts} isLoading={isLoading}>
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          {hasPermission('coa.create') && (
            <Button variant="primary" size="sm" onClick={handleOpenCreateModal}>
              <Plus className="w-4 h-4" />
              Tambah Akun Baru
            </Button>
          )}
        </div>
      </div>

      {/* Main Accounts Table */}
      <Card>
        <CardHeader
          title="Daftar Kode Akun Keuangan"
          subtitle={`Total ${accounts.length} akun terdaftar dalam sistem`}
        />

        {isLoading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Memuat data akun...</div>
        ) : accounts.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">Belum ada akun yang dibuat.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/80 text-xs uppercase text-slate-400 border-b border-slate-700">
                <tr>
                  <th className="py-3 px-4">Kode Akun</th>
                  <th className="py-3 px-4">Nama Akun</th>
                  <th className="py-3 px-4">Tipe Akun</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Akun Induk (Parent)</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {accounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono font-bold text-sky-400">{acc.code}</td>
                    <td className="py-3 px-4 font-medium text-white">{acc.name}</td>
                    <td className="py-3 px-4">
                      <Badge variant={getTypeBadgeVariant(acc.type)}>{acc.type}</Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-400">{acc.category}</td>
                    <td className="py-3 px-4 text-slate-400">{acc.parent_name || '-'}</td>
                    <td className="py-3 px-4 text-right space-x-2">
                      {hasPermission('coa.update') && (
                        <button
                          onClick={() => handleOpenEditModal(acc)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-slate-800 transition"
                          title="Edit Akun"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                      {hasPermission('coa.delete') && (
                        <button
                          onClick={() => handleDelete(acc.id, acc.code)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                          title="Hapus Akun"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAccount ? 'Edit Akun Keuangan' : 'Tambah Akun Keuangan Baru'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Kode Akun"
            placeholder="Misal: 1100"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            required
          />

          <Input
            label="Nama Akun"
            placeholder="Misal: Kas Utama Organisasi"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-300">Tipe Akun</label>
            <select
              className="bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              <option value="ASSET">ASSET (Aset)</option>
              <option value="LIABILITY">LIABILITY (Kewajiban/Hutang)</option>
              <option value="EQUITY">EQUITY (Ekuitas/Modal)</option>
              <option value="REVENUE">REVENUE (Pendapatan)</option>
              <option value="EXPENSE">EXPENSE (Beban Operasional)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-300">Kategori</label>
            <select
              className="bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
            >
              <option value="" disabled>Pilih Kategori...</option>
              <option value="Lancar">Lancar</option>
              <option value="Tetap">Tetap</option>
              <option value="Jangka Pendek">Jangka Pendek</option>
              <option value="Pendapatan Utama">Pendapatan Utama</option>
              <option value="Operasional">Operasional</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-300">Akun Induk (Opsional)</label>
            <select
              className="bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500"
              value={formData.parent_id}
              onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
            >
              <option value="">-- Tanpa Induk (Header Level 1) --</option>
              {accounts
                .filter((a) => !editingAccount || a.id !== editingAccount.id)
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.code} - {a.name}
                  </option>
                ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              <CheckCircle2 className="w-4 h-4" />
              Simpan Akun
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
