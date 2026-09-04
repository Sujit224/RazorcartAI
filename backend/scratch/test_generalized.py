from app.agents.graph import agent_app

queries = [
    "Help me find mobiles under 50000/-",
    "Find pink running shoes under 4000",
    "Show me 64GB RAM products",
    "Find cotton t-shirts for men",
    "Show high-end air fryers and kitchen appliances"
]

for q in queries:
    res = agent_app.invoke({"user_message": q, "session_id": "test_sess"})
    prods = res.get("products", [])
    top = prods[0] if prods else None
    if top:
        print(f"[{q}] -> ({len(prods)} matches) Top: {top['brand']} {top['title']} (Rs. {top['price']})")
    else:
        print(f"[{q}] -> No matches")
