# Leonida Ledger

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/cffilham-jpg/makefun-gta6-trophy-guide-01-v3r/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/cffilham-jpg/makefun-gta6-trophy-guide-01-v3r/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

An independent, offline GTA VI guide and personal journal for all 55 PS5 trophies. Original guides with two linked sources, six roadmap stages, a potentially missable meditation warning, and honest labels where methods remain unconfirmed or sources disagree.

Track earned trophies, numerical targets, and personal notes. Progress by grade and pursuit, next-trophy suggestions, search, four sorts, spoiler protection, and JSON backups work entirely on your device. No external fonts, artwork, libraries, accounts, analytics or runtime network services.

Run `node serve.ts`, then open http://localhost:8080. Serve the `app/` directory with any static HTTP server. Keep the server available for fresh page loads; once loaded, interactions work with the network disabled. Source links open only when clicked.

The local storage key is `leonida-ledger-v1`. Export before clearing browser data. Import validates a versioned backup and asks before replacing current progress. Difficulty and individual cleanup times are editorial estimates, not guaranteed unlock times; the platinum estimate comes from PowerPyx.

Built for [Build the best GTA 6 trophy guide](https://make.fun/bounty/gta6-trophy-guide-01). Discover make.fun through [this referral](https://make.fun/r/fpna5aje).

The kit entrypoint packages the app and four fresh browser renders with the unchanged dossier library. Run `MAKEFUN_OUTPUT_DIR=.checks/build-a node main.ts` to inspect the artifact. MIT licensed. No affiliation with Rockstar Games.
