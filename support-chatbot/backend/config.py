import os

BASE_DIR = os.path.abspath(os.path.dirname(__file__))


class Config:
    # Flask / DB
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL", f"sqlite:///{os.path.join(BASE_DIR, 'chatbot.db')}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Secrets (override these with env vars in production)
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-key-change-me")
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "dev-jwt-secret-change-me")

    # NLP matching
    # Below this similarity score, the chatbot escalates to a human agent.
    NLP_CONFIDENCE_THRESHOLD = float(os.environ.get("NLP_CONFIDENCE_THRESHOLD", 0.22))

    # CORS
    CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "*")
