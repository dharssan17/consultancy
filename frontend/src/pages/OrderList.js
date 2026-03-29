import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Table, Row, Col, Modal, Badge } from 'react-bootstrap';
import { orderService } from '../services/orderService';
import { customerService } from '../services/customerService';
import { authService } from '../services/authService';
import Toast from '../components/Toast';

const OrderList = () => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    designNo: '',
    customerId: '',
    fabricConstruction: '',
    warpCount: '',
    weftCount: '',
    totalEnds: '',
    reed: '',
    pick: '',
    greige: '',
    width: '',
    loomNos: [],
    beamNos: [],
    warping: '',
    sizing: '',
    orderMtr: '',
    warpMtr: '',
    description: '',
    designSampleImage: '',
  });
  const [loomNoInput, setLoomNoInput] = useState('');
  const [beamNoInput, setBeamNoInput] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetchingOrders, setFetchingOrders] = useState(true);
  const [fetchingCustomers, setFetchingCustomers] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', variant: 'success' });
  const [viewModal, setViewModal] = useState({ show: false, order: null });
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const user = authService.getCurrentUser();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchOrders();
    fetchCustomers();
  }, []);

  const fetchOrders = async () => {
    try {
      setFetchingOrders(true);
      const response = await orderService.getOrders();
      if (response.success) {
        setOrders(response.data || []);
      }
    } catch (error) {
      showToast('Unable to load design numbers.', 'danger');
      setOrders([]);
    } finally {
      setFetchingOrders(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      setFetchingCustomers(true);
      const response = await customerService.getCustomers();
      if (response.success) {
        setCustomers(response.data || []);
      }
    } catch (error) {
      showToast('Unable to load customer directory.', 'danger');
    } finally {
      setFetchingCustomers(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // For numeric fields, allow only numbers and decimal point
    const numericFields = ['orderMtr', 'warpMtr', 'totalEnds', 'reed', 'pick', 'pieces'];
    if (numericFields.includes(name)) {
      // Allow numbers, decimal point, and empty string
      const numericValue = value === '' ? '' : value.replace(/[^0-9.]/g, '');
      // Prevent multiple decimal points
      const parts = numericValue.split('.');
      const finalValue = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : numericValue;
      setFormData({
        ...formData,
        [name]: finalValue,
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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showToast('Please select an image file', 'danger');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setFormData(prev => ({
          ...prev,
          designSampleImage: reader.result, // Store as base64 for now
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddLoomNo = () => {
    if (loomNoInput.trim()) {
      setFormData(prev => ({
        ...prev,
        loomNos: [...prev.loomNos, loomNoInput.trim()],
      }));
      setLoomNoInput('');
    }
  };

  const handleRemoveLoomNo = (index) => {
    setFormData(prev => ({
      ...prev,
      loomNos: prev.loomNos.filter((_, i) => i !== index),
    }));
  };

  const handleAddBeamNo = () => {
    if (beamNoInput.trim()) {
      setFormData(prev => ({
        ...prev,
        beamNos: [...prev.beamNos, beamNoInput.trim()],
      }));
      setBeamNoInput('');
    }
  };

  const handleRemoveBeamNo = (index) => {
    setFormData(prev => ({
      ...prev,
      beamNos: prev.beamNos.filter((_, i) => i !== index),
    }));
  };

  const validate = () => {
    const newErrors = {};

    // Required fields
    if (!formData.date) {
      newErrors.date = 'Date is required';
    }
    if (!formData.designNo.trim()) {
      newErrors.designNo = 'Design number is required';
    }
    if (!formData.customerId) {
      newErrors.customerId = 'Customer is required';
    }
    if (!formData.fabricConstruction.trim()) {
      newErrors.fabricConstruction = 'Fabric construction is required';
    }

    // Numeric validations - must be positive
    if (!formData.orderMtr || parseFloat(formData.orderMtr) <= 0 || isNaN(parseFloat(formData.orderMtr))) {
      newErrors.orderMtr = 'Order meters must be a positive number';
    }

    // Optional numeric fields - if provided, must be positive
    if (formData.totalEnds && (parseFloat(formData.totalEnds) <= 0 || isNaN(parseFloat(formData.totalEnds)))) {
      newErrors.totalEnds = 'Total ends must be a positive number';
    }
    if (formData.reed && (parseFloat(formData.reed) <= 0 || isNaN(parseFloat(formData.reed)))) {
      newErrors.reed = 'Reed must be a positive number';
    }
    if (formData.pick && (parseFloat(formData.pick) <= 0 || isNaN(parseFloat(formData.pick)))) {
      newErrors.pick = 'Pick must be a positive number';
    }
    if (formData.warpMtr && (parseFloat(formData.warpMtr) <= 0 || isNaN(parseFloat(formData.warpMtr)))) {
      newErrors.warpMtr = 'Warp meters must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Check if form is valid for button state
  const isFormValid = () => {
    return formData.date &&
           formData.designNo.trim() &&
           formData.customerId &&
           formData.fabricConstruction.trim() &&
           formData.orderMtr &&
           parseFloat(formData.orderMtr) > 0 &&
           (!formData.totalEnds || parseFloat(formData.totalEnds) > 0) &&
           (!formData.reed || parseFloat(formData.reed) > 0) &&
           (!formData.pick || parseFloat(formData.pick) > 0) &&
           (!formData.warpMtr || parseFloat(formData.warpMtr) > 0);
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      designNo: '',
      customerId: '',
      fabricConstruction: '',
      warpCount: '',
      weftCount: '',
      totalEnds: '',
      reed: '',
      pick: '',
      greige: '',
      width: '',
      loomNos: [],
      beamNos: [],
      warping: '',
      sizing: '',
      orderMtr: '',
      warpMtr: '',
      description: '',
      designSampleImage: '',
    });
    setLoomNoInput('');
    setBeamNoInput('');
    setImagePreview(null);
    setImageFile(null);
    setEditMode(false);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      const submitData = {
        date: formData.date,
        designNo: formData.designNo.trim(),
        customerId: formData.customerId,
        fabricConstruction: formData.fabricConstruction.trim(),
        warpCount: formData.warpCount || '',
        weftCount: formData.weftCount || '',
        totalEnds: formData.totalEnds ? parseFloat(formData.totalEnds) : null,
        reed: formData.reed ? parseFloat(formData.reed) : null,
        pick: formData.pick ? parseFloat(formData.pick) : null,
        greige: formData.greige || '',
        width: formData.width || '',
        loomNos: formData.loomNos,
        beamNos: formData.beamNos,
        warping: formData.warping || '',
        sizing: formData.sizing || '',
        orderMtr: parseFloat(formData.orderMtr),
        warpMtr: formData.warpMtr ? parseFloat(formData.warpMtr) : null,
        description: formData.description || '',
        designSampleImage: formData.designSampleImage || '',
      };

      let response;
      if (editMode) {
        response = await orderService.updateOrder(editingId, submitData);
      } else {
        response = await orderService.createOrder(submitData);
      }

      if (response.success) {
        showToast(editMode ? 'Order updated successfully' : 'Order created successfully', 'success');
        resetForm();
        fetchOrders();
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || (editMode ? 'Unable to .' : 'Unable to .');
      showToast(errorMessage, 'danger');
      
      if (errorMessage.includes('Design number already exists') || errorMessage.includes('unique')) {
        setErrors({ designNo: 'Design number already exists' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (id) => {
    try {
      const response = await orderService.getOrderDetails(id);
      if (response.success) {
        setViewModal({ show: true, order: response.data });
      }
    } catch (error) {
      showToast('Unable to load .', 'danger');
    }
  };

  const handleEdit = async (id) => {
    try {
      const response = await orderService.getOrder(id);
      if (response.success) {
        const order = response.data;
        setFormData({
          date: order.date ? new Date(order.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          designNo: order.designNo || '',
          customerId: order.customerId?._id || order.customerId || '',
          fabricConstruction: order.fabricConstruction || '',
          warpCount: order.warpCount || '',
          weftCount: order.weftCount || '',
          totalEnds: order.totalEnds || '',
          reed: order.reed || '',
          pick: order.pick || '',
          greige: order.greige || '',
          width: order.width || '',
          loomNos: order.loomNos || [],
          beamNos: order.beamNos || [],
          warping: order.warping || '',
          sizing: order.sizing || '',
          orderMtr: order.orderMtr || '',
          warpMtr: order.warpMtr || '',
          description: order.description || '',
          designSampleImage: order.designSampleImage || '',
        });
        setImagePreview(order.designSampleImage || null);
        setEditMode(true);
        setEditingId(id);
        
        // Scroll to form
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (error) {
      showToast('Unable to load .', 'danger');
    }
  };

  const handleDelete = async (id, designNo) => {
    if (window.confirm(`Are you sure you want to delete order "${designNo}"?`)) {
      try {
        const response = await orderService.deleteOrder(id);
        if (response.success) {
          showToast('Order deleted successfully', 'success');
          fetchOrders();
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

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB');
  };

  const getCustomerName = (order) => {
    if (!order || !order.customerId) return '-';
    if (order.customerId?.buyerName) return order.customerId.buyerName;
    if (typeof order.customerId === 'object' && order.customerId.buyerName) return order.customerId.buyerName;
    return '-';
  };

  return (
    <div>
      <h2 className="mb-4 text-dark-blue fw-bold">Order Management</h2>

      <Toast
        show={toast.show}
        message={toast.message}
        variant={toast.variant}
        onClose={hideToast}
      />

      {/* SECTION A - New Order Form */}
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">{editMode ? 'Edit Order' : 'New Order'}</h5>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
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
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Design No <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="designNo"
                    value={formData.designNo}
                    onChange={handleChange}
                    isInvalid={!!errors.designNo}
                    placeholder="Enter design number"
                    disabled={editMode}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.designNo}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Customer <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Select
                    name="customerId"
                    value={formData.customerId}
                    onChange={handleChange}
                    isInvalid={!!errors.customerId}
                    disabled={fetchingCustomers}
                  >
                    <option value="">Select Customer</option>
                    {customers.map((customer) => (
                      <option key={customer._id} value={customer._id}>
                        {customer.buyerName}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {errors.customerId}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Fabric Construction <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="fabricConstruction"
                    value={formData.fabricConstruction}
                    onChange={handleChange}
                    isInvalid={!!errors.fabricConstruction}
                    placeholder="Enter fabric construction"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.fabricConstruction}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Warp Count</Form.Label>
                  <Form.Control
                    type="text"
                    name="warpCount"
                    value={formData.warpCount}
                    onChange={handleChange}
                    placeholder="Enter warp count"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Weft Count</Form.Label>
                  <Form.Control
                    type="text"
                    name="weftCount"
                    value={formData.weftCount}
                    onChange={handleChange}
                    placeholder="Enter weft count"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Total Ends</Form.Label>
                  <Form.Control
                    type="number"
                    name="totalEnds"
                    value={formData.totalEnds}
                    onChange={handleChange}
                    placeholder="Enter total ends"
                    min="0"
                    step="1"
                    isInvalid={!!errors.totalEnds}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.totalEnds}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Reed</Form.Label>
                  <Form.Control
                    type="number"
                    name="reed"
                    value={formData.reed}
                    onChange={handleChange}
                    placeholder="Enter reed"
                    min="0"
                    step="0.01"
                    isInvalid={!!errors.reed}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.reed}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Pick</Form.Label>
                  <Form.Control
                    type="number"
                    name="pick"
                    value={formData.pick}
                    onChange={handleChange}
                    placeholder="Enter pick"
                    min="0"
                    step="0.01"
                    isInvalid={!!errors.pick}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.pick}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Greige</Form.Label>
                  <Form.Control
                    type="text"
                    name="greige"
                    value={formData.greige}
                    onChange={handleChange}
                    placeholder="Enter greige"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Width</Form.Label>
                  <Form.Control
                    type="text"
                    name="width"
                    value={formData.width}
                    onChange={handleChange}
                    placeholder="Enter width"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Order Mtr <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="number"
                    name="orderMtr"
                    value={formData.orderMtr}
                    onChange={handleChange}
                    isInvalid={!!errors.orderMtr}
                    placeholder="Enter order meters"
                    min="0"
                    step="0.01"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.orderMtr}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Loom Nos</Form.Label>
                  <div className="d-flex gap-2 mb-2">
                    <Form.Control
                      type="text"
                      value={loomNoInput}
                      onChange={(e) => setLoomNoInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddLoomNo();
                        }
                      }}
                      placeholder="Enter loom number"
                    />
                    <Button variant="outline-primary" onClick={handleAddLoomNo} type="button">
                      Add
                    </Button>
                  </div>
                  {formData.loomNos.length > 0 && (
                    <div className="d-flex flex-wrap gap-2">
                      {formData.loomNos.map((loomNo, index) => (
                        <Badge key={index} bg="primary" className="d-flex align-items-center gap-1">
                          {loomNo}
                          <button
                            type="button"
                            className="btn-close btn-close-white"
                            style={{ fontSize: '0.7em' }}
                            onClick={() => handleRemoveLoomNo(index)}
                            aria-label="Remove"
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Beam Nos</Form.Label>
                  <div className="d-flex gap-2 mb-2">
                    <Form.Control
                      type="text"
                      value={beamNoInput}
                      onChange={(e) => setBeamNoInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddBeamNo();
                        }
                      }}
                      placeholder="Enter beam number"
                    />
                    <Button variant="outline-primary" onClick={handleAddBeamNo} type="button">
                      Add
                    </Button>
                  </div>
                  {formData.beamNos.length > 0 && (
                    <div className="d-flex flex-wrap gap-2">
                      {formData.beamNos.map((beamNo, index) => (
                        <Badge key={index} bg="secondary" className="d-flex align-items-center gap-1">
                          {beamNo}
                          <button
                            type="button"
                            className="btn-close btn-close-white"
                            style={{ fontSize: '0.7em' }}
                            onClick={() => handleRemoveBeamNo(index)}
                            aria-label="Remove"
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Warping</Form.Label>
                  <Form.Control
                    type="text"
                    name="warping"
                    value={formData.warping}
                    onChange={handleChange}
                    placeholder="Enter warping"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Sizing</Form.Label>
                  <Form.Control
                    type="text"
                    name="sizing"
                    value={formData.sizing}
                    onChange={handleChange}
                    placeholder="Enter sizing"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Warp Mtr</Form.Label>
                  <Form.Control
                    type="number"
                    name="warpMtr"
                    value={formData.warpMtr}
                    onChange={handleChange}
                    placeholder="Enter warp meters"
                    min="0"
                    step="0.01"
                    isInvalid={!!errors.warpMtr}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.warpMtr}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Design Sample Image</Form.Label>
                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                  {imagePreview && (
                    <div className="mt-2 border p-2" style={{ maxWidth: '300px', maxHeight: '300px', overflow: 'hidden' }}>
                      <img
                        src={imagePreview}
                        alt="Preview"
                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                      />
                    </div>
                  )}
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter description"
              />
            </Form.Group>

            <div className="d-flex gap-2">
              <Button variant="primary" type="submit" disabled={loading || !isFormValid()}>
                {loading ? 'Saving...' : editMode ? 'Update Order' : 'Save Order'}
              </Button>
              {editMode && (
                <Button variant="secondary" type="button" onClick={resetForm}>
                  Cancel
                </Button>
              )}
            </div>
          </Form>
        </Card.Body>
      </Card>

      {/* SECTION B - Order List Table */}
      <Card>
        <Card.Header>
          <h5 className="mb-0">Order List</h5>
        </Card.Header>
        <Card.Body>
          {fetchingOrders ? (
            <div className="text-center p-4">Loading...</div>
          ) : orders.length === 0 ? (
            <div className="text-center p-4">
              <p>No orders found.</p>
            </div>
          ) : (
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Design No</th>
                  <th>Customer Name</th>
                  <th>Fabric Construction</th>
                  <th>Order Mtr</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id}>
                    <td>{formatDate(order.date)}</td>
                    <td>{order.designNo}</td>
                    <td>{getCustomerName(order)}</td>
                    <td>{order.fabricConstruction}</td>
                    <td>{order.orderMtr?.toFixed(2)}</td>
                    <td>
                      <Button
                        variant="outline-info"
                        size="sm"
                        className="me-2"
                        onClick={() => handleView(order._id)}
                      >
                        View
                      </Button>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="me-2"
                        onClick={() => handleEdit(order._id)}
                      >
                        Edit
                      </Button>
                      {isAdmin && (
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(order._id, order.designNo)}
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
        </Card.Body>
      </Card>

      {/* View Modal */}
      <Modal show={viewModal.show} onHide={() => setViewModal({ show: false, order: null })} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Order Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {viewModal.order && (
            <div>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Date:</strong> {formatDate(viewModal.order.date || viewModal.order.orderId)}
                </Col>
                <Col md={6}>
                  <strong>Design No:</strong> {viewModal.order.designNo}
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Customer:</strong> {viewModal.order.buyerName}
                </Col>
                <Col md={6}>
                  <strong>Fabric Construction:</strong> {viewModal.order.fabricConstruction}
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={4}>
                  <strong>Warp Count:</strong> {viewModal.order.warpCount || '-'}
                </Col>
                <Col md={4}>
                  <strong>Weft Count:</strong> {viewModal.order.weftCount || '-'}
                </Col>
                <Col md={4}>
                  <strong>Total Ends:</strong> {viewModal.order.totalEnds || '-'}
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={4}>
                  <strong>Reed:</strong> {viewModal.order.reed || '-'}
                </Col>
                <Col md={4}>
                  <strong>Pick:</strong> {viewModal.order.pick || '-'}
                </Col>
                <Col md={4}>
                  <strong>Greige:</strong> {viewModal.order.greige || '-'}
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Width:</strong> {viewModal.order.width || '-'}
                </Col>
                <Col md={6}>
                  <strong>Order Mtr:</strong> {viewModal.order.orderMtr?.toFixed(2)}
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Warp Mtr:</strong> {viewModal.order.warpMtr || '-'}
                </Col>
                <Col md={6}>
                  <strong>Warping:</strong> {viewModal.order.warping || '-'}
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Sizing:</strong> {viewModal.order.sizing || '-'}
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Loom Nos:</strong> {viewModal.order.loomNos?.length > 0 ? viewModal.order.loomNos.join(', ') : '-'}
                </Col>
                <Col md={6}>
                  <strong>Beam Nos:</strong> {viewModal.order.beamNos?.length > 0 ? viewModal.order.beamNos.join(', ') : '-'}
                </Col>
              </Row>
              {viewModal.order.description && (
                <Row className="mb-3">
                  <Col>
                    <strong>Description:</strong>
                    <p>{viewModal.order.description}</p>
                  </Col>
                </Row>
              )}
              {viewModal.order.designSampleImage && (
                <Row className="mb-3">
                  <Col>
                    <strong>Design Sample Image:</strong>
                    <div className="mt-2 border p-2" style={{ maxWidth: '500px', maxHeight: '500px', overflow: 'hidden' }}>
                      <img
                        src={viewModal.order.designSampleImage}
                        alt="Design Sample"
                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                      />
                    </div>
                  </Col>
                </Row>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setViewModal({ show: false, order: null })}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default OrderList;
