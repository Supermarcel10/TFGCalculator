![Maintainability Badge](https://sonarcloud.io/api/project_badges/measure?project=TFGCalculator&metric=sqale_rating)
![Reliability Badge](https://sonarcloud.io/api/project_badges/measure?project=TFGCalculator&metric=reliability_rating)
![Bug Badge](https://sonarcloud.io/api/project_badges/measure?project=TFGCalculator&metric=bugs)
![Tech Debt Badge](https://sonarcloud.io/api/project_badges/measure?project=TFGCalculator&metric=sqale_index)

# TerraFirmaCraft Metal Calculator

## Project is available at:<br/>https://tfc-calculator.devmarcel.net/

## 📖 Table of Contents
- [About](#-about)
- [Support](#-support)
- [Features](#-features)
- [Usage](#%EF%B8%8F-usage)
- [Contributing](#-contributing)
- [Local Setup](#-local-setup)
- [Deployment](#-deployment)
- [License](#-license)

## 🔍 About
The TerraFirmaCraft Metal Calculator is a powerful tool designed to help players calculate metal compositions for the TerraFirmaCraft modpack.
This calculator streamlines the process of determining optimal metal ratios, saving time and resources.

## ⚙️ Support
At present the calculator supports:
- **TerraFirmaGreg 1.20.x** - Up to date with version 0.7.14
- **TerraFirmaCraft 1.20.1** - Up to date with version 3.2.12

**Further support for TerraFirmaGreg 1.12.x and custom import/export is planned for future releases!**

## ✨ Features
- **Inventory Based**: Input what you have available, and the calculator does the rest!
- **Accurate**: Precise calculations based on the latest TerraFirmaCraft metals and minerals
- **Time-saving**: Quickly determine the optimal metal compositions
- **No Waste**: Calculated metal composition creates no leftover metal

## 🛠️ Usage
1. Input desired metal type and quantity
2. Enter your available minerals
3. View the calculated optimal composition

## 👥 Contributing
Contributions to the TerraFirmaCraft Metal Calculator are more than welcome!

Here's how you can help:
1. Fork the repository
2. Open your IDE of choice
3. Commit and push your changes to your forked branch
4. Open a Pull Request targeting `dev` branch
5. Fill out important information

Please read and respect the [code of conduct](?tab=coc-ov-file) and process for submitting pull requests.

## 💻 Local Setup
1. Pull the latest version of `main`
2. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```
3. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result

## 🚀 Deployment
This project is set up for automatic deployment on Vercel.

> [!CAUTION]
> Every push to the `main` branch will trigger a new production deployment.

> [!NOTE]
> Pull requests and `dev` (acts as a staging branch), will trigger a preview deployment.

## 📄 License
This project is licensed under the [GNU GPL v3](/LICENSE) license.
