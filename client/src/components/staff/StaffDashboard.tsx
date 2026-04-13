// StaffDashboard — Token queue processing and service management
import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Token, TokenStatus } from '../../types';

export default function StaffDashboard() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadData = async () => {
    try {
      const t = await api.getStaffTokens();
      setTokens(t);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); const i = setInterval(loadData, 8000); return () => clearInterval(i); }, []);

  const handleStart = async (tokenId: number) => {
    setActionLoading(tokenId);
    setError(''); setSuccess('');
    try {
      await api.markTokenInProgress(tokenId);
      setSuccess('Service started successfully!');
      await loadData();
    } catch (e: any) { setError(e.message); }
    finally { setActionLoading(null); }
  };

  const handleComplete = async (tokenId: number) => {
    setActionLoading(tokenId);
    setError(''); setSuccess('');
    try {
      await api.completeService(tokenId);
      setSuccess('Service completed successfully!');
      await loadData();
    } catch (e: any) { setError(e.message); }
    finally { setActionLoading(null); }
  };

  const waitingTokens = tokens.filter(t => t.status === TokenStatus.WAITING);
  const inProgressTokens = tokens.filter(t => t.status === TokenStatus.IN_PROGRESS);

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      WAITING: 'badge-waiting', IN_PROGRESS: 'badge-in-progress',
    };
    return <span className={`badge ${map[status] || ''}`}>{status.replace('_', ' ')}</span>;
  };

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Staff Dashboard</h1>
        <p className="page-subtitle">Manage your assigned tokens and process services</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Stats */}
      <div className="grid-3" style={{ marginBottom: '28px' }}>
        <div className="stat-card">
          <div className="stat-value">{tokens.length}</div>
          <div className="stat-label">Total Active</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--warning)' }}>
            {waitingTokens.length}
          </div>
          <div className="stat-label">Waiting</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--info)' }}>
            {inProgressTokens.length}
          </div>
          <div className="stat-label">In Progress</div>
        </div>
      </div>

      {/* In Progress */}
      {inProgressTokens.length > 0 && (
        <div className="section">
          <h2 className="section-title">Currently Serving</h2>
          <div className="grid-2">
            {inProgressTokens.map(token => (
              <div key={token.id} className="token-card" style={{
                borderColor: 'rgba(8, 145, 178, 0.3)', animation: 'serving-pulse 3s infinite',
              }}>
                <div className="flex-between">
                  <div className="token-number">#{token.token_number}</div>
                  {getStatusBadge(token.status)}
                </div>
                <div className="token-info">
                  <div className="token-info-row">
                    <span className="token-info-label">Customer</span>
                    <span className="token-info-value">
                      {token.customer_first_name} {token.customer_last_name}
                    </span>
                  </div>
                  <div className="token-info-row">
                    <span className="token-info-label">Started</span>
                    <span className="token-info-value">
                      {token.started_at ? new Date(token.started_at).toLocaleTimeString() : '-'}
                    </span>
                  </div>
                </div>
                <button className="btn btn-success" style={{ width: '100%' }}
                  onClick={() => handleComplete(token.id)}
                  disabled={actionLoading === token.id}>
                  {actionLoading === token.id ? 'Completing...' : 'Complete Service'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Waiting Queue */}
      <div className="section">
        <h2 className="section-title">Waiting Queue</h2>
        {waitingTokens.length > 0 ? (
          <div className="grid-2">
            {waitingTokens.map(token => (
              <div key={token.id} className="token-card">
                <div className="flex-between">
                  <div className="token-number">#{token.token_number}</div>
                  {getStatusBadge(token.status)}
                </div>
                <div className="token-info">
                  <div className="token-info-row">
                    <span className="token-info-label">Customer</span>
                    <span className="token-info-value">
                      {token.customer_first_name} {token.customer_last_name}
                    </span>
                  </div>
                  <div className="token-info-row">
                    <span className="token-info-label">Position</span>
                    <span className="token-info-value" style={{ color: 'var(--accent-primary)' }}>
                      #{token.queue_position}
                    </span>
                  </div>
                  <div className="token-info-row">
                    <span className="token-info-label">Est. Wait</span>
                    <span className="token-info-value">{token.estimated_wait_time_minutes} min</span>
                  </div>
                </div>
                <button className="btn btn-warning" style={{ width: '100%' }}
                  onClick={() => handleStart(token.id)}
                  disabled={actionLoading === token.id}>
                  {actionLoading === token.id ? 'Starting...' : 'Start Service'}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">—</div>
            <p className="empty-state-text">No tokens waiting — you're all caught up!</p>
          </div>
        )}
      </div>
    </div>
  );
}
