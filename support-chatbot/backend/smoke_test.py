import json

from app import create_app
from models import db


def main():
    app = create_app()
    with app.app_context():
        db.create_all()

    client = app.test_client()

    def p(label, resp):
        print(f"\n--- {label} ({resp.status_code}) ---")
        print(json.dumps(resp.get_json(), indent=2)[:800])

    # 1. Health check
    p("health", client.get("/api/health"))

    # 2. Chat: order status query (new session)
    r = client.post("/api/chat", json={"message": "Hi, where is my order?", "user_name": "Asha"})
    p("chat: order status", r)
    session_id = r.get_json()["session_id"]

    # 3. Chat: follow-up on same session
    r = client.post("/api/chat", json={"session_id": session_id, "message": "what is your refund policy"})
    p("chat: refund follow-up (same session)", r)

    # 4. Chat: greeting -> small talk
    r = client.post("/api/chat", json={"message": "hello there"})
    p("chat: greeting", r)

    # 5. Chat: unknown query -> should escalate
    r = client.post("/api/chat", json={"message": "my pet hamster is doing backflips on the moon"})
    p("chat: unknown -> escalation", r)
    esc_session_id = r.get_json()["session_id"]

    # 6. Get full chat history
    p("chat history", client.get(f"/api/chat/{session_id}"))

    # 7. Login as admin
    r = client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
    p("login (admin)", r)
    token = r.get_json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 8. /me
    p("me", client.get("/api/auth/me", headers=headers))

    # 9. Bad login
    r = client.post("/api/auth/login", json={"username": "admin", "password": "wrong"})
    p("login (bad password)", r)

    # 10. Admin FAQ list
    r = client.get("/api/admin/faqs", headers=headers)
    print(f"\n--- admin faq list ({r.status_code}) ---")
    print(f"count = {len(r.get_json())}")

    # 11. Create a new FAQ
    r = client.post(
        "/api/admin/faqs",
        headers=headers,
        json={
            "category": "technical",
            "question": "How do I clear my browser cache?",
            "answer": "Open browser settings > Privacy > Clear browsing data, then select cache and reload.",
            "keywords": "clear cache, browser cache",
        },
    )
    p("create faq", r)
    new_faq_id = r.get_json()["id"]

    # 12. Update it
    r = client.put(f"/api/admin/faqs/{new_faq_id}", headers=headers, json={"category": "general"})
    p("update faq", r)

    # 13. Delete it
    r = client.delete(f"/api/admin/faqs/{new_faq_id}", headers=headers)
    p("delete faq", r)

    # 14. Admin: list chats
    r = client.get("/api/admin/chats", headers=headers)
    print(f"\n--- admin chats list ({r.status_code}) ---")
    print(f"count = {len(r.get_json())}")

    # 15. Admin: mark escalated chat as resolved
    r = client.put(f"/api/admin/chats/{esc_session_id}/status", headers=headers, json={"status": "resolved"})
    p("resolve chat", r)

    # 16. Analytics
    p("analytics", client.get("/api/admin/analytics", headers=headers))

    # 17. Non-admin (agent) blocked from user management
    r = client.post("/api/auth/login", json={"username": "agent", "password": "agent123"})
    agent_token = r.get_json()["access_token"]
    r = client.get("/api/auth/users", headers={"Authorization": f"Bearer {agent_token}"})
    p("agent tries admin-only endpoint (should be 403)", r)

    # 18. Admin: create new user
    r = client.post(
        "/api/auth/users",
        headers=headers,
        json={"username": "newagent", "password": "newagent123", "role": "agent"},
    )
    p("create user", r)

    print("\n\nALL SMOKE TESTS RAN.")


if __name__ == "__main__":
    main()
