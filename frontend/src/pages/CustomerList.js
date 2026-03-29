import React, { useState, useEffect } from 'react';
import { Table, Button, Form, InputGroup, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { customerService } from '../services/customerService';
import { authService } from '../services/authService';
import Toast from '../components/Toast';

const CustomerList = () => {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', variant: 'success' });
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    // Filter customers based on search term
    if (searchTerm.trim() === '') {
      setFilteredCustomers(customers);
    } else {
      const filtered = customers.filter(
        (customer) =>
          customer.buyerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.phone.includes(searchTerm) ||
          (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (customer.city && customer.city.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredCustomers(filtered);
    }
  }, [searchTerm, customers]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await customerService.getCustomers();
      if (response.success) {
        setCustomers(response.data);
        setFilteredCustomers(response.data);
      }
    } catch (error) {
      showToast('Unable to load customer directory.', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, buyerName) => {
    if (window.confirm(`Are you sure you want to delete customer "${buyerName}"?`)) {
      try {
        const response = await customerService.deleteCustomer(id);
        if (response.success) {
          showToast('Customer deleted successfully', 'success');
          fetchCustomers();
        }
      } catch (error) {
        showToast(
          error.response?.data?.message || 'Unable to .',
          'danger'
        );
      }
    }
  };

  const showToast = (message, variant) => {
    setToast({ show: true, message, variant });
  };

  const hideToast = () => {
    setToast({ ...toast, show: false });
  };

  if (loading) {
    return <div className="text-center p-4">Loading...</div>;
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Customer Master</h2>
        <Button variant="primary" onClick={() => navigate('/customers/add')}>
          Add Customer
        </Button>
      </div>

      <Toast
        show={toast.show}
        message={toast.message}
        variant={toast.variant}
        onClose={hideToast}
      />

      <InputGroup className="mb-3">
        <InputGroup.Text>Search</InputGroup.Text>
        <Form.Control
          type="text"
          placeholder="Search by name, phone, email, or city..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </InputGroup>

      {filteredCustomers.length === 0 ? (
        <div className="text-center p-4">
          <p>No customers found.</p>
        </div>
      ) : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Buyer Name</th>
              <th>Address</th>
              <th>Phone</th>
              <th>Email</th>
              <th>City</th>
              <th>GST No</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map((customer) => (
              <tr key={customer._id}>
                <td>{customer.buyerName}</td>
                <td>{customer.address}</td>
                <td>{customer.phone}</td>
                <td>{customer.email || '-'}</td>
                <td>{customer.city || '-'}</td>
                <td>{customer.gstNo || '-'}</td>
                <td>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="me-2"
                    onClick={() => navigate(`/customers/edit/${customer._id}`)}
                  >
                    Edit
                  </Button>
                  {isAdmin && (
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleDelete(customer._id, customer.buyerName)}
                    >
                      Delete
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <div className="mt-3">
        <Badge bg="secondary">
          Total: {filteredCustomers.length} customer(s)
        </Badge>
      </div>
    </div>
  );
};

export default CustomerList;

