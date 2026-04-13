// CustomerDashboard — Queue join, token tracking, and history view
import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Service, Token, TokenStatus } from '../../types';

export default function CustomerDashboard() {
  const [services, setServices] = useState<Service[]>([]);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinLoading, setJoinLoading] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadData = async () => {
    try {
      const [s, t] = await Promise.all([api.getActiveServices(), api.getMyTokens()]);
      setServices(s);
      setTokens(t);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); const i = setInterval(loadData, 10000); return () => clearInterval(i); }, []);

  const handleJoin = async (serviceId: number) => {
    setJoinLoading(serviceId);
    setError('');
    setSuccess('');
    try {
      await api.joinQueue(serviceId);
      setSuccess('Token generated! You are now in the queue.');
      await loadData();
    } catch (e: any) { setError(e.message); }
    finally { setJoinLoading(null); }
  };

  const handleCancel = async (tokenId: number) => {
    setError('');
    try {
      await api.cancelToken(tokenId);
      setSuccess('Token cancelled successfully.');
      await loadData();
    } catch (e: any) { setError(e.message); }
  };

  const activeTokens = tokens.filter(t => t.status === TokenStatus.WAITING || t.status === TokenStatus.IN_PROGRESS);
  const historyTokens = tokens.filter(t => t.status === TokenStatus.COMPLETED || t.status === TokenStatus.CANCELLED);

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      WAITING: 'badge-waiting', IN_PROGRESS: 'badge-in-progress',
      COMPLETED: 'badge-completed', CANCELLED: 'badge-cancelled',
    };
    return <span className={`badge ${map[status] || ''}`}>{status.replace('_', ' ')}</span>;
  };

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Customer Dashboard</h1>
        <p className="page-subtitle">Join a queue and track your token status in real-time</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Active Tokens */}
      {activeTokens.length > 0 && (
        <div className="section">
          <h2 className="section-title">Your Active Tokens</h2>
          <div className="grid-2">
            {activeTokens.map(token => (
              <div key={token.id} className="token-card" style={{ animation: 'fadeIn 0.4s ease' }}>
                <div className="flex-between">
                  <div className="token-number">#{token.token_number}</div>
                  {getStatusBadge(token.status)}
                </div>
                <div className="token-info">
                  <div className="token-info-row">
                    <span className="token-info-label">Service</span>
                    <span className="token-info-value">{token.service_name}</span>
                  </div>
                  <div className="token-info-row">
                    <span className="token-info-label">Position</span>
                    <span className="token-info-value" style={{ color: 'var(--accent-primary)' }}>
                      {token.queue_position}
                    </span>
                  </div>
                  <div className="token-info-row">
                    <span className="token-info-label">Est. Wait</span>
                    <span className="token-info-value">{token.estimated_wait_time_minutes} min</span>
                  </div>
                </div>
                {token.status === TokenStatus.WAITING && (
                  <button className="btn btn-danger btn-sm" style={{ width: '100%' }}
                    onClick={() => handleCancel(token.id)}>
                    Cancel Token
                  </button>
                )}
                {token.status === TokenStatus.IN_PROGRESS && (
                  <div style={{
                    textAlign: 'center', padding: '8px', background: 'var(--info-bg)',
                    borderRadius: 'var(--radius-sm)', color: 'var(--info)', fontSize: '0.85rem', fontWeight: 600,
                  }}>
                    Your service is in progress
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Services */}
      <div className="section">
        <h2 className="section-title">Available Services</h2>
        <div className="grid-3">
          {services.map(service => (
            <div key={service.id} className="card">
              <h3 style={{ marginBottom: '8px' }}>{service.name}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                {service.description || 'No description'}
              </p>
              <div className="token-info-row" style={{ marginBottom: '4px' }}>
                <span className="token-info-label">Duration</span>
                <span className="token-info-value">{service.estimated_duration_minutes} min</span>
              </div>
              <div className="token-info-row" style={{ marginBottom: '16px' }}>
                <span className="token-info-label">Staff</span>
                <span className="token-info-value">
                  {service.staff_first_name ? `${service.staff_first_name} ${service.staff_last_name}` : 'Unassigned'}
                </span>
              </div>
              <button className="btn btn-primary btn-sm" style={{ width: '100%' }}
                onClick={() => handleJoin(service.id)}
                disabled={joinLoading === service.id}>
                {joinLoading === service.id ? 'Joining...' : 'Join Queue'}
              </button>
            </div>
          ))}
        </div>
        {services.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">—</div>
            <p className="empty-state-text">No services available at the moment</p>
          </div>
        )}
      </div>

      {/* Token History */}
      {historyTokens.length > 0 && (
        <div className="section">
          <h2 className="section-title">Queue History</h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Token #</th>
                  <th>Service</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {historyTokens.slice(0, 20).map(token => (
                  <tr key={token.id}>
                    <td style={{ fontWeight: 600 }}>#{token.token_number}</td>
                    <td>{token.service_name}</td>
                    <td>{getStatusBadge(token.status)}</td>
                    <td>{new Date(token.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
