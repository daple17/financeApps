import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import Button from './Button';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service here
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>
            
            <div>
              <h1 className="text-xl font-bold text-white mb-2">Terjadi Kesalahan Sistem</h1>
              <p className="text-sm text-slate-400">
                Maaf, komponen halaman ini mengalami kegagalan saat memuat data atau me-render tampilan.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl text-left overflow-x-auto text-xs text-rose-400 font-mono border border-slate-800">
              {this.state.error && this.state.error.toString()}
            </div>

            <Button variant="primary" onClick={this.handleReload} className="w-full justify-center bg-blue-600 hover:bg-blue-500">
              <RefreshCw className="w-4 h-4 mr-2" />
              Muat Ulang Halaman
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
