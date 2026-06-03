import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CustomerList from './pages/CustomerList';
import AddCustomer from './pages/AddCustomer';
import EditCustomer from './pages/EditCustomer';
import OrderList from './pages/OrderList';
import Production from './pages/Production';
import Delivery from './pages/Delivery';
import Billing from './pages/Billing';
import YarnSuppliers from './pages/YarnSuppliers';
import YarnPurchases from './pages/YarnPurchases';
import YarnReturns from './pages/YarnReturns';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/customers"
          element={
            <PrivateRoute>
              <Layout>
                <CustomerList />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/customers/add"
          element={
            <PrivateRoute>
              <Layout>
                <AddCustomer />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/customers/edit/:id"
          element={
            <PrivateRoute>
              <Layout>
                <EditCustomer />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <PrivateRoute>
              <Layout>
                <OrderList />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/production"
          element={
            <PrivateRoute>
              <Layout>
                <Production />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/delivery"
          element={
            <PrivateRoute>
              <Layout>
                <Delivery />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/billing"
          element={
            <PrivateRoute>
              <Layout>
                <Billing />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/yarn-suppliers"
          element={
            <PrivateRoute>
              <Layout>
                <YarnSuppliers />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/yarn-purchases"
          element={
            <PrivateRoute>
              <Layout>
                <YarnPurchases />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/yarn-returns"
          element={
            <PrivateRoute>
              <Layout>
                <YarnReturns />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

