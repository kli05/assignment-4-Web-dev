import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import SideMenu from "./components/SideMenu";
import AdminGuard from "./components/AdminGuard";
import SignInPage from "./pages/SignInPage";
import OverviewPage from "./pages/OverviewPage";
import CatalogPage from "./pages/CatalogPage";
import LedgerPage from "./pages/LedgerPage";
import AccountsPage from "./pages/AccountsPage";
import MyShelfPage from "./pages/MyShelfPage";
import LoansPage from "./pages/LoansPage";
import MissingPage from "./pages/MissingPage";
import SessionContext from "./SessionContext";
import { restoreSession, rememberSession, forgetSession } from "./serverApi";

function App() {
  const [activeUser, setActiveUser] = useState(null);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(function () {
    async function verifySession() {
      const storedUser = await restoreSession();
      if (storedUser !== null) {
        setActiveUser(storedUser);
      }
      setSessionReady(true);
    }
    verifySession();
  }, []);

  function handleSignedIn(user) {
    rememberSession(user.id);
    setActiveUser(user);
  }

  function handleSignOut() {
    forgetSession();
    setActiveUser(null);
  }

  function handleActiveUserChange(updatedUser) {
    setActiveUser(updatedUser);
  }
  if (sessionReady === false) {
    return null;
  }
  if (activeUser === null) {
    return (
      <Routes>
        <Route path="/sign-in" element={<SignInPage onSignedIn={handleSignedIn} />} />
        <Route path="*" element={<Navigate to="/sign-in" replace />} />
      </Routes>
    );
  }

  return (
    <SessionContext.Provider value={activeUser}>
      <div className="shell">
        <SideMenu activeUser={activeUser} onSignOut={handleSignOut} />

        <main className="stage">
          <Routes>
            <Route path="/" element={<OverviewPage activeUser={activeUser} />} />
            <Route path="/sign-in" element={<Navigate to="/" replace />} />
            <Route path="/my-books" element={<MyShelfPage activeUser={activeUser} />} />
            <Route
              path="/books"
              element={
                <AdminGuard activeUser={activeUser}>
                  <CatalogPage activeUser={activeUser} />
                </AdminGuard>
              }
            />
            <Route
              path="/records"
              element={
                <AdminGuard activeUser={activeUser}>
                  <LoansPage activeUser={activeUser} />
                </AdminGuard>
              }
            />
            <Route
              path="/transactions"
              element={
                <AdminGuard activeUser={activeUser}>
                  <LedgerPage activeUser={activeUser} />
                </AdminGuard>
              }
            />
            <Route
              path="/users"
              element={
                <AdminGuard activeUser={activeUser}>
                  <AccountsPage activeUser={activeUser} onActiveUserChange={handleActiveUserChange} />
                </AdminGuard>
              }
            />
            <Route path="*" element={<MissingPage />} />
          </Routes>
        </main>
      </div>
    </SessionContext.Provider>
  );
}

export default App;
