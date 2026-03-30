import React, { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import './Dashboard.css'

export default function Dashboard({ onSwitch }){
  const [page, setPage] = useState('dashboard')
  const [menuOpen, setMenuOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(()=>{
    function onResize(){
      const mobile = window.innerWidth < 900
      setIsMobile(mobile)
      // Only force closed on mobile initially, don't force open/closed during toggle
    }

    onResize()
    window.addEventListener('resize', onResize)
    return ()=> window.removeEventListener('resize', onResize)
  }, []) // Remove menuOpen from dependency array

  function handleNav(k){
    if(k === 'dashboard') setPage('dashboard')
    else setPage(k)
  }

  function handleSignOut(){
    onSwitch && onSwitch('logout')
  }

  return (
    <div className={`app-shell ${menuOpen ? 'menu-open' : 'menu-closed'} ${isMobile ? 'mobile' : 'desktop'}`}>
      <button className="shell-hamburger" onClick={()=>setMenuOpen(v=>!v)} aria-label="Toggle menu">
        <span className="hb-line" />
        <span className="hb-line" />
        <span className="hb-line" />
      </button>

      <Sidebar
        onNavigate={handleNav}
        onSignOut={handleSignOut}
        open={menuOpen}
        isMobile={isMobile}
        onClose={()=>setMenuOpen(false)}
      />

      <main className="app-main">
        <div className="content-card">
          <h2>{page === 'dashboard' ? 'Dashboard' : page.replace(/^[a-z]/, s => s.toUpperCase())}</h2>
          <p>This page is under creation.</p>
        </div>
      </main>
    </div>
  )
}
