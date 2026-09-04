# MindMasters Academy

Math and chess training for K-8 competition students, in one HTML file that
runs entirely in the browser.

**Live at [mathmaster1296.github.io/mindmasters](https://mathmaster1296.github.io/mindmasters/).**

I coach North South Foundation math and CheckMates chess, and I built this for
my students. Anyone is welcome to use it.

What's inside:

- 13,585 real contest problems: every AMC 8 from 1999 to 2025, AMC 10 and 12
  from 2000 to 2025, and AIME from 1983 to 2025, with official answers,
  original diagrams, and a link to the AoPS wiki solution on every problem
- 13,531 chess puzzles rated from beginner to grandmaster, plus a full chess
  engine for pass-and-play games
- 191 complete practice tests with official timing and scoring
- Separate math and chess ratings, and a Train button in each arena that
  starts a ten-problem session matched to the player's rating
- Streaks, daily chests, seasons, badges, coins, and an avatar shop
- A rating history chart on the profile, one point for every rated game
- A teacher side: classes, weekly assignments, rosters, per-problem analytics,
  printable class reports, and CSV export
- Multi-account login for shared devices, with salted PBKDF2 password hashing
- Backup codes: one code or file carries an account's whole progress to
  another device
- Keyboard and screen reader support throughout, including the chess board,
  plus profile switches for larger text and for turning animations off

Everything runs client-side. There is no server, no tracking, and no network
requirement after the first load; progress is saved in the browser's local
storage on each device. The site installs as an app (Add to Home Screen on
iPhone and iPad, Install in Chrome), keeps working with no connection, and
offers an update prompt when a new version ships.

## Use it

Open the live site and pick "I am a student" or "I am a teacher". You can also
download `MindMasters_Academy.html` and open the file directly; the whole app
works offline.

## For coaches

Teachers build assignments from the problem banks and hand students a short
code. Students finish the work and send back a submission code, which fills in
the roster, the per-problem analytics, and the printable reports. No accounts
or internet needed. The `docs/` folder has a pitch one-pager, a demo script,
and a coach quick-start guide.

## Build from source

`index.html`, `MindMasters_Academy.html`, and `sw.js` are generated. Edit the
part files, then run:

```
python3 assemble.py
```

## Tests

```
npm i playwright
npx playwright install chromium
node test_v12.js && node test_v12b.js && node test_v13.js && node test_v17.js && node test_v18.js && node test_v20.js && node test_v21.js && node test_v22.js && node test_v23.js
```

Nine Playwright suites cover the quiz engine, ratings, chess puzzles,
retention systems, teacher tools, login, training sessions, backups, the
offline service worker, and accessibility.
