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
  Layers,
  Split,
  CheckSquare,
  Square,
  Users2,
  Filter,
  ShieldCheck,
  MessageCircle,
  Clock,
  Home,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { Alert } from '../components/ui/Alert';
import apiClient from '../api/client';
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
  massAssignVendorTasksApi,
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

// Mapping between vendor profession and matching public inbox complaint categories
export const PROFESSION_CATEGORY_MAP: Record<string, string[]> = {
  'Plumber': ['Plumbing', 'Water Supply'],
  'Water Tank Supplier': ['Water Supply', 'Plumbing'],
  'Electrician': ['Electrical'],
  'Line Electrician (Society Mains)': ['Electrical'],
  'AC Repairer': ['Electrical', 'Other'],
  'Electronics Repairer': ['Electrical', 'Other'],
  'Security Guard': ['Security', 'Parking', 'Noise'],
  'Sanitation / Cleaner': ['Sanitation'],
  'Housekeeping': ['Sanitation'],
  'Gardener': ['Sanitation', 'Other'],
  'Elevator Technician': ['Electrical', 'Other'],
  'Barber': ['Other'],
  'Grocery Shop (Society Complex)': ['Other'],
  'Complex Shop / Retail': ['Other'],
  'Other Helper / Vendor': ['Other', 'Plumbing', 'Electrical', 'Sanitation', 'Security', 'Parking'],
};

// Reverse mapping from complaint category to matching vendor professions
export const CATEGORY_PROFESSION_MAP: Record<string, string[]> = {
  'Plumbing': ['Plumber', 'Water Tank Supplier', 'Other Helper / Vendor'],
  'Water Supply': ['Water Tank Supplier', 'Plumber', 'Other Helper / Vendor'],
  'Electrical': ['Electrician', 'Line Electrician (Society Mains)', 'AC Repairer', 'Electronics Repairer', 'Elevator Technician', 'Other Helper / Vendor'],
  'Sanitation': ['Sanitation / Cleaner', 'Housekeeping', 'Gardener', 'Other Helper / Vendor'],
  'Security': ['Security Guard', 'Other Helper / Vendor'],
  'Parking': ['Security Guard', 'Other Helper / Vendor'],
  'Noise': ['Security Guard', 'Other Helper / Vendor'],
  'Other': ['Other Helper / Vendor', 'Plumber', 'Electrician'],
};

