import React, { useState, useEffect } from 'react';
import { SupplierDto } from '../../../../types/masterData';
import { X, Save, Loader2, AlertTriangle, Building, MapPin, FileText, CheckCircle2 } from 'lucide-react';
import * as masterDataService from '../../../../services/masterDataService';
import { Tooltip } from '../../../../components/ui/Tooltip';

interface Props {
  onClose: () => void;
  companyId?: string;
  supplierToEdit?: SupplierDto | null;
  onSuccess: () => void;
  onTriggerToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, desc?: string) => void;
  wizardStep?: string;
  onStepChange?: (step: any) => void;
}

export function SupplierWizardView({
  onClose,
  companyId,
  supplierToEdit,
  onSuccess,
  onTriggerToast
}: Props) {
  const isEditing = !!supplierToEdit;

  // Form State matching Backend Supplier Entity & DTOs
  const [formData, setFormData] = useState({
    code: '',
    legalName: '',
    tradeName: '',
    email: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    gstin: '',
    pan: '',
    paymentTermsDays: 30,
    creditLimit: 500000,
    isActive: true
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Populate state when editing or fetch system-generated code when creating
  useEffect(() => {
    if (supplierToEdit) {
      setFormData({
        code: supplierToEdit.code || '',
        legalName: supplierToEdit.legalName || '',
        tradeName: supplierToEdit.tradeName || '',
        email: supplierToEdit.email || '',
        phone: supplierToEdit.phone || '',
        addressLine1: supplierToEdit.addressLine1 || '',
        addressLine2: supplierToEdit.addressLine2 || '',
        city: supplierToEdit.city || '',
        state: supplierToEdit.state || '',
        postalCode: supplierToEdit.postalCode || '',
        country: supplierToEdit.country || 'India',
        gstin: supplierToEdit.gstin || '',
        pan: supplierToEdit.pan || '',
        paymentTermsDays: supplierToEdit.paymentTermsDays ?? 30,
        creditLimit: supplierToEdit.creditLimit ?? 500000,
        isActive: supplierToEdit.isActive ?? true
      });
    } else {
      async function fetchCode() {
        try {
          const res = await masterDataService.fetchNextSupplierCode(companyId);
          const generated = typeof res === 'string' ? res : (res && (res as any).code ? (res as any).code : 'SUP-000001');
          setFormData(prev => ({ ...prev, code: generated }));
        } catch (e) {
          setFormData(prev => ({ ...prev, code: 'SUP-000001' }));
        }
      }
      fetchCode();
    }
  }, [supplierToEdit, companyId]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // Form Validation Enforcing Exact Prompt Guidelines
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.legalName.trim()) {
      errors.legalName = 'Legal Entity Name is required. Example: Hindustan Unilever Limited';
    }

    if (!formData.email.trim()) {
      errors.email = 'Valid email is required. Example: orders@hul.com';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Valid email is required. Example: orders@hul.com';
    }

    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required. Example: +91 98110 44210';
    }

    if (!formData.addressLine1.trim()) {
      errors.addressLine1 = 'Address Line 1 is required. Example: Plot 45, Okhla Phase 3';
    }

    if (!formData.city.trim()) {
      errors.city = 'City is required. Example: New Delhi';
    }

    if (!formData.state.trim()) {
      errors.state = 'State is required. Example: Delhi';
    }

    if (!formData.postalCode.trim()) {
      errors.postalCode = 'Postal Code is required. Example: 110020';
    }

    if (!formData.country.trim()) {
      errors.country = 'Country is required. Example: India';
    }

    if (!formData.gstin.trim()) {
      errors.gstin = 'GSTIN is required. Example: 07AAACH1101A1Z8';
    } else if (formData.gstin.trim().length < 15) {
      errors.gstin = 'GSTIN is required (15 characters). Example: 07AAACH1101A1Z8';
    }

    if (!formData.pan.trim()) {
      errors.pan = 'PAN is required. Example: AAACH1101A';
    } else if (formData.pan.trim().length < 10) {
      errors.pan = 'PAN is required (10 characters). Example: AAACH1101A';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      onTriggerToast('error', 'Validation Error', 'Please correct the inline errors before submitting.');
      return;
    }

    setSubmitting(true);
    setApiError(null);

    try {
      const payload: Record<string, any> = {
        code: formData.code ? formData.code.trim().toUpperCase() : 'AUTO',
        legalName: formData.legalName.trim(),
        tradeName: formData.tradeName.trim() || undefined,
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        addressLine1: formData.addressLine1.trim(),
        addressLine2: formData.addressLine2.trim() || undefined,
        city: formData.city.trim(),
        state: formData.state.trim(),
        postalCode: formData.postalCode.trim(),
        country: formData.country.trim(),
        gstin: formData.gstin.trim().toUpperCase(),
        pan: formData.pan.trim().toUpperCase(),
        paymentTermsDays: Number(formData.paymentTermsDays) || 30,
        creditLimit: Number(formData.creditLimit) || 0
      };

      if (isEditing && supplierToEdit) {
        payload.id = supplierToEdit.id;
        payload.companyId = supplierToEdit.companyId;
        payload.isActive = formData.isActive;
        await masterDataService.updateSupplier(supplierToEdit.id, payload);
        onTriggerToast('success', 'Supplier Updated', `Supplier '${formData.legalName}' master record saved.`);
      } else {
        payload.companyId = companyId || '00000000-0000-0000-0000-000000000000';
        await masterDataService.createSupplier(payload);
        onTriggerToast('success', 'Supplier Onboarded', `New supplier '${formData.legalName}' registered in PostgreSQL master data.`);
      }

      onSuccess();
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || 'Failed to save supplier master record.';
      setApiError(msg);
      onTriggerToast('error', 'API Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="bg-white rounded-lg border border-brand-border shadow-xl flex flex-col w-full max-h-[90vh] overflow-hidden"
      role="dialog"
      aria-modal="true"
    >
      {/* Modal Header */}
      <div className="p-4 border-b bg-brand-bg-secondary/10 flex justify-between items-center shrink-0">
        <div>
          <h3 className="text-base font-bold text-brand-text-primary">
            {isEditing ? `Edit Supplier Master: ${supplierToEdit?.code}` : 'Onboard New Supplier'}
          </h3>
          <p className="text-xs text-brand-text-secondary">
            {isEditing
              ? 'Update official supplier master data in PostgreSQL'
              : 'Register an official FMCG supplier master record'}
          </p>
        </div>
        <Tooltip content="Close">
          <button onClick={onClose} aria-label="Close" className="text-brand-text-secondary hover:text-brand-text-primary cursor-pointer p-1">
            <X size={18} />
          </button>
        </Tooltip>
      </div>

      {/* API Error Banner */}
      {apiError && (
        <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-brand-danger shrink-0">
          <AlertTriangle size={16} className="shrink-0" />
          <span>{apiError}</span>
        </div>
      )}

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {/* SECTION 1 — SUPPLIER INFORMATION */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider border-b pb-2 flex items-center gap-2">
            <Building size={15} className="text-brand-primary" /> Section 1 — Supplier Information
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-brand-text-secondary uppercase">
                Supplier Code
              </label>
              <input
                type="text"
                value={formData.code ? `[ ${formData.code} ]` : '[ SUP-000001 ]'}
                readOnly
                disabled
                className="w-full text-xs border rounded px-3 py-2 outline-none font-mono uppercase bg-gray-100 text-brand-primary font-bold cursor-not-allowed border-gray-300 shadow-xs"
              />
              <span className="text-[10px] text-brand-text-secondary block mt-0.5 font-medium">
                System generated
              </span>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-brand-text-secondary uppercase">
                Legal Entity Name <span className="text-brand-danger">*</span>
              </label>
              <input
                type="text"
                value={formData.legalName}
                onChange={e => handleChange('legalName', e.target.value)}
                className={`w-full text-xs border rounded px-3 py-2 outline-none ${
                  formErrors.legalName ? 'border-red-500 bg-red-50/40' : 'focus:border-brand-primary'
                }`}
                placeholder="e.g. Hindustan Unilever Limited"
              />
              {formErrors.legalName && <p className="text-brand-danger text-[10px] mt-1">{formErrors.legalName}</p>}
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] font-bold text-brand-text-secondary uppercase">
                Trade / Display Name
              </label>
              <input
                type="text"
                value={formData.tradeName}
                onChange={e => handleChange('tradeName', e.target.value)}
                className="w-full text-xs border rounded px-3 py-2 outline-none focus:border-brand-primary"
                placeholder="e.g. HUL"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2 — CONTACT & ADDRESS */}
        <div className="space-y-4 pt-2">
          <h4 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider border-b pb-2 flex items-center gap-2">
            <MapPin size={15} className="text-brand-primary" /> Section 2 — Contact & Address
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-brand-text-secondary uppercase">
                Primary Email <span className="text-brand-danger">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={e => handleChange('email', e.target.value)}
                className={`w-full text-xs border rounded px-3 py-2 outline-none ${
                  formErrors.email ? 'border-red-500 bg-red-50/40' : 'focus:border-brand-primary'
                }`}
                placeholder="e.g. orders@hul.com"
              />
              {formErrors.email && <p className="text-brand-danger text-[10px] mt-1">{formErrors.email}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-brand-text-secondary uppercase">
                Primary Phone <span className="text-brand-danger">*</span>
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={e => handleChange('phone', e.target.value)}
                className={`w-full text-xs border rounded px-3 py-2 outline-none ${
                  formErrors.phone ? 'border-red-500 bg-red-50/40' : 'focus:border-brand-primary'
                }`}
                placeholder="e.g. +91 98110 44210"
              />
              {formErrors.phone && <p className="text-brand-danger text-[10px] mt-1">{formErrors.phone}</p>}
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] font-bold text-brand-text-secondary uppercase">
                Address Line 1 <span className="text-brand-danger">*</span>
              </label>
              <input
                type="text"
                value={formData.addressLine1}
                onChange={e => handleChange('addressLine1', e.target.value)}
                className={`w-full text-xs border rounded px-3 py-2 outline-none ${
                  formErrors.addressLine1 ? 'border-red-500 bg-red-50/40' : 'focus:border-brand-primary'
                }`}
                placeholder="e.g. Plot 45, Okhla Phase 3"
              />
              {formErrors.addressLine1 && <p className="text-brand-danger text-[10px] mt-1">{formErrors.addressLine1}</p>}
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] font-bold text-brand-text-secondary uppercase">
                Address Line 2
              </label>
              <input
                type="text"
                value={formData.addressLine2}
                onChange={e => handleChange('addressLine2', e.target.value)}
                className="w-full text-xs border rounded px-3 py-2 outline-none focus:border-brand-primary"
                placeholder="e.g. Industrial Area"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-brand-text-secondary uppercase">
                City <span className="text-brand-danger">*</span>
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={e => handleChange('city', e.target.value)}
                className={`w-full text-xs border rounded px-3 py-2 outline-none ${
                  formErrors.city ? 'border-red-500 bg-red-50/40' : 'focus:border-brand-primary'
                }`}
                placeholder="e.g. New Delhi"
              />
              {formErrors.city && <p className="text-brand-danger text-[10px] mt-1">{formErrors.city}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-brand-text-secondary uppercase">
                State <span className="text-brand-danger">*</span>
              </label>
              <input
                type="text"
                value={formData.state}
                onChange={e => handleChange('state', e.target.value)}
                className={`w-full text-xs border rounded px-3 py-2 outline-none ${
                  formErrors.state ? 'border-red-500 bg-red-50/40' : 'focus:border-brand-primary'
                }`}
                placeholder="e.g. Delhi"
              />
              {formErrors.state && <p className="text-brand-danger text-[10px] mt-1">{formErrors.state}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-brand-text-secondary uppercase">
                Postal Code <span className="text-brand-danger">*</span>
              </label>
              <input
                type="text"
                value={formData.postalCode}
                onChange={e => handleChange('postalCode', e.target.value)}
                className={`w-full text-xs border rounded px-3 py-2 outline-none font-mono ${
                  formErrors.postalCode ? 'border-red-500 bg-red-50/40' : 'focus:border-brand-primary'
                }`}
                placeholder="e.g. 110020"
              />
              {formErrors.postalCode && <p className="text-brand-danger text-[10px] mt-1">{formErrors.postalCode}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-brand-text-secondary uppercase">
                Country <span className="text-brand-danger">*</span>
              </label>
              <input
                type="text"
                value={formData.country}
                onChange={e => handleChange('country', e.target.value)}
                className={`w-full text-xs border rounded px-3 py-2 outline-none ${
                  formErrors.country ? 'border-red-500 bg-red-50/40' : 'focus:border-brand-primary'
                }`}
                placeholder="e.g. India"
              />
              {formErrors.country && <p className="text-brand-danger text-[10px] mt-1">{formErrors.country}</p>}
            </div>
          </div>
        </div>

        {/* SECTION 3 — TAX & COMMERCIAL INFORMATION */}
        <div className="space-y-4 pt-2">
          <h4 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider border-b pb-2 flex items-center gap-2">
            <FileText size={15} className="text-brand-primary" /> Section 3 — Tax & Commercial Information
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-brand-text-secondary uppercase">
                GSTIN <span className="text-brand-danger">*</span>
              </label>
              <input
                type="text"
                value={formData.gstin}
                onChange={e => handleChange('gstin', e.target.value)}
                className={`w-full text-xs border rounded px-3 py-2 outline-none font-mono uppercase ${
                  formErrors.gstin ? 'border-red-500 bg-red-50/40' : 'focus:border-brand-primary'
                }`}
                placeholder="e.g. 07AAACH1101A1Z8"
              />
              {formErrors.gstin && <p className="text-brand-danger text-[10px] mt-1">{formErrors.gstin}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-brand-text-secondary uppercase">
                PAN <span className="text-brand-danger">*</span>
              </label>
              <input
                type="text"
                value={formData.pan}
                onChange={e => handleChange('pan', e.target.value)}
                className={`w-full text-xs border rounded px-3 py-2 outline-none font-mono uppercase ${
                  formErrors.pan ? 'border-red-500 bg-red-50/40' : 'focus:border-brand-primary'
                }`}
                placeholder="e.g. AAACH1101A"
              />
              {formErrors.pan && <p className="text-brand-danger text-[10px] mt-1">{formErrors.pan}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-brand-text-secondary uppercase">
                Payment Terms (Days)
              </label>
              <input
                type="number"
                value={formData.paymentTermsDays}
                onChange={e => handleChange('paymentTermsDays', parseInt(e.target.value) || 0)}
                className="w-full text-xs border rounded px-3 py-2 outline-none font-mono focus:border-brand-primary"
                placeholder="e.g. 30"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-brand-text-secondary uppercase">
                Credit Limit (INR)
              </label>
              <input
                type="number"
                value={formData.creditLimit}
                onChange={e => handleChange('creditLimit', parseFloat(e.target.value) || 0)}
                className="w-full text-xs border rounded px-3 py-2 outline-none font-mono focus:border-brand-primary"
                placeholder="e.g. 2500000"
              />
            </div>

            <div className="space-y-1 md:col-span-2 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={e => handleChange('isActive', e.target.checked)}
                  className="rounded border-brand-border text-brand-primary focus:ring-brand-primary"
                />
                <span className="text-xs font-bold text-brand-text-primary">Supplier Active Status (Trade Ready)</span>
              </label>
            </div>
          </div>
        </div>

      </form>

      {/* Modal Footer */}
      <div className="p-4 border-t bg-brand-bg-secondary/10 flex justify-end gap-2 shrink-0">
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          className="px-4 py-2 border text-brand-text-primary rounded text-xs font-semibold hover:bg-brand-bg-secondary cursor-pointer disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="px-4 py-2 bg-brand-primary text-white rounded text-xs font-semibold hover:bg-blue-700 cursor-pointer flex items-center gap-1.5 shadow-sm disabled:opacity-50"
        >
          {submitting ? (
            <>
              <Loader2 size={14} className="animate-spin" /> Saving Master Record...
            </>
          ) : (
            <>
              <Save size={14} /> {isEditing ? 'Save Changes' : 'Submit Supplier Master'}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
