import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FaChartLine,
  FaChartBar,
  FaChartPie,
  FaUsers,
  FaShoppingCart,
  FaDollarSign,
  FaCalendarAlt,
  FaDownload,
  FaFilter,
  FaArrowUp,
  FaTrendingDown
} from 'react-icons/fa';
import '../../styles/admin/Analytics.css';

const Analytics = () => {
  const [analyticsData, setAnalyticsData] = useState({
    salesTrend: [],
    transactionStatus: [],
    userGrowth: [],
    topProducts: [],
    kpis: {
      totalRevenue: 0,
      totalTransactions: 0,
      totalUsers: 0,
      conversionRate: 0
    }
  });

  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/analytics', {
        params: dateRange
      });
      setAnalyticsData(response.data);
    } catch (err) {
      setError('Failed to fetch analytics data');
      // Mock data for development
      setAnalyticsData({
        salesTrend: [
          { date: '2024-01-01', revenue: 1500000, transactions: 45 },
          { date: '2024-01-02', revenue: 1800000, transactions: 52 },
          { date: '2024-01-03', revenue: 2100000, transactions: 61 },
          { date: '2024-01-04', revenue: 1900000, transactions: 48 },
          { date: '2024-01-05', revenue: 2300000, transactions: 67 },
          { date: '2024-01-06', revenue: 2500000, transactions: 73 },
          { date: '2024-01-07', revenue: 2200000, transactions: 59 }
        ],
        transactionStatus: [
          { status: 'Completed', count: 245, percentage: 78 },
          { status: 'Pending', count: 45, percentage: 14 },
          { status: 'Failed', count: 25, percentage: 8 }
        ],
        userGrowth: [
          { month: 'Jan', users: 120 },
          { month: 'Feb', users: 145 },
          { month: 'Mar', users: 180 },
          { month: 'Apr', users: 210 },
          { month: 'May', users: 250 },
          { month: 'Jun', users: 290 }
        ],
        topProducts: [
          { name: 'Premium Package', sales: 156, revenue: 7800000 },
          { name: 'Standard Package', sales: 234, revenue: 4680000 },
          { name: 'Basic Package', sales: 189, revenue: 1890000 },
          { name: 'Enterprise Package', sales: 67, revenue: 6700000 },
          { name: 'Starter Package', sales: 298, revenue: 1490000 }
        ],
        kpis: {
          totalRevenue: 15420000,
          totalTransactions: 1247,
          totalUsers: 2890,
          conversionRate: 12.5
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (field, value) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const exportData = () => {
    const dataStr = JSON.stringify(analyticsData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `analytics-${dateRange.startDate}-to-${dateRange.endDate}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  if (loading) {
    return (
      <div className="analytics-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading analytics data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-container">
        <div className="error-state">
          <p>{error}</p>
          <button onClick={fetchAnalyticsData}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-container">
      {/* Header */}
      <div className="analytics-header">
        <div className="header-content">
          <h1>Analytics Dashboard</h1>
          <p>Comprehensive business insights and performance metrics</p>
        </div>
        <div className="header-actions">
          <div className="date-range-picker">
            <FaCalendarAlt className="calendar-icon" />
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
            />
            <span>to</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
            />
          </div>
          <button className="export-btn" onClick={exportData}>
            <FaDownload /> Export Data
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-section">
        <div className="kpi-card">
          <div className="kpi-icon revenue">
            <FaDollarSign />
          </div>
          <div className="kpi-content">
            <h3>Total Revenue</h3>
            <div className="kpi-value">Rp {analyticsData.kpis.totalRevenue.toLocaleString('id-ID')}</div>
            <div className="kpi-trend positive">
              <FaArrowUp /> +12.5%
            </div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon transactions">
            <FaShoppingCart />
          </div>
          <div className="kpi-content">
            <h3>Total Transactions</h3>
            <div className="kpi-value">{analyticsData.kpis.totalTransactions.toLocaleString()}</div>
            <div className="kpi-trend positive">
              <FaArrowUp /> +8.3%
            </div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon users">
            <FaUsers />
          </div>
          <div className="kpi-content">
            <h3>Total Users</h3>
            <div className="kpi-value">{analyticsData.kpis.totalUsers.toLocaleString()}</div>
            <div className="kpi-trend positive">
              <FaArrowUp /> +15.7%
            </div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon conversion">
            <FaChartLine />
          </div>
          <div className="kpi-content">
            <h3>Conversion Rate</h3>
            <div className="kpi-value">{analyticsData.kpis.conversionRate}%</div>
            <div className="kpi-trend positive">
              <FaArrowUp /> +2.1%
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        {/* Revenue Trend Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <h3><FaChartLine /> Revenue Trend</h3>
            <div className="chart-filters">
              <button className="filter-btn active">7D</button>
              <button className="filter-btn">30D</button>
              <button className="filter-btn">90D</button>
            </div>
          </div>
          <div className="chart-content">
            <div className="chart-placeholder">
              <p>Revenue trend chart would be rendered here</p>
              <div className="mock-chart">
                {analyticsData.salesTrend.map((item, index) => (
                  <div key={index} className="chart-bar" style={{height: `${(item.revenue / 2500000) * 100}%`}}>
                    <div className="bar-tooltip">
                      <strong>{item.date}</strong><br/>
                      Rp {item.revenue.toLocaleString('id-ID')}<br/>
                      {item.transactions} transactions
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Transaction Status Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <h3><FaChartPie /> Transaction Status</h3>
          </div>
          <div className="chart-content">
            <div className="pie-chart-placeholder">
              <div className="status-legend">
                {analyticsData.transactionStatus.map((status, index) => (
                  <div key={index} className="legend-item">
                    <div className={`legend-color status-${status.status.toLowerCase()}`}></div>
                    <span>{status.status}: {status.count} ({status.percentage}%)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* User Growth Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <h3><FaChartBar /> User Growth</h3>
          </div>
          <div className="chart-content">
            <div className="chart-placeholder">
              <div className="growth-chart">
                {analyticsData.userGrowth.map((item, index) => (
                  <div key={index} className="growth-bar">
                    <div className="bar" style={{height: `${(item.users / 290) * 100}%`}}></div>
                    <span className="month-label">{item.month}</span>
                    <span className="user-count">{item.users}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Products Section */}
      <div className="top-products-section">
        <div className="section-header">
          <h2>Top Performing Products</h2>
          <button className="view-all-btn">View All Products</button>
        </div>
        <div className="products-grid">
          {analyticsData.topProducts.map((product, index) => (
            <div key={index} className="product-card">
              <div className="product-rank">#{index + 1}</div>
              <div className="product-info">
                <h4>{product.name}</h4>
                <div className="product-stats">
                  <span className="sales">{product.sales} sales</span>
                  <span className="revenue">Rp {product.revenue.toLocaleString('id-ID')}</span>
                </div>
              </div>
              <div className="product-trend">
                <FaArrowUp className="trend-icon positive" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Insights Section */}
      <div className="insights-section">
        <h2>Business Insights</h2>
        <div className="insights-grid">
          <div className="insight-card">
            <div className="insight-icon">
              <FaArrowUp />
            </div>
            <div className="insight-content">
              <h4>Revenue Growth</h4>
              <p>Your revenue has increased by 12.5% compared to the previous period. This growth is primarily driven by increased sales in premium packages.</p>
            </div>
          </div>
          
          <div className="insight-card">
            <div className="insight-icon">
              <FaUsers />
            </div>
            <div className="insight-content">
              <h4>User Acquisition</h4>
              <p>New user registrations are up 15.7% this month. Consider scaling your marketing efforts to maintain this growth momentum.</p>
            </div>
          </div>
          
          <div className="insight-card">
            <div className="insight-icon">
              <FaChartLine />
            </div>
            <div className="insight-content">
              <h4>Conversion Optimization</h4>
              <p>Your conversion rate has improved to 12.5%. Focus on optimizing the checkout process to further increase conversions.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;