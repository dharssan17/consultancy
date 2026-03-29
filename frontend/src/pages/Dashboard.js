import React from 'react';
import { Card, Row, Col } from 'react-bootstrap';
import { authService } from '../services/authService';

const Dashboard = () => {
  const user = authService.getCurrentUser();

  return (
    <div>
      <h2 className="mb-4 text-dark-blue fw-bold">Dashboard</h2>
      <Row>
        <Col md={12}>
          <Card>
            <Card.Body>
              <Card.Title>Welcome, {user?.username}!</Card.Title>
              <Card.Text>
                You are logged in as <strong>{user?.role}</strong>.
              </Card.Text>
              <Card.Text className="text-muted">
                Business modules will be added here.
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;

