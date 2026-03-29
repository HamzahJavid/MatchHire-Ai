import React, { useState } from 'react'
import Login from './pages/Login'
import SignUp from './pages/SignUp'

export default function App(){
  const [page, setPage] = useState('login')

  function switchPage(p){
    setPage(p)
  }

  return page === 'login' ? <Login onSwitch={switchPage} /> : <SignUp onSwitch={switchPage} />
}
