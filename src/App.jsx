import { useEffect } from 'react';
import AuthModal from './components/AuthModal.jsx';
import ClaimSuccessModal from './components/ClaimSuccessModal.jsx';
import WelcomeModal from './components/WelcomeModal.jsx';
import Header from './components/Header.jsx';
import HomeView from './components/HomeView.jsx';
import InfoView from './components/InfoView.jsx';
import GiftView from './components/GiftView.jsx';
import DepositView from './components/DepositView.jsx';
import WithdrawView from './components/WithdrawView.jsx';
import ShopView from './components/ShopView.jsx';
import OrdersView from './components/OrdersView.jsx';
import ProfileView from './components/ProfileView.jsx';
import ChangepassView from './components/ChangepassView.jsx';
import TransactionsView from './components/TransactionsView.jsx';
import BankcardView from './components/BankcardView.jsx';
import TasksView from './components/TasksView.jsx';
import TeamSalaryView from './components/TeamSalaryView.jsx';
import InviteView from './components/InviteView.jsx';
import TeamView from './components/TeamView.jsx';
import BottomNav from './components/BottomNav.jsx';
import FloatingCsBtn from './components/FloatingCsBtn.jsx';
import LangModal from './components/LangModal.jsx';
import Toast from './components/Toast.jsx';

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.async = false;
    s.onload = resolve;
    s.onerror = () => reject(new Error('Failed to load ' + src));
    document.body.appendChild(s);
  });
}

export default function App() {
  // The application logic (database client, auth, plans, deposits, etc.)
  // lives in /app-logic.js. The admin panel is a separate project (agrochem-admin). It looks elements up by id, so it must
  // run only after React has rendered the markup below.
  useEffect(() => {
    if (window.__agroLogicLoaded) return;
    window.__agroLogicLoaded = true;
    loadScript('/app-logic.js').then(() => {
      // window.onload already fired before this script was added, so run it manually.
      if (document.readyState === 'complete' && typeof window.onload === 'function') {
        window.onload();
      }
    }).catch((err) => console.error(err));
  }, []);

  return (
    <>
      <AuthModal />
      <ClaimSuccessModal />
      {/* Welcome popup: shown after login / registration */}
      <WelcomeModal />
      <div id="app" style={{ display: "none" }}>
        <Header />
        <HomeView />
        <InfoView />
        <GiftView />
        <DepositView />
        <WithdrawView />
        <ShopView />
        <OrdersView />
        <ProfileView />
        <ChangepassView />
        <TransactionsView />
        <BankcardView />
        <TasksView />
        <TeamSalaryView />
        <InviteView />
        <TeamView />
        <BottomNav />
        <FloatingCsBtn />
      </div>
      <LangModal />
      <Toast />
    </>
  );
}
