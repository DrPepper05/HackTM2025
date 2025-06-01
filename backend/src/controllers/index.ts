// backend/src/controllers/index.ts
export * from './auth.controller';
export * from './document.controller';
export * from './search.controller';
export * from './admin.controller';
export * from './access-request.controller';
export * from './inspector.controller';
export * from './user.controller';

// Controller instances
export { authController } from './auth.controller';
export { documentController } from './document.controller';
export { searchController } from './search.controller';
export { adminController } from './admin.controller';
export { accessRequestController } from './access-request.controller';
export { inspectorController } from './inspector.controller';
export { userController } from './user.controller';