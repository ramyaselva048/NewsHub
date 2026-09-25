from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from app.models import db
from config import Config

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    CORS(app)
    db.init_app(app)
    JWTManager(app)

    # Register blueprints
    from app.routes.auth import auth_bp
    from app.routes.articles import articles_bp
    from app.routes.categories import categories_bp
    from app.routes.comments import comments_bp
    from app.routes.likes import likes_bp
    from app.routes.bookmarks import bookmarks_bp
    from app.routes.admin import admin_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(articles_bp)
    app.register_blueprint(categories_bp)
    app.register_blueprint(comments_bp)
    app.register_blueprint(likes_bp)
    app.register_blueprint(bookmarks_bp)
    app.register_blueprint(admin_bp)

    @app.route("/api/health")
    def health_check():
        return {"status": "ok", "service": "NewsHub Flask API"}, 200

    return app
