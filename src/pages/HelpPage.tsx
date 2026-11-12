import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  HelpCircle,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  BookOpen,
  Mic,
  Calendar,
  CreditCard,
  Crown,
  Search,
} from 'lucide-react';
import { Button } from '../components/ui/Button';

export const HelpPage: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How does the 4-intent selection work?',
      icon: <HelpCircle className="w-4 h-4 text-accent" />,
      a: 'GrievDesk does NOT use unreliable AI intent classification to guess what you want. You explicitly pick one of Complaint, Service, Rules, or Committee Action before typing or recording. If your message does not match the selected intent, the AI replies with a polite clarification and avoids creating a false ticket.',
    },
    {
      q: 'How does voice recording & multi-lingual speech-to-text work?',
      icon: <Mic className="w-4 h-4 text-accent" />,
      a: 'Click the microphone button to start recording your voice note in your browser. When you finish, GrievDesk uploads the audio directly to our server where it is transcribed, automatically translated to canonical English, and structured. You will see an "I heard: ..." transcript callout in the chat bubble so you can verify what was spoken.',
    },
    {
      q: 'How does language translation work across residents?',
      icon: <BookOpen className="w-4 h-4 text-accent" />,
      a: 'All tickets, complaints, and circulars are stored in canonical English in the database to ensure uniform record-keeping. When any resident views a circular or ticket, GrievDesk translates it on-the-fly into their preferred language (e.g., Hindi, Odia, Bengali). You can click "Original English" at any time to inspect the canonical text.',
    },
    {
      q: 'What is an anonymous complaint?',
      icon: <AlertCircle className="w-4 h-4 text-accent" />,
      a: 'When you check "Post anonymously" before submitting a complaint, your name and apartment number are masked with "***" and hidden from other residents in the Public Inbox. However, elected Committee members and the Secretary can see your identity for verification and on-site inspection.',
    },
    {
      q: 'How does duplicate complaint detection work?',
      icon: <AlertCircle className="w-4 h-4 text-accent" />,
      a: 'If a resident in your residential block has already reported the same category of issue (e.g., water shortage or elevator malfunction in Block B), GrievDesk automatically links your complaint as a duplicate. This aggregates affected resident counts so the committee can see how many households are impacted.',
    },
    {
      q: 'How do Amenity Bookings and cancellations work?',
      icon: <Calendar className="w-4 h-4 text-accent" />,
      a: 'Head to "Amenity Booking" to select a facility (Clubhouse, Badminton Court, Party Hall), choose a date, and inspect the real-time availability timeline. You can book slots up to 30 days in advance. If your plans change, you can cancel your reservation anytime from "My Reservations" before the slot begins.',
    },
    {
      q: 'How are maintenance dues tracked and paid?',
      icon: <CreditCard className="w-4 h-4 text-accent" />,
      a: 'Under "Announcement / Dues", residents can view their personal maintenance fee schedule, due dates, and outstanding balance. Once payment is made to the society account, the committee marks the record as Paid. Staff can also generate automated polite dues reminders with AI.',
    },
    {
      q: 'How does the AI Society Bylaws / Rulebook Q&A work?',
      icon: <BookOpen className="w-4 h-4 text-accent" />,
      a: 'When you select the "Rules" chip on the Home screen and ask a question (e.g. "Can I keep a Golden Retriever?" or "What are clubhouse booking fees?"), our AI references the society bylaws uploaded by the committee and returns the exact rule with page or section citations.',
    },
    {
      q: 'How does the Secretary role work and how is it transferred?',
      icon: <Crown className="w-4 h-4 text-highlight-ink" />,
      a: 'There is strictly ONE active Secretary in the society at any time. The Secretary holds exclusive authority to approve new resident signups, demote committee members, and transfer the Secretary title. Transferring the role automatically steps down the outgoing secretary to a Committee member.',
    },
    {
      q: 'How do I use the Global Search feature?',
      icon: <Search className="w-4 h-4 text-accent" />,
      a: 'Click "Search..." in the top navigation bar or press Ctrl+K (Cmd+K on Mac) to search across the Public Inbox, service requests, announcements, and rulebook bylaws in real time. Queries typed in vernacular languages are automatically translated to search canonical English records.',
    },
  ];

  return (
    <div className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/">
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to AI Desk
          </Button>
        </Link>
      </div>

      <div className="bg-surface rounded-card border-[1.5px] border-border p-6 sm:p-10 shadow-soft space-y-6">
        <div>
          <h1 className="text-24 sm:text-30 font-heading font-bold text-text tracking-tight">Help &amp; Documentation</h1>
          <div className="w-12 h-1 bg-highlight rounded-full mt-2 mb-2.5" aria-hidden="true" />
          <p className="text-xs sm:text-sm text-muted mt-1">
            Frequently asked questions and guides on how each feature functions in GrievDesk.
          </p>
        </div>

        <div className="border-[1.5px] border-border rounded-card bg-surface divide-y divide-border overflow-hidden">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={i}
                className="transition-colors duration-150"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full p-4 text-left flex items-center justify-between gap-3 focus:outline-none hover:bg-surface-2/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-accent">{faq.icon}</span>
                    <span className="font-medium text-text text-sm">{faq.q}</span>
                  </div>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-muted shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted shrink-0" />
                  )}
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 pt-1 text-xs sm:text-sm text-muted leading-relaxed border-t border-border/50 bg-surface-2/40">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
