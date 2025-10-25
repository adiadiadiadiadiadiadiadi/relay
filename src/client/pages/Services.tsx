import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { convertAndFormatCurrency, Currency } from '../utils/currencyConversion';
import { useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header';

const Services: React.FC = () => {
  const { currentUser } = useAuth();
  const { userCurrency } = useCurrency();
  const navigate = useNavigate();

  // Mock freelancer services data
  const services = [
    {
      id: 1,
      title: "web development",
      freelancer: "alex_codes",
      price: 50,
      currency: "USDC" as Currency,
      rating: 4.9,
      reviews: 127,
      description: "full-stack web development with react, node.js, and modern frameworks",
      category: "development"
    },
    {
      id: 2,
      title: "ui/ux design",
      freelancer: "design_pro",
      price: 75,
      currency: "USDC" as Currency,
      rating: 4.8,
      reviews: 89,
      description: "modern ui/ux design for web and mobile applications",
      category: "design"
    },
    {
      id: 3,
      title: "smart contract development",
      freelancer: "blockchain_dev",
      price: 200,
      currency: "USDC" as Currency,
      rating: 5.0,
      reviews: 45,
      description: "ethereum smart contracts and defi protocol development",
      category: "blockchain"
    },
    {
      id: 4,
      title: "content writing",
      freelancer: "wordsmith",
      price: 25,
      currency: "USDC" as Currency,
      rating: 4.7,
      reviews: 203,
      description: "high-quality content writing for blogs, websites, and marketing",
      category: "writing"
    },
    {
      id: 5,
      title: "digital marketing",
      freelancer: "marketing_guru",
      price: 100,
      currency: "USDC" as Currency,
      rating: 4.6,
      reviews: 156,
      description: "comprehensive digital marketing strategy and social media management",
      category: "marketing"
    },
    {
      id: 6,
      title: "mobile app development",
      freelancer: "app_builder",
      price: 150,
      currency: "USDC" as Currency,
      rating: 4.9,
      reviews: 78,
      description: "native and cross-platform mobile app development",
      category: "development"
    },
    {
      id: 7,
      title: "logo design",
      freelancer: "brand_maker",
      price: 45,
      currency: "USDC" as Currency,
      rating: 4.8,
      reviews: 92,
      description: "professional logo design and branding packages",
      category: "design"
    },
    {
      id: 8,
      title: "seo optimization",
      freelancer: "seo_expert",
      price: 60,
      currency: "USDC" as Currency,
      rating: 4.7,
      reviews: 134,
      description: "on-page and off-page seo optimization for better rankings",
      category: "marketing"
    },
    {
      id: 9,
      title: "video editing",
      freelancer: "video_master",
      price: 80,
      currency: "USDC" as Currency,
      rating: 4.9,
      reviews: 67,
      description: "professional video editing and post-production services",
      category: "video"
    }
  ];

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#0a0a0a',
      fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif'
    }}>
      <Header />

      {/* Services Grid */}
      <section style={{ padding: '2rem' }}>
        <h2 style={{ color: '#ffffff', fontSize: '2.5rem', fontWeight: '800', marginBottom: '1rem', textAlign: 'left' }}>
          all services
        </h2>
        <p style={{ color: '#888888', fontSize: '1rem', marginBottom: '2rem', textAlign: 'left' }}>
          discover freelance services and connect with top talent
        </p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
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
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(76, 29, 149, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <h4 style={{ color: '#ffffff', fontSize: '1.2rem', fontWeight: '600', margin: 0 }}>
                  {service.title}
                </h4>
                <span style={{ color: '#4c1d95', fontSize: '1.3rem', fontWeight: '700' }}>
                  {convertAndFormatCurrency(service.price, service.currency, userCurrency)}
                </span>
              </div>
              <p style={{ color: '#cccccc', fontSize: '14px', marginBottom: '0.5rem', fontWeight: '500' }}>
                by {service.freelancer}
              </p>
              <span style={{
                display: 'inline-block',
                backgroundColor: '#1a1a1a',
                color: '#4c1d95',
                padding: '4px 8px',
                borderRadius: '2px',
                fontSize: '12px',
                fontWeight: '600',
                marginBottom: '1rem'
              }}>
                {service.category}
              </span>
              <p style={{ color: '#888888', fontSize: '14px', marginBottom: '1rem', lineHeight: '1.5' }}>
                {service.description}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: '#ffd700', fontSize: '16px' }}>★</span>
                  <span style={{ color: '#cccccc', fontSize: '14px', fontWeight: '600' }}>{service.rating}</span>
                  <span style={{ color: '#888888', fontSize: '14px' }}>({service.reviews})</span>
                </div>
                <button style={{
                  backgroundColor: '#4c1d95',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#5a2ba5';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#4c1d95';
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

export default Services;
