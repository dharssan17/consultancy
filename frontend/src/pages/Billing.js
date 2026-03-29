import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Table, Row, Col, Modal, Alert } from 'react-bootstrap';
import { invoiceService } from '../services/invoiceService';
import { orderService } from '../services/orderService';
import { deliveryService } from '../services/deliveryService';
import { customerService } from '../services/customerService';
import { authService } from '../services/authService';
import Toast from '../components/Toast';
import html2pdf from 'html2pdf.js';

const Billing = () => {
  const [formData, setFormData] = useState({
    orderId: '',
    designNo: '',
    customerName: '',
    customerAddress: '',
    customerGstin: '',
    description: '',
    hsnCode: '',
    date: new Date().toISOString().split('T')[0],
    ratePerMeter: '',
    deliveredMtrs: '',
    subTotal: 0,
    gstAmount: 0,
    grandTotal: 0,
  });
  const [orders, setOrders] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetchingOrders, setFetchingOrders] = useState(true);
  const [fetchingInvoices, setFetchingInvoices] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', variant: 'success' });
  const [viewModal, setViewModal] = useState({ show: false, invoice: null });
  const user = authService.getCurrentUser();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchOrders();
    fetchInvoices();
  }, []);

  useEffect(() => {
    if (formData.orderId) {
      fetchOrderDetails(formData.orderId);
    } else {
      setFormData(prev => ({ ...prev, designNo: '', customerName: '', deliveredMtrs: '' }));
    }
  }, [formData.orderId]);

  useEffect(() => {
    // Auto-calculate totals when rate or delivered meters change
    if (formData.ratePerMeter && formData.deliveredMtrs) {
      const rate = parseFloat(formData.ratePerMeter) || 0;
      const mtrs = parseFloat(formData.deliveredMtrs) || 0;
      const subTotal = rate * mtrs;
      const gstAmount = subTotal * 0.18; // 18% GST
      const grandTotal = subTotal + gstAmount;

      setFormData(prev => ({
        ...prev,
        subTotal: subTotal.toFixed(2),
        gstAmount: gstAmount.toFixed(2),
        grandTotal: grandTotal.toFixed(2),
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        subTotal: 0,
        gstAmount: 0,
        grandTotal: 0,
      }));
    }
  }, [formData.ratePerMeter, formData.deliveredMtrs]);

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
        let address = '';
        let gstin = '';
        const custId = response.data.customerId?._id || response.data.customerId;
        if (custId) {
          try {
            const custResponse = await customerService.getCustomer(custId);
            if (custResponse.success) {
              address = custResponse.data.address || '';
              gstin = custResponse.data.gstin || '';
            }
          } catch (e) { console.error('[DEBUG] Failed to fetch customer', e); }
        }

        setFormData(prev => ({
          ...prev,
          designNo: response.data.designNo,
          customerName: response.data.buyerName,
          customerAddress: address,
          customerGstin: gstin,
        }));

        // Fetch delivered meters for this design number correctly from deliveries
        try {
          const deliveryResponse = await deliveryService.getDeliveries();
          const totalDeliveredMtrs = (deliveryResponse.success && deliveryResponse.data && deliveryResponse.data.length > 0)
            ? deliveryResponse.data
              .filter(d => d.designNo === response.data.designNo)
              .reduce((sum, d) => sum + ((d.totalMts || d.totalMtrs || d.mtrs) || 0), 0)
            : 0;

          setFormData(prev => ({
            ...prev,
            deliveredMtrs: totalDeliveredMtrs > 0 ? totalDeliveredMtrs : '',
          }));
        } catch (error) {
          setFormData(prev => ({
            ...prev,
            deliveredMtrs: '',
          }));
        }
      }
    } catch (error) {
      // Silently fail
    }
  };

  const fetchInvoices = async () => {
    try {
      setFetchingInvoices(true);
      const response = await invoiceService.getInvoices();
      if (response.success) {
        // Sort by date descending (newest first)
        const sorted = (response.data || []).sort((a, b) => {
          return new Date(b.date) - new Date(a.date);
        });
        setInvoices(sorted);
      }
    } catch (error) {
      showToast('Unable to load .', 'danger');
    } finally {
      setFetchingInvoices(false);
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
    if (!formData.customerName || !formData.customerName.trim()) {
      newErrors.customerName = 'Customer name is required';
    }
    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    if (!formData.description || !formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    // Numeric validations - must be positive
    if (!formData.ratePerMeter || parseFloat(formData.ratePerMeter) <= 0 || isNaN(parseFloat(formData.ratePerMeter))) {
      newErrors.ratePerMeter = 'Rate per meter must be a positive number';
    }
    if (!formData.deliveredMtrs || parseFloat(formData.deliveredMtrs) <= 0 || isNaN(parseFloat(formData.deliveredMtrs))) {
      newErrors.deliveredMtrs = 'Delivered meters must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Check if form is valid for button state
  const isFormValid = () => {
    return formData.orderId &&
      formData.designNo && formData.designNo.trim() &&
      formData.customerName && formData.customerName.trim() &&
      formData.date &&
      formData.description && formData.description.trim() &&
      formData.ratePerMeter && parseFloat(formData.ratePerMeter) > 0 &&
      formData.deliveredMtrs && parseFloat(formData.deliveredMtrs) > 0;
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
        customerName: formData.customerName,
        date: formData.date,
        ratePerMeter: parseFloat(formData.ratePerMeter),
        deliveredMtrs: parseFloat(formData.deliveredMtrs),
        description: formData.description.trim(),
        hsnCode: formData.hsnCode.trim(),
        status: 'draft',
      };

      const response = await invoiceService.createInvoice(submitData);
      if (response.success) {
        showToast('Invoice generated successfully', 'success');
        // Reset form
        setFormData({
          orderId: '',
          designNo: '',
          customerName: '',
          date: new Date().toISOString().split('T')[0],
          ratePerMeter: '',
          deliveredMtrs: '',
          description: '',
          hsnCode: '',
          subTotal: 0,
          gstAmount: 0,
          grandTotal: 0,
        });
        // Refresh invoice list
        fetchInvoices();
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Unable to .';
      showToast(errorMessage, 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (id) => {
    try {
      const response = await invoiceService.getInvoice(id);
      if (response.success) {
        setViewModal({ show: true, invoice: response.data });
      }
    } catch (error) {
      showToast('Unable to load .', 'danger');
    }
  };

  const fetchCustomerForInvoice = async (invoice) => {
    try {
      const orderResp = await orderService.getOrderDetails(invoice.orderId);
      if (orderResp.success) {
        const custId = orderResp.data.customerId?._id || orderResp.data.customerId;
        if (custId) {
          const custResp = await customerService.getCustomer(custId);
          if (custResp.success) {
            return { address: custResp.data.address || '', gstin: custResp.data.gstin || '' };
          }
        }
      }
    } catch (e) { console.error(e); }
    return { address: '', gstin: '' };
  };

  const handlePrint = async (invoice) => {
    const custData = await fetchCustomerForInvoice(invoice);
    const enrichedInvoice = { ...invoice, customerAddress: custData.address, customerGstin: custData.gstin };
    const printWindow = window.open('', '_blank');
    const printContent = generatePrintContent(enrichedInvoice);
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  const handleDownloadPDF = async (invoice) => {
    const custData = await fetchCustomerForInvoice(invoice);
    const enrichedInvoice = { ...invoice, customerAddress: custData.address, customerGstin: custData.gstin };
    const printContent = generatePrintContent(enrichedInvoice);

    // Create a temporary container
    const element = document.createElement('div');
    element.innerHTML = printContent;

    // Configure html2pdf options for exact A4 rendering
    const opt = {
      margin: 10,
      filename: `Invoice_${invoice.designNo}_${formatDateForFilename(invoice.date)}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
  };

  const numberToWords = (num) => {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    if ((num = num.toString()).length > 9) return 'overflow';
    let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return;
    let str = '';
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
    str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
    return str.trim() + ' Rupees Only';
  };

  const generatePrintContent = (invoice) => {
    const cgst = parseFloat(invoice.gstAmount) / 2;
    const sgst = parseFloat(invoice.gstAmount) / 2;
    const totalAmount = Math.round(parseFloat(invoice.grandTotal));
    const roundOff = (totalAmount - parseFloat(invoice.grandTotal)).toFixed(2);
    const amountInWords = numberToWords(totalAmount);

    return `
<!DOCTYPE html>
<html>
<head>
  <title>Invoice - ${invoice.designNo}</title>
  <style>
    @media print {
      @page { margin: 10mm; size: A4; }
      body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
    body {
      font-family: "Times New Roman", Times, serif;
      max-width: 210mm;
      margin: 0 auto;
      padding: 20px;
      color: #000;
      font-size: 12px;
    }
    .invoice-box {
      border: 2px solid #000;
      width: 100%;
      box-sizing: border-box;
    }
    .header-section {
      text-align: center;
      border-bottom: 2px solid #000;
      padding: 10px;
      position: relative;
    }
    .gstin-top {
      position: absolute;
      top: 10px;
      left: 10px;
      font-weight: bold;
      font-family: Arial, sans-serif;
    }
    .tax-invoice-label {
      font-weight: bold;
      text-decoration: underline;
      font-size: 14px;
      margin-bottom: 5px;
    }
    .company-name {
      font-size: 28px;
      font-weight: bold;
      margin: 5px 0;
      font-family: Arial, sans-serif;
      letter-spacing: 1px;
    }
    .company-details {
      font-size: 11px;
      line-height: 1.4;
    }
    .info-section {
      display: flex;
      border-bottom: 2px solid #000;
    }
    .customer-info {
      flex: 1;
      border-right: 2px solid #000;
      padding: 10px;
    }
    .invoice-details {
      flex: 1;
      padding: 0;
    }
    .detail-row {
      display: flex;
      border-bottom: 1px solid #000;
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .detail-label {
      width: 40%;
      padding: 5px 10px;
      border-right: 1px solid #000;
    }
    .detail-value {
      width: 60%;
      padding: 5px 10px;
      font-weight: bold;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }
    th, td {
      border: 1px solid #000;
      border-left: none;
      padding: 8px 5px;
      text-align: center;
    }
    th:last-child, td:last-child {
      border-right: none;
    }
    th {
      font-weight: bold;
      background-color: #fff;
    }
    .desc-col { width: 35%; text-align: left; padding-left: 10px; }
    .amount-col { text-align: right; padding-right: 10px; }
    
    .calculation-section {
      display: flex;
      border-top: 2px solid #000;
    }
    .amount-words-bank {
      flex: 65%;
      border-right: 2px solid #000;
      padding: 10px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .calc-table {
      flex: 35%;
    }
    .calc-row {
      display: flex;
      border-bottom: 1px solid #000;
    }
    .calc-row:last-child {
      border-bottom: none;
      font-weight: bold;
      border-top: 2px solid #000;
      font-size: 14px;
    }
    .calc-label {
      width: 60%;
      padding: 5px;
      text-align: right;
      border-right: 1px solid #000;
    }
    .calc-val {
      width: 40%;
      padding: 5px 10px;
      text-align: right;
    }
    .footer-auth {
      border-top: 2px solid #000;
      display: flex;
    }
    .terms {
      flex: 65%;
      padding: 10px;
      border-right: 2px solid #000;
      font-size: 10px;
    }
    .signature {
      flex: 35%;
      padding: 10px;
      text-align: center;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-height: 80px;
    }
    .bank-details {
      margin-top: 15px;
      border-top: 1px dashed #000;
      padding-top: 10px;
    }
  </style>
</head>
<body>
  <div class="invoice-box">
    <!-- Header -->
    <div class="header-section">
      <div class="gstin-top">GSTIN: 33XXXXXXXXXXXXX</div>
      <div class="tax-invoice-label">TAX INVOICE</div>
      <div class="company-name">SELLIAMMAN TEXTILES</div>
      <div class="company-details">
        123, Weaver's Street, Textile City, 638183<br>
        Email: info@selliammantextiles.com | Mobile: +91 99999 99999, 99999 99999
      </div>
    </div>

    <!-- Info Section -->
    <div class="info-section">
      <div class="customer-info">
        <div><strong>To:</strong></div>
        <div style="font-size: 16px; font-weight: bold; margin-top: 5px;">${invoice.customerName}</div>
        <div style="margin-top: 5px; white-space: pre-wrap;">${invoice.customerAddress || 'Address not available'}</div>
        <div style="margin-top: 5px;">
          <strong>GSTIN:</strong> ${invoice.customerGstin || 'Not Provided'}
        </div>
      </div>
      <div class="invoice-details">
        <div class="detail-row">
          <div class="detail-label">Invoice No:</div>
          <div class="detail-value">INV-${invoice._id.toString().slice(-6).toUpperCase()}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Date:</div>
          <div class="detail-value">${formatDate(invoice.date)}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Buyer Order No:</div>
          <div class="detail-value">${invoice.designNo}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Mode/Terms of Payment:</div>
          <div class="detail-value">Net 30 Days</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">State Code:</div>
          <div class="detail-value">33</div>
        </div>
      </div>
    </div>

    <!-- Table -->
    <table style="border-bottom: none; min-height: 300px;">
      <thead>
        <tr style="border-bottom: 2px solid #000;">
          <th style="width: 8%;">S.No</th>
          <th class="desc-col">Description of Goods</th>
          <th style="width: 12%;">HSN/SAC</th>
          <th style="width: 15%;">Metres</th>
          <th style="width: 15%;">Rate</th>
          <th style="width: 15%;">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr style="height: 250px; vertical-align: top;">
          <td>1</td>
          <td class="desc-col">
            <strong>${invoice.description || ''}</strong><br>
            Design No: ${invoice.designNo}
          </td>
          <td>${invoice.hsnCode || '-'}</td>
          <td>${invoice.deliveredMtrs.toFixed(2)}</td>
          <td>₹${invoice.ratePerMeter.toFixed(2)}</td>
          <td class="amount-col">₹${parseFloat(invoice.subTotal).toFixed(2)}</td>
        </tr>
      </tbody>
    </table>

    <!-- Calculations -->
    <div class="calculation-section">
      <div class="amount-words-bank">
        <div>
          <strong>Amount Chargeable (in words):</strong><br>
          <em>${amountInWords}</em>
        </div>
        <div class="bank-details">
          <strong>Bank Details:</strong><br>
          Bank Name: HDFC Bank Ltd<br>
          A/c No: 50200000000000<br>
          IFSC: HDFC0001234
        </div>
      </div>
      <div class="calc-table">
        <div class="calc-row">
          <div class="calc-label">Total Amount Before Tax</div>
          <div class="calc-val">₹${parseFloat(invoice.subTotal).toFixed(2)}</div>
        </div>
        <div class="calc-row">
          <div class="calc-label">Add: CGST @ 9%</div>
          <div class="calc-val">₹${cgst.toFixed(2)}</div>
        </div>
        <div class="calc-row">
          <div class="calc-label">Add: SGST @ 9%</div>
          <div class="calc-val">₹${sgst.toFixed(2)}</div>
        </div>
        <div class="calc-row">
          <div class="calc-label">Round Off</div>
          <div class="calc-val">${Number(roundOff) > 0 ? '+' : ''}${roundOff}</div>
        </div>
        <div class="calc-row">
          <div class="calc-label">Total Amount After Tax</div>
          <div class="calc-val">₹${totalAmount.toFixed(2)}</div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer-auth">
      <div class="terms">
      </div>
      <div class="signature">
        <strong>For SELLIAMMAN TEXTILES</strong>
        <div style="margin-top: 40px; font-size: 11px;">Authorised Signatory</div>
      </div>
    </div>
  </div>
</body>
</html>
    `;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB');
  };

  const formatDateForFilename = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  };

  const showToast = (message, variant) => {
    setToast({ show: true, message, variant });
  };

  const hideToast = () => {
    setToast({ ...toast, show: false });
  };

  return (
    <div>
      <h2 className="mb-4 text-dark-blue fw-bold">Billing / Invoice Management</h2>

      <Toast
        show={toast.show}
        message={toast.message}
        variant={toast.variant}
        onClose={hideToast}
      />

      {/* SECTION A - Invoice Generator (Admin Only) */}
      {isAdmin ? (
        <Card className="mb-4">
          <Card.Header>
            <h5 className="mb-0">Invoice Generator</h5>
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
                      Customer Name <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="customerName"
                      value={formData.customerName}
                      readOnly
                      isInvalid={!!errors.customerName}
                      style={{ backgroundColor: '#f8f9fa' }}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.customerName}
                    </Form.Control.Feedback>
                  </Form.Group>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Address</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={2}
                          value={formData.customerAddress}
                          readOnly
                          style={{ backgroundColor: '#f8f9fa' }}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>GSTIN</Form.Label>
                        <Form.Control
                          type="text"
                          value={formData.customerGstin}
                          readOnly
                          style={{ backgroundColor: '#f8f9fa' }}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Col>
              </Row>

              <Row>
                <Col md={8}>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      Description of Goods <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      isInvalid={!!errors.description}
                      placeholder="Enter description of goods"
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.description}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>HSN Code</Form.Label>
                    <Form.Control
                      type="text"
                      name="hsnCode"
                      value={formData.hsnCode}
                      onChange={handleChange}
                      placeholder="Enter HSN Code (optional)"
                    />
                  </Form.Group>
                </Col>
              </Row>

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
                      Delivered Mtrs <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="number"
                      name="deliveredMtrs"
                      value={formData.deliveredMtrs}
                      onChange={handleChange}
                      isInvalid={!!errors.deliveredMtrs}
                      placeholder="Auto-filled from deliveries"
                      min="0"
                      step="0.01"
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.deliveredMtrs}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      Rate Per Meter <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="number"
                      name="ratePerMeter"
                      value={formData.ratePerMeter}
                      onChange={handleChange}
                      isInvalid={!!errors.ratePerMeter}
                      placeholder="Enter rate per meter"
                      min="0"
                      step="0.01"
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.ratePerMeter}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>

              <Alert variant="info" className="mb-3">
                <Row>
                  <Col md={4}>
                    <strong>Subtotal:</strong> ₹{parseFloat(formData.subTotal || 0).toFixed(2)}
                  </Col>
                  <Col md={4}>
                    <strong>GST (18%):</strong> ₹{parseFloat(formData.gstAmount || 0).toFixed(2)}
                  </Col>
                  <Col md={4}>
                    <strong>Grand Total:</strong> ₹{parseFloat(formData.grandTotal || 0).toFixed(2)}
                  </Col>
                </Row>
              </Alert>

              <div className="d-flex gap-2">
                <Button variant="primary" type="submit" disabled={loading || !isFormValid()}>
                  {loading ? 'Generating...' : 'Generate Invoice'}
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      ) : (
        <Card className="mb-4">
          <Card.Body>
            <Alert variant="info">
              <strong>Access Restricted:</strong> Only administrators can generate invoices.
            </Alert>
          </Card.Body>
        </Card>
      )}

      {/* SECTION B - Invoice Table */}
      <Card>
        <Card.Header>
          <h5 className="mb-0">Invoice List</h5>
        </Card.Header>
        <Card.Body>
          {fetchingInvoices ? (
            <div className="text-center p-4">Loading...</div>
          ) : invoices.length === 0 ? (
            <div className="text-center p-4">
              <p>No invoices found.</p>
            </div>
          ) : (
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Design No</th>
                  <th>Customer</th>
                  <th>Grand Total</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice._id}>
                    <td>{formatDate(invoice.date)}</td>
                    <td>{invoice.designNo}</td>
                    <td>{invoice.customerName}</td>
                    <td>₹{invoice.grandTotal?.toFixed(2)}</td>
                    <td>
                      <Button
                        variant="outline-info"
                        size="sm"
                        className="me-2"
                        onClick={() => handleView(invoice._id)}
                      >
                        View
                      </Button>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="me-2"
                        onClick={() => handlePrint(invoice)}
                      >
                        Print
                      </Button>
                      <Button
                        variant="outline-success"
                        size="sm"
                        onClick={() => handleDownloadPDF(invoice)}
                      >
                        Download PDF
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* View Modal */}
      <Modal show={viewModal.show} onHide={() => setViewModal({ show: false, invoice: null })} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Invoice Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {viewModal.invoice && (
            <div>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Date:</strong> {formatDate(viewModal.invoice.date)}
                </Col>
                <Col md={6}>
                  <strong>Design No:</strong> {viewModal.invoice.designNo}
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Customer:</strong> {viewModal.invoice.customerName}
                </Col>
                <Col md={6}>
                  <strong>Status:</strong> {viewModal.invoice.status.toUpperCase()}
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Rate Per Meter:</strong> ₹{viewModal.invoice.ratePerMeter?.toFixed(2)}
                </Col>
                <Col md={6}>
                  <strong>Delivered Mtrs:</strong> {viewModal.invoice.deliveredMtrs?.toFixed(2)}
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={4}>
                  <strong>Subtotal:</strong> ₹{viewModal.invoice.subTotal?.toFixed(2)}
                </Col>
                <Col md={4}>
                  <strong>GST (18%):</strong> ₹{viewModal.invoice.gstAmount?.toFixed(2)}
                </Col>
                <Col md={4}>
                  <strong>Grand Total:</strong> ₹{viewModal.invoice.grandTotal?.toFixed(2)}
                </Col>
              </Row>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setViewModal({ show: false, invoice: null })}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Billing;



