# FreelanceHub 🚀

SaaS de gestion pour freelance développeur (SRL Belgique)

## Features

- 🔐 Authentification (Supabase Auth)
- 👥 Gestion clients
- 📁 Gestion projets
- 🧾 Facturation (création, statuts, TVA)
- 💰 Comptabilité (revenus, dépenses, P&L)
- ⏱️ Time tracking
- ⚙️ Paramètres entreprise

## Stack

- **Frontend**: Vue 3 + Vite + Tailwind CSS v4
- **Backend/DB**: Supabase (PostgreSQL + Auth)
- **Deploy**: Vercel

## Setup

```bash
npm install
cp .env.example .env.local
# Remplir les variables Supabase dans .env.local
npm run dev
```

## Supabase Schema

Exécuter `supabase/schema.sql` dans l'éditeur SQL de Supabase.

## Deploy

```bash
npx vercel --prod
```
