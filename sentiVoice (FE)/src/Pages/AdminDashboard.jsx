import React, { useEffect, useState } from "react";
import { api } from "../utils/api";
import AdminSidebar from "../Components/AdminSidebar/AdminSidebar";
import { 
  FaUserTie, 
  FaUserCheck, 
  FaUserShield, 
  FaClock, 
  FaExclamationTriangle,
  FaCheckCircle,
  FaEye,
  FaCog,
  FaUsers,
  FaMoneyBillWave,
  FaCalendarAlt,
  FaArrowUp,
  FaArrowDown,
  FaMinus,
  FaServer,
  FaDatabase,
  FaUndoAlt
} from "react-icons/fa";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [previousStats, setPreviousStats] = useState(null);
  const [systemHealth, setSystemHealth] = useState({
    status: 'Healthy'
  });
  const [pendingCounts, setPendingCounts] = useState({
    approvals: 0,
    payments: 0,
    refunds: 0
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const username = localStorage.getItem("username") || "Admin";

  // Fetch pending counts for sidebar badges
  const fetchPendingCounts = async () => {
    try {
      // Fetch pending therapist approvals
      const pendingApprovals = await api.get("/api/admin/pending-therapists");
      const approvalsCount = Array.isArray(pendingApprovals) ? pendingApprovals.length : 0;

      // Fetch pending payments
      const pendingPayments = await api.get("/api/admin/pending-payments");
      const paymentsCount = Array.isArray(pendingPayments) ? pendingPayments.length : 0;

      // Fetch pending refunds
      const refundRes = await api.get("/api/admin/refund-requests-count");
      const refundsCount = refundRes.count || 0;

      setPendingCounts({
        approvals: approvalsCount,
        payments: paymentsCount,
        refunds: refundsCount
      });
    } catch (error) {
      console.error('Error fetching pending counts:', error);
      // Keep existing counts on error
    }
  };

  // Check system health by testing backend connectivity
  const updateSystemHealth = async () => {
    try {
      // Test backend connectivity by making a simple API call
      await api.get("/api/admin/stats");
      setSystemHealth({
        status: 'Healthy'
      });
    } catch (error) {
      console.error('Backend health check failed:', error);
      setSystemHealth({
        status: 'Warning'
      });
    }
  };

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await api.get("/api/admin/stats");
      
      // Store previous stats before updating
      if (stats) {
        setPreviousStats(stats);
      }
      
      setStats(data);
      setError(null);
      
      // Fetch pending counts
      await fetchPendingCounts();
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchStats(); 
    updateSystemHealth(); // Initial system health update
    
    // Update system health every 30 seconds
    const healthInterval = setInterval(() => {
      updateSystemHealth();
    }, 30000);
    
    // Refresh stats every 24 hours to see trends
    const statsInterval = setInterval(() => {
      fetchStats();
    }, 86400000); // 24 hours

    // Refresh data when page comes into focus (when user navigates back)
    const handleFocus = () => {
      fetchPendingCounts();
    };

    window.addEventListener('focus', handleFocus);
    
    return () => {
      clearInterval(healthInterval);
      clearInterval(statsInterval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Good Morning";
    if (hour >= 12 && hour < 17) return "Good Afternoon";
    if (hour >= 17 && hour < 21) return "Good Evening";
    return "Good Night";
  };

  const getTrendIcon = (current, previous) => {
    if (!previous) return <FaMinus className="text-gray-400" />;
    const change = current - previous;
    if (change > 0) return <FaArrowUp className="text-green-500" />;
    if (change < 0) return <FaArrowDown className="text-red-500" />;
    return <FaMinus className="text-gray-400" />;
  };

  const getTrendPercentage = (current, previous) => {
    if (!previous) return "0%";
    const change = ((current - previous) / previous) * 100;
    return `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <AdminSidebar 
          current="dashboard" 
          pendingApprovals={pendingCounts.approvals}
          pendingPayments={pendingCounts.payments}
          pendingRefunds={pendingCounts.refunds}
        />
        <div className="flex-1 lg:ml-64 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-sm sm:text-base">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <AdminSidebar 
        current="dashboard" 
        pendingApprovals={pendingCounts.approvals}
        pendingPayments={pendingCounts.payments}
        pendingRefunds={pendingCounts.refunds}
      />

      <div className="flex-1 lg:ml-64 p-4 sm:p-6 lg:p-8">
        {/* Header Section */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
                {getGreeting()}, <span className="text-blue-600">{username}</span>
              </h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">Here's what's happening with your system today</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-white rounded-lg px-3 py-2 shadow-sm border">
                <div className="flex items-center space-x-2">
                  <FaClock className="text-gray-400" />
                  <span className="text-xs sm:text-sm text-gray-600">
                    {new Date().toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* System Health Indicator */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${
                  systemHealth.status === 'Healthy' ? 'bg-green-500' : 'bg-yellow-500'
                }`}></div>
                <span className="text-sm font-medium text-gray-700">System Status: {systemHealth.status}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl mb-6 flex items-center space-x-3">
            <FaExclamationTriangle className="text-red-500" />
            <div>
            <strong>Error:</strong> {error}
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <StatCard
              icon={<FaUserCheck className="text-2xl" />}
              title="Pending Therapists"
              value={stats.pendingTherapists}
              trend={getTrendIcon(stats.pendingTherapists, previousStats?.pendingTherapists)}
              trendValue={getTrendPercentage(stats.pendingTherapists, previousStats?.pendingTherapists)}
              color="from-amber-500 to-orange-500"
              bgColor="bg-gradient-to-r from-amber-500 to-orange-500"
            />
            <StatCard
              icon={<FaUserTie className="text-2xl" />}
              title="Approved Therapists"
              value={stats.approvedTherapists}
              trend={getTrendIcon(stats.approvedTherapists, previousStats?.approvedTherapists)}
              trendValue={getTrendPercentage(stats.approvedTherapists, previousStats?.approvedTherapists)}
              color="from-emerald-500 to-green-500"
              bgColor="bg-gradient-to-r from-emerald-500 to-green-500"
            />
            <StatCard
              icon={<FaUserShield className="text-2xl" />}
              title="Total Patients"
              value={stats.patients}
              trend={getTrendIcon(stats.patients, previousStats?.patients)}
              trendValue={getTrendPercentage(stats.patients, previousStats?.patients)}
              color="from-blue-500 to-indigo-500"
              bgColor="bg-gradient-to-r from-blue-500 to-indigo-500"
            />
          </div>
        )}

        {/* Quick Actions */}
        <div className="space-y-4 sm:space-y-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Quick Actions</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            <QuickActionCard
              icon={<FaUserCheck className="text-3xl" />}
              title="Therapist Approvals"
              description="Review and approve new therapist registrations"
              actionText="Review Applications"
            href="/therapist-approval"
              color="from-blue-500 to-indigo-600"
              bgColor="bg-gradient-to-r from-blue-500 to-indigo-600"
            />
            
            <QuickActionCard
              icon={<FaMoneyBillWave className="text-3xl" />}
              title="Payment Management"
              description="Review payments, view history, and configure payment methods"
              actionText="Manage Payments"
              href="/payments"
              color="from-emerald-500 to-green-600"
              bgColor="bg-gradient-to-r from-emerald-500 to-green-600"
            />
            
            <QuickActionCard
              icon={<FaUndoAlt className="text-3xl" />}
              title="Refund Requests"
              description="Review and process patient refund requests"
              actionText="Review Refunds"
              href="/refund-requests"
              color="from-orange-500 to-red-600"
              bgColor="bg-gradient-to-r from-orange-500 to-red-600"
            />
            
            <QuickActionCard
              icon={<FaUsers className="text-3xl" />}
              title="User Management"
              description="View and manage all registered users"
              actionText="Manage Users"
            href="/admin-user-list"
              color="from-purple-500 to-pink-600"
              bgColor="bg-gradient-to-r from-purple-500 to-pink-600"
            />
            
            <QuickActionCard
              icon={<FaCog className="text-3xl" />}
              title="System Settings"
              description="Configure system preferences and global settings"
              actionText="Configure"
              href="/admin-settings"
              color="from-gray-600 to-gray-700"
              bgColor="bg-gradient-to-r from-gray-600 to-gray-700"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Enhanced Stat Card Component
function StatCard({ icon, title, value, trend, trendValue, color, bgColor }) {
  return (
    <div className={`${bgColor} text-white rounded-xl shadow-lg p-4 sm:p-6 hover:shadow-xl transition-shadow duration-300`}>
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className={`p-2 sm:p-3 rounded-lg bg-white/20`}>
          {icon}
        </div>
        <div className="flex items-center space-x-1">
          {trend}
          <span className="text-xs font-medium">{trendValue}</span>
        </div>
      </div>
      <div>
        <p className="text-xs sm:text-sm font-medium opacity-90 mb-1">{title}</p>
        <p className="text-2xl sm:text-3xl font-bold">{value}</p>
      </div>
    </div>
  );
}

// Quick Action Card Component
function QuickActionCard({ icon, title, description, actionText, href, color, bgColor }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow duration-300">
      <div className="flex items-start space-x-3 sm:space-x-4">
        <div className={`p-2 sm:p-3 rounded-lg ${bgColor} text-white flex-shrink-0`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">{title}</h3>
          <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2">{description}</p>
          <a
            href={href}
            className={`inline-flex items-center px-3 sm:px-4 py-2 rounded-lg text-white font-medium text-xs sm:text-sm ${bgColor} hover:opacity-90 transition-opacity duration-200`}
          >
            {actionText}
            <svg className="ml-1 sm:ml-2 w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}