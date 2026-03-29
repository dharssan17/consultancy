import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Table, Row, Col, Badge } from 'react-bootstrap';
import { productionService } from '../services/productionService';
import { orderService } from '../services/orderService';
import { authService } from '../services/authService';
import Toast from '../components/Toast';

const Production = () => {
  const [formData, setFormData] = useState({
    orderId: '',
    designNo: '',
    date: new Date().toISOString().split('T')[0],
    loomNo: '',
    dcNo: '',
    pieces: '',
    todayMtrs: '',
  });
  const [orders, setOrders] = useState([]);
  const [productions, setProductions] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetchingOrders, setFetchingOrders] = useState(true);
  const [fetchingProductions, setFetchingProductions] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', variant: 'success' });
  const user = authService.getCurrentUser();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchOrders();
    fetchProductions();
  }, []);

  useEffect(() => {
    if (formData.orderId) {
      fetchOrderDetails(formData.orderId);
    } else {
      setFormData(prev => ({ ...prev, designNo: '' }));
    }
  }, [formData.orderId]);

  const fetchOrders = async () => {
    try {
      setFetchingOrders(true);
      const response = await orderService.getOrdersDropdown();
      if (response.success) {
        setOrders(response.data);
      }
    } catch (error) {
      showToast('Unable to load design numbers.', 'danger');
    } finally {
      setFetchingOrders(false);
    }
  };

  const fetchOrderDetails = async (orderId) => {
    try {
      const response = await orderService.getOrderDetails(orderId);
      if (response.success) {
        setFormData(prev => ({
          ...prev,
          designNo: response.data.designNo,
        }));
      }
    } catch (error) {
      // Silently fail
    }
  };

  const fetchProductions = async () => {
    try {
      setFetchingProductions(true);
      const response = await productionService.getProductions({ limit: 1000 });
      if (response.success) {
        // Sort by date descending (newest first)
        const sorted = response.data.sort((a, b) => {
          return new Date(b.date) - new Date(a.date);
        });
        setProductions(sorted);
      }
    } catch (error) {
      showToast('Unable to load production records.', 'danger');
    } finally {
      setFetchingProductions(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }
  };

  const validate = () => {
    const newErrors = {};

    // Required fields
    if (!formData.orderId) {
      newErrors.orderId = 'Please select a design number';
    }
    if (!formData.designNo || !formData.designNo.trim()) {
      newErrors.designNo = 'Design number is required';
    }
    if (!formData.date) {
      newErrors.date = 'Date is required';
    }
    if (!formData.loomNo || !formData.loomNo.trim()) {
      newErrors.loomNo = 'Loom number is required';
    }

    // Numeric validation - must be positive
    if (!formData.todayMtrs || parseFloat(formData.todayMtrs) <= 0 || isNaN(parseFloat(formData.todayMtrs))) {
      newErrors.todayMtrs = 'Today meters must be a positive number';
    }

    // Optional numeric field - if provided, must be positive
    if (formData.pieces && (parseFloat(formData.pieces) <= 0 || isNaN(parseFloat(formData.pieces)))) {
      newErrors.pieces = 'Pieces must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Check if form is valid for button state
  const isFormValid = () => {
    return formData.orderId &&
           formData.designNo && formData.designNo.trim() &&
           formData.date &&
           formData.loomNo && formData.loomNo.trim() &&
           formData.todayMtrs &&
           parseFloat(formData.todayMtrs) > 0 &&
           (!formData.pieces || parseFloat(formData.pieces) > 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      const submitData = {
        orderId: formData.orderId,
        designNo: formData.designNo,
        date: formData.date,
        loomNo: formData.loomNo,
        dcNo: formData.dcNo || '',
        pieces: formData.pieces ? parseFloat(formData.pieces) : null,
        todayMtrs: parseFloat(formData.todayMtrs),
        remarks: '',
      };

      const response = await productionService.createProduction(submitData);
      if (response.success) {
        showToast('Production entry saved successfully', 'success');
        // Reset form
        setFormData({
          orderId: '',
          designNo: '',
          date: new Date().toISOString().split('T')[0],
          loomNo: '',
          dcNo: '',
          pieces: '',
          todayMtrs: '',
        });
        // Refresh production list
        fetchProductions();
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Unable to save production entry.';
      showToast(errorMessage, 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, designNo) => {
    if (window.confirm(`Are you sure you want to delete this production entry for ${designNo}?`)) {
      try {
        const response = await productionService.deleteProduction(id);
        if (response.success) {
          showToast('Production deleted successfully', 'success');
          fetchProductions();
        }
      } catch (error) {
        showToast(
          error.response?.data?.message || 'Unable to delete production record.',
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

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB');
  };

  return (
    <div>
      <h2 className="mb-4 text-dark-blue fw-bold">Production Management</h2>

      <Toast
        show={toast.show}
        message={toast.message}
        variant={toast.variant}
        onClose={hideToast}
      />

      {/* SECTION A - Production Entry Form */}
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">Production Entry</h5>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Design No <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Select
                    name="orderId"
                    value={formData.orderId}
                    onChange={handleChange}
                    isInvalid={!!errors.orderId}
                    disabled={fetchingOrders}
                  >
                    <option value="">Select Design No</option>
                    {orders.map((order) => (
                      <option key={order.id} value={order.id}>
                        {order.designNo}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {errors.orderId}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Date <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    isInvalid={!!errors.date}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.date}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Loom No <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="loomNo"
                    value={formData.loomNo}
                    onChange={handleChange}
                    isInvalid={!!errors.loomNo}
                    placeholder="Enter loom number"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.loomNo}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>DC No</Form.Label>
                  <Form.Control
                    type="text"
                    name="dcNo"
                    value={formData.dcNo}
                    onChange={handleChange}
                    placeholder="Enter DC number"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Pieces</Form.Label>
                  <Form.Control
                    type="number"
                    name="pieces"
                    value={formData.pieces}
                    onChange={handleChange}
                    placeholder="Enter pieces"
                    min="0"
                    step="1"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Today Mtrs <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="number"
                    name="todayMtrs"
                    value={formData.todayMtrs}
                    onChange={handleChange}
                    isInvalid={!!errors.todayMtrs}
                    placeholder="Enter today meters"
                    min="0"
                    step="0.01"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.todayMtrs}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <div className="d-flex gap-2">
              <Button variant="primary" type="submit" disabled={loading || !isFormValid()}>
                {loading ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>

      {/* SECTION B - Daily Production Status Table */}
      <Card>
        <Card.Header>
          <h5 className="mb-0">Daily Production Status</h5>
        </Card.Header>
        <Card.Body>
          {fetchingProductions ? (
            <div className="text-center p-4">Loading...</div>
          ) : productions.length === 0 ? (
            <div className="text-center p-4">
              <p>No production entries found.</p>
            </div>
          ) : (
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>DC No</th>
                  <th>Pieces</th>
                  <th>Today Mtrs</th>
                  <th>Total Mtrs</th>
                  {isAdmin && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {productions.map((production) => (
                  <tr key={production._id}>
                    <td>{formatDate(production.date)}</td>
                    <td>{production.dcNo || '-'}</td>
                    <td>{production.pieces || '-'}</td>
                    <td>{production.todayMtrs?.toFixed(2)}</td>
                    <td>
                      <Badge bg="info">{production.totalMtrs?.toFixed(2)}</Badge>
                    </td>
                    {isAdmin && (
                      <td>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(production._id, production.designNo)}
                        >
                          Delete
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default Production;

