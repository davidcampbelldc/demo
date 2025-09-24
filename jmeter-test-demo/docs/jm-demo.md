# JMeter Test Demo - Cloudflare Workers Site

## Overview

This is a comprehensive demo application built on Cloudflare Workers designed specifically for testing JMeter dynamic correlation plugins. The application provides both HTML forms and JSON API endpoints to simulate real-world web application scenarios with complex authentication flows and data correlation requirements.

## Deployment Information

- **Platform**: Cloudflare Workers
- **Account**: Loadmagic@gmail.com's Account (d8234a8f646e47abe3809473445e4d9a)
- **Worker Name**: `jmeter-test-demo`
- **Database**: Cloudflare D1 (SQLite) - `jmeter-test-demo` (c753aa63-5146-45b1-adca-bd5f3ff89f09)
- **Latest Deployment**: 2025-09-24T10:24:51.811Z
- **Compatibility Date**: 2024-09-23

## Architecture

### Backend Infrastructure
- **Runtime**: Cloudflare Workers (JavaScript)
- **Database**: Cloudflare D1 (SQLite) with remote binding
- **CORS**: Enabled for all origins with comprehensive headers
- **Authentication**: Session-based with multiple correlation tokens

### Database Schema

The application uses a D1 database with the following tables:

#### Users Table
```sql
- id (INTEGER PRIMARY KEY)
- username (TEXT)
- email (TEXT)
- password_hash (TEXT)
- session_token (TEXT)
- created_at (DATETIME)
```

#### Products Table
```sql
- id (INTEGER PRIMARY KEY)
- name (TEXT)
- price (REAL)
- category (TEXT)
- stock (INTEGER)
- created_at (DATETIME)
```

#### Orders Table
```sql
- id (INTEGER PRIMARY KEY)
- user_id (INTEGER)
- order_token (TEXT)
- total (REAL)
- status (TEXT)
- created_at (DATETIME)
```

## API Endpoints

### Authentication Endpoints

#### POST `/api/login`
**Purpose**: User authentication with comprehensive correlation data
**Request Body**:
```json
{
  "username": "testuser1",
  "password": "123"
}
```
**Response**:
```json
{
  "success": true,
  "user_id": 1,
  "username": "testuser1",
  "email": "test1@example.com",
  "session_token": "tok_...",
  "session_id": "sess_1_...",
  "csrf_token": "tok_...",
  "expires_in": 3600,
  "server_timestamp": "2025-09-24T...",
  "correlation_id": "tok_..."
}
```

### Product Management Endpoints

#### GET `/api/products`
**Purpose**: Retrieve product catalog with optional filtering
**Query Parameters**:
- `category` (optional): Filter by product category
**Response**:
```json
{
  "products": [...],
  "count": 3,
  "debug": {
    "query": "SELECT * FROM products WHERE category = ?",
    "params": ["Electronics"],
    "resultMeta": {...}
  }
}
```

#### GET `/api/products/{product_id}`
**Purpose**: Get detailed product information
**Response**:
```json
{
  "success": true,
  "product": {
    "id": 1,
    "name": "Laptop Pro",
    "price": 1299.99,
    "category": "Electronics",
    "stock": 50,
    "in_stock": true,
    "stock_status": "in_stock",
    "discounted_price": 1169.99,
    "related_products": [],
    "last_updated": "2025-09-24T..."
  }
}
```

### User Profile Endpoints

#### POST `/api/user/profile`
**Purpose**: Retrieve user profile (authentication via request body)
**Request Body**:
```json
{
  "session_token": "tok_...",
  "user_id": 1,
  "correlation_id": "tok_..."
}
```
**Response**:
```json
{
  "success": true,
  "user_id": 1,
  "username": "testuser1",
  "email": "test1@example.com",
  "session_info": {
    "token_verified": true,
    "correlation_id_received": "tok_...",
    "created_at": "2025-09-24T...",
    "expires_at": "2025-09-24T..."
  },
  "profile_data": {
    "last_login": "2025-09-24T...",
    "account_type": "standard",
    "preferences": {
      "theme": "default",
      "notifications": true,
      "next_correlation_key": "tok_..."
    }
  }
}
```

