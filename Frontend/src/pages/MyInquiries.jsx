import { useCallback, useEffect, useState } from 'react';
import { CalendarDays, Mail, MessageSquareText, RefreshCw } from 'lucide-react';
import api from '../api/apiClient';
import './MyInquiries.css';

const statusPresentation = (status) => {
  const normalized = String(status || '').trim().toUpperCase().replaceAll(' ', '_');
  if (normalized === 'RESOLVED') return { label: 'Resolved', className: 'resolved' };
  if (normalized === 'IN_REVIEW' || normalized === 'INREVIEW' || normalized === 'REVIEW') {
    return { label: 'In Review', className: 'in-review' };
  }
  return { label: 'Pending', className: 'pending' };
};

const formatSubmittedDate = (value) => {
  if (!value) return 'Date unavailable';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Date unavailable'
    : new Intl.DateTimeFormat('en-LK', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
};

const getInquiryList = (payload) => {
  const records = Array.isArray(payload) ? payload : payload?.data ?? payload?.items ?? [];
  return Array.isArray(records) ? records : [];
};

const fetchMyInquiries = async () => {
  const response = await api.get('/inquiries/my');
  return getInquiryList(response.data);
};

const errorMessage = (loadError) =>
  loadError.response?.data?.message || 'Unable to load your sent inquiries. Please try again.';

export default function MyInquiries() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadInquiries = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setInquiries(await fetchMyInquiries());
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetchMyInquiries()
      .then((records) => {
        if (active) setInquiries(records);
      })
      .catch((loadError) => {
        if (active) setError(errorMessage(loadError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  return (
    <div className="my-inquiries-viewport">
      <section className="my-inquiries-stage" aria-labelledby="my-inquiries-title">
        <header className="my-inquiries-header">
          <div className="my-inquiries-eyebrow">TRIPORA / CONCIERGE MESSAGES</div>
          <h1 id="my-inquiries-title">Sent Inquiries</h1>
          <p>Review the messages you have sent to our concierge and any updates on their progress.</p>
        </header>

        <div className="my-inquiries-toolbar">
          <span>{loading ? 'Loading inquiries…' : `${inquiries.length} ${inquiries.length === 1 ? 'inquiry' : 'inquiries'}`}</span>
          <button type="button" onClick={() => loadInquiries()} disabled={loading}>
            <RefreshCw size={15} aria-hidden="true" />
            Refresh
          </button>
        </div>

        <div className="my-inquiries-list" aria-live="polite">
          {loading ? (
            Array.from({ length: 3 }, (_, index) => (
              <article className="my-inquiry-skeleton" key={`inquiry-skeleton-${index}`} aria-hidden="true">
                <span /><span /><span /><span />
              </article>
            ))
          ) : error ? (
            <div className="my-inquiries-state" role="alert">
              <Mail size={32} aria-hidden="true" />
              <h2>Inquiries unavailable</h2>
              <p>{error}</p>
              <button type="button" onClick={() => loadInquiries()}>Try again</button>
            </div>
          ) : inquiries.length === 0 ? (
            <div className="my-inquiries-state">
              <Mail size={32} aria-hidden="true" />
              <h2>No inquiries sent yet</h2>
              <p>When you contact our concierge, your messages and their updates will appear here.</p>
            </div>
          ) : inquiries.map((inquiry) => {
            const status = statusPresentation(inquiry.status);
            const response = inquiry.adminResponse || inquiry.conciergeResponse || inquiry.response;
            const subject = inquiry.relatedTourName || inquiry.tourName || inquiry.subject || inquiry.reason || 'Travel inquiry';
            const submittedAt = inquiry.createdAt || inquiry.submittedAt;

            return (
              <article className="my-inquiry-card" key={inquiry.id ?? inquiry.Id}>
                <div className="my-inquiry-card-heading">
                  <div>
                    <span className="my-inquiry-label">SUBJECT</span>
                    <h2>{subject}</h2>
                  </div>
                  <span className={`my-inquiry-status ${status.className}`}>{status.label}</span>
                </div>
                <div className="my-inquiry-date">
                  <CalendarDays size={15} aria-hidden="true" />
                  <time dateTime={submittedAt || undefined}>{formatSubmittedDate(submittedAt)}</time>
                </div>
                <div className="my-inquiry-message">
                  <span className="my-inquiry-label">YOUR MESSAGE</span>
                  <p>{inquiry.message || 'No message provided.'}</p>
                </div>
                {response && (
                  <div className="my-inquiry-response">
                    <span className="my-inquiry-label"><MessageSquareText size={14} aria-hidden="true" /> CONCIERGE RESPONSE</span>
                    <p>{response}</p>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
