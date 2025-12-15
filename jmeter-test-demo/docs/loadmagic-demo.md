# LoadMagic Test Demo Application (Cloudflare Worker)

This document describes the `index.js` file, which powers a demo application designed to help with dynamic correlation testing for performance and security tools like LoadMagic.AI. It's implemented as a Cloudflare Worker, routing requests to various HTML pages and API endpoints.

## 1. Architecture

The core of the application is an asynchronous `fetch` function that acts as a router. It intercepts incoming HTTP requests, parses the URL path and HTTP method, and then dispatches the request to the appropriate handler function. It also includes global CORS (Cross-Origin Resource Sharing) headers for all responses.

Requests are handled using a `switch` statement that matches `path` and `method` combinations.

## 2. CORS Handling

The worker sets `Access-Control-Allow-Origin: *`, `Access-Control-Allow-Methods: GET, POST, OPTIONS`, and `Access-Control-Allow-Headers: Content-Type, Authorization` for all responses. It explicitly handles `OPTIONS` requests by returning a `200 OK` response with these headers.

## 3. HTML Pages (Frontend Routes)

The application serves several HTML pages, built dynamically using JavaScript template literals and shared `BASE_STYLES`. These pages provide a user interface for interacting with the API endpoints and demonstrating correlation flows.

*   **`/` (Home Page)**: Provides an overview of the application, lists available HTML pages and API endpoints, and test user credentials.
*   **`/login` (Login Page)**: Contains a login form to authenticate users and obtain session tokens. It demonstrates storing session-related data (`session_token`, `user_id`, `session_id`, `csrf_token`, `correlation_id`) in `localStorage` for subsequent API calls.
*   **`/products` (Products Catalog)**: Displays a list of products, with options to filter by category. Each product has a "View Details" and "Add to Cart" button.
*   **`/product/{id}` (Product Detail Page)**: Shows details for a specific product, identified by its ID. Includes an "Add to Cart" button.
*   **`/dashboard` (Authenticated Dashboard)**: A page accessible after login, demonstrating various authenticated API calls and multi-step correlation tests.
*   **`/dashboard1` (Dashboard1 - Correlation Edge Case Testing)**: A specialized dashboard focusing on advanced correlation testing scenarios:
    *   **Short value correlation**: Demonstrates correlation with very short numeric IDs (1-9 digits).
    *   **Large viewstate correlation**: Simulates ASP.NET-style `__VIEWSTATE` payloads, requiring replay of large, signed, and base64-encoded strings.
    *   **Bulk JSON correlation**: Handles and validates correlation within very large JSON request bodies.
*   **`/checkout` (Checkout Page)**: A mock checkout page that gathers user and payment information, then processes the checkout via an API endpoint. It highlights sending all correlation data within the request body.

## 4. API Endpoints

The following API endpoints are available, demonstrating various authentication and correlation mechanisms:

### `POST /api/login`

*   **Description**: Authenticates a user and generates session and correlation tokens.
*   **Request Body**:
    ```json
    {
      "username": "testuser1",
      "password": "123"
    }
    ```
*   **Response**: Returns a JSON object containing:
    *   `session_token`: For `Bearer` token authentication.
    *   `session_id`, `csrf_token`, `correlation_id`: Additional tokens for correlation testing, often sent in the request body.
    *   `user_id`, `username`, `email`, `expires_in`, `server_timestamp`.
    *   **Headers**: Sets a `Set-Cookie` header for `session_id`. Also includes `X-Session-Token`, `X-Session-Id`, `X-CSRF-Token`, `X-Correlation-Id`, `X-User-Id` for correlation via headers.

### `GET /api/products`

*   **Description**: Retrieves a list of products, optionally filtered by category.
*   **Query Parameters**:
    *   `category`: (Optional) Filter products by category (e.g., `Electronics`).
*   **Response**: JSON array of products, `count`, and debug information (query, parameters).

### `GET /api/products/{product_id}`

*   **Description**: Retrieves details for a single product.
*   **Path Parameters**:
    *   `product_id`: The ID of the product.
*   **Response**: JSON object with product details, including `in_stock`, `stock_status`, `discounted_price`, `last_updated` (computed fields).

### `POST /api/user/profile`

*   **Description**: Fetches user profile data. This endpoint *requires all session data in the request body* for correlation testing, rather than in headers.
*   **Request Body**:
    ```json
    {
      "session_token": "...",
      "user_id": 1,
      "correlation_id": "...",
      "session_id": "...",
      "csrf_token": "..."
    }
    ```
