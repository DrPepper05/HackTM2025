export const mockDocuments = [
    { id: 'doc1', title: 'Raport Anual 2023', uploader: 'Clerk User 1', status: 'INGESTING', type: 'Raport', creationDate: '2023-12-01', isPublic: false, aiSuggestedTitle: 'Raport Anual Consiliu Local 2023', aiPredictedRetention: '30y' },
    { id: 'doc2', title: 'Proces Verbal Sedinta Mai', uploader: 'Clerk User 2', status: 'REGISTERED', type: 'Proces Verbal', creationDate: '2024-05-10', isPublic: true, releaseDate: '2024-05-11' },
    { id: 'doc3', title: 'Autorizatie Constructie Str. Florilor', uploader: 'Clerk User 1', status: 'ACTIVE_STORAGE', type: 'Autorizatie', creationDate: '2024-01-15', isPublic: false },
    { id: 'doc4', title: 'Plan Urbanistic Zonal - Cartierul Nou', uploader: 'Clerk User 3', status: 'REVIEW', type: 'Plan Urbanistic', creationDate: '2022-06-20', isPublic: false },
    { id: 'doc5', title: 'Dispozitie Primar Nr. 123', uploader: 'Clerk User 2', status: 'AWAITING_TRANSFER', type: 'Dispozitie', creationDate: '2010-03-01', isPublic: true, releaseDate: '2010-03-01' },
  ];
  
  export const mockAccessRequests = [
    { id: 'req1', documentTitle: 'Autorizatie Constructie Str. Florilor', requesterInfo: 'Jurnalist Local', justification: 'Investigatie jurnalistica', status: 'pending', createdAt: '2024-05-28' },
    { id: 'req2', documentTitle: 'Plan Urbanistic Zonal - Cartierul Nou', requesterInfo: 'Cetatean Interesat', justification: 'Verificare conformitate', status: 'approved', createdAt: '2024-05-25', processedBy: 'Archivist User 1', processedAt: '2024-05-26' },
  ];
  
  export const mockAuditLogs = [
    { id: 'log1', timestamp: '2024-05-30 10:00:00', userId: 'clerk_user_1', action: 'DOCUMENT_UPLOADED', entityType: 'Document', entityId: 'doc1', details: { title: 'Raport Anual 2023' } },
    { id: 'log2', timestamp: '2024-05-30 10:05:00', userId: 'system_enrichment_service', action: 'DOCUMENT_ENRICHED', entityType: 'Document', entityId: 'doc1', details: { ocr: true, pii_detected: false } },
    { id: 'log3', timestamp: '2024-05-30 11:00:00', userId: 'archivist_user_1', action: 'DOCUMENT_APPROVED', entityType: 'Document', entityId: 'doc2', details: { newStatus: 'REGISTERED' } },
  ];