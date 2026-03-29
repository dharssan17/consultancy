import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { productionService } from '../services/productionService';
import { orderService } from '../services/orderService';
import Toast from '../components/Toast';

const EditProduction = () => {
  const { id } = useParams();
  const [formData, setFormData] = useState({
    orderId: '',
    designNo: '',
    date: new Date().toISOString().split('T')[0],
    loomNo: '',
    dcNo: '',
    pieces: '',
    todayMtrs: '',
    remarks: '',
  });
  const [orders, setOrders] = useState([]);
  const [orderDetails, setOrderDetails] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', variant: 'success' });
  const navigate = useNavigate();

  useEffect(() => {
    fetchProduction();
    fetchOrders();
  }, [id]);

  useEffect(() => {
    if (formData.orderId) {
      fetchOrderDetails(formData.orderId);
    }
  }, [formData.orderId]);

  const fetchProduction = async () => {
    try {
      setFetching(true);
      const response = await productionService.getProduction(id);
      if (response.success) {
        const prod = response.data;
        setFormData({
          orderId: prod.orderId?._id || prod.orderId || '',
          designNo: prod.designNo || '',
          date: prod.date ? new Date(prod.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          loomNo: prod.loomNo || '',
          dcNo: prod.dcNo || '',
          pieces: prod.pieces || '',
          todayMtrs: prod.todayMtrs || '',
          remarks: prod.remarks || '',
        });
        if (prod.orderId?._id || prod.orderId) {
          await fetchOrderDetails(prod.orderId?._id || prod.orderId);
        }
      }
    } catch (error) {
      showToast('Unable to load .', 'danger');
      navigate('/productions');
    } finally {
      setFetching(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await orderService.getOrdersDropdown();
      if (response.success) {
        setOrders(response.data);
      }
    } catch (error) {
      showToast('Unable to load design numbers.', 'danger');
    }
  };

  const fetchOrderDetails = async (orderId) => {
    try {
      const response = await orderService.getOrderDetails(orderId);
      if (response.success) {
        setOrderDetails(response.data);
      }
    } catch (error) {
      // Silently fail - order might not exist
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

    if (!formData.orderId) {
      newErrors.orderId = 'Please select an order';
    }
    if (!formData.designNo) {
      newErrors.designNo = 'Design number is required';
    }
    if (!formData.date) {
      newErrors.date = 'Date is required';
    }
    if (!formData.loomNo) {
      newErrors.loomNo = 'Loom number is required';
    }
    if (!formData.todayMtrs || parseFloat(formData.todayMtrs) <= 0) {
      newErrors.todayMtrs = 'Today meters must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
        remarks: formData.remarks || '',
      };

      const response = await productionService.updateProduction(id, submitData);
      if (response.success) {
        showToast('Production updated successfully', 'success');
        setTimeout(() => {
          navigate('/productions');
        }, 1000);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Unable to .';
      showToast(errorMessage, 'danger');
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
        <h2>Edit Production</h2>
        <Button variant="secondary" onClick={() => navigate('/productions')}>
          Back to List
        </Button>
      </div>

      <Toast
        show={toast.show}
        message={toast.message}
        variant={toast.variant}
        onClose={hideToast}
      />

      <Row>
        <Col md={8}>
          <Card>
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Design No <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Select
                    name="orderId"
                    value={formData.orderId}
                    onChange={handleChange}
                    isInvalid={!!errors.orderId}
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

                {orderDetails && (
                  <Alert variant="info" className="mb-3">
                    <strong>Order Information:</strong>
                    <div className="mt-2">
                      <div><strong>Buyer Name:</strong> {orderDetails.buyerName}</div>
                      <div><strong>Order Mtrs:</strong> {orderDetails.orderMtr}</div>
                      <div><strong>Fabric Construction:</strong> {orderDetails.fabricConstruction}</div>
                      <div><strong>Looms Assigned:</strong> {orderDetails.loomNos?.join(', ') || 'N/A'}</div>
                    </div>
                  </Alert>
                )}

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
                </Row>

                <Row>
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
                </Row>

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

                <Form.Group className="mb-3">
                  <Form.Label>Remarks</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleChange}
                    placeholder="Enter remarks"
                  />
                </Form.Group>

                <div className="d-flex gap-2">
                  <Button variant="primary" type="submit" disabled={loading}>
                    {loading ? 'Updating...' : 'Update Production'}
                  </Button>
                  <Button variant="secondary" type="button" onClick={() => navigate('/productions')}>
                    Cancel
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default EditProduction;

