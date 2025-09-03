# 🏆 Tournament Ranking System (Swiss)

Swiss tournament system for manager evaluation with Top-1/Top-2/Bottom-1 selection.

## 🎯 Features

- **Swiss Tournament System**: Strong players face strong opponents, weak face weak
- **Simple Selection**: Choose Top-1, Top-2, Bottom-1 from groups of 5
- **4 Pre-defined Bosses**: Михайло Рогальський, Олег Гороховський, Олександр Дубілет, Вадім Ковальов
- **CSV Import**: Import managers from CSV with fields (ИНН, ФИО, ІПН лида, Лид для джира, Категория персонала)
- **Real-time Scoring**: Points calculation (+2, +1, 0, -1) with micro-matches
- **Aggregate Results**: Combined rankings with stability metrics
- **Export to CSV**: Download results for further analysis

## 🛠 Tech Stack

- **Next.js 15** with App Router
- **TypeScript** for type safety
- **Vercel Postgres** for database
- **Pure SQL** queries (no ORM)
- **CSS Modules** for styling

## 🚀 Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Add your database URL

# Run development server
npm run dev
```

### Deploy to Vercel

1. Push to GitHub
2. Import to Vercel
3. Connect Vercel Postgres
4. Deploy!

## 📊 Database Schema

- **bosses**: Pre-defined evaluators
- **managers**: Imported from CSV
- **tournaments**: Tournament settings
- **appearances**: Track group memberships
- **picks**: Store Top-1/Top-2/Bottom-1 selections
- **scores**: Calculated points and metrics

## 🎮 How to Use

### Admin: Create Tournament

1. Go to `/admin`
2. Enter tournament title
3. Upload CSV with managers
4. Get tournament ID

### Boss: Evaluate

1. Go to homepage
2. Enter tournament ID
3. Select yourself from boss list
4. Complete 3 rounds of evaluation
5. View results

## 📁 Project Structure

```
ready2build-tournament/
├── app/
│   ├── page.tsx           # Welcome page
│   ├── admin/             # Admin panel
│   ├── play/              # Evaluation interface
│   ├── results/           # Results display
│   └── api/               # API routes
├── lib/
│   ├── db.ts              # Database client
│   ├── swiss.ts           # Swiss pairing logic
│   ├── scoring.ts         # Points calculation
│   └── types.ts           # TypeScript types
└── styles/
    └── globals.css        # Global styles
```

## 🔧 API Endpoints

- `POST /api/seed` - Create tournament and import managers
- `POST /api/groups` - Generate Swiss groups
- `POST /api/pick` - Save evaluation choices
- `GET /api/scores` - Get tournament results
- `GET /api/export` - Export results to CSV

## 📈 Scoring System

- **Top-1**: +2 points, 4 wins
- **Top-2**: +1 point, 3 wins, 1 loss
- **Middle**: 0 points, 1 win, 2 losses
- **Bottom-1**: -1 point, 4 losses

## 🏁 Tiebreakers

1. Strength of Schedule (SOS)
2. Head-to-head results
3. Top-1 count
4. Bottom-1 count (less is better)

---

Built with ❤️ for efficient manager evaluation