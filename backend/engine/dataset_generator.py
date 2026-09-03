import random
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Any


INDIAN_FIRST_NAMES = [
    "Aarav", "Aditi", "Ananya", "Amit", "Deepak", "Ishaan", "Kavya", "Manish",
    "Neha", "Pooja", "Priya", "Rahul", "Rohan", "Sanjay", "Sneha", "Sunil",
    "Tanvi", "Varun", "Vikram", "Yash", "Ritu", "Gaurav", "Simran", "Alok",
    "Meera", "Karan", "Kunal", "Rhea", "Nikhil", "Shweta"
]

INDIAN_LAST_NAMES = [
    "Sharma", "Verma", "Patel", "Mehta", "Reddy", "Nair", "Iyer", "Gupta",
    "Singh", "Chopra", "Joshi", "Bhatia", "Kapoor", "Banerjee", "Agarwal",
    "Deshmukh", "Malhotra", "Kulkarni", "Saxena", "Menon"
]

B2B_COMPANIES = [
    "Acme Logistics Pvt Ltd", "Zenith Health Technologies", "Nexus Retail Cloud",
    "InfraStack Solutions", "Bharat Fintech Labs", "QuantEdge Analytics",
    "UrbanMatrix Mobility", "HyperScale Cloud Services", "BlueDart Warehousing",
    "Starlight Mediaworks", "Optima Supply Chain", "Apex B2B Commerce"
]

ITEM_CATEGORIES = [
    "Electronics & Laptops", "SaaS Cloud Subscription", "Health & Wellness",
    "Fashion & Apparel", "Enterprise API Credits", "Office Furniture",
    "EdTech Annual Course", "Home Kitchen Appliances", "B2B SaaS Annual Plan"
]


