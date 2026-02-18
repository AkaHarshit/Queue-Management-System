# Sequence Diagram - Queue Management System

## Visual Sequence Flow Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│        CUSTOMER JOINS QUEUE AND RECEIVES SERVICE - SEQUENCE FLOW         │
└─────────────────────────────────────────────────────────────────────────┘

Customer    Frontend    AuthCtrl    QueueCtrl   QueueSvc   TokenSvc   NotifSvc   Database   WebSocket   Staff
   │            │           │           │          │          │          │          │          │         │
   │──Login────►│           │           │          │          │          │          │          │         │
   │            │──POST────►│           │          │          │          │          │          │         │
   │            │           │──Validate─►│          │          │          │          │          │         │
   │            │           │◄──User────│          │          │          │          │          │         │
   │            │◄──Token───│           │          │          │          │          │          │         │
   │◄──Dashboard│           │           │          │          │          │          │          │         │
   │            │           │           │          │          │          │          │          │         │
   │──Join Q───►│           │           │          │          │          │          │          │         │
   │            │──POST────►│           │          │          │          │          │          │         │
   │            │           │──joinQ()─►│          │          │          │          │          │         │
   │            │           │           │──genToken│          │          │          │          │         │
   │            │           │           │          │──getLast─►│          │          │          │         │
   │            │           │           │          │          │◄──Number─│          │          │         │
   │            │           │           │          │──create─►│          │          │          │         │
   │            │           │           │          │          │◄──Token──│          │          │         │
   │            │           │           │          │──addQ()──►│          │          │          │         │
   │            │           │           │          │──getStats│          │          │          │         │
   │            │           │           │          │◄──Stats──│          │          │          │         │
   │            │           │           │          │──sendNotif│          │          │          │         │
   │◄──Notif────│           │           │          │          │          │          │          │         │
   │            │◄──Response│           │          │          │          │          │          │         │
   │◄──Token────│           │           │          │          │          │          │          │         │
   │            │──Subscribe│           │          │          │          │          │          │         │
   │            │           │           │          │          │          │          │          │         │
   │            │──GET──────│           │          │          │          │          │          │         │
   │            │           │──getStatus│          │          │          │          │          │         │
   │            │           │           │──getPos──►│          │          │          │          │         │
   │            │           │           │          │◄──Position│          │          │          │         │
   │            │◄──Updated─│           │          │          │          │          │          │         │
   │◄──Updated──│           │           │          │          │          │          │          │         │
   │            │           │           │          │          │          │          │          │         │
   │            │           │           │          │          │          │          │          │──Login──►│
   │            │           │           │          │          │          │          │          │         │
   │            │           │          │          │          │          │          │          │──View───►│
   │            │           │          │          │          │          │          │          │         │
   │            │           │          │          │──ready───►│          │          │          │         │
   │            │           │          │          │          │──broadcast│          │          │         │
   │◄──Ready────│           │          │          │          │          │          │          │         │
   │            │           │          │          │          │          │          │          │──Start──►│
   │            │           │          │──markIP──►│          │          │          │          │         │
   │            │           │          │          │──update──►│          │          │          │         │
   │            │           │          │          │          │──broadcast│          │          │         │
   │◄──Started──│           │          │          │          │          │          │          │         │
   │            │           │          │          │          │          │          │          │──Complete│
   │            │           │          │──complete│          │          │          │          │         │
   │            │           │          │          │──update──►│          │          │          │         │
   │            │           │          │          │──remove──►│          │          │          │         │
   │            │           │          │          │──sendNotif│          │          │          │         │
   │◄──Complete─│           │          │          │          │          │          │          │         │
   │            │           │          │          │          │──broadcast│          │          │         │
   │◄──Updated──│           │          │          │          │          │          │          │         │
