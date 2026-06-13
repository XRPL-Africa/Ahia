# Ahia Marketplace Backend

Ahia is a multi-tenant campus marketplace that verifies every user via School ID and uses a "Safety-Lock" Escrow system where funds (Fiat or RLUSD) are held by the platform until the buyer confirms the item's authenticity.

## Features

- **Multi-Tenant Architecture**: Campus-specific subdomains (e.g., uniben.ahia.app)
- **KYC Verification**: School ID verification with admin approval
- **Dual Listing Types**: "Buy Now" and "Open for Bids"
- **Safety-Lock Escrow**: 14-day inspection period with freeze option
- **XRPL Integration**: RLUSD payments with gasless transactions
- **Trust Score System**: Based on successful trades, ratings, and response time
- **Dispute Resolution**: Admin-managed dispute system
- **File Uploads**: Cloudinary integration for images
- **Real-time Notifications**: Redis-based notification system

## Tech Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis
- **File Storage**: Cloudinary
- **Blockchain**: XRPL (XRP Ledger)
- **Documentation**: Swagger/OpenAPI

## Project Structure

```
ahia-backend/
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── seed.ts          # Database seeding
├── src/
│   ├── config/          # Configuration files
│   │   ├── database.ts  # Prisma client
│   │   ├── redis.ts     # Redis client
│   │   ├── cloudinary.ts # Cloudinary config
│   │   ├── xrpl.ts      # XRPL integration
│   │   └── logger.ts    # Winston logger
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Express middlewares
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── types/           # TypeScript types
│   ├── utils/           # Utility functions
│   ├── validators/      # Zod schemas
│   └── server.ts        # Entry point
├── uploads/             # Temporary upload directory
├── .env.example         # Environment template
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- Cloudinary account
- XRPL testnet account (for development)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-org/ahia-backend.git
cd ahia-backend
```

2. Install dependencies:
```bash
npm install
```

3. Copy environment variables:
```bash
cp .env.example .env
```

4. Update `.env` with your configuration:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/ahia_db"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-refresh-secret-key"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# XRPL
XRPL_NODE_URL="wss://s.altnet.rippletest.net:51233"
XRPL_PLATFORM_ADDRESS="rYourPlatformWalletAddress"
XRPL_PLATFORM_SEED="sYourPlatformWalletSeed"
```

5. Run database migrations:
```bash
npm run prisma:migrate
```

6. Seed the database:
```bash
npm run prisma:seed
```

7. Start the development server:
```bash
npm run dev
```

The server will start at `http://localhost:5000`

## API Documentation

Once the server is running, access the Swagger documentation at:
- Swagger UI: `http://localhost:5000/api-docs`
- OpenAPI JSON: `http://localhost:5000/api-docs.json`

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/refresh-token` - Refresh access token
- `POST /api/v1/auth/logout` - Logout user
- `GET /api/v1/auth/profile` - Get user profile
- `PATCH /api/v1/auth/profile` - Update profile
- `POST /api/v1/auth/change-password` - Change password

### Listings
- `GET /api/v1/listings` - Get all listings
- `GET /api/v1/listings/:id` - Get listing by ID
- `POST /api/v1/listings` - Create listing (verified users only)
- `PATCH /api/v1/listings/:id` - Update listing
- `DELETE /api/v1/listings/:id` - Delete listing
- `POST /api/v1/listings/bids` - Place a bid
- `PATCH /api/v1/listings/bids/:id/respond` - Respond to bid

### Escrow
- `GET /api/v1/escrow/my` - Get my escrows
- `POST /api/v1/escrow` - Create escrow
- `GET /api/v1/escrow/:id` - Get escrow details
- `POST /api/v1/escrow/:id/handover` - Mark as handed over
- `POST /api/v1/escrow/:id/verify` - Verify and release
- `POST /api/v1/escrow/:id/freeze` - Request extension
- `POST /api/v1/escrow/:id/cancel` - Cancel escrow
- `POST /api/v1/escrow/disputes` - Open dispute

### Verification
- `POST /api/v1/verification/submit` - Submit verification
- `GET /api/v1/verification/my` - Get my verification status
- `GET /api/v1/verification/pending` - Get pending verifications (admin)
- `POST /api/v1/verification/:id/review` - Review verification (admin)

### Admin
- `GET /api/v1/admin/dashboard` - Dashboard stats
- `GET /api/v1/admin/users` - Get all users
- `POST /api/v1/admin/users/:id/suspend` - Suspend user
- `POST /api/v1/admin/users/:id/ban` - Ban user
- `GET /api/v1/admin/disputes` - Get disputes
- `POST /api/v1/admin/disputes/:id/resolve` - Resolve dispute
- `GET /api/v1/admin/campuses` - Get campuses
- `POST /api/v1/admin/campuses` - Create campus

## Scripts

```bash
# Development
npm run dev              # Start with hot reload

# Production
npm run build            # Compile TypeScript
npm start                # Start production server

# Database
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run migrations
npm run prisma:studio    # Open Prisma Studio
npm run prisma:seed      # Seed database

# Utilities
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint errors
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `5000` |
| `DATABASE_URL` | PostgreSQL connection string | - |
| `REDIS_URL` | Redis connection string | - |
| `JWT_SECRET` | JWT signing secret | - |
| `JWT_REFRESH_SECRET` | JWT refresh token secret | - |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | - |
| `CLOUDINARY_API_KEY` | Cloudinary API key | - |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | - |
| `XRPL_NODE_URL` | XRPL node WebSocket URL | - |
| `XRPL_PLATFORM_ADDRESS` | Platform XRPL address | - |
| `XRPL_PLATFORM_SEED` | Platform XRPL seed | - |
| `PAYSTACK_SECRET_KEY` | Paystack secret key | - |

## Security Features

- **Authentication**: JWT-based with refresh tokens
- **Authorization**: Role-based access control (RBAC)
- **Rate Limiting**: Configurable per-endpoint limits
- **Input Validation**: Zod schema validation
- **File Upload**: MIME type and size restrictions
- **CORS**: Configurable origin whitelist
- **Helmet**: Security headers
- **Password Hashing**: bcrypt with salt rounds

## Escrow Flow

```
1. Buyer creates escrow and pays
   ↓
2. Funds held in platform escrow (XRPL or Fiat)
   ↓
3. Seller marks item as handed over
   ↓
4. 14-day inspection period starts
   ↓
5. Buyer verifies authenticity → Funds released
   ↓
   OR
   ↓
5. Buyer requests freeze (Day 13) → 7-day extension
   ↓
6. No action → Auto-release after period
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the ISC License.

## Support

For support, email support@ahia.app or join our Slack channel.

## Acknowledgments

- Blockchain Uniben Team
- XRPL-Africa Community
- All contributors and supporters
