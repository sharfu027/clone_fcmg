import React from 'react';
import { Supplier } from '../../../../../types/supplier';
import { Download, Eye } from 'lucide-react';
import { Badge } from '../../../../../components/ui/Badge';
import { NoDocumentsState } from '../../empty-states/SupplierEmptyStates';

interface Props {
  supplier: Supplier;
}

export function DocumentsTab({ supplier }: Props) {
  // We'll mock 3 documents as requested
  const documents = [
    { id: 1, type: 'GST Certificate', number: 'GST-001', authority: 'Govt of India', issueDate: '2025-04-01', expiryDate: '2026-04-01', status: 'Active' },
    { id: 2, type: 'ISO 9001:2015', number: 'ISO-2015-XYZ', authority: 'ISO', issueDate: '2024-01-01', expiryDate: '2027-01-01', status: 'Active' },
    { id: 3, type: 'MSME Certificate', number: 'MSME-12345', authority: 'Ministry of MSME', issueDate: '2023-06-01', expiryDate: '2025-06-01', status: 'EXPIRED' }
  ];

  if (documents.length === 0) {
    return <NoDocumentsState />;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider">Supplier Documents</h4>
        <button className="px-3 py-1.5 text-xs bg-brand-primary text-white font-semibold rounded hover:bg-blue-700 cursor-pointer">
          Upload Document
        </button>
      </div>

      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-brand-bg-secondary border-b text-[10px] font-bold text-brand-text-secondary uppercase">
            <tr>
              <th className="p-3">Document Type</th>
              <th className="p-3">Document Number</th>
              <th className="p-3">Issuing Authority</th>
              <th className="p-3">Issue Date</th>
              <th className="p-3">Expiry Date</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
            {documents.map(doc => (
              <tr key={doc.id} className="hover:bg-brand-bg-secondary/30">
                <td className="p-3 font-semibold text-brand-text-primary">{doc.type}</td>
                <td className="p-3 font-mono text-brand-text-secondary">{doc.number}</td>
                <td className="p-3">{doc.authority}</td>
                <td className="p-3">{doc.issueDate}</td>
                <td className="p-3 text-brand-text-secondary">{doc.expiryDate}</td>
                <td className="p-3">
                  <Badge variant={doc.status === 'Active' ? 'success' : 'danger'}>{doc.status}</Badge>
                </td>
                <td className="p-3 text-right">
                  <div className="flex justify-end gap-1">
                    <button className="p-1.5 border rounded text-brand-text-primary hover:bg-brand-bg-secondary cursor-pointer" title="Preview">
                      <Eye size={14} />
                    </button>
                    <button className="p-1.5 border rounded text-brand-text-primary hover:bg-brand-bg-secondary cursor-pointer" title="Download">
                      <Download size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