### Shopping Cart Endpoints

#### POST `/api/cart/add`
**Purpose**: Add items to cart (authentication via request body)
**Request Body**:
```json
{
  "product_id": 1,
  "quantity": 1,
  "session_token": "tok_...",
  "user_id": 1,
  "correlation_id": "tok_...",
  "client_session_id": "sess_..."
}
```
**Response**:
```json
{
  "success": true,
  "message": "Product added to cart successfully",
  "cart_item": {
    "cart_item_id": "tok_...",
    "product_id": 1,
    "product_name": "Laptop Pro",
    "price": 1299.99,
    "quantity": 1,
    "subtotal": 1299.99,
    "added_at": "2025-09-24T...",
    "user_id": 1,
    "username": "testuser1",
    "session_reference": "tok_...",
    "correlation_tracking": {
      "request_id": "tok_...",
      "client_correlation_id": "tok_...",
      "client_session_id": "sess_...",
      "server_correlation_id": "tok_..."
    }
  },
  "total_items_in_cart": 3,
  "cart_total": 1350.00,
  "next_step_token": "tok_..."
}
```

#### GET `/api/cart`
**Purpose**: Retrieve cart contents (authentication via Authorization header)
**Headers**:
```
Authorization: Bearer {session_token}
```
**Response**:
```json
{
  "success": true,
  "user_id": 1,
  "username": "testuser1",
  "cart_items": [...],
  "item_count": 2,
  "cart_total": 1359.97,
  "checkout_token": "tok_..."
}
```

### Order Management Endpoints

#### POST `/api/orders`
**Purpose**: Create new order (authentication via Authorization header)
**Headers**:
```
Authorization: Bearer {session_token}
```
**Request Body**:
```json
{
  "product_ids": [1, 2],
  "quantities": [1, 2],
  "client_request_id": "order_req_...",
  "checkout_token": "tok_...",
  "payment_method": "credit_card"
}
```
**Response**:
```json
{
  "success": true,
  "order_id": 1,
  "order_token": "tok_...",
  "confirmation_number": "CNF12345678",
  "total": 100.00,
  "status": "pending",
  "estimated_delivery": "3-5 business days",
  "payment_info": {
    "method": "credit_card",
    "transaction_id": "tok_...",
    "authorization_code": "AUTH123456"
  },
  "shipping_info": {
    "tracking_number": "TRK00000001",
    "estimated_ship_date": "2025-09-25"
  },
  "correlation_data": {
    "client_request_id": "order_req_...",
    "checkout_token": "tok_...",
    "server_order_ref": "tok_...",
    "processing_node": "order-proc-..."
  }
}
```

#### POST `/api/checkout/process`
**Purpose**: Process checkout with comprehensive correlation validation
**Request Body**:
```json
{
  "session_token": "tok_...",
  "user_id": 1,
  "correlation_id": "tok_...",
  "checkout_token": "tok_...",
  "cart_items": [...],
  "payment_method": "credit_card",
  "billing_address": {...},
  "shipping_address": {...}
}
```
**Response**:
```json
{
  "success": true,
  "message": "Checkout completed successfully",
  "order_id": 1,
  "order_token": "tok_...",
  "confirmation_number": "CNF12345678",
  "total": 1329.98,
  "status": "confirmed",
  "payment_confirmation": {
    "transaction_id": "tok_...",
    "payment_method": "credit_card",
    "authorization_code": "AUTH123456",
    "processed_at": "2025-09-24T..."
  },
  "shipping_info": {
    "tracking_number": "TRK00000001",
    "estimated_delivery": "2025-09-27"
  },
  "correlation_validation": {
    "session_token_used": "tok_...",
    "user_id_confirmed": 1,
    "correlation_id_received": "tok_...",
    "checkout_token_validated": "tok_..."
  }
}
```

