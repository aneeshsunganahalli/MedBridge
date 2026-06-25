import { useState, useEffect } from 'react';
import PageWrapper from '../../components/Layout/PageWrapper';
import client from '../../api/client';
import { useToast } from '../../components/ui/Toast';

export default function HealthTimelinePage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    client.get('/api/timeline/')
      .then(res => setEvents(res.data))
      .catch(err => {
        console.error('Failed to load timeline:', err);
        toast.error('Failed to load health timeline');
      })
      .finally(() => setLoading(false));
  }, [toast]);

  const getEventIcon = (type, subtype) => {
    if (type === 'appointment') {
      return (
        <div style={{ background: '#e0e7ff', color: '#4338ca', padding: '0.75rem', borderRadius: '50%', boxShadow: '0 4px 10px rgba(67, 56, 202, 0.2)' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </div>
      );
    }
    if (type === 'document') {
      if (subtype === 'prescription') {
        return (
          <div style={{ background: '#dcfce7', color: '#15803d', padding: '0.75rem', borderRadius: '50%', boxShadow: '0 4px 10px rgba(21, 128, 61, 0.2)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.5 20.5 19 12a2.12 2.12 0 0 0-3-3l-8.5 8.5a2 2 0 0 0-1 1.5v3h3a2 2 0 0 0 1.5-1.5z"/><path d="m15 9 3 3"/>
            </svg>
          </div>
        );
      }
      return (
        <div style={{ background: '#f3f4f6', color: '#374151', padding: '0.75rem', borderRadius: '50%', boxShadow: '0 4px 10px rgba(55, 65, 81, 0.2)' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
          </svg>
        </div>
      );
    }
    if (type === 'reminder') {
      return (
        <div style={{ background: '#fef9c3', color: '#a16207', padding: '0.75rem', borderRadius: '50%', boxShadow: '0 4px 10px rgba(161, 98, 7, 0.2)' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <PageWrapper title="Health Timeline">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '2rem' }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton" style={{ height: '100px', borderRadius: '12px', maxWidth: '600px', margin: '0 auto', width: '100%' }}></div>
          ))}
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Health Timeline">
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1rem 0' }}>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '3rem', textAlign: 'center', fontSize: '1.1rem' }}>
          Your unified medical history, automatically updated.
        </p>
        
        {events.length === 0 ? (
          <div className="empty-state">
            <h3 className="empty-state-title">No Timeline Events</h3>
            <p className="empty-state-text">Your timeline will populate automatically when you have appointments, documents, or prescriptions.</p>
          </div>
        ) : (
          <div style={{ position: 'relative' }}>
            <div style={{
              position: 'absolute',
              top: '0',
              bottom: '0',
              left: '32px',
              width: '2px',
              background: 'linear-gradient(to bottom, #e2e8f0 0%, #94a3b8 50%, #e2e8f0 100%)',
              zIndex: 0
            }}></div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {events.map((evt, idx) => {
                const date = new Date(evt.timestamp);
                return (
                  <div key={`${evt.type}-${evt.id}-${idx}`} style={{ display: 'flex', gap: '1.5rem', position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '64px' }}>
                      {getEventIcon(evt.type, evt.subtype)}
                    </div>
                    
                    <div style={{
                      background: 'white',
                      padding: '1.5rem',
                      borderRadius: '16px',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                      flex: 1,
                      border: '1px solid var(--color-border)',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.05)'; }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--color-text-main)' }}>{evt.title}</h3>
                        <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', background: '#f1f5f9', padding: '0.25rem 0.75rem', borderRadius: '12px' }}>
                          {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      
                      {evt.description && (
                        <div style={{ color: 'var(--color-text-muted)', marginBottom: '0.75rem', fontSize: '0.95rem', fontWeight: 500 }}>
                          {evt.description}
                        </div>
                      )}
                      
                      {evt.details && (
                        <div style={{ color: '#475569', fontSize: '0.95rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #cbd5e1' }}>
                          {evt.details}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