def generate_synthetic_dataset(count: int = 300) -> List[Dict[str, Any]]:
    """
    Generates a synthetic batch of ~300 realistic recovery events weighted as:
    - 45% payment_failed (E51, E54, E91, E82 decline codes)
    - 25% checkout_abandoned (cart drop points, coupon hesitation)
    - 15% subscription_failed (SaaS/B2B renewals, mandate lapses)
    - 15% invoice_overdue (B2B invoices, dispute flags, overdue aging)
    """
    dataset: List[Dict[str, Any]] = []
    base_time = datetime.now() - timedelta(minutes=count * 2)

    for i in range(count):
        case_id = f"CASE-{1000 + i}"
        event_id = f"EVT-{2000 + i}"
        event_time = (base_time + timedelta(minutes=i * 2)).isoformat()
        
        # Determine event type based on weight
        rand_type = random.random()
        
        # Guarantee specific compliance triggers at fixed intervals for crisp demo presentation
        is_dnd_test = (i % 14 == 0)
        is_quiet_hours_test = (i % 18 == 0)
        is_retry_cap_test = (i % 22 == 0)
        is_contact_cap_test = (i % 26 == 0)
        is_b2b_escalation_test = (i % 16 == 0)

        # Local hour determination
        if is_quiet_hours_test:
            local_hour = random.choice([22, 23, 1, 3, 5, 2])  # 9pm - 9am quiet hours
        else:
            local_hour = random.choice([10, 11, 13, 14, 15, 16, 17, 18, 19, 20])

        prior_contacts = 2 if is_contact_cap_test else random.choice([0, 0, 0, 1])
        retry_count = 3 if is_retry_cap_test else random.choice([0, 0, 1])
        dnd_flag = True if is_dnd_test else (random.random() < 0.03)
        lang_pref = random.choices(["hinglish", "english", "hindi"], weights=[0.60, 0.32, 0.08])[0]

        if rand_type < 0.45:
            # 45% PAYMENT_FAILED
            event_type = "payment_failed"
            sub_type = random.choices(["insufficient", "expired", "timeout", "mandate"], weights=[0.45, 0.25, 0.20, 0.10])[0]
            name = f"{random.choice(INDIAN_FIRST_NAMES)} {random.choice(INDIAN_LAST_NAMES)}"
            segment = random.choices(["CONSUMER_RETAIL", "CONSUMER_PRO", "SMB"], weights=[0.60, 0.30, 0.10])[0]
            amount = round(random.choice([
                random.uniform(499, 1499),
                random.uniform(1999, 4999),
                random.uniform(5999, 14999)
            ]), 2)
            
            if sub_type == "insufficient":
                decline_code = "E51_INSUFFICIENT_FUNDS"
            elif sub_type == "expired":
                decline_code = "E54_EXPIRED_CARD"
            elif sub_type == "timeout":
                decline_code = "E91_ISSUER_TIMEOUT"
            else:
                decline_code = "E82_MANDATE_NOT_FOUND"

            metadata = {
                "decline_code": decline_code,
                "issuer_bank": random.choice(["HDFC Bank", "ICICI Bank", "State Bank of India", "Axis Bank", "Kotak Mahindra Bank"]),
                "payment_gateway": "Razorpay Direct Switch",
                "card_network": random.choice(["VISA", "Mastercard", "RuPay"]),
                "card_last4": f"{random.randint(1000, 9999)}"
            }

        elif rand_type < 0.70:
            # 25% CHECKOUT_ABANDONED
            event_type = "checkout_abandoned"
            name = f"{random.choice(INDIAN_FIRST_NAMES)} {random.choice(INDIAN_LAST_NAMES)}"
            segment = random.choices(["CONSUMER_RETAIL", "CONSUMER_PRO"], weights=[0.75, 0.25])[0]
            amount = round(random.uniform(1299, 18500), 2)
            stage = random.choices(["shipping_fee_view", "discount_code_failed", "payment_method_selection"], weights=[0.5, 0.3, 0.2])[0]
            
            metadata = {
                "cart_stage": stage,
                "item_category": random.choice(ITEM_CATEGORIES),
                "items_count": random.randint(1, 4),
                "device": random.choice(["Mobile (Android)", "Mobile (iOS)", "Desktop (Chrome)"]),
                "attempted_coupon": "SAVE20" if stage == "discount_code_failed" else None
            }

        elif rand_type < 0.85:
            # 15% SUBSCRIPTION_FAILED
            event_type = "subscription_failed"
            name = f"{random.choice(INDIAN_FIRST_NAMES)} {random.choice(INDIAN_LAST_NAMES)}"
            segment = random.choices(["CONSUMER_PRO", "SMB"], weights=[0.55, 0.45])[0]
            amount = round(random.choice([999, 1499, 2999, 4999, 8999]), 2)
            tenure = random.randint(2, 24)
            
            metadata = {
                "plan_name": f"Pro {random.choice(['Growth', 'Starter', 'Business'])} Plan",
                "tenure_months": tenure,
                "mandate_type": "UPI_AUTOPAY",
                "decline_code": random.choice(["E51_INSUFFICIENT_FUNDS", "E54_EXPIRED_CARD", "E82_MANDATE_EXPIRED"])
            }

        else:
            # 15% INVOICE_OVERDUE (B2B)
            event_type = "invoice_overdue"
            name = random.choice(B2B_COMPANIES)
            segment = "ENTERPRISE" if is_b2b_escalation_test or random.random() < 0.4 else "SMB"
            
            if is_b2b_escalation_test:
                amount = round(random.uniform(55000, 185000), 2)
                days_overdue = random.randint(6, 18)
                dispute = True
            else:
                amount = round(random.uniform(15000, 48000), 2)
                days_overdue = random.randint(2, 4)
                dispute = random.random() < 0.25

            metadata = {
                "invoice_number": f"INV-2026-{random.randint(1000, 9999)}",
                "days_overdue": days_overdue,
                "credit_tier": random.choice(["Tier-A", "Tier-B+", "Tier-B"]),
                "dispute_flag": dispute,
                "dispute_reason": "PO item quantity clarification requested" if dispute else None
            }

        event = {
            "case_id": case_id,
            "event_id": event_id,
            "event_type": event_type,
            "customer_id": f"CUST-{random.randint(100000, 999999)}",
            "customer_name": name,
            "customer_segment": segment,
            "amount": amount,
            "currency": "INR",
            "channel_pref": random.choice(["whatsapp", "whatsapp", "email", "sms"]),
            "language_pref": lang_pref,
            "dnd_flag": dnd_flag,
            "prior_contact_count_24h": prior_contacts,
            "retry_count": retry_count,
            "timestamp": event_time,
            "local_hour": local_hour,
            "cumulative_cost": 0.0,
            "metadata": metadata
        }
        dataset.append(event)

    return dataset
