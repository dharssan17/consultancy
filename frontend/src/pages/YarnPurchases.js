import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Table } from 'react-bootstrap';
import { yarnPurchaseService } from '../services/yarnPurchaseService';
import { yarnSupplierService } from '../services/yarnSupplierService';
import { orderService } from '../services/orderService';
import Toast from '../components/Toast';

const YarnPurchases = () => {
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [fetching, setFetching] = useState(true);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    supplierId: '',
    designNo: '',
    yarnType: '',
    quantity: '',
    rate: '',
    description: ''
  });
  
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setFetching(true);
      const [purRes, supRes, ordRes] = await Promise.all([
        yarnPurchaseService.getPurchases(),
        yarnSupplierService.getSuppliersDropdown(),
        orderService.getOrders()
      ]);
      if (purRes.success) setPurchases(purRes.data);
      if (supRes.success) setSuppliers(supRes.data);
      if (ordRes.success) setOrders(ordRes.data);
    } catch (err) {
      showToast('Error loading tracking data.', 'danger');
    } finally {
      setFetching(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validate = () => {
    if (!formData.supplierId) { showToast('Supplier is required', 'danger'); return false; }
    if (!formData.designNo) { showToast('Design Number is required', 'danger'); return false; }
    if (!formData.quantity || formData.quantity <= 0) { showToast('Quantity must be greater than 0', 'danger'); return false; }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      const payload = {
        ...formData,
        quantity: Number(formData.quantity),
        rate: formData.rate ? Number(formData.rate) : 0,
      };
      
      await yarnPurchaseService.createPurchase(payload);
      showToast('Purchase logged successfully');
      setFormData({
        date: new Date().toISOString().split('T')[0],
        supplierId: '',
        designNo: '',
        yarnType: '',
        quantity: '',
        rate: '',
        description: ''
      });
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to save purchase', 'danger');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this purchase log?')) return;
    try {
      await yarnPurchaseService.deletePurchase(id);
      showToast('Record deleted');
      fetchData();
    } catch (err) {
      showToast('Failed to delete', 'danger');
    }
  };

  return (
    <Container fluid className="p-4 pt-5 mt-4">
      <Row className="mb-4 align-items-center">
        <Col>
          <h2 className="page-header text-primary fw-bold">Yarn Purchases</h2>
          <p className="text-muted">Register and view yarn intake</p>
        </Col>
      </Row>

      {toast.show && <Toast message={toast.message} type={toast.type} onClose={() => setToast({ show: false, message: '', type: 'success' })} />}

      <Row>
        <Col lg={4}>
          <Card className="shadow-sm border-0 mb-4">
            <Card.Header className="bg-white border-bottom-0 pt-4 pb-0">
              <h5 className="mb-0 text-primary fw-bold">New Purchase</h5>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={12}>
                    <Form.Group className="mb-3">
                      <Form.Label>Date <span className="text-danger">*</span></Form.Label>
                      <Form.Control type="date" name="date" value={formData.date} onChange={handleChange} required />
                    </Form.Group>
                  </Col>
                  <Col md={12}>
                    <Form.Group className="mb-3">
                      <Form.Label>Supplier <span className="text-danger">*</span></Form.Label>
                      <Form.Select name="supplierId" value={formData.supplierId} onChange={handleChange} required>
                        <option value="">Select a Supplier</option>
                        {suppliers.map(s => <option key={s._id} value={s._id}>{s.supplierName}</option>)}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={12}>
                    <Form.Group className="mb-3">
                      <Form.Label>Design No (Order) <span className="text-danger">*</span></Form.Label>
                      <Form.Select name="designNo" value={formData.designNo} onChange={handleChange} required>
                        <option value="">Select Order Design No</option>
                        {orders.map(o => <option key={o._id} value={o.designNo}>{o.designNo}</option>)}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Yarn Type</Form.Label>
                      <Form.Control type="text" name="yarnType" value={formData.yarnType} onChange={handleChange} placeholder="e.g. 40s Cotton" />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Quantity (Kgs) <span className="text-danger">*</span></Form.Label>
                      <Form.Control type="number" step="0.01" name="quantity" value={formData.quantity} onChange={handleChange} required />
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Rate</Form.Label>
                      <Form.Control type="number" step="0.01" name="rate" value={formData.rate} onChange={handleChange} />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-4">
                      <Form.Label>Total Amount</Form.Label>
                      <Form.Control type="text" readOnly value={(Number(formData.quantity) * Number(formData.rate)).toFixed(2) || '0.00'} style={{ backgroundColor: '#f8f9fa' }} />
                    </Form.Group>
                  </Col>
                </Row>
                <Form.Group className="mb-3">
                  <Form.Label>Description (Optional)</Form.Label>
                  <Form.Control as="textarea" rows={2} name="description" value={formData.description} onChange={handleChange} />
                </Form.Group>
                
                <Button variant="primary" type="submit" className="w-100 py-2 fw-bold">Save Purchase</Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={8}>
          <Card className="shadow-sm border-0 h-100">
            <Card.Body className="p-0">
              {fetching ? (
                <div className="text-center p-5">Loading purchases...</div>
              ) : purchases.length === 0 ? (
                <div className="text-center p-5 text-muted">No records found.</div>
              ) : (
                <Table responsive hover className="mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th className="border-0 px-4 py-3">Date</th>
                      <th className="border-0 py-3">Supplier</th>
                      <th className="border-0 py-3">Design No</th>
                      <th className="border-0 py-3">Qty</th>
                      <th className="border-0 py-3">Total</th>
                      <th className="border-0 px-4 py-3 text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchases.map(p => (
                      <tr key={p._id} className="align-middle">
                        <td className="px-4 fw-bold">{new Date(p.date).toLocaleDateString()}</td>
                        <td>{p.supplierId?.supplierName || 'Unknown'}</td>
                        <td>{p.designNo}</td>
                        <td>{p.quantity}</td>
                        <td>₹{p.totalAmount?.toFixed(2)}</td>
                        <td className="px-4 text-end">
                          <Button variant="outline-danger" size="sm" onClick={() => handleDelete(p._id)}>Remove</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default YarnPurchases;
