import { useEffect, useState } from 'react';
import api from '../../../api/apiClient';

const getErrorMessage = (error) => error.response?.data?.message || error.response?.data?.title || 'The request could not be completed. Please try again.';

function initialForm(fields, record) {
  return fields.reduce((form, field) => {
    const value = record?.[field.name] ?? field.defaultValue ?? (field.type === 'checkbox' ? false : '');
    form[field.name] = field.type === 'date' && value ? String(value).slice(0, 10) : value;
    return form;
  }, {});
}

function unwrapRecords(response) {
  const payload = response.data;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function Field({ field, value, onChange }) {
  const id = `crud-${field.name}`;
  if (field.type === 'checkbox') {
    return <label className="crud-check" htmlFor={id}><input id={id} type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(field.name, event.target.checked)} /> {field.label}</label>;
  }
  return <label className={`crud-field ${field.fullWidth ? 'crud-field-full' : ''}`} htmlFor={id}>
    <span>{field.label}</span>
    {field.type === 'textarea' ? <textarea id={id} required={field.required} value={value ?? ''} onChange={(event) => onChange(field.name, event.target.value)} /> : field.options ? <select id={id} required={field.required} value={value ?? ''} onChange={(event) => onChange(field.name, event.target.value)}><option value="">Select…</option>{field.options.map((option) => <option key={option} value={option}>{option}</option>)}</select> : <input id={id} type={field.type || 'text'} min={field.min} max={field.max} step={field.step} required={field.required} value={value ?? ''} onChange={(event) => onChange(field.name, event.target.value)} />}
  </label>;
}

export default function CrudModule({ config }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(undefined);
  const [form, setForm] = useState(() => initialForm(config.fields));
  const [deleting, setDeleting] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setRecords(unwrapRecords(await api.get(config.endpoint)));
    } catch (requestError) {
      setRecords([]);
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [config]);

  const openCreate = () => {
    setEditing(null);
    setForm(initialForm(config.fields));
    setError('');
  };
  const openEdit = (record) => {
    setEditing(record);
    setForm(initialForm(config.fields, record));
    setError('');
  };
  const updateField = (name, value) => setForm((current) => ({ ...current, [name]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    const payload = config.toPayload(form);
    try {
      if (editing) await api.put(`${config.endpoint}/${editing.id}`, payload);
      else await api.post(config.endpoint, payload);
      setEditing(undefined);
      await load();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setSubmitting(true);
    setError('');
    try {
      await api.delete(`${config.endpoint}/${deleting.id}`);
      setDeleting(null);
      await load();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  };

  const modalOpen = editing !== undefined;
  return <section className="stage-module-wrap" aria-labelledby={`${config.id}-title`}>
    <div className="stage-banner-row"><div><h2 className="stage-title" id={`${config.id}-title`}>{config.title}</h2><p className="stage-subtitle">Manage live {config.plural.toLowerCase()} records.</p></div><div className="crud-actions"><button className="row-action-btn" type="button" onClick={load}>Refresh</button><button className="stage-primary-btn" type="button" onClick={openCreate}>Add {config.singular}</button></div></div>
    {error && <p className="crud-error" role="alert">{error}</p>}
    <div className="ledger-container"><div className="ledger-table-wrap"><table className="crystalline-table" aria-label={`${config.plural} management`}><thead><tr>{config.columns.map((column) => <th key={column.label}>{column.label}</th>)}<th>Actions</th></tr></thead><tbody>
      {loading ? <tr><td colSpan={config.columns.length + 1} className="crud-empty">Loading {config.plural.toLowerCase()}…</td></tr> : records.length === 0 ? <tr><td colSpan={config.columns.length + 1} className="crud-empty">No {config.plural.toLowerCase()} are recorded yet.</td></tr> : records.map((record) => <tr key={record.id}>{config.columns.map((column) => <td key={column.label}>{column.render(record)}</td>)}<td><div className="table-actions-group"><button className="row-btn-edit" type="button" onClick={() => openEdit(record)}>Edit</button><button className="row-btn-delete" type="button" onClick={() => setDeleting(record)}>Delete</button></div></td></tr>)}
    </tbody></table></div></div>

    {modalOpen && <div className="crud-modal-backdrop" role="presentation"><form className="crud-modal" role="dialog" aria-modal="true" aria-label={`${editing ? 'Edit' : 'Create'} ${config.singular}`} onSubmit={submit}><div className="crud-modal-header"><h3>{editing ? `Edit ${config.singular}` : `Create ${config.singular}`}</h3><button className="crud-close" type="button" aria-label="Close form" onClick={() => setEditing(undefined)}>×</button></div><div className="crud-form-grid">{config.fields.map((field) => <Field key={field.name} field={field} value={form[field.name]} onChange={updateField} />)}</div><div className="crud-modal-actions"><button className="row-action-btn" type="button" disabled={submitting} onClick={() => setEditing(undefined)}>Cancel</button><button className="stage-primary-btn" type="submit" disabled={submitting}>{submitting ? 'Saving…' : 'Save changes'}</button></div></form></div>}
    {deleting && <div className="crud-modal-backdrop" role="presentation"><div className="crud-confirm" role="dialog" aria-modal="true" aria-labelledby="delete-title"><h3 id="delete-title">Delete {config.singular}?</h3><p>This action will {config.deleteDescription}.</p><div className="crud-modal-actions"><button className="row-action-btn" type="button" disabled={submitting} onClick={() => setDeleting(null)}>Cancel</button><button className="row-action-btn row-action-danger" type="button" disabled={submitting} onClick={confirmDelete}>{submitting ? 'Deleting…' : 'Delete'}</button></div></div></div>}
  </section>;
}
