import json
import random
import sys
from datetime import datetime
from app.database import SessionLocal
from app.models.product import Product

PUBLISHERS = [
    "Penguin Random House", "HarperCollins", "Simon & Schuster",
    "Macmillan Publishers", "Hachette Book Group", "Oxford University Press",
    "Cambridge University Press", "O'Reilly Media", "MIT Press",
    "Harvard Business Review Press", "Bloomsbury", "Scholastic",
    "Tor Books", "Vintage Classics", "Folio Society"
]

CITIES = ["Bengaluru", "Mumbai", "Delhi", "Hyderabad", "Chennai", "Kolkata", "Pune"]
MERCHANTS = [
    ("merch_books_01", "Oxford Book Store"),
    ("merch_books_02", "Crossword Books"),
    ("merch_books_03", "Penguin India Store"),
    ("merch_books_04", "Atta Galatta Books"),
    ("merch_001", "RazorCart Official Books")
]

COLORS = ["Black", "Blue", "Gold", "Red", "White", "Green", "Purple", "Yellow", "Brown", "Silver"]
FORMATS = ["Paperback", "Hardcover", "Clothbound Classic", "Leatherbound Deluxe", "Collector's Boxset"]

GENRES_DATA = [
    {
        "genre": "Sci-Fi & Cyberpunk",
        "authors": [
            "Isaac Asimov", "Philip K. Dick", "Arthur C. Clarke", "Frank Herbert",
            "William Gibson", "Cixin Liu", "Ted Chiang", "Andy Weir", "Neal Stephenson",
            "Ursula K. Le Guin", "H.G. Wells", "Ray Bradbury", "Ann Leckie", "Blake Crouch"
        ],
        "topics": [
            "Dune Chronicles", "Foundation and Empire", "Do Androids Dream of Electric Sheep",
            "Neuromancer Cyberpunk", "The Three-Body Problem", "Exhalation Stories of Wonder",
            "The Martian Survival", "Snow Crash Metaverse", "Hyperion Cantos Omnibus",
            "Rendezvous with Rama", "Left Hand of Darkness", "Fahrenheit 451 Classic",
            "Dark Matter Parallel Worlds", "Recursion Temporal Paradox", "Solaris Consciousness",
            "The Expanse Series", "I, Robot Anthology", "Starship Troopers Military Sci-Fi",
            "Annihilation Southern Reach", "Project Hail Mary Science", "The Time Machine Classic",
            "Childhood's End", "The Dispossessed Utopia", "Blindsight Hard Sci-Fi"
        ],
        "image_urls": [
            "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=800&auto=format&fit=crop&q=80"
        ]
    },
    {
        "genre": "Fantasy & Epic Saga",
        "authors": [
            "J.R.R. Tolkien", "George R.R. Martin", "Brandon Sanderson", "J.K. Rowling",
            "Patrick Rothfuss", "Robert Jordan", "Terry Pratchett", "Neil Gaiman",
            "Robin Hobb", "Steven Erikson", "Joe Abercrombie", "Leigh Bardugo"
        ],
        "topics": [
            "The Lord of the Rings", "A Game of Thrones", "The Way of Kings",
            "Harry Potter Hogwarts", "The Name of the Wind", "The Wheel of Time",
            "Discworld City Watch", "American Gods", "Assassin's Apprentice",
            "Gardens of the Moon Malazan", "The Blade Itself First Law", "Six of Crows",
            "Mistborn The Final Empire", "The Hobbit Middle Earth", "Words of Radiance",
            "The Wise Man's Fear", "Stardust Fairy Tale", "Good Omens Armageddon"
        ],
        "image_urls": [
            "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1518373714866-3f1478910cc0?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=800&auto=format&fit=crop&q=80"
        ]
    },
    {
        "genre": "Technology & AI",
        "authors": [
            "O'Reilly Media", "Martin Fowler", "Robert C. Martin", "Andrew Ng",
            "Stuart Russell", "Eric Evans", "Donald Knuth", "Alex Xu",
            "Gene Kim", "Max Tegmark", "Nick Bostrom", "Satya Nadella", "Sam Altman"
        ],
        "topics": [
            "Designing Data-Intensive Applications", "Clean Code Agile Architecture",
            "Artificial Intelligence A Modern Approach", "Domain-Driven Design DDD",
            "The Art of Computer Programming Knuth", "System Design Interview Guide",
            "The Phoenix Project DevOps", "Life 3.0 Being Human in AI Age",
            "Superintelligence Paths and Dangers", "Refactoring Code Architecture",
            "Clean Architecture Handbook", "Deep Learning Neural Networks",
            "Grokking Algorithms", "Building Microservices Distributed Systems",
            "The Pragmatic Programmer", "Modern Operating Systems Kernel",
            "Computer Networking Top-Down", "Database System Concepts Architecture"
        ],
        "image_urls": [
            "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&auto=format&fit=crop&q=80"
        ]
    },
    {
        "genre": "Business & Finance",
        "authors": [
            "Benjamin Graham", "Warren Buffett", "Ray Dalio", "Morgan Housel",
            "Nassim Nicholas Taleb", "Robert Kiyosaki", "Naval Ravikant", "Phil Knight",
            "Peter Thiel", "Clayton Christensen", "Daniel Kahneman", "Jim Collins"
        ],
        "topics": [
            "The Intelligent Investor Value Investing", "Principles for Navigating Big Debt Crises",
            "The Psychology of Money Timeless Lessons", "Incerto Antifragile Black Swan",
            "Rich Dad Poor Dad Financial Freedom", "The Almanack of Naval Ravikant",
            "Shoe Dog Memoir of Nike Founder", "Zero to One Notes on Startups",
            "The Innovator's Dilemma Business Strategy", "Thinking, Fast and Slow Behavioral Economics",
            "Good to Great Corporate Excellence", "Principles for Dealing with Changing World Order",
            "The Essays of Warren Buffett", "Valuation McKinsey Guide",
            "Venture Deals VC Capital", "The Personal MBA Business Mastery"
        ],
        "image_urls": [
            "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80"
        ]
    },
    {
        "genre": "Fiction & Literature",
        "authors": [
            "Haruki Murakami", "Kazuo Ishiguro", "Gabriel García Márquez", "Jane Austen",
            "Leo Tolstoy", "F. Scott Fitzgerald", "Virginia Woolf", "Ernest Hemingway",
            "Franz Kafka", "Fyodor Dostoevsky", "Cormac McCarthy", "Toni Morrison"
        ],
        "topics": [
            "1Q84 Surrealist Masterpiece", "Never Let Me Go Dystopian Literature",
            "One Hundred Years of Solitude Magical Realism", "Pride and Prejudice Clothbound Classic",
            "War and Peace Epic Masterpiece", "The Great Gatsby Centenary",
            "To the Lighthouse Modernist Classic", "The Old Man and the Sea Nobel Prize",
            "The Brothers Karamazov Existential Classic", "Blood Meridian Western Masterpiece",
            "Beloved Pulitzer Winner", "Kafka on the Shore Magical Realism",
            "Norwegian Wood Coming of Age", "Crime and Punishment Psychological Classic",
            "Anna Karenina Russian Literature", "The Remains of the Day Booker Winner"
        ],
        "image_urls": [
            "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=800&auto=format&fit=crop&q=80"
        ]
    },
    {
        "genre": "Mystery & Thriller",
        "authors": [
            "Agatha Christie", "Arthur Conan Doyle", "Dan Brown", "Gillian Flynn",
            "Stephen King", "Keigo Higashino", "Jo Nesbø", "David Baldacci",
            "Michael Connelly", "James Patterson", "Lee Child", "Lucy Foley"
        ],
        "topics": [
            "Hercule Poirot Murder Mystery", "Sherlock Holmes Complete Stories",
            "The Da Vinci Code Cryptic Puzzle", "Gone Girl Psychological Thriller",
            "The Shining Horror Classic", "The Devotion of Suspect X Japanese Mystery",
            "The Snowman Crime Thriller", "The Lincoln Lawyer Legal Thriller",
            "Jack Reacher Action Thriller", "The Guest List Murder Mystery",
            "And Then There Were None Classic Whodunit", "Angels & Demons Vatican Thriller",
            "Misery Psychological Horror", "The Girl with the Dragon Tattoo Millennium"
        ],
        "image_urls": [
            "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=800&auto=format&fit=crop&q=80"
        ]
    },
    {
        "genre": "History & Biography",
        "authors": [
            "Yuval Noah Harari", "Walter Isaacson", "Malcolm Gladwell", "Ramachandra Guha",
            "William Dalrymple", "David McCullough", "Ron Chernow", "Doris Kearns Goodwin",
            "Antony Beevor", "Shashi Tharoor"
        ],
        "topics": [
            "Sapiens A Brief History of Humankind", "Steve Jobs Authorized Biography",
            "Outliers The Story of Success", "India After Gandhi Modern History",
            "The Anarchy The East India Company", "Alexander Hamilton Biography",
            "Team of Rivals Lincoln Biography", "Stalingrad WW2 History",
            "An Era of Darkness British Empire in India", "Einstein His Life and Universe",
            "Elon Musk Biography", "Guns Germs and Steel Human Societies",
            "The Last Mughal Dynasty Fall", "Leonardo da Vinci Illustrated Biography"
        ],
        "image_urls": [
            "https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1447069387593-a5de0862481e?w=800&auto=format&fit=crop&q=80"
        ]
    },
    {
        "genre": "Self-Help & Personal Development",
        "authors": [
            "James Clear", "Cal Newport", "Stephen R. Covey", "Viktor E. Frankl",
            "Mark Manson", "Robin Sharma", "Dale Carnegie", "Eckhart Tolle",
            "Jay Shetty", "Rhonda Byrne", "Ryan Holiday"
        ],
        "topics": [
            "Atomic Habits Habit Building", "Deep Work Rules for Focused Success",
            "The 7 Habits of Highly Effective People", "Man's Search for Meaning Existential",
            "The Subtle Art of Not Giving a F*ck", "The Monk Who Sold His Ferrari",
            "How to Win Friends and Influence People", "The Power of Now Mindfulness",
            "Think Like a Monk Peace & Purpose", "The Daily Stoic Wisdom Meditations",
            "Digital Minimalism Focus Guide", "The Obstacle Is the Way Stoicism",
            "Can't Hurt Me David Goggins Discipline"
        ],
        "image_urls": [
            "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&auto=format&fit=crop&q=80"
        ]
    },
    {
        "genre": "Philosophy & Ethics",
        "authors": [
            "Marcus Aurelius", "Friedrich Nietzsche", "Plato", "Sun Tzu",
            "Niccolò Machiavelli", "Seneca", "Epictetus", "Immanuel Kant",
            "Arthur Schopenhauer", "Albert Camus", "Jean-Paul Sartre"
        ],
        "topics": [
            "Meditations of Marcus Aurelius Stoic Classic", "Beyond Good and Evil Philosophy",
            "The Republic by Plato Dialogues", "The Art of War Military Strategy",
            "The Prince Political Philosophy", "Letters from a Stoic Moral Essays",
            "The Myth of Sisyphus Existentialism", "Critique of Pure Reason Philosophy",
            "The World as Will and Representation", "Being and Nothingness Existentialism",
            "Discourses of Epictetus", "Nicomachean Ethics Aristotle"
        ],
        "image_urls": [
            "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=800&auto=format&fit=crop&q=80"
        ]
    },
    {
        "genre": "Graphic Novels & Manga",
        "authors": [
            "Alan Moore", "Neil Gaiman", "Art Spiegelman", "Kentaro Miura",
            "Eiichiro Oda", "Akira Toriyama", "Hajime Isayama", "Takehiko Inoue",
            "Frank Miller", "Marjane Satrapi"
        ],
        "topics": [
            "Watchmen Absolute Edition", "The Sandman Omnibus Boxset",
            "Maus A Survivor's Tale Graphic Novel", "Berserk Deluxe Edition Hardcover",
            "One Piece Manga Box Set", "Dragon Ball Z Complete Collection",
            "Attack on Titan Colossal Edition", "Vagabond VizBig Manga Set",
            "Batman The Dark Knight Returns", "Persepolis Graphic Memoir",
            "V for Vendetta Graphic Novel", "Akira 35th Anniversary Manga Set"
        ],
        "image_urls": [
            "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80"
        ]
    }
]

