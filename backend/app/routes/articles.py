import re
import math
import random
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from app.models import db, Article, Category, User
from app.utils.auth import admin_required
from app.services.ai_service import generate_article_summary

articles_bp = Blueprint("articles", __name__, url_prefix="/api/articles")

def get_optional_user_id():
    try:
        verify_jwt_in_request(optional=True)
        return get_jwt_identity()
    except Exception:
        return None

@articles_bp.route("", methods=["GET"])
def get_articles():
    current_user_id = get_optional_user_id()
    category_param = request.args.get("category")
    status_param = request.args.get("status")
    featured_param = request.args.get("featured")
    page = int(request.args.get("page", 1))
    limit = int(request.args.get("limit", 9))

    query = Article.query

    # Status check
    user = User.query.get(current_user_id) if current_user_id else None
    if status_param:
        query = query.filter(Article.status == status_param)
    elif not user or user.role != "admin":
        query = query.filter(Article.status == "published")

    # Category check
    if category_param:
        cat = Category.query.filter(
            (Category.slug == category_param) | (Category.name == category_param)
        ).first()
        if cat:
            query = query.filter(Article.category_id == cat.id)

    # Featured check
    if featured_param == "true":
        query = query.filter(Article.is_featured == True)

    total = query.count()
    articles = query.order_by(Article.created_at.desc()).offset((page - 1) * limit).limit(limit).all()

    return jsonify({
        "articles": [a.to_dict(current_user_id=current_user_id) for a in articles],
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "totalPages": math.ceil(total / limit) if total > 0 else 1
        }
    }), 200

@articles_bp.route("/search", methods=["GET"])
def search_articles():
    current_user_id = get_optional_user_id()
    q = request.args.get("q", "").strip().lower()
    if not q:
        return jsonify([]), 200

    search_pattern = f"%{q}%"
    articles = Article.query.filter(
        Article.status == "published",
        (Article.title.ilike(search_pattern) | 
         Article.content.ilike(search_pattern) | 
         Article.summary.ilike(search_pattern))
    ).order_by(Article.created_at.desc()).all()

    return jsonify([a.to_dict(current_user_id=current_user_id) for a in articles]), 200

@articles_bp.route("/trending", methods=["GET"])
def get_trending_articles():
    current_user_id = get_optional_user_id()
    articles = Article.query.filter_by(status="published").order_by(Article.views.desc()).limit(5).all()
    return jsonify([a.to_dict(current_user_id=current_user_id) for a in articles]), 200

@articles_bp.route("/<article_id_or_slug>", methods=["GET"])
def get_article(article_id_or_slug):
    current_user_id = get_optional_user_id()
    article = None
    if article_id_or_slug.isdigit():
        article = Article.query.get(int(article_id_or_slug))
    if not article:
        article = Article.query.filter_by(slug=article_id_or_slug).first()

    if not article:
        return jsonify({"error": "Article not found"}), 404

    # Increment view counter
    article.views += 1
    db.session.commit()

    related = Article.query.filter(
        Article.id != article.id,
        Article.category_id == article.category_id,
        Article.status == "published"
    ).limit(3).all()

    return jsonify({
        "article": article.to_dict(current_user_id=current_user_id),
        "related": [
            {
                "id": r.id,
                "title": r.title,
                "slug": r.slug,
                "summary": r.summary,
                "image_url": r.image_url,
                "created_at": r.created_at.isoformat(),
                "category_name": r.category.name if r.category else "General",
                "read_time_minutes": r.read_time_minutes
            } for r in related
        ]
    }), 200

@articles_bp.route("", methods=["POST"])
@jwt_required()
@admin_required()
def create_article():
    user_id = get_jwt_identity()
    data = request.get_json() or {}

    title = data.get("title", "").strip()
    content = data.get("content", "").strip()
    category_id = data.get("category_id")

    if not title or not content or not category_id:
        return jsonify({"error": "Title, content and category are required"}), 400

    slug_base = re.sub(r'[^a-z0-9]+', '-', title.lower()).strip('-')
    slug = f"{slug_base}-{random.randint(1000, 9999)}"

    words = len(content.split())
    read_time = max(1, math.ceil(words / 200))

    article = Article(
        title=title,
        slug=slug,
        content=content,
        summary=data.get("summary", "").strip() or (content[:160] + "..."),
        image_url=data.get("image_url", "").strip() or "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=1200&q=80",
        category_id=int(category_id),
        author_id=user_id,
        status=data.get("status", "published"),
        is_featured=bool(data.get("is_featured", False)),
        read_time_minutes=read_time
    )

    db.session.add(article)
    db.session.commit()

    return jsonify({"message": "Article created successfully", "article": article.to_dict(user_id)}), 201

@articles_bp.route("/<int:article_id>", methods=["PUT"])
@jwt_required()
@admin_required()
def update_article(article_id):
    article = Article.query.get(article_id)
    if not article:
        return jsonify({"error": "Article not found"}), 404

    data = request.get_json() or {}
    if "title" in data and data["title"].strip():
        article.title = data["title"].strip()
    if "content" in data and data["content"].strip():
        article.content = data["content"].strip()
        words = len(article.content.split())
        article.read_time_minutes = max(1, math.ceil(words / 200))
    if "summary" in data:
        article.summary = data["summary"].strip()
    if "image_url" in data and data["image_url"].strip():
        article.image_url = data["image_url"].strip()
    if "category_id" in data:
        article.category_id = int(data["category_id"])
    if "status" in data:
        article.status = data["status"]
    if "is_featured" in data:
        article.is_featured = bool(data["is_featured"])
    if "is_trending" in data:
        article.is_trending = bool(data["is_trending"])

    db.session.commit()
    return jsonify({"message": "Article updated successfully", "article": article.to_dict()}), 200

@articles_bp.route("/<int:article_id>", methods=["DELETE"])
@jwt_required()
@admin_required()
def delete_article(article_id):
    article = Article.query.get(article_id)
    if not article:
        return jsonify({"error": "Article not found"}), 404

    db.session.delete(article)
    db.session.commit()
    return jsonify({"message": "Article deleted successfully"}), 200

@articles_bp.route("/<int:article_id>/summary", methods=["POST"])
def summarize_article(article_id):
    article = Article.query.get(article_id)
    if not article:
        return jsonify({"error": "Article not found"}), 404

    summary = generate_article_summary(article.title, article.content)
    return jsonify({
        "summary": summary,
        "article_id": article.id
    }), 200
