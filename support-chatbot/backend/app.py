import uuid
from datetime import datetime, timedelta, timezone
from functools import wraps

from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    get_jwt,
    get_jwt_identity,
    jwt_required,
)
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from sqlalchemy import func

import nlp_engine
from config import Config
from models import CATEGORIES, Admin, ChatMessage, ChatSession, FAQ, db

# ---------------------------------------------------------------------------
# Simple in-process cache for expensive read-only responses.
# Keys: string  ->  {"data": ..., "expires_at": datetime}
# ---------------------------------------------------------------------------
_cache: dict = {}


def _cache_get(key):
    entry = _cache.get(key)
    if entry and entry["expires_at"] > datetime.now(timezone.utc):
        return entry["data"]
    _cache.pop(key, None)
    return None


def _cache_set(key, data, ttl_seconds=30):
    _cache[key] = {
        "data": data,
        "expires_at": datetime.now(timezone.utc) + timedelta(seconds=ttl_seconds),
    }


def _cache_invalidate(prefix):
    """Remove every key that starts with `prefix`."""
    for key in list(_cache.keys()):
        if key.startswith(prefix):
            _cache.pop(key, None)


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    JWTManager(app)
    CORS(app, resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}})

    # ------------------------------------------------------------------
    # Rate limiting
    # ------------------------------------------------------------------
    # Uses the client IP as the key. Limits are intentionally generous
    # for development; tighten in production via env vars if needed.
    limiter = Limiter(
        key_func=get_remote_address,
        app=app,
        default_limits=["200 per hour", "60 per minute"],
        storage_uri="memory://",
    )

    register_routes(app, limiter)
    return app


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def admin_required(fn):
    """Restrict an endpoint to users with the 'admin' role (vs 'agent')."""

    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        claims = get_jwt()
        if claims.get("role") != "admin":
            return jsonify({"error": "Admin privileges required"}), 403
        return fn(*args, **kwargs)

    return wrapper


def serialize_faqs():
    return FAQ.query.order_by(FAQ.category, FAQ.id).all()


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

