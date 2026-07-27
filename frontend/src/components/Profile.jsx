import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { CaretLeft, User } from '@phosphor-icons/react';

export function Profile({ profile, onUpdateProfile, onBack }) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [indexNumber, setIndexNumber] = useState('');
  const [reference, setReference] = useState('');
  const [year, setYear] = useState('');
  const [gender, setGender] = useState('');

  // Initialize fields with current profile values
  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setEmail(profile.email || '');
      setIndexNumber(profile.indexNumber || '');
      setReference(profile.reference || '');
      setYear(profile.year || '');
      setGender(profile.gender || '');
    }
  }, [profile, isEditing]);

  const handleSave = () => {
    onUpdateProfile({
      ...profile,
      name: name.trim(),
      email: email.trim(),
      indexNumber: indexNumber.trim(),
      reference: reference.trim(),
      year,
      gender
    });
    setIsEditing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {/* Back Button */}
      <button className="back-arrow-btn" onClick={onBack} aria-label="Back" style={{ marginBottom: '16px' }}>
        <CaretLeft size={16} weight="bold" />
      </button>

      <div className="profile-card-container">
        {/* Avatar badge */}
        <div className="profile-avatar-circle">
          <User size={38} weight="bold" style={{ color: 'var(--accent)' }} />
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
          <h2 className="profile-name-text">{profile.name}</h2>
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
          <p className="profile-email-text">{profile.email}</p>
        )}

        {/* Metadata Table */}
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
              <span className="profile-row-value">{profile.indexNumber || '—'}</span>
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
              <span className="profile-row-value">{profile.reference || '—'}</span>
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
              <span className="profile-row-value">{profile.year || '—'}</span>
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
              <span className="profile-row-value">{profile.gender || '—'}</span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="profile-buttons-stack" style={{ width: '100%', marginTop: '24px' }}>
          {isEditing ? (
            <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
              <button className="cohort-btn cohort-btn-primary" onClick={handleSave} style={{ flex: 1, justifyContent: 'center' }}>
                Save Changes
              </button>
              <button className="cohort-btn" onClick={() => setIsEditing(false)} style={{ flex: 1, justifyContent: 'center' }}>
                Cancel
              </button>
            </div>
          ) : (
            <button className="cohort-btn cohort-btn-primary" onClick={() => setIsEditing(true)} style={{ width: '100%', justifyContent: 'center' }}>
              Edit My Info
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
export default Profile;
