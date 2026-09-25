import re
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.models import db, Category
from app.utils.auth import admin_required

categories_bp = Blueprint("categories", __name__, url_prefix="/api/categories")

@categories_bp.route("", methods=["GET"])
def get_categories():
    categories = Category.query.all()
    return jsonify([c.to_dict() for c in categories]), 200

@categories_bp.route("", methods=["POST"])
@jwt_required()
@admin_required()
def create_category():
    data = request.get_json() or {}
    name = data.get("name", "").strip()
    description = data.get("description", "").strip()

    if not name:
        return jsonify({"error": "Category name is required"}), 400

    slug = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')
    if Category.query.filter((Category.name == name) | (Category.slug == slug)).first():
        return jsonify({"error": "Category already exists"}), 409

    category = Category(name=name, slug=slug, description=description)
    db.session.add(category)
    db.session.commit()

    return jsonify({"message": "Category created", "category": category.to_dict()}), 201

@categories_bp.route("/<int:category_id>", methods=["PUT"])
@jwt_required()
@admin_required()
def update_category(category_id):
    category = Category.query.get(category_id)
    if not category:
        return jsonify({"error": "Category not found"}), 404

    data = request.get_json() or {}
    if "name" in data and data["name"].strip():
        category.name = data["name"].strip()
        category.slug = re.sub(r'[^a-z0-9]+', '-', category.name.lower()).strip('-')
    if "description" in data:
        category.description = data["description"].strip()

    db.session.commit()
    return jsonify({"message": "Category updated", "category": category.to_dict()}), 200

@categories_bp.route("/<int:category_id>", methods=["DELETE"])
@jwt_required()
@admin_required()
def delete_category(category_id):
    category = Category.query.get(category_id)
    if not category:
        return jsonify({"error": "Category not found"}), 404

    if len(category.articles) > 0:
        return jsonify({"error": f"Cannot delete: {len(category.articles)} article(s) are assigned to this category"}), 400

    db.session.delete(category)
    db.session.commit()
    return jsonify({"message": "Category deleted"}), 200
