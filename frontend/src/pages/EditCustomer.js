import React, { useState, useEffect } from 'react';
import { Card, Form, Button } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { customerService } from '../services/customerService';
import Toast from '../components/Toast';

const EditCustomer = () => {
  const { id } = useParams();
  const [formData, setFormData] = useState({
    buyerName: '',
    address: '',
    gstNo: '',
    phone: '',
    email: '',
    city: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', variant: 'success' });
  const navigate = useNavigate();

  useEffect(() => {
    fetchCustomer();
  }, [id]);

  const fetchCustomer = async () => {
    try {
      setFetching(true);
      const response = await customerService.getCustomer(id);
      if (response.success) {
        setFormData({
          buyerName: response.data.buyerName || '',
          address: response.data.address || '',
          gstNo: response.data.gstNo || '',
          phone: response.data.phone || '',
          email: response.data.email || '',
          city: response.data.city || '',
        });
      }
    } catch (error) {
      showToast('Unable to load .', 'danger');
      navigate('/customers');
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // For phone field, only allow numbers and limit to 10 digits
    if (name === 'phone') {
      const numericValue = value.replace(/[^0-9]/g, '').slice(0, 10);
      setFormData({
        ...formData,
        [name]: numericValue,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
    
    // Clear error for this field
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }
  };

  const validate = () => {
    const newErrors = {};

    // Buyer name validation
    if (!formData.buyerName.trim()) {
      newErrors.buyerName = 'Buyer name is required';
    }

    // Phone validation - required and exactly 10 digits
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone is required';
    } else {
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(formData.phone.trim())) {
        newErrors.phone = 'Phone number must be exactly 10 digits';
      }
    }

    // Email validation - optional but must be valid format if provided
    if (formData.email && formData.email.trim()) {
      const emailRegex = /^\S+@\S+\.\S+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Check if form is valid for button state
  const isFormValid = () => {
    return formData.buyerName.trim() && 
           formData.phone.trim() && 
           /^[0-9]{10}$/.test(formData.phone.trim()) &&
           (!formData.email || !formData.email.trim() || /^\S+@\S+\.\S+$/.test(formData.email.trim()));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      const response = await customerService.updateCustomer(id, formData);
      if (response.success) {
        showToast('Customer updated successfully', 'success');
        setTimeout(() => {
          navigate('/customers');
        }, 1000);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Unable to .';
      showToast(errorMessage, 'danger');
      
      // Handle unique buyerName error
      if (errorMessage.includes('Buyer name already exists')) {
        setErrors({ buyerName: 'Buyer name already exists' });
      }
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, variant) => {
    setToast({ show: true, message, variant });
  };

  const hideToast = () => {
    setToast({ ...toast, show: false });
  };

  if (fetching) {
    return <div className="text-center p-4">Loading...</div>;
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Edit Customer</h2>
        <Button variant="secondary" onClick={() => navigate('/customers')}>
          Back to List
        </Button>
      </div>

      <Toast
        show={toast.show}
        message={toast.message}
        variant={toast.variant}
        onClose={hideToast}
      />

      <Card>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>
                Buyer Name <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="text"
                name="buyerName"
                value={formData.buyerName}
                onChange={handleChange}
                isInvalid={!!errors.buyerName}
                placeholder="Enter buyer name"
              />
              <Form.Control.Feedback type="invalid">
                {errors.buyerName}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>
                Address <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="address"
                value={formData.address}
                onChange={handleChange}
                isInvalid={!!errors.address}
                placeholder="Enter address"
              />
              <Form.Control.Feedback type="invalid">
                {errors.address}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>
                Phone <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                isInvalid={!!errors.phone}
                placeholder="Enter 10-digit phone number"
                maxLength={10}
              />
              <Form.Control.Feedback type="invalid">
                {errors.phone}
              </Form.Control.Feedback>
              <Form.Text className="text-muted">
                Enter exactly 10 digits (numbers only)
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                isInvalid={!!errors.email}
                placeholder="Enter email address"
              />
              <Form.Control.Feedback type="invalid">
                {errors.email}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>City</Form.Label>
              <Form.Control
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="Enter city"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>GST No</Form.Label>
              <Form.Control
                type="text"
                name="gstNo"
                value={formData.gstNo}
                onChange={handleChange}
                placeholder="Enter GST number"
              />
            </Form.Group>

            <div className="d-flex gap-2">
              <Button variant="primary" type="submit" disabled={loading || !isFormValid()}>
                {loading ? 'Updating...' : 'Update Customer'}
              </Button>
              <Button variant="secondary" type="button" onClick={() => navigate('/customers')}>
                Cancel
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default EditCustomer;

