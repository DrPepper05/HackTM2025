# OpenArchive: Romanian Government Document Archive System
This repository contains the full-stack application for OpenArchive, an open-source, multi-tenant, and legally compliant document archiving platform designed for Romanian public institutions. The project is structured as a monorepo, encompassing both the frontend and backend applications, as well as an additional semantic sorting API.

## 📁 Project Structure
Bash

```
HackTM2025/
├── APIs/             ← Additional APIs (e.g., semantic-sort)
│   └── semantic-sort/  ← FastAPI application for semantic sorting
│       ├── requirements.txt
│       └── server.py
├── backend/          ← Express.js API (Node.js) / TypeScript Backend
├── frontend/         ← React + Tailwind Admin Panel
├── package.json      ← Root file for managing both applications
├── project_blueprint.json ← Detailed project configuration
└── README.md         ← Main project README
```

## 🚀 Features
OpenArchive is built to provide robust document management with features such as:
- User and Role-Based Access: Secure login/logout with distinct roles (admin, archivist, reviewer, citizen).
- Document Management: Uploading documents with associated metadata, OCR preview and validation, and full-text search with filters.
- Multi-tenancy: Support for multiple public institutions with isolated data and customizable dashboards.
- Compliance: Adherence to Romanian Law 16/1996 and EU GDPR regulations, with compliance status indicators and audit logging.
- Backend Services: OCR text extraction, compliance rule validation, document indexing, and activity logging.
- Advanced Search: Utilizes PostgreSQL Full-Text Search with pg_trgm for efficient searching across OCR text, titles, keywords, and upload dates.
- Semantic Sort API: An optional FastAPI service for AI-based tagging and semantic sorting of documents.

## 🛠 Tech Stack
### Frontend
- Framework: **React**
- Language: **JavaScript**
- Bundler: **Vite**
- Routing: **React Router**
- State Management: **TanStack Query** (React Query)
- Styling: **CSS**, **Tailwind CSS**
- Authentication: **Supabase Auth**
- API Client: **Supabase JS SDK**
- Internationalization: **react-i18next**

### Backend
- Platform: **Node.js** with **Express.js**
- Language: **TypeScript**
- Database: **PostgreSQL** (via Supabase)
- Authentication: **Supabase** Auth with **JWT** claims and Row Level Security (RLS)
- Storage: **Supabase Storage**
- OCR: **Tesseract OCR**, integrated via Supabase Edge Function with an optional **FastAPI** service for advanced pipelines.
- Email: **Nodemailer**, **SendGrid**
- Security: helmet for HTTP headers, express-rate-limit

### Semantic Sort API
- Framework: **FastAPI**
- Language: **Python**
- Libraries: **sentence-transformers**, **numpy**, **python-dotenv**, **supabase-py**

## ✅ One-Time Setup
Before running the application, you need to install dependencies for both the frontend and backend. From the root directory:

```bash
npm run install-all
```
This command will execute npm install within both the ./frontend and ./backend directories.

Environment Variables
Both the backend and the semantic sort API require environment variables. Create a .env file in the backend/ directory based on the .env.example provided in the backend/README.md.

For the backend:
- ```PORT```
- ```AWS_REGION```
- ```AWS_ACCESS_KEY_ID```
- ```AWS_SECRET_ACCESS_KEY```
- ```SUPABASE_URL```
- ```SUPABASE_ANON_KEY```
- ```MAX_FILE_SIZE```
- ```UPLOAD_DIRECTORY```      
  
For the ```APIs/semantic-sort```:
- ```SUPABASE_URL```
- ```SUPABASE_SERVICE_ROLE_KEY```

## API Endpoints
### Backend API (Node.js/Express)
The backend API is served from http://localhost:3000 (or configured port) and has the following base path: http://localhost:3001/api/v1.

- **Health Check**:
    - ```GET /``` or ```GET /api/v1/health```: Checks if the API is running.
  
- **Documents**:
    - ```POST /documents``` or ```POST /api/v1/documents```: Upload and process a document.
    - ```GET /documents``` or ```GET /api/v1/documents```: Get all documents for the authenticated user.
    - ```GET /documents/:id``` or ```GET /api/v1/documents/:id```: Get a document by ID.
    - ```DELETE /documents/:id``` or ```DELETE /api/v1/documents/:id```: Delete a document.
  
- **Admin**:
    - ```app.use('/admin', adminRoutes);```
    - ```app.use('/admin/settings', adminSettingsRoutes);```
    - ```GET /api/v1/admin```
  
- **Auth**:
    - ```GET /api/v1/auth```
  
- **Search**:
    - ```GET /api/v1/search```

### Semantic Sort API (Python/FastAPI)
The semantic sort API is served from the ```APIs/semantic-sort``` directory.
- Sort Documents:
    - ```POST /sort-db```: Sorts documents from the database based on a given query.
        - Request Body: ```{"query": "your search query"}```
        - Response: A JSON object containing sorted document results, including ```id```, ```description```, and ```score```.