*   **Response**: User profile details, session info, and server metadata. Validates all provided session tokens.

### `POST /api/cart/add`

*   **Description**: Adds a product to the user's cart. Similar to `/api/user/profile`, this endpoint *requires all session and correlation data in the request body*.
*   **Request Body**:
    ```json
    {
      "product_id": 1,
      "quantity": 1,
      "session_token": "...",
      "user_id": 1,
      "correlation_id": "...",
      "session_id": "...",
      "csrf_token": "...",
      "client_session_id": "..."
    }
    ```
*   **Response**: Confirms product addition, returns `cart_item` details, `total_items_in_cart`, `cart_total`, and a `next_step_token` for further correlation. Includes `X-Request-ID` and `X-Session-Hint` headers.

### `GET /api/cart`

*   **Description**: Retrieves the user's current cart. Requires `Bearer` token authentication.
*   **Headers**: `Authorization: Bearer {session_token}`
*   **Response**: Mock cart data including `cart_items`, `item_count`, `cart_total`, and a `checkout_token`.

### `POST /api/checkout/process`

*   **Description**: Processes the checkout. This endpoint *requires all session and checkout correlation data in the request body*.
*   **Request Body**:
    ```json
    {
      "session_token": "...",
      "user_id": 1,
      "correlation_id": "...",
      "session_id": "...",
      "csrf_token": "...",
      "checkout_token": "...",
      "cart_items": [...],
      "payment_method": "credit_card",
      "billing_address": {...},
      "shipping_address": {...}
    }
    ```
*   **Response**: Order confirmation with `order_id`, `order_token`, `confirmation_number`, `total`, `status`, `payment_confirmation`, `shipping_info`, and `correlation_validation` details. Includes `X-Transaction-ID` and `X-Order-Confirmation` headers.

### `POST /api/orders`

*   **Description**: Creates a new order. Authenticates via `Bearer` token in the header.
*   **Headers**: `Authorization: Bearer {session_token}`
*   **Request Body**:
    ```json
    {
      "product_ids": [1, 2],
      "quantities": [1, 2],
      "client_request_id": "...",
      "checkout_token": "..."
    }
    ```
*   **Response**: Order details including `order_id`, `order_token`, `confirmation_number`, `total`, `status`, `estimated_delivery`, `payment_info`, `shipping_info`, and `correlation_data`. Includes `X-Order-ID` and `X-Confirmation` headers.

### `GET /api/orders/{order_token}`

*   **Description**: Retrieves details for a specific order using its token.
*   **Path Parameters**:
    *   `order_token`: The token of the order.
*   **Response**: Order details including `order_id`, `order_token`, `username`, `total`, `status`, `created_at`, `tracking_number`.

### `POST /api/http-test` (Multi-Step Correlation - Step 1)

*   **Description**: The first step in a two-step correlation test. It expects session data in the request body and returns a *plain HTTP text response* (not JSON), containing a `STEP 2 TOKEN` that must be extracted.
*   **Request Body**:
    ```json
    {
      "session_token": "...",
      "user_id": 1,
      "correlation_id": "...",
      "session_id": "...",
      "csrf_token": "...",
      "test_message": "Hello!"
    }
    ```
*   **Response**: Plain text indicating success and providing the `STEP 2 TOKEN` for the next request. Includes `X-Test-ID`, `X-Step2-Token`, `X-Session-Hint`, `X-User-ID`, `X-Correlation-ID`, `X-Server-ID`, `X-Timestamp` headers.

### `POST /api/http-test-step2` (Multi-Step Correlation - Step 2)

*   **Description**: The second step of the two-step correlation test. It requires session data and the `step2_token` extracted from the Step 1 response. It also returns a *plain HTTP text response*.
*   **Request Body**:
    ```json
    {
      "session_token": "...",
      "user_id": 1,
      "correlation_id": "...",
      "session_id": "...",
      "csrf_token": "...",
      "step2_token": "...", // Extracted from Step 1 response
      "test_message": "Step 2 from LoadMagic!"
    }
    ```
*   **Response**: Plain text confirming successful multi-step correlation and a `FINAL SUCCESS TOKEN`. Includes `X-Step2-ID`, `X-Final-Token`, `X-Step2-Token-Received`, `X-Session-Hint`, `X-User-ID`, `X-Correlation-ID`, `X-Server-ID`, `X-Timestamp` headers.

### `POST /api/dashboard1/step1` (Short Value Correlation - Step 1)

