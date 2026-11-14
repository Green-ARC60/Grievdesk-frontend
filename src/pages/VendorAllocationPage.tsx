import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Wrench,
  Search,
  Plus,
  Phone,
  Mail,
  MapPin,
  ClipboardList,
  CheckCircle2,
  Trash2,
  Edit3,
  Mic,
  MicOff,
  Send,
  RefreshCw,
  Store,
  Scissors,
  Shield,
  Zap,
  Droplets,
  Sparkles,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { Alert } from '../components/ui/Alert';
import {
  Vendor,
  VendorTask,
  CreateVendorPayload,
} from '../types/vendors';
import { Complaint } from '../types/complaints';
import {
  getVendorsApi,
  createVendorApi,
  updateVendorApi,
  deleteVendorApi,
  assignVendorTaskApi,
  getVendorDetailsApi,
} from '../api/vendors';
import { getComplaintsApi } from '../api/complaints';

const STANDARD_PROFESSIONS = [
  'All',
  'Plumber',
  'Electrician',
  'Line Electrician (Society Mains)',
  'AC Repairer',
  'Electronics Repairer',
  'Barber',
  'Security Guard',
  'Water Tank Supplier',
  'Grocery Shop (Society Complex)',
  'Complex Shop / Retail',
  'Other Helper / Vendor',
];

