Overview:

This guide provides step-by-step instructions to set up and run the real-time air quality monitoring web application using server.js. The application uses Node.js, Express, p5.js, and D3.js to visualize air quality data collected from multiple sensors in different buildings.

Usage

Prerequisites

• Node.js (v12.0.0 or later) • NPM (Node Package Manager)

Step-by-Step Setup Guide

Mac Setup

Install Homebrew (if not already installed): /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
Install Node.js and NPM: brew install node
Clone the Repository: git clone cd
Install Dependencies: npm install
Set Up Environment Variables (Optional)
Access the Application: Open a web browser and go to http://localhost:3000.
Windows Setup:

Install Node.js and NPM: • Download and install Node.js from the official website (https://nodejs.org/).
Clone the Repository: Open Command Prompt or PowerShell and run: git clone cd
Install Dependencies: npm install
Set Up Environment Variables (Optional)
Run the Server: node server.js
Access the Application: Open a web browser and go to http://localhost:3000.
Libraries to Install:

Make sure the following libraries are installed by running npm install: • express • d3 • paho-mqtt • npm init -y • dotenv

Additional Information:

• Ensure you have network access to the MQTT broker. • The server will automatically subscribe to the air quality topics for real-time data visualization. • Alerts are configured to notify stakeholders when pollution levels exceed predefined thresholds.

Troubleshooting:

• If you encounter issues starting the server, ensure Node.js and NPM are correctly installed. • Verify the .env file is correctly configured with your SendGrid API key and MQTT credentials. • Check network connectivity to the MQTT broker. For further assistance, refer to the project's documentation or contact the project maintainer.

Contributing:

We welcome contributions to the Air Quality Monitoring at CCI project! By contributing, you can help improve the project and make it more useful for everyone. Please follow these guidelines to ensure a smooth contribution process. How to Contribute

Fork the Repository: • Click the "Fork" button at the top right corner of this repository page to create a copy of this repository under your own GitHub account.
Clone the Forked Repository: • Clone your forked repository to your local machine using the following command: bash Copy code git clone https://github.com/yourusername/Air-Quality-Monitoring-CCI.git
Create a Branch: • Create a new branch for your feature or bug fix: css Copy code git checkout -b feature-or-bugfix-name
Make Changes: • Make your changes in the new branch. Ensure that your code is well-documented and follows the project's coding standards.
Commit Changes: • Commit your changes with a clear and concise commit message: sql Copy code git commit -m "Description of the changes made"
Push Changes: • Push your changes to your forked repository: perl Copy code git push origin feature-or-bugfix-name
Create a Pull Request: • Go to the original repository on GitHub and create a pull request. Provide a detailed description of the changes you have made and why they should be merged.
Code of Conduct:

Please note that this project adheres to a Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to [e.nwonye0320231@arts.ac.uk].

Reporting Issues:

If you encounter any issues or have suggestions for improvements, please feel free to open an issue in the GitHub repository. Provide as much detail as possible to help us understand and address the issue promptly.

Feature Requests:

We welcome new feature requests! If you have an idea for a feature, please open an issue and describe your proposed feature in detail. We will discuss the feasibility and implementation plan with you.

Testing:

Before submitting your changes, please ensure that you have tested them thoroughly. Include unit tests or integration tests as appropriate to ensure that your changes do not introduce any new issues.

Documentation:

If your changes involve significant modifications or additions, please update the project documentation accordingly. This helps others understand the new features and how to use them.

Thank you for your contributions! Together, we can make this project better and more impactful.

License:

This project is licensed under the MIT License - see the LICENSE file for details.

Contact:

For any inquiries or feedback, please contact:

• Emmanuel Nwonye

• Email: e.nwonye0320231@arts.ac.uk

• LinkedIn: linkedin.com/in/emmanuel-nwonye-40a024183
