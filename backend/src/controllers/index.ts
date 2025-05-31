// backend/src/controllers/index.ts
export * from './auth.controller';
export * from './document.controller';
export * from './search.controller';
export * from './admin.controller';
export * from './access-request.controller'; // Add this line

// Controller instances
export { authController } from './auth.controller';
export { documentController } from './document.controller';
export { searchController } from './search.controller';
export { adminController } from './admin.controller';
export { accessRequestController } from './access-request.controller'; // Add this line