#### GET `/api/orders/{order_token}`
**Purpose**: Retrieve order details and tracking information
**Response**:
```json
{
  "order_id": 1,
  "order_token": "tok_...",
  "username": "testuser1",
  "total": 1329.98,
  "status": "confirmed",
  "created_at": "2025-09-24T...",
  "tracking_number": "TRK00000001"
}
```

## HTML Pages

### Home Page (`/`)
- Overview of all available endpoints
- Interactive user status display
- Links to all HTML forms
- Test user credentials

### Login Page (`/login`)
- Interactive login form
- Session token storage in localStorage
- Authentication testing functionality
- Links to dashboard and checkout

### Products Page (`/products`)
- Product catalog with filtering
- Add to cart functionality
- User session status display
- Category-based filtering

### Product Detail Page (`/product/{id}`)
- Individual product information
- Add to cart functionality
- Stock status display
- Related products navigation

### Dashboard Page (`/dashboard`)
- Authenticated user dashboard
- Session information display
- API endpoint testing tools
- Logout functionality

### Checkout Page (`/checkout`)
- Complete checkout process
- Payment and shipping forms
- Correlation data display
- Order confirmation

## Test Users

The application includes pre-configured test users:

| Username | Password | Email | Account Type |
|----------|----------|-------|--------------|
| testuser1 | 123 | test1@example.com | Standard |
| testuser2 | 456 | test2@example.com | Standard |
| adminuser | 789 | admin@example.com | Admin |

## JMeter Correlation Features

### Authentication Methods
1. **Authorization Header**: Traditional Bearer token authentication
2. **Request Body Authentication**: Session data passed in request body for advanced correlation testing

### Correlation Tokens
- **Session Token**: Primary authentication token
- **Session ID**: Additional session identifier
- **CSRF Token**: Cross-site request forgery protection
- **Correlation ID**: Request correlation tracking
- **Next Step Token**: Token for subsequent requests
- **Order Token**: Order-specific correlation
- **Checkout Token**: Checkout process correlation

### Response Headers
- **X-Request-ID**: Custom request tracking
- **X-Session-Hint**: Partial session token
- **X-Transaction-ID**: Transaction tracking
- **X-Order-Confirmation**: Order confirmation number
- **Set-Cookie**: Session cookie management

## CORS Configuration

All endpoints include comprehensive CORS headers:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

## Error Handling

The application provides detailed error responses with:
- Error messages
- Debug information
- Database availability status
- Stack traces (in development)
- Correlation data validation

## Development and Deployment

### Local Development
```bash
cd jmeter-test-demo
wrangler dev
```

### Database Management
```bash
# List databases
wrangler d1 list

# Execute queries on remote database
wrangler d1 execute jmeter-test-demo --remote --command "SELECT * FROM users;"

# Execute queries on local database
wrangler d1 execute jmeter-test-demo --command "SELECT * FROM users;"
```

### Deployment
```bash
wrangler deploy
```

## Use Cases for JMeter Testing

1. **Session Management**: Test dynamic session token extraction and usage
2. **Correlation Testing**: Validate complex multi-step correlation flows
3. **Authentication Flows**: Test both header and body-based authentication
4. **API Workflows**: Simulate complete e-commerce workflows
5. **Error Handling**: Test application behavior under various error conditions
6. **Performance Testing**: Load test with realistic data correlation requirements

## Technical Specifications

- **Runtime**: Cloudflare Workers (V8 JavaScript engine)
- **Database**: Cloudflare D1 (SQLite-compatible)
- **Request Size Limit**: 100MB
- **Response Size Limit**: 100MB
- **Execution Time Limit**: 30 seconds (CPU time)
- **Memory Limit**: 128MB
- **Concurrent Requests**: Unlimited (within account limits)

This demo application provides a comprehensive testing environment for JMeter dynamic correlation plugins, featuring realistic authentication flows, complex data relationships, and multiple correlation token types commonly found in modern web applications.
