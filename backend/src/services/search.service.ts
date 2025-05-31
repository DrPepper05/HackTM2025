import { supabaseAdmin, withMonitoring } from '../config/supabase.config'
import { Document } from '../types/database.types'

export interface SearchQuery {
  query: string
  filters?: {
    document_type?: string[]
    retention_category?: string[]
    status?: string[]
    is_public?: boolean
    tags?: string[]
    date_from?: string
    date_to?: string
  }
  sort?: {
    field: 'relevance' | 'created_at' | 'title' | 'creation_date'
    order: 'asc' | 'desc'
  }
  pagination?: {
    limit: number
    offset: number
  }
}

export interface SearchResult {
  documents: Array<{
    document: Document
    relevance_score?: number
    highlight?: {
      title?: string
      description?: string
      content?: string
    }
  }>
  total: number
  facets: {
    document_types: Array<{ value: string; count: number }>
    retention_categories: Array<{ value: string; count: number }>
    tags: Array<{ value: string; count: number }>
  }
  query_time_ms: number
}

export interface PublicSearchQuery {
  query: string
  category?: string
  year?: number
  limit?: number
  offset?: number
}

export class SearchService {
  /**
   * Perform full-text search for staff (clerk, archivist, inspector, admin)
   */
  async searchDocuments(
    searchQuery: SearchQuery,
    userId: string
  ): Promise<SearchResult> {
    const startTime = Date.now()

    return withMonitoring('search', 'documents', async () => {
      // Build base query
      let query = supabaseAdmin
        .from('documents')
        .select(`
          *,
          document_files (
            id,
            file_type,
            file_name,
            mime_type,
            file_size
          )
        `, { count: 'exact' })

      // Apply full-text search if query provided
      if (searchQuery.query && searchQuery.query.trim() !== '') {
        // Use PostgreSQL full-text search
        query = query.textSearch('search_vector', searchQuery.query, {
          type: 'websearch',
          config: 'romanian'
        })
      }

      // Apply filters
      if (searchQuery.filters) {
        if (searchQuery.filters.document_type?.length) {
          query = query.in('document_type', searchQuery.filters.document_type)
        }

        if (searchQuery.filters.retention_category?.length) {
          query = query.in('retention_category', searchQuery.filters.retention_category)
        }

        if (searchQuery.filters.status?.length) {
          query = query.in('status', searchQuery.filters.status)
        }

        if (searchQuery.filters.is_public !== undefined) {
          query = query.eq('is_public', searchQuery.filters.is_public)
        }

        if (searchQuery.filters.tags?.length) {
          query = query.contains('tags', searchQuery.filters.tags)
        }

        if (searchQuery.filters.date_from) {
          query = query.gte('creation_date', searchQuery.filters.date_from)
        }

        if (searchQuery.filters.date_to) {
          query = query.lte('creation_date', searchQuery.filters.date_to)
        }
      }

      // Apply sorting
      if (searchQuery.sort) {
        if (searchQuery.sort.field === 'relevance' && searchQuery.query) {
          // For relevance, we'll use ts_rank in a more complex query
          // For now, default to created_at
          query = query.order('created_at', { ascending: false })
        } else {
          query = query.order(searchQuery.sort.field, { 
            ascending: searchQuery.sort.order === 'asc' 
          })
        }
      } else {
        // Default sort
        query = query.order('created_at', { ascending: false })
      }

      // Apply pagination
      const limit = searchQuery.pagination?.limit || 20
      const offset = searchQuery.pagination?.offset || 0
      query = query.range(offset, offset + limit - 1)

      // Execute search
      const { data: documents, error, count } = await query

      if (error) throw error

      // Calculate facets (simplified for hackathon)
      const facets = await this.calculateFacets(searchQuery)

      // Log search
      await supabaseAdmin.rpc('create_audit_log', {
        p_action: 'DOCUMENT_SEARCH',
        p_entity_type: 'search',
        p_entity_id: null,
        p_details: {
          query: searchQuery.query,
          filters: searchQuery.filters,
          result_count: count,
          user_id: userId
        }
      })

      const queryTime = Date.now() - startTime

      return {
        documents: (documents || []).map(doc => ({
          document: doc,
          relevance_score: undefined, // Would be calculated with ts_rank
          highlight: this.generateHighlight(doc, searchQuery.query)
        })),
        total: count || 0,
        facets,
        query_time_ms: queryTime
      }
    })
  }

