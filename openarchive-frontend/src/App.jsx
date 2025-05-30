import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import MainContent from './components/MainContent';
import LoginPage from './pages/LoginPage';
// import { ROLES } from './utils/constants'; // ROLES is used indirectly via LoginPage and MainContent

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('login');

  const handleLogin = (role) => {
    setCurrentUser({ name: `Demo ${role}`, role: role });
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentPage('login');
  };

  if (currentPage === 'login' || !currentUser) { // Ensure currentUser is set before showing main app
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      <Sidebar role={currentUser.role} setCurrentPage={setCurrentPage} currentPage={currentPage} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={currentUser} onLogout={handleLogout} />
        <MainContent page={currentPage} role={currentUser.role} setCurrentPage={setCurrentPage} />
      </div>
    </div>
  );
}

export default App;