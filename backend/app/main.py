import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from .config import settings
from .database import engine, Base, SessionLocal
from .models import User, Product, CartItem, Order, AuditLedger
from .services.seed_data import seed_database
from .routers import auth, products, cart, agent, payment, audit
from .routers import merchant, admin, reviews, orders

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Drop all tables only when explicitly requested (e.g. after a schema migration).
    # Default is false — data survives restarts. Set RESET_DB=true in .env to wipe.
    if os.environ.get("RESET_DB", "false").lower() == "true":
        Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    yield

app = FastAPI(
    title="RazorCartAI Backend API",
    description="Agentic Commerce Platform with 10,000 Product Search Engine",
    version="2.1.1",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Customer-facing APIs
app.include_router(auth.router)
app.include_router(products.router)
app.include_router(reviews.router)
app.include_router(orders.router)
app.include_router(cart.router)
app.include_router(agent.router)
app.include_router(payment.router)

# Merchant Portal APIs (role-guarded)
app.include_router(merchant.router)

# Razorpay Admin Portal APIs (role-guarded)
app.include_router(admin.router)

# Legacy audit (kept for compatibility)
app.include_router(audit.router)


@app.get("/")
def root():
    return {
        "status": "online",
        "service": "RazorCartAI Agentic Engine v2.0",
        "model": settings.GROQ_MODEL,
        "portals": {
            "customer": "http://localhost:5173/",
            "merchant": "http://localhost:5173/merchant/login",
            "admin": "http://localhost:5173/admin/login",
        },
        "docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
