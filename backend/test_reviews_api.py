import requests

base = 'http://localhost:8000'

# 1. Fetch reviews for Product 1
r = requests.get(f'{base}/api/products/1/reviews').json()
print("Product 1 Reviews Count: %d" % len(r))
for rev in r:
    print("  - %s (Rating: %.1f): %s" % (rev['user_name'], rev['rating'], rev['comment']))

# 2. Add a new review
new_rev = requests.post(f'{base}/api/products/1/reviews', json={
    'user_id': 1,
    'rating': 5.0,
    'comment': 'Awesome grip on wet roads! Highly recommended.'
}).json()
print("New review added ID: %s" % new_rev.get('id'))

# 3. Check updated product stats
p = requests.get(f'{base}/api/products/1').json()
print("Updated Product 1 Stats: rating=%.1f review_count=%d" % (p['rating'], p['review_count']))
