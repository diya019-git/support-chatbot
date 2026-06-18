"""
Populate the database with a starter admin user and a small FAQ knowledge
base covering the categories used throughout the app:
order_status, refund, account, technical, general.

Run with:  python seed_data.py
Safe to re-run - it only inserts data that doesn't already exist.
"""

from app import create_app
from models import FAQ, Admin, db

FAQS = [
    # --- order_status ---
    dict(
        category="order_status",
        question="Where is my order?",
        answer="You can track your order from the 'My Orders' section of your account. "
        "Please share your order ID and I can look into the latest status for you.",
        keywords="track order, order status, shipment, delivery, parcel, package, where is my package",
    ),
    dict(
        category="order_status",
        question="How long does shipping take?",
        answer="Standard shipping takes 3-5 business days, and express shipping takes 1-2 business days. "
        "You'll receive a tracking link by email as soon as your order ships.",
        keywords="shipping time, delivery time, how long, when will it arrive, eta",
    ),
    dict(
        category="order_status",
        question="Can I change my delivery address after placing an order?",
        answer="If your order hasn't shipped yet, we can update the delivery address. "
        "Please share your order ID and the new address, and our team will update it.",
        keywords="change address, update address, wrong address, delivery location",
    ),
    dict(
        category="order_status",
        question="How do I cancel my order?",
        answer="Orders can be cancelled within 1 hour of placing them from the 'My Orders' page. "
        "After that, please contact support with your order ID and we'll do our best to help.",
        keywords="cancel order, stop order, cancel purchase",
    ),
    # --- refund ---
    dict(
        category="refund",
        question="What is your refund policy?",
        answer="Refunds are available within 7 days of delivery for unused items in their original "
        "packaging. Once we receive the returned item, your refund is processed within 5-7 business days.",
        keywords="refund policy, money back, return policy, get my money back",
    ),
    dict(
        category="refund",
        question="How do I request a refund?",
        answer="To request a refund, go to 'My Orders', select the item, and tap 'Request Refund'. "
        "You can also share your order ID here and I'll start the process for you.",
        keywords="request refund, start refund, return item, raise refund",
    ),
    dict(
        category="refund",
        question="Why hasn't my refund been credited yet?",
        answer="Refunds typically take 5-7 business days to reflect in your account after we receive "
        "the returned item. If it has been longer than that, please share your order ID so we can check.",
        keywords="refund not received, refund pending, refund delay, where is my refund",
    ),
    dict(
        category="refund",
        question="Can I exchange an item instead of a refund?",
        answer="Yes, exchanges are available for most items within 7 days of delivery, subject to "
        "stock availability. Choose 'Exchange' instead of 'Refund' when starting your return.",
        keywords="exchange item, swap product, replace item, size exchange",
    ),
    # --- account ---
    dict(
        category="account",
        question="How do I reset my password?",
        answer="Go to the login page and click 'Forgot Password'. We'll send a reset link to your "
        "registered email address. The link is valid for 30 minutes.",
        keywords="reset password, forgot password, change password, can't login",
    ),
    dict(
        category="account",
        question="How do I update my email address?",
        answer="You can update your email from Account Settings > Profile. We'll send a verification "
        "link to the new email address to confirm the change.",
        keywords="change email, update email, edit profile, account email",
    ),
    dict(
        category="account",
        question="How do I delete my account?",
        answer="To delete your account, go to Account Settings > Privacy > Delete Account. "
        "This permanently removes your data after a 14-day grace period.",
        keywords="delete account, close account, remove my account, deactivate account",
    ),
    dict(
        category="account",
        question="Is my personal information secure?",
        answer="Yes. We use industry-standard encryption for all personal and payment data, and "
        "never share your information with third parties without your consent.",
        keywords="data privacy, security, is my data safe, personal information",
    ),
    # --- technical ---
    dict(
        category="technical",
        question="The website is not loading properly. What should I do?",
        answer="Try clearing your browser cache and reloading the page. If the issue continues, "
        "let me know which browser and device you're using and I'll escalate it to our tech team.",
        keywords="website not working, page not loading, site down, error loading",
    ),
    dict(
        category="technical",
        question="I'm getting an error when trying to make a payment.",
        answer="Payment errors are usually caused by incorrect card details, insufficient funds, or "
        "a temporary issue with the payment gateway. Please double-check your details and try again. "
        "If it still fails, share the error message and I'll escalate it.",
        keywords="payment failed, payment error, card declined, checkout error, transaction failed",
    ),
    dict(
        category="technical",
        question="The app keeps crashing on my phone.",
        answer="Please try updating the app to the latest version and restarting your phone. "
        "If the problem continues, let us know your phone model and OS version so we can investigate.",
        keywords="app crashing, app not opening, app crash, mobile app issue",
    ),
    dict(
        category="technical",
        question="How do I enable notifications?",
        answer="Go to Account Settings > Notifications and toggle on the alerts you'd like to receive. "
        "Make sure notifications are also allowed for the app in your phone's system settings.",
        keywords="enable notifications, push notifications, turn on alerts, notification settings",
    ),
    # --- general ---
    dict(
        category="general",
        question="What are your customer support hours?",
        answer="Our chatbot is available 24/7. Our human support team is available Monday-Saturday, "
        "9 AM - 7 PM. Outside these hours, your query will be queued and answered as soon as possible.",
        keywords="support hours, working hours, when are you open, customer service hours",
    ),
    dict(
        category="general",
        question="How can I contact a human agent?",
        answer="Connecting you to our support team. A human agent will join this chat shortly and "
        "follow up on your query as soon as possible.",
        keywords="talk to human, contact support, speak to agent, live chat, real person",
    ),
    dict(
        category="general",
        question="Do you have a loyalty or rewards program?",
        answer="Yes! You earn reward points on every purchase, which can be redeemed for discounts "
        "on future orders. Check Account > Rewards to see your current balance.",
        keywords="loyalty program, rewards points, discounts, membership",
    ),
    dict(
        category="general",
        question="What payment methods do you accept?",
        answer="We accept credit/debit cards, UPI, net banking, and popular digital wallets. "
        "Available options are shown automatically at checkout based on your location.",
        keywords="payment methods, how to pay, accepted cards, payment options",
    ),
]

ADMIN_USERS = [
    dict(username="admin", password="admin123", role="admin"),
    dict(username="agent", password="agent123", role="agent"),
]


def seed():
    app = create_app()
    with app.app_context():
        db.create_all()

        for user in ADMIN_USERS:
            if not Admin.query.filter_by(username=user["username"]).first():
                admin = Admin(username=user["username"], role=user["role"])
                admin.set_password(user["password"])
                db.session.add(admin)
                print(f"Created admin user '{user['username']}' (role={user['role']})")

        if FAQ.query.count() == 0:
            for faq in FAQS:
                db.session.add(FAQ(**faq))
            print(f"Inserted {len(FAQS)} FAQ entries.")
        else:
            print("FAQ table already has data - skipping FAQ seed.")

        db.session.commit()
        print("Seeding complete.")


if __name__ == "__main__":
    seed()
