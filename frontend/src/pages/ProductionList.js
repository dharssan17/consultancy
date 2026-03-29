import React, { useState, useEffect } from 'react';
import { Table, Button, Form, InputGroup, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { productionService } from '../services/productionService';
import { authService } from '../services/authService';
import Toast from '../components/Toast';

const ProductionList = () => {
  const [productions, setProductions] = useState([]);
  const [filteredProductions, setFilteredProductions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', variant: 'success' });
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchProductions();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredProductions(productions);
    } else {
      const filtered = productions.filter(
        (production) =>
          production.designNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          production.loomNo?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProductions(filtered);
    }
  }, [searchTerm, productions]);

  const fetchProductions = async () => {
    try {
      setLoading(true);
      const response = await productionService.getProductions({ limit: 1000 });
      if (response.success) {
        setProductions(response.data);
        setFilteredProductions(response.data);
      }
    } catch (error) {
      showToast('Unable to load .', 'danger');
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

  if (loading) {
    return <div className="text-center p-4">Loading...</div>;
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Production List</h2>
        <Button variant="primary" onClick={() => navigate('/productions/entry')}>
          New Production Entry
        </Button>
      </div>

      <Toast
        show={toast.show}
        message={toast.message}
        variant={toast.variant}
        onClose={hideToast}
      />

      <InputGroup className="mb-3">
        <InputGroup.Text>Search</InputGroup.Text>
        <Form.Control
          type="text"
          placeholder="Search by Design No or Loom No..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </InputGroup>

      {filteredProductions.length === 0 ? (
        <div className="text-center p-4">
          <p>No production entries found.</p>
        </div>
      ) : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Date</th>
              <th>Design No</th>
              <th>Buyer Name</th>
              <th>Loom No</th>
              <th>DC No</th>
              <th>Pieces</th>
              <th>Today Mtrs</th>
              <th>Total Mtrs</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProductions.map((production) => {
              const buyerName = production.orderId?.customerId?.buyerName || 
                               (production.orderId?.customerId ? production.orderId.customerId.buyerName : '-');
              return (
                <tr key={production._id}>
                  <td>{formatDate(production.date)}</td>
                  <td>{production.designNo}</td>
                  <td>{buyerName}</td>
                  <td>{production.loomNo}</td>
                  <td>{production.dcNo || '-'}</td>
                  <td>{production.pieces || '-'}</td>
                  <td>{production.todayMtrs?.toFixed(2)}</td>
                  <td>
                    <Badge bg="info">{production.totalMtrs?.toFixed(2)}</Badge>
                  </td>
                  <td>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="me-2"
                      onClick={() => navigate(`/productions/edit/${production._id}`)}
                    >
                      Edit
                    </Button>
                    {isAdmin && (
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDelete(production._id, production.designNo)}
                      >
                        Delete
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}

      <div className="mt-3">
        <Badge bg="secondary">
          Total: {filteredProductions.length} production entry(ies)
        </Badge>
      </div>
    </div>
  );
};

export default ProductionList;

