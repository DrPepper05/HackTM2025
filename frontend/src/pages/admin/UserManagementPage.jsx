import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../hooks/useAuth'
import { usersApi } from '../../services/api'
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
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [institutionFilter, setInstitutionFilter] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortDirection, setSortDirection] = useState('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)
  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const [showEditUserModal, setShowEditUserModal] = useState(false)
  const [showDeleteUserModal, setShowDeleteUserModal] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [newUser, setNewUser] = useState({
    full_name: '',
    email: '',
    phone: '',
    role: 'clerk',
    institution: '',
  })
  const [formErrors, setFormErrors] = useState({})
  const [successMessage, setSuccessMessage] = useState('')
  const [institutions, setInstitutions] = useState([])

  // Available roles
  const roles = [
    { id: 'admin', name: t('admin.role_admin') },
    { id: 'archivist', name: t('admin.role_archivist') },
    { id: 'clerk', name: t('admin.role_clerk') },
    { id: 'inspector', name: t('admin.role_inspector') },
    { id: 'citizen', name: t('admin.role_citizen') },
    { id: 'media', name: t('admin.role_media') },
  ]

  // Fetch users from API
  const fetchUsers = async (page = 1) => {
    setIsLoading(true)
    try {
      const params = {
        page,
        limit: 20,
        sortBy,
        sortDirection
      }

      if (searchTerm) params.search = searchTerm
      if (roleFilter) params.role = roleFilter
      if (institutionFilter) params.institution = institutionFilter

      const response = await usersApi.getUsers(params)
      
      if (response.success) {
        setUsers(response.data.users || [])
        setTotalPages(response.data.pagination.totalPages || 1)
        setTotalUsers(response.data.pagination.total || 0)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      setUsers([])
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch institutions
  const fetchInstitutions = async () => {
    try {
      const response = await usersApi.getInstitutions()
      if (response.success) {
        setInstitutions(response.data || [])
      }
    } catch (error) {
      console.error('Error fetching institutions:', error)
    }
  }

  // Initial data fetch
  useEffect(() => {
    fetchUsers(currentPage)
    fetchInstitutions()
  }, [currentPage, searchTerm, roleFilter, institutionFilter, sortBy, sortDirection])

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value)
    setCurrentPage(1) // Reset to first page when searching
  }

  // Handle role filter change
  const handleRoleFilterChange = (e) => {
    setRoleFilter(e.target.value)
    setCurrentPage(1)
  }

  // Handle institution filter change
  const handleInstitutionFilterChange = (e) => {
    setInstitutionFilter(e.target.value)
    setCurrentPage(1)
  }

  // Handle sort change
  const handleSortChange = (field) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortDirection('asc')
    }
    setCurrentPage(1)
  }

  // Reset all filters
  const handleResetFilters = () => {
    setSearchTerm('')
    setRoleFilter('')
    setInstitutionFilter('')
    setSortBy('created_at')
    setSortDirection('desc')
    setCurrentPage(1)
  }

  // Handle add user click
  const handleAddUserClick = () => {
    setNewUser({
      full_name: '',
      email: '',
      phone: '',
      role: 'clerk',
      institution: '',
    })
    setFormErrors({})
    setShowAddUserModal(true)
  }

  // Handle edit user click
  const handleEditUserClick = (userToEdit) => {
    setCurrentUser(userToEdit)
    setNewUser({
      full_name: userToEdit.full_name || '',
      email: userToEdit.email || '',
      phone: userToEdit.phone || '',
      role: userToEdit.role || 'clerk',
      institution: userToEdit.institution || '',
    })
    setFormErrors({})
    setShowEditUserModal(true)
  }

  // Handle delete user click
  const handleDeleteUserClick = (userToDelete) => {
    setCurrentUser(userToDelete)
    setShowDeleteUserModal(true)
  }

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setNewUser((prev) => ({
      ...prev,
      [name]: value,
    }))
    
    // Clear specific field error when user starts typing
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: '',
      }))
    }
  }

  // Validate form
  const validateForm = () => {
    const errors = {}

    if (!newUser.full_name.trim()) {
      errors.full_name = t('admin.error_name_required')
    }

    if (!newUser.email.trim()) {
      errors.email = t('admin.error_email_required')
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUser.email)) {
      errors.email = t('admin.error_email_invalid')
    }

    if (!newUser.role) {
      errors.role = t('admin.error_role_required')
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle add user
  const handleAddUser = async () => {
    if (!validateForm()) return

    try {
      const response = await usersApi.createUser(newUser)
      
      if (response.success) {
        setSuccessMessage(t('admin.user_created_success'))
        setShowAddUserModal(false)
        fetchUsers(currentPage) // Refresh the user list
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(''), 3000)
      }
    } catch (error) {
      console.error('Error creating user:', error)
      setFormErrors({ general: error.message || t('admin.error_creating_user') })
    }
  }

  // Handle update user
  const handleUpdateUser = async () => {
    if (!validateForm()) return

    try {
      const response = await usersApi.updateUser(currentUser.id, newUser)
      
      if (response.success) {
        setSuccessMessage(t('admin.user_updated_success'))
        setShowEditUserModal(false)
        fetchUsers(currentPage) // Refresh the user list
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(''), 3000)
      }
    } catch (error) {
      console.error('Error updating user:', error)
      setFormErrors({ general: error.message || t('admin.error_updating_user') })
    }
  }

  // Handle delete user
  const handleDeleteUser = async () => {
    try {
      const response = await usersApi.deleteUser(currentUser.id)
      
      if (response.success) {
        setSuccessMessage(t('admin.user_deleted_success'))
        setShowDeleteUserModal(false)
        fetchUsers(currentPage) // Refresh the user list
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(''), 3000)
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      setFormErrors({ general: error.message || t('admin.error_deleting_user') })
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
              <label
                htmlFor="search"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                {t('admin.search')}
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="search"
                  id="search"
                  className="block w-full rounded-lg border-gray-300 pl-10 pr-4 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder={t('admin.search_placeholder')}
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
              </div>
            </div>

            {/* Role Filter */}
            <div>
              <label
                htmlFor="roleFilter"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                {t('admin.filter_by_role')}
              </label>
              <div className="relative">
                <select
                  id="roleFilter"
                  name="roleFilter"
                  className="block w-full appearance-none rounded-lg border-gray-300 pl-10 pr-10 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
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
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Shield className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <ChevronDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
              </div>
            </div>

            {/* Institution Filter */}
            <div>
              <label
                htmlFor="institutionFilter"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                {t('admin.filter_by_institution')}
              </label>
              <div className="relative">
                <select
                  id="institutionFilter"
                  name="institutionFilter"
                  className="block w-full appearance-none rounded-lg border-gray-300 pl-10 pr-10 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                  value={institutionFilter}
                  onChange={handleInstitutionFilterChange}
                >
                  <option value="">{t('admin.all_institutions')}</option>
                  {institutions.map((institution) => (
                    <option key={institution.id} value={institution.id}>
                      {institution.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Building className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <ChevronDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
              </div>
            </div>

            {/* Reset Filters */}
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex w-full items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
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
                  <div className="loading-container bg-white h-64">
                    <div className="loading-spinner"></div>
                    <p className="text-gray-600 text-sm mt-2">{t('admin.loading_users')}</p>
                  </div>
                ) : users.length === 0 ? (
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
                          onClick={() => handleSortChange('full_name')}
                        >
                          <div className="group inline-flex">
                            {t('admin.name')}
                            <span
                              className={`ml-2 flex-none rounded ${sortBy === 'full_name' ? 'bg-gray-200 text-gray-900' : 'invisible text-gray-400 group-hover:visible group-focus:visible'}`}
                            >
                              <ChevronDown
                                className={`h-5 w-5 ${sortBy === 'full_name' && sortDirection === 'desc' ? 'rotate-180' : ''}`}
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
                          onClick={() => handleSortChange('institution')}
                        >
                          <div className="group inline-flex">
                            {t('admin.institution')}
                            <span
                              className={`ml-2 flex-none rounded ${sortBy === 'institution' ? 'bg-gray-200 text-gray-900' : 'invisible text-gray-400 group-hover:visible group-focus:visible'}`}
                            >
                              <ChevronDown
                                className={`h-5 w-5 ${sortBy === 'institution' && sortDirection === 'desc' ? 'rotate-180' : ''}`}
                                aria-hidden="true"
                              />
                            </span>
                          </div>
                        </th>
                        <th
                          scope="col"
                          className="cursor-pointer px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                          onClick={() => handleSortChange('created_at')}
                        >
                          <div className="group inline-flex">
                            {t('admin.last_login')}
                            <span
                              className={`ml-2 flex-none rounded ${sortBy === 'created_at' ? 'bg-gray-200 text-gray-900' : 'invisible text-gray-400 group-hover:visible group-focus:visible'}`}
                            >
                              <ChevronDown
                                className={`h-5 w-5 ${sortBy === 'created_at' && sortDirection === 'desc' ? 'rotate-180' : ''}`}
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
                      {users.map((user) => (
                        <tr key={user.id}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                            <div className="flex items-center">
                              <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gray-200 flex items-center justify-center">
                                <span className="font-medium text-gray-600">
                                  {user.full_name
                                    .split(' ')
                                    .map((n) => n[0])
                                    .join('')}
                                </span>
                              </div>
                              <div className="ml-4">
                                <div className="font-medium text-gray-900">{user.full_name}</div>
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
                            {getInstitutionName(user.institution)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {formatDate(user.created_at)}
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
                      <label
                        htmlFor="full_name"
                        className="mb-1 block text-sm font-medium text-gray-700"
                      >
                        {t('admin.name')}
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          name="full_name"
                          id="full_name"
                          className={`block w-full rounded-lg ${
                            formErrors.full_name
                              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                              : 'border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary'
                          } pl-10 pr-4 py-2 text-sm`}
                          value={newUser.full_name}
                          onChange={handleInputChange}
                        />
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <Users className={`h-5 w-5 ${formErrors.full_name ? 'text-red-400' : 'text-gray-400'}`} aria-hidden="true" />
                        </div>
                        {formErrors.full_name && (
                          <p className="mt-2 text-sm text-red-600">{formErrors.full_name}</p>
                        )}
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label
                        htmlFor="email"
                        className="mb-1 block text-sm font-medium text-gray-700"
                      >
                        {t('admin.email')}
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          name="email"
                          id="email"
                          className={`block w-full rounded-lg ${
                            formErrors.email
                              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                              : 'border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary'
                          } pl-10 pr-4 py-2 text-sm`}
                          value={newUser.email}
                          onChange={handleInputChange}
                        />
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <Mail className={`h-5 w-5 ${formErrors.email ? 'text-red-400' : 'text-gray-400'}`} aria-hidden="true" />
                        </div>
                        {formErrors.email && (
                          <p className="mt-2 text-sm text-red-600">{formErrors.email}</p>
                        )}
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label
                        htmlFor="phone"
                        className="mb-1 block text-sm font-medium text-gray-700"
                      >
                        {t('admin.phone')}
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          name="phone"
                          id="phone"
                          className="block w-full rounded-lg border-gray-300 pl-10 pr-4 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                          value={newUser.phone}
                          onChange={handleInputChange}
                        />
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <Phone className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </div>
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label
                        htmlFor="role"
                        className="mb-1 block text-sm font-medium text-gray-700"
                      >
                        {t('admin.role')}
                      </label>
                      <div className="relative">
                        <select
                          id="role"
                          name="role"
                          className={`block w-full appearance-none rounded-lg ${
                            formErrors.role
                              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                              : 'border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary'
                          } pl-10 pr-10 py-2 text-sm`}
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
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <Shield className={`h-5 w-5 ${formErrors.role ? 'text-red-400' : 'text-gray-400'}`} aria-hidden="true" />
                        </div>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                          <ChevronDown className={`h-5 w-5 ${formErrors.role ? 'text-red-400' : 'text-gray-400'}`} aria-hidden="true" />
                        </div>
                        {formErrors.role && (
                          <p className="mt-2 text-sm text-red-600">{formErrors.role}</p>
                        )}
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label
                        htmlFor="institution"
                        className="mb-1 block text-sm font-medium text-gray-700"
                      >
                        {t('admin.institution')}
                      </label>
                      <div className="relative">
                        <select
                          id="institution"
                          name="institution"
                          className={`block w-full appearance-none rounded-lg ${
                            formErrors.institution
                              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                              : 'border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary'
                          } pl-10 pr-10 py-2 text-sm`}
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
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <Building className={`h-5 w-5 ${formErrors.institution ? 'text-red-400' : 'text-gray-400'}`} aria-hidden="true" />
                        </div>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                          <ChevronDown className={`h-5 w-5 ${formErrors.institution ? 'text-red-400' : 'text-gray-400'}`} aria-hidden="true" />
                        </div>
                        {formErrors.institution && (
                          <p className="mt-2 text-sm text-red-600">{formErrors.institution}</p>
                        )}
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
                      <label
                        htmlFor="full_name"
                        className="mb-1 block text-sm font-medium text-gray-700"
                      >
                        {t('admin.name')}
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          name="full_name"
                          id="full_name"
                          className={`block w-full rounded-lg ${
                            formErrors.full_name
                              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                              : 'border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary'
                          } pl-10 pr-4 py-2 text-sm`}
                          value={newUser.full_name}
                          onChange={handleInputChange}
                        />
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <Users className={`h-5 w-5 ${formErrors.full_name ? 'text-red-400' : 'text-gray-400'}`} aria-hidden="true" />
                        </div>
                        {formErrors.full_name && (
                          <p className="mt-2 text-sm text-red-600">{formErrors.full_name}</p>
                        )}
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label
                        htmlFor="email"
                        className="mb-1 block text-sm font-medium text-gray-700"
                      >
                        {t('admin.email')}
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          name="email"
                          id="email"
                          className={`block w-full rounded-lg ${
                            formErrors.email
                              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                              : 'border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary'
                          } pl-10 pr-4 py-2 text-sm`}
                          value={newUser.email}
                          onChange={handleInputChange}
                        />
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <Mail className={`h-5 w-5 ${formErrors.email ? 'text-red-400' : 'text-gray-400'}`} aria-hidden="true" />
                        </div>
                        {formErrors.email && (
                          <p className="mt-2 text-sm text-red-600">{formErrors.email}</p>
                        )}
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label
                        htmlFor="phone"
                        className="mb-1 block text-sm font-medium text-gray-700"
                      >
                        {t('admin.phone')}
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          name="phone"
                          id="phone"
                          className="block w-full rounded-lg border-gray-300 pl-10 pr-4 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                          value={newUser.phone}
                          onChange={handleInputChange}
                        />
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <Phone className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </div>
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label
                        htmlFor="role"
                        className="mb-1 block text-sm font-medium text-gray-700"
                      >
                        {t('admin.role')}
                      </label>
                      <div className="relative">
                        <select
                          id="role"
                          name="role"
                          className={`block w-full appearance-none rounded-lg ${
                            formErrors.role
                              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                              : 'border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary'
                          } pl-10 pr-10 py-2 text-sm`}
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
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <Shield className={`h-5 w-5 ${formErrors.role ? 'text-red-400' : 'text-gray-400'}`} aria-hidden="true" />
                        </div>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                          <ChevronDown className={`h-5 w-5 ${formErrors.role ? 'text-red-400' : 'text-gray-400'}`} aria-hidden="true" />
                        </div>
                        {formErrors.role && (
                          <p className="mt-2 text-sm text-red-600">{formErrors.role}</p>
                        )}
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label
                        htmlFor="institution"
                        className="mb-1 block text-sm font-medium text-gray-700"
                      >
                        {t('admin.institution')}
                      </label>
                      <div className="relative">
                        <select
                          id="institution"
                          name="institution"
                          className={`block w-full appearance-none rounded-lg ${
                            formErrors.institution
                              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                              : 'border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary'
                          } pl-10 pr-10 py-2 text-sm`}
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
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <Building className={`h-5 w-5 ${formErrors.institution ? 'text-red-400' : 'text-gray-400'}`} aria-hidden="true" />
                        </div>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                          <ChevronDown className={`h-5 w-5 ${formErrors.institution ? 'text-red-400' : 'text-gray-400'}`} aria-hidden="true" />
                        </div>
                        {formErrors.institution && (
                          <p className="mt-2 text-sm text-red-600">{formErrors.institution}</p>
                        )}
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
                        {t('admin.delete_user_confirmation', { name: currentUser?.full_name })}
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