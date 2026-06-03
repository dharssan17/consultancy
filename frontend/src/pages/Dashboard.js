import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Spinner, Table, Badge, Container } from 'react-bootstrap';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, 
  PieChart, Pie, Cell, ResponsiveContainer 
} from 'recharts';
import { 
  LayoutDashboard, ShoppingCart, Factory, Truck, IndianRupee, Layers, 
  PackagePlus, PackageMinus, Activity, AlertCircle 
} from 'lucide-react';
import { orderService } from '../services/orderService';
import { productionService } from '../services/productionService';
import { deliveryService } from '../services/deliveryService';
import { invoiceService } from '../services/invoiceService';
import { yarnPurchaseService } from '../services/yarnPurchaseService';
import { yarnReturnService } from '../services/yarnReturnService';
import { authService } from '../services/authService';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
const PIE_COLORS = { Completed: '#10b981', 'In Progress': '#3b82f6', Pending: '#f59e0b' };

const Dashboard = () => {
  const user = authService.getCurrentUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [metrics, setMetrics] = useState({
    totalOrders: 0,
    totalProduction: 0,
    totalDelivered: 0,
    pendingMtrs: 0,
    totalRevenue: 0,
    yarnPurchased: 0,
    yarnReturned: 0,
    yarnBalance: 0,
  });

  const [charts, setCharts] = useState({
    prodVsDelivery: [],
    orderStatus: []
  });

  const [recentData, setRecentData] = useState({
    orders: [],
    deliveries: [],
    invoices: []
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel
      const [
        ordersRes, 
        prodRes, 
        delRes, 
        invRes, 
        yarnPurchRes, 
        yarnRetRes
      ] = await Promise.all([
        orderService.getOrders(),
        productionService.getProductions(),
        deliveryService.getDeliveries(),
        invoiceService.getInvoices(),
        yarnPurchaseService.getPurchases(),
        yarnReturnService.getReturns()
      ]);

      // Safely extract arrays
      const orders = ordersRes.data || ordersRes || [];
      const productions = prodRes.data || prodRes || [];
      const deliveries = delRes.data || delRes || [];
      const invoices = invRes.data || invRes || [];
      const yarnPurchases = yarnPurchRes.data || yarnPurchRes || [];
      const yarnReturns = yarnRetRes.data || yarnRetRes || [];

      calculateMetrics(orders, productions, deliveries, invoices, yarnPurchases, yarnReturns);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = (orders, productions, deliveries, invoices, yarnPurchases, yarnReturns) => {
    // 1. Summary Cards
    const totalOrders = orders.length;
    const totalProduction = productions.reduce((sum, p) => sum + (p.todayMtrs || 0), 0);
    const totalDelivered = deliveries.reduce((sum, d) => sum + (d.totalMts || d.mtrs || 0), 0);
    const pendingMtrs = Math.max(0, totalProduction - totalDelivered);
    
    // Revenue (Skip cancelled if any)
    const totalRevenue = invoices
      .filter(i => i.status !== 'cancelled')
      .reduce((sum, i) => sum + (i.grandTotal || 0), 0);

    // 2. Yarn Summary
    const yarnPurchased = yarnPurchases.reduce((sum, p) => sum + (p.quantity || 0), 0);
    const yarnReturned = yarnReturns.reduce((sum, r) => sum + (r.quantity || 0), 0);
    const yarnBalance = yarnPurchased - yarnReturned;

    setMetrics({
      totalOrders,
      totalProduction: totalProduction.toFixed(2),
      totalDelivered: totalDelivered.toFixed(2),
      pendingMtrs: pendingMtrs.toFixed(2),
      totalRevenue: totalRevenue.toFixed(2),
      yarnPurchased: yarnPurchased.toFixed(2),
      yarnReturned: yarnReturned.toFixed(2),
      yarnBalance: yarnBalance.toFixed(2)
    });

    // 3. Order Status Pie Chart
    let completed = 0;
    let inProgress = 0;
    let pending = 0;

    orders.forEach(order => {
      const orderDelivered = deliveries
        .filter(d => d.designNo === order.designNo)
        .reduce((sum, d) => sum + (d.totalMts || d.mtrs || 0), 0);
      
      const orderProduced = productions
        .filter(p => p.designNo === order.designNo)
        .reduce((sum, p) => sum + (p.todayMtrs || 0), 0);
      
      if (orderDelivered >= order.orderMtr) {
        completed++;
      } else if (orderProduced > 0 || orderDelivered > 0) {
        inProgress++;
      } else {
        pending++;
      }
    });

    setCharts(prev => ({
      ...prev,
      orderStatus: [
        { name: 'Completed', value: completed },
        { name: 'In Progress', value: inProgress },
        { name: 'Pending', value: pending }
      ].filter(item => item.value > 0)
    }));

    // 4. Production vs Delivery Chart (Last 7 active days)
    const datesMap = {};
    
    // Helper to format date
    const formatDate = (dateStr) => {
      const d = new Date(dateStr);
      return `${d.getDate()}/${d.getMonth() + 1}`;
    };

    productions.forEach(p => {
      if (!p.date) return;
      const dLabel = formatDate(p.date);
      if (!datesMap[dLabel]) { datesMap[dLabel] = { date: dLabel, Production: 0, Delivery: 0, fullDate: new Date(p.date) }; }
      datesMap[dLabel].Production += (p.todayMtrs || 0);
    });

    deliveries.forEach(d => {
      if (!d.date) return;
      const dLabel = formatDate(d.date);
      if (!datesMap[dLabel]) { datesMap[dLabel] = { date: dLabel, Production: 0, Delivery: 0, fullDate: new Date(d.date) }; }
      datesMap[dLabel].Delivery += (d.totalMts || d.mtrs || 0);
    });

    const prodVsDelivery = Object.values(datesMap)
      .sort((a, b) => b.fullDate - a.fullDate) // Sort desc to get latest
      .slice(0, 7) // Take top 7
      .sort((a, b) => a.fullDate - b.fullDate) // Sort asc for chart
      .map(({ fullDate, ...rest }) => rest);

    setCharts(prev => ({ ...prev, prodVsDelivery }));

    // 5. Recent Activity
    setRecentData({
      orders: [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5),
      deliveries: [...deliveries].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5),
      invoices: [...invoices].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5)
    });
  };

  if (loading) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
        <h5 className="mt-3 text-muted">Loading Dashboard Data...</h5>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center mt-5">
        <AlertCircle size={48} className="text-danger mb-3" />
        <h4 className="text-danger">{error}</h4>
        <button className="btn btn-primary mt-3" onClick={fetchDashboardData}>Retry</button>
      </div>
    );
  }

  const StatCard = ({ title, value, icon, color, suffix = '' }) => (
    <Card className="h-100 border-0 shadow-sm" style={{ backgroundColor: '#fff', borderRadius: '12px' }}>
      <Card.Body className="d-flex align-items-center">
        <div 
          className="d-flex justify-content-center align-items-center rounded-circle me-3"
          style={{ width: '48px', height: '48px', backgroundColor: `${color}15`, color: color }}
        >
          {icon}
        </div>
        <div>
          <p className="text-muted mb-1 fw-semibold" style={{ fontSize: '0.85rem' }}>{title}</p>
          <h4 className="mb-0 fw-bold" style={{ color: '#1e293b' }}>
            {value} {suffix && <span style={{ fontSize: '0.85rem', fontWeight: 'normal', color: '#64748b' }}>{suffix}</span>}
          </h4>
        </div>
      </Card.Body>
    </Card>
  );

  return (
    <Container fluid className="px-0">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1 text-dark-blue fw-bold">Mill Progress Dashboard</h2>
          <p className="text-muted mb-0">Overview of your weaving operations</p>
        </div>
      </div>

      {/* Main KPI Cards */}
      <Row className="g-3 mb-4">
        <Col md={4} lg={2}><StatCard title="Total Orders" value={metrics.totalOrders} icon={<ShoppingCart size={24} />} color="#3b82f6" /></Col>
        <Col md={4} lg={3}><StatCard title="Total Production" value={metrics.totalProduction} suffix="Mts" icon={<Factory size={24} />} color="#10b981" /></Col>
        <Col md={4} lg={3}><StatCard title="Total Delivered" value={metrics.totalDelivered} suffix="Mts" icon={<Truck size={24} />} color="#8b5cf6" /></Col>
        <Col md={6} lg={2}><StatCard title="Pending" value={metrics.pendingMtrs} suffix="Mts" icon={<Layers size={24} />} color="#f59e0b" /></Col>
        <Col md={6} lg={2}><StatCard title="Revenue" value={`₹${metrics.totalRevenue}`} icon={<IndianRupee size={24} />} color="#ef4444" /></Col>
      </Row>

      <Row className="g-4 mb-4">
        {/* Charts Section */}
        <Col lg={8}>
          <Card className="h-100 border-0 shadow-sm" style={{ borderRadius: '12px' }}>
            <Card.Body>
              <h5 className="fw-bold mb-4 text-dark-blue">Production vs Delivery (Last 7 Active Days)</h5>
              <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts.prodVsDelivery} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <RechartsTooltip cursor={{ fill: '#f1f5f9' }} />
                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                    <Bar dataKey="Production" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    <Bar dataKey="Delivery" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Order Status & Yarn Summary */}
        <Col lg={4}>
          <div className="d-flex flex-column gap-4 h-100">
            <Card className="border-0 shadow-sm flex-grow-1" style={{ borderRadius: '12px' }}>
              <Card.Body>
                <h5 className="fw-bold mb-2 text-dark-blue">Order Status</h5>
                <div style={{ height: '200px' }}>
                  {charts.orderStatus.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={charts.orderStatus}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          dataKey="value"
                        >
                          {charts.orderStatus.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[entry.name]} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="d-flex align-items-center justify-content-center h-100 text-muted">No order data available</div>
                  )}
                </div>
              </Card.Body>
            </Card>

            <Card className="border-0 shadow-sm text-white" style={{ borderRadius: '12px', background: 'linear-gradient(135deg, #475569 0%, #334155 100%)' }}>
              <Card.Body>
                <div className="d-flex align-items-center mb-3">
                  <Activity size={20} className="me-2" />
                  <h5 className="fw-bold mb-0">Yarn Summary</h5>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="opacity-75"><PackagePlus size={16} className="me-1"/> Purchased</span>
                  <span className="fw-bold">{metrics.yarnPurchased} Kg</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="opacity-75"><PackageMinus size={16} className="me-1"/> Returned</span>
                  <span className="fw-bold">{metrics.yarnReturned} Kg</span>
                </div>
                <hr className="border-white opacity-25 my-2" />
                <div className="d-flex justify-content-between">
                  <span className="fw-semibold">Balance</span>
                  <span className="fw-bold fs-5 text-info">{metrics.yarnBalance} Kg</span>
                </div>
              </Card.Body>
            </Card>
          </div>
        </Col>
      </Row>

      {/* Recent Activity Tables */}
      <Row className="g-4">
        <Col lg={4}>
          <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
            <Card.Body className="p-0">
              <div className="p-3 border-bottom d-flex align-items-center bg-light" style={{ borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}>
                <ShoppingCart size={18} className="me-2 text-primary" />
                <h6 className="fw-bold mb-0">Recent Orders</h6>
              </div>
              <Table responsive hover className="mb-0 border-0" style={{ fontSize: '0.9rem' }}>
                <tbody>
                  {recentData.orders.map(order => (
                    <tr key={order._id}>
                      <td className="ps-3">
                        <div className="fw-semibold text-dark">{order.designNo}</div>
                        <small className="text-muted">{new Date(order.date).toLocaleDateString()}</small>
                      </td>
                      <td className="text-end pe-3 align-middle">
                        <Badge bg="light" text="dark" className="border px-2 py-1">{order.orderMtr} Mts</Badge>
                      </td>
                    </tr>
                  ))}
                  {recentData.orders.length === 0 && <tr><td colSpan="2" className="text-center py-3 text-muted">No recent orders</td></tr>}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
            <Card.Body className="p-0">
              <div className="p-3 border-bottom d-flex align-items-center bg-light" style={{ borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}>
                <Truck size={18} className="me-2 text-success" />
                <h6 className="fw-bold mb-0">Recent Deliveries</h6>
              </div>
              <Table responsive hover className="mb-0 border-0" style={{ fontSize: '0.9rem' }}>
                <tbody>
                  {recentData.deliveries.map(del => (
                    <tr key={del._id}>
                      <td className="ps-3">
                        <div className="fw-semibold text-dark">{del.designNo}</div>
                        <small className="text-muted">{del.buyerName || 'Unknown Buyer'}</small>
                      </td>
                      <td className="text-end pe-3 align-middle">
                        <Badge bg="success" className="bg-opacity-10 text-success border border-success px-2 py-1">{del.totalMts || del.mtrs} Mts</Badge>
                      </td>
                    </tr>
                  ))}
                  {recentData.deliveries.length === 0 && <tr><td colSpan="2" className="text-center py-3 text-muted">No recent deliveries</td></tr>}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
            <Card.Body className="p-0">
              <div className="p-3 border-bottom d-flex align-items-center bg-light" style={{ borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}>
                <IndianRupee size={18} className="me-2 text-danger" />
                <h6 className="fw-bold mb-0">Recent Invoices</h6>
              </div>
              <Table responsive hover className="mb-0 border-0" style={{ fontSize: '0.9rem' }}>
                <tbody>
                  {recentData.invoices.map(inv => (
                    <tr key={inv._id}>
                      <td className="ps-3">
                        <div className="fw-semibold text-dark">{inv.designNo}</div>
                        <small className="text-muted">{inv.customerName}</small>
                      </td>
                      <td className="text-end pe-3 align-middle">
                        <Badge bg="danger" className="bg-opacity-10 text-danger border border-danger px-2 py-1">₹{inv.grandTotal}</Badge>
                      </td>
                    </tr>
                  ))}
                  {recentData.invoices.length === 0 && <tr><td colSpan="2" className="text-center py-3 text-muted">No recent invoices</td></tr>}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;