EDITION_SUFFIXES = [
    "Collector's Edition", "Special Hardcover Edition", "Leatherbound Deluxe Set",
    "Paperback Edition", "Illustrated Centenary Edition", "Annotated Study Edition",
    "Extended Authorized Edition", "Folio Society Slipcase", "Complete Box Set",
    "Library Hardcover Edition", "Limited Signed Edition", "Deluxe Omnibus Edition"
]

def generate_books(total_count=5000):
    db = SessionLocal()
    print(f"Starting seeding of {total_count} books into database...")
    
    books_to_create = []
    
    for i in range(total_count):
        genre_info = random.choice(GENRES_DATA)
        genre = genre_info["genre"]
        author = random.choice(genre_info["authors"])
        topic = random.choice(genre_info["topics"])
        suffix = random.choice(EDITION_SUFFIXES)
        publisher = random.choice(PUBLISHERS)
        format_type = random.choice(FORMATS)
        city = random.choice(CITIES)
        merch_id, merch_name = random.choice(MERCHANTS)
        color = random.choice(COLORS)
        img_url = random.choice(genre_info["image_urls"])
        
        # Price distribution between Rs. 500 and Rs. 20,000
        # 40% 500-1499, 30% 1500-4999, 20% 5000-9999, 10% 10000-20000
        roll = random.random()
        if roll < 0.40:
            price = float(random.randint(500, 1499))
        elif roll < 0.70:
            price = float(random.randint(1500, 4999))
        elif roll < 0.90:
            price = float(random.randint(5000, 9999))
        else:
            price = float(random.randint(10000, 20000))
            
        mrp_multiplier = random.uniform(1.15, 1.45)
        original_price = round(price * mrp_multiplier, 0)
        discount_pct = int(((original_price - price) / original_price) * 100)
        
        rating = round(random.uniform(3.9, 5.0), 1)
        review_count = random.randint(15, 4500)
        stock = random.randint(10, 100)
        pages = random.randint(180, 1450)
        isbn = f"978-{random.randint(100000000, 999999999)}"
        
        title = f"{topic}: {suffix}" if not topic.endswith(suffix) else topic
        
        description = (
            f"**{title}** by renowned author **{author}** ({publisher}).\n\n"
            f"Genre: **{genre}** | Format: **{format_type}** | Pages: **{pages}** | ISBN: **{isbn}**\n\n"
            f"This authoritative work explores deep thematic narratives, rigorous insights, and masterwork craftsmanship. "
            f"Published by {publisher}, this volume features crisp typography, durable archival binding, and verified reader satisfaction ratings of {rating}/5.0 based on {review_count}+ customer reviews."
        )
        
        tags_list = [
            genre.lower(), "book", "books", "reading", "bestseller",
            author.lower(), publisher.lower(), format_type.lower()
        ] + [word.lower() for word in topic.split() if len(word) > 2]
        
        metadata_dict = {
            "department": "Books",
            "genre": genre,
            "author": author,
            "publisher": publisher,
            "format": format_type,
            "pages": pages,
            "isbn": isbn,
            "language": "English",
            "edition": suffix
        }
        
        p = Product(
            title=title,
            brand=author,
            category=genre,
            department="Books",
            gender="Unisex",
            color=color,
            price=price,
            original_price=original_price,
            discount_pct=discount_pct,
            rating=rating,
            review_count=review_count,
            stock=stock,
            city=city,
            merchant_id=merch_id,
            merchant_name=merch_name,
            image_url=img_url,
            description=description,
            tags=json.dumps(list(set(tags_list))),
            product_meta=json.dumps(metadata_dict),
            is_active=True,
            created_at=datetime.utcnow()
        )
        books_to_create.append(p)
        
        if len(books_to_create) >= 500:
            db.bulk_save_objects(books_to_create)
            db.commit()
            print(f"Committed batch of 500 books (Total: {i + 1}/{total_count})")
            books_to_create = []
            
    if books_to_create:
        db.bulk_save_objects(books_to_create)
        db.commit()
        print(f"Committed final batch of {len(books_to_create)} books.")

    total_in_db = db.query(Product).count()
    total_books_in_db = db.query(Product).filter(Product.department == "Books").count()
    print(f"\nSeeding complete! Database now contains {total_in_db} products ({total_books_in_db} books).")
    db.close()

if __name__ == "__main__":
    generate_books(5000)
