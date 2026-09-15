import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Pin, 
  Trash2, 
  Edit3, 
  X, 
  FileText, 
  Check, 
  Clock, 
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { 
  fetchNotesApi, 
  createNoteApi, 
  updateNoteApi, 
  deleteNoteApi 
} from '../../services/notes';
import type { Note, NoteColor } from '../../services/notes';

const COLOR_OPTIONS: { key: NoteColor; label: string; border: string; bg: string }[] = [
  { key: 'default', label: 'Obsidian', border: 'rgba(255, 255, 255, 0.12)', bg: 'rgba(22, 29, 47, 0.7)' },
  { key: 'indigo', label: 'Indigo', border: 'rgba(99, 102, 241, 0.4)', bg: 'rgba(79, 70, 229, 0.12)' },
  { key: 'emerald', label: 'Emerald', border: 'rgba(16, 185, 129, 0.4)', bg: 'rgba(16, 185, 129, 0.12)' },
  { key: 'amber', label: 'Amber', border: 'rgba(245, 158, 11, 0.4)', bg: 'rgba(245, 158, 11, 0.12)' },
  { key: 'rose', label: 'Rose', border: 'rgba(244, 63, 94, 0.4)', bg: 'rgba(244, 63, 94, 0.12)' },
  { key: 'cyan', label: 'Cyan', border: 'rgba(6, 182, 212, 0.4)', bg: 'rgba(6, 182, 212, 0.12)' },
];

