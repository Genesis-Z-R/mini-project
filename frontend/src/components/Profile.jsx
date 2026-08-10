import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { CaretLeft, User, GraduationCap, SignOut, Gear, Moon, Shield, Globe } from '@phosphor-icons/react';
import { DatabaseService } from '../utils/db';

const PROFILE_CACHE_KEY = 'estudy_profile_cache';

export function Profile({ profile, onUpdateProfile, onBack, onSignOut, theme, onToggleTheme }) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [indexNumber, setIndexNumber] = useState('');
  const [reference, setReference] = useState('');
  const [year, setYear] = useState('');
  const [gender, setGender] = useState('');
  const [programmeId, setProgrammeId] = useState('');
  const [programmeName, setProgrammeName] = useState('');
  const [customProgramme, setCustomProgramme] = useState('');
  const [programmesList, setProgrammesList] = useState([]);
  
  const [saveError, setSaveError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const isInitialMount = useRef(true);

  // Settings states for integrated mobile settings panel
  const [settings, setSettings] = useState({
    isDarkMode: theme === 'dark',
    publicResourceDirectoryEnabled: profile?.publicResourceDirectoryEnabled ?? true,
    publicProfileEnabled: profile?.publicProfileEnabled ?? profile?.isPublic ?? true,
    pushNotificationsMaster: profile?.pushNotificationsMaster ?? true
  });

  // Fetch available programmes from DB
  useEffect(() => {
    const fetchProgrammes = async () => {
      try {
        const list = await DatabaseService.getProgrammes();
        setProgrammesList(list || []);
      } catch (err) {
        console.error("Failed to load programmes:", err);
      }
    };
    fetchProgrammes();
  }, []);

  // Hydrate profile fields
  useEffect(() => {
    if (!profile) return;
    if (isEditing) return;

    if (isInitialMount.current) {
      isInitialMount.current = false;
      const cached = localStorage.getItem(PROFILE_CACHE_KEY);
      if (cached) {
        try {
          const c = JSON.parse(cached);
          if (c.email === profile.email) {
            setName(c.name || '');
            setEmail(c.email || '');
            setIndexNumber(c.indexNumber || '');
            setReference(c.reference || '');
            setYear(c.year || '');
            setGender(c.gender || '');
            setProgrammeId(c.programmeId || '');
            setProgrammeName(c.programmeName || '');
            setCustomProgramme(c.customProgramme || '');
            return;
          }
        } catch (_) {}
      }
    }

    setName(profile.name || '');
    setEmail(profile.email || '');
    setIndexNumber(profile.indexNumber || '');
    setReference(profile.reference || '');
    setYear(profile.year || '');
    setGender(profile.gender || '');
    setProgrammeId(profile.programmeId || '');
    setProgrammeName(profile.programmeName || '');
    setCustomProgramme(profile.customProgramme || '');

    setSettings({
      isDarkMode: theme === 'dark',
      publicResourceDirectoryEnabled: profile.publicResourceDirectoryEnabled ?? true,
      publicProfileEnabled: profile.publicProfileEnabled ?? profile.isPublic ?? true,
      pushNotificationsMaster: profile.pushNotificationsMaster ?? true
    });
  }, [profile, isEditing, theme]);

  const handleProgrammeSelectChange = (e) => {
    const val = e.target.value;
    setProgrammeId(val);
    if (val === 'OTHER') {
      setProgrammeName('');
    } else {
      const match = programmesList.find(p => p.id === val);
      if (match) {
        setProgrammeName(match.name);
      }
    }
  };

  const handleEdit = () => {
    setName(profile?.name || '');
    setEmail(profile?.email || '');
    setIndexNumber(profile?.indexNumber || '');
    setReference(profile?.reference || '');
    setYear(profile?.year || '');
    setGender(profile?.gender || '');
    setProgrammeId(profile?.programmeId || '');
    setProgrammeName(profile?.programmeName || '');
    setCustomProgramme(profile?.customProgramme || '');
    setIsEditing(true);
    setSaveError('');
  };

  const handleSave = async () => {
    setSaveError('');
    setIsSaving(true);

    let finalProgName = programmeName;
    if (programmeId === 'OTHER') {
      finalProgName = customProgramme.trim();
      if (!finalProgName) {
        setSaveError('Please enter custom programme name.');
        setIsSaving(false);
        return;
      }
    }

    const updatedData = {
      ...profile,
      name,
      indexNumber,
      reference,
      year,
      gender,
      programmeId: programmeId === 'OTHER' ? null : programmeId,
      programmeName: finalProgName,
      customProgramme: programmeId === 'OTHER' ? finalProgName : ''
    };

    try {
      localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(updatedData));
      await onUpdateProfile(updatedData);
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to update profile:", err);
      setSaveError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSettingToggle = async (key, val) => {
    const updatedSettings = { ...settings, [key]: val };
    setSettings(updatedSettings);

    if (key === 'isDarkMode' && onToggleTheme) {
      if ((val && theme !== 'dark') || (!val && theme === 'dark')) {
        onToggleTheme();
      }
    }

    try {
      await onUpdateProfile({
        ...profile,
        ...updatedSettings,
        isPublic: key === 'publicProfileEnabled' ? val : (profile?.isPublic ?? true)
      });
    } catch (err) {
      console.error('Failed to update settings from profile:', err);
    }
  };

  const source = isEditing ? { name, email, indexNumber, reference, year, gender, programmeName, programmeId } : (profile || {});
  const currentProgDisplay = source.programmeId === 'OTHER' 
    ? (customProgramme || source.programmeName || 'Custom Programme')
    : (source.programmeName || 'Not Set');

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {/* Top Bar with Back Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <button 
          className="back-arrow-btn" 
          onClick={onBack}
          aria-label="Back to Dashboard"
          title="Back to Dashboard"
        >
          <CaretLeft size={16} weight="bold" />
        </button>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>Student Profile</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>
            Manage your personal details, privacy settings, and account session.
          </p>
        </div>
      </div>

      <div className="profile-card-container nm-out" style={{ padding: '32px' }}>
        {/* Profile Avatar Header */}
        <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'var(--accent-soft)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
          <User size={36} weight="bold" />
        </div>

        {isEditing ? (
          <div className="form-group" style={{ width: '100%', marginBottom: '16px' }}>
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

        {/* Profile Details Table */}
        <div className="profile-details-table" style={{ width: '100%' }}>
          {/* Programme of Study */}
          <div className="profile-table-row">
            <span className="profile-row-label">Programme of Study</span>
            {isEditing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', maxWidth: '240px' }}>
                <select 
                  className="cohort-select" 
                  value={programmeId} 
                  onChange={handleProgrammeSelectChange}
                  style={{ width: '100%', padding: '6px 12px', fontSize: '13px' }}
                >
                  <option value="">Select Programme...</option>
                  {programmesList.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                  <option value="OTHER">+ Add Other Programme...</option>
                </select>

                {programmeId === 'OTHER' && (
                  <input 
                    type="text" 
                    className="cohort-input" 
                    placeholder="Enter Programme Name" 
                    value={customProgramme}
                    onChange={e => setCustomProgramme(e.target.value)}
                    style={{ fontSize: '12px', padding: '6px 10px' }}
                  />
                )}
              </div>
            ) : (
              <span className="profile-row-value" style={{ fontWeight: '700', color: 'var(--accent)' }}>
                {currentProgDisplay}
              </span>
            )}
          </div>

          <div className="profile-table-row">
            <span className="profile-row-label">Index Number</span>
            {isEditing ? (
              <input 
                type="text" 
                className="cohort-input" 
                value={indexNumber} 
                onChange={e => setIndexNumber(e.target.value)} 
                style={{ width: '100%', maxWidth: '240px', padding: '6px 12px', fontSize: '13px' }}
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
                style={{ width: '100%', maxWidth: '240px', padding: '6px 12px', fontSize: '13px' }}
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
                style={{ width: '100%', maxWidth: '240px', padding: '6px 12px', fontSize: '13px' }}
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
                style={{ width: '100%', maxWidth: '240px', padding: '6px 12px', fontSize: '13px' }}
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
            <div className="profile-edit-buttons" style={{ display: 'flex', gap: '12px', width: '100%' }}>
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
