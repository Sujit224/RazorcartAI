import requests

base = 'http://localhost:8000'

# 1. Merchant login
r = requests.post(f'{base}/api/auth/login', json={'email':'merchant@razorcart.ai','password':'merchant123','role':'merchant'})
d = r.json()
tok = d.get('access_token','')
user = d.get('user',{})
print("Merchant Login: role=%s merchant_id=%s" % (user.get('role'), user.get('merchant_id')))

h = {'Authorization': 'Bearer ' + tok}
dash = requests.get(f'{base}/api/merchant/dashboard', headers=h).json()
print("Merchant Dashboard: revenue=%.2f ai_profit=%.2f recoveries=%d" % (
    dash.get('total_revenue',0), dash.get('total_ai_profit',0), dash.get('total_recoveries',0)))

# 2. Admin login
r2 = requests.post(f'{base}/api/auth/login', json={'email':'admin@razorpay.ai','password':'admin123','role':'admin'})
tok2 = r2.json().get('access_token','')
h2 = {'Authorization': 'Bearer ' + tok2}
ad = requests.get(f'{base}/api/admin/dashboard', headers=h2).json()
print("Admin Dashboard: merchants=%d global_rev=%.2f ai_profit=%.2f recoveries=%d" % (
    ad.get('total_merchants',0), ad.get('total_revenue',0), ad.get('total_ai_profit',0), ad.get('total_recoveries',0)))

# 3. Customer blocked from merchant endpoint
r3 = requests.post(f'{base}/api/auth/login', json={'email':'priya@razorcart.ai','password':'password123'})
tok3 = r3.json().get('access_token','')
h3 = {'Authorization': 'Bearer ' + tok3}
guard = requests.get(f'{base}/api/merchant/dashboard', headers=h3)
print("Customer->Merchant endpoint: status=%d (expect 403)" % guard.status_code)

# 4. Merchants list
ml = requests.get(f'{base}/api/admin/merchants', headers=h2).json()
print("Admin Merchants count=%d" % len(ml))
for m in ml:
    print("  - %s revenue=%.0f ai_profit=%.0f" % (m['merchant_name'], m['total_revenue'], m['total_ai_profit']))