export const NotesSection: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>('');
  
  // Modal form states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [formTitle, setFormTitle] = useState<string>('');
  const [formContent, setFormContent] = useState<string>('');
  const [formPinned, setFormPinned] = useState<boolean>(false);
  const [formColor, setFormColor] = useState<NoteColor>('default');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const loadNotes = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchNotesApi();
      setNotes(data);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message || 'Failed to fetch personal notes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, []);

  const openCreateModal = () => {
    setEditingNote(null);
    setFormTitle('');
    setFormContent('');
    setFormPinned(false);
    setFormColor('default');
    setIsModalOpen(true);
  };

  const openEditModal = (note: Note) => {
    setEditingNote(note);
    setFormTitle(note.title);
    setFormContent(note.content);
    setFormPinned(note.is_pinned);
    setFormColor(note.color);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingNote(null);
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) return;

    setIsSubmitting(true);
    try {
      if (editingNote) {
        const updated = await updateNoteApi(editingNote.id, {
          title: formTitle,
          content: formContent,
          is_pinned: formPinned,
          color: formColor,
        });
        setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
      } else {
        const created = await createNoteApi({
          title: formTitle,
          content: formContent,
          is_pinned: formPinned,
          color: formColor,
        });
        setNotes((prev) => [created, ...prev]);
      }
      closeModal();
    } catch (err: unknown) {
      const e = err as { message?: string };
      alert(e?.message || 'Failed to save note');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePin = async (note: Note) => {
    try {
      const updated = await updateNoteApi(note.id, { is_pinned: !note.is_pinned });
      setNotes((prev) =>
        prev
          .map((n) => (n.id === updated.id ? updated : n))
          .sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0))
      );
    } catch {
      alert('Failed to update pin state');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;

    try {
      await deleteNoteApi(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch {
      alert('Failed to delete note');
    }
  };

  const filteredNotes = notes.filter((n) => {
    const q = search.toLowerCase();
    return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
  });

  const pinnedNotes = filteredNotes.filter((n) => n.is_pinned);
  const otherNotes = filteredNotes.filter((n) => !n.is_pinned);

  const getColorConfig = (color: NoteColor) => {
    return COLOR_OPTIONS.find((c) => c.key === color) || COLOR_OPTIONS[0];
  };

  return (
    <section className="notes-container">
      {/* Header & Controls */}
      <div className="notes-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h2 className="section-title">Personal Notes</h2>
            <span className="badge badge-success" style={{ gap: '0.3rem' }}>
              <ShieldCheck size={12} /> IDOR Protected
            </span>
          </div>
          <p className="section-desc">Isolated to your user account via Eloquent relationship scoping and policies.</p>
        </div>

        <div className="notes-actions">
          <div className="input-with-icon" style={{ minWidth: '240px' }}>
            <Search size={16} className="input-icon" />
            <input
              type="text"
              className="form-input"
              placeholder="Search personal notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ padding: '0.55rem 0.75rem 0.55rem 2.3rem', fontSize: '0.88rem' }}
            />
          </div>

          <button className="btn btn-primary" onClick={openCreateModal}>
            <Plus size={16} /> New Note
          </button>
        </div>
      </div>

      {error && (
        <div className="auth-error-alert" style={{ marginBottom: '1.5rem' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Loading your personal notes...
        </div>
      ) : notes.length === 0 ? (
        <div className="card notes-empty-state">
          <FileText size={48} color="var(--primary-light)" style={{ opacity: 0.7 }} />
          <h3>No notes created yet</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '400px' }}>
            Capture your ideas, documentation, or sensitive reminders. Every entry is isolated and authorized strictly to your account.
          </p>
          <button className="btn btn-primary" onClick={openCreateModal}>
            <Plus size={16} /> Create First Note
          </button>
        </div>
      ) : (
        <div className="notes-layout">
          {/* Pinned Notes Section */}
          {pinnedNotes.length > 0 && (
            <div className="notes-group">
              <div className="notes-group-title">
                <Pin size={14} color="#818cf8" />
                <span>PINNED NOTES ({pinnedNotes.length})</span>
              </div>
              <div className="notes-grid">
                {pinnedNotes.map((note) => renderNoteCard(note))}
              </div>
            </div>
          )}

          {/* Other Notes Section */}
          {otherNotes.length > 0 && (
            <div className="notes-group">
              {pinnedNotes.length > 0 && (
                <div className="notes-group-title">
                  <span>ALL NOTES ({otherNotes.length})</span>
                </div>
              )}
              <div className="notes-grid">
                {otherNotes.map((note) => renderNoteCard(note))}
              </div>
            </div>
          )}

          {filteredNotes.length === 0 && search && (
            <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
              No notes match "{search}".
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Note Modal */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <div className="modal-title-group">
                <div className="modal-badge-icon">
                  <FileText size={20} />
                </div>
                <div>
                  <h2 className="modal-title">{editingNote ? 'Edit Note' : 'Create Personal Note'}</h2>
                  <p className="modal-subtitle">Automatically associated with your user ID.</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={closeModal}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveNote} className="auth-form">
              <div className="form-group">
                <label className="form-label">Note Title</label>
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '1rem' }}
                  placeholder="e.g. Project Architecture Thoughts"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Content</label>
                <textarea
                  className="form-input"
                  style={{ padding: '0.8rem', minHeight: '130px', resize: 'vertical' }}
                  placeholder="Write your note content here..."
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  required
                />
              </div>

              {/* Color Selection Chips */}
              <div className="form-group">
                <label className="form-label">Color Theme</label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => setFormColor(c.key)}
                      style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        border: `1px solid ${c.border}`,
                        background: formColor === c.key ? c.bg : 'rgba(255, 255, 255, 0.03)',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      {formColor === c.key && <Check size={12} />}
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pin Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.25rem' }}>
                <input
                  id="pin-checkbox"
                  type="checkbox"
                  checked={formPinned}
                  onChange={(e) => setFormPinned(e.target.checked)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#4f46e5' }}
                />
                <label htmlFor="pin-checkbox" style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  Pin this note to the top of the dashboard
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : editingNote ? 'Save Changes' : 'Create Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );

  function renderNoteCard(note: Note) {
    const colorCfg = getColorConfig(note.color);

    return (
      <div 
        key={note.id} 
        className="card note-card"
        style={{
          borderColor: colorCfg.border,
          background: colorCfg.bg,
        }}
      >
        <div className="note-card-header">
          <h3 className="note-card-title">{note.title}</h3>
          <div className="note-card-actions">
            <button 
              className={`note-action-btn ${note.is_pinned ? 'pinned' : ''}`} 
              onClick={() => handleTogglePin(note)}
              title={note.is_pinned ? 'Unpin note' : 'Pin note to top'}
            >
              <Pin size={15} />
            </button>
            <button 
              className="note-action-btn" 
              onClick={() => openEditModal(note)}
              title="Edit note"
            >
              <Edit3 size={15} />
            </button>
            <button 
              className="note-action-btn delete" 
              onClick={() => handleDelete(note.id)}
              title="Delete note"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        <p className="note-card-content">{note.content}</p>

        <div className="note-card-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <Clock size={12} />
            <span>{new Date(note.updated_at).toLocaleDateString()}</span>
          </div>

          <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            #{note.id}
          </span>
        </div>
      </div>
    );
  }
};