```

## Main Flow: Customer Joins Queue and Receives Service (End-to-End)

```mermaid
sequenceDiagram
    participant C as Customer
    participant UI as Frontend UI
    participant Auth as AuthController
    participant Queue as QueueController
    participant QueueService as QueueService
    participant TokenService as TokenService
    participant NotificationService as NotificationService
    participant DB as Database
    participant WS as WebSocket Server
    participant S as Staff Member

    %% Authentication Phase
    C->>UI: 1. Access Login Page
    C->>UI: 2. Enter Credentials
    UI->>Auth: 3. POST /api/auth/login
    Auth->>DB: 4. Validate Credentials
    DB-->>Auth: 5. User Data
    Auth-->>UI: 6. JWT Token + User Info
    UI-->>C: 7. Display Dashboard

    %% Join Queue Phase
    C->>UI: 8. Select Service & Click "Join Queue"
    UI->>Queue: 9. POST /api/queue/join
    Queue->>QueueService: 10. joinQueue(userId, serviceId)
    
    %% Token Generation
    QueueService->>TokenService: 11. generateToken(serviceId)
    TokenService->>DB: 12. Get Last Token Number
    DB-->>TokenService: 13. Last Token Number
    TokenService->>DB: 14. Create Token Record
    DB-->>TokenService: 15. Token Created (tokenId, tokenNumber)
    TokenService-->>QueueService: 16. Token Object

    %% Queue Management
    QueueService->>DB: 17. Add to Queue (tokenId, position)
    QueueService->>DB: 18. Get Queue Statistics
    DB-->>QueueService: 19. Queue Stats (position, waitTime)
    QueueService->>NotificationService: 20. sendTokenConfirmation(tokenId)
    NotificationService-->>C: 21. Notification: Token Generated
    
    QueueService-->>Queue: 22. Queue Response (token, position, waitTime)
    Queue-->>UI: 23. JSON Response
    UI->>WS: 24. Subscribe to Queue Updates
    UI-->>C: 25. Display Token Status

    %% Real-time Updates
    loop Every 30 seconds
        UI->>Queue: 26. GET /api/queue/token/{tokenId}/status
        Queue->>QueueService: 27. getTokenStatus(tokenId)
        QueueService->>DB: 28. Get Current Queue Position
        DB-->>QueueService: 29. Current Position & Wait Time
        QueueService-->>Queue: 30. Status Data
        Queue-->>UI: 31. Updated Status
        UI-->>C: 32. Update Display
    end

    %% Staff Processing
    S->>UI: 33. Staff Login
    S->>UI: 34. View Assigned Tokens
    UI->>Queue: 35. GET /api/queue/staff/tokens
    Queue->>QueueService: 36. getStaffTokens(staffId)
    QueueService->>DB: 37. Get Tokens for Service
    DB-->>QueueService: 38. Token List
    QueueService-->>Queue: 39. Tokens Data
    Queue-->>UI: 40. Token List
    UI-->>S: 41. Display Tokens

    %% Token Ready Notification
    Note over QueueService,DB: When token reaches front of queue
    QueueService->>NotificationService: 42. sendTokenReadyNotification(tokenId)
    NotificationService->>WS: 43. Broadcast Token Ready
    WS-->>UI: 44. WebSocket: Token Ready
    UI-->>C: 45. Alert: "Your Token is Ready!"

    %% Service Processing
    S->>UI: 46. Click "Start Service" for Token
    UI->>Queue: 47. PUT /api/queue/token/{tokenId}/start
    Queue->>QueueService: 48. markTokenInProgress(tokenId)
    QueueService->>DB: 49. Update Token Status = IN_PROGRESS
    DB-->>QueueService: 50. Updated
    QueueService->>WS: 51. Broadcast Status Update
    WS-->>UI: 52. WebSocket: Status Updated
    UI-->>C: 53. Update: "Service Started"

    %% Service Completion
    S->>UI: 54. Click "Complete Service"
    UI->>Queue: 55. PUT /api/queue/token/{tokenId}/complete
    Queue->>QueueService: 56. completeService(tokenId)
    QueueService->>DB: 57. Update Token Status = COMPLETED
    QueueService->>DB: 58. Remove from Active Queue
    DB-->>QueueService: 59. Updated
    QueueService->>NotificationService: 60. sendCompletionNotification(tokenId)
    NotificationService-->>C: 61. Notification: Service Completed
    QueueService->>WS: 62. Broadcast Queue Update
    WS-->>UI: 63. WebSocket: Queue Updated
    QueueService-->>Queue: 64. Success Response
    Queue-->>UI: 65. Success
    UI-->>S: 66. Display Success
    UI-->>C: 67. Display: "Service Completed"
```

## Alternative Flow: Customer Cancels Token

```mermaid
sequenceDiagram
    participant C as Customer
    participant UI as Frontend UI
    participant Queue as QueueController
    participant QueueService as QueueService
    participant DB as Database
    participant WS as WebSocket Server

    C->>UI: 1. Click "Cancel Token"
    UI->>Queue: 2. DELETE /api/queue/token/{tokenId}
    Queue->>QueueService: 3. cancelToken(tokenId)
    QueueService->>DB: 4. Check Token Status
    DB-->>QueueService: 5. Token Status = WAITING
    QueueService->>DB: 6. Update Status = CANCELLED
    QueueService->>DB: 7. Remove from Queue
    QueueService->>DB: 8. Update Queue Positions
    DB-->>QueueService: 9. Updated
    QueueService->>WS: 10. Broadcast Queue Update
    WS-->>UI: 11. WebSocket: Queue Updated
    QueueService-->>Queue: 12. Success Response
    Queue-->>UI: 13. Success
    UI-->>C: 14. Display: "Token Cancelled"
```

## Alternative Flow: Admin Views Analytics

```mermaid
sequenceDiagram
    participant A as Admin
    participant UI as Frontend UI
    participant Analytics as AnalyticsController
    participant AnalyticsService as AnalyticsService
    participant DB as Database

    A->>UI: 1. Access Analytics Dashboard
    UI->>Analytics: 2. GET /api/analytics/dashboard
    Analytics->>AnalyticsService: 3. getDashboardStats(dateRange)
    AnalyticsService->>DB: 4. Query: Total Tokens Today
    DB-->>AnalyticsService: 5. Count
    AnalyticsService->>DB: 6. Query: Active Queues
    DB-->>AnalyticsService: 7. Queue Data
    AnalyticsService->>DB: 8. Query: Average Wait Time
    DB-->>AnalyticsService: 9. Average
    AnalyticsService->>DB: 10. Query: Service Statistics
    DB-->>AnalyticsService: 11. Service Stats
    AnalyticsService-->>Analytics: 12. Aggregated Dashboard Data
    Analytics-->>UI: 13. JSON Response
    UI-->>A: 14. Display Analytics Dashboard
```
