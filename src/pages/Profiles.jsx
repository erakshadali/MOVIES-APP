import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useProfile, MAX_PROFILES } from '../context/ProfileContext.jsx'
import './Profiles.css'

export default function Profiles() {
  const { profiles, selectProfile, addProfile, renameProfile, removeProfile } = useProfile()
  const navigate = useNavigate()
  const location = useLocation()

  const [managing, setManaging] = useState(Boolean(location.state?.manage))
  // null = closed, 'new' = adding, otherwise the id of the profile being edited
  const [editing, setEditing] = useState(null)
  const [name, setName] = useState('')

  const editingProfile = profiles.find((p) => p.id === editing)

  function enter(id) {
    selectProfile(id)
    navigate(location.state?.from || '/', { replace: true })
  }

  function openEditor(id) {
    setEditing(id)
    setName(id === 'new' ? '' : profiles.find((p) => p.id === id)?.name || '')
  }

  function handleSave(e) {
    e.preventDefault()
    if (editing === 'new') addProfile(name)
    else renameProfile(editing, name)
    setEditing(null)
  }

  function handleDelete() {
    removeProfile(editing)
    setEditing(null)
  }

  return (
    <main className="profiles-page">
      <h1 className="profiles-title">{managing ? 'Manage Profiles' : 'Who’s watching?'}</h1>

      <ul className="profile-list">
        {profiles.map((p) => (
          <li key={p.id}>
            <button
              className="profile-tile"
              onClick={() => (managing ? openEditor(p.id) : enter(p.id))}
              aria-label={managing ? `Edit profile ${p.name}` : `Watch as ${p.name}`}
            >
              <span className="profile-avatar" style={{ background: p.color }}>
                {p.name[0]?.toUpperCase()}
                {managing && <span className="profile-edit">✎</span>}
              </span>
              <span className="profile-name">{p.name}</span>
            </button>
          </li>
        ))}

        {profiles.length < MAX_PROFILES && (
          <li>
            <button className="profile-tile" onClick={() => openEditor('new')}>
              <span className="profile-avatar profile-add">+</span>
              <span className="profile-name">Add Profile</span>
            </button>
          </li>
        )}
      </ul>

      <button
        className={`btn ${managing ? 'btn-play' : 'btn-outline'} profiles-manage`}
        onClick={() => setManaging((m) => !m)}
      >
        {managing ? 'Done' : 'Manage Profiles'}
      </button>

      {editing && (
        <div className="profile-editor-overlay" onClick={() => setEditing(null)}>
          <form
            className="profile-editor"
            onSubmit={handleSave}
            onClick={(e) => e.stopPropagation()}
          >
            <h2>{editing === 'new' ? 'Add Profile' : 'Edit Profile'}</h2>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
              maxLength={20}
              aria-label="Profile name"
            />
            <div className="profile-editor-actions">
              <button type="submit" className="btn btn-play" disabled={!name.trim()}>
                Save
              </button>
              <button type="button" className="btn btn-outline" onClick={() => setEditing(null)}>
                Cancel
              </button>
              {editing !== 'new' && profiles.length > 1 && (
                <button type="button" className="btn btn-outline" onClick={handleDelete}>
                  Delete Profile
                </button>
              )}
            </div>
            {editingProfile && (
              <p className="profile-editor-note">
                Deleting a profile also deletes its My List and Continue Watching.
              </p>
            )}
          </form>
        </div>
      )}
    </main>
  )
}