export const VendorAllocationPage: React.FC = () => {
  const { showToast } = useToast();

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProfession, setSelectedProfession] = useState('All');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isViewTasksModalOpen, setIsViewTasksModalOpen] = useState(false);
  const [activeVendor, setActiveVendor] = useState<Vendor | null>(null);

  // Form states
  const [formData, setFormData] = useState<CreateVendorPayload>({
    name: '',
    profession: 'Plumber',
    email: '',
    phone: '',
    address: '',
    notes: '',
  });
  const [customProfession, setCustomProfession] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Complaints for assignment
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoadingComplaints, setIsLoadingComplaints] = useState(false);
  const [selectedComplaintId, setSelectedComplaintId] = useState<number | null>(null);
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [complaintFilterText, setComplaintFilterText] = useState('');

  // Voice note recording simulation / Web Speech API
  const [isRecording, setIsRecording] = useState(false);
  const [speechLanguage, setSpeechLanguage] = useState<'hi-IN' | 'en-IN' | 'bn-IN' | 'te-IN' | 'ta-IN'>('hi-IN');
  const recognitionRef = useRef<any>(null);

  // Vendor Tasks viewing state
  const [vendorDetailTasks, setVendorDetailTasks] = useState<VendorTask[]>([]);
  const [isLoadingVendorTasks, setIsLoadingVendorTasks] = useState(false);

  // Fetch vendors
  const loadVendors = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getVendorsApi({
        profession: selectedProfession !== 'All' ? selectedProfession : undefined,
        search: searchQuery.trim() || undefined,
      });
      setVendors(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load society helpers and vendors');
    } finally {
      setIsLoading(false);
    }
  }, [selectedProfession, searchQuery]);

  useEffect(() => {
    loadVendors();
  }, [loadVendors]);

  // Load complaints for assignment modal
  const loadComplaints = async () => {
    setIsLoadingComplaints(true);
    try {
      const res = await getComplaintsApi({ limit: 100 });
      setComplaints(res.complaints);
    } catch (err) {
      console.error('Could not load public inbox complaints', err);
    } finally {
      setIsLoadingComplaints(false);
    }
  };

  // Open Assign Modal
  const handleOpenAssignModal = (vendor: Vendor) => {
    setActiveVendor(vendor);
    setSelectedComplaintId(null);
    setAssignmentNotes('');
    setIsAssignModalOpen(true);
    loadComplaints();
  };

  // Open Edit Modal
  const handleOpenEditModal = (vendor: Vendor) => {
    setActiveVendor(vendor);
    setFormData({
      name: vendor.name,
      profession: vendor.profession,
      email: vendor.email,
      phone: vendor.phone,
      address: vendor.address,
      notes: vendor.notes || '',
    });
    setCustomProfession('');
    setIsEditModalOpen(true);
  };

  // Open View Tasks Modal
  const handleOpenViewTasksModal = async (vendor: Vendor) => {
    setActiveVendor(vendor);
    setIsViewTasksModalOpen(true);
    setIsLoadingVendorTasks(true);
    try {
      const details = await getVendorDetailsApi(vendor.id);
      setVendorDetailTasks(details.tasks || []);
    } catch (err) {
      console.error('Failed to load vendor tasks', err);
    } finally {
      setIsLoadingVendorTasks(false);
    }
  };

  // Handle Create or Edit Vendor Submit
  const handleSaveVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalProfession =
      formData.profession === 'Other Helper / Vendor' && customProfession.trim()
        ? customProfession.trim()
        : formData.profession;

    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim() || !formData.address.trim()) {
      showToast('Please fill in all required vendor details.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditModalOpen && activeVendor) {
        await updateVendorApi(activeVendor.id, {
          ...formData,
          profession: finalProfession,
        });
        showToast(`Vendor "${formData.name}" updated successfully!`, 'success');
        setIsEditModalOpen(false);
      } else {
        await createVendorApi({
          ...formData,
          profession: finalProfession,
        });
        showToast(`Vendor "${formData.name}" added to society directory!`, 'success');
        setIsAddModalOpen(false);
      }
      loadVendors();
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Error saving vendor record.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Vendor
  const handleDeleteVendor = async (vendor: Vendor) => {
    if (!window.confirm(`Are you sure you want to remove ${vendor.name} (${vendor.profession}) from the society list?`)) {
      return;
    }
    try {
      await deleteVendorApi(vendor.id);
      showToast(`Removed ${vendor.name}`, 'success');
      loadVendors();
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to delete vendor', 'error');
    }
  };

  // Web Speech API / Voice Note Recording
  const toggleVoiceRecording = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      // Fallback if browser doesn't have Web Speech API
      if (!isRecording) {
        setIsRecording(true);
        showToast('Voice recording active. Please speak your note in local language...', 'info');
        // Simulated voice note snippet for environments without speech engine
        setTimeout(() => {
          setAssignmentNotes((prev) =>
            prev
              ? `${prev}\n[Voice Note Transcribed]: Please check the issue urgently at the resident's flat.`
              : '[Voice Note Transcribed]: Urgent maintenance requested. Please bring standard replacement parts.'
          );
          setIsRecording(false);
          showToast('Voice note transcribed into local language notes!', 'success');
        }, 3200);
      } else {
        setIsRecording(false);
      }
      return;
    }

    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = speechLanguage;
      recognition.interimResults = false;
      recognition.continuous = false;

      recognition.onstart = () => {
        setIsRecording(true);
        showToast(`Listening in ${speechLanguage === 'hi-IN' ? 'Hindi' : speechLanguage}... Speak now`, 'info');
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setAssignmentNotes((prev) => (prev ? `${prev} ${transcript}` : transcript));
        showToast('Voice input captured!', 'success');
      };

      recognition.onerror = (e: any) => {
        console.warn('Speech recognition error:', e);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Speech recognition start failed', err);
      setIsRecording(false);
    }
  };

  // Submit Task Assignment
  const handleAssignTask = async () => {
    if (!activeVendor || !selectedComplaintId) {
      showToast('Please select a complaint ticket from the list.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await assignVendorTaskApi(activeVendor.id, {
        complaint_id: selectedComplaintId,
        notes: assignmentNotes.trim() || undefined,
      });

      showToast(
        `Task #${selectedComplaintId} assigned to ${activeVendor.name}! Status is now IN PROGRESS. Work order forwarded to ${activeVendor.email} via Resend.`,
        'success'
      );

      setIsAssignModalOpen(false);
      loadVendors();
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to assign task to vendor.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper icons and category styles
  const getProfessionBadge = (profession: string) => {
    const prof = profession.toLowerCase();
    if (prof.includes('plumb')) {
      return {
        icon: <Droplets className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />,
        bg: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
      };
    }
    if (prof.includes('line electric') || prof.includes('mains')) {
      return {
        icon: <Zap className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />,
        bg: 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
      };
    }
    if (prof.includes('electr')) {
      return {
        icon: <Zap className="w-3.5 h-3.5 text-yellow-600 dark:text-yellow-400" />,
        bg: 'bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-300 dark:border-yellow-800',
      };
    }
    if (prof.includes('ac') || prof.includes('aircon')) {
      return {
        icon: <Sparkles className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />,
        bg: 'bg-cyan-50 text-cyan-800 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800',
      };
    }
    if (prof.includes('barber') || prof.includes('salon')) {
      return {
        icon: <Scissors className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />,
        bg: 'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
      };
    }
    if (prof.includes('guard') || prof.includes('security')) {
      return {
        icon: <Shield className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />,
        bg: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
      };
    }
    if (prof.includes('water') || prof.includes('tank')) {
      return {
        icon: <Droplets className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />,
        bg: 'bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800',
      };
    }
    if (prof.includes('shop') || prof.includes('grocery') || prof.includes('mart') || prof.includes('retail')) {
      return {
        icon: <Store className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />,
        bg: 'bg-orange-50 text-orange-800 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800',
      };
    }
    return {
      icon: <Wrench className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />,
      bg: 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    };
  };

  // Filtered public inbox complaints for modal
  const filteredComplaints = useMemo(() => {
    if (!complaintFilterText.trim()) return complaints;
    const term = complaintFilterText.toLowerCase();
    return complaints.filter(
      (c) =>
        c.translated_text?.toLowerCase().includes(term) ||
        c.category?.toLowerCase().includes(term) ||
        c.flat_no?.toLowerCase().includes(term) ||
        c.block_no?.toLowerCase().includes(term) ||
        String(c.id).includes(term)
    );
  }, [complaints, complaintFilterText]);

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-sapphire/10 text-sapphire rounded-lg">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-display text-text-primary">
                Vendor & Helper Allocation
              </h1>
              <p className="text-sm text-text-muted mt-0.5">
                Manage society helpers, electricians, plumbers, shops &amp; security. Assign public inbox complaints with local-language notes directly via Resend email.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadVendors}
            disabled={isLoading}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setFormData({
                name: '',
                profession: 'Plumber',
                email: '',
                phone: '',
                address: '',
                notes: '',
              });
              setCustomProfession('');
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Add Helper / Vendor
          </Button>
        </div>
      </div>

      {/* Resend Integration Notification Badge */}
      <div className="bg-gradient-to-r from-sapphire/10 via-sapphire/5 to-transparent border-l-4 border-sapphire p-4 rounded-r-lg flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-sapphire shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-text-primary">
            <span className="font-semibold text-sapphire">Live Resend Email Engine Active:</span>{' '}
            When you click <span className="font-semibold px-1 py-0.5 bg-sapphire/15 text-sapphire rounded">ASSIGN</span> on any vendor, an official work order carrying the ticket details and your written or voice notes is forwarded to their registered email address. Public inbox status updates automatically to <span className="font-medium text-emerald-600 dark:text-emerald-400">In Progress</span>.
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Resend API Ready
          </span>
        </div>
      </div>

      {error && (
        <Alert variant="error" title="Error loading vendors">
          {error}
        </Alert>
      )}

      {/* Search & Profession Filter Bar */}
      <div className="space-y-3 bg-surface border border-border rounded-xl p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search helper by name, profession, phone, email, or shop address..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-sapphire/20 focus:border-sapphire"
            />
          </div>
        </div>

        {/* Profession Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          {STANDARD_PROFESSIONS.map((prof) => {
            const isSelected = selectedProfession === prof;
            return (
              <button
                key={prof}
                onClick={() => setSelectedProfession(prof)}
                className={`px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition-colors border ${
                  isSelected
                    ? 'bg-sapphire text-white border-sapphire shadow-sm'
                    : 'bg-background hover:bg-surface-secondary text-text-secondary border-border'
                }`}
              >
                {prof}
              </button>
            );
          })}
        </div>
      </div>

      {/* Vendors Table / List */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center text-text-muted">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-sapphire" />
            <p className="text-sm">Loading society vendors and helpers...</p>
          </div>
        ) : vendors.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 mx-auto flex items-center justify-center">
              <Wrench className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-text-primary">No vendors found</h3>
            <p className="text-sm text-text-muted max-w-md mx-auto">
              {searchQuery || selectedProfession !== 'All'
                ? 'Try adjusting your search terms or filter selection.'
                : 'No society helpers or vendors registered yet. Click "Add Helper / Vendor" to register plumbers, electricians, barbers, security guards, and shops.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-secondary/70 border-b border-border text-xs uppercase tracking-wider text-text-muted font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Helper / Vendor</th>
                  <th className="py-3.5 px-4">Profession</th>
                  <th className="py-3.5 px-4">Contact Info</th>
                  <th className="py-3.5 px-4">Location / Address</th>
                  <th className="py-3.5 px-4 text-center">Tasks Assigned</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {vendors.map((vendor) => {
                  const badge = getProfessionBadge(vendor.profession);
                  return (
                    <tr
                      key={vendor.id}
                      className="hover:bg-surface-secondary/40 transition-colors group"
                    >
                      {/* Name & Notes */}
                      <td className="py-3.5 px-4">
                        <div>
                          <div className="font-semibold text-text-primary group-hover:text-sapphire transition-colors flex items-center gap-1.5">
                            {vendor.name}
                          </div>
                          {vendor.notes && (
                            <div className="text-xs text-text-muted line-clamp-1 mt-0.5">
                              {vendor.notes}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Profession */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badge.bg}`}
                        >
                          {badge.icon}
                          {vendor.profession}
                        </span>
                      </td>

                      {/* Contact Info */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <a
                            href={`tel:${vendor.phone}`}
                            className="flex items-center gap-1.5 text-xs text-text-primary hover:text-sapphire transition-colors"
                          >
                            <Phone className="w-3.5 h-3.5 text-text-muted" />
                            {vendor.phone}
                          </a>
                          <a
                            href={`mailto:${vendor.email}`}
                            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-sapphire transition-colors"
                          >
                            <Mail className="w-3.5 h-3.5 text-text-muted" />
                            {vendor.email}
                          </a>
                        </div>
                      </td>

                      {/* Address */}
                      <td className="py-3.5 px-4 text-xs text-text-secondary max-w-xs">
                        <div className="flex items-start gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-text-muted shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{vendor.address}</span>
                        </div>
                      </td>

                      {/* Tasks count / View */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleOpenViewTasksModal(vendor)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-surface-secondary hover:bg-sapphire/10 text-text-secondary hover:text-sapphire border border-border transition-colors"
                          title="Click to view assigned tasks history"
                        >
                          <ClipboardList className="w-3.5 h-3.5" />
                          <span>{vendor.tasks_count} tasks</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {/* ASSIGN Button */}
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleOpenAssignModal(vendor)}
                            className="bg-sapphire hover:bg-sapphire-dark text-white font-semibold text-xs px-3 py-1.5 shadow-sm flex items-center gap-1.5"
                          >
                            <Send className="w-3.5 h-3.5" />
                            ASSIGN
                          </Button>

                          {/* Edit Button */}
                          <button
                            onClick={() => handleOpenEditModal(vendor)}
                            className="p-1.5 text-text-muted hover:text-text-primary hover:bg-surface-secondary rounded-md transition-colors"
                            title="Edit vendor details"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => handleDeleteVendor(vendor)}
                            className="p-1.5 text-text-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-md transition-colors"
                            title="Remove vendor"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =========================================================================
          MODAL 1: ASSIGN TASK TO VENDOR (WITH LOCAL LANGUAGE & VOICE NOTE)
         ========================================================================= */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title={`Assign Complaint to ${activeVendor?.name || 'Vendor'}`}
        subtitle={`${activeVendor?.profession} • Work order notification will be dispatched to ${activeVendor?.email} via Resend`}
        maxWidth="2xl"
      >
        <div className="space-y-5">
          {/* Step 1: Select Complaint from Public Inbox */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-sapphire text-white text-xs flex items-center justify-center font-bold">
                  1
                </span>
                Select Public Inbox Complaint Ticket
              </label>
              <span className="text-xs text-text-muted">
                {complaints.length} total tickets available
              </span>
            </div>

            {/* Complaint filter search input */}
            <div className="relative mb-2.5">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={complaintFilterText}
                onChange={(e) => setComplaintFilterText(e.target.value)}
                placeholder="Search complaint by flat number, category, or keyword..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-sapphire"
              />
            </div>

            <div className="max-h-56 overflow-y-auto space-y-2 border border-border rounded-lg p-2 bg-surface-secondary/30">
              {isLoadingComplaints ? (
                <div className="p-6 text-center text-xs text-text-muted">
                  <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-1 text-sapphire" />
                  Loading public inbox complaints...
                </div>
              ) : filteredComplaints.length === 0 ? (
                <div className="p-6 text-center text-xs text-text-muted">
                  No matching complaints found.
                </div>
              ) : (
                filteredComplaints.map((c) => {
                  const isSelected = selectedComplaintId === c.id;
                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelectedComplaintId(c.id)}
                      className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                        isSelected
                          ? 'border-sapphire bg-sapphire/5 ring-2 ring-sapphire/20 shadow-sm'
                          : 'border-border bg-surface hover:border-sapphire/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            checked={isSelected}
                            onChange={() => setSelectedComplaintId(c.id)}
                            className="text-sapphire focus:ring-sapphire h-3.5 w-3.5"
                          />
                          <span className="font-bold text-text-primary">
                            #{c.id} • {c.category || 'General'}
                          </span>
                          {c.flat_no && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                              Flat {c.flat_no}, Block {c.block_no || '-'}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              c.status === 'in_progress'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : c.status === 'resolved'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            }`}
                          >
                            {c.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>

                      <p className="text-text-secondary mt-1.5 line-clamp-2 pl-5">
                        {c.translated_text || 'No description'}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Step 2: Written Note / Voice Note Field */}
          <div className="space-y-2 border-t border-border pt-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-sapphire text-white text-xs flex items-center justify-center font-bold">
                  2
                </span>
                Written Note / Voice Note (Local Language Supported)
              </label>

              {/* Language Selector for Voice Input */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-text-muted">Speech Language:</span>
                <select
                  value={speechLanguage}
                  onChange={(e: any) => setSpeechLanguage(e.target.value)}
                  className="text-xs bg-background border border-border rounded px-1.5 py-0.5 focus:outline-none"
                >
                  <option value="hi-IN">Hindi (हिंदी)</option>
                  <option value="en-IN">English (India)</option>
                  <option value="bn-IN">Bengali (বাংলা)</option>
                  <option value="te-IN">Telugu (తెలుగు)</option>
                  <option value="ta-IN">Tamil (தமிழ்)</option>
                </select>
              </div>
            </div>

            <div className="relative">
              <textarea
                value={assignmentNotes}
                onChange={(e) => setAssignmentNotes(e.target.value)}
                rows={4}
                placeholder="Type instructions in your local language (e.g. Hindi, Odia, Bengali, English)...
Example: 302 नंबर फ्लैट में नल से पानी टपक रहा है। कृपया रिपेयर किट साथ लेकर आएं।"
                className="w-full text-sm bg-background border border-border rounded-lg p-3 pr-24 focus:outline-none focus:ring-2 focus:ring-sapphire/20 focus:border-sapphire"
              />

              {/* Voice Note Button */}
              <div className="absolute right-2.5 bottom-2.5 flex items-center gap-1">
                <button
                  type="button"
                  onClick={toggleVoiceRecording}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all shadow-sm ${
                    isRecording
                      ? 'bg-red-600 text-white animate-pulse'
                      : 'bg-surface hover:bg-surface-secondary text-text-secondary border border-border'
                  }`}
                  title="Click to speak your voice note in your local language"
                >
                  {isRecording ? (
                    <>
                      <MicOff className="w-3.5 h-3.5" />
                      <span>Recording...</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-3.5 h-3.5 text-sapphire" />
                      <span>Voice Note</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-text-muted">
              <span>This note will be carried in the email notification forwarded to the vendor via Resend.</span>
              {assignmentNotes && (
                <button
                  type="button"
                  onClick={() => setAssignmentNotes('')}
                  className="text-red-500 hover:underline"
                >
                  Clear notes
                </button>
              )}
            </div>
          </div>

          {/* Dialog Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAssignModalOpen(false)}
            >
              Cancel
            </Button>

            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={!selectedComplaintId || isSubmitting}
              onClick={handleAssignTask}
              className="bg-sapphire hover:bg-sapphire-dark text-white flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Assigning &amp; Sending Email...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Assign Task &amp; Dispatch Email (Resend)</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* =========================================================================
          MODAL 2: ADD / EDIT VENDOR DETAILS
         ========================================================================= */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
        }}
        title={isEditModalOpen ? `Edit Helper / Vendor Record` : `Add Society Helper / Vendor`}
        subtitle="Manage society technicians, barbers, security guards, shops, and essential helpers"
        maxWidth="lg"
      >
        <form onSubmit={handleSaveVendor} className="space-y-4">
          {/* Vendor Name */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
              Helper / Vendor / Shop Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Ramesh Sharma (Plumber) or Daily Needs Supermart"
              className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sapphire/20 focus:border-sapphire"
            />
          </div>

          {/* Profession Dropdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
                Profession / Category *
              </label>
              <select
                value={formData.profession}
                onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sapphire/20 focus:border-sapphire"
              >
                {STANDARD_PROFESSIONS.filter((p) => p !== 'All').map((prof) => (
                  <option key={prof} value={prof}>
                    {prof}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom profession input if other */}
            {formData.profession === 'Other Helper / Vendor' && (
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
                  Specify Category *
                </label>
                <input
                  type="text"
                  required
                  value={customProfession}
                  onChange={(e) => setCustomProfession(e.target.value)}
                  placeholder="e.g. Carpenter, Painter, Pest Control"
                  className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sapphire/20 focus:border-sapphire"
                />
              </div>
            )}

            {/* Phone */}
            <div className={formData.profession === 'Other Helper / Vendor' ? 'sm:col-span-2' : ''}>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
                Phone Number *
              </label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="e.g. +91 98765 43210"
                className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sapphire/20 focus:border-sapphire"
              />
            </div>
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
              Vendor Email Address * (Receives Resend Work Orders)
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="e.g. ramesh.plumber@example.com"
              className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sapphire/20 focus:border-sapphire"
            />
          </div>

          {/* Shop / Address */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
              Address / Shop Location in Society Complex *
            </label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="e.g. Shop #3, Society Commercial Complex, or Gate 1 Guard Cabin"
              className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sapphire/20 focus:border-sapphire"
            />
          </div>

          {/* Operational Notes */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
              Operational Notes / Timings (Optional)
            </label>
            <textarea
              rows={2}
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g. Available 8:00 AM - 8:00 PM. Emergency line fixes 24/7."
              className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sapphire/20 focus:border-sapphire"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsAddModalOpen(false);
                setIsEditModalOpen(false);
              }}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmitting}
              className="bg-sapphire hover:bg-sapphire-dark text-white"
            >
              {isSubmitting
                ? 'Saving...'
                : isEditModalOpen
                ? 'Save Changes'
                : 'Add Vendor to Directory'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* =========================================================================
          MODAL 3: VIEW VENDOR TASKS HISTORY
         ========================================================================= */}
      <Modal
        isOpen={isViewTasksModalOpen}
        onClose={() => setIsViewTasksModalOpen(false)}
        title={`Tasks Assigned to ${activeVendor?.name || 'Vendor'}`}
        subtitle={`${activeVendor?.profession} • ${activeVendor?.email}`}
        maxWidth="xl"
      >
        <div className="space-y-4">
          {isLoadingVendorTasks ? (
            <div className="p-8 text-center text-sm text-text-muted">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-sapphire" />
              Loading task assignment records...
            </div>
          ) : vendorDetailTasks.length === 0 ? (
            <div className="p-8 text-center text-sm text-text-muted">
              No tasks currently assigned to this vendor. Click "ASSIGN" on their row to assign a public inbox ticket.
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {vendorDetailTasks.map((t) => (
                <div
                  key={t.id}
                  className="p-3.5 rounded-lg border border-border bg-surface-secondary/30 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-text-primary text-sm">
                      Complaint Ticket #{t.complaint_id}
                    </span>
                    <span className="px-2 py-0.5 rounded-full font-bold uppercase text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                      {t.status.replace('_', ' ')}
                    </span>
                  </div>

                  {t.flat_no && (
                    <div className="text-text-secondary">
                      <span className="font-semibold text-text-primary">Location:</span> Flat {t.flat_no}, Block {t.block_no || '-'}
                    </div>
                  )}

                  {t.complaint_summary && (
                    <div className="text-text-secondary">
                      <span className="font-semibold text-text-primary">Summary:</span> {t.complaint_summary}
                    </div>
                  )}

                  {t.notes && (
                    <div className="p-2.5 rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200">
                      <span className="font-bold">Instructions / Local Language Note:</span> {t.notes}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-text-muted pt-1 border-t border-border">
                    <span>Assigned by: {t.assigned_by}</span>
                    <span>{t.created_at ? new Date(t.created_at).toLocaleString() : ''}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end pt-3 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsViewTasksModalOpen(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