  /**
   * Public search interface (only public documents)
   */
  async publicSearch(
    searchQuery: PublicSearchQuery
  ): Promise<{
    documents: Document[]
    total: number
  }> {
    return withMonitoring('public_search', 'documents', async () => {
      let query = supabaseAdmin
        .from('documents')
        .select('*', { count: 'exact' })
        .eq('is_public', true)
        .or('release_date.is.null,release_date.lte.now()')

      // Apply search
      if (searchQuery.query && searchQuery.query.trim() !== '') {
        query = query.textSearch('search_vector', searchQuery.query, {
          type: 'plain',
          config: 'romanian'
        })
      }

      // Apply category filter
      if (searchQuery.category) {
        query = query.eq('document_type', searchQuery.category)
      }

      // Apply year filter
      if (searchQuery.year) {
        const yearStart = `${searchQuery.year}-01-01`
        const yearEnd = `${searchQuery.year}-12-31`
        query = query.gte('creation_date', yearStart).lte('creation_date', yearEnd)
      }

      // Order by relevance or date
      query = query.order('created_at', { ascending: false })

      // Pagination
      const limit = searchQuery.limit || 20
      const offset = searchQuery.offset || 0
      query = query.range(offset, offset + limit - 1)

      const { data, error, count } = await query

      if (error) throw error

      // Log public search (anonymous)
      await supabaseAdmin.rpc('create_audit_log', {
        p_action: 'PUBLIC_SEARCH',
        p_entity_type: 'search',
        p_entity_id: null,
        p_details: {
          query: searchQuery.query,
          category: searchQuery.category,
          year: searchQuery.year,
          result_count: count
        }
      })

      return {
        documents: data || [],
        total: count || 0
      }
    })
  }

  /**
   * Get search suggestions (autocomplete)
   */
  async getSearchSuggestions(
    partial: string,
    isPublic: boolean = false
  ): Promise<string[]> {
    if (partial.length < 2) return []

    let query = supabaseAdmin
      .from('documents')
      .select('title, tags')

    if (isPublic) {
      query = query
        .eq('is_public', true)
        .or('release_date.is.null,release_date.lte.now()')
    }

    query = query.ilike('title', `%${partial}%`).limit(10)

    const { data, error } = await query

    if (error) throw error

    // Extract unique suggestions
    const suggestions = new Set<string>()
    
    data?.forEach(doc => {
      if (doc.title.toLowerCase().includes(partial.toLowerCase())) {
        suggestions.add(doc.title)
      }
      doc.tags?.forEach((tag: string) => {
        if (tag.toLowerCase().includes(partial.toLowerCase())) {
          suggestions.add(tag)
        }
      })
    })

    return Array.from(suggestions).slice(0, 10)
  }

