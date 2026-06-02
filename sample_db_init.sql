-- Create table with composite primary key
CREATE TABLE orders (
  order_id INT NOT NULL,
  customer_id INT NOT NULL,
  order_date DATE NOT NULL,
  total_amount DECIMAL(10, 2),
  status VARCHAR(50),
  PRIMARY KEY (order_id, customer_id, order_date)
);

-- Insert 10 rows into orders table
INSERT INTO orders (order_id, customer_id, order_date, total_amount, status) VALUES
(1, 101, '2024-01-15', 250.00, 'completed'),
(2, 102, '2024-01-16', 175.50, 'completed'),
(3, 103, '2024-01-17', 320.75, 'pending'),
(4, 101, '2024-01-18', 89.99, 'completed'),
(5, 104, '2024-01-19', 450.00, 'processing'),
(6, 105, '2024-01-20', 220.25, 'completed'),
(7, 102, '2024-01-21', 145.00, 'pending'),
(8, 103, '2024-01-22', 510.60, 'completed'),
(9, 106, '2024-01-23', 95.50, 'processing'),
(10, 101, '2024-01-24', 380.00, 'completed');

-- Create table with regular primary key
CREATE TABLE products (
  product_id SERIAL PRIMARY KEY,
  product_name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  price DECIMAL(10, 2),
  stock_quantity INT,
  manufacturer VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert 10 rows into products table
INSERT INTO products (product_name, category, price, stock_quantity, manufacturer) VALUES
('Wireless Keyboard', 'Electronics', 49.99, 150, 'TechCorp'),
('USB-C Cable', 'Accessories', 12.99, 500, 'CableMaker'),
('Monitor Stand', 'Furniture', 29.99, 80, 'DeskPro'),
('Mechanical Mouse', 'Electronics', 79.99, 120, 'GamerGear'),
('Desk Lamp', 'Lighting', 35.50, 200, 'BrightLight'),
('Document Scanner', 'Electronics', 199.99, 45, 'ScanTech'),
('Notebook Pack', 'Stationery', 8.99, 300, 'PaperPlus'),
('Wireless Mouse', 'Electronics', 24.99, 350, 'TechCorp'),
('Phone Stand', 'Accessories', 15.50, 220, 'MountMaster'),
('USB Hub', 'Electronics', 39.99, 175, 'ConnectTech');
