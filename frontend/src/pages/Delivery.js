import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Table, Row, Col, Alert } from 'react-bootstrap';
import { deliveryService } from '../services/deliveryService';
import { orderService } from '../services/orderService';
import { customerService } from '../services/customerService';
import { productionService } from '../services/productionService';
import Toast from '../components/Toast';
import html2pdf from 'html2pdf.js';

const Delivery = () => {
  const [formData, setFormData] = useState({
    customerId: '',
    orderId: '',
    designNo: '',
    buyerName: '',
    date: new Date().toISOString().split('T')[0],
    quality: '',
    vehicleNo: '',
    rows: [{ loomNo: '', kg: '', mts: '', cm: '' }]
  });
  
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', variant: 'success' });
  const [remainingMtrs, setRemainingMtrs] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (formData.orderId) {
      fetchOrderDetails(formData.orderId);
    } else {
      setRemainingMtrs(null);
    }
  }, [formData.orderId]);

  const fetchInitialData = async () => {
    try {
      setFetchingData(true);
      const [orderRes, custRes, delRes] = await Promise.all([
        orderService.getOrdersDropdown().catch(() => ({ success: false, data: [] })),
        customerService.getCustomers().catch(() => ({ success: false, data: [] })),
        deliveryService.getDeliveries().catch(() => ({ success: false, data: [] }))
      ]);

      if (orderRes.success) setOrders(orderRes.data);
      if (custRes.success) setCustomers(custRes.data);
      if (delRes.success) {
        const sorted = (delRes.data || []).sort((a, b) => new Date(b.date) - new Date(a.date));
        setDeliveries(sorted);
      }
    } catch (error) {
      showToast('Error loading data.', 'danger');
    } finally {
      setFetchingData(false);
    }
  };

  const fetchDeliveriesList = async () => {
    try {
      const response = await deliveryService.getDeliveries();
      if (response.success) {
        const sorted = (response.data || []).sort((a, b) => new Date(b.date) - new Date(a.date));
        setDeliveries(sorted);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchOrderDetails = async (orderId) => {
    try {
      const response = await orderService.getOrderDetails(orderId);
      if (response.success) {
        const customerId = response.data.customerId?._id || response.data.customerId;
        setFormData(prev => ({
          ...prev,
          designNo: response.data.designNo,
          buyerName: response.data.buyerName || (customers.find(c => c._id === customerId)?.name || ''),
        }));

        try {
          const productionResponse = await productionService.getProductions();
          const totalProducedMtrs = (productionResponse.success && productionResponse.data && productionResponse.data.length > 0)
            ? productionResponse.data
                .filter(p => p.designNo === response.data.designNo)
                .reduce((sum, p) => sum + (Number(p.todayMtrs) || 0), 0)
            : 0;

          const deliveryResponse = await deliveryService.getDeliveries();
          const totalDeliveredMtrs = (deliveryResponse.success && deliveryResponse.data && deliveryResponse.data.length > 0)
            ? deliveryResponse.data
                .filter(d => d.designNo === response.data.designNo)
                .reduce((sum, d) => sum + ((d.totalMts || d.totalMtrs || d.mtrs) || 0), 0)
            : 0;
            
          const calculatedRemaining = totalProducedMtrs - totalDeliveredMtrs;
          setRemainingMtrs(calculatedRemaining > 0 ? calculatedRemaining : 0);
        } catch (error) {
          setRemainingMtrs(0);
        }
      }
    } catch (error) {
      setRemainingMtrs(0);
    }
  };

  const calculateTotalMtrs = () => {
    return formData.rows.reduce((sum, row) => sum + (parseFloat(row.mts) || 0), 0);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let updates = { [name]: value };

    // Auto-select Customer if Order is selected, or loosely bind.
    if (name === 'orderId') {
      const selectedOrder = orders.find(o => o._id === value || o.id === value);
      if (selectedOrder) {
        updates.designNo = selectedOrder.designNo;
      }
    }
    
    // Set buyerName if customerId explicitly changed
    if (name === 'customerId') {
      const selectedCust = customers.find(c => c._id === value);
      if (selectedCust) {
        updates.buyerName = selectedCust.name;
      }
    }

    setFormData({ ...formData, ...updates });
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleRowChange = (index, field, value) => {
    const newRows = [...formData.rows];
    newRows[index][field] = value;
    setFormData({ ...formData, rows: newRows });
  };

  const addRow = () => {
    setFormData({
      ...formData,
      rows: [...formData.rows, { loomNo: '', kg: '', mts: '', cm: '' }]
    });
  };

  const removeRow = (index) => {
    if (formData.rows.length <= 1) return;
    const newRows = formData.rows.filter((_, i) => i !== index);
    setFormData({ ...formData, rows: newRows });
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.customerId && !formData.orderId) {
      newErrors.customerId = 'Customer or Design No is required';
    }
    if (!formData.quality || !formData.quality.trim()) {
      newErrors.quality = 'Quality is required';
    }
    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    const rowErrors = [];
    formData.rows.forEach((row, idx) => {
      const rowErr = {};
      if (!row.loomNo || !row.loomNo.trim()) rowErr.loomNo = 'Required';
      if (!row.kg || parseFloat(row.kg) <= 0 || isNaN(parseFloat(row.kg))) rowErr.kg = 'Invalid';
      if (!row.mts || parseFloat(row.mts) <= 0 || isNaN(parseFloat(row.mts))) rowErr.mts = 'Invalid';
      if (Object.keys(rowErr).length > 0) rowErrors[idx] = rowErr;
    });

    if (rowErrors.length > 0) {
      newErrors.rows = rowErrors;
    }

    const currentMts = calculateTotalMtrs();
    if (remainingMtrs !== null && formData.designNo && currentMts > remainingMtrs) {
      newErrors.totalMts = `Total generated meters (${currentMts.toFixed(2)}) exceeds remaining (${remainingMtrs.toFixed(2)})`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isFormValid = () => {
    return formData.date && formData.quality && (formData.customerId || formData.orderId) && formData.rows.every(r => r.loomNo && parseFloat(r.kg) > 0 && parseFloat(r.mts) > 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      const submitData = {
        customerId: formData.customerId || undefined,
        orderId: formData.orderId || undefined,
        designNo: formData.designNo || 'Direct',
        buyerName: formData.buyerName,
        date: formData.date,
        quality: formData.quality,
        vehicleNo: formData.vehicleNo,
        rows: formData.rows.map(r => ({
          loomNo: r.loomNo,
          kg: parseFloat(r.kg),
          mts: parseFloat(r.mts),
          cm: r.cm ? parseFloat(r.cm) : null
        }))
      };

      const response = await deliveryService.createDelivery(submitData);
      if (response.success) {
        showToast('Delivery slip saved successfully', 'success');
        setFormData({
          customerId: '',
          orderId: '',
          designNo: '',
          buyerName: '',
          date: new Date().toISOString().split('T')[0],
          quality: '',
          vehicleNo: '',
          rows: [{ loomNo: '', kg: '', mts: '', cm: '' }]
        });
        setRemainingMtrs(null);
        fetchDeliveriesList();
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Unable to save delivery', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB');
  };

  const generatePrintContent = (delivery) => {
    const customer = customers.find(c => c._id === (delivery.customerId?._id || delivery.customerId));
    const toAddress = customer ? customer.address : delivery.buyerName;
    const gstin = customer ? customer.gstin : '';
    const dateFormatted = formatDate(delivery.date);
    const slipNo = delivery._id.toString().slice(-6).toUpperCase();

    const rowsHtml = (delivery.rows || []).map((row, index) => `
      <tr>
        <td style="text-align:center;">${index + 1}</td>
        <td style="text-align:center;">${row.loomNo}</td>
        <td style="text-align:right;">${row.kg.toFixed(2)}</td>
        <td style="text-align:right;">${row.mts.toFixed(2)}</td>
        <td style="text-align:right;">${row.cm ? row.cm : '-'}</td>
      </tr>
    `).join('');

    const emptyRowsCount = Math.max(0, 15 - (delivery.rows?.length || 0));
    const emptyRowsHtml = Array(emptyRowsCount).fill(`
      <tr>
        <td>&nbsp;</td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Delivery Slip - ${delivery.designNo}</title>
        <style>
          @media print {
            @page { margin: 10mm; size: A4 portrait; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
          body {
            font-family: Arial, sans-serif;
            max-width: 210mm;
            margin: 0 auto;
            color: #000;
            font-size: 14px;
          }
          .container {
            border: 2px solid #000;
            padding: 10px;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
            position: relative;
          }
          .gstin {
            position: absolute;
            top: 0;
            left: 0;
            font-weight: bold;
            font-size: 12px;
          }
          .title-tag {
            font-weight: bold;
            text-decoration: underline;
            letter-spacing: 1px;
            margin-bottom: 5px;
            display: inline-block;
          }
          .company-name {
            font-size: 24px;
            font-weight: bold;
            margin: 5px 0;
          }
          .company-address {
            font-size: 12px;
          }
          .info-section {
            display: flex;
            border-bottom: 2px solid #000;
          }
          .left-info {
            flex: 60%;
            border-right: 2px solid #000;
            padding: 10px;
          }
          .right-info {
            flex: 40%;
            padding: 10px;
          }
          .info-row {
            margin-bottom: 5px;
          }
          .info-label {
            font-weight: bold;
            width: 80px;
            display: inline-block;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th, td {
            border: 1px solid #000;
            padding: 5px;
          }
          th {
            background-color: #f0f0f0;
            font-weight: bold;
            text-align: center;
          }
          .total-row td {
            font-weight: bold;
            border-top: 2px solid #000;
            border-bottom: 2px solid #000;
          }
          .footer {
            display: flex;
            justify-content: space-between;
            margin-top: 50px;
            padding: 0 20px 20px 20px;
          }
          .signature-box {
            text-align: center;
          }
          .auth-sign {
            margin-top: 60px;
            border-top: 1px dashed #000;
            padding-top: 5px;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="gstin">GSTIN: 33XXXXXXXXXXXXX</div>
            <div class="title-tag">DELIVERY SLIP</div>
            <div class="company-name">SELLIAMMAN TEXTILES</div>
            <div class="company-address">123, Weaver's Street, Textile City, 638183</div>
          </div>
          
          <div class="info-section">
            <div class="left-info">
              <div class="info-row">
                <span class="info-label">To:</span>
                <strong>${delivery.buyerName || 'Cash'}</strong>
              </div>
              <div style="padding-left: 80px; white-space: pre-wrap; font-size: 12px;">${toAddress || ''}</div>
              ${gstin ? `<div style="padding-left: 80px; font-size: 12px; margin-top: 5px;">GSTIN: ${gstin}</div>` : ''}
            </div>
            <div class="right-info">
              <div class="info-row"><span class="info-label">Slip No:</span> DS-${slipNo}</div>
              <div class="info-row"><span class="info-label">Date:</span> ${dateFormatted}</div>
              <div class="info-row"><span class="info-label">D.No:</span> <strong>${delivery.designNo}</strong></div>
              <div class="info-row"><span class="info-label">Quality:</span> ${delivery.quality}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 10%">S.No</th>
                <th style="width: 30%">Loom No</th>
                <th style="width: 20%">Weight (Kg)</th>
                <th style="width: 20%">Meters (Mts)</th>
                <th style="width: 20%">Centimeter (Cm)</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
              ${emptyRowsHtml}
              <tr class="total-row">
                <td colspan="2" style="text-align:right;"><strong>Total:</strong></td>
                <td style="text-align:right;">${(delivery.rows||[]).reduce((s,r)=>s+(Number(r.kg)||0),0).toFixed(2)}</td>
                <td style="text-align:right;">${delivery.totalMts?.toFixed(2) || (delivery.mtrs||0).toFixed(2)}</td>
                <td></td>
              </tr>
            </tbody>
          </table>

          <div style="padding: 10px; border-bottom: 2px solid #000;">
            <strong>Total Pieces / Rolls:</strong> ${delivery.totalPcs || (delivery.rows?.length || 1)}<br>
            <strong>Vehicle No:</strong> ${delivery.vehicleNo || '-'}
          </div>

          <div class="footer">
            <div class="signature-box">
              <br><br><br>
              <div style="border-top: 1px solid #000; padding-top: 5px;">Receiver's Signature</div>
            </div>
            <div class="signature-box">
              <div style="font-weight: bold;">For SELLIAMMAN TEXTILES</div>
              <br><br>
              <div style="border-top: 1px solid #000; padding-top: 5px;">Authorized Signatory</div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const handlePrint = (delivery) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(generatePrintContent(delivery));
    printWindow.document.close();
    printWindow.print();
  };

  const handleDownloadPDF = (delivery) => {
    const element = document.createElement('div');
    element.innerHTML = generatePrintContent(delivery);
    const opt = {
      margin: 5,
      filename: `DeliverySlip_${delivery.designNo}_${delivery.date.split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  const showToast = (message, variant) => setToast({ show: true, message, variant });

  return (
    <div>
      <h2 className="mb-4 text-dark-blue fw-bold">Delivery Slip Management</h2>
      <Toast show={toast.show} message={toast.message} variant={toast.variant} onClose={() => setToast({...toast, show: false})} />

      {/* Entry Form */}
      <Card className="mb-4 shadow-sm border-0">
        <Card.Header className="bg-light border-bottom border-primary border-3">
          <h5 className="mb-0 text-primary fw-bold">New Delivery Slip</h5>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Customer <span className="text-danger">*</span></Form.Label>
                  <Form.Select name="customerId" value={formData.customerId} onChange={handleChange} isInvalid={!!errors.customerId}>
                    <option value="">Select Customer</option>
                    {customers.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">{errors.customerId}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Design No (From Orders)</Form.Label>
                  <Form.Select name="orderId" value={formData.orderId} onChange={handleChange}>
                    <option value="">Select Order/DesignNo</option>
                    {orders.filter(o => !formData.customerId || (o.customerId?._id === formData.customerId || o.customerId === formData.customerId)).map(o => (
                      <option key={o.id || o._id} value={o.id || o._id}>{o.designNo}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Date <span className="text-danger">*</span></Form.Label>
                  <Form.Control type="date" name="date" value={formData.date} onChange={handleChange} isInvalid={!!errors.date} />
                  <Form.Control.Feedback type="invalid">{errors.date}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Vehicle No</Form.Label>
                  <Form.Control type="text" name="vehicleNo" value={formData.vehicleNo} onChange={handleChange} placeholder="Enter Vehicle No" />
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Quality <span className="text-danger">*</span></Form.Label>
                  <Form.Control type="text" name="quality" value={formData.quality} onChange={handleChange} isInvalid={!!errors.quality} placeholder="Enter Quality" />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Buyer Name (Auto)</Form.Label>
                  <Form.Control type="text" readOnly value={formData.buyerName} className="bg-light" />
                </Form.Group>
              </Col>
            </Row>

            {remainingMtrs !== null && (
              <Alert variant="info" className="mb-3 py-2">
                <strong>Remaining Order Meters:</strong> {remainingMtrs.toFixed(2)} mtrs available for delivery.
              </Alert>
            )}

            {errors.totalMts && <Alert variant="danger">{errors.totalMts}</Alert>}

            {/* Dynamic Rows Table */}
            <div className="table-responsive mt-3 mb-3 border rounded">
              <Table size="sm" className="mb-0">
                <thead className="bg-light">
                  <tr>
                    <th width="5%">S.No</th>
                    <th width="30%">Loom No <span className="text-danger">*</span></th>
                    <th width="20%">Kg <span className="text-danger">*</span></th>
                    <th width="25%">Mtrs <span className="text-danger">*</span></th>
                    <th width="15%">Cm</th>
                    <th width="5%"></th>
                  </tr>
                </thead>
                <tbody>
                  {formData.rows.map((row, index) => (
                    <tr key={index}>
                      <td className="align-middle text-center">{index + 1}</td>
                      <td>
                        <Form.Control size="sm" type="text" value={row.loomNo} onChange={e => handleRowChange(index, 'loomNo', e.target.value)} isInvalid={errors.rows?.[index]?.loomNo} />
                      </td>
                      <td>
                        <Form.Control size="sm" type="number" min="0" step="0.01" value={row.kg} onChange={e => handleRowChange(index, 'kg', e.target.value)} isInvalid={errors.rows?.[index]?.kg} />
                      </td>
                      <td>
                        <Form.Control size="sm" type="number" min="0" step="0.01" value={row.mts} onChange={e => handleRowChange(index, 'mts', e.target.value)} isInvalid={errors.rows?.[index]?.mts} />
                      </td>
                      <td>
                        <Form.Control size="sm" type="number" min="0" step="0.01" value={row.cm} onChange={e => handleRowChange(index, 'cm', e.target.value)} />
                      </td>
                      <td className="align-middle text-center">
                        {formData.rows.length > 1 && (
                          <Button variant="outline-danger" size="sm" onClick={() => removeRow(index)} className="px-2 py-0 fs-5 mb-1">&times;</Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-light">
                  <tr>
                    <td colSpan="6">
                      <Button variant="outline-secondary" size="sm" onClick={addRow} className="fw-bold">+ Add Row</Button>
                    </td>
                  </tr>
                </tfoot>
              </Table>
            </div>

            <Row className="mb-4 bg-light p-3 rounded mx-0 border">
              <Col md={6}><strong>Total Pieces/Rolls:</strong> {formData.rows.length}</Col>
              <Col md={6} className="text-end"><strong>Total Meters:</strong> {calculateTotalMtrs().toFixed(2)}</Col>
            </Row>

            <Button variant="primary" type="submit" disabled={loading || !isFormValid()} className="px-5 shadow-sm">
              {loading ? 'Saving...' : 'Save Delivery Slip'}
            </Button>
          </Form>
        </Card.Body>
      </Card>

      {/* List Table */}
      <Card className="shadow-sm border-0">
        <Card.Header className="bg-light border-bottom border-secondary border-3">
          <h5 className="mb-0 text-secondary fw-bold">Recent Deliveries</h5>
        </Card.Header>
        <Card.Body>
          {fetchingData ? (
            <div className="text-center p-4">Loading...</div>
          ) : deliveries.length === 0 ? (
            <div className="text-center p-4">No delivery entries found.</div>
          ) : (
            <div className="table-responsive">
              <Table striped bordered hover responsive>
                <thead className="table-light">
                  <tr>
                    <th>Date</th>
                    <th>To</th>
                    <th>Design No</th>
                    <th>Pcs</th>
                    <th>Total Mtrs</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {deliveries.map((del) => (
                    <tr key={del._id}>
                      <td>{formatDate(del.date)}</td>
                      <td>{del.buyerName || del.customerId?.name}</td>
                      <td>{del.designNo}</td>
                      <td>{del.totalPcs || del.rows?.length || 1}</td>
                      <td>{del.totalMts?.toFixed(2) || (del.mtrs||0).toFixed(2)}</td>
                      <td className="text-center">
                        <Button variant="outline-primary" size="sm" className="me-2" onClick={() => handlePrint(del)}>Print</Button>
                        <Button variant="outline-success" size="sm" onClick={() => handleDownloadPDF(del)}>PDF</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default Delivery;

