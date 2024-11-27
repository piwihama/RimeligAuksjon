import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';
import Signup from './Signup';
import Home from './Home';
import MinSide from './MinSide';
import NewAuction from './NewAuction';
import LiveAuctions from './LiveAuctions'; // Bruk LiveAuctions for alle kategorier
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
import { isAuthenticated } from './auth';
import SearchResults from './SearchResults';
import InfoPage from './InfoPage';
import Step1MC from './Step1MC';

const PrivateRoute = ({ children }) => {
  return isAuthenticated() ? children : <Navigate to="/" />;
};

const AuthRoute = ({ children }) => {
  return isAuthenticated() ? <Navigate to="/home" /> : children;
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
        <Route path="/liveauctions/:id" element={<PostedAuction />} /> {/* New Route */}
        <Route path="/auction/bid/:id" element={<PostedAuction />} /> {/* Ny rute */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/create-auction" element={<PrivateRoute><AdminCreateAuction /></PrivateRoute>} />
        <Route path="/admin/dashboard" element={<PrivateRoute><AdminDashboard /></PrivateRoute>} />
        <Route path="/admin/edit-auction/:id" element={<PrivateRoute><EditAuction /></PrivateRoute>} /> 
        <Route path="/admin/edit-liveauction/:id" element={<PrivateRoute><EditLiveAuction /></PrivateRoute>} /> 
        <Route path="/admin/create-liveauction/:id" element={<PrivateRoute><CreateLiveAuction /></PrivateRoute>} /> 
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
