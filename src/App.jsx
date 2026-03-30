import React, { useEffect, useState } from 'react'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import Dashboard from './pages/Dashboard'

export default function App(){
  const [page, setPage] = useState('login')

  useEffect(()=>{
    const logged = localStorage.getItem('isLoggedIn') === 'true'
    setPage(logged ? 'dashboard' : 'login')
  }, [])

  function switchPage(p){
    if(p === 'logout'){
      localStorage.removeItem('isLoggedIn')
      setPage('login')
      return
    }
    setPage(p)
  }

  if(page === 'login') return <Login onSwitch={switchPage} />
  if(page === 'signup') return <SignUp onSwitch={switchPage} />
  return <Dashboard onSwitch={switchPage} />
}
