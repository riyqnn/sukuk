# RWA Tokenized Sukuk 🕌

This repository contains the codebase for the Tokenized Sukuk platform (RWA - Real World Assets), managed as a monorepo using **pnpm workspaces**.

## 📁 Repository Structure

- `/frontend`: Next.js web application for the investor portal and platform administration.
- `/rwa-sukuk-contracts`: Smart contracts (Solidity/Hardhat) for the Sukuk protocol (ERC-4626 vault, role-based access, lifecycle management).

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [pnpm](https://pnpm.io/installation) (v8+)

### Installation

To install all dependencies for both the frontend and smart contracts simultaneously, run the following command from the root directory:

```bash
pnpm i
```

## 🛠️ Available Scripts (Root)

We have configured root-level scripts in `package.json` so you can manage the entire workspace from the main folder.

| Command | Description |
|---|---|
| `pnpm i` | Install dependencies for all workspaces. |
| `pnpm run dev` | Start the **Next.js frontend** local development server. |
| `pnpm run lint` | Run ESLint for the frontend codebase. |
| `pnpm run test` | Run Hardhat tests for the **smart contracts**. |
| `pnpm run clean` | Safely remove all `node_modules` folders to free up space. |

## 🔗 Workspace Details

### 1. Smart Contracts (`/rwa-sukuk-contracts`)
The core blockchain protocol. It implements an ERC-4626 yield-bearing vault with role-based access control and a linear state machine designed for Sukuk bonds. 
- Uses **Hardhat** for compilation and testing.
- For detailed contract scripts (like deployment and specific tests), you can navigate to the `/rwa-sukuk-contracts` folder or use `pnpm --filter rwa-sukuk-contracts <command>`.

### 2. Frontend (`/frontend`)
The user interface for the Sukuk platform. 
- Built with **Next.js**, **React**, **Tailwind CSS**, and **Wagmi** for Web3 integration.
- Configured to interact directly with the deployed smart contracts.

---
*Built with modern tools and clean monorepo architecture using pnpm.*
