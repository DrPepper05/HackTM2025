import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../hooks/useAuth'
import {
  Download,
  FileText,
  Calendar,
  Filter,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Clock,
  BarChart,
  PieChart,
  ListFilter,
  FileDigit,
  FileCog,
  FileSpreadsheet,
  ChevronDown,
} from 'lucide-react'

function InventoryReportsPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [reportType, setReportType] = useState('document_inventory')
  const [dateRange, setDateRange] = useState({ from: '', to: '' })
  const [selectedFund, setSelectedFund] = useState('')
  const [selectedRetention, setSelectedRetention] = useState('')
  const [selectedFormat, setSelectedFormat] = useState('pdf')
  const [includeMetadata, setIncludeMetadata] = useState(true)
  const [includeStatistics, setIncludeStatistics] = useState(true)
  const [generatedReports, setGeneratedReports] = useState([])
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)

  // Mock funds for dropdown
  const funds = [
    { id: 'all', name: t('inspector.all_funds') },
    { id: 'fund1', name: 'Consiliul Local' },
    { id: 'fund2', name: 'Primăria Municipiului' },
    { id: 'fund3', name: 'Direcția de Asistență Socială' },
    { id: 'fund4', name: 'Direcția de Urbanism' },
    { id: 'fund5', name: 'Serviciul Public Comunitar Local de Evidență a Persoanelor' },
  ]

  // Mock retention categories for dropdown
  const retentionCategories = [
    { id: 'all', name: t('inspector.all_retention_categories') },
    { id: 'permanent', name: t('inspector.retention_permanent') },
    { id: 'cs', name: t('inspector.retention_cs') },
    { id: 'c', name: t('inspector.retention_c') },
    { id: 'ci', name: t('inspector.retention_ci') },
    { id: 'cf', name: t('inspector.retention_cf') },
  ]

  // Mock report types
  const reportTypes = [
    {
      id: 'document_inventory',
      name: t('inspector.document_inventory'),
      description: t('inspector.document_inventory_description'),
      icon: <FileText className="h-8 w-8 text-primary" />,
    },
    {
      id: 'retention_summary',
      name: t('inspector.retention_summary'),
      description: t('inspector.retention_summary_description'),
      icon: <Clock className="h-8 w-8 text-primary" />,
    },
    {
      id: 'document_statistics',
      name: t('inspector.document_statistics'),
      description: t('inspector.document_statistics_description'),
      icon: <BarChart className="h-8 w-8 text-primary" />,
    },
    {
      id: 'compliance_report',
      name: t('inspector.compliance_report'),
      description: t('inspector.compliance_report_description'),
      icon: <CheckCircle className="h-8 w-8 text-primary" />,
    },
    {
      id: 'transfer_inventory',
      name: t('inspector.transfer_inventory'),
      description: t('inspector.transfer_inventory_description'),
      icon: <ListFilter className="h-8 w-8 text-primary" />,
    },
  ]

  // Mock export formats
  const exportFormats = [
    {
      id: 'pdf',
      name: 'PDF',
      description: t('inspector.pdf_description'),
      icon: <FileText className="h-6 w-6 text-red-500" />,
    },
    {
      id: 'excel',
      name: 'Excel',
      description: t('inspector.excel_description'),
      icon: <FileSpreadsheet className="h-6 w-6 text-green-500" />,
    },
    {
      id: 'csv',
      name: 'CSV',
      description: t('inspector.csv_description'),
      icon: <FileDigit className="h-6 w-6 text-blue-500" />,
    },
    {
      id: 'xml',
      name: 'XML',
      description: t('inspector.xml_description'),
      icon: <FileCog className="h-6 w-6 text-purple-500" />,
    },
  ]

  // Mock previously generated reports
  const mockGeneratedReports = [
    {
      id: 'report1',
      name: 'Document Inventory - Q1 2023',
      type: 'document_inventory',
      format: 'pdf',
      size: '2.4 MB',
      createdAt: '2023-04-05T10:15:00',
      createdBy: 'Andrei Radu',
      url: '#',
    },
    {
      id: 'report2',
      name: 'Retention Summary - 2022',
      type: 'retention_summary',
      format: 'excel',
      size: '1.8 MB',
      createdAt: '2023-01-10T14:30:00',
      createdBy: 'Andrei Radu',
      url: '#',
    },
    {
      id: 'report3',
      name: 'Compliance Report - H1 2023',
      type: 'compliance_report',
      format: 'pdf',
      size: '3.2 MB',
      createdAt: '2023-07-15T09:45:00',
      createdBy: 'Andrei Radu',
      url: '#',
    },
  ]

  // Handle date range change
  const handleDateChange = (e) => {
    const { name, value } = e.target
    setDateRange((prev) => ({ ...prev, [name]: value }))
  }

  // Handle fund selection change
  const handleFundChange = (e) => {
    setSelectedFund(e.target.value)
  }

  // Handle retention category selection change
  const handleRetentionChange = (e) => {
    setSelectedRetention(e.target.value)
  }

  // Handle report type selection
  const handleReportTypeChange = (type) => {
    setReportType(type)
  }

  // Handle format selection
  const handleFormatChange = (format) => {
    setSelectedFormat(format)
  }

  // Handle metadata inclusion toggle
  const handleMetadataToggle = () => {
    setIncludeMetadata(!includeMetadata)
  }

  // Handle statistics inclusion toggle
  const handleStatisticsToggle = () => {
    setIncludeStatistics(!includeStatistics)
  }

  // Reset all filters
  const handleResetFilters = () => {
    setDateRange({ from: '', to: '' })
    setSelectedFund('')
    setSelectedRetention('')
    setIncludeMetadata(true)
    setIncludeStatistics(true)
  }

  // Generate report
  const handleGenerateReport = async () => {
    setIsLoading(true)
    try {
      // In a real app, this would be an API call to generate the report
      // For the hackathon, we'll simulate a report generation
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Add the new report to the list of generated reports
      const selectedReportType = reportTypes.find((type) => type.id === reportType)
      const selectedReportFormat = exportFormats.find((format) => format.id === selectedFormat)

      const newReport = {
        id: `report${Date.now()}`,
        name: `${selectedReportType.name} - ${new Date().toLocaleDateString()}`,
        type: reportType,
        format: selectedFormat,
        size: `${(Math.random() * 5 + 1).toFixed(1)} MB`,
        createdAt: new Date().toISOString(),
        createdBy: user.name,
        url: '#',
      }

      setGeneratedReports([newReport, ...mockGeneratedReports])
      setShowSuccessMessage(true)

      // Hide success message after 5 seconds
      setTimeout(() => {
        setShowSuccessMessage(false)
      }, 5000)
    } catch (error) {
      console.error('Error generating report:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  // Format time for display
  const formatTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString()
  }

  // Get report type icon
  const getReportTypeIcon = (type) => {
    switch (type) {
      case 'document_inventory':
        return <FileText className="h-5 w-5 text-primary" />
      case 'retention_summary':
        return <Clock className="h-5 w-5 text-primary" />
      case 'document_statistics':
        return <BarChart className="h-5 w-5 text-primary" />
      case 'compliance_report':
        return <CheckCircle className="h-5 w-5 text-primary" />
      case 'transfer_inventory':
        return <ListFilter className="h-5 w-5 text-primary" />
      default:
        return <FileText className="h-5 w-5 text-primary" />
    }
  }

  // Get format icon
  const getFormatIcon = (format) => {
    switch (format) {
      case 'pdf':
        return <FileText className="h-5 w-5 text-red-500" />
      case 'excel':
        return <FileSpreadsheet className="h-5 w-5 text-green-500" />
      case 'csv':
        return <FileDigit className="h-5 w-5 text-blue-500" />
      case 'xml':
        return <FileCog className="h-5 w-5 text-purple-500" />
      default:
        return <FileText className="h-5 w-5 text-gray-500" />
    }
  }

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 md:flex md:items-center md:justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
              {t('inspector.inventory_reports')}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {t('inspector.inventory_reports_description')}
            </p>
          </div>
        </div>

        {/* Success Message */}
        {showSuccessMessage && (
          <div className="mb-6 rounded-md bg-green-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-green-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  {t('inspector.report_generated_success')}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Report Configuration */}
          <div className="lg:col-span-2">
            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                {t('inspector.generate_new_report')}
              </h3>

              {/* Report Type Selection */}
              <div className="mt-6">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  {t('inspector.report_type')}
                </label>
                <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {reportTypes.map((type) => (
                    <div
                      key={type.id}
                      className={`relative flex cursor-pointer rounded-lg border bg-white p-4 shadow-sm hover:border-gray-400 focus:outline-none ${
                        reportType === type.id
                          ? 'border-primary ring-1 ring-primary'
                          : 'border-gray-300'
                      }`}
                      onClick={() => handleReportTypeChange(type.id)}
                    >
                      <div className="flex w-full items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">{type.icon}</div>
                          <div className="ml-4 text-sm">
                            <p className={`font-medium ${reportType === type.id ? 'text-primary' : 'text-gray-900'}`}>
                              {type.name}
                            </p>
                            <p className="text-gray-500">{type.description}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Filters */}
              <div className="mt-8">
                <h4 className="mb-4 text-sm font-medium text-gray-700">{t('inspector.filters')}</h4>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {/* Date From */}
                  <div>
                    <label htmlFor="dateFrom" className="mb-2 block text-sm font-medium text-gray-700">
                      {t('inspector.date_from')}
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Calendar className="h-5 w-5 text-gray-400" aria-hidden="true" />
                      </div>
                      <input
                        type="date"
                        name="from"
                        id="dateFrom"
                        className="block h-10 w-full appearance-none rounded-md border border-gray-300 bg-white pl-10 pr-3 text-sm shadow-sm focus:border-primary focus:ring-primary hover:border-gray-400"
                        value={dateRange.from}
                        onChange={handleDateChange}
                      />
                    </div>
                  </div>

                  {/* Date To */}
                  <div>
                    <label htmlFor="dateTo" className="mb-2 block text-sm font-medium text-gray-700">
                      {t('inspector.date_to')}
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Calendar className="h-5 w-5 text-gray-400" aria-hidden="true" />
                      </div>
                      <input
                        type="date"
                        name="to"
                        id="dateTo"
                        className="block h-10 w-full appearance-none rounded-md border border-gray-300 bg-white pl-10 pr-3 text-sm shadow-sm focus:border-primary focus:ring-primary hover:border-gray-400"
                        value={dateRange.to}
                        onChange={handleDateChange}
                      />
                    </div>
                  </div>

                  {/* Fund Filter */}
                  <div>
                    <label htmlFor="fundFilter" className="mb-2 block text-sm font-medium text-gray-700">
                      {t('inspector.filter_by_fund')}
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <FileText className="h-5 w-5 text-gray-400" aria-hidden="true" />
                      </div>
                      <select
                        id="fundFilter"
                        name="fundFilter"
                        className="block h-10 w-full appearance-none rounded-md border border-gray-300 bg-white pl-10 pr-10 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-primary hover:border-gray-400"
                        value={selectedFund}
                        onChange={handleFundChange}
                      >
                        <option value="">{t('inspector.all_funds')}</option>
                        {funds.map((fund) => (
                          <option key={fund.id} value={fund.id}>
                            {fund.name}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                        <ChevronDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
                      </div>
                    </div>
                  </div>

                  {/* Retention Category Filter */}
                  <div>
                    <label htmlFor="retentionFilter" className="mb-2 block text-sm font-medium text-gray-700">
                      {t('inspector.filter_by_retention')}
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Clock className="h-5 w-5 text-gray-400" aria-hidden="true" />
                      </div>
                      <select
                        id="retentionFilter"
                        name="retentionFilter"
                        className="block h-10 w-full appearance-none rounded-md border border-gray-300 bg-white pl-10 pr-10 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-primary hover:border-gray-400"
                        value={selectedRetention}
                        onChange={handleRetentionChange}
                      >
                        <option value="">{t('inspector.all_retention_categories')}</option>
                        {retentionCategories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                        <ChevronDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Include Options */}
                <div className="mt-6 space-y-4">
                  <div className="relative flex items-start">
                    <div className="flex h-5 items-center">
                      <input
                        id="includeMetadata"
                        name="includeMetadata"
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        checked={includeMetadata}
                        onChange={handleMetadataToggle}
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="includeMetadata" className="font-medium text-gray-700">
                        {t('inspector.include_metadata')}
                      </label>
                      <p className="text-gray-500">{t('inspector.include_metadata_description')}</p>
                    </div>
                  </div>
                  <div className="relative flex items-start">
                    <div className="flex h-5 items-center">
                      <input
                        id="includeStatistics"
                        name="includeStatistics"
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        checked={includeStatistics}
                        onChange={handleStatisticsToggle}
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="includeStatistics" className="font-medium text-gray-700">
                        {t('inspector.include_statistics')}
                      </label>
                      <p className="text-gray-500">{t('inspector.include_statistics_description')}</p>
                    </div>
                  </div>
                </div>

                {/* Reset Filters */}
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="inline-flex h-10 items-center justify-center rounded-md border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 shadow-sm hover:border-gray-400 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  >
                    <RefreshCw className="-ml-1 mr-2 h-5 w-5 text-gray-400" aria-hidden="true" />
                    {t('inspector.reset_filters')}
                  </button>
                </div>
              </div>

              {/* Export Format */}
              <div className="mt-8">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  {t('inspector.export_format')}
                </label>
                <div className="mt-2 grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {exportFormats.map((format) => (
                    <div
                      key={format.id}
                      className={`relative flex cursor-pointer rounded-lg border bg-white p-4 shadow-sm hover:border-gray-400 focus:outline-none ${
                        selectedFormat === format.id
                          ? 'border-primary ring-1 ring-primary'
                          : 'border-gray-300'
                      }`}
                      onClick={() => handleFormatChange(format.id)}
                    >
                      <div className="flex w-full flex-col items-center justify-center">
                        <div className="flex-shrink-0">{format.icon}</div>
                        <div className="mt-2 text-center">
                          <p className={`text-sm font-medium ${selectedFormat === format.id ? 'text-primary' : 'text-gray-900'}`}>
                            {format.name}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <div className="mt-8">
                <button
                  type="button"
                  onClick={handleGenerateReport}
                  disabled={isLoading}
                  className="inline-flex h-10 w-full items-center justify-center rounded-md border border-transparent bg-primary px-4 text-sm font-medium text-white shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="-ml-1 mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
                      {t('inspector.generating_report')}
                    </>
                  ) : (
                    <>
                      <FileText className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                      {t('inspector.generate_report')}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Previously Generated Reports */}
          <div className="lg:col-span-1">
            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                {t('inspector.recent_reports')}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {t('inspector.recent_reports_description')}
              </p>

              <div className="mt-6 flow-root">
                <ul role="list" className="-my-5 divide-y divide-gray-200">
                  {generatedReports.length > 0 ? (
                    generatedReports.map((report) => (
                      <li key={report.id} className="py-4">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gray-100">
                              {getFormatIcon(report.format)}
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-gray-900">
                              {report.name}
                            </p>
                            <p className="truncate text-sm text-gray-500">
                              {formatDate(report.createdAt)} • {report.size}
                            </p>
                          </div>
                          <div>
                            <a
                              href={report.url}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-700 shadow-sm hover:border-gray-400 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                            >
                              <Download className="h-5 w-5" aria-hidden="true" />
                              <span className="sr-only">{t('inspector.download')}</span>
                            </a>
                          </div>
                        </div>
                      </li>
                    ))
                  ) : (
                    <div className="rounded-md bg-yellow-50 p-3">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <AlertTriangle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                        </div>
                        <div className="ml-2">
                          <h3 className="text-sm font-medium text-yellow-800">
                            {t('inspector.no_reports_found')}
                          </h3>
                          <div className="mt-1 text-sm text-yellow-700">
                            <p>{t('inspector.no_reports_found_description')}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InventoryReportsPage