  /**
   * Advanced search with complex filters
   */
  async advancedSearch(
    criteria: {
      must_contain_all?: string[]
      must_contain_any?: string[]
      must_not_contain?: string[]
      exact_phrase?: string
      metadata_filters?: Record<string, any>
    },
    userId: string
  ): Promise<SearchResult> {
    const startTime = Date.now()

    return withMonitoring('advanced_search', 'documents', async () => {
      // Build complex search query
      let searchTerms: string[] = []

      if (criteria.exact_phrase) {
        searchTerms.push(`"${criteria.exact_phrase}"`)
      }

      if (criteria.must_contain_all?.length) {
        searchTerms.push(criteria.must_contain_all.join(' & '))
      }

      if (criteria.must_contain_any?.length) {
        searchTerms.push(`(${criteria.must_contain_any.join(' | ')})`)
      }

      if (criteria.must_not_contain?.length) {
        criteria.must_not_contain.forEach(term => {
          searchTerms.push(`!${term}`)
        })
      }

      const searchQuery = searchTerms.join(' & ')

      let query = supabaseAdmin
        .from('documents')
        .select('*, document_files(*)', { count: 'exact' })

      if (searchQuery) {
        query = query.textSearch('search_vector', searchQuery, {
          type: 'websearch',
          config: 'romanian'
        })
      }

      // Apply metadata filters
      if (criteria.metadata_filters) {
        Object.entries(criteria.metadata_filters).forEach(([key, value]) => {
          query = query.contains('metadata', { [key]: value })
        })
      }

      const { data, error, count } = await query

      if (error) throw error

      const queryTime = Date.now() - startTime

      return {
        documents: (data || []).map(doc => ({
          document: doc,
          relevance_score: undefined,
          highlight: undefined
        })),
        total: count || 0,
        facets: {
          document_types: [],
          retention_categories: [],
          tags: []
        },
        query_time_ms: queryTime
      }
    })
  }

  /**
   * Search within document content (OCR text)
   */
  async searchDocumentContent(
    searchQuery: string,
    documentId?: string
  ): Promise<Array<{
    document_id: string
    file_id: string
    matches: Array<{
      text: string
      position: number
    }>
  }>> {
    let query = supabaseAdmin
      .from('document_files')
      .select('id, document_id, ocr_text')
      .not('ocr_text', 'is', null)

    if (documentId) {
      query = query.eq('document_id', documentId)
    }

    // Simple text search in OCR content
    query = query.ilike('ocr_text', `%${searchQuery}%`)

    const { data, error } = await query

    if (error) throw error

    // Find matches and their positions
    const results = (data || []).map(file => {
        const matches: Array<{ text: string; position: number }> = []
        
        if (file.ocr_text) {
        const searchLower = searchQuery.toLowerCase()
        const textLower = file.ocr_text.toLowerCase()
        let position = textLower.indexOf(searchLower)
        
        while (position !== -1) {
            // Extract surrounding context (50 chars before and after)
            const start = Math.max(0, position - 50)
            const end = Math.min(file.ocr_text.length, position + searchQuery.length + 50)
            const matchText = file.ocr_text.substring(start, end)
            
            matches.push({
            text: matchText,
            position
            })
            
            position = textLower.indexOf(searchLower, position + 1)
        }
        }
        
        return {
        document_id: file.document_id,
        file_id: file.id,
        matches
        }
    }).filter(result => result.matches.length > 0)

    return results
    }

    /**
     * Get similar documents based on tags and metadata
     */
    async findSimilarDocuments(
    documentId: string,
    limit: number = 5
    ): Promise<Document[]> {
    // Get the source document
    const { data: sourceDoc, error: sourceError } = await supabaseAdmin
        .from('documents')
        .select('tags, document_type, retention_category')
        .eq('id', documentId)
        .single()

    if (sourceError || !sourceDoc) {
        throw new Error('Source document not found')
    }

    // Find documents with similar characteristics
    let query = supabaseAdmin
        .from('documents')
        .select('*')
        .neq('id', documentId) // Exclude source document

    // Match by document type
    if (sourceDoc.document_type) {
        query = query.eq('document_type', sourceDoc.document_type)
    }

    // Match by tags (if any overlap)
    if (sourceDoc.tags && sourceDoc.tags.length > 0) {
        query = query.overlaps('tags', sourceDoc.tags)
    }

    query = query.limit(limit)

    const { data, error } = await query

    if (error) throw error

    return data || []
    }

