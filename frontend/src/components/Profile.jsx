import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { CaretLeft, User } from '@phosphor-icons/react';

const PROFILE_CACHE_KEY = 'estudy_profile_cache';

export function Profile({ profile, onUpdateProfile, onBack }) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [indexNumber, setIndexNumber] = useState('');
  const [reference, setReference] = useState('');
  const [year, setYear] = useState('');
  const [gender, setGender] = useState('');
  const [saveError, setSaveError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const isInitialMount = useRef(true);

  const getCachedProfile = () => {
    try {
      const raw = localStorage.getItem(PROFILE_CACHE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (err) {
      void err;
    }
    return null;
  };

  const setCachedProfile = (data) => {
    try {
      localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(data));
    } catch (err) {
      void err;
    }
  };

  const getSourceProfile = () => {
    if (profile && (profile.name || profile.email || profile.indexNumber || profile.reference || profile.year || profile.gender)) {
      return profile;
    }
    const cached = getCachedProfile();
    if (cached && (cached.name || cached.email || cached.indexNumber || cached.reference || cached.year || cached.gender)) {
      return cached;
    }
    return profile || cached || {};
  };

  const source = getSourceProfile();

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      if (source && (source.name || source.email)) {
        setName(source.name || '');
        setEmail(source.email || '');
        setIndexNumber(source.indexNumber || '');
        setReference(source.reference || '');
        setYear(source.year || '');
        setGender(source.gender || '');
        return;
      }
    }

    if (profile) {
      setName(profile.name || '');
      setEmail(profile.email || '');
      setIndexNumber(profile.indexNumber || '');
      setReference(profile.reference || '');
      setYear(profile.year || '');
      setGender(profile.gender || '');
    }
  }, [profile, source]);

  const buildUpdatedProfile = () => ({
    ...getSourceProfile(),
    name: name.trim(),
    email: email.trim(),
    indexNumber: indexNumber.trim(),
    reference: reference.trim(),
    year,
    gender
  });

  const handleSave = async () => {
    setSaveError('');
    setIsSaving(true);
    try {
      const updated = buildUpdatedProfile();
      await onUpdateProfile(updated);
      setCachedProfile(updated);
      setIsEditing(false);
    } catch (err) {
      setSaveError(err?.message || 'Failed to save changes');
      const updated = buildUpdatedProfile();
      setCachedProfile(updated);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = () => {
    setSaveError('');
    setIsEditing(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <button className="back-arrow-btn" onClick={onBack} aria-label="Back" style={{ marginBottom: '16px' }}>
        <CaretLeft size={16} weight="bold" />
      </button>

      <div className="profile-card-container">
        <div className="profile-avatar-circle">
          <User size={38} weight="bold" style={{ color: 'var(--brand-blue)' }} />
        </div>
        
        {isEditing ? (
          <div className="form-group" style={{ width: '100%', marginBottom: '12px' }}>
            <label className="form-label" style={{ textAlign: 'center' }}>Full Name</label>
            <input 
              type="text" 
              className="cohort-input" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              style={{ textAlign: 'center', fontSize: '18px', fontWeight: '700' }}
            />
          </div>
        ) : (
          <h2 className="profile-name-text">{source.name || profile.name || ''}</h2>
        )}

        {isEditing ? (
          <div className="form-group" style={{ width: '100%', marginBottom: '24px' }}>
            <label className="form-label" style={{ textAlign: 'center' }}>Email Address</label>
            <input 
              type="email" 
              className="cohort-input" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              style={{ textAlign: 'center', fontSize: '13px' }}
              disabled
            />
          </div>
        ) : (
          <p className="profile-email-text">{source.email || profile.email || ''}</p>
        )}

        <div className="profile-details-table" style={{ width: '100%' }}>
          <div className="profile-table-row">
            <span className="profile-row-label">Index Number</span>
            {isEditing ? (
              <input 
                type="text" 
                className="cohort-input" 
                value={indexNumber} 
                onChange={e => setIndexNumber(e.target.value)} 
                placeholder="e.g. UG-18-5023"
                style={{ width: '180px', padding: '6px 12px', fontSize: '13px' }}
              />
            ) : (
              <span className="profile-row-value">{source.indexNumber || profile.indexNumber || '—'}</span>
            )}
          </div>

          <div className="profile-table-row">
            <span className="profile-row-label">Reference Number</span>
            {isEditing ? (
              <input 
                type="text" 
                className="cohort-input" 
                value={reference} 
                onChange={e => setReference(e.target.value)} 
                placeholder="e.g. REF-238491"
                style={{ width: '180px', padding: '6px 12px', fontSize: '13px' }}
              />
            ) : (
              <span className="profile-row-value">{source.reference || profile.reference || '—'}</span>
            )}
          </div>

          <div className="profile-table-row">
            <span className="profile-row-label">Year of Study</span>
            {isEditing ? (
              <select 
                className="cohort-select" 
                value={year} 
                onChange={e => setYear(e.target.value)}
                style={{ width: '180px', padding: '6px 12px', fontSize: '13px' }}
              >
                <option value="">Select Year...</option>
                <option value="Year 1">Year 1</option>
                <option value="Year 2">Year 2</option>
                <option value="Year 3">Year 3</option>
                <option value="Year 4">Year 4</option>
              </select>
            ) : (
              <span className="profile-row-value">{source.year || profile.year || '—'}</span>
            )}
          </div>

          <div className="profile-table-row" style={{ borderBottom: 'none' }}>
            <span className="profile-row-label">Gender</span>
            {isEditing ? (
              <select 
                className="cohort-select" 
                value={gender} 
                onChange={e => setGender(e.target.value)}
                style={{ width: '180px', padding: '6px 12px', fontSize: '13px' }}
              >
                <option value="">Select Gender...</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="—">—</option>
              </select>
            ) : (
              <span className="profile-row-value">{source.gender || profile.gender || '—'}</span>
            )}
          </div>
        </div>

        {saveError && (
          <div style={{ color: '#EF4444', fontSize: '12px', marginTop: '12px', textAlign: 'center' }}>
            {saveError}
          </div>
        )}

        <div className="profile-buttons-stack" style={{ width: '100%', marginTop: '24px' }}>
          {isEditing ? (
            <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
              <button 
                className="cohort-btn cohort-btn-primary" 
                onClick={handleSave} 
                disabled={isSaving}
                style={{ flex: 1, justifyContent: 'center' }}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
              <button 
                className="cohort-btn" 
                onClick={() => { setIsEditing(false); setSaveError(''); }}
                style={{ flex: 1, justifyContent: 'center', padding: '8px', background: 'transparent', color: 'var(--brand-blue)', border: '2px solid var(--brand-blue)', fontWeight: '700', borderRadius: '8px' }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button className="cohort-btn cohort-btn-primary" onClick={handleEdit} style={{ width: '100%', justifyContent: 'center' }}>
              Edit My Info
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default Profile;
