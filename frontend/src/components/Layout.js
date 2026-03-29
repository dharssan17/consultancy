import React from 'react';
import { Container, Navbar, Nav, Button } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/authService';
import { LayoutDashboard, Users, ShoppingCart, Factory, Truck, FileText, UserCircle, LogOut, PackagePlus, PackageMinus, Activity } from 'lucide-react';

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = authService.getCurrentUser();

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="d-flex">
      {/* Sidebar */}
      <div
        className="sidebar-wrapper text-white d-flex flex-column"
        style={{
          width: '260px',
          minHeight: '100vh',
          padding: '24px 0',
        }}
      >
        <div className="px-4 mb-5 text-center">
          <h4 className="text-white fw-bold mb-1">Weaving Mill</h4>
          <small className="text-white-50 opacity-75">Management System</small>
        </div>
        
        <Nav className="flex-column px-2 flex-grow-1">
          <Nav.Link
            href="/dashboard"
            className={`sidebar-link ${isActive('/dashboard') ? 'active' : ''}`}
            onClick={(e) => { e.preventDefault(); navigate('/dashboard'); }}
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </Nav.Link>
          
          <Nav.Link
            href="/customers"
            className={`sidebar-link ${isActive('/customers') || isActive('/customers/add') || location.pathname.startsWith('/customers/edit') ? 'active' : ''}`}
            onClick={(e) => { e.preventDefault(); navigate('/customers'); }}
          >
            <Users size={20} />
            <span>Customer Master</span>
          </Nav.Link>
          
          <Nav.Link
            href="/orders"
            className={`sidebar-link ${isActive('/orders') || isActive('/orders/add') || location.pathname.startsWith('/orders/edit') ? 'active' : ''}`}
            onClick={(e) => { e.preventDefault(); navigate('/orders'); }}
          >
            <ShoppingCart size={20} />
            <span>Order Management</span>
          </Nav.Link>
          
          <Nav.Link
            href="/production"
            className={`sidebar-link ${isActive('/production') ? 'active' : ''}`}
            onClick={(e) => { e.preventDefault(); navigate('/production'); }}
          >
            <Factory size={20} />
            <span>Production Management</span>
          </Nav.Link>
          
          <Nav.Link
            href="/delivery"
            className={`sidebar-link ${isActive('/delivery') ? 'active' : ''}`}
            onClick={(e) => { e.preventDefault(); navigate('/delivery'); }}
          >
            <Truck size={20} />
            <span>Delivery Management</span>
          </Nav.Link>
          
          <Nav.Link
            href="/billing"
            className={`sidebar-link ${isActive('/billing') ? 'active' : ''}`}
            onClick={(e) => { e.preventDefault(); navigate('/billing'); }}
          >
            <FileText size={20} />
            <span>Billing / Invoice</span>
          </Nav.Link>

          <h6 className="text-white-50 px-3 mt-4 mb-2 text-uppercase" style={{fontSize: '0.75rem', letterSpacing: '1px'}}>Yarn Management</h6>
          
          <Nav.Link
            href="/yarn-suppliers"
            className={`sidebar-link ${isActive('/yarn-suppliers') ? 'active' : ''}`}
            onClick={(e) => { e.preventDefault(); navigate('/yarn-suppliers'); }}
          >
            <Users size={20} />
            <span>Suppliers Master</span>
          </Nav.Link>
          
          <Nav.Link
            href="/yarn-purchases"
            className={`sidebar-link ${isActive('/yarn-purchases') ? 'active' : ''}`}
            onClick={(e) => { e.preventDefault(); navigate('/yarn-purchases'); }}
          >
            <PackagePlus size={20} />
            <span>Purchases</span>
          </Nav.Link>

          <Nav.Link
            href="/yarn-returns"
            className={`sidebar-link ${isActive('/yarn-returns') ? 'active' : ''}`}
            onClick={(e) => { e.preventDefault(); navigate('/yarn-returns'); }}
          >
            <PackageMinus size={20} />
            <span>Delivery Memo (Ret)</span>
          </Nav.Link>

          <Nav.Link
            href="/yarn-tracking"
            className={`sidebar-link ${isActive('/yarn-tracking') ? 'active' : ''}`}
            onClick={(e) => { e.preventDefault(); navigate('/yarn-tracking'); }}
          >
            <Activity size={20} />
            <span>Tracking Dashboard</span>
          </Nav.Link>
        </Nav>

        <div className="px-3 mt-auto">
          <div className="p-3 bg-white bg-opacity-10 rounded-3 d-flex align-items-center gap-3">
            <UserCircle size={32} className="text-white opacity-75" />
            <div className="overflow-hidden">
              <div className="text-white fw-medium text-truncate">{user?.username}</div>
              <small className="text-white-50 text-uppercase fw-bold" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>{user?.role}</small>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-grow-1 d-flex flex-column vh-100 overflow-hidden">
        {/* Top Navbar */}
        <Navbar expand="lg" className="top-navbar px-4 py-3">
          <Container fluid className="px-0">
            <Navbar.Brand className="fw-bold text-dark-blue m-0 fs-5">
              Welcome back, {user?.username}
            </Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav" className="justify-content-end">
              <Nav className="align-items-center gap-3">
                <Button 
                  variant="outline-danger" 
                  size="sm" 
                  className="d-flex align-items-center gap-2 border-0 px-3 py-2 fw-semibold"
                  style={{ backgroundColor: 'rgba(198, 40, 40, 0.05)' }}
                  onClick={handleLogout}
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </Button>
              </Nav>
            </Navbar.Collapse>
          </Container>
        </Navbar>

        {/* Page Content */}
        <div className="flex-grow-1 overflow-auto p-4 p-md-5 pt-4">
          <Container fluid className="px-0">
            {children}
          </Container>
        </div>
      </div>
    </div>
  );
};

export default Layout;

