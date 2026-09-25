"""
Seed database script for NewsHub PostgreSQL database.
Populates admin user, demo user, categories, and initial rich articles.
"""
from app import create_app
from app.models import db, User, Category, Article, Comment, Like, Bookmark

app = create_app()

def seed_database():
    with app.app_context():
        db.drop_all()
        db.create_all()
        print("Tables created.")

        # Create Users
        admin = User(
            name="Ramya S",
            email="ramyaselva048@gmail.com",
            role="admin",
            profile_image="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80",
            bio="Editor-in-Chief at NewsHub. Covering global affairs, breakthrough technologies, and media ethics."
        )
        admin.set_password("Admin@123")

        user = User(
            name="Sarah Jenkins",
            email="sarah.jenkins@newshub.com",
            role="user",
            profile_image="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80",
            bio="Independent researcher and avid tech reader based in Seattle."
        )
        user.set_password("User@123")

        writer = User(
            name="Marcus Vance",
            email="marcus.vance@newshub.com",
            role="admin",
            profile_image="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
            bio="Senior Science & Deep Tech Journalist."
        )
        writer.set_password("Writer@123")

        db.session.add_all([admin, user, writer])
        db.session.commit()
        print("Users seeded.")

        # Create Categories
        cats = [
            Category(name="Technology", slug="technology", description="Breakthroughs in artificial intelligence, quantum computing, and autonomous infrastructure."),
            Category(name="Business", slug="business", description="Macroeconomic shifts, venture capital trends, and global markets."),
            Category(name="Science", slug="science", description="Astrophysics, clean energy transitions, and biomedical discovery."),
            Category(name="Sports", slug="sports", description="Championship coverage, sports science, and competitive analytics."),
            Category(name="Education", slug="education", description="Pedagogy, university transformation, and AI in classrooms."),
            Category(name="Entertainment", slug="entertainment", description="Cinematic arts, streaming evolution, and contemporary culture.")
        ]
        db.session.add_all(cats)
        db.session.commit()
        print("Categories seeded.")

        # Create Articles
        articles_data = [
            {
                "title": "The Quantum Leap: Commercial Quantum Processors Achieve Practical Supremacy in Materials Science",
                "slug": "quantum-leap-commercial-quantum-processors-materials-science",
                "summary": "Quantum computing labs have demonstrated room-temperature stable qubit arrays that simulate complex molecular bonds, accelerating battery chemistry breakthroughs by decades.",
                "content": "The quest for scalable quantum computational advantage reached an undeniable milestone this week...",
                "image_url": "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1200&q=80",
                "category_id": cats[0].id,
                "author_id": writer.id,
                "views": 1420,
                "is_featured": True,
                "is_trending": True,
                "read_time_minutes": 5
            },
            {
                "title": "Global Sovereign Wealth Funds Pivot Trillions Toward Renewable Grid Superhighways",
                "slug": "sovereign-wealth-funds-pivot-renewable-grid-superhighways",
                "summary": "Major institutional allocators are deploying capital into ultra-high-voltage direct current (HVDC) transmission lines connecting sun-drenched deserts with industrial manufacturing hubs.",
                "content": "Institutional capital allocation reached a critical turning point as five of the worlds largest sovereign wealth funds announced a coordinated $450 billion infrastructure consortium...",
                "image_url": "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=1200&q=80",
                "category_id": cats[1].id,
                "author_id": admin.id,
                "views": 980,
                "is_featured": True,
                "is_trending": True,
                "read_time_minutes": 6
            },
            {
                "title": "Deep Space James Webb Observations Confirm Organic Precursor Molecules in Habitable Exo-Moons",
                "slug": "james-webb-confirms-organic-precursor-molecules-exo-moons",
                "summary": "Spectroscopic analysis of the TRAPPIST-1 system reveals complex amino acid pre-cursors and atmospheric water vapor cycles around second-tier moons.",
                "content": "NASA and the European Space Agency released high-resolution transmission spectra captured during a 72-hour continuous planetary transit...",
                "image_url": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
                "category_id": cats[2].id,
                "author_id": writer.id,
                "views": 2150,
                "is_featured": False,
                "is_trending": True,
                "read_time_minutes": 4
            }
        ]

        for a in articles_data:
            art = Article(
                title=a["title"],
                slug=a["slug"],
                summary=a["summary"],
                content=a["content"],
                image_url=a["image_url"],
                category_id=a["category_id"],
                author_id=a["author_id"],
                views=a["views"],
                is_featured=a["is_featured"],
                is_trending=a["is_trending"],
                read_time_minutes=a["read_time_minutes"],
                status="published"
            )
            db.session.add(art)

        db.session.commit()
        print("Initial sample articles seeded.")

if __name__ == "__main__":
    seed_database()
