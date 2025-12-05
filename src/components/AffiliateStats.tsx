import React, { useState, useEffect } from 'react';
import { getAffiliateStats } from '../utils/affiliateUtils';

interface AffiliateStatsProps {
  userId?: string;
}

const AffiliateStats = React.memo(({ userId }: AffiliateStatsProps) => {
  const [stats, setStats] = useState({
    totalClicks: 0,
    uniqueProducts: 0
  });

  useEffect(() => {
    const userStats = getAffiliateStats(userId);
    setStats(userStats);
  }, [userId]);

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '1.5rem',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      marginBottom: '1rem'
    }}>
      <h3 style={{
        margin: '0 0 1rem 0',
        fontSize: '1.25rem',
        fontWeight: '600',
        color: '#374151',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        📊 Affiliate İstatistikleri
      </h3>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '1rem',
        marginBottom: '1rem'
      }}>
        <div style={{
          textAlign: 'center',
          padding: '1rem',
          backgroundColor: '#f0f9ff',
          borderRadius: '8px',
          border: '1px solid #e0f2fe'
        }}>
          <div style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: '#0369a1',
            marginBottom: '0.5rem'
          }}>
            {stats.totalClicks}
          </div>
          <div style={{
            fontSize: '0.875rem',
            color: '#64748b',
            fontWeight: '500'
          }}>
            Toplam Tıklama
          </div>
        </div>
        
        <div style={{
          textAlign: 'center',
          padding: '1rem',
          backgroundColor: '#f0fdf4',
          borderRadius: '8px',
          border: '1px solid #dcfce7'
        }}>
          <div style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: '#16a34a',
            marginBottom: '0.5rem'
          }}>
            {stats.uniqueProducts}
          </div>
          <div style={{
            fontSize: '0.875rem',
            color: '#64748b',
            fontWeight: '500'
          }}>
            Farklı Ürün
          </div>
        </div>
      </div>
      
      
      {stats.totalClicks === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          color: '#6b7280'
        }}>
          <div style={{
            fontSize: '2rem',
            marginBottom: '0.5rem'
          }}>
            📈
          </div>
          <p style={{
            margin: 0,
            fontSize: '0.875rem'
          }}>
            Henüz affiliate link tıklaması yok. 
            <br />
            Ürünlerinizi paylaşmaya başlayın!
          </p>
        </div>
      )}
    </div>
  );
});

AffiliateStats.displayName = 'AffiliateStats';

export default AffiliateStats;
