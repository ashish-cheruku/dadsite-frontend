# Frontend Configuration for PostgreSQL Backend

## Overview
The frontend has been updated to work with the new PostgreSQL backend. The API URL configuration has been updated to use port 1821 by default.

## Configuration

### API URL
The frontend now defaults to `http://localhost:1821` for local development, matching the new PostgreSQL backend configuration.

You can override this by setting the `REACT_APP_API_URL` environment variable:

```bash
# For local development
export REACT_APP_API_URL=http://localhost:1821

# For production
export REACT_APP_API_URL=https://your-backend-domain.com
```

### Environment File
Create a `.env.local` file in the frontend directory with:

```env
REACT_APP_API_URL=http://localhost:1821
```

## Backend Compatibility

The frontend is fully compatible with the new PostgreSQL backend because:

1. **API Endpoints Unchanged**: All API endpoints remain the same
2. **Response Format Compatible**: Models include `_id` field for backward compatibility
3. **Data Structure Maintained**: The response structure is preserved through the `to_dict()` methods

## Running the Application

1. **Start the PostgreSQL Backend**:
   ```bash
   cd dadsite-backend
   uvicorn app.main:app --reload --host 0.0.0.0 --port 1821
   ```

2. **Start the Frontend**:
   ```bash
   cd frontend
   npm start
   ```

## Changes Made

- Updated default API URL from port 8004 to port 1821
- No other frontend changes required due to backward compatibility design of the PostgreSQL migration

The frontend will continue to work seamlessly with the new PostgreSQL backend. 