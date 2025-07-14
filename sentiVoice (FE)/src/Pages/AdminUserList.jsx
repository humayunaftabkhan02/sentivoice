// src/Pages/AdminUserList.jsx
import React, { useEffect, useState, useMemo } from "react";
import AdminSidebar from "../Components/AdminSidebar/AdminSidebar";
import {
  FaUser,
  FaUserMd,
  FaSearch,
  FaFilter,
  FaDownload,
  FaCheck,
  FaSpinner,
  FaCrown,
  FaExclamationTriangle,
  FaCheckCircle,
  FaClock,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaBan,
  FaUnlock,
  FaUsers,
  FaUserTie,
  FaUserShield
} from "react-icons/fa";
import { api } from "../utils/api";

export default function AdminUserList() {
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("fullName");
  const [sortDirection, setSortDirection] = useState("asc");

  const [actionLoading, setActionLoading] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pendingCounts, setPendingCounts] = useState({
    approvals: 0,
    payments: 0,
    notifications: 0
  });
  const [userStats, setUserStats] = useState({
    total: 0,
    patients: 0,
    therapists: 0,
    pending: 0,
    active: 0
  });

  const fetchPendingCounts = async () => {
    try {
      const pendingApprovals = await api.get("/api/admin/pending-therapists");
      const approvalsCount = Array.isArray(pendingApprovals) ? pendingApprovals.length : 0;
      const pendingPayments = await api.get("/api/admin/pending-payments");
      const paymentsCount = Array.isArray(pendingPayments) ? pendingPayments.length : 0;

      setPendingCounts({
        approvals: approvalsCount,
        payments: paymentsCount,
        notifications: 0
      });
    } catch (error) {
      console.error('Error fetching pending counts:', error);
    }
  };

    const fetchUsers = async () => {
      try {
      setLoading(true);
      setError(null);
      const param = roleFilter === "all" ? "" : `?role=${roleFilter}`;
        const data = await api.get(`/api/admin/users${param}`);
      console.log(`📋 Fetched users data:`, data);
        setUsers(data);
      
      // Fetch user statistics from backend
      const stats = await api.get("/api/admin/user-stats");
      setUserStats(stats);
      } catch (err) {
        setError("Failed to fetch users");
      console.error("User fetch error:", err);
    } finally {
      setLoading(false);
      }
    };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  useEffect(() => {
    fetchPendingCounts();
  }, []);

  // Advanced filtering and sorting
  const filteredAndSortedUsers = useMemo(() => {
    let filtered = users.filter(user => {
      const matchesSearch = 
        user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.specialization?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || user.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });

    // Sorting
    filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      if (sortField === "registeredOn") {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }
      
      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [users, searchTerm, statusFilter, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedUsers.length / pageSize);
  const paginatedUsers = filteredAndSortedUsers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return <FaSort className="text-gray-400" />;
    return sortDirection === "asc" ? <FaSortUp className="text-blue-500" /> : <FaSortDown className="text-blue-500" />;
  };

  const handleUserAction = async (action, user) => {
    try {
      console.log(`🔄 Starting ${action} action for user:`, user);
      console.log(`📋 User data:`, {
        username: user.username,
        role: user.role,
        status: user.status,
        isActive: user.isActive
      });
      setActionLoading(user.username);
      
      let response;
      switch (action) {
        case 'approve':
          console.log(`📤 Making PUT request to /admin/approve-therapist/${user.username}`);
          response = await api.put(`/api/admin/approve-therapist/${user.username}`);
          console.log(`✅ Approve response:`, response);
          break;
        case 'suspend':
          console.log(`📤 Making PUT request to /admin/users/${user.username}/suspend`);
          response = await api.put(`/api/admin/users/${user.username}/suspend`);
          console.log(`✅ Suspend response:`, response);
          break;
        case 'activate':
          console.log(`📤 Making PUT request to /admin/users/${user.username}/activate`);
          response = await api.put(`/api/admin/users/${user.username}/activate`);
          console.log(`✅ Activate response:`, response);
          break;
        default:
          console.warn(`⚠️ Unknown action: ${action}`);
          break;
      }
      
      console.log(`🔄 Refreshing user list and pending counts`);
      await fetchUsers();
      await fetchPendingCounts();
      console.log(`✅ Action ${action} completed successfully`);
    } catch (error) {
      console.error(`❌ Error performing ${action}:`, error);
      console.error(`❌ Error details:`, {
        message: error.message,
        stack: error.stack,
        response: error.response
      });
      setError(`Failed to ${action} user: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };



  const getStatusBadge = (status, role) => {
    if (role === 'patient') return "bg-blue-100 text-blue-800";
    
    switch (status) {
      case 'Active':
        return "bg-emerald-100 text-emerald-800";
      case 'Pending':
        return "bg-yellow-100 text-yellow-800";
      case 'Suspended':
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'patient':
        return <FaUser className="text-blue-500" />;
      case 'therapist':
        return <FaUserMd className="text-green-500" />;
      case 'admin':
        return <FaCrown className="text-purple-500" />;
      default:
        return <FaUser className="text-gray-500" />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <AdminSidebar 
        current="users" 
        pendingApprovals={pendingCounts.approvals}
        pendingPayments={pendingCounts.payments}
        notifications={pendingCounts.notifications}
      />

      <div className="flex-1 ml-64 p-6 lg:p-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                User Directory
              </h1>
              <p className="text-gray-600">
                Manage and monitor all registered users in the system
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-white rounded-lg px-4 py-2 shadow-sm border">
                <div className="flex items-center space-x-2">
                  <FaUsers className="text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {userStats.total} Total Users
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-3xl font-bold text-blue-600">{userStats.total}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FaUsers className="text-2xl text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Patients</p>
                  <p className="text-3xl font-bold text-green-600">{userStats.patients}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <FaUserShield className="text-2xl text-green-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Therapists</p>
                  <p className="text-3xl font-bold text-purple-600">{userStats.therapists}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <FaUserTie className="text-2xl text-purple-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active</p>
                  <p className="text-3xl font-bold text-emerald-600">{userStats.active}</p>
                </div>
                <div className="p-3 bg-emerald-100 rounded-lg">
                  <FaCheckCircle className="text-2xl text-emerald-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-3xl font-bold text-amber-600">{userStats.pending}</p>
                </div>
                <div className="p-3 bg-amber-100 rounded-lg">
                  <FaClock className="text-2xl text-amber-600" />
                </div>
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

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
            <div className="flex flex-wrap items-center space-x-4">
              {/* Role Filter */}
              <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                {["all", "patient", "therapist"].map(role => (
            <button
                    key={role}
                    onClick={() => setRoleFilter(role)}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      roleFilter === role
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {role === "all" ? "All Users" : role.charAt(0).toUpperCase() + role.slice(1) + "s"}
            </button>
          ))}
              </div>

              {/* Status Filter */}
              <div className="flex items-center space-x-2">
                <FaFilter className="text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Pending">Pending</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
              />
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Users ({filteredAndSortedUsers.length})
              </h2>
              
              <div className="flex items-center space-x-4">
                <button
                  onClick={fetchUsers}
                  disabled={loading}
                  className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50"
                >
                  <FaSpinner className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  <span>{loading ? 'Loading...' : 'Refresh'}</span>
                </button>
                
                <button className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-700">
                  <FaDownload className="w-4 h-4" />
                  <span>Export</span>
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
          {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
                  <p className="text-gray-600">Loading users...</p>
                </div>
              </div>
            ) : filteredAndSortedUsers.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaUsers className="text-3xl text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {searchTerm ? 'No matching users found' : 'No users available'}
                </h3>
                <p className="text-gray-600">
                  {searchTerm 
                    ? 'Try adjusting your search terms or filters.'
                    : 'No users match the current criteria.'
                  }
                </p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort("fullName")}
                        className="flex items-center space-x-1 hover:text-gray-700"
                      >
                        <span>User</span>
                        {getSortIcon("fullName")}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort("role")}
                        className="flex items-center space-x-1 hover:text-gray-700"
                      >
                        <span>Role</span>
                        {getSortIcon("role")}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort("specialization")}
                        className="flex items-center space-x-1 hover:text-gray-700"
                      >
                        <span>Specialization</span>
                        {getSortIcon("specialization")}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort("registeredOn")}
                        className="flex items-center space-x-1 hover:text-gray-700"
                      >
                        <span>Registered</span>
                        {getSortIcon("registeredOn")}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort("status")}
                        className="flex items-center space-x-1 hover:text-gray-700"
                      >
                        <span>Status</span>
                        {getSortIcon("status")}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                </tr>
              </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedUsers.map((user) => (
                    <tr key={user.username} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                              <span className="text-sm font-medium text-white">
                                {user.fullName?.charAt(0) || user.username?.charAt(0)}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.fullName}
                            </div>
                            <div className="text-sm text-gray-500">
                              @{user.username}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {getRoleIcon(user.role)}
                          <span className="text-sm text-gray-900 capitalize">
                            {user.role}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.specialization || "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.registeredOn}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(user.status, user.role)}`}>
                          {user.status || "Active"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          {user.role === 'therapist' && user.status === 'Pending' && (
                            <button
                              onClick={() => handleUserAction('approve', user)}
                              disabled={actionLoading === user.username}
                              className="text-green-600 hover:text-green-900 p-1 rounded disabled:opacity-50"
                              title="Approve Therapist"
                            >
                              {actionLoading === user.username ? (
                                <FaSpinner className="animate-spin w-4 h-4" />
                              ) : (
                                <FaCheck className="w-4 h-4" />
                              )}
                            </button>
                          )}
                          
                          {user.status === 'Suspended' ? (
                            <button
                              onClick={() => handleUserAction('activate', user)}
                              disabled={actionLoading === user.username}
                              className="text-green-600 hover:text-green-900 p-1 rounded disabled:opacity-50"
                              title="Activate User"
                            >
                              {actionLoading === user.username ? (
                                <FaSpinner className="animate-spin w-4 h-4" />
                              ) : (
                                <FaUnlock className="w-4 h-4" />
                              )}
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                console.log(`🔴 Suspend button clicked for user:`, user);
                                handleUserAction('suspend', user);
                              }}
                              disabled={actionLoading === user.username}
                              className="text-red-600 hover:text-red-900 p-1 rounded disabled:opacity-50"
                              title="Suspend User"
                            >
                              {actionLoading === user.username ? (
                                <FaSpinner className="animate-spin w-4 h-4" />
                              ) : (
                                <FaBan className="w-4 h-4" />
                              )}
                            </button>
                          )}
                        </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700">
                    Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredAndSortedUsers.length)} of {filteredAndSortedUsers.length} results
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-3 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value={10}>10 per page</option>
                    <option value={25}>25 per page</option>
                    <option value={50}>50 per page</option>
                  </select>
                  
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1 text-sm border rounded ${
                          currentPage === page
                            ? "bg-blue-600 text-white border-blue-600"
                            : "border-gray-300 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    
                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>


    </div>
  );
}