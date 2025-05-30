import { Request, Response } from 'express'
import { searchService } from '../services'
import { asyncHandler } from '../middleware'

export class SearchController {
  /**
   * Search documents (staff)
   */
  searchDocuments = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!
    const {
      query = '',
      filters = {},
      sort = { field: 'created_at', order: 'desc' },
      pagination = { limit: 20, offset: 0 }
    } = req.body

    const searchQuery = {
      query,
      filters,
      sort,
      pagination
    }

    const result = await searchService.searchDocuments(searchQuery, userId)

    res.json({
      success: true,
      data: result
    })
  })

  /**
   * Public search (no authentication required)
   */
  publicSearch = asyncHandler(async (req: Request, res: Response) => {
    const {
      query = '',
      category,
      year,
      limit = 20,
      offset = 0
    } = req.query

    const searchQuery = {
      query: query as string,
      category: category as string,
      year: year ? Number(year) : undefined,
      limit: Number(limit),
      offset: Number(offset)
    }

    const result = await searchService.publicSearch(searchQuery)

    res.json({
      success: true,
      data: result
    })
  })

  /**
   * Get search suggestions (autocomplete)
   */
  getSearchSuggestions = asyncHandler(async (req: Request, res: Response) => {
    const { query, isPublic = false } = req.query

    if (!query || (query as string).length < 2) {
      return res.json({
        success: true,
        data: []
      })
    }

    const suggestions = await searchService.getSearchSuggestions(
      query as string,
      isPublic === 'true'
    )

    res.json({
      success: true,
      data: suggestions
    })
  })

  /**
   * Advanced search
   */
  advancedSearch = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!
    const criteria = req.body

    const result = await searchService.advancedSearch(criteria, userId)

    res.json({
      success: true,
      data: result
    })
  })

  /**
   * Search within document content
   */
  searchDocumentContent = asyncHandler(async (req: Request, res: Response) => {
    const { query, documentId } = req.query

    const result = await searchService.searchDocumentContent(
      query as string,
      documentId as string
    )

    res.json({
      success: true,
      data: result
    })
  })

  /**
   * Find similar documents
   */
  findSimilar = asyncHandler(async (req: Request, res: Response) => {
    const { documentId } = req.params
    const { limit = 5 } = req.query

    const result = await searchService.findSimilarDocuments(
      documentId,
      Number(limit)
    )

    res.json({
      success: true,
      data: result
    })
  })

  /**
   * Export search results
   */
  exportResults = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!
    const { searchQuery, format = 'json' } = req.body

    const result = await searchService.exportSearchResults(
      searchQuery,
      format as 'json' | 'csv',
      userId
    )

    res.set({
      'Content-Type': result.mime_type,
      'Content-Disposition': `attachment; filename="${result.filename}"`
    })

    res.send(result.data)
  })

  /**
   * Get search analytics (admin only)
   */
  getSearchAnalytics = asyncHandler(async (req: Request, res: Response) => {
    const { days = 30 } = req.query

    const analytics = await searchService.getSearchAnalytics(Number(days))

    res.json({
      success: true,
      data: analytics
    })
  })
}

export const searchController = new SearchController() 