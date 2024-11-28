import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';
import Signup from './Signup';
import Home from './Home';
import MinSide from './MinSide';
import NewAuction from './NewAuction';
import LiveAuctions from './LiveAuctions';
import MultiStepForm from './MultiStepForm';
import AuctionList from './AuctionList';
import AuctionDetail from './AuctionDetail';
import AdminLogin from './AdminLogin';
import AdminCreateAuction from './AdminCreateAuction';
import AdminDashboard from './AdminDashboard';
import EditAuction from './EditAuction'; 
import EditLiveAuction from './EditLiveAuction'; 
import CreateLiveAuction from './CreateLiveAuction'; 
import PostedAuction from './PostedAuction'; 
import Account from './Account';
import MyAuctions from './MyAuctions';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';
import { isAuthenticated } from './auth'; // Oppdater denne funksjonen til å returnere brukerens rolle
import SearchResults from './SearchResults';
import InfoPage from './InfoPage';
import Step1MC from './Step1MC';

// Private route for authenticated users
const PrivateRoute = ({ children }) => {
  const user = isAuthenticated();
  return user ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children }) => {
  const user = isAuthenticated();
  return user && user.role === 'admin' ? children : <Navigate to="/" />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/home" element={<Home />} />
        <Route path="/minside" element={<PrivateRoute><MinSide /></PrivateRoute>} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/info" element={<InfoPage />} />

        {/* LiveAuctions for hver kategori */}
        <Route path="/kategori/bil" element={<LiveAuctions />} />
        <Route path="/kategori/bat" element={<LiveAuctions />} />
        <Route path="/kategori/mc" element={<LiveAuctions />} />
        <Route path="/kategori/torg" element={<LiveAuctions />} />
        
        <Route path="/nyauksjon" element={<PrivateRoute><NewAuction /></PrivateRoute>} />
        <Route path="/bilform" element={<PrivateRoute><MultiStepForm /></PrivateRoute>} />
        <Route path="/mcform" element={<PrivateRoute><Step1MC /></PrivateRoute>} />
        <Route path="/auctions" element={<AuctionList />} />
        <Route path="/auction/:id" element={<AuctionDetail />} />
        <Route path="/liveauctions/:id" element={<PostedAuction />} />
        <Route path="/auction/bid/:id" element={<PostedAuction />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/create-auction" element={<AdminRoute><AdminCreateAuction /></AdminRoute>} />
        <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/edit-auction/:id" element={<AdminRoute><EditAuction /></AdminRoute>} /> 
        <Route path="/admin/edit-liveauction/:id" element={<AdminRoute><EditLiveAuction /></AdminRoute>} /> 
        <Route path="/admin/create-liveauction/:id" element={<AdminRoute><CreateLiveAuction /></AdminRoute>} /> 
        <Route path="/account" element={<PrivateRoute><Account /></PrivateRoute>} />
        <Route path="/myauctions" element={<PrivateRoute><MyAuctions /></PrivateRoute>} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
