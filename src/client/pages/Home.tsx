import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header';

const Home: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Mock freelancer services data
  const services = [
    {
      id: 1,
      title: "web development",
      freelancer: "alex_codes",
      price: "50 USDC",
      rating: 4.9,
      reviews: 127,
      description: "full-stack web development with react, node.js, and modern frameworks"
    },
    {
      id: 2,
      title: "ui/ux design",
      freelancer: "design_pro",
      price: "75 USDC",
      rating: 4.8,
      reviews: 89,
      description: "modern ui/ux design for web and mobile applications"
    },
    {
      id: 3,
      title: "smart contract development",
      freelancer: "blockchain_dev",
      price: "200 USDC",
      rating: 5.0,
      reviews: 45,
      description: "ethereum smart contracts and defi protocol development"
    },
    {
      id: 4,
      title: "content writing",
      freelancer: "wordsmith",
      price: "25 USDC",
      rating: 4.7,
      reviews: 203,
      description: "high-quality content writing for blogs, websites, and marketing"
    },
    {
      id: 5,
      title: "digital marketing",
      freelancer: "marketing_guru",
      price: "100 USDC",
      rating: 4.6,
      reviews: 156,
      description: "comprehensive digital marketing strategy and social media management"
    },
    {
      id: 6,
      title: "mobile app development",
      freelancer: "app_builder",
      price: "150 USDC",
      rating: 4.9,
      reviews: 78,
      description: "native and cross-platform mobile app development"
    }
  ];

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#0a0a0a',
      fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif'
    }}>
      <Header />

      {/* Hero Section */}
      <section style={{
        padding: '4rem 2rem',
        textAlign: 'center',
        backgroundColor: '#111111',
        margin: '2rem',
        borderRadius: '4px',
        border: '1px solid #333333'
      }}>
        <h2 style={{ color: '#ffffff', fontSize: '3rem', fontWeight: '800', marginBottom: '1rem' }}>
          find freelance services
        </h2>
        <p style={{ color: '#cccccc', fontSize: '1.2rem', marginBottom: '2rem' }}>
          connect with top freelancers and pay with stablecoins
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/services" style={{ textDecoration: 'none' }}>
            <button style={{
              backgroundColor: '#4c1d95',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '2px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '600'
            }}>
              browse services
            </button>
          </Link>
          <button 
            onClick={() => currentUser ? navigate('/post-job') : navigate('/login')}
            style={{
              backgroundColor: 'transparent',
              color: '#4c1d95',
              border: '2px solid #4c1d95',
              padding: '10px 24px',
              borderRadius: '2px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '600'
            }}
          >
            post a job
          </button>
        </div>
      </section>

      {/* Services Grid */}
      <section style={{ padding: '2rem' }}>
        <h3 style={{ color: '#ffffff', fontSize: '2rem', fontWeight: '700', marginBottom: '2rem', textAlign: 'left' }}>
          popular services
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem'
        }}>
          {services.map(service => (
            <div key={service.id} style={{
              backgroundColor: '#111111',
              border: '1px solid #333333',
              borderRadius: '4px',
              padding: '1.5rem',
              transition: 'transform 0.2s, box-shadow 0.2s',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(76, 29, 149, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <h4 style={{ color: '#ffffff', fontSize: '1.1rem', fontWeight: '600', margin: 0 }}>
                  {service.title}
                </h4>
                <span style={{ color: '#4c1d95', fontSize: '1.2rem', fontWeight: '700' }}>
                  {service.price}
                </span>
              </div>
              <p style={{ color: '#cccccc', fontSize: '14px', marginBottom: '1rem' }}>
                by {service.freelancer}
              </p>
              <p style={{ color: '#888888', fontSize: '14px', marginBottom: '1rem' }}>
                {service.description}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: '#ffd700', fontSize: '14px' }}>★</span>
                  <span style={{ color: '#cccccc', fontSize: '14px' }}>{service.rating}</span>
                  <span style={{ color: '#888888', fontSize: '14px' }}>({service.reviews})</span>
                </div>
                <button style={{
                  backgroundColor: '#4c1d95',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  hire now
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
