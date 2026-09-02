import sys, time
sys.path.insert(0, '.')

class P:
    def __init__(self, id, brand, title, category, gender, color, description, tags):
        self.id = id; self.brand = brand; self.title = title
        self.category = category; self.gender = gender; self.color = color
        self.description = description; self.tags = tags

products = [
    P(1, 'Nike', 'Run Defy Road Running Shoes', 'Footwear', 'Women', 'Pink', 'Cushioned mesh for 10k runs', '["running","pink","cushioning"]'),
    P(2, 'Nike', 'Revolution 8 Running Shoes', 'Footwear', 'Women', 'Coral', 'Soft foam midsole stable ride', '["running","coral","road"]'),
    P(5, 'Nike', 'Pegasus 40 Road Running Shoes', 'Footwear', 'Men', 'Black', 'Dual Zoom Air marathon shoe', '["marathon","zoom","black","premium"]'),
    P(7, 'Adidas', 'Ultraboost Light Running Shoes', 'Footwear', 'Men', 'Black', 'Continental rubber outsole', '["ultraboost","premium","cushioning"]'),
    P(9, 'Nike', 'Cushioned Training Socks', 'Accessories', 'Unisex', 'White', 'Dri-FIT arch band socks', '["socks","fbt"]'),
]

from app.services.vector_store import CatalogVectorStore
vs = CatalogVectorStore()

t = time.time()
vs.build_index(products)
print(f'build_index: {time.time()-t:.1f}s')

queries = [
    'cushioned running shoes under 5000',
    'lightweight foam marathon shoe',
    'Nike Pegasus',
    'socks accessories',
]
for q in queries:
    t = time.time()
    results = vs.search(q, top_k=3)
    ms = (time.time() - t) * 1000
    print(f'  [{q}] -> {[(r[0], round(r[1],3)) for r in results]}  ({ms:.0f}ms)')

print('PASS')
