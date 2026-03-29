import React, { useState } from 'react'
import './SignUp.css'
import Logo from '../assets/logo.svg'

export default function SignUp({ onSwitch }){
  const [role, setRole] = useState('recruiter')

  return (
    <div className="signup-page">
      <div className="login-card">
        <img src={Logo} alt="logo" className="logo" />
        <h2 className="brand">MatchHire AI</h2>
        <h1>Create Account</h1>
        <p className="subtitle">Start matching in minutes</p>

        <div className="role-row">
          <button className={`role-btn ${role==='recruiter'? 'active':''}`} onClick={()=>setRole('recruiter')}>
            <div className="role-ico">🎁</div>
            <div>Recruiter</div>
          </button>

          <button className={`role-btn ${role==='seeker'? 'active':''}`} onClick={()=>setRole('seeker')}>
            <div className="role-ico">🧭</div>
            <div>Job Seeker</div>
          </button>
        </div>

        <form className="signup-form" onSubmit={(e)=>e.preventDefault()}>
          <label className="field">
            <span className="input-icon" aria-hidden>👤</span>
            <input type="text" placeholder="Full name" required />
          </label>

          <label className="field">
            <span className="input-icon" aria-hidden>✉️</span>
            <input type="email" placeholder="Email address" required />
          </label>

          <label className="field">
            <span className="input-icon" aria-hidden>🔒</span>
            <input type="password" placeholder="Password" required />
          </label>

          <button className="btn-primary" type="submit">Create Account <span className="arrow">→</span></button>
        </form>

        <p className="signup">Already have an account? <a href="#" onClick={(e)=>{e.preventDefault(); onSwitch && onSwitch('login')}}>Sign in</a></p>
      </div>
    </div>
  )
}