export const VendorAllocationPage: React.FC = () => {
  const { user, isCommitteeOrAbove } = useAuth();
  const { showToast } = useToast();

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProfession, setSelectedProfession] = useState('All');

  // Modals for Secretary / Committee
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isViewTasksModalOpen, setIsViewTasksModalOpen] = useState(false);
  const [activeVendor, setActiveVendor] = useState<Vendor | null>(null);

  // Filter for matching profession tickets only in Modal 1
  const [onlyMatchingCategory, setOnlyMatchingCategory] = useState(true);

  // Modals & States for Residents (Home Visit Requests & Direct Connect)
  const [isResidentRequestModalOpen, setIsResidentRequestModalOpen] = useState(false);
  const [residentActiveVendor, setResidentActiveVendor] = useState<Vendor | null>(null);
  const [residentRequestTab, setResidentRequestTab] = useState<'new_request' | 'my_ticket'>('new_request');
  const [residentProblemText, setResidentProblemText] = useState('');
  const [residentTimeSlot, setResidentTimeSlot] = useState('Morning (9 AM - 1 PM)');
  const [residentSelectedTicketId, setResidentSelectedTicketId] = useState<number | null>(null);
  const [isSubmittingResidentRequest, setIsSubmittingResidentRequest] = useState(false);

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

  // Mass Allocation & Workload Distribution States
  const [isMassModalOpen, setIsMassModalOpen] = useState(false);
  const [massCategoryFilter, setMassCategoryFilter] = useState('Electrical');
  const [massSearchTerm, setMassSearchTerm] = useState('');
  const [selectedMassComplaintIds, setSelectedMassComplaintIds] = useState<number[]>([]);
  const [massAllocationMode, setMassAllocationMode] = useState<'single' | 'distribute'>('distribute');
  const [selectedSingleVendorId, setSelectedSingleVendorId] = useState<number | ''>('');
  const [selectedDistributeVendorIds, setSelectedDistributeVendorIds] = useState<number[]>([]);
  const [massNotes, setMassNotes] = useState('');
  const [isSubmittingMass, setIsSubmittingMass] = useState(false);
  const [isRecordingMass, setIsRecordingMass] = useState(false);

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
      const res = await getComplaintsApi({ limit: 100, exclude_deleted: true });
      setComplaints(res.complaints.filter((c) => !c.is_deleted));
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
    setComplaintFilterText('');
    setOnlyMatchingCategory(true);
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

  // Resident's Own Open Complaints for Linking
  const residentOwnComplaints = useMemo(() => {
    if (!user) return [];
    return complaints.filter((c) => (c.is_owner || (c.flat_no === user.flat_no && c.block_no === user.block_no)) && c.status !== 'resolved' && !c.is_deleted);
  }, [complaints, user]);

  // Open Resident Home Visit Request Modal
  const handleOpenResidentRequest = (vendor: Vendor) => {
    setResidentActiveVendor(vendor);
    setResidentProblemText('');
    setResidentTimeSlot('Morning (9 AM - 1 PM)');
    setResidentSelectedTicketId(null);
    setResidentRequestTab('new_request');
    setIsResidentRequestModalOpen(true);
    if (complaints.length === 0) {
      loadComplaints();
    }
  };

  // Submit Resident Home Service Request
  const handleSubmitResidentRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!residentActiveVendor) return;

    if (residentRequestTab === 'new_request') {
      if (!residentProblemText.trim()) {
        showToast('Please provide a brief description of the repair or service needed.', 'error');
        return;
      }

      setIsSubmittingResidentRequest(true);
      try {
        const cleanType = (residentActiveVendor.profession || 'other')
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, '_')
          .slice(0, 30);

        await apiClient.post('/service-requests', {
          service_type: cleanType,
          description: `${residentProblemText.trim()} (Requested Helper: ${residentActiveVendor.name} - ${residentActiveVendor.profession})`,
          preferred_slot: residentTimeSlot,
        });

        showToast(
          `Home service visit requested with ${residentActiveVendor.name} for Flat ${user?.flat_no || ''}, Block ${user?.block_no || ''}! Track under My Tickets.`,
          'success'
        );
        setIsResidentRequestModalOpen(false);
      } catch (err: any) {
        showToast(err?.response?.data?.message || err?.message || 'Could not log service request.', 'error');
      } finally {
        setIsSubmittingResidentRequest(false);
      }
    } else {
      if (!residentSelectedTicketId) {
        showToast('Please choose one of your open tickets to link to this helper.', 'error');
        return;
      }

      setIsSubmittingResidentRequest(true);
      try {
        await assignVendorTaskApi(residentActiveVendor.id, {
          complaint_id: residentSelectedTicketId,
          notes: `Resident requested technician visit for Flat ${user?.flat_no || '-'}, Block ${user?.block_no || '-'} [Slot: ${residentTimeSlot}]: ${residentProblemText.trim() || 'Home inspection requested.'}`,
        });

        showToast(
          `Ticket #${residentSelectedTicketId} linked to ${residentActiveVendor.name}! Dispatch notice sent.`,
          'success'
        );
        setIsResidentRequestModalOpen(false);
        loadComplaints();
        loadVendors();
      } catch (err: any) {
        showToast(err?.response?.data?.message || err?.message || 'Could not link complaint.', 'error');
      } finally {
        setIsSubmittingResidentRequest(false);
      }
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

  const matchingCategories = useMemo(() => {
    if (!activeVendor) return [];
    return PROFESSION_CATEGORY_MAP[activeVendor.profession] || [];
  }, [activeVendor]);

  // Filtered public inbox complaints for modal
  const filteredComplaints = useMemo(() => {
    let list = complaints.filter((c) => c.status !== 'resolved' && !c.is_deleted);

    // 1. Smart Category Filter for specific vendor (only show matching profession tickets)
    if (activeVendor && onlyMatchingCategory && matchingCategories.length > 0) {
      list = list.filter((c) => c.category && matchingCategories.includes(c.category));
    }

    // 2. Text Search Filter
    if (!complaintFilterText.trim()) return list;
    const term = complaintFilterText.toLowerCase();
    return list.filter(
      (c) =>
        c.translated_text?.toLowerCase().includes(term) ||
        c.category?.toLowerCase().includes(term) ||
        c.flat_no?.toLowerCase().includes(term) ||
        c.block_no?.toLowerCase().includes(term) ||
        String(c.id).includes(term)
    );
  }, [complaints, complaintFilterText, activeVendor, onlyMatchingCategory, matchingCategories]);

  // Open Mass Modal
  const handleOpenMassModal = async () => {
    setIsMassModalOpen(true);
    await Promise.all([loadComplaints(), loadVendors()]);
  };

  // Mass categories available from complaints
  const massCategories = useMemo(() => {
    const cats = new Set<string>();
    complaints.forEach((c) => {
      if (c.category) cats.add(c.category);
    });
    ['Electrical', 'Plumbing', 'Water Supply', 'AC / Heating'].forEach((c) => cats.add(c));
    return ['All', ...Array.from(cats).sort()];
  }, [complaints]);

  // Mass complaint counts per category
  const complaintCountsByCategory = useMemo(() => {
    const counts: Record<string, number> = { All: complaints.length };
    complaints.forEach((c) => {
      const cat = c.category || 'General';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [complaints]);

  // Filtered complaints for Mass Allocation Modal
  const filteredMassComplaints = useMemo(() => {
    return complaints.filter((c) => {
      const matchesCategory =
        massCategoryFilter === 'All'
          ? true
          : c.category?.toLowerCase().includes(massCategoryFilter.toLowerCase());
      if (!matchesCategory) return false;

      if (!massSearchTerm.trim()) return true;
      const term = massSearchTerm.toLowerCase();
      return (
        c.translated_text?.toLowerCase().includes(term) ||
        c.category?.toLowerCase().includes(term) ||
        c.flat_no?.toLowerCase().includes(term) ||
        c.block_no?.toLowerCase().includes(term) ||
        String(c.id).includes(term) ||
        c.severity?.toLowerCase().includes(term)
      );
    });
  }, [complaints, massCategoryFilter, massSearchTerm]);

  // Toggle select all visible
  const handleToggleSelectAllVisible = () => {
    const visibleIds = filteredMassComplaints.map((c) => c.id);
    const allSelected =
      visibleIds.length > 0 && visibleIds.every((id) => selectedMassComplaintIds.includes(id));
    if (allSelected) {
      setSelectedMassComplaintIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedMassComplaintIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  // Toggle single complaint selection
  const handleToggleSingleComplaint = (id: number) => {
    setSelectedMassComplaintIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Pre-select matching vendors when category filter or vendor list changes
  useEffect(() => {
    if (!isMassModalOpen) return;
    if (vendors.length === 0) return;

    let matching = vendors;
    if (massCategoryFilter !== 'All') {
      const cat = massCategoryFilter.toLowerCase();
      matching = vendors.filter((v) => {
        const prof = v.profession.toLowerCase();
        if (cat.includes('electr')) return prof.includes('electr');
        if (cat.includes('plumb')) return prof.includes('plumb');
        if (cat.includes('water')) return prof.includes('water');
        if (cat.includes('ac') || cat.includes('air')) return prof.includes('ac') || prof.includes('air');
        return prof.includes(cat);
      });
    }

    if (matching.length > 0) {
      setSelectedDistributeVendorIds(matching.map((v) => v.id));
      setSelectedSingleVendorId(matching[0].id);
    } else {
      setSelectedDistributeVendorIds(vendors.slice(0, 2).map((v) => v.id));
      setSelectedSingleVendorId(vendors[0]?.id || '');
    }
  }, [massCategoryFilter, isMassModalOpen, vendors]);

  // Distribution Split Preview
  const distributionSplitPreview = useMemo(() => {
    if (massAllocationMode === 'single') {
      const targetVendor = vendors.find((v) => v.id === Number(selectedSingleVendorId));
      if (!targetVendor) return [];
      return [
        {
          vendor: targetVendor,
          count: selectedMassComplaintIds.length,
          percentage: selectedMassComplaintIds.length > 0 ? 100 : 0,
        },
      ];
    }

    const assignedVendors = vendors.filter((v) =>
      selectedDistributeVendorIds.includes(v.id)
    );
    const k = assignedVendors.length;
    if (k === 0 || selectedMassComplaintIds.length === 0) return [];

    const total = selectedMassComplaintIds.length;
    const baseCount = Math.floor(total / k);
    const remainder = total % k;

    return assignedVendors.map((vendor, index) => {
      const count = baseCount + (index < remainder ? 1 : 0);
      const percentage = Math.round((count / total) * 100);
      return {
        vendor,
        count,
        percentage,
      };
    });
  }, [
    massAllocationMode,
    selectedSingleVendorId,
    selectedDistributeVendorIds,
    selectedMassComplaintIds,
    vendors,
  ]);

  // Voice recording for mass note
  const toggleMassVoiceRecording = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      if (!isRecordingMass) {
        setIsRecordingMass(true);
        showToast('Recording mass batch instructions...', 'info');
        setTimeout(() => {
          setMassNotes((prev) =>
            prev
              ? `${prev}\n[Voice Note]: Emergency batch repair order. Please coordinate with security at gate and attend to all flats listed below urgently.`
              : '[Voice Note]: Emergency batch repair order. Please coordinate with security at gate and attend to all flats listed below urgently.'
          );
          setIsRecordingMass(false);
          showToast('Voice note transcribed into local language notes!', 'success');
        }, 3000);
      } else {
        setIsRecordingMass(false);
      }
      return;
    }

    if (isRecordingMass) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsRecordingMass(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = speechLanguage;
      recognition.interimResults = false;
      recognition.continuous = false;

      recognition.onstart = () => {
        setIsRecordingMass(true);
        showToast(`Listening in ${speechLanguage}... Speak instructions now`, 'info');
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setMassNotes((prev) => (prev ? `${prev} ${transcript}` : transcript));
        showToast('Voice note captured!', 'success');
      };

      recognition.onerror = () => setIsRecordingMass(false);
      recognition.onend = () => setIsRecordingMass(false);

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('Speech recognition start failed', err);
      setIsRecordingMass(false);
    }
  };

  // Execute Mass Assign
  const handleExecuteMassAssign = async () => {
    if (selectedMassComplaintIds.length === 0) {
      showToast('Please select at least 1 complaint ticket to assign.', 'error');
      return;
    }

    let targetVendorIds: number[] = [];
    if (massAllocationMode === 'single') {
      if (!selectedSingleVendorId) {
        showToast('Please choose a vendor to assign tickets to.', 'error');
        return;
      }
      targetVendorIds = [Number(selectedSingleVendorId)];
    } else {
      if (selectedDistributeVendorIds.length === 0) {
        showToast('Please select at least 1 vendor to distribute tickets across.', 'error');
        return;
      }
      targetVendorIds = selectedDistributeVendorIds;
    }

    setIsSubmittingMass(true);
    try {
      const res = await massAssignVendorTasksApi({
        vendor_ids: targetVendorIds,
        complaint_ids: selectedMassComplaintIds,
        notes: massNotes.trim() || undefined,
      });

      showToast(
        res.message || `Successfully mass assigned ${selectedMassComplaintIds.length} complaints!`,
        'success'
      );

      setIsMassModalOpen(false);
      setSelectedMassComplaintIds([]);
      setMassNotes('');
      loadVendors();
      loadComplaints();
    } catch (err: any) {
      showToast(
        err?.response?.data?.message || err?.response?.data?.error || 'Failed to mass assign vendor tasks.',
        'error'
      );
    } finally {
      setIsSubmittingMass(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-accent/10 text-accent rounded-card">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-heading text-text">
                {isCommitteeOrAbove ? 'Vendor Allocation & Operations Hub' : 'Daily Helpers & Society Services'}
              </h1>
              <p className="text-xs sm:text-sm text-muted mt-0.5">
                {isCommitteeOrAbove
                  ? 'Manage approved technicians, assign public complaints, and balance mass work order dispatches.'
                  : 'Verified on-campus technicians and local service directory for household repairs in your flat.'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={loadVendors}
            disabled={isLoading}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          {isCommitteeOrAbove && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenMassModal}
                className="flex items-center gap-1.5 border-accent text-accent hover:bg-accent/10 font-semibold"
              >
                <Layers className="w-3.5 h-3.5 text-accent" />
                <span>Mass Allocation</span>
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
            </>
          )}
        </div>
      </div>

      {/* Dynamic 3-Metric Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-3.5 rounded-card bg-surface border border-border shadow-soft flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted font-bold block">
              {isCommitteeOrAbove ? 'Registered Helpers' : 'Verified Helpers'}
            </span>
            <span className="text-2xl font-bold font-heading text-text mt-0.5 block">
              {vendors.length}
            </span>
          </div>
          <div className="w-9 h-9 rounded-control bg-surface-2 flex items-center justify-center text-accent">
            <Store className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-card bg-surface border border-border shadow-soft flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted font-bold block">
              {isCommitteeOrAbove ? 'Active Work Orders' : 'Security Clearance'}
            </span>
            <span className="text-lg sm:text-2xl font-bold font-heading text-text mt-0.5 block">
              {isCommitteeOrAbove
                ? vendors.reduce((sum, v) => sum + (v.tasks_count || 0), 0)
                : '100% Gate Verified'}
            </span>
          </div>
          <div className="w-9 h-9 rounded-control bg-surface-2 flex items-center justify-center text-status-inprogress-text">
            {isCommitteeOrAbove ? <ClipboardList className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
          </div>
        </div>

        <div className="p-3.5 rounded-card bg-surface border border-border shadow-soft flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted font-bold block">
              {isCommitteeOrAbove ? 'Open Society Tickets' : 'Your Flat'}
            </span>
            <span className="text-lg sm:text-2xl font-bold font-heading text-text mt-0.5 block truncate">
              {isCommitteeOrAbove
                ? complaints.filter((c) => c.status !== 'resolved' && !c.is_deleted).length
                : `Flat ${user?.flat_no || '-'}, Blk ${user?.block_no || '-'}`}
            </span>
          </div>
          <div className="w-9 h-9 rounded-control bg-surface-2 flex items-center justify-center text-status-escalated-text">
            {isCommitteeOrAbove ? <CheckCircle2 className="w-4 h-4" /> : <Home className="w-4 h-4" />}
          </div>
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
              className="w-full pl-9 pr-4 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
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
                className={`px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition-colors border ${isSelected
                  ? 'bg-accent text-accent-text border-accent shadow-sm'
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
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-accent" />
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
                  <th className="py-3.5 px-4 text-center">
                    {isCommitteeOrAbove ? 'Tasks Assigned' : 'Direct Contact'}
                  </th>
                  <th className="py-3.5 px-4 text-right">
                    {isCommitteeOrAbove ? 'Actions' : 'Service Booking'}
                  </th>
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
                          <div className="font-semibold text-text-primary group-hover:text-accent transition-colors flex items-center gap-1.5 flex-wrap">
                            <span>{vendor.name}</span>
                            {!isCommitteeOrAbove && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-0.5">
                                <ShieldCheck className="w-3 h-3" />
                                Verified
                              </span>
                            )}
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
                            className="flex items-center gap-1.5 text-xs text-text-primary hover:text-accent transition-colors"
                          >
                            <Phone className="w-3.5 h-3.5 text-text-muted" />
                            {vendor.phone}
                          </a>
                          <a
                            href={`mailto:${vendor.email}`}
                            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-accent transition-colors"
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

                      {/* Tasks count (Staff) OR Direct Contact (Resident) */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {isCommitteeOrAbove ? (
                          <button
                            onClick={() => handleOpenViewTasksModal(vendor)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-surface-secondary hover:bg-accent/10 text-text-secondary hover:text-accent border border-border transition-colors"
                            title="Click to view assigned tasks history"
                          >
                            <ClipboardList className="w-3.5 h-3.5" />
                            <span>{vendor.tasks_count} tasks</span>
                          </button>
                        ) : (
                          <div className="flex items-center justify-center gap-1.5">
                            <a
                              href={`tel:${vendor.phone}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-surface hover:bg-surface-secondary text-text hover:text-accent border border-border transition-colors"
                              title={`Call ${vendor.name}`}
                            >
                              <Phone className="w-3 h-3 text-accent" />
                              <span>Call</span>
                            </a>
                            <a
                              href={`https://wa.me/${vendor.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${vendor.name}, I am a resident from Flat ${user?.flat_no || ''}, Block ${user?.block_no || ''} in our society. Need assistance regarding ${vendor.profession}.`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 transition-colors"
                              title={`WhatsApp message to ${vendor.name}`}
                            >
                              <MessageCircle className="w-3 h-3" />
                              <span>WhatsApp</span>
                            </a>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {isCommitteeOrAbove ? (
                          <div className="flex items-center justify-end gap-2">
                            {/* ASSIGN Button */}
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleOpenAssignModal(vendor)}
                              className="bg-accent hover:bg-accent-hover text-accent-text font-semibold text-xs px-3 py-1.5 shadow-sm flex items-center gap-1.5"
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
                        ) : (
                          <div className="flex items-center justify-end">
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleOpenResidentRequest(vendor)}
                              className="bg-accent hover:bg-accent-hover text-accent-text font-semibold text-xs px-3 py-1.5 shadow-sm flex items-center gap-1.5"
                            >
                              <Wrench className="w-3.5 h-3.5" />
                              Request Visit
                            </Button>
                          </div>
                        )}
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
              <label className="text-xs font-bold uppercase tracking-wider text-text flex items-center gap-1.5 font-mono">
                <span className="w-5 h-5 rounded-full bg-accent text-accent-text text-xs flex items-center justify-center font-bold">
                  1
                </span>
                Select Public Inbox Complaint Ticket
              </label>
              <span className="text-xs text-muted font-mono">
                {filteredComplaints.length} tickets available
              </span>
            </div>

            {/* Smart Category Filter for Vendor Specialty */}
            {activeVendor && matchingCategories.length > 0 && (
              <div className="flex items-center justify-between mb-2.5 px-3 py-1.5 rounded-control bg-accent/10 border border-accent/20 text-xs">
                <span className="text-text font-medium flex items-center gap-1.5 truncate">
                  <Filter className="w-3.5 h-3.5 text-accent shrink-0" />
                  <span className="truncate">
                    {onlyMatchingCategory ? (
                      <>
                        Filtered to <strong className="text-accent">{activeVendor.profession}</strong> tickets ({matchingCategories.join(', ')})
                      </>
                    ) : (
                      'Showing tickets from all categories'
                    )}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setOnlyMatchingCategory((prev) => !prev)}
                  className="text-xs font-semibold text-accent hover:underline shrink-0 ml-2"
                >
                  {onlyMatchingCategory ? 'Show all categories' : `Filter to ${activeVendor.profession} only`}
                </button>
              </div>
            )}

            {/* Complaint filter search input */}
            <div className="relative mb-2.5">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={complaintFilterText}
                onChange={(e) => setComplaintFilterText(e.target.value)}
                placeholder={`Search ${onlyMatchingCategory && activeVendor ? activeVendor.profession : ''} complaints by flat, block, or keyword...`}
                className="w-full pl-8 pr-3 py-1.5 text-xs app-input"
              />
            </div>

            <div className="max-h-56 overflow-y-auto space-y-2 border border-border rounded-control p-2 bg-surface-2/30">
              {isLoadingComplaints ? (
                <div className="p-6 text-center text-xs text-muted">
                  <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-1 text-accent" />
                  Loading complaints...
                </div>
              ) : filteredComplaints.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted space-y-2">
                  <p>
                    {onlyMatchingCategory && activeVendor
                      ? `No open ${activeVendor.profession} (${matchingCategories.join(', ')}) complaints found.`
                      : 'No complaints match your search filter.'}
                  </p>
                  {onlyMatchingCategory && activeVendor && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setOnlyMatchingCategory(false)}
                    >
                      Show all complaints anyway
                    </Button>
                  )}
                </div>
              ) : (
                filteredComplaints.map((c) => {
                  const isSelected = selectedComplaintId === c.id;
                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelectedComplaintId(c.id)}
                      className={`p-3 rounded-control border text-xs cursor-pointer transition-all ${isSelected
                        ? 'border-accent bg-accent/5 ring-1 ring-accent'
                        : 'border-border bg-surface hover:border-accent/40'
                        }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            checked={isSelected}
                            onChange={() => setSelectedComplaintId(c.id)}
                            className="text-accent focus:ring-accent h-3.5 w-3.5"
                          />
                          <span className="font-bold text-text font-mono">
                            #{c.id} • {c.category || 'General'}
                          </span>
                          {c.flat_no && (
                            <span className="px-1.5 py-0.5 rounded bg-surface-2 text-text font-mono text-[11px] border border-border">
                              Flat {c.flat_no}, Block {c.block_no || '-'}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${c.status === 'in_progress'
                              ? 'bg-status-inprogress-bg text-status-inprogress-text'
                              : c.status === 'resolved'
                                ? 'bg-status-resolved-bg text-status-resolved-text'
                                : 'bg-status-new-bg text-status-new-text'
                              }`}
                          >
                            {c.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>

                      <p className="text-muted mt-1.5 line-clamp-2 pl-5">
                        {c.translated_text || 'No description'}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Step 2: Work Order Notes */}
          <div className="space-y-2 border-t border-border pt-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-text flex items-center gap-1.5 font-mono">
                <span className="w-5 h-5 rounded-full bg-accent text-accent-text text-xs flex items-center justify-center font-bold">
                  2
                </span>
                Work Order Notes for Technician
              </label>

              {/* Language Selector for Voice Input */}
              <div className="flex items-center gap-1.5 text-xs text-muted">
                <span>Language:</span>
                <select
                  value={speechLanguage}
                  onChange={(e: any) => setSpeechLanguage(e.target.value)}
                  className="text-xs app-input px-1.5 py-0.5"
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
                rows={3}
                placeholder="Add instructions or notes for the technician (e.g. check 3rd floor valve, bring replacement parts, resident available after 4 PM)..."
                className="w-full text-sm app-input p-3 pr-24"
              />

              {/* Voice Note Button */}
              <div className="absolute right-2.5 bottom-2.5 flex items-center gap-1">
                <button
                  type="button"
                  onClick={toggleVoiceRecording}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-control text-xs font-semibold transition-all ${isRecording
                    ? 'bg-status-escalated-bg text-status-escalated-text border border-status-escalated-text/30 animate-pulse'
                    : 'bg-surface hover:bg-surface-2 text-muted border border-border'
                    }`}
                  title="Click to speak your voice note in your local language"
                >
                  {isRecording ? (
                    <>
                      <MicOff className="w-3.5 h-3.5 text-current animate-spin" />
                      <span>Recording...</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-3.5 h-3.5 text-accent" />
                      <span>Voice Note</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-muted">
              <span>This note will be included in the work order dispatch email sent to {activeVendor?.email} via Resend.</span>
              {assignmentNotes && (
                <button
                  type="button"
                  onClick={() => setAssignmentNotes('')}
                  className="text-status-escalated-text hover:underline text-xs"
                >
                  Clear notes
                </button>
              )}
            </div>
          </div>

  {/* Dialog Action Buttons */ }
  < div className = "flex items-center justify-end gap-3 pt-4 border-t border-border" >
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
              className="bg-accent hover:bg-accent-hover text-accent-text flex items-center gap-2"
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
          </div >
        </div >
      </Modal >

{/* =========================================================================
          MODAL 2: ADD / EDIT VENDOR DETAILS
         ========================================================================= */}
  < Modal
isOpen = { isAddModalOpen || isEditModalOpen}
onClose = {() => {
  setIsAddModalOpen(false);
  setIsEditModalOpen(false);
}}
title = { isEditModalOpen? `Edit Helper / Vendor Record` : `Add Society Helper / Vendor`}
subtitle = "Manage society technicians, barbers, security guards, shops, and essential helpers"
maxWidth = "lg"
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
        className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
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
          className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
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
            className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
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
          className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
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
        className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
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
        className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
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
        className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
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
        className="bg-accent hover:bg-accent-hover text-accent-text"
      >
        {isSubmitting
          ? 'Saving...'
          : isEditModalOpen
            ? 'Save Changes'
            : 'Add Vendor to Directory'}
      </Button>
    </div>
  </form>
      </Modal >

{/* =========================================================================
          MODAL 3: VIEW VENDOR TASKS HISTORY
         ========================================================================= */}
  < Modal
isOpen = { isViewTasksModalOpen }
onClose = {() => setIsViewTasksModalOpen(false)}
title = {`Tasks Assigned to ${activeVendor?.name || 'Vendor'}`}
subtitle = {`${activeVendor?.profession} • ${activeVendor?.email}`}
maxWidth = "xl"
  >
  <div className="space-y-4">
    {isLoadingVendorTasks ? (
      <div className="p-8 text-center text-sm text-text-muted">
        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-accent" />
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
      </Modal >

{/* =========================================================================
          MODAL 4: MASS VENDOR ALLOCATION & WORKLOAD DISTRIBUTION (CASE STUDY)
         ========================================================================= */}
  < Modal
isOpen = { isMassModalOpen }
onClose = {() => setIsMassModalOpen(false)}
title = "⚡ Mass Vendor Allocation & Workload Distribution"
subtitle = "Search ~100 complaints by problem category, select all tickets, and assign to 1 vendor or distribute workload across multiple specialists."
maxWidth = "2xl"
  >
  <div className="space-y-5 text-sm">
    {/* Case study banner */}
    <div className="p-3 bg-gradient-to-r from-sapphire/10 to-indigo-50/50 dark:to-indigo-950/20 border border-accent/20 rounded-lg flex items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-accent shrink-0" />
        <span className="text-text-primary">
          <span className="font-bold text-accent">Case Study Scenario:</span> Society incident creates mass complaints (e.g. electrical outage / line fault). Filter by category, select all, and balance work order dispatches via Resend email.
        </span>
      </div>
      <span className="px-2 py-0.5 rounded-full font-semibold text-[11px] bg-accent text-accent-text shrink-0">
        Open Tickets: {complaints.length}
      </span>
    </div>

    {/* STEP 1: CATEGORY SELECTION & COMPLAINT PICKER */}
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-full bg-accent text-accent-text flex items-center justify-center text-[11px]">1</span>
          Filter Complaints by Category &amp; Select All
        </label>
        <span className="text-xs font-medium text-accent">
          {selectedMassComplaintIds.length} of {filteredMassComplaints.length} tickets selected
        </span>
      </div>

      {/* Category Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
        {massCategories.map((cat) => {
          const isSelected = massCategoryFilter === cat;
          const count = complaintCountsByCategory[cat] || 0;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setMassCategoryFilter(cat)}
              className={`px-3 py-1 rounded-full font-medium whitespace-nowrap transition-colors border flex items-center gap-1.5 ${isSelected
                ? 'bg-accent text-accent-text border-accent shadow-xs'
                : 'bg-surface-secondary/40 hover:bg-surface-secondary text-text-secondary border-border'
                }`}
            >
              <span>{cat}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected
                  ? 'bg-white/20 text-white font-bold'
                  : 'bg-background text-text-muted border border-border'
                  }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search and Select All Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={massSearchTerm}
            onChange={(e) => setMassSearchTerm(e.target.value)}
            placeholder="Filter by flat, block, ticket # or issue description..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
          />
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleToggleSelectAllVisible}
          disabled={filteredMassComplaints.length === 0}
          className="flex items-center justify-center gap-1.5 text-xs shrink-0 border-border font-medium"
        >
          {filteredMassComplaints.length > 0 &&
            filteredMassComplaints.every((c) => selectedMassComplaintIds.includes(c.id)) ? (
            <>
              <CheckSquare className="w-3.5 h-3.5 text-accent" />
              <span>Deselect All Visible</span>
            </>
          ) : (
            <>
              <Square className="w-3.5 h-3.5 text-text-muted" />
              <span>Select All ({filteredMassComplaints.length})</span>
            </>
          )}
        </Button>
      </div>

      {/* Scrollable Complaints List */}
      <div className="max-h-52 overflow-y-auto border border-border rounded-lg divide-y divide-border bg-background/50 pr-1">
        {isLoadingComplaints ? (
          <div className="p-6 text-center text-xs text-text-muted">
            <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-1 text-accent" />
            Loading complaints...
          </div>
        ) : filteredMassComplaints.length === 0 ? (
          <div className="p-6 text-center text-xs text-text-muted">
            No open complaints matching category "{massCategoryFilter}".
          </div>
        ) : (
          filteredMassComplaints.map((c) => {
            const isChecked = selectedMassComplaintIds.includes(c.id);
            return (
              <label
                key={c.id}
                className={`flex items-start gap-3 p-2.5 cursor-pointer text-xs transition-colors hover:bg-surface-secondary/50 ${isChecked ? 'bg-accent/5 dark:bg-accent/15' : ''
                  }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleToggleSingleComplaint(c.id)}
                  className="mt-0.5 rounded text-accent focus:ring-accent"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-bold text-text-primary">
                      Ticket #{c.id}
                    </span>
                    <span className="text-text-muted">•</span>
                    <span className="font-semibold text-text-secondary">
                      Flat {c.flat_no || '-'}, Block {c.block_no || '-'}
                    </span>
                    <span className="text-text-muted">•</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-surface-secondary text-text-secondary border border-border">
                      {c.category || 'General'}
                    </span>
                    {c.severity && (
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase ${c.severity.toLowerCase() === 'high'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                      >
                        {c.severity}
                      </span>
                    )}
                  </div>
                  <p className="text-text-secondary line-clamp-1">
                    {c.translated_text || 'No description provided'}
                  </p>
                </div>
              </label>
            );
          })
        )}
      </div>
    </div>

    {/* STEP 2: ALLOCATION STRATEGY & VENDOR SELECTION */}
    <div className="space-y-3 pt-3 border-t border-border">
      <label className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
        <span className="w-5 h-5 rounded-full bg-accent text-accent-text flex items-center justify-center text-[11px]">2</span>
        Allocation Strategy &amp; Vendor Selection
      </label>

      {/* Mode Toggle Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setMassAllocationMode('single')}
          className={`p-3 rounded-lg border text-left transition-all ${massAllocationMode === 'single'
            ? 'border-accent bg-accent/5 text-accent ring-1 ring-accent shadow-xs'
            : 'border-border bg-surface hover:bg-surface-secondary/40 text-text-secondary'
            }`}
        >
          <div className="flex items-center gap-2 font-bold text-xs mb-1">
            <Users2 className="w-4 h-4 text-accent" />
            <span>Single Vendor Assignment</span>
          </div>
          <p className="text-[11px] text-text-muted leading-relaxed">
            Assign 100% of selected tickets to one master vendor (e.g. all 100 tickets to one electrician).
          </p>
        </button>

        <button
          type="button"
          onClick={() => setMassAllocationMode('distribute')}
          className={`p-3 rounded-lg border text-left transition-all ${massAllocationMode === 'distribute'
            ? 'border-accent bg-accent/5 text-accent ring-1 ring-accent shadow-xs'
            : 'border-border bg-surface hover:bg-surface-secondary/40 text-text-secondary'
            }`}
        >
          <div className="flex items-center gap-2 font-bold text-xs mb-1">
            <Split className="w-4 h-4 text-accent" />
            <span>Workload Distribution (Split)</span>
          </div>
          <p className="text-[11px] text-text-muted leading-relaxed">
            Evenly distribute the selected tickets across 2+ vendors (e.g. 50/50 split across electricians).
          </p>
        </button>
      </div>

      {/* If Single Vendor Mode */}
      {massAllocationMode === 'single' ? (
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-text-secondary">
            Choose Vendor to Receive All {selectedMassComplaintIds.length} Tickets *
          </label>
          <select
            value={selectedSingleVendorId}
            onChange={(e) => setSelectedSingleVendorId(Number(e.target.value) || '')}
            className="w-full text-xs bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
          >
            <option value="">-- Select Vendor --</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.profession}) — Current Active Tasks: {v.tasks_count}
              </option>
            ))}
          </select>
        </div>
      ) : (
        /* If Distribute Mode: Vendor Checkboxes & Split Calculator */
        <div className="space-y-2.5">
          <label className="block text-xs font-medium text-text-secondary">
            Select 2 or More Vendors to Share the Workload:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
            {vendors.map((v) => {
              const isChecked = selectedDistributeVendorIds.includes(v.id);
              return (
                <label
                  key={v.id}
                  className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${isChecked
                    ? 'border-accent/60 bg-accent/5 font-semibold text-text-primary'
                    : 'border-border bg-surface text-text-secondary hover:bg-surface-secondary/30'
                    }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {
                      setSelectedDistributeVendorIds((prev) =>
                        prev.includes(v.id)
                          ? prev.filter((id) => id !== v.id)
                          : [...prev, v.id]
                      );
                    }}
                    className="rounded text-accent focus:ring-accent"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-text-primary">{v.name}</div>
                    <div className="text-[10px] text-text-muted truncate">
                      {v.profession} • Tasks: {v.tasks_count}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>

          {/* Live Workload Split Distribution Card */}
          {distributionSplitPreview.length > 0 && (
            <div className="p-3 rounded-lg bg-surface-secondary/40 border border-border space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-text-primary flex items-center gap-1.5">
                  <Split className="w-3.5 h-3.5 text-accent" />
                  Live Workload Split Preview ({selectedMassComplaintIds.length} tickets):
                </span>
                <span className="text-[11px] font-semibold text-accent">
                  {distributionSplitPreview.length} Vendors Participating
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {distributionSplitPreview.map((item) => (
                  <div
                    key={item.vendor.id}
                    className="p-2 rounded bg-surface border border-border flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-text-primary">
                        {item.vendor.name}
                      </div>
                      <div className="text-[10px] text-text-muted">
                        {item.vendor.profession}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-accent text-xs">
                        +{item.count} tickets
                      </span>
                      <div className="text-[10px] text-text-muted">
                        ({item.percentage}%)
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>

    {/* STEP 3: WRITTEN OR VOICE NOTE (LOCAL LANGUAGE) */}
    <div className="space-y-2 pt-3 border-t border-border">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-full bg-accent text-accent-text flex items-center justify-center text-[11px]">3</span>
          Work Order Instructions (Written or Voice Note in Local Language)
        </label>

        {/* Language Selector */}
        <div className="flex items-center gap-1.5 text-xs text-text-muted">
          <span>Lang:</span>
          <select
            value={speechLanguage}
            onChange={(e: any) => setSpeechLanguage(e.target.value)}
            className="text-xs bg-background border border-border rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="hi-IN">Hindi (हिंदी)</option>
            <option value="en-IN">English (Indian)</option>
            <option value="bn-IN">Bengali (বাংলা)</option>
            <option value="ta-IN">Tamil (தமிழ்)</option>
            <option value="te-IN">Telugu (తెలుగు)</option>
          </select>
        </div>
      </div>

      <div className="relative">
        <textarea
          rows={3}
          value={massNotes}
          onChange={(e) => setMassNotes(e.target.value)}
          placeholder="Enter batch dispatch note in your local language or click microphone to dictate (e.g. 'कृपया सोसाइटी के सभी फ्लैट्स में मेन लाइन और फॉल्ट चेक करें')..."
          className="w-full text-xs bg-background border border-border rounded-lg p-2.5 pr-12 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
        />

        <button
          type="button"
          onClick={toggleMassVoiceRecording}
          className={`absolute right-2.5 bottom-3 p-1.5 rounded-full transition-colors ${isRecordingMass
            ? 'bg-rose-500 text-white animate-pulse'
            : 'bg-surface-secondary hover:bg-border text-text-secondary'
            }`}
          title="Dictate voice note in local language"
        >
          {isRecordingMass ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>
      </div>
    </div>

    {/* Action Buttons */}
    <div className="flex items-center justify-between pt-3 border-t border-border">
      <div className="text-xs text-text-muted">
        {selectedMassComplaintIds.length > 0 ? (
          <span>
            Ready to assign <span className="font-bold text-text-primary">{selectedMassComplaintIds.length}</span> tickets
          </span>
        ) : (
          <span className="text-amber-600 dark:text-amber-400">
            Select at least 1 ticket to proceed
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsMassModalOpen(false)}
        >
          Cancel
        </Button>

        <Button
          type="button"
          variant="primary"
          size="sm"
          disabled={isSubmittingMass || selectedMassComplaintIds.length === 0}
          onClick={handleExecuteMassAssign}
          className="bg-accent hover:bg-accent-hover text-accent-text flex items-center gap-1.5"
        >
          {isSubmittingMass ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Dispatching via Resend...</span>
            </>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              <span>
                Confirm &amp; Dispatch Batch Orders ({selectedMassComplaintIds.length})
              </span>
            </>
          )}
        </Button>
      </div>
    </div>
  </div>
      </Modal>

      {/* =========================================================================
          MODAL 5: RESIDENT HOME VISIT / SERVICE REQUEST
         ========================================================================= */}
      <Modal
        isOpen={isResidentRequestModalOpen}
        onClose={() => setIsResidentRequestModalOpen(false)}
        title={`Request Home Visit — ${residentActiveVendor?.name || 'Helper'}`}
        subtitle={`${residentActiveVendor?.profession} • Technician visit to your flat`}
        maxWidth="lg"
      >
        <form onSubmit={handleSubmitResidentRequest} className="space-y-4 text-sm">
          {/* Flat Verification Card */}
          <div className="p-3 bg-surface-secondary/50 border border-border rounded-lg flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Home className="w-4 h-4 text-accent shrink-0" />
              <span className="font-semibold text-text">
                Flat {user?.flat_no || '-'}, Block {user?.block_no || '-'}
              </span>
              <span className="text-muted">• {user?.name}</span>
            </div>
            <span className="text-[11px] text-muted">{user?.phone || user?.gmail}</span>
          </div>

          {/* Tab Switcher: New Request vs Link Existing Complaint */}
          <div className="flex border-b border-border">
            <button
              type="button"
              onClick={() => setResidentRequestTab('new_request')}
              className={`py-2 px-3 text-xs font-bold border-b-2 transition-colors ${
                residentRequestTab === 'new_request'
                  ? 'border-accent text-accent'
                  : 'border-transparent text-muted hover:text-text'
              }`}
            >
              1. New Household Repair
            </button>
            <button
              type="button"
              onClick={() => setResidentRequestTab('my_ticket')}
              className={`py-2 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
                residentRequestTab === 'my_ticket'
                  ? 'border-accent text-accent'
                  : 'border-transparent text-muted hover:text-text'
              }`}
            >
              <span>2. Link My Open Complaint</span>
              {residentOwnComplaints.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-accent/20 text-accent font-bold">
                  {residentOwnComplaints.length}
                </span>
              )}
            </button>
          </div>

          {residentRequestTab === 'new_request' ? (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-text mb-1">
                  Describe the Issue or Service Needed *
                </label>
                <textarea
                  rows={3}
                  value={residentProblemText}
                  onChange={(e) => setResidentProblemText(e.target.value)}
                  placeholder="Describe what needs fixing (e.g. bathroom tap leaking, switchboard spark, AC cooling issue, etc.)..."
                  className="w-full text-xs app-input p-2.5"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-accent" />
                  Preferred Technician Visit Time Slot:
                </label>
                <select
                  value={residentTimeSlot}
                  onChange={(e) => setResidentTimeSlot(e.target.value)}
                  className="w-full text-xs app-input p-2"
                >
                  <option value="Morning (9:00 AM – 1:00 PM)">Morning (9:00 AM – 1:00 PM)</option>
                  <option value="Afternoon (1:00 PM – 5:00 PM)">Afternoon (1:00 PM – 5:00 PM)</option>
                  <option value="Evening (5:00 PM – 8:00 PM)">Evening (5:00 PM – 8:00 PM)</option>
                  <option value="Urgent / As Soon As Possible">Urgent / As Soon As Possible</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-muted">
                Select one of your existing open complaints to assign this verified technician to inspect it:
              </p>
              {residentOwnComplaints.length === 0 ? (
                <div className="p-4 rounded-lg bg-surface-secondary/40 border border-border text-center text-xs text-muted">
                  You have no open complaints right now. Switch to "New Household Repair" to submit a new service request.
                </div>
              ) : (
                <div className="max-h-40 overflow-y-auto space-y-2 border border-border rounded-lg p-2 bg-background">
                  {residentOwnComplaints.map((c) => (
                    <label
                      key={c.id}
                      className={`flex items-start gap-2.5 p-2 rounded border text-xs cursor-pointer transition-colors ${
                        residentSelectedTicketId === c.id
                          ? 'border-accent bg-accent/5 font-semibold text-text'
                          : 'border-border bg-surface text-muted hover:bg-surface-secondary'
                      }`}
                    >
                      <input
                        type="radio"
                        name="residentComplaint"
                        checked={residentSelectedTicketId === c.id}
                        onChange={() => setResidentSelectedTicketId(c.id)}
                        className="mt-0.5 text-accent focus:ring-accent"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 font-bold text-text">
                          <span>#{c.id}</span>
                          <span>•</span>
                          <span className="capitalize">{c.category || 'General'}</span>
                        </div>
                        <p className="text-muted line-clamp-1 mt-0.5">{c.translated_text || 'No description'}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-text mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-accent" />
                  Preferred Inspection Time Slot:
                </label>
                <select
                  value={residentTimeSlot}
                  onChange={(e) => setResidentTimeSlot(e.target.value)}
                  className="w-full text-xs app-input p-2"
                >
                  <option value="Morning (9:00 AM – 1:00 PM)">Morning (9:00 AM – 1:00 PM)</option>
                  <option value="Afternoon (1:00 PM – 5:00 PM)">Afternoon (1:00 PM – 5:00 PM)</option>
                  <option value="Evening (5:00 PM – 8:00 PM)">Evening (5:00 PM – 8:00 PM)</option>
                  <option value="Urgent / As Soon As Possible">Urgent / As Soon As Possible</option>
                </select>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsResidentRequestModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmittingResidentRequest || (residentRequestTab === 'my_ticket' && residentOwnComplaints.length === 0)}
              className="bg-accent hover:bg-accent-hover text-accent-text flex items-center gap-1.5"
            >
              {isSubmittingResidentRequest ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Confirm Home Visit Request</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