def register_routes(app, limiter):

    @app.get("/api/health")
    @limiter.exempt
    def health():
        return jsonify({"status": "ok", "time": datetime.now(timezone.utc).isoformat()})

    # ------------------------------------------------------------------
    # HTTPS redirect hint for production
    # In development this header is ignored; on Render/Railway the proxy
    # already handles TLS termination - we just tell clients to use HTTPS.
    # ------------------------------------------------------------------
    @app.after_request
    def add_security_headers(response):
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        # Only send HSTS in production (when not on localhost)
        if not request.host.startswith("127.") and not request.host.startswith("localhost"):
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response

    # ------------------------------------------------------------------
    # Chat (public)
    # Rate limit: 30 messages/minute per IP to prevent abuse
    # ------------------------------------------------------------------

    @app.post("/api/chat")
    @limiter.limit("30 per minute")
    def chat():
        data = request.get_json(force=True) or {}
        message = (data.get("message") or "").strip()
        session_id = data.get("session_id")
        user_name = (data.get("user_name") or "").strip()

        if not message:
            return jsonify({"error": "message is required"}), 400

        session = None
        if session_id:
            session = ChatSession.query.filter_by(session_id=session_id).first()

        if session is None:
            session_id = session_id or str(uuid.uuid4())
            session = ChatSession(session_id=session_id, user_name=user_name or "Guest")
            db.session.add(session)
            db.session.flush()
        elif user_name and session.user_name in (None, "", "Guest"):
            session.user_name = user_name

        # 1. Log the user's message
        user_msg = ChatMessage(session_id=session.id, sender="user", message=message)
        db.session.add(user_msg)

        # 2. Try small talk first (greetings, thanks, goodbye)
        small_talk_reply = nlp_engine.detect_small_talk(message)

        if small_talk_reply is not None:
            bot_text = small_talk_reply
            category = "general"
            matched_faq_id = None
            confidence = 1.0
            escalated = False
        else:
            # 3. NLP match against fresh FAQ list
            # Note: we do NOT cache ORM objects — SQLAlchemy detaches them
            # between requests. The FAQ table is small so a fresh query is fast.
            faqs = serialize_faqs()
            best_faq, confidence, category = nlp_engine.match(
                message, faqs, app.config["NLP_CONFIDENCE_THRESHOLD"]
            )

            if best_faq is not None:
                bot_text = best_faq.answer
                matched_faq_id = best_faq.id
                escalated = False
            else:
                bot_text = (
                    "I'm not sure I understood that. I've flagged this conversation for a "
                    "member of our support team, who will follow up shortly. In the "
                    "meantime, could you provide a bit more detail?"
                )
                matched_faq_id = None
                escalated = True
                if session.status == "active":
                    session.status = "escalated"

        bot_msg = ChatMessage(
            session_id=session.id,
            sender="bot",
            message=bot_text,
            category=category,
            matched_faq_id=matched_faq_id,
            confidence=confidence,
            escalated=escalated,
        )
        db.session.add(bot_msg)
        db.session.commit()

        return jsonify(
            {
                "session_id": session.session_id,
                "status": session.status,
                "response": {
                    "message": bot_text,
                    "category": category,
                    "confidence": round(confidence, 3),
                    "escalated": escalated,
                    "timestamp": bot_msg.timestamp.isoformat(),
                },
            }
        )

    @app.get("/api/chat/<session_id>")
    def chat_history(session_id):
        session = ChatSession.query.filter_by(session_id=session_id).first()
        if session is None:
            return jsonify({"error": "session not found"}), 404
        return jsonify(session.to_dict(include_messages=True))

    # ------------------------------------------------------------------
    # Auth
    # Rate limit login strictly to prevent brute-force attacks
    # ------------------------------------------------------------------

    @app.post("/api/auth/login")
    @limiter.limit("10 per minute; 50 per hour")
    def login():
        data = request.get_json(force=True) or {}
        username = (data.get("username") or "").strip()
        password = data.get("password") or ""

        user = Admin.query.filter_by(username=username).first()
        if user is None or not user.check_password(password):
            return jsonify({"error": "Invalid username or password"}), 401

        token = create_access_token(
            identity=str(user.id),
            additional_claims={"username": user.username, "role": user.role},
            expires_delta=timedelta(hours=12),
        )
        return jsonify({"access_token": token, "user": user.to_dict()})

    @app.get("/api/auth/me")
    @jwt_required()
    def me():
        user = Admin.query.get(int(get_jwt_identity()))
        if user is None:
            return jsonify({"error": "user not found"}), 404
        return jsonify(user.to_dict())

    @app.get("/api/auth/users")
    @admin_required
    def list_users():
        users = Admin.query.order_by(Admin.id).all()
        return jsonify([u.to_dict() for u in users])

    @app.post("/api/auth/users")
    @admin_required
    def create_user():
        data = request.get_json(force=True) or {}
        username = (data.get("username") or "").strip()
        password = data.get("password") or ""
        role = data.get("role", "agent")

        if role not in ("admin", "agent"):
            return jsonify({"error": "role must be 'admin' or 'agent'"}), 400
        if not username or not password:
            return jsonify({"error": "username and password are required"}), 400
        if Admin.query.filter_by(username=username).first():
            return jsonify({"error": "username already exists"}), 409

        user = Admin(username=username, role=role)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        return jsonify(user.to_dict()), 201

    @app.delete("/api/auth/users/<int:user_id>")
    @admin_required
    def delete_user(user_id):
        if int(get_jwt_identity()) == user_id:
            return jsonify({"error": "You cannot delete your own account"}), 400

        user = Admin.query.get(user_id)
        if user is None:
            return jsonify({"error": "user not found"}), 404

        db.session.delete(user)
        db.session.commit()
        return jsonify({"deleted": user_id})

    # ------------------------------------------------------------------
    # FAQ — public read (cached), admin write (invalidates cache)
    # ------------------------------------------------------------------

    @app.get("/api/faqs")
    def public_faqs():
        category = request.args.get("category")
        cache_key = f"faqs:public:{category or 'all'}"
        cached = _cache_get(cache_key)
        if cached is not None:
            return jsonify(cached)

        query = FAQ.query
        if category:
            query = query.filter_by(category=category)
        faqs = query.order_by(FAQ.category, FAQ.id).all()
        result = [f.to_dict() for f in faqs]
        _cache_set(cache_key, result, ttl_seconds=120)
        return jsonify(result)

    @app.get("/api/admin/faqs")
    @jwt_required()
    def admin_list_faqs():
        # Admin FAQ list: short cache (5s) just to absorb rapid reloads
        cached = _cache_get("faqs:admin")
        if cached is not None:
            return jsonify(cached)
        result = [f.to_dict() for f in serialize_faqs()]
        _cache_set("faqs:admin", result, ttl_seconds=5)
        return jsonify(result)

    @app.post("/api/admin/faqs")
    @jwt_required()
    def admin_create_faq():
        data = request.get_json(force=True) or {}
        question = (data.get("question") or "").strip()
        answer = (data.get("answer") or "").strip()
        category = data.get("category", "general")
        keywords = data.get("keywords", "")

        if not question or not answer:
            return jsonify({"error": "question and answer are required"}), 400
        if category not in CATEGORIES:
            return jsonify({"error": f"category must be one of {CATEGORIES}"}), 400

        faq = FAQ(category=category, question=question, answer=answer, keywords=keywords)
        db.session.add(faq)
        db.session.commit()
        _cache_invalidate("faqs:")   # invalidate all FAQ caches
        return jsonify(faq.to_dict()), 201

    @app.put("/api/admin/faqs/<int:faq_id>")
    @jwt_required()
    def admin_update_faq(faq_id):
        faq = FAQ.query.get(faq_id)
        if faq is None:
            return jsonify({"error": "FAQ not found"}), 404

        data = request.get_json(force=True) or {}
        if "question" in data:
            faq.question = data["question"].strip()
        if "answer" in data:
            faq.answer = data["answer"].strip()
        if "keywords" in data:
            faq.keywords = data["keywords"]
        if "category" in data:
            if data["category"] not in CATEGORIES:
                return jsonify({"error": f"category must be one of {CATEGORIES}"}), 400
            faq.category = data["category"]

        db.session.commit()
        _cache_invalidate("faqs:")   # invalidate all FAQ caches
        return jsonify(faq.to_dict())

    @app.delete("/api/admin/faqs/<int:faq_id>")
    @jwt_required()
    def admin_delete_faq(faq_id):
        faq = FAQ.query.get(faq_id)
        if faq is None:
            return jsonify({"error": "FAQ not found"}), 404
        db.session.delete(faq)
        db.session.commit()
        _cache_invalidate("faqs:")   # invalidate all FAQ caches
        return jsonify({"deleted": faq_id})

    # ------------------------------------------------------------------
    # Admin: chat sessions
    # ------------------------------------------------------------------

    @app.get("/api/admin/chats")
    @jwt_required()
    def admin_list_chats():
        status = request.args.get("status")
        query = ChatSession.query
        if status:
            query = query.filter_by(status=status)
        sessions = query.order_by(ChatSession.updated_at.desc()).all()
        return jsonify([s.to_dict() for s in sessions])

    @app.get("/api/admin/chats/<session_id>")
    @jwt_required()
    def admin_get_chat(session_id):
        session = ChatSession.query.filter_by(session_id=session_id).first()
        if session is None:
            return jsonify({"error": "session not found"}), 404
        return jsonify(session.to_dict(include_messages=True))

    @app.put("/api/admin/chats/<session_id>/status")
    @jwt_required()
    def admin_update_chat_status(session_id):
        session = ChatSession.query.filter_by(session_id=session_id).first()
        if session is None:
            return jsonify({"error": "session not found"}), 404

        data = request.get_json(force=True) or {}
        new_status = data.get("status")
        if new_status not in ("active", "escalated", "resolved"):
            return jsonify({"error": "status must be active, escalated, or resolved"}), 400

        session.status = new_status
        db.session.commit()
        return jsonify(session.to_dict())

    @app.delete("/api/admin/chats/<session_id>")
    @jwt_required()
    def admin_delete_chat(session_id):
        session = ChatSession.query.filter_by(session_id=session_id).first()
        if session is None:
            return jsonify({"error": "session not found"}), 404
        db.session.delete(session)
        db.session.commit()
        return jsonify({"deleted": session_id})

    # ------------------------------------------------------------------
    # Admin: analytics (cached 30s — expensive multi-table query)
    # ------------------------------------------------------------------

    @app.get("/api/admin/analytics")
    @jwt_required()
    def admin_analytics():
        cached = _cache_get("analytics:dashboard")
        if cached is not None:
            return jsonify(cached)

        total_chats = ChatSession.query.count()
        status_counts = dict(
            db.session.query(ChatSession.status, func.count(ChatSession.id))
            .group_by(ChatSession.status)
            .all()
        )

        bot_messages = ChatMessage.query.filter_by(sender="bot")
        total_bot_messages = bot_messages.count()
        matched_messages = bot_messages.filter(ChatMessage.matched_faq_id.isnot(None)).count()
        success_rate = (
            round((matched_messages / total_bot_messages) * 100, 1)
            if total_bot_messages
            else 0.0
        )

        category_breakdown = dict(
            db.session.query(ChatMessage.category, func.count(ChatMessage.id))
            .filter(ChatMessage.sender == "bot")
            .group_by(ChatMessage.category)
            .all()
        )

        top_rows = (
            db.session.query(
                FAQ.id, FAQ.question, FAQ.category, func.count(ChatMessage.id).label("hits")
            )
            .join(ChatMessage, ChatMessage.matched_faq_id == FAQ.id)
            .group_by(FAQ.id)
            .order_by(func.count(ChatMessage.id).desc())
            .limit(5)
            .all()
        )
        top_questions = [
            {"faq_id": r[0], "question": r[1], "category": r[2], "hits": r[3]} for r in top_rows
        ]

        today = datetime.now(timezone.utc).date()
        days = [today - timedelta(days=i) for i in range(6, -1, -1)]
        sessions = ChatSession.query.all()
        counts_by_day = {d.isoformat(): 0 for d in days}
        for s in sessions:
            d = s.created_at.date()
            key = d.isoformat()
            if key in counts_by_day:
                counts_by_day[key] += 1
        chats_over_time = [{"date": k, "count": v} for k, v in counts_by_day.items()]

        result = {
            "total_chats": total_chats,
            "total_messages": total_bot_messages,
            "active_chats": status_counts.get("active", 0),
            "escalated_chats": status_counts.get("escalated", 0),
            "resolved_chats": status_counts.get("resolved", 0),
            "success_rate": success_rate,
            "category_breakdown": category_breakdown,
            "top_questions": top_questions,
            "chats_over_time": chats_over_time,
        }
        _cache_set("analytics:dashboard", result, ttl_seconds=30)
        return jsonify(result)

    # ------------------------------------------------------------------
    # One-time seed endpoint (delete after seeding in production!)
    # ------------------------------------------------------------------

    @app.get("/api/admin/seed")
    def seed_database():
        import os
        secret = request.args.get("secret")
        if secret != os.environ.get("SEED_SECRET", "seed-me-now"):
            return jsonify({"error": "forbidden"}), 403

        from seed_data import FAQS, ADMIN_USERS

        added = {"users": 0, "faqs": 0}
        for user in ADMIN_USERS:
            if not Admin.query.filter_by(username=user["username"]).first():
                admin = Admin(username=user["username"], role=user["role"])
                admin.set_password(user["password"])
                db.session.add(admin)
                added["users"] += 1

        if FAQ.query.count() == 0:
            for faq in FAQS:
                db.session.add(FAQ(**faq))
                added["faqs"] += 1

        db.session.commit()
        return jsonify({"status": "seeded", "added": added})

app = create_app()

if __name__ == "__main__":
    import os
    with app.app_context():
        db.create_all()
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_ENV") == "development"
    app.run(host="0.0.0.0", port=port, debug=debug)