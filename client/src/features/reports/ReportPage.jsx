import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, RefreshCw, Download, Calculator, BookOpen, Scale } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Card, CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';

export default function ReportPage() {
  const [activeTab, setActiveTab] = useState('income'); // 'income', 'balance', 'ledger'
  const [isLoading, setIsLoading] = useState(false);
  
  // Data States
  const [incomeData, setIncomeData] = useState(null);
  const [balanceData, setBalanceData] = useState(null);
  const [ledgerData, setLedgerData] = useState(null);
  const [accounts, setAccounts] = useState([]);

  // Filter States
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0,10));
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0,10));
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().slice(0,10));
  const [selectedAccountId, setSelectedAccountId] = useState('');

  const { showError } = useToast();

  useEffect(() => {
    // Fetch accounts for General Ledger dropdown
    api.get('/coa').then(res => {
      if(res.data.status === 'success') setAccounts(res.data.data);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    fetchReport();
  }, [activeTab]);

  const fetchReport = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'income') {
        const res = await api.get('/reports/income-statement', { params: { startDate, endDate }});
        setIncomeData(res.data.data);
      } else if (activeTab === 'balance') {
        const res = await api.get('/reports/balance-sheet', { params: { asOfDate }});
        setBalanceData(res.data.data);
      } else if (activeTab === 'ledger') {
        if (!selectedAccountId && accounts.length > 0) {
           // Wait for user to select an account if none selected
           setIsLoading(false);
           return;
        }
        if (selectedAccountId) {
          const res = await api.get('/reports/general-ledger', { params: { accountId: selectedAccountId, startDate, endDate }});
          setLedgerData(res.data.data);
        }
      }
    } catch (err) {
      showError('Gagal memuat laporan keuangan');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-blue-400" />
            Laporan Keuangan
          </h1>
          <p className="text-sm text-slate-400 mt-1">Laba Rugi, Neraca, dan Buku Besar (General Ledger).</p>
        </div>

        <Button variant="outline" size="sm" onClick={handlePrint} className="bg-slate-800 text-white">
          <Download className="w-4 h-4" />
          Cetak / PDF
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-slate-800 print:hidden">
        <button
          onClick={() => setActiveTab('income')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-medium transition-colors ${
            activeTab === 'income' ? 'bg-slate-800 text-white border-t border-x border-slate-700' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calculator className="w-4 h-4" /> Laba Rugi
        </button>
        <button
          onClick={() => setActiveTab('balance')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-medium transition-colors ${
            activeTab === 'balance' ? 'bg-slate-800 text-white border-t border-x border-slate-700' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Scale className="w-4 h-4" /> Neraca
        </button>
        <button
          onClick={() => setActiveTab('ledger')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-medium transition-colors ${
            activeTab === 'ledger' ? 'bg-slate-800 text-white border-t border-x border-slate-700' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" /> Buku Besar
        </button>
      </div>

      {/* Filters */}
      <Card className="print:hidden">
        <div className="flex flex-wrap items-end gap-4">
          {activeTab === 'balance' ? (
            <Input label="Per Tanggal (As Of)" type="date" value={asOfDate} onChange={(e) => setAsOfDate(e.target.value)} />
          ) : (
            <>
              <div className="w-40">
                <Input label="Tanggal Mulai" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="w-40">
                <Input label="Tanggal Selesai" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </>
          )}

          {activeTab === 'ledger' && (
            <div className="flex-1 min-w-[200px] flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-300">Pilih Akun</label>
              <select
                className="bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-blue-500"
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
              >
                <option value="">-- Pilih Akun COA --</option>
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                ))}
              </select>
            </div>
          )}

          <Button variant="primary" onClick={fetchReport} isLoading={isLoading} className="bg-blue-600 hover:bg-blue-500 border-blue-500/30 h-[42px]">
            <RefreshCw className="w-4 h-4" /> Tampilkan
          </Button>
        </div>
      </Card>

      {/* Report Content */}
      <div className="bg-white text-slate-900 p-8 rounded-xl shadow-xl min-h-[500px] print:shadow-none print:p-0 print:bg-transparent">
        {isLoading ? (
          <div className="flex justify-center items-center h-64 text-slate-500">Memuat kalkulasi laporan...</div>
        ) : (
          <>
            {/* Laba Rugi */}
            {activeTab === 'income' && incomeData && (
              <div className="space-y-6">
                <div className="text-center border-b-2 border-slate-200 pb-4">
                  <h2 className="text-2xl font-bold uppercase tracking-widest text-slate-800">Laporan Laba Rugi</h2>
                  <p className="text-slate-600 mt-1">Periode: {incomeData.period.startDate} s.d {incomeData.period.endDate}</p>
                </div>
                
                <div>
                  <h3 className="font-bold text-lg text-slate-800 mb-2 border-b border-slate-200 pb-1">Pendapatan (Revenue)</h3>
                  <div className="space-y-1">
                    {incomeData.revenues.map(r => (
                      <div key={r.id} className="flex justify-between text-sm py-1">
                        <span>{r.code} - {r.name}</span>
                        <span className="font-mono">Rp {Number(r.total_amount).toLocaleString('id-ID')}</span>
                      </div>
                    ))}
                    <div className="flex justify-between font-bold text-sm pt-2 mt-2 border-t border-slate-200">
                      <span>Total Pendapatan</span>
                      <span className="font-mono text-emerald-600">Rp {Number(incomeData.summary.totalRevenue).toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-lg text-slate-800 mb-2 border-b border-slate-200 pb-1">Beban Operasional (Expense)</h3>
                  <div className="space-y-1">
                    {incomeData.expenses.map(r => (
                      <div key={r.id} className="flex justify-between text-sm py-1">
                        <span>{r.code} - {r.name}</span>
                        <span className="font-mono">Rp {Number(r.total_amount).toLocaleString('id-ID')}</span>
                      </div>
                    ))}
                    <div className="flex justify-between font-bold text-sm pt-2 mt-2 border-t border-slate-200">
                      <span>Total Beban Operasional</span>
                      <span className="font-mono text-rose-600">Rp {Number(incomeData.summary.totalExpense).toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </div>

                <div className={`flex items-center justify-between p-4 rounded-lg border-2 ${incomeData.summary.netIncome >= 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'}`}>
                  <span className="text-lg font-bold uppercase">{incomeData.summary.status}</span>
                  <span className="text-xl font-mono font-bold">Rp {Number(Math.abs(incomeData.summary.netIncome)).toLocaleString('id-ID')}</span>
                </div>
              </div>
            )}

            {/* Neraca */}
            {activeTab === 'balance' && balanceData && (
              <div className="space-y-6">
                <div className="text-center border-b-2 border-slate-200 pb-4">
                  <h2 className="text-2xl font-bold uppercase tracking-widest text-slate-800">Neraca (Balance Sheet)</h2>
                  <p className="text-slate-600 mt-1">Per Tanggal: {balanceData.asOfDate}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Assets */}
                  <div>
                    <h3 className="font-bold text-lg text-slate-800 mb-2 border-b border-slate-800 pb-1">Aset (Assets)</h3>
                    <div className="space-y-1">
                      {balanceData.assets.map(a => (
                        <div key={a.id} className="flex justify-between text-sm py-1">
                          <span>{a.code} - {a.name}</span>
                          <span className="font-mono">Rp {Number(a.balance).toLocaleString('id-ID')}</span>
                        </div>
                      ))}
                      <div className="flex justify-between font-bold text-sm pt-2 mt-4 border-t-2 border-slate-800">
                        <span>Total Aset</span>
                        <span className="font-mono text-blue-700">Rp {Number(balanceData.summary.totalAssets).toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Liabilities & Equity */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-bold text-lg text-slate-800 mb-2 border-b border-slate-800 pb-1">Kewajiban (Liabilities)</h3>
                      <div className="space-y-1">
                        {balanceData.liabilities.map(l => (
                          <div key={l.id} className="flex justify-between text-sm py-1">
                            <span>{l.code} - {l.name}</span>
                            <span className="font-mono">Rp {Number(l.balance).toLocaleString('id-ID')}</span>
                          </div>
                        ))}
                        <div className="flex justify-between font-bold text-sm pt-2 mt-2 border-t border-slate-200">
                          <span>Total Kewajiban</span>
                          <span className="font-mono">Rp {Number(balanceData.summary.totalLiabilities).toLocaleString('id-ID')}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-bold text-lg text-slate-800 mb-2 border-b border-slate-800 pb-1">Ekuitas (Equity)</h3>
                      <div className="space-y-1">
                        {balanceData.equities.map(e => (
                          <div key={e.id} className="flex justify-between text-sm py-1">
                            <span>{e.code} - {e.name}</span>
                            <span className="font-mono">Rp {Number(e.balance).toLocaleString('id-ID')}</span>
                          </div>
                        ))}
                        <div className="flex justify-between text-sm py-1 text-emerald-700 font-medium italic">
                          <span>Laba/Rugi Tahun Berjalan</span>
                          <span className="font-mono">Rp {Number(balanceData.currentNetIncome).toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between font-bold text-sm pt-2 mt-2 border-t border-slate-200">
                          <span>Total Ekuitas</span>
                          <span className="font-mono">Rp {Number(balanceData.summary.totalEquity).toLocaleString('id-ID')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between font-bold text-sm pt-2 border-t-2 border-slate-800">
                      <span>Total Kewajiban & Ekuitas</span>
                      <span className="font-mono text-blue-700">Rp {Number(balanceData.summary.totalLiabilitiesAndEquity).toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </div>

                {/* Validation Badge */}
                <div className="mt-8 text-center print:hidden">
                  {balanceData.summary.isBalanced ? (
                    <Badge variant="success" size="sm" className="px-4 py-1 text-sm bg-emerald-100 text-emerald-800 border-emerald-300">✔ NERACA SEIMBANG (Assets = Liab + Equity)</Badge>
                  ) : (
                    <Badge variant="danger" size="sm" className="px-4 py-1 text-sm bg-rose-100 text-rose-800 border-rose-300">❌ NERACA TIDAK SEIMBANG</Badge>
                  )}
                </div>
              </div>
            )}

            {/* Buku Besar */}
            {activeTab === 'ledger' && ledgerData && (
              <div className="space-y-6">
                 <div className="text-center border-b-2 border-slate-200 pb-4">
                  <h2 className="text-2xl font-bold uppercase tracking-widest text-slate-800">Buku Besar (General Ledger)</h2>
                  <p className="text-slate-600 mt-1 font-semibold text-lg">{accounts.find(a => a.id === Number(selectedAccountId))?.code} - {accounts.find(a => a.id === Number(selectedAccountId))?.name}</p>
                  <p className="text-slate-500 text-sm">Periode: {ledgerData.period.startDate} s.d {ledgerData.period.endDate}</p>
                </div>

                <table className="w-full text-left text-sm">
                  <thead className="border-y-2 border-slate-800 bg-slate-50">
                    <tr>
                      <th className="py-2 px-2">Tanggal</th>
                      <th className="py-2 px-2">No. Bukti</th>
                      <th className="py-2 px-2">Keterangan</th>
                      <th className="py-2 px-2 text-right">Debit (Rp)</th>
                      <th className="py-2 px-2 text-right">Kredit (Rp)</th>
                      <th className="py-2 px-2 text-right">Saldo (Rp)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {ledgerData.entries.map((entry, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2 px-2">{entry.date.slice(0,10)}</td>
                        <td className="py-2 px-2 font-mono text-xs text-slate-500">{entry.transaction_number}</td>
                        <td className="py-2 px-2">{entry.description}</td>
                        <td className="py-2 px-2 text-right font-mono">{entry.debit > 0 ? entry.debit.toLocaleString('id-ID') : '-'}</td>
                        <td className="py-2 px-2 text-right font-mono">{entry.credit > 0 ? entry.credit.toLocaleString('id-ID') : '-'}</td>
                        <td className="py-2 px-2 text-right font-mono font-bold">{entry.running_balance.toLocaleString('id-ID')}</td>
                      </tr>
                    ))}
                    {ledgerData.entries.length === 0 && (
                      <tr>
                        <td colSpan="6" className="text-center py-8 text-slate-400 italic">Tidak ada transaksi pada periode ini.</td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="border-y-2 border-slate-800 bg-slate-50">
                     <tr>
                        <td colSpan="5" className="py-2 px-2 text-right font-bold">Saldo Akhir:</td>
                        <td className="py-2 px-2 text-right font-mono font-bold text-lg text-blue-700">Rp {Number(ledgerData.finalBalance).toLocaleString('id-ID')}</td>
                     </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
