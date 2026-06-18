from datetime import datetime, timezone

from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import check_password_hash, generate_password_hash

db = SQLAlchemy()


def now_utc():
    return datetime.now(timezone.utc)


# Categories used across the app (FAQ tagging, chat classification, analytics).
# Keep this list in sync with the frontend CATEGORY_META map.
CATEGORIES = ["order_status", "refund", "account", "technical", "general"]


class Admin(db.Model):
    """Admin / support-agent users who can log into the dashboard."""

    __tablename__ = "admins"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default="agent")  # 'admin' or 'agent'
    created_at = db.Column(db.DateTime, default=now_utc)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "role": self.role,
            "created_at": self.created_at.isoformat(),
        }


class FAQ(db.Model):
    """A knowledge-base entry the NLP engine matches user queries against."""

    __tablename__ = "faqs"

    id = db.Column(db.Integer, primary_key=True)
    category = db.Column(db.String(50), nullable=False, default="general")
    question = db.Column(db.String(500), nullable=False)
    answer = db.Column(db.Text, nullable=False)
    # Extra comma-separated keywords/synonyms to widen NLP matching.
    keywords = db.Column(db.String(500), default="")
    created_at = db.Column(db.DateTime, default=now_utc)
    updated_at = db.Column(db.DateTime, default=now_utc, onupdate=now_utc)

    def to_dict(self):
        return {
            "id": self.id,
            "category": self.category,
            "question": self.question,
            "answer": self.answer,
            "keywords": self.keywords or "",
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }


class ChatSession(db.Model):
    """A single end-user conversation."""

    __tablename__ = "chat_sessions"

    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.String(64), unique=True, nullable=False, index=True)
    user_name = db.Column(db.String(120), default="Guest")
    # 'active' | 'escalated' | 'resolved'
    status = db.Column(db.String(20), nullable=False, default="active")
    created_at = db.Column(db.DateTime, default=now_utc)
    updated_at = db.Column(db.DateTime, default=now_utc, onupdate=now_utc)

    messages = db.relationship(
        "ChatMessage",
        backref="session",
        lazy=True,
        cascade="all, delete-orphan",
        order_by="ChatMessage.timestamp",
    )

    def to_dict(self, include_messages=False):
        data = {
            "id": self.id,
            "session_id": self.session_id,
            "user_name": self.user_name,
            "status": self.status,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "message_count": len(self.messages),
        }
        if include_messages:
            data["messages"] = [m.to_dict() for m in self.messages]
        return data


class ChatMessage(db.Model):
    """A single message in a chat session, from either the user or the bot."""

    __tablename__ = "chat_messages"

    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey("chat_sessions.id"), nullable=False)
    sender = db.Column(db.String(10), nullable=False)  # 'user' | 'bot'
    message = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(50), nullable=True)
    matched_faq_id = db.Column(db.Integer, db.ForeignKey("faqs.id"), nullable=True)
    confidence = db.Column(db.Float, nullable=True)
    escalated = db.Column(db.Boolean, default=False)
    timestamp = db.Column(db.DateTime, default=now_utc)

    def to_dict(self):
        return {
            "id": self.id,
            "sender": self.sender,
            "message": self.message,
            "category": self.category,
            "matched_faq_id": self.matched_faq_id,
            "confidence": self.confidence,
            "escalated": self.escalated,
            "timestamp": self.timestamp.isoformat(),
        }