    /**
     * Get popular search terms (for analytics)
     */
    async getPopularSearchTerms(
    days: number = 7,
    limit: number = 20
    ): Promise<Array<{ term: string; count: number }>> {
    const since = new Date()
    since.setDate(since.getDate() - days)

    const { data: searchLogs, error } = await supabaseAdmin
        .from('audit_logs')
        .select('details')
        .in('action', ['DOCUMENT_SEARCH', 'PUBLIC_SEARCH'])
        .gte('timestamp', since.toISOString())

    if (error) throw error

    // Extract and count search terms
    const termCounts: Record<string, number> = {}
    
    searchLogs?.forEach(log => {
        const query = log.details?.query as string
        if (query && query.trim() !== '') {
        const normalizedQuery = query.toLowerCase().trim()
        termCounts[normalizedQuery] = (termCounts[normalizedQuery] || 0) + 1
        }
    })

    // Sort by count and return top terms
    return Object.entries(termCounts)
        .map(([term, count]) => ({ term, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit)
    }

    /**
     * Calculate facets for search results
     */
    private async calculateFacets(
    searchQuery: SearchQuery
    ): Promise<{
    document_types: Array<{ value: string; count: number }>
    retention_categories: Array<{ value: string; count: number }>
    tags: Array<{ value: string; count: number }>
    }> {
    // Build base query for facets (without pagination)
    let baseQuery = supabaseAdmin.from('documents').select('*')

    // Apply same filters as main search
    if (searchQuery.query && searchQuery.query.trim() !== '') {
        baseQuery = baseQuery.textSearch('search_vector', searchQuery.query, {
        type: 'websearch',
        config: 'romanian'
        })
    }

    if (searchQuery.filters) {
        // Apply all filters except the one we're calculating facets for
        // This allows for drill-down filtering
    }

    const { data, error } = await baseQuery

    if (error) {
        return {
        document_types: [],
        retention_categories: [],
        tags: []
        }
    }

    // Count occurrences
    const typeCounts: Record<string, number> = {}
    const categoryCounts: Record<string, number> = {}
    const tagCounts: Record<string, number> = {}

    data?.forEach(doc => {
        // Document types
        if (doc.document_type) {
        typeCounts[doc.document_type] = (typeCounts[doc.document_type] || 0) + 1
        }

        // Retention categories
        if (doc.retention_category) {
        categoryCounts[doc.retention_category] = (categoryCounts[doc.retention_category] || 0) + 1
        }

        // Tags
        doc.tags?.forEach((tag: string) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1
        })
    })

    // Convert to arrays and sort
    const sortByCount = (a: any, b: any) => b.count - a.count

    return {
        document_types: Object.entries(typeCounts)
        .map(([value, count]) => ({ value, count }))
        .sort(sortByCount)
        .slice(0, 10),
        retention_categories: Object.entries(categoryCounts)
        .map(([value, count]) => ({ value, count }))
        .sort(sortByCount),
        tags: Object.entries(tagCounts)
        .map(([value, count]) => ({ value, count }))
        .sort(sortByCount)
        .slice(0, 20)
    }
    }

    /**
     * Generate search result highlights
     */
    private generateHighlight(
    document: Document,
    searchQuery?: string
    ): {
    title?: string
    description?: string
    content?: string
    } | undefined {
    if (!searchQuery) return undefined

    const highlight: any = {}
    const queryLower = searchQuery.toLowerCase()

    // Highlight in title
    if (document.title && document.title.toLowerCase().includes(queryLower)) {
        highlight.title = this.highlightText(document.title, searchQuery)
    }

    // Highlight in description
    if (document.description && document.description.toLowerCase().includes(queryLower)) {
        highlight.description = this.highlightText(document.description, searchQuery)
    }

    return Object.keys(highlight).length > 0 ? highlight : undefined
    }

    /**
     * Add highlight markers to text
     */
    private highlightText(text: string, query: string): string {
    const regex = new RegExp(`(${query})`, 'gi')
    return text.replace(regex, '<mark>$1</mark>')
    }

    /**
     * Index a document for search (called after enrichment)
     */
    async indexDocument(documentId: string): Promise<void> {
    // PostgreSQL full-text search is updated automatically via triggers
    // This method is here for future external search engine integration
    
    await supabaseAdmin.rpc('create_audit_log', {
        p_action: 'DOCUMENT_INDEXED',
        p_entity_type: 'document',
        p_entity_id: documentId,
        p_details: {
        search_engine: 'postgresql_fts'
        }
    })
    }

    /**
     * Remove document from search index
     */
    async removeFromIndex(documentId: string): Promise<void> {
    // For PostgreSQL FTS, this happens automatically when document is deleted
    // This method is here for future external search engine integration
    
    await supabaseAdmin.rpc('create_audit_log', {
        p_action: 'DOCUMENT_DEINDEXED',
        p_entity_type: 'document',
        p_entity_id: documentId,
        p_details: {
        search_engine: 'postgresql_fts'
        }
    })
    }

    /**
     * Rebuild search index (admin operation)
     */
    async rebuildSearchIndex(adminUserId: string): Promise<{
    documents_processed: number
    duration_ms: number
    }> {
    const startTime = Date.now()

    // Trigger search vector update for all documents
    const { data: documents, error } = await supabaseAdmin
        .from('documents')
        .select('id')

    if (error) throw error

    // In PostgreSQL, the search vector is updated via trigger
    // Force update by touching the updated_at field
    for (const doc of documents || []) {
        await supabaseAdmin
        .from('documents')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', doc.id)
    }

    const duration = Date.now() - startTime

    await supabaseAdmin.rpc('create_audit_log', {
      p_action: 'SEARCH_INDEX_REBUILT',
      p_entity_type: 'system',
      p_entity_id: null,
      p_details: {
        documents_processed: documents?.length || 0,
        duration_ms: duration,
        rebuilt_by: adminUserId
      }
    })

    return {
      documents_processed: documents?.length || 0,
      duration_ms: duration
    }
  }

  /**
   * Get search analytics for dashboard
   */
  async getSearchAnalytics(
    days: number = 30
  ): Promise<{
    total_searches: number
    public_searches: number
    staff_searches: number
    avg_results_per_search: number
    zero_result_searches: number
    search_trends: Array<{
      date: string
      count: number
    }>
    top_queries: Array<{
      query: string
      count: number
      avg_results: number
    }>
  }> {
    const since = new Date()
    since.setDate(since.getDate() - days)

    // Get all search logs
    const { data: searchLogs, error } = await supabaseAdmin
      .from('audit_logs')
      .select('*')
      .in('action', ['DOCUMENT_SEARCH', 'PUBLIC_SEARCH'])
      .gte('timestamp', since.toISOString())
      .order('timestamp', { ascending: true })

    if (error) throw error

    const logs = searchLogs || []

    // Calculate metrics
    const publicSearches = logs.filter(log => log.action === 'PUBLIC_SEARCH').length
    const staffSearches = logs.filter(log => log.action === 'DOCUMENT_SEARCH').length
    
    let totalResults = 0
    let zeroResults = 0
    const queryStats: Record<string, { count: number; totalResults: number }> = {}
    const dailyCounts: Record<string, number> = {}

    logs.forEach(log => {
      const resultCount = log.details?.result_count as number || 0
      totalResults += resultCount
      
      if (resultCount === 0) {
        zeroResults++
      }

      // Track query statistics
      const query = log.details?.query as string
      if (query) {
        if (!queryStats[query]) {
          queryStats[query] = { count: 0, totalResults: 0 }
        }
        queryStats[query].count++
        queryStats[query].totalResults += resultCount
      }

      // Track daily counts
      const date = new Date(log.timestamp).toISOString().split('T')[0]
      dailyCounts[date] = (dailyCounts[date] || 0) + 1
    })

    // Calculate search trends
    const searchTrends = Object.entries(dailyCounts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Calculate top queries
    const topQueries = Object.entries(queryStats)
      .map(([query, stats]) => ({
        query,
        count: stats.count,
        avg_results: Math.round(stats.totalResults / stats.count)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return {
      total_searches: logs.length,
      public_searches: publicSearches,
      staff_searches: staffSearches,
      avg_results_per_search: logs.length > 0 ? Math.round(totalResults / logs.length) : 0,
      zero_result_searches: zeroResults,
      search_trends: searchTrends,
      top_queries: topQueries
    }
  }

  /**
   * Export search results
   */
  async exportSearchResults(
    searchQuery: SearchQuery,
    format: 'json' | 'csv',
    userId: string
  ): Promise<{
    data: string
    filename: string
    mime_type: string
  }> {
    // Perform search without pagination to get all results
    const fullQuery = {
      ...searchQuery,
      pagination: { limit: 1000, offset: 0 } // Reasonable limit for export
    }

    const results = await this.searchDocuments(fullQuery, userId)

    // Log export
    await supabaseAdmin.rpc('create_audit_log', {
      p_action: 'SEARCH_RESULTS_EXPORTED',
      p_entity_type: 'search',
      p_entity_id: null,
      p_details: {
        query: searchQuery.query,
        result_count: results.total,
        format,
        exported_by: userId
      }
    })

    let exportData: string
    let mimeType: string

    if (format === 'csv') {
      exportData = this.convertSearchResultsToCSV(results.documents)
      mimeType = 'text/csv'
    } else {
      exportData = JSON.stringify(results.documents.map(r => r.document), null, 2)
      mimeType = 'application/json'
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `search_results_${timestamp}.${format}`

    return {
      data: exportData,
      filename,
      mime_type: mimeType
    }
  }

  /**
   * Convert search results to CSV
   */
  private convertSearchResultsToCSV(
    results: Array<{ document: Document }>
  ): string {
    const headers = [
      'ID',
      'Title',
      'Document Type',
      'Document Number',
      'Creation Date',
      'Status',
      'Retention Category',
      'Is Public',
      'Tags',
      'Created At'
    ]

    const rows = results.map(({ document }) => [
      document.id,
      document.title,
      document.document_type || '',
      document.document_number || '',
      document.creation_date || '',
      document.status,
      document.retention_category || '',
      document.is_public ? 'Yes' : 'No',
      document.tags?.join('; ') || '',
      document.created_at
    ])

    const escapeCSV = (value: any): string => {
      if (value === null || value === undefined) return ''
      const str = String(value)
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    }

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(escapeCSV).join(','))
    ].join('\n')

    return csvContent
  }

  /**
   * Save search query for user (saved searches feature)
   */
  async saveSearchQuery(
    userId: string,
    name: string,
    searchQuery: SearchQuery
  ): Promise<void> {
    // Store in user metadata or separate table
    // For hackathon, we'll use the audit log
    await supabaseAdmin.rpc('create_audit_log', {
      p_action: 'SEARCH_SAVED',
      p_entity_type: 'search',
      p_entity_id: null,
      p_details: {
        name,
        query: searchQuery,
        saved_by: userId
      }
    })
  }

  /**
   * Get user's saved searches
   */
  async getSavedSearches(userId: string): Promise<Array<{
    name: string
    query: SearchQuery
    created_at: string
  }>> {
    const { data, error } = await supabaseAdmin
      .from('audit_logs')
      .select('details, created_at')
      .eq('action', 'SEARCH_SAVED')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return (data || []).map(log => ({
      name: log.details.name as string,
      query: log.details.query as SearchQuery,
      created_at: log.created_at
    }))
  }
}

// Export singleton instance
export const searchService = new SearchService()