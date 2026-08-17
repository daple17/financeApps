import React, { useState, useEffect } from 'react';
import { Search, Filter, RefreshCw, Banknote } from 'lucide-react';
import { vendorPaymentApi } from '../../../../services/vendorPaymentApi';
import { Card, CardHeader } from '../../../../components/ui/Card';
import Badge from '../../../../components/ui/Badge';
import Input from '../../../../components/ui/Input';
import Button from '../../../../components/ui/Button';

export default function VendorPaymentListPage() {
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      const res = await vendorPaymentApi.getPayments();
      if (res.status === 'success') {
        setPayments(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch payments', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(val);
  };

  const filteredPayments = payments.filter(p => 
    p.payment_no.toLowerCase().includes(search.toLowerCase()) ||
    p.vendor_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
            <Banknote className="w-6 h-6 text-sky-400" />
            Vendor Payments
          </h1>
          <p className="text-gray-400 mt-1">Riwayat pembayaran ke vendor (Accounts Payable)</p>
        </div>
        <Button variant="outline" onClick={fetchPayments} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader className="border-b border-gray-800 bg-gray-900/50">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="relative w-full sm:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Cari No Pembayaran / Vendor..."
                className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm text-gray-100 focus:outline-none focus:border-sky-500 transition-colors"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button variant="outline" className="w-full sm:w-auto">
              <Filter className="w-4 h-4 mr-2" /> Filter
            </Button>
          </div>
        </CardHeader>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-300">
            <thead className="text-xs text-gray-400 uppercase bg-gray-800/50">
              <tr>
                <th className="px-6 py-4">No. Pembayaran</th>
                <th className="px-6 py-4">Tanggal</th>
                <th className="px-6 py-4">Vendor</th>
                <th className="px-6 py-4">Total Amount</th>
                <th className="px-6 py-4">Akun Kas/Bank</th>
                <th className="px-6 py-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">Memuat data...</td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">Tidak ada data pembayaran ditemukan.</td>
                </tr>
              ) : (
                filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-200">
                      {payment.payment_no}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(payment.payment_date).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-6 py-4">{payment.vendor_name}</td>
                    <td className="px-6 py-4 font-medium text-gray-200">
                      {formatCurrency(payment.total_amount)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">{payment.cash_account_name}</div>
                      <div className="text-xs text-gray-500">{payment.cash_account_code}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Badge variant={payment.status === 'POSTED' ? 'success' : 'warning'}>
                        {payment.status}
                      </Badge>
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
