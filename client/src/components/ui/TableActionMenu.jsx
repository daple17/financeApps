import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Eye, Edit2, CheckCircle, XCircle } from 'lucide-react';

export default function TableActionMenu({ 
  onView, 
  onEdit, 
  status, 
  onStatusChange 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = (e) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleAction = (e, action) => {
    e.stopPropagation();
    setIsOpen(false);
    if (action) action();
  };

  return (
    <div className="relative inline-flex items-center" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 transition"
      >
        <MoreVertical className="w-5 h-5" />
      </button>
      
      {isOpen && (
        <div 
          className="absolute right-full top-0 mr-2 w-40 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden"
        >
          {onView && (
            <button
              onClick={(e) => handleAction(e, onView)}
              className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-2"
            >
              <Eye className="w-4 h-4" /> Lihat Detail
            </button>
          )}
          
          {onEdit && (
            <button
              onClick={(e) => handleAction(e, onEdit)}
              className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-2"
            >
              <Edit2 className="w-4 h-4" /> Edit
            </button>
          )}

          {status && onStatusChange && (
            <button
              onClick={(e) => handleAction(e, () => onStatusChange(status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'))}
              className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 transition ${
                status === 'ACTIVE' 
                  ? 'text-red-400 hover:bg-red-500/10' 
                  : 'text-emerald-400 hover:bg-emerald-500/10'
              }`}
            >
              {status === 'ACTIVE' ? (
                <><XCircle className="w-4 h-4" /> Nonaktifkan</>
              ) : (
                <><CheckCircle className="w-4 h-4" /> Aktifkan</>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
