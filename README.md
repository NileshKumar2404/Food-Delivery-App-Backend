# 🍔 Food Delivery App – Backend

This is the backend for the **Food Delivery Platform**. It handles authentication, role-based access, restaurant/vendor management, menu items, orders and users.

The backend is built with **Node.js, Express and MongoDB** and is structured for scalability with support for Admin, Vendor and User roles.

---

## 🔹 Features

- User authentication (Login/Register with JWT)
- Role-based access (Admin / Vendor / User)
- Vendor & restaurant management
- Food items / menu management
- Cart & order system
- Secure protected routes
- Cloudinary integration for image uploads (if enabled)
- Clean folder structure with controllers, routes and models

---

## 🧰 Tech Stack

- Node.js
- Express.js
- MongoDB & Mongoose
- JWT Authentication
- Cloudinary (for image upload)
- dotenv, bcrypt, multer

---

## 📂 Project Structure
backend/
│
├── controllers/
├── models/
├── routes/
├── middleware/
├── utils/
├── config/
└── server.js


---

## ⚙️ Environment Variables (.env)

Create a `.env` file in the root directory and add:
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret


---

## 🚀 How to Run Locally

1. Clone the repository

```bash
git clone https://github.com/NileshKumar2404/Food-Delivery-App-Backend.git
cd backend
npm install
npm run dev

Server will run on: http://localhost:5000

🔐 API Roles
Role	Access
Admin	Manage vendors, platform control
Vendor	Add food items, manage orders
User	Browse food, place orders
