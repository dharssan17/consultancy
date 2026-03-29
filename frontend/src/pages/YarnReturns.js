import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Table } from 'react-bootstrap';
import { yarnReturnService } from '../services/yarnReturnService';
import { yarnSupplierService } from '../services/yarnSupplierService';
import { orderService } from '../services/orderService';
import Toast from '../components/Toast';
import html2pdf from 'html2pdf.js';

const YarnReturns = () => {
  const [returns, setReturns] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [fetching, setFetching] = useState(true);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    supplierId: '',
    designNo: '',
    description: '',
    quantity: '',
    vehicleNo: '',
    time: ''
  });
  
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setFetching(true);
      const [retRes, supRes, ordRes] = await Promise.all([
        yarnReturnService.getReturns(),
        yarnSupplierService.getSuppliersDropdown(),
        orderService.getOrders()
      ]);
      if (retRes.success) setReturns(retRes.data);
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
    if (!formData.description || !formData.description.trim()) { showToast('Description is required', 'danger'); return false; }
    if (!formData.quantity || formData.quantity <= 0) { showToast('Quantity must be positive', 'danger'); return false; }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      const payload = { ...formData, quantity: Number(formData.quantity) };
      await yarnReturnService.createReturn(payload);
      showToast('Yarn Return recorded successfully');
      setFormData({
        date: new Date().toISOString().split('T')[0],
        supplierId: '',
        designNo: '',
        description: '',
        quantity: '',
        vehicleNo: '',
        time: ''
      });
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to save return', 'danger');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this return log?')) return;
    try {
      await yarnReturnService.deleteReturn(id);
      showToast('Return deleted');
      fetchData();
    } catch (err) {
      showToast('Failed to delete', 'danger');
    }
  };

  const generatePDFTemplate = (returnObj, supplier) => {
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    @media print {
      @page { margin: 10mm; size: A5 landscape; }
      body { margin: 0; print-color-adjust: exact; }
    }
    body { font-family: "Times New Roman", Times, serif; color: #000; font-size: 13px; max-width: 200mm; margin: 0 auto; padding: 20px; }
    .memo-box { border: 2px solid #000; width: 100%; box-sizing: border-box; }
    .header-section { text-align: center; border-bottom: 2px solid #000; padding: 10px; position: relative; }
    .gstin-top { position: absolute; top: 10px; left: 10px; font-weight: bold; font-family: Arial, sans-serif; font-size: 11px; }
    .memo-label { font-weight: bold; text-decoration: underline; font-size: 14px; margin-bottom: 5px; }
    .company-name { font-size: 24px; font-weight: bold; margin: 5px 0; font-family: Arial, sans-serif; letter-spacing: 1px; }
    .company-details { font-size: 11px; line-height: 1.4; }
    .info-section { display: flex; border-bottom: 2px solid #000; }
    .supplier-info { flex: 70%; border-right: 2px solid #000; padding: 10px; }
    .meta-details { flex: 30%; padding: 0; display: flex; flex-direction: column; }
    .detail-row { display: flex; border-bottom: 1px solid #000; padding: 5px 10px; flex: 1; }
    .detail-row:last-child { border-bottom: none; }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; min-height: 150px; }
    th, td { border: 1px solid #000; border-left: none; padding: 8px 5px; text-align: center; }
    th:last-child, td:last-child { border-right: none; }
    th { font-weight: bold; background-color: #fff; }
    .desc-col { width: 60%; text-align: left; padding-left: 10px; }
    .qty-col { width: 20%; font-weight: bold; }
    .footer-auth { border-top: 2px solid #000; display: flex; }
    .dispatch-info { flex: 60%; padding: 10px; border-right: 2px solid #000; font-size: 12px; }
    .signature { flex: 40%; padding: 10px; text-align: center; display: flex; flex-direction: column; justify-content: space-between; min-height: 70px; }
  </style>
</head>
<body>
  <div class="memo-box">
    <div class="header-section">
      <div class="gstin-top">GSTIN: 33XXXXXXXXXXXXX</div>
      <div class="memo-label">DELIVERY MEMO (YARN RETURN)</div>
      <div class="company-name">SELLIAMMAN TEXTILES</div>
      <div class="company-details">
        123, Weaver's Street, Textile City, 641001<br>
        Mobile: +91 99999 99999
      </div>
    </div>
    <div class="info-section">
      <div class="supplier-info">
        <div><strong>To:</strong></div>
        <div style="font-size: 16px; font-weight: bold; margin-top: 5px;">${supplier?.supplierName || 'Unknown Supplier'}</div>
        <div style="margin-top: 5px; white-space: pre-wrap;">${supplier?.address || 'Address not listed'}</div>
        <div style="margin-top: 5px;"><strong>GSTIN:</strong> ${supplier?.gstNumber || 'N/A'}</div>
      </div>
      <div class="meta-details">
        <div class="detail-row">
          <div style="width:40%"><strong>S.No:</strong></div>
          <div>YM-${returnObj._id.toString().slice(-5).toUpperCase()}</div>
        </div>
        <div class="detail-row">
          <div style="width:40%"><strong>Date:</strong></div>
          <div>${new Date(returnObj.date).toLocaleDateString('en-GB')}</div>
        </div>
      </div>
    </div>
    <table style="border-bottom: none;">
      <thead>
        <tr style="border-bottom: 2px solid #000;">
          <th style="width: 10%;">No</th>
          <th class="desc-col">Description of Goods</th>
          <th class="qty-col">Quantity (Kgs)</th>
        </tr>
      </thead>
      <tbody>
        <tr style="height: 120px; vertical-align: top;">
          <td>1</td>
          <td class="desc-col">
            ${returnObj.description}<br><br>
            <small><i>Ref Design: ${returnObj.designNo}</i></small>
          </td>
          <td class="qty-col">${Number(returnObj.quantity).toFixed(2)}</td>
        </tr>
        <tr style="border-top: 2px solid #000; font-size: 14px;">
          <td colspan="2" style="text-align: right; padding-right: 15px; font-weight: bold;">Total Quantity:</td>
          <td style="font-weight: bold;">${Number(returnObj.quantity).toFixed(2)} Kgs</td>
        </tr>
      </tbody>
    </table>
    <div class="footer-auth">
      <div class="dispatch-info">
        <div style="margin-bottom: 5px;"><strong>Vehicle No:</strong> ${returnObj.vehicleNo || '-'}</div>
        <div><strong>Time:</strong> ${returnObj.time || '-'}</div>
      </div>
      <div class="signature">
        <strong>For SELLIAMMAN TEXTILES</strong>
        <div style="margin-top: 30px; font-size: 11px;">Authorised Signatory</div>
      </div>
    </div>
  </div>
</body>
</html>
    `;
  };

  const handleDownloadPDF = async (ret) => {
    let supData = ret.supplierId || {};
    // If supplierId is just ID string, find from state or fetch
    if (typeof ret.supplierId === 'string') {
      const match = suppliers.find(s => s._id === ret.supplierId);
      if (match) supData = match;
      else {
        try {
          const fetched = await yarnSupplierService.getSupplier(ret.supplierId);
          if (fetched.success) supData = fetched.data;
        } catch (e) {}
      }
    }

    const printContent = generatePDFTemplate(ret, supData);
    const element = document.createElement('div');
    element.innerHTML = printContent;
    
    const sanitizeName = (supData.supplierName || 'Supplier').replace(/[^a-zA-Z0-9]/g, '');
    const cleanDate = new Date(ret.date).toISOString().split('T')[0];
    
    const opt = {
      margin: 10,
      filename: `YarnReturn_${sanitizeName}_${cleanDate}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a5', orientation: 'landscape' }
    };

    html2pdf().set(opt).from(element).save();
  };

  return (
    <Container fluid className="p-4 pt-5 mt-4">
      <Row className="mb-4 align-items-center">
        <Col>
          <h2 className="page-header text-primary fw-bold">Yarn Returns (Delivery Memo)</h2>
          <p className="text-muted">Manage yarn returns and generate delivery memos</p>
        </Col>
      </Row>

      {toast.show && <Toast message={toast.message} type={toast.type} onClose={() => setToast({ show: false, message: '', type: 'success' })} />}

      <Row>
        <Col lg={4}>
          <Card className="shadow-sm border-0 mb-4">
            <Card.Header className="bg-white border-bottom-0 pt-4 pb-0">
              <h5 className="mb-0 text-primary fw-bold">New Return</h5>
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
                <Form.Group className="mb-3">
                  <Form.Label>Description <span className="text-danger">*</span></Form.Label>
                  <Form.Control as="textarea" rows={2} name="description" value={formData.description} onChange={handleChange} required placeholder="Reason for return, yarn details..." />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Quantity (Kgs) <span className="text-danger">*</span></Form.Label>
                  <Form.Control type="number" step="0.01" name="quantity" value={formData.quantity} onChange={handleChange} required />
                </Form.Group>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-4">
                      <Form.Label>Vehicle No</Form.Label>
                      <Form.Control type="text" name="vehicleNo" value={formData.vehicleNo} onChange={handleChange} />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-4">
                      <Form.Label>Time</Form.Label>
                      <Form.Control type="time" name="time" value={formData.time} onChange={handleChange} />
                    </Form.Group>
                  </Col>
                </Row>
                
                <Button variant="primary" type="submit" className="w-100 py-2 fw-bold">Save Return</Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={8}>
          <Card className="shadow-sm border-0 h-100">
            <Card.Body className="p-0">
              {fetching ? (
                <div className="text-center p-5">Loading returns...</div>
              ) : returns.length === 0 ? (
                <div className="text-center p-5 text-muted">No returns logged.</div>
              ) : (
                <Table responsive hover className="mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th className="border-0 px-4 py-3">Date</th>
                      <th className="border-0 py-3">Supplier</th>
                      <th className="border-0 py-3">Design No</th>
                      <th className="border-0 py-3">Qty</th>
                      <th className="border-0 px-4 py-3 text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {returns.map(r => (
                      <tr key={r._id} className="align-middle">
                        <td className="px-4 fw-bold">{new Date(r.date).toLocaleDateString()}</td>
                        <td>{r.supplierId?.supplierName || 'Unknown'}</td>
                        <td>{r.designNo}</td>
                        <td>{r.quantity}</td>
                        <td className="px-4 text-end">
                          <Button variant="outline-info" size="sm" className="me-2" onClick={() => handleDownloadPDF(r)}>PDF Memo</Button>
                          <Button variant="outline-danger" size="sm" onClick={() => handleDelete(r._id)}>Remove</Button>
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

export default YarnReturns;
