import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Cpu,
  Shield,
  Phone,
  CheckCircle2,
  AlertTriangle,
  Siren,
  Languages,
  Users,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { getDirectoryUsersApi } from '../api/users';
import { DirectoryUser } from '../types/users';

export const AboutUsPage: React.FC = () => {
  const [committeeMembers, setCommitteeMembers] = useState<DirectoryUser[]>([]);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const users = await getDirectoryUsersApi('approved');
        const staff = users.filter((u) => u.role === 'secretary' || u.role === 'committee');
        setCommitteeMembers(staff);
      } catch {
        // quiet catch
      }
    };
    fetchStaff();
  }, []);

  const emergencyContacts = [
    { name: 'Security Main Gate (Gate 1)', phone: '+91 98765 00001', role: '24x7 Security' },
    { name: 'Maintenance & Facility Office', phone: '+91 98765 00002', role: 'Mon-Sat 9am-6pm' },
    { name: 'On-Call Society Electrician', phone: '+91 98765 00003', role: 'Emergency Repairs' },
    { name: 'On-Call Society Plumber', phone: '+91 98765 00004', role: 'Water / Leakage' },
    { name: 'Lift AMC 24x7 Breakdown', phone: '1800 123 4567', role: 'Elevator Emergency' },
    { name: 'Local Police Station', phone: '112 / 100', role: 'Emergency Response' },
    { name: 'Fire Department', phone: '101', role: 'Fire Emergency' },
    { name: 'Nearest Hospital Ambulance', phone: '108 / 102', role: 'Medical Emergency' },
  ];

  const societyRules = [
    { title: 'Quiet Hours', desc: 'Strict silence enforced between 10:00 PM and 7:00 AM daily.' },
    {
      title: 'Waste Segregation',
      desc: 'Wet and Dry waste must be strictly separated before door-to-door collection at 8:00 AM.',
    },
    {
      title: 'Designated Parking',
      desc: 'Park vehicles strictly within your allocated slot. Visitor parking requires gate approval.',
    },
    {
      title: 'Pet Etiquette',
      desc: 'Pets must be on a leash in common areas. Pet owners must clean up after their pets.',
    },
    {
      title: 'Balcony & Exterior',
      desc: 'No heavy objects or hanging clothes visible on exterior facades above balcony railings.',
    },
  ];

  return (
    <div className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex items-center gap-3">
        <Link to="/">
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to AI Desk
          </Button>
        </Link>
      </div>

      {/* Hero Card */}
      <div className="bg-surface rounded-card border-[1.5px] border-border p-8 sm:p-12 shadow-soft space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="w-16 h-16 rounded-card bg-surface-2 border-[1.5px] border-border text-accent flex items-center justify-center shrink-0 shadow-soft">
            <Building2 className="w-8 h-8 text-accent" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-28 sm:text-40 font-heading font-bold text-text tracking-tight leading-tight">
                GrievDesk RWA Portal
              </h1>
              <span className="text-xs font-bold px-2 py-0.5 rounded-control bg-accent/15 text-accent font-mono">
                Active Society
              </span>
            </div>
            <div className="w-12 h-1 bg-highlight rounded-full mt-2 mb-2.5" aria-hidden="true" />
            <p className="text-sm text-muted font-medium">
              Residential Welfare Association (RWA) Official Management &amp; AI Helpdesk
            </p>
          </div>
        </div>

        <p className="text-sm text-text leading-relaxed max-w-3xl">
          <strong>GrievDesk</strong> is an AI-integrated residential society management platform
          designed to streamline communication, ticket resolution, dues administration, and amenity
          reservations. By combining voice-enabled AI intake with canonical English records, all
          residents can communicate comfortably in their native language while society staff
          operate with clarity and speed.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t-[1.5px] border-border">
          <div className="p-4 rounded-card bg-surface-2 border-[1.5px] border-border space-y-1">
            <div className="flex items-center gap-2 font-semibold text-text text-sm">
              <Languages className="w-4 h-4 text-accent" />
              <span>Multi-Modal AI</span>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              Whisper STT voice translation + Gemini AI for ticket categorization and bylaws Q&amp;A.
            </p>
          </div>

          <div className="p-4 rounded-card bg-surface-2 border-[1.5px] border-border space-y-1">
            <div className="flex items-center gap-2 font-semibold text-text text-sm">
              <Shield className="w-4 h-4 text-status-resolved-text" />
              <span>Verified Governance</span>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              Role-gated workflows for Residents, Committee Members, and the Society Secretary.
            </p>
          </div>

          <div className="p-4 rounded-card bg-surface-2 border-[1.5px] border-border space-y-1">
            <div className="flex items-center gap-2 font-semibold text-text text-sm">
              <Cpu className="w-4 h-4 text-status-new-text" />
              <span>Real-Time Audit</span>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              Transparent ticket timelines, duplicate detection, and automated monthly dues tracking.
            </p>
          </div>
        </div>
      </div>

      {/* Society Leadership Section */}
      <div className="bg-surface rounded-card border-[1.5px] border-border p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-lg font-heading font-semibold text-text flex items-center gap-2">
            <Users className="w-5 h-5 text-accent" />
            <span>RWA Executive Committee &amp; Leadership</span>
          </h2>
          <p className="text-xs text-muted mt-1">
            Elected society leadership responsible for maintenance, infrastructure, and community welfare.
          </p>
        </div>

        {committeeMembers.length === 0 ? (
          <div className="p-6 text-center bg-surface-2 rounded-card border-[1.5px] border-border">
            <p className="text-xs text-muted">Loading leadership directory...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {committeeMembers.map((m) => {
              const isSec = m.role === 'secretary';
              return (
                <div
                  key={m.id}
                  className="p-4 rounded-card border-[1.5px] border-border bg-surface-2 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-text text-sm">{m.name}</h3>
                    {isSec ? (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-control bg-status-escalated-bg text-status-escalated-text font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-status-escalated-text" />
                        Secretary
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-control bg-status-new-bg text-status-new-text font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-status-new-text" />
                        Committee
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted space-y-0.5">
                    <p>
                      <strong>Flat:</strong> {m.flat_no}, Block {m.block_no}
                    </p>
                    {m.phone && (
                      <p className="flex items-center gap-1.5 pt-1 text-text font-mono">
                        <Phone className="w-3 h-3 text-status-resolved-text" />
                        <a href={`tel:${m.phone}`} className="hover:underline">
                          {m.phone}
                        </a>
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Emergency & Essential Contacts */}
      <div className="bg-surface rounded-card border-[1.5px] border-border p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-lg font-heading font-semibold text-text flex items-center gap-2">
            <Siren className="w-5 h-5 text-status-escalated-text" />
            <span>Emergency &amp; Essential Contacts</span>
          </h2>
          <p className="text-xs text-muted mt-1">
            Keep these numbers handy for quick assistance during maintenance issues or emergencies.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {emergencyContacts.map((c, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-card bg-surface-2 border-[1.5px] border-border space-y-1 hover:border-accent/40 transition-colors duration-150"
            >
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted block">
                {c.role}
              </span>
              <h4 className="text-xs font-semibold text-text leading-snug">{c.name}</h4>
              <a
                href={`tel:${c.phone}`}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:underline font-mono pt-1"
              >
                <Phone className="w-3 h-3 text-accent" />
                {c.phone}
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Key Society Bylaws */}
      <div className="bg-surface rounded-card border-[1.5px] border-border p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-lg font-heading font-semibold text-text flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-status-inprogress-text" />
            <span>Key Society Guidelines &amp; Code of Conduct</span>
          </h2>
          <p className="text-xs text-muted mt-1">
            Common rules that help maintain a peaceful, clean, and collaborative residential community.
          </p>
        </div>

        <div className="space-y-3">
          {societyRules.map((r, i) => (
            <div
              key={i}
              className="p-4 rounded-card bg-surface-2 border-[1.5px] border-border flex items-start gap-3"
            >
              <CheckCircle2 className="w-4 h-4 text-status-resolved-text shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-semibold text-text">{r.title}</h4>
                <p className="text-xs text-muted mt-0.5 leading-relaxed">{r.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
