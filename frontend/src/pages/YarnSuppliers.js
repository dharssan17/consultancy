import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Table, Modal } from 'react-bootstrap';
import { yarnSupplierService } from '../services/yarnSupplierService';
import Toast from '../components/Toast';

const YarnSuppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [fetching, setFetching] = useState(true);
  
  const [formData, setFormData] = useState({ supplierName: '', address: '', phone: '', gstNumber: '' });
  const [editId, setEditId] = useState(null);
  
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setFetching(true);
      const res = await yarnSupplierService.getSuppliers();
      if (res.success) setSuppliers(res.data);
    } catch (err) {
      showToast('Error loading suppliers', 'danger');
    } finally {
      setFetching(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const validate = () => {
    if (!formData.supplierName.trim()) {
      showToast('Supplier Name is required', 'danger');
      return false;
    }
    if (formData.phone && !/^\d{10}$/.test(formData.phone)) {
      showToast('Phone must be a valid 10-digit number', 'danger');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      if (editId) {
        await yarnSupplierService.updateSupplier(editId, formData);
        showToast('Supplier updated successfully');
      } else {
        await yarnSupplierService.createSupplier(formData);
        showToast('Supplier added successfully');
      }
      setFormData({ supplierName: '', address: '', phone: '', gstNumber: '' });
      setEditId(null);
      fetchSuppliers();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to save', 'danger');
    }
  };

  const handleEdit = (supplier) => {
    setFormData({
      supplierName: supplier.supplierName,
      address: supplier.address || '',
      phone: supplier.phone || '',
      gstNumber: supplier.gstNumber || ''
    });
    setEditId(supplier._id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this supplier?')) return;
    try {
      await yarnSupplierService.deleteSupplier(id);
      showToast('Supplier deleted strictly');
      fetchSuppliers();
    } catch (err) {
      showToast('Failed to delete', 'danger');
    }
  };

  return (
    <Container fluid className="p-4 pt-5 mt-4">
      <Row className="mb-4 align-items-center">
        <Col>
          <h2 className="page-header text-primary fw-bold">Yarn Suppliers</h2>
          <p className="text-muted">Manage yarn suppliers and details</p>
        </Col>
      </Row>
      
      {toast.show && <Toast message={toast.message} type={toast.type} onClose={() => setToast({ show: false, message: '', type: 'success' })} />}

      <Row>
        <Col md={4}>
          <Card className="shadow-sm border-0 mb-4">
            <Card.Header className="bg-white border-bottom-0 pt-4 pb-0">
              <h5 className="mb-0 text-primary fw-bold">{editId ? 'Edit Supplier' : 'Add New Supplier'}</h5>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Supplier Name <span className="text-danger">*</span></Form.Label>
                  <Form.Control type="text" name="supplierName" value={formData.supplierName} onChange={handleChange} placeholder="e.g. ABC Yarns" required />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Phone Number</Form.Label>
                  <Form.Control type="text" name="phone" value={formData.phone} onChange={handleChange} placeholder="10-digit number" />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>GSTIN</Form.Label>
                  <Form.Control type="text" name="gstNumber" value={formData.gstNumber} onChange={handleChange} placeholder="Enter GST Number" />
                </Form.Group>
                <Form.Group className="mb-4">
                  <Form.Label>Address</Form.Label>
                  <Form.Control as="textarea" rows={3} name="address" value={formData.address} onChange={handleChange} placeholder="Full address" />
                </Form.Group>
                <div className="d-grid gap-2">
                  <Button variant="primary" type="submit" className="py-2 fw-bold">
                    {editId ? 'Update Supplier' : 'Save Supplier'}
                  </Button>
                  {editId && (
                    <Button variant="outline-secondary" onClick={() => { setEditId(null); setFormData({ supplierName: '', address: '', phone: '', gstNumber: '' }); }}>
                      Cancel Edit
                    </Button>
                  )}
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col md={8}>
          <Card className="shadow-sm border-0 h-100">
            <Card.Body className="p-0">
              {fetching ? (
                <div className="text-center p-5">Loading suppliers...</div>
              ) : suppliers.length === 0 ? (
                <div className="text-center p-5 text-muted">No yarn suppliers found. Create one to begin.</div>
              ) : (
                <Table responsive hover className="mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th className="border-0 px-4 py-3">Supplier Name</th>
                      <th className="border-0 py-3">Phone</th>
                      <th className="border-0 py-3">GSTIN</th>
                      <th className="border-0 px-4 py-3 text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suppliers.map(sup => (
                      <tr key={sup._id} className="align-middle">
                        <td className="px-4 py-3 fw-bold">{sup.supplierName}</td>
                        <td>{sup.phone || '-'}</td>
                        <td>{sup.gstNumber || '-'}</td>
                        <td className="px-4 text-end">
                          <Button variant="outline-primary" size="sm" className="me-2" onClick={() => handleEdit(sup)}>Edit</Button>
                          <Button variant="outline-danger" size="sm" onClick={() => handleDelete(sup._id)}>Delete</Button>
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

export default YarnSuppliers;
