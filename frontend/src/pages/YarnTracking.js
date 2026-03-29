import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge } from 'react-bootstrap';
import { yarnPurchaseService } from '../services/yarnPurchaseService';
import { yarnReturnService } from '../services/yarnReturnService';
import { orderService } from '../services/orderService';
import Toast from '../components/Toast';

const YarnTracking = () => {
  const [trackingData, setTrackingData] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setFetching(true);
      const [purRes, retRes, ordRes] = await Promise.all([
        yarnPurchaseService.getPurchases(),
        yarnReturnService.getReturns(),
        orderService.getOrders()
      ]);

      const purchases = purRes.success ? purRes.data : [];
      const returns = retRes.success ? retRes.data : [];
      const orders = ordRes.success ? ordRes.data : [];

      // Extract unique design numbers from all sources
      const designNos = new Set();
      purchases.forEach(p => designNos.add(p.designNo));
      returns.forEach(r => designNos.add(r.designNo));
      orders.forEach(o => designNos.add(o.designNo));

      // Build unified state array
      const aggregatedData = Array.from(designNos).map(designNo => {
        const matchingPurchases = purchases.filter(p => p.designNo === designNo);
        const matchingReturns = returns.filter(r => r.designNo === designNo);
        
        const purchasedQty = matchingPurchases.reduce((sum, p) => sum + (Number(p.quantity) || 0), 0);
        const returnedQty = matchingReturns.reduce((sum, r) => sum + (Number(r.quantity) || 0), 0);
        const usedQty = 0; // Configured to 0 structurally initially as requested
        
        const balanceQty = purchasedQty - returnedQty - usedQty;

        let status = 'In-Stock';
        if (balanceQty === 0 && purchasedQty > 0) status = 'Exhausted';
        else if (balanceQty < 0) status = 'Deficit';
        else if (purchasedQty === 0) status = 'No Intake';

        return {
          designNo,
          purchasedQty,
          returnedQty,
          usedQty,
          balanceQty,
          status
        };
      });

      // Filter out empty rows where there are zero transactions
      setTrackingData(aggregatedData.filter(d => d.purchasedQty > 0 || d.returnedQty > 0 || d.usedQty > 0));

    } catch (err) {
      showToast('failed to compile tracking data', 'danger');
    } finally {
      setFetching(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  return (
    <Container fluid className="p-4 pt-5 mt-4">
      <Row className="mb-4 align-items-center">
        <Col>
          <h2 className="page-header text-primary fw-bold">Yarn Tracking Overview</h2>
          <p className="text-muted">High-level yarn balance tracking per design</p>
        </Col>
      </Row>

      {toast.show && <Toast message={toast.message} type={toast.type} onClose={() => setToast({ show: false, message: '', type: 'success' })} />}

      <Row>
        <Col>
          <Card className="shadow-sm border-0 h-100">
            <Card.Body className="p-2">
              {fetching ? (
                <div className="text-center p-5">Loading tracking matrix...</div>
              ) : trackingData.length === 0 ? (
                <div className="text-center p-5 text-muted">No yarn transactions to track.</div>
              ) : (
                <Table responsive hover className="mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th className="border-0 px-4 py-3">Design No</th>
                      <th className="border-0 py-3">Purchased Qty (Kgs)</th>
                      <th className="border-0 py-3">Returned Qty (Kgs)</th>
                      <th className="border-0 py-3">Used Qty (Kgs)</th>
                      <th className="border-0 py-3 fw-bold">Balance Qty (Kgs)</th>
                      <th className="border-0 px-4 py-3 text-end">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trackingData.map(d => (
                      <tr key={d.designNo} className="align-middle">
                        <td className="px-4 fw-bold">{d.designNo}</td>
                        <td className="text-success fw-bold">+{d.purchasedQty.toFixed(2)}</td>
                        <td className="text-danger fw-bold">-{d.returnedQty.toFixed(2)}</td>
                        <td className="text-secondary">{d.usedQty.toFixed(2)}</td>
                        <td className="fw-bold fs-6">
                          {d.balanceQty.toFixed(2)}
                        </td>
                        <td className="px-4 text-end">
                          <Badge 
                            bg={d.status === 'In-Stock' ? 'success' : d.status === 'Exhausted' ? 'secondary' : 'warning'}
                            pill
                            className="px-3 py-2"
                          >
                            {d.status}
                          </Badge>
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

export default YarnTracking;
