import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Recuperar from './pages/Recuperar';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile'; 
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AdminPanel from './pages/AdminPanel';
import Library from './pages/Library'; 
import GameDetail from './pages/GameDetail'; 
import About from './pages/About';
import Contact from './pages/Contact'; 
import Privacy from './pages/Privacy';
import Mangas from './pages/Mangas'; 
import MangaDetail from './pages/MangaDetail'; 
import AuthorDetail from './pages/AuthorDetail';
import PublisherDetail from './pages/PublisherDetail'; 
import SharedLibraries from './pages/SharedLibraries';

import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      
      <div className="main-content" style={{ minHeight: '80vh' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} /> 
          
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<AdminPanel />} />

          <Route path="/library" element={<Library />} />

          <Route path="/shared/:libraryId" element={<SharedLibraries />} />

          <Route path="/game/:id" element={<GameDetail />} />

          <Route path="/mangas" element={<Mangas />} />
          <Route path="/mangas/:id" element={<MangaDetail />} />
          <Route path="/authors/:id" element={<AuthorDetail />} />
          
          <Route path="/publishers/:id" element={<PublisherDetail />} />
         
          <Route path="/forgot-password" element={<Recuperar />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<Privacy />} />
          
        </Routes>
      </div>

      <Footer />
    </BrowserRouter>
  );
}

export default App;