*   **Description**: Initiates a short-value correlation test. Generates and returns a single-digit `shortID`.
*   **Request Body**:
    ```json
    {
      "session_token": "...",
      "user_id": 1
    }
    ```
*   **Response**: JSON object with `shortID` (e.g., "1", "9"), along with echoed session information. Includes `X-Session-Token`, `X-Correlation-Id`, `X-ShortID`, `X-Timestamp` headers.

### `POST /api/dashboard1/step2` (Short Value Correlation - Step 2)

*   **Description**: Validates the `shortID` obtained from Step 1.
*   **Request Body**:
    ```json
    {
      "session_token": "...",
      "user_id": 1,
      "shortID": "..." // Extracted from Step 1 response
    }
    ```
*   **Response**: JSON object confirming successful validation and a `finalID`. Includes `X-ShortID-Received`, `X-FinalID`, `X-Timestamp`, `X-Correlation-Status` headers.

### `POST /api/dashboard1/step3` (Large Viewstate Correlation - Step 1)

*   **Description**: Generates a large, base64-encoded "viewstate" payload (simulating ASP.NET `__VIEWSTATE`). This payload includes embedded session data, a nonce, and a SHA256 signature that must be replayed exactly.
*   **Request Body**:
    ```json
    {
      "session_token": "...",
      "user_id": 1,
      "session_id": "..."
    }
    ```
*   **Response**: JSON object with `viewstate` (the large base64 string), `viewstate_base64_length`, `viewstate_raw_length`, `signature`, `signature_hint`, `timestamp`, and `constraints`. Includes `X-Viewstate-Signature`, `X-Viewstate-Size`, `X-Viewstate-Base64-Size` headers.

### `POST /api/dashboard1/step4` (Large Viewstate Correlation - Step 2)

*   **Description**: Validates the large viewstate payload obtained from Step 3. The server decodes the viewstate, verifies its embedded data (session ID, user ID), size (must be >350KB raw), and cryptographic signature.
*   **Request Body**:
    ```json
    {
      "session_token": "...",
      "user_id": 1,
      "session_id": "...",
      "viewstate": "..." // The exact base64 string from Step 3
    }
    ```
*   **Response**: JSON object confirming successful validation, `signature_valid`, `view_lengths`, `timestamp`, and `nonce`. Includes `X-Viewstate-Validated`, `X-Viewstate-Signature`, `X-Viewstate-Size`, `X-Viewstate-Nonce` headers.

### `POST /api/dashboard1/step5` (Bulk JSON Correlation - Step 1)

*   **Description**: Accepts a very large JSON array of "transactions" (designed to exceed 500KB). The response contains a `batch_id` and a `validation_code` that is a cryptographic hash incorporating session data, the batch ID, and a "pivot" item from the large payload.
*   **Request Body**:
    ```json
    {
      "session_token": "...",
      "user_id": 1,
      "session_id": "...",
      "transactions": [
        // Hundreds of transaction objects, making the payload very large
        { "id": "txn_...", "amount": 1000, "currency": "USD", "description": "...", "metadata": {...} },
        // ...
      ],
      "meta": { "client_request_id": "...", "approx_size": "..." }
    }
    ```
*   **Response**: JSON object with `batch_id`, `pivot_item_id` (an ID from one of the submitted transactions), `validation_code`, `transactions_count`, `payload_bytes`, `constraints`, and `meta_echo`. Includes `X-Batch-Id`, `X-Large-Payload-Size`, `X-Pivot-Item-Id`, `X-Validation-Code` headers.

### `POST /api/dashboard1/step6` (Bulk JSON Correlation - Step 2)

*   **Description**: Validates the `batch_id` and `validation_code` from Step 5. The server recomputes the expected validation code based on the provided inputs and confirms it matches.
*   **Request Body**:
    ```json
    {
      "session_token": "...",
      "user_id": 1,
      "session_id": "...",
      "batch_id": "...",          // From Step 5 response
      "validation_code": "...",   // From Step 5 response
      "pivot_item_id": "...",     // From Step 5 response
      "transactions_count": "..." // From Step 5 response
    }
    ```
*   **Response**: JSON object confirming `validation_confirmed`, with `batch_id`, `pivot_item_id`, and `transactions_count`. Includes `X-Batch-Validated`, `X-Pivot-Item-Id`, `X-Transactions-Count` headers.

### `POST /api/dashboard1/step7` (Flow A1 - Headers + Cookies - Step 1)

*   **Description**: Starts Flow A1. Returns the real CSRF token in a response header and sets a cookie-based Flow A session. The response body also contains a misleading `csrf` value.
*   **Request Body**:
    ```json
    {}
    ```
