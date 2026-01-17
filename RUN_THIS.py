from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import datetime

app = Flask(__name__)
CORS(app)

app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///canteen.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)

# МОДЕЛИ

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(100), unique=True)
    password = db.Column(db.String(100))
    role = db.Column(db.String(20))

    surname = db.Column(db.String(50))
    name = db.Column(db.String(50))
    patronymic = db.Column(db.String(50))
    birthdate = db.Column(db.String(20))

    class_number = db.Column(db.Integer)
    class_letter = db.Column(db.String(2))


# МЕНЮ

menu = {
    "Понедельник": {"breakfast": ["Каша", "Омлет"], "lunch": ["Суп", "Пюре"]},
    "Вторник": {"breakfast": ["Блины", "Йогурт"], "lunch": ["Борщ", "Плов"]},
    "Среда": {"breakfast": ["Сырники", "Овсянка"], "lunch": ["Щи", "Макароны"]},
    "Четверг": {"breakfast": ["Оладьи", "Творог"], "lunch": ["Суп куриный", "Гречка"]},
    "Пятница": {"breakfast": ["Круассан", "Яичница"], "lunch": ["Пицца", "Овощной суп"]},
}

orders = []
reviews = []

#  РЕГИСТРАЦИЯ

@app.route("/register", methods=["POST"])
def register():
    data = request.json

    if User.query.filter_by(email=data["email"]).first():
        return jsonify({"error": "Пользователь уже существует"})

    user = User(
        email=data["email"],
        password=data["password"],
        role=data["role"],
        surname=data.get("surname"),
        name=data.get("name"),
        patronymic=data.get("patronymic"),
        birthdate=data.get("birthdate"),
        class_number=data.get("class_number"),
        class_letter=data.get("class_letter")
    )

    db.session.add(user)
    db.session.commit()

    return jsonify({"message": "ok"})


#  ВХОД

@app.route("/login", methods=["POST"])
def login():
    data = request.json
    user = User.query.filter_by(email=data["email"], password=data["password"]).first()

    if not user or user.role != data["role"]:
        return jsonify({"error": "Неверный логин или пароль"})

    return jsonify({"id": user.id, "role": user.role})


#  МЕНЮ

@app.route("/menu/<day>", methods=["GET"])
def get_menu_day(day):
    return jsonify(menu.get(day, {}))


@app.route("/menu/add", methods=["POST"])
def add_dish():
    data = request.json
    menu[data["day"]][data["meal"]].append(data["dish"])
    return jsonify({"message": "Добавлено"})


@app.route("/menu/delete", methods=["POST"])
def delete_dish():
    data = request.json
    if data["dish"] in menu[data["day"]][data["meal"]]:
        menu[data["day"]][data["meal"]].remove(data["dish"])
    return jsonify({"message": "Удалено"})


#  ЗАКАЗЫ

@app.route("/order", methods=["POST"])
def order():
    data = request.json
    data["time"] = datetime.date.today().isoformat()
    data["given"] = False
    orders.append(data)
    return jsonify({"message": "ok"})


#  ОТЗЫВЫ

@app.route("/review", methods=["POST"])
def leave_review():
    data = request.json
    reviews.append(data)
    return jsonify({"message": "ok"})


#  КАБИНЕТ ПОВАРА

@app.route("/cook/orders_today", methods=["GET"])
def cook_orders_today():
    today = datetime.date.today().isoformat()
    todays = [o for o in orders if o["time"] == today]
    return jsonify(todays)


@app.route("/cook/mark_given", methods=["POST"])
def cook_mark_given():
    data = request.json
    index = data["index"]
    if 0 <= index < len(orders):
        orders[index]["given"] = True
    return jsonify({"message": "Отмечено"})


@app.route("/cook/reviews", methods=["GET"])
def cook_reviews():
    return jsonify(reviews)


#  КАБИНЕТ АДМИНИСТРАТОРА

@app.route("/admin/users", methods=["GET"])
def admin_get_users():
    users = User.query.all()
    arr = []
    for u in users:
        arr.append({
            "id": u.id,
            "email": u.email,
            "role": u.role,
            "surname": u.surname,
            "name": u.name,
            "patronymic": u.patronymic,
            "class_number": u.class_number,
            "class_letter": u.class_letter
        })
    return jsonify(arr)


@app.route("/admin/users/delete", methods=["POST"])
def admin_delete_user():
    data = request.json
    user = User.query.get(data["id"])
    if not user:
        return jsonify({"error": "Не найден"})
    db.session.delete(user)
    db.session.commit()
    return jsonify({"message": "Удалено"})


@app.route("/admin/users/role", methods=["POST"])
def admin_change_role():
    data = request.json
    user = User.query.get(data["id"])
    if not user:
        return jsonify({"error": "Не найден"})
    user.role = data["role"]
    db.session.commit()
    return jsonify({"message": "Обновлено"})


@app.route("/admin/stats", methods=["GET"])
def get_stats():
    stats = {
        "total_orders": len(orders),
        "popular_dishes": {},
        "reviews": reviews
    }
    for o in orders:
        dish = o["dish"]
        stats["popular_dishes"][dish] = stats["popular_dishes"].get(dish, 0) + 1
    return jsonify(stats)


@app.route("/admin/clear", methods=["POST"])
def clear_stats():
    orders.clear()
    reviews.clear()
    return jsonify({"message": "Очищено"})


#  ЗАПУСК

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True)
