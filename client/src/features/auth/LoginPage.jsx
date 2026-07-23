import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Mail, Lock, LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@orgfinance.com');
  const [password, setPassword] = useState('Admin@123456');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { showError, showSuccess } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
      showSuccess('Login berhasil! Selamat datang kembali.');
      navigate('/dashboard');
    } catch (error) {
      const msg = error.response?.data?.message || 'Gagal login. Periksa email dan password Anda.';
      showError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic Background Effects */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-sky-700/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl z-10 space-y-8">
        {/* Brand Logo & Heading */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-inner">
            <Building2 className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">OrgFinance Login</h2>
          <p className="text-xs text-slate-400">
            Sistem Manajemen & Tata Kelola Keuangan Organisasi
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Alamat Email"
            type="email"
            icon={Mail}
            placeholder="nama@organisasi.org"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="Kata Sandi (Password)"
            type="password"
            icon={Lock}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full py-3 text-sm font-semibold mt-2"
            isLoading={isLoading}
          >
            <LogIn className="w-4 h-4" />
            Masuk ke Dashboard
          </Button>
        </form>

        {/* Quick Demo Accounts Info */}
        <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-2 text-xs text-slate-400">
          <div className="font-semibold text-slate-200">Akun Demo Default (Password: Admin@123456):</div>
          <div className="grid grid-cols-1 gap-1 text-[11px]">
            <div>• <span className="text-sky-400">Super Admin</span>: admin@orgfinance.com</div>
            <div>• <span className="text-sky-400">Finance Admin</span>: finance@orgfinance.com</div>
            <div>• <span className="text-sky-400">Manager / Approver</span>: manager@orgfinance.com</div>
          </div>
        </div>
      </div>
    </div>
  );
}
