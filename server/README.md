# FastAPI Starter Project

## Project Structure

```
server/
├── app/
│   ├── main.py          # FastAPI application entry point
│   ├── config.py        # Application settings
│   ├── database.py      # SQLAlchemy setup
│   ├── models/          # SQLAlchemy models
│   ├── routers/         # API route definitions
│   ├── schemas/         # Pydantic models
│   └── utils/           # Utility functions
├── requirements.txt     # Python dependencies
├── Dockerfile           # Docker build configuration
├── docker-compose.yml   # Docker services configuration
├── .env                 # Environment variables
└── README.md            # Project documentation
```

## Getting Started

### Prerequisites
- Docker installed
- Python 3.11+

### Setup Instructions
1. Clone the repository
2. Run `docker-compose up -d` to start the PostgreSQL database and application
3. The application will be available at http://localhost:8000
4. Access the health check endpoint at http://localhost:8000/health

### Environment Variables
- DATABASE_URL: PostgreSQL connection string
- ENVIRONMENT: Application environment (development, production, etc.)
- DEBUG: Enable debug mode (True/False)
- BACKEND_CORS_ORIGINS: List of allowed origins for CORS

### Running the Application
- The application is automatically started by Docker Compose
- You can also run it manually with: `uvicorn app.main:app --reload`

### Database Migrations
- The initial database schema is created automatically when the application starts
- For future migrations, you will need to implement a migration system (e.g., Alembic)