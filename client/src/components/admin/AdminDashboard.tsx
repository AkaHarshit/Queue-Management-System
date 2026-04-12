import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { DashboardStats, Service, User, QueueInfo } from '../../types';

type Tab = 'overview' | 'services' | 'users' | 'queues';

export default function AdminDashboard() {
  const [tab, setTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [queues, setQueues] = useState<QueueInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Service form
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [serviceForm, setServiceForm] = useState({ name: '', description: '', estimatedDurationMinutes: 30 });

  const loadData = async () => {
    try {
      const [s, svc, u, q] = await Promise.all([
        api.getDashboardStats(),
        api.getServices(),
        api.getUsers(),
        api.getAllQueues(),
      ]);
      setStats(s); setServices(svc); setUsers(u); setQueues(q);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); const i = setInterval(loadData, 15000); return () => clearInterval(i); }, []);

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      await api.createService(serviceForm);
      setSuccess('Service created!');
      setShowServiceModal(false);
      setServiceForm({ name: '', description: '', estimatedDurationMinutes: 30 });
      await loadData();
    } catch (e: any) { setError(e.message); }
  };

  const handleDeleteService = async (id: number) => {
    if (!confirm('Delete this service?')) return;
    try {
      await api.deleteService(id);
      setSuccess('Service deleted.');
      await loadData();
    } catch (e: any) { setError(e.message); }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm('Delete this user?')) return;
    try {
      await api.deleteUser(id);
      setSuccess('User deleted.');
      await loadData();
    } catch (e: any) { setError(e.message); }
  };

  const handleToggleService = async (service: Service) => {
    try {
      await api.updateService(service.id, { isActive: !service.is_active } as any);
      await loadData();
    } catch (e: any) { setError(e.message); }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'services', label: 'Services' },
    { key: 'users', label: 'Users' },
    { key: 'queues', label: 'Queue Monitor' },
  ];

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Admin Dashboard</h1>
        <p className="page-subtitle">System overview, manage services, users, and monitor queues</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '28px', overflowX: 'auto' }}>
        {tabs.map(t => (
          <button key={t.key}
            className={`btn ${tab === t.key ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && stats && (
        <>
          <div className="grid-4" style={{ marginBottom: '28px' }}>
            <div className="stat-card">
              <div className="stat-value">{stats.today.totalTokens}</div>
              <div className="stat-label">Tokens Today</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: 'var(--warning)' }}>
                {stats.today.waiting}
              </div>
              <div className="stat-label">Waiting</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: 'var(--info)' }}>
                {stats.today.inProgress}
              </div>
              <div className="stat-label">In Progress</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: 'var(--success)' }}>
                {stats.today.completed}
              </div>
              <div className="stat-label">Completed</div>
            </div>
          </div>

          <div className="grid-3" style={{ marginBottom: '28px' }}>
            <div className="stat-card">
              <div className="stat-value">{stats.activeQueues}</div>
              <div className="stat-label">Active Queue Tokens</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.today.avgWaitTime} min</div>
              <div className="stat-label">Avg Wait Time</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.today.avgServiceTime} min</div>
              <div className="stat-label">Avg Service Time</div>
            </div>
          </div>

          {/* Queue Summary */}
          <div className="section">
            <h2 className="section-title">Queue Summary</h2>
            <div className="grid-3">
              {stats.queues.map(q => (
                <div key={q.serviceId} className="card">
                  <h3 style={{ marginBottom: '12px' }}>{q.serviceName}</h3>
                  <div className="token-info-row">
                    <span className="token-info-label">Active Tokens</span>
                    <span className="token-info-value" style={{
                      color: q.activeTokens > 0 ? 'var(--warning)' : 'var(--success)',
                      fontWeight: 700, fontSize: '1.1rem',
                    }}>{q.activeTokens}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Services Tab */}
      {tab === 'services' && (
        <div className="section">
          <div className="flex-between" style={{ marginBottom: '20px' }}>
            <h2 className="section-title" style={{ margin: 0 }}>Services</h2>
            <button className="btn btn-primary" onClick={() => setShowServiceModal(true)}>
              + Add Service
            </button>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Duration</th>
                  <th>Staff</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {services.map(s => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.name}</td>
                    <td>{s.estimated_duration_minutes} min</td>
                    <td>{s.staff_first_name ? `${s.staff_first_name} ${s.staff_last_name}` : '—'}</td>
                    <td>
                      <span className={`badge ${s.is_active ? 'badge-completed' : 'badge-cancelled'}`}>
                        {s.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-secondary btn-sm"
                        onClick={() => handleToggleService(s)}>
                        {s.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteService(s.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {tab === 'users' && (
        <div className="section">
          <h2 className="section-title">Users ({users.length})</h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {u.first_name} {u.last_name}
                    </td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`badge ${
                        u.role === 'ADMIN' ? 'badge-in-progress' :
                        u.role === 'STAFF' ? 'badge-waiting' : 'badge-completed'
                      }`}>{u.role}</span>
                    </td>
                    <td>{new Date(u.created_at).toLocaleDateString()}</td>
                    <td>
                      {u.role !== 'ADMIN' && (
                        <button className="btn btn-danger btn-sm"
                          onClick={() => handleDeleteUser(u.id)}>
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Queues Tab */}
      {tab === 'queues' && (
        <div className="section">
          <h2 className="section-title">Live Queue Monitor</h2>
          {queues.length > 0 ? queues.map(q => (
            <div key={q.id} className="card" style={{ marginBottom: '16px' }}>
              <div className="flex-between" style={{ marginBottom: '16px' }}>
                <h3>{q.service_name}</h3>
                <span className="badge badge-waiting">{q.activeTokens} active</span>
              </div>
              {q.tokens.length > 0 ? (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Token #</th>
                        <th>Customer</th>
                        <th>Position</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {q.tokens.map((t: any) => (
                        <tr key={t.id}>
                          <td style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>
                            #{t.token_number}
                          </td>
                          <td>{t.customer_first_name} {t.customer_last_name}</td>
                          <td>{t.position_in_queue + 1}</td>
                          <td>
                            <span className={`badge ${
                              t.status === 'WAITING' ? 'badge-waiting' : 'badge-in-progress'
                            }`}>{t.status.replace('_', ' ')}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No active tokens</p>
              )}
            </div>
          )) : (
            <div className="empty-state">
              <div className="empty-state-icon">—</div>
              <p className="empty-state-text">No active queues</p>
            </div>
          )}
        </div>
      )}

      {/* Create Service Modal */}
      {showServiceModal && (
        <div className="modal-overlay" onClick={() => setShowServiceModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Create New Service</h2>
            <form onSubmit={handleCreateService}>
              <div className="form-group">
                <label className="form-label">Service Name</label>
                <input className="form-input" required placeholder="e.g. Haircut"
                  value={serviceForm.name}
                  onChange={e => setServiceForm({ ...serviceForm, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input className="form-input" placeholder="Brief description"
                  value={serviceForm.description}
                  onChange={e => setServiceForm({ ...serviceForm, description: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Estimated Duration (minutes)</label>
                <input className="form-input" type="number" min="1" required
                  value={serviceForm.estimatedDurationMinutes}
                  onChange={e => setServiceForm({ ...serviceForm, estimatedDurationMinutes: parseInt(e.target.value) })} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowServiceModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">Create Service</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
