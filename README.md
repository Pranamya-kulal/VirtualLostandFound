# Virtual Lost and Found System

The Virtual Lost and Found System is a web application designed to help people report, search for, and manage lost and found items. Users can report found items, view lost items reported by others, and update or delete items as needed.

## Features

- **User Registration:** New users can create an account by registering with a username and password.
- **User Login:** Registered users can log in to their account.
- **Report Found Items:** Users can report found items by providing details like item name, description, and an image.
- **Search Lost Items:** Users can search for items that they have lost by entering relevant keywords.
- **View and Update Reported Found Items:** Users can view all the found items they have reported and update the details of any item.

## Tech Stack

- **Frontend:** EJS (Embedded JavaScript templating)
- **Backend:** Node.js with Express
- **Database:** MySQL
- **Session Management:** Express-session
- **File Uploads:** Multer (for handling image uploads)

## Installation

### Prerequisites

Make sure you have the following installed:

- Node.js (v14 or later)
- MySQL server

### Steps to Install and Run the Project

1. **Clone the repository:**

    ```bash
    git clone <repository_url>
    cd <project_folder>
    ```

2. **Install dependencies:**

    ```bash
    npm install
    ```

3. **Set up the MySQL database:**

    Create a MySQL database called `virtual_lost_and_found_system` and execute the SQL commands to set up the tables. Here is an example SQL schema:

    ```sql
    CREATE DATABASE virtual_lost_and_found_system;

    USE virtual_lost_and_found_system;

    CREATE TABLE Users (
        user_id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) NOT NULL,
        password VARCHAR(100) NOT NULL
    );

    CREATE TABLE Lost_Items (
        item_id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        item_name VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        image_path VARCHAR(255),
        reported_on DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES Users(user_id)
    );

    CREATE TABLE Found_Items (
        item_id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        item_name VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        image_path VARCHAR(255),
        FOREIGN KEY (user_id) REFERENCES Users(user_id)
    );

    CREATE TABLE Reports (
        report_id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        item_id INT,
        report_type ENUM('lost', 'found') NOT NULL,
        report_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES Users(user_id),
        FOREIGN KEY (item_id) REFERENCES Lost_Items(item_id)
    );

    CREATE TABLE Matches (
        match_id INT AUTO_INCREMENT PRIMARY KEY,
        lost_item_id INT,
        found_item_id INT,
        match_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (lost_item_id) REFERENCES Lost_Items(item_id),
        FOREIGN KEY (found_item_id) REFERENCES Found_Items(item_id)
    );

    CREATE TABLE Logs (
        log_id INT AUTO_INCREMENT PRIMARY KEY,
        action VARCHAR(255),
        item_id INT,
        log_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    ```

4. **Configure MySQL connection:**

    In the code, the database connection is set with default MySQL credentials. You may need to modify the connection settings based on your local MySQL setup.

    ```js
    const db = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'virtual_lost_and_found_system',
    });
    ```

5. **Run the application:**

    ```bash
    npm start
    ```

    By default, the app runs on `http://localhost:3000`.

## Usage

### For Users:

1. **Registration:**

    - To register, navigate to the `/register` page, provide your username, email, and password, and click the register button.

2. **Login:**

    - To log in, visit the `/login` page, enter your username and password, and click the login button.
    - After successful login, you'll be redirected to the home page (`/home`).

3. **Report Found Items:**

    - From the home page, you can access the **Report Found Item** page (`/report-found`).
    - Fill in the item details, including the item name, description, and upload an image (optional). Click the "Submit" button to report the found item.

4. **Search Lost Items:**

    - On the **Search Lost Items** page (`/search-lost`), you can enter a search query (item name or description) to find any lost items that others have reported.

5. **View and Update Reported Found Items:**

    - On the **My Reported Found Items** page (`/my-found-items`), you can view all the found items you have reported.
    - You can also update the item name or description from this page.



