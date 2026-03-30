import React from 'react'
import './Sidebar.css'

export default function Sidebar({ onNavigate, onSignOut, open, isMobile, onClose }){

  const links = [
    { key: 'dashboard', label: 'Dashboard', icon: '▦' },
    { key: 'profile', label: 'My Profile', icon: '👤' },
    { key: 'swipe', label: 'Swipe Jobs', icon: '🔁' },
    { key: 'matches', label: 'Matches', icon: '💬' },
    { key: 'ai', label: 'AI Practice', icon: '🧠' },
  ]

  function handleLink(k){
    onNavigate && onNavigate(k)
    if(isMobile) onClose && onClose()
  }

  return (
    <>
      <div className={`sidebar ${open? 'open':'closed'} ${isMobile ? 'mobile' : 'desktop'}`} aria-hidden={isMobile && !open}>
        <div className="sb-top">
          <div className="sb-brand">MatchHire AI</div>
          {open && (
            <button className="sb-close-btn" onClick={onClose} aria-label="Close menu">✕</button>
          )}
        </div>

        <nav className="sb-nav">
          <div className="sb-role">JOB SEEKER</div>
          {links.map(l=> (
            <button key={l.key} className="sb-link" onClick={()=>handleLink(l.key)}>
              <span className="sb-ico">{l.icon}</span>
              <span className="sb-label">{l.label}</span>
            </button>
          ))}
        </nav>

        <div className="sb-bottom">
          <button className="sb-bottom-link" onClick={()=>onNavigate && onNavigate('settings')}>
            <span className="sb-ico">⚙️</span>
            <span className="sb-label">Settings</span>
          </button>

          <button className="sb-bottom-link" onClick={()=>{localStorage.removeItem('isLoggedIn'); onSignOut && onSignOut()}}>
            <span className="sb-ico">↩️</span>
            <span className="sb-label">Sign Out</span>
          </button>
        </div>
      </div>

      {isMobile && open && <div className="sb-backdrop" onClick={onClose} />}
    </>
  )
}