*   **Response**: JSON object with metadata and a decoy `csrf` field. Includes:
    *   `Set-Cookie: flowa_session=...` (HttpOnly session cookie)
    *   `X-CSRF-TOKEN: tok_...` (the real tokenA to reuse in Step 8)

### `POST /api/dashboard1/step8` (Flow A1 - Headers + Cookies - Step 2)

*   **Description**: Confirms Flow A1. Requires the Flow A session cookie plus the header-only CSRF token from Step 7, replayed in both header and body.
*   **Request Headers**:
    *   `X-CSRF-TOKEN: tok_...` (from Step 7 response header)
*   **Request Body**:
    ```json
    {
      "csrf": "tok_..." // Must match X-CSRF-TOKEN exactly
    }
    ```
*   **Response**: JSON object confirming success.

### `POST /api/dashboard1/step9` (Flow A2 - Ambiguity + Decoys + Scope - Step 1)

*   **Description**: Starts Flow A2. Returns ambiguous candidates plus 50–200 decoys (default 200); the **real** next token is `meta.csrf`. Also returns `sessionId` vs `admin.sessionId` to test scope selection.
*   **Request Body**:
    ```json
    { "decoy_count": 200 }
    ```
*   **Response**: JSON object containing:
    *   `csrf` (decoy), `previous_csrf` (decoy), `meta.csrf` (real token)
    *   `sessionId` and `admin.sessionId` (scope ambiguity)
    *   `decoys` (50–200 random-looking values, default 200)
    *   `Set-Cookie: flowa2_session=...` (HttpOnly session cookie)

### `POST /api/dashboard1/step10` (Flow A2 - Ambiguity + Decoys + Scope - Step 2)

*   **Description**: Confirms Flow A2. Requires correct token selection (`meta.csrf`) and correct scope selection (`admin.sessionId`).
*   **Request Headers**:
    *   `X-FlowA-CSRF: tok_...` (must be `meta.csrf` from Step 9)
    *   `X-Admin-SessionId: sess_...` (must be `admin.sessionId` from Step 9)
*   **Request Body**:
    ```json
    {
      "csrf": "tok_..." // Must be meta.csrf (NOT top-level csrf)
    }
    ```
*   **Response**: JSON object confirming success.

### `POST /api/dashboard1/step11` (Flow B - Encoding + Noise - Step 1)

*   **Description**: Returns an HTML page containing a hidden input named `csrf_html` whose value is **HTML entity encoded** (e.g. contains `&amp;`). Also includes a decoy `csrf_decoy` plus static and random noise fields that should NOT be reused.
*   **Request Body**:
    ```json
    {}
    ```
*   **Response**: `text/html` and:
    *   `Set-Cookie: flowb_session=...` (HttpOnly session cookie)
    *   Hidden input `csrf_html="..."` (HTML-encoded real token for Step 12)
    *   Noise fields: `static_noise_###` (static) and `uuid_noise_###` (per-request)

### `POST /api/dashboard1/step12` (Flow B - Encoding + Noise - Step 2)

*   **Description**: Validates that you decoded the HTML-encoded token from Step 11 before reuse. Rejects values that still contain HTML entities (e.g. `&amp;`).
*   **Request Headers**:
    *   `X-HTML-CSRF: tok_...` (decoded value from Step 11’s `csrf_html`)
*   **Request Body**:
    ```json
    {
      "csrf": "tok_..." // Must exactly match X-HTML-CSRF and the decoded token
    }
    ```
*   **Response**: JSON object confirming success.

## 5. Utility Functions

*   `generateToken()`: Generates a unique string token prefixed with `tok_`.
*   `generateFillerString(targetLength)`: Creates a string of a specified `targetLength` filled with random characters. Used for creating large payloads (e.g., in viewstate simulation).
*   `sha256Base64(input)`: Computes the SHA256 hash of a string and returns it as a base64-encoded string. Used for signing viewstate and validation codes.
*   `buildLargeViewState(sessionId, sessionToken, userId)`: Constructs the large, signed viewstate object, including session data, a nonce, filler content, and a SHA256 signature.

## 6. Styling

The `BASE_STYLES` constant defines a modern, dark-themed CSS styling for the demo application, using `Space Grotesk` font and a palette of dark backgrounds, muted text, and vibrant accents.

## 7. Test Users

*   **testuser1** / password: **123**
*   **testuser2** / password: **456**
*   **adminuser** / password: **789**
