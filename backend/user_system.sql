CREATE DATABASE IF NOT EXISTS user_system;

USE user_system;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('buyer', 'admin') NOT NULL DEFAULT 'buyer'
);

CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    image VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    quantity INT NOT NULL
);

CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    total_price DECIMAL(10,2),
    status VARCHAR(50) DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Insert product data
INSERT INTO products (name, price, image, description, quantity) VALUES
('Camera', 499.99, 'assets/camera.jpg', 'Capture stunning photos and videos.', 10),
('Headphones', 199.99, 'assets/headphones.jpg', 'Experience immersive sound.', 15),
('Mouse', 49.99, 'assets/mouse.jpg', 'Enhance your computer setup.', 20),
('Laptop', 1299.99, 'assets/laptop.avif', 'Powerful laptop for all your computing needs.', 5),
('Robot Butler', 5000.00, 'assets/robot butler.jpg', 'Smart home assistant.', 3),
('Smartwatch', 249.99, 'assets/smartwatch.jpg', 'Track your health and notifications on the go.', 10),
('Smartphone', 799.99, 'assets/smartphone.jpg', 'Sleek smartphone with advanced features.', 8),
('Laser Pointer', 29.99, 'assets/laser pointer.jfif', 'High-powered laser pointer.', 12),
('Flying Car', 1500000.00, 'assets/flying car.jpg', 'Futuristic transportation solution.', 1),
('Speakers', 299.99, 'assets/speakers.jpeg', 'High-quality sound for your home.', 5),
('Robot Vacuum', 399.99, 'assets/robot vacuum.jpg', 'Automated cleaning solution.', 8),
('Precision Laser Satellite', 750000.00, 'assets/laser sattellite.webp', 'Advanced space-based laser technology.', 2);
