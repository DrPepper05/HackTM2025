import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../hooks/useAuth'
import {
  Users,
  UserPlus,
  UserCheck,
  UserX,
  Edit,
  Trash2,
  Search,
  Filter,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  ChevronDown,
  Mail,
  Phone,
  Calendar,
  Shield,
  Building,
  X,
} from 'lucide-react'

function UserManagementPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [sortDirection, setSortDirection] = useState('asc')
  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const [showEditUserModal, setShowEditUserModal] = useState(false)
  const [showDeleteUserModal, setShowDeleteUserModal] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'clerk',
    institution: '',
    department: '',
    status: 'active',
  })
  const [formErrors, setFormErrors] = useState({})
  const [successMessage, setSuccessMessage] = useState('')

  // Mock roles for dropdown
  const roles = [
    { id: 'admin', name: t('admin.role_admin') },
    { id: 'archivist', name: t('admin.role_archivist') },
    { id: 'clerk', name: t('admin.role_clerk') },
    { id: 'inspector', name: t('admin.role_inspector') },
  ]

  // Mock institutions for dropdown
  const institutions = [
    { id: 'inst1', name: 'Primăria Municipiului' },
    { id: 'inst2', name: 'Consiliul Local' },
    { id: 'inst3', name: 'Direcția de Asistență Socială' },
    { id: 'inst4', name: 'Direcția de Urbanism' },
    { id: 'inst5', name: 'Serviciul Public Comunitar Local de Evidență a Persoanelor' },
  ]

  // Mock departments for dropdown
  const departments = [
    { id: 'dept1', name: t('admin.department_general') },
    { id: 'dept2', name: t('admin.department_hr') },
    { id: 'dept3', name: t('admin.department_finance') },
    { id: 'dept4', name: t('admin.department_legal') },
    { id: 'dept5', name: t('admin.department_it') },
    { id: 'dept6', name: t('admin.department_archive') },
  ]

  // Fetch users
  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      // In a real app, this would be an API call
      // For the hackathon, we'll use mock data
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Generate 20 mock users
      const mockUsers = Array.from({ length: 20 }, (_, i) => {
        const roleId = ['admin', 'archivist', 'clerk', 'inspector'][Math.floor(Math.random() * 4)]
        const institutionId = `inst${Math.floor(Math.random() * 5) + 1}`
        const departmentId = `dept${Math.floor(Math.random() * 6) + 1}`
        const statusOptions = ['active', 'inactive', 'pending']
        const status = statusOptions[Math.floor(Math.random() * statusOptions.length)]

        return {
          id: `user${i + 1}`,
          name: [
            'Ana Popescu',
            'Ion Ionescu',
            'Maria Dumitrescu',
            'Andrei Radu',
            'Elena Popa',
            'Mihai Stancu',
            'Cristina Diaconu',
            'Alexandru Munteanu',
            'Ioana Stoica',
            'Bogdan Georgescu',
          ][i % 10],
          email: `user${i + 1}@example.com`,
          phone: `07${Math.floor(10000000 + Math.random() * 90000000)}`,
          role: roleId,
          institution: institutionId,
          department: departmentId,
          status: status,
          lastLogin: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 365) * 24 * 60 * 60 * 1000).toISOString(),
        }
      })

      setUsers(mockUsers)
      setFilteredUsers(mockUsers)
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Initial data fetch
  useEffect(() => {
    fetchUsers()
  }, [])

  // Filter and sort users when search term, filters, or sort options change
  useEffect(() => {
    let result = [...users]

    // Apply search filter
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase()
      result = result.filter(
        (user) =>
          user.name.toLowerCase().includes(lowerSearchTerm) ||
          user.email.toLowerCase().includes(lowerSearchTerm)
      )
    }

    // Apply role filter
    if (roleFilter) {
      result = result.filter((user) => user.role === roleFilter)
    }

    // Apply status filter
    if (statusFilter) {
      result = result.filter((user) => user.status === statusFilter)
    }

    // Apply sorting
    result.sort((a, b) => {
      let aValue = a[sortBy]
      let bValue = b[sortBy]

      // Handle date fields
      if (sortBy === 'lastLogin' || sortBy === 'createdAt') {
        aValue = new Date(aValue)
        bValue = new Date(bValue)
      }

      if (aValue < bValue) {
        return sortDirection === 'asc' ? -1 : 1
      }
      if (aValue > bValue) {
        return sortDirection === 'asc' ? 1 : -1
      }
      return 0
    })

    setFilteredUsers(result)
  }, [users, searchTerm, roleFilter, statusFilter, sortBy, sortDirection])

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value)
  }

  // Handle role filter change
  const handleRoleFilterChange = (e) => {
    setRoleFilter(e.target.value)
  }

  // Handle status filter change
  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value)
  }

  // Handle sort change
  const handleSortChange = (field) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortDirection('asc')
    }
  }

  // Reset filters
  const handleResetFilters = () => {
    setSearchTerm('')
    setRoleFilter('')
    setStatusFilter('')
    setSortBy('name')
    setSortDirection('asc')
  }

  // Open add user modal
  const handleAddUserClick = () => {
    setNewUser({
      name: '',
      email: '',
      phone: '',
      role: 'clerk',
      institution: '',
      department: '',
      status: 'active',
    })
    setFormErrors({})
    setShowAddUserModal(true)
  }

  // Open edit user modal
  const handleEditUserClick = (user) => {
    setCurrentUser(user)
    setNewUser({ ...user })
    setFormErrors({})
    setShowEditUserModal(true)
  }

  // Open delete user modal
  const handleDeleteUserClick = (user) => {
    setCurrentUser(user)
    setShowDeleteUserModal(true)
  }

  // Handle input change for add/edit user form
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setNewUser((prev) => ({ ...prev, [name]: value }))

    // Clear error for this field if it exists
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  // Validate form
  const validateForm = () => {
    const errors = {}

    if (!newUser.name.trim()) {
      errors.name = t('admin.name_required')
    }

    if (!newUser.email.trim()) {
      errors.email = t('admin.email_required')
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUser.email)) {
      errors.email = t('admin.email_invalid')
    }

    if (!newUser.role) {
      errors.role = t('admin.role_required')
    }

    if (!newUser.institution) {
      errors.institution = t('admin.institution_required')
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Add new user
  const handleAddUser = async () => {
    if (!validateForm()) return

    try {
      // In a real app, this would be an API call
      // For the hackathon, we'll simulate adding a user
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const newUserData = {
        ...newUser,
        id: `user${users.length + 1}`,
        createdAt: new Date().toISOString(),
        lastLogin: null,
      }

      setUsers((prev) => [newUserData, ...prev])
      setShowAddUserModal(false)
      setSuccessMessage(t('admin.user_added_success'))

      // Hide success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage('')
      }, 5000)
    } catch (error) {
      console.error('Error adding user:', error)
    }
  }

  // Update user
  const handleUpdateUser = async () => {
    if (!validateForm()) return

    try {
      // In a real app, this would be an API call
      // For the hackathon, we'll simulate updating a user
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setUsers((prev) =>
        prev.map((u) => (u.id === currentUser.id ? { ...u, ...newUser } : u))
      )
      setShowEditUserModal(false)
      setSuccessMessage(t('admin.user_updated_success'))

      // Hide success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage('')
      }, 5000)
    } catch (error) {
      console.error('Error updating user:', error)
    }
  }

  // Delete user
  const handleDeleteUser = async () => {
    try {
      // In a real app, this would be an API call
      // For the hackathon, we'll simulate deleting a user
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setUsers((prev) => prev.filter((u) => u.id !== currentUser.id))
      setShowDeleteUserModal(false)
      setSuccessMessage(t('admin.user_deleted_success'))

      // Hide success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage('')
      }, 5000)
    } catch (error) {
      console.error('Error deleting user:', error)
    }
  }

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return t('admin.never')
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  // Get role name by ID
  const getRoleName = (roleId) => {
    const role = roles.find((r) => r.id === roleId)
    return role ? role.name : roleId
  }

  // Get institution name by ID
  const getInstitutionName = (institutionId) => {
    const institution = institutions.find((i) => i.id === institutionId)
    return institution ? institution.name : institutionId
  }

  // Get department name by ID
  const getDepartmentName = (departmentId) => {
    const department = departments.find((d) => d.id === departmentId)
    return department ? department.name : departmentId
  }

  // Get status badge color
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'inactive':
        return 'bg-gray-100 text-gray-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Get role badge color
  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800'
      case 'archivist':
        return 'bg-blue-100 text-blue-800'
      case 'clerk':
        return 'bg-green-100 text-green-800'
      case 'inspector':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 md:flex md:items-center md:justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
              {t('admin.user_management')}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {t('admin.user_management_description')}
            </p>
          </div>
          <div className="mt-4 flex md:ml-4 md:mt-0">
            <button
              type="button"
              onClick={handleAddUserClick}
              className="ml-3 inline-flex items-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              <UserPlus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              {t('admin.add_user')}
            </button>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 rounded-md bg-green-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-green-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">{successMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
            {/* Search */}
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700">
                {t('admin.search')}
              </label>
              <div className="relative mt-1 rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  type="text"
                  name="search"
                  id="search"
                  className="block w-full rounded-md border-gray-300 pl-10 focus:border-primary focus:ring-primary sm:text-sm"
                  placeholder={t('admin.search_placeholder')}
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </div>
            </div>

            {/* Role Filter */}
            <div>
              <label htmlFor="roleFilter" className="block text-sm font-medium text-gray-700">
                {t('admin.filter_by_role')}
              </label>
              <select
                id="roleFilter"
                name="roleFilter"
                className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
                value={roleFilter}
                onChange={handleRoleFilterChange}
              >
                <option value="">{t('admin.all_roles')}</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700">
                {t('admin.filter_by_status')}
              </label>
              <select
                id="statusFilter"
                name="statusFilter"
                className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
                value={statusFilter}
                onChange={handleStatusFilterChange}
              >
                <option value="">{t('admin.all_statuses')}</option>
                <option value="active">{t('admin.status_active')}</option>
                <option value="inactive">{t('admin.status_inactive')}</option>
                <option value="pending">{t('admin.status_pending')}</option>
              </select>
            </div>

            {/* Reset Filters */}
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                <RefreshCw className="-ml-1 mr-2 h-5 w-5 text-gray-400" aria-hidden="true" />
                {t('admin.reset_filters')}
              </button>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="mt-8 flex flex-col">
          <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                {isLoading ? (
                  <div className="flex h-64 items-center justify-center bg-white">
                    <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2 text-lg font-medium text-gray-700">
                      {t('admin.loading_users')}
                    </span>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="flex h-64 flex-col items-center justify-center bg-white">
                    <Users className="h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      {t('admin.no_users_found')}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {t('admin.no_users_found_description')}
                    </p>
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="cursor-pointer py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                          onClick={() => handleSortChange('name')}
                        >
                          <div className="group inline-flex">
                            {t('admin.name')}
                            <span
                              className={`ml-2 flex-none rounded ${sortBy === 'name' ? 'bg-gray-200 text-gray-900' : 'invisible text-gray-400 group-hover:visible group-focus:visible'}`}
                            >
                              <ChevronDown
                                className={`h-5 w-5 ${sortBy === 'name' && sortDirection === 'desc' ? 'rotate-180' : ''}`}
                                aria-hidden="true"
                              />
                            </span>
                          </div>
                        </th>
                        <th
                          scope="col"
                          className="cursor-pointer px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                          onClick={() => handleSortChange('email')}
                        >
                          <div className="group inline-flex">
                            {t('admin.email')}
                            <span
                              className={`ml-2 flex-none rounded ${sortBy === 'email' ? 'bg-gray-200 text-gray-900' : 'invisible text-gray-400 group-hover:visible group-focus:visible'}`}
                            >
                              <ChevronDown
                                className={`h-5 w-5 ${sortBy === 'email' && sortDirection === 'desc' ? 'rotate-180' : ''}`}
                                aria-hidden="true"
                              />
                            </span>
                          </div>
                        </th>
                        <th
                          scope="col"
                          className="cursor-pointer px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                          onClick={() => handleSortChange('role')}
                        >
                          <div className="group inline-flex">
                            {t('admin.role')}
                            <span
                              className={`ml-2 flex-none rounded ${sortBy === 'role' ? 'bg-gray-200 text-gray-900' : 'invisible text-gray-400 group-hover:visible group-focus:visible'}`}
                            >
                              <ChevronDown
                                className={`h-5 w-5 ${sortBy === 'role' && sortDirection === 'desc' ? 'rotate-180' : ''}`}
                                aria-hidden="true"
                              />
                            </span>
                          </div>
                        </th>
                        <th
                          scope="col"
                          className="cursor-pointer px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                          onClick={() => handleSortChange('status')}
                        >
                          <div className="group inline-flex">
                            {t('admin.status')}
                            <span
                              className={`ml-2 flex-none rounded ${sortBy === 'status' ? 'bg-gray-200 text-gray-900' : 'invisible text-gray-400 group-hover:visible group-focus:visible'}`}
                            >
                              <ChevronDown
                                className={`h-5 w-5 ${sortBy === 'status' && sortDirection === 'desc' ? 'rotate-180' : ''}`}
                                aria-hidden="true"
                              />
                            </span>
                          </div>
                        </th>
                        <th
                          scope="col"
                          className="cursor-pointer px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                          onClick={() => handleSortChange('lastLogin')}
                        >
                          <div className="group inline-flex">
                            {t('admin.last_login')}
                            <span
                              className={`ml-2 flex-none rounded ${sortBy === 'lastLogin' ? 'bg-gray-200 text-gray-900' : 'invisible text-gray-400 group-hover:visible group-focus:visible'}`}
                            >
                              <ChevronDown
                                className={`h-5 w-5 ${sortBy === 'lastLogin' && sortDirection === 'desc' ? 'rotate-180' : ''}`}
                                aria-hidden="true"
                              />
                            </span>
                          </div>
                        </th>
                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                          <span className="sr-only">{t('admin.actions')}</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {filteredUsers.map((user) => (
                        <tr key={user.id}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                            <div className="flex items-center">
                              <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gray-200 flex items-center justify-center">
                                <span className="font-medium text-gray-600">
                                  {user.name
                                    .split(' ')
                                    .map((n) => n[0])
                                    .join('')}
                                </span>
                              </div>
                              <div className="ml-4">
                                <div className="font-medium text-gray-900">{user.name}</div>
                                <div className="text-gray-500">
                                  {getInstitutionName(user.institution)}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            <div className="text-gray-900">{user.email}</div>
                            <div className="text-gray-500">{user.phone}</div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            <span
                              className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getRoleBadgeColor(
                                user.role
                              )}`}
                            >
                              {getRoleName(user.role)}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            <span
                              className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStatusBadgeColor(
                                user.status
                              )}`}
                            >
                              {user.status === 'active'
                                ? t('admin.status_active')
                                : user.status === 'inactive'
                                ? t('admin.status_inactive')
                                : t('admin.status_pending')}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {formatDate(user.lastLogin)}
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <button
                              type="button"
                              onClick={() => handleEditUserClick(user)}
                              className="text-primary hover:text-primary-dark mr-4"
                            >
                              <Edit className="h-5 w-5" />
                              <span className="sr-only">{t('admin.edit_user')}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteUserClick(user)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="h-5 w-5" />
                              <span className="sr-only">{t('admin.delete_user')}</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Add User Modal */}
        {showAddUserModal && (
          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-screen items-end justify-center px-4 pb-20 pt-4 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>

              <span
                className="hidden sm:inline-block sm:h-screen sm:align-middle"
                aria-hidden="true"
              >
                &#8203;
              </span>

              <div className="inline-block transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 sm:align-middle">
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    onClick={() => setShowAddUserModal(false)}
                  >
                    <span className="sr-only">{t('admin.close')}</span>
                    <X className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary bg-opacity-10 sm:mx-0 sm:h-10 sm:w-10">
                    <UserPlus className="h-6 w-6 text-primary" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">
                      {t('admin.add_new_user')}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {t('admin.add_new_user_description')}
                    </p>
                  </div>
                </div>

                <div className="mt-5 sm:mt-4">
                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-3">
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        {t('admin.name')}
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="name"
                          id="name"
                          className={`block w-full rounded-md ${formErrors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-primary focus:ring-primary'} sm:text-sm`}
                          value={newUser.name}
                          onChange={handleInputChange}
                        />
                        {formErrors.name && (
                          <p className="mt-2 text-sm text-red-600">{formErrors.name}</p>
                        )}
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        {t('admin.email')}
                      </label>
                      <div className="mt-1">
                        <input
                          type="email"
                          name="email"
                          id="email"
                          className={`block w-full rounded-md ${formErrors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-primary focus:ring-primary'} sm:text-sm`}
                          value={newUser.email}
                          onChange={handleInputChange}
                        />
                        {formErrors.email && (
                          <p className="mt-2 text-sm text-red-600">{formErrors.email}</p>
                        )}
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                        {t('admin.phone')}
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="phone"
                          id="phone"
                          className="block w-full rounded-md border-gray-300 focus:border-primary focus:ring-primary sm:text-sm"
                          value={newUser.phone}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                        {t('admin.role')}
                      </label>
                      <div className="mt-1">
                        <select
                          id="role"
                          name="role"
                          className={`block w-full rounded-md ${formErrors.role ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-primary focus:ring-primary'} sm:text-sm`}
                          value={newUser.role}
                          onChange={handleInputChange}
                        >
                          <option value="">{t('admin.select_role')}</option>
                          {roles.map((role) => (
                            <option key={role.id} value={role.id}>
                              {role.name}
                            </option>
                          ))}
                        </select>
                        {formErrors.role && (
                          <p className="mt-2 text-sm text-red-600">{formErrors.role}</p>
                        )}
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label
                        htmlFor="institution"
                        className="block text-sm font-medium text-gray-700"
                      >
                        {t('admin.institution')}
                      </label>
                      <div className="mt-1">
                        <select
                          id="institution"
                          name="institution"
                          className={`block w-full rounded-md ${formErrors.institution ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-primary focus:ring-primary'} sm:text-sm`}
                          value={newUser.institution}
                          onChange={handleInputChange}
                        >
                          <option value="">{t('admin.select_institution')}</option>
                          {institutions.map((institution) => (
                            <option key={institution.id} value={institution.id}>
                              {institution.name}
                            </option>
                          ))}
                        </select>
                        {formErrors.institution && (
                          <p className="mt-2 text-sm text-red-600">{formErrors.institution}</p>
                        )}
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label
                        htmlFor="department"
                        className="block text-sm font-medium text-gray-700"
                      >
                        {t('admin.department')}
                      </label>
                      <div className="mt-1">
                        <select
                          id="department"
                          name="department"
                          className="block w-full rounded-md border-gray-300 focus:border-primary focus:ring-primary sm:text-sm"
                          value={newUser.department}
                          onChange={handleInputChange}
                        >
                          <option value="">{t('admin.select_department')}</option>
                          {departments.map((department) => (
                            <option key={department.id} value={department.id}>
                              {department.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                        {t('admin.status')}
                      </label>
                      <div className="mt-1">
                        <select
                          id="status"
                          name="status"
                          className="block w-full rounded-md border-gray-300 focus:border-primary focus:ring-primary sm:text-sm"
                          value={newUser.status}
                          onChange={handleInputChange}
                        >
                          <option value="active">{t('admin.status_active')}</option>
                          <option value="inactive">{t('admin.status_inactive')}</option>
                          <option value="pending">{t('admin.status_pending')}</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 sm:col-start-2 sm:text-sm"
                    onClick={handleAddUser}
                  >
                    {t('admin.add_user')}
                  </button>
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 sm:col-start-1 sm:mt-0 sm:text-sm"
                    onClick={() => setShowAddUserModal(false)}
                  >
                    {t('admin.cancel')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {showEditUserModal && (
          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-screen items-end justify-center px-4 pb-20 pt-4 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>

              <span
                className="hidden sm:inline-block sm:h-screen sm:align-middle"
                aria-hidden="true"
              >
                &#8203;
              </span>

              <div className="inline-block transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 sm:align-middle">
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    onClick={() => setShowEditUserModal(false)}
                  >
                    <span className="sr-only">{t('admin.close')}</span>
                    <X className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                    <Edit className="h-6 w-6 text-blue-600" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">
                      {t('admin.edit_user')}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {t('admin.edit_user_description')}
                    </p>
                  </div>
                </div>

                <div className="mt-5 sm:mt-4">
                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-3">
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        {t('admin.name')}
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="name"
                          id="name"
                          className={`block w-full rounded-md ${formErrors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-primary focus:ring-primary'} sm:text-sm`}
                          value={newUser.name}
                          onChange={handleInputChange}
                        />
                        {formErrors.name && (
                          <p className="mt-2 text-sm text-red-600">{formErrors.name}</p>
                        )}
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        {t('admin.email')}
                      </label>
                      <div className="mt-1">
                        <input
                          type="email"
                          name="email"
                          id="email"
                          className={`block w-full rounded-md ${formErrors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-primary focus:ring-primary'} sm:text-sm`}
                          value={newUser.email}
                          onChange={handleInputChange}
                        />
                        {formErrors.email && (
                          <p className="mt-2 text-sm text-red-600">{formErrors.email}</p>
                        )}
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                        {t('admin.phone')}
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="phone"
                          id="phone"
                          className="block w-full rounded-md border-gray-300 focus:border-primary focus:ring-primary sm:text-sm"
                          value={newUser.phone}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                        {t('admin.role')}
                      </label>
                      <div className="mt-1">
                        <select
                          id="role"
                          name="role"
                          className={`block w-full rounded-md ${formErrors.role ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-primary focus:ring-primary'} sm:text-sm`}
                          value={newUser.role}
                          onChange={handleInputChange}
                        >
                          <option value="">{t('admin.select_role')}</option>
                          {roles.map((role) => (
                            <option key={role.id} value={role.id}>
                              {role.name}
                            </option>
                          ))}
                        </select>
                        {formErrors.role && (
                          <p className="mt-2 text-sm text-red-600">{formErrors.role}</p>
                        )}
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label
                        htmlFor="institution"
                        className="block text-sm font-medium text-gray-700"
                      >
                        {t('admin.institution')}
                      </label>
                      <div className="mt-1">
                        <select
                          id="institution"
                          name="institution"
                          className={`block w-full rounded-md ${formErrors.institution ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-primary focus:ring-primary'} sm:text-sm`}
                          value={newUser.institution}
                          onChange={handleInputChange}
                        >
                          <option value="">{t('admin.select_institution')}</option>
                          {institutions.map((institution) => (
                            <option key={institution.id} value={institution.id}>
                              {institution.name}
                            </option>
                          ))}
                        </select>
                        {formErrors.institution && (
                          <p className="mt-2 text-sm text-red-600">{formErrors.institution}</p>
                        )}
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label
                        htmlFor="department"
                        className="block text-sm font-medium text-gray-700"
                      >
                        {t('admin.department')}
                      </label>
                      <div className="mt-1">
                        <select
                          id="department"
                          name="department"
                          className="block w-full rounded-md border-gray-300 focus:border-primary focus:ring-primary sm:text-sm"
                          value={newUser.department}
                          onChange={handleInputChange}
                        >
                          <option value="">{t('admin.select_department')}</option>
                          {departments.map((department) => (
                            <option key={department.id} value={department.id}>
                              {department.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                        {t('admin.status')}
                      </label>
                      <div className="mt-1">
                        <select
                          id="status"
                          name="status"
                          className="block w-full rounded-md border-gray-300 focus:border-primary focus:ring-primary sm:text-sm"
                          value={newUser.status}
                          onChange={handleInputChange}
                        >
                          <option value="active">{t('admin.status_active')}</option>
                          <option value="inactive">{t('admin.status_inactive')}</option>
                          <option value="pending">{t('admin.status_pending')}</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:col-start-2 sm:text-sm"
                    onClick={handleUpdateUser}
                  >
                    {t('admin.save_changes')}
                  </button>
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 sm:col-start-1 sm:mt-0 sm:text-sm"
                    onClick={() => setShowEditUserModal(false)}
                  >
                    {t('admin.cancel')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete User Modal */}
        {showDeleteUserModal && (
          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-screen items-end justify-center px-4 pb-20 pt-4 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>

              <span
                className="hidden sm:inline-block sm:h-screen sm:align-middle"
                aria-hidden="true"
              >
                &#8203;
              </span>

              <div className="inline-block transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 sm:align-middle">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">
                      {t('admin.delete_user')}
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        {t('admin.delete_user_confirmation', { name: currentUser?.name })}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={handleDeleteUser}
                  >
                    {t('admin.delete')}
                  </button>
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
                    onClick={() => setShowDeleteUserModal(false)}
                  >
                    {t('admin.cancel')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default UserManagementPage