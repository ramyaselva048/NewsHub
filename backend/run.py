import os
from app import create_app
from app.models import db

app = create_app()

if __name__ == "__main__":
    with app.app_context():
        # Automatically create tables if using a database
        try:
            db.create_all()
        except Exception as e:
            print(f"Database setup note: {e}")

